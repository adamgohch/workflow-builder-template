import { execFileSync } from "node:child_process";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { build } from "esbuild";

await mkdir("dist", { recursive: true });
await build({
  entryPoints: ["app.tsx"],
  outdir: "dist",
  bundle: true,
  minify: true,
  format: "esm",
  target: "es2022",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  legalComments: "linked",
});
execFileSync(
  process.execPath,
  [
    "node_modules/@tailwindcss/cli/dist/index.mjs",
    "-i",
    "style.css",
    "-o",
    "dist/theme.css",
    "--minify",
  ],
  { stdio: "inherit" },
);
await writeFile(
  "dist/index.html",
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Zorel Workflows</title><link rel="stylesheet" href="./app.css"><link rel="stylesheet" href="./theme.css"></head><body><div id="root"></div><script type="module" src="./app.js"></script></body></html>',
);
await copyFile("LICENSE", "dist/LICENSE");
await copyFile("source.json", "dist/source.json");
