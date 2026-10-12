// Bundles functions/ziasnap-api/src (plus the shared code under src/) into
// functions/ziasnap-api/index.js. Secrets come from the gitignored
// functions/ziasnap-api/.env.local and are inlined at build time, so they
// never live in catalyst-config.json or git. index.js is gitignored for the
// same reason — rebuild it before every deploy.
import { build } from "esbuild";
import { existsSync, readFileSync } from "node:fs";

const FUNCTION_DIR = "functions/ziasnap-api";
const REQUIRED_SECRETS = ["ANALYSIS_TOKEN_SECRET"];

function readEnvFile(path) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => [line.slice(0, line.indexOf("=")).trim(), line.slice(line.indexOf("=") + 1).trim()]),
  );
}

const env = { ...readEnvFile(`${FUNCTION_DIR}/.env.local`), ...process.env };
const missing = REQUIRED_SECRETS.filter((name) => !env[name]);
if (missing.length > 0) {
  console.error(`Missing ${missing.join(", ")} — add it to ${FUNCTION_DIR}/.env.local (see .env.example).`);
  process.exit(1);
}

await build({
  entryPoints: [`${FUNCTION_DIR}/src/index.ts`],
  outfile: `${FUNCTION_DIR}/index.js`,
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  external: ["zcatalyst-sdk-node"],
  tsconfig: `${FUNCTION_DIR}/tsconfig.json`,
  define: Object.fromEntries(REQUIRED_SECRETS.map((name) => [`process.env.${name}`, JSON.stringify(env[name])])),
  logLevel: "info",
});
