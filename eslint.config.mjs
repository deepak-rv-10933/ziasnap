import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Catalyst function runtime code is CommonJS; ziasnap-api/index.js is generated from src/ by `npm run build:api`.
    "functions/**/*.js",
    "functions/**/node_modules/**",
  ]),
]);

export default eslintConfig;
