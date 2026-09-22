#!/usr/bin/env node
// Bundles the whole deck into one self-contained HTML file (dist/deck.html)
// that runs from file:// with no server and no network.
//
// Two things stand between the source tree and a single file:
//   - the slides are ES modules that import each other by relative path,
//   - a few of them import d3 from a CDN URL.
// esbuild flattens the module graph; the plugin below redirects the CDN
// specifier at the local `d3` package, so nothing is fetched at runtime.
// index.html's <link> and <script src> are then replaced by inline tags.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import * as esbuild from "esbuild";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(root, "dist");

// Any https import of d3 (with or without jsdelivr's /+esm suffix) resolves
// to the version in node_modules, so the bundle is closed over its deps.
const cdnToLocal = {
  name: "cdn-to-local",
  setup(build) {
    build.onResolve({ filter: /^https?:\/\// }, (args) => {
      const pkg = args.path.match(/npm\/(d3)(@[^/]+)?/)?.[1];
      if (!pkg) throw new Error(`No local stand-in for remote import: ${args.path}`);
      return build.resolve(pkg, { kind: "import-statement", resolveDir: root });
    });
  },
};

const { outputFiles } = await esbuild.build({
  entryPoints: [path.join(root, "js/main.js")],
  bundle: true,
  format: "iife",
  target: "es2020",
  minify: true,
  legalComments: "none",
  plugins: [cdnToLocal],
  write: false,
  outfile: path.join(out, "deck.js"),
});
const js = outputFiles[0].text;
const css = readFileSync(path.join(root, "css/deck.css"), "utf8");

const html = readFileSync(path.join(root, "index.html"), "utf8")
  // Replacer functions, not strings: `$&` and friends in minified CSS/JS
  // would otherwise be read as substitution patterns.
  .replace(
    /\s*<link rel="stylesheet" href="css\/deck\.css" \/>/,
    () => `\n  <style>\n${css}\n  </style>`,
  )
  .replace(
    /\s*<script type="module" src="js\/main\.js"><\/script>/,
    // </script> inside the bundle would close this tag early.
    () => `\n  <script>\n${js.replace(/<\/script>/gi, "<\\/script>")}\n  </script>`,
  );

if (html.includes("css/deck.css") || html.includes("js/main.js")) {
  throw new Error(`index.html no longer matches the tags this script inlines`);
}

mkdirSync(out, { recursive: true });
writeFileSync(path.join(out, "deck.html"), html);
console.log(`dist/deck.html — ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);
