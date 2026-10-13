// Post-build step for the static export in out/:
// 1. Mark it as a plain static Slate site (no server function).
// 2. Stamp the service worker with this build's full asset list, so after the
//    first visit every page and script is served from the phone. The Slate
//    host takes ~1s per file, so this is what makes repeat visits instant.
// `npm run build:web` runs `next build` and then this.
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";

const OUT = "out";
if (!existsSync(`${OUT}/index.html`)) {
  console.error("out/ is missing: run `next build` first.");
  process.exit(1);
}

mkdirSync(`${OUT}/.catalyst`, { recursive: true });
writeFileSync(`${OUT}/.catalyst/slate-config.toml`, ['framework = "static"', 'deployment_name = "default"', ""].join("\n"));

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const files = walk(OUT)
  .map((path) => "/" + relative(OUT, path).split("\\").join("/"))
  .filter((url) => !url.startsWith("/.catalyst/") && url !== "/sw.js" && url !== "/_redirects")
  // Scripts, styles, fonts, icons, pages, and each page's navigation payload (index.txt).
  .filter((url) => /\.(js|css|woff2|png|svg|ico|webmanifest)$/.test(url) || /\/index\.(html|txt)$/.test(url) || url === "/offline.html");
// Pages are cached by their URL ("/home/"), not their file path.
const precache = files.map((url) => (url.endsWith("/index.html") ? url.slice(0, -"index.html".length) : url));

const sw = readFileSync(`${OUT}/sw.js`, "utf8");
const version = createHash("sha256").update(precache.join("\n")).digest("hex").slice(0, 10);
writeFileSync(
  `${OUT}/sw.js`,
  sw.replace('const VERSION = "ziasnap-v1";', `const VERSION = "ziasnap-${version}";`).replace("const BUILD_ASSETS = [];", `const BUILD_ASSETS = ${JSON.stringify(precache)};`),
);
console.log(`out/ ready: static Slate config + ${precache.length} assets pre-cached (sw ${version})`);
