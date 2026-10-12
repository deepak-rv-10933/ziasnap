"use client";

import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { ThemeToggle } from "@/components/settings/ThemeToggle";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Info } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DeleteAccountDialog } from "@/features/privacy/DeleteAccountDialog";
import { downloadFile, mealsToCsv } from "@/features/privacy/export";
import { api } from "@/lib/api/client";
import { useAccountQuery } from "@/hooks/useProfile";
import { isRealBackend, signOut } from "@/lib/catalyst/web-sdk";
import { toDateKey } from "@/lib/utils/date";

function ComingSoonAction({ label, description }: { label: string; description: string }) {
  return (
    <button
      type="button"
      onClick={() => toast.info(`${label} isn't available in this preview yet.`)}
      className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-card px-4 py-3.5 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-turmeric/50"
    >
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

function ActionRow({
  label,
  description,
  onClick,
  disabled,
  tone = "default",
}: {
  label: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-card px-4 py-3.5 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-turmeric/50 disabled:opacity-60"
    >
      <div>
        <p className={tone === "danger" ? "text-sm font-semibold text-destructive" : "text-sm font-semibold text-foreground"}>
          {label}
        </p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

export default function SettingsPage() {
  const accountQuery = useAccountQuery();
  const [exporting, setExporting] = useState<"json" | "csv" | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleExport = async (format: "json" | "csv") => {
    setExporting(format);
    try {
      const data = await api.exportData();
      const stamp = toDateKey(new Date());
      if (format === "json") {
        downloadFile(`ziasnap-export-${stamp}.json`, JSON.stringify(data, null, 2), "application/json");
      } else {
        downloadFile(`ziasnap-meals-${stamp}.csv`, mealsToCsv(data), "text/csv;charset=utf-8");
      }
      toast.success(`Exported ${data.meals.length} meal${data.meals.length === 1 ? "" : "s"}`);
    } catch {
      toast.error("Export failed — please try again.");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-6">
      <PageHeader title="Settings" backHref="/profile" />

      {isRealBackend ? (
        <section>
          <SectionHeader title="Account" />
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3.5">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Signed in with Zoho</p>
              <p className="truncate text-xs text-muted-foreground">{accountQuery.data?.email ?? "…"}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        </section>
      ) : null}

      <section>
        <SectionHeader title="Appearance" />
        <ThemeToggle />
      </section>

      <section>
        <SectionHeader title="Notifications" />
        <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card px-4 py-3.5">
          <div>
            <Label htmlFor="meal-reminders" className="text-sm font-semibold text-foreground">
              Meal reminders
            </Label>
            <p className="text-xs text-muted-foreground">Nudge me if I haven&apos;t logged a meal in a while</p>
          </div>
          <Switch id="meal-reminders" onCheckedChange={() => toast.info("Notifications aren't available in this preview yet.")} />
        </div>
      </section>

      <section>
        <SectionHeader title="Privacy & data" />
        <div className="flex flex-col gap-2.5">
          <ActionRow
            label={exporting === "json" ? "Preparing export…" : "Export everything (JSON)"}
            description="Your profile, targets, every meal and item, and your corrections"
            onClick={() => handleExport("json")}
            disabled={exporting !== null}
          />
          <ActionRow
            label={exporting === "csv" ? "Preparing export…" : "Export meal log (CSV)"}
            description="One row per food item — opens in any spreadsheet"
            onClick={() => handleExport("csv")}
            disabled={exporting !== null}
          />
          <ActionRow
            label={isRealBackend ? "Delete my account" : "Reset demo data"}
            description={
              isRealBackend
                ? "Permanently remove your profile, meals and sign-in"
                : "Restore the preview's sample data"
            }
            onClick={() => setDeleteOpen(true)}
            tone="danger"
          />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Meal photos are sent to Zia for analysis and never stored. Your nutrition data is only used to power your
          own tracking and recommendations. Exports
          mark each item as an <span className="font-medium text-foreground">AI estimate</span> (Zia&apos;s guess,
          reviewed but unchanged) or as <span className="font-medium text-foreground">edited/added by you</span>.
        </p>
        <DeleteAccountDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
      </section>

      <section>
        <SectionHeader title="Help" />
        <div className="flex flex-col gap-2.5">
          <ComingSoonAction label="Help center" description="Guides on capturing meals and reading estimates" />
          <ComingSoonAction label="Contact support" description="Get help with an issue" />
        </div>
      </section>

      <section>
        <SectionHeader title="About" />
        <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3.5">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            ZiaSnap&apos;s nutrition estimates are generated by AI from a photo and are not a substitute for a lab
            measurement or medical advice. Portions, ingredients and oil/ghee quantities are approximated —
            always review and correct an estimate before relying on it, and speak with a healthcare
            professional for anything related to a medical condition.
          </p>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">ZiaSnap · Version 0.2.0{isRealBackend ? "" : " (Preview)"}</p>
      </section>
    </div>
  );
}
