import type { CatalystApp } from "zcatalyst-sdk-node/lib/catalyst-app";

export type Row = Record<string, unknown>;

export const TABLES = {
  profile: "UserProfile",
  meals: "Meals",
  mealItems: "MealItems",
  weightLogs: "WeightLogs",
  waterLogs: "WaterLogs",
  favorites: "Favorites",
  foodCorrections: "FoodCorrections",
} as const;

export const USER_TABLES = Object.values(TABLES);

/** ZCQL has no bind parameters — every interpolated string goes through this. */
export function sqlString(value: string): string {
  return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
}

export function assertDateKey(value: string | undefined, name = "date"): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${name} must be a YYYY-MM-DD date`);
  }
  return value;
}

const ZCQL_PAGE = 300;

/**
 * Runs a SELECT and returns flat rows, following ZCQL's 300-row page limit.
 * `sql` must not carry its own LIMIT. Results are unwrapped from ZCQL's
 * `{ TableName: row }` envelope.
 */
export async function selectAll(app: CatalystApp, table: string, sql: string): Promise<Row[]> {
  const rows: Row[] = [];
  for (let offset = 0; ; offset += ZCQL_PAGE) {
    const page = (await app.zcql().executeZCQLQuery(`${sql} LIMIT ${offset}, ${ZCQL_PAGE}`)) as Row[];
    const unwrapped = page.map((entry) => entry[table] as Row).filter(Boolean);
    rows.push(...unwrapped);
    if (unwrapped.length < ZCQL_PAGE) return rows;
  }
}

export async function insertRows(app: CatalystApp, table: string, rows: Row[]): Promise<Row[]> {
  const inserted: Row[] = [];
  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200);
    inserted.push(...((await app.datastore().table(table).insertRows(batch as never)) as unknown as Row[]));
  }
  return inserted;
}

export async function deleteRowIds(app: CatalystApp, table: string, ids: string[]) {
  for (let i = 0; i < ids.length; i += 200) {
    await app.datastore().table(table).deleteRows(ids.slice(i, i + 200));
  }
}

/** Deletes every row a user owns in one table. */
export async function deleteAllForUser(app: CatalystApp, table: string, userId: string) {
  const rows = await selectAll(app, table, `SELECT ROWID FROM ${table} WHERE UserId = ${sqlString(userId)}`);
  await deleteRowIds(
    app,
    table,
    rows.map((row) => String(row.ROWID)),
  );
}

export function num(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

/** Boolean columns come back as the strings "true"/"false". */
export function bool(value: unknown): boolean {
  return value === true || value === "true";
}

export function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || value === "") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/**
 * CREATEDTIME/MODIFIEDTIME are in the project timezone with no offset
 * ("2026-10-07 19:50:12:345"). Converts to an ISO string in UTC.
 */
export function catalystTimeToIso(value: unknown): string {
  if (typeof value !== "string") return new Date().toISOString();
  const match = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?::(\d{1,3}))?/.exec(value);
  if (!match) return new Date().toISOString();
  const offsetMinutes = Number(process.env.PROJECT_TZ_OFFSET_MINUTES ?? "330");
  const asUtc = Date.parse(`${match[1]}T${match[2]}.${(match[3] ?? "0").padStart(3, "0")}Z`);
  return new Date(asUtc - offsetMinutes * 60_000).toISOString();
}
