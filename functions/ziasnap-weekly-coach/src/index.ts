import catalyst from "zcatalyst-sdk-node";
import type { CatalystApp } from "zcatalyst-sdk-node/lib/catalyst-app";
import type { AccountInfo, WeeklyRecap } from "@/types";
import { CatalystNutritionRepository } from "../../ziasnap-api/src/repository";
import { TABLES, selectAll, sqlString } from "../../ziasnap-api/src/db";
import { buildWeeklyContext, weekEnding } from "../../ziasnap-api/src/coach-context";
import { pollCoach, startCoach } from "../../ziasnap-api/src/coach";

/**
 * Sunday job: writes Zia's weekly recap for everyone who logged a meal this
 * week, stores it (shown on Insights), and emails it when RECAP_FROM_EMAIL is
 * a verified Catalyst sender. Runs as a Job function (15 minute budget), so
 * it stops starting new users with a safety margin left.
 */

interface JobContext {
  closeWithSuccess(): void;
  closeWithFailure(): void;
  getMaxExecutionTimeMs?(): string;
}

const IST_OFFSET_MS = 330 * 60_000;
const POLL_MS = 3000;
const PER_USER_TIMEOUT_MS = 90_000;
const BATCH = 4;

function istToday(): string {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

async function waitForRecap(app: CatalystApp, executionId: string, week: { start: string; end: string }) {
  const deadline = Date.now() + PER_USER_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    const state = await pollCoach(app, "weekly", executionId, week);
    if (state.state === "done") return state.result;
    if (state.state === "failed") throw new Error(state.error);
  }
  throw new Error("Recap timed out");
}

function recapEmail(recap: WeeklyRecap, firstName: string): string {
  const escape = (text: string) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  return `<div style="font-family:Arial,sans-serif;max-width:520px;color:#211c16">
<p style="color:#6b3a2e;font-weight:bold;margin:0 0 4px">Your ZiaSnap weekly recap</p>
<h2 style="margin:0 0 12px">${escape(recap.headline)}</h2>
<p>Hi ${escape(firstName)},</p>
<p>${escape(recap.summary)}</p>
<p style="background:#e8eedf;padding:10px 12px;border-radius:10px"><b>Win:</b> ${escape(recap.win)}</p>
<p style="background:#f5e6c4;padding:10px 12px;border-radius:10px"><b>This week, try:</b> ${escape(recap.oneChange)}</p>
<p style="color:#7a6e62;font-size:12px">Estimates come from AI and your logs, not medical advice.</p></div>`;
}

async function recapFor(app: CatalystApp, userId: string, today: string): Promise<"sent" | "stored" | "skipped"> {
  const user = await app.userManagement().getUserDetails(userId);
  const account: AccountInfo = {
    userId,
    email: user.email_id ?? "",
    firstName: user.first_name ?? "",
    lastName: user.last_name ?? "",
  };
  const repo = new CatalystNutritionRepository(app, account);
  const { week, context } = await buildWeeklyContext(repo, userId, today);
  if (context.daysLogged === 0) return "skipped";

  const recap = await waitForRecap(app, await startCoach(app, "weekly", context), week);
  await repo.saveWeeklyRecap(userId, recap);

  const from = process.env.RECAP_FROM_EMAIL;
  if (!from || !account.email) return "stored";
  await app.email().sendMail({
    from_email: from,
    to_email: [account.email],
    subject: `Your ZiaSnap week: ${recap.headline}`,
    content: recapEmail(recap, account.firstName || "there"),
    html_mode: true,
  });
  return "sent";
}

module.exports = async (_jobRequest: unknown, context: JobContext) => {
  const started = Date.now();
  const budgetMs = Number(context.getMaxExecutionTimeMs?.() ?? 900_000) - 120_000;
  try {
    const app = catalyst.initialize(context as unknown as Record<string, unknown>, { scope: "admin" });
    const today = istToday();
    const week = weekEnding(today);
    const rows = await selectAll(
      app,
      TABLES.meals,
      `SELECT DISTINCT UserId FROM ${TABLES.meals} WHERE DateKey >= ${sqlString(week.start)} AND DateKey <= ${sqlString(week.end)}`,
    );
    const userIds = rows.map((row) => String(row.UserId));
    const tally = { sent: 0, stored: 0, skipped: 0, failed: 0, deferred: 0 };

    for (let i = 0; i < userIds.length; i += BATCH) {
      if (Date.now() - started > budgetMs) {
        tally.deferred = userIds.length - i;
        break;
      }
      const results = await Promise.allSettled(userIds.slice(i, i + BATCH).map((userId) => recapFor(app, userId, today)));
      results.forEach((result) => {
        if (result.status === "fulfilled") tally[result.value] += 1;
        else {
          tally.failed += 1;
          console.error("Recap failed", result.reason);
        }
      });
    }
    console.log(`Weekly recap for week ending ${today}:`, JSON.stringify({ users: userIds.length, ...tally }));
    context.closeWithSuccess();
  } catch (error) {
    console.error("Weekly coach job failed", error);
    context.closeWithFailure();
  }
};
