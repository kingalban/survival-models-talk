#!/usr/bin/env node
// Checks that every slide's embedded annotation comment still matches the
// bracketed build instruction for that slide id in script.md. See script.md
// and CLAUDE.md for the convention this enforces.

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const normalize = (s) => s.trim().replace(/\s+/g, " ");

function parseScript(text) {
  const sections = new Map();
  const headingRe = /^##\s+(\S+)\s*$/gm;
  const matches = [...text.matchAll(headingRe)];
  matches.forEach((m, i) => {
    const id = m[1];
    const start = m.index + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const body = text.slice(start, end);
    // Greedy first-[ to last-] per section: the annotation may itself
    // contain single brackets (e.g. an interval like [0,6]), so a lazy
    // per-bracket match would truncate at the first inner "]".
    const first = body.indexOf("[");
    const last = body.lastIndexOf("]");
    const annotation = first !== -1 && last > first ? body.slice(first + 1, last) : "";
    sections.set(id, normalize(annotation));
  });
  return sections;
}

function parseSlideFile(text) {
  const idMatch = text.match(/id:\s*["'`]([\w-]+)["'`]/);
  const annotationMatch = text.match(
    /--- SCRIPT ANNOTATION \(auto-synced from script\.md\) ---([\s\S]*?)--- END SCRIPT ANNOTATION ---/
  );
  if (!idMatch) return null;
  const annotation = annotationMatch
    ? normalize(
        annotationMatch[1]
          .split("\n")
          .map((line) => line.replace(/^\s*\/\/\s?/, ""))
          .join(" ")
      )
    : null;
  return { id: idMatch[1], annotation };
}

const scriptSections = parseScript(readFileSync(path.join(root, "script.md"), "utf8"));

const slidesDir = path.join(root, "slides");
const slideFiles = readdirSync(slidesDir).filter((f) => f.endsWith(".js"));
const implemented = new Map();
for (const file of slideFiles) {
  const parsed = parseSlideFile(readFileSync(path.join(slidesDir, file), "utf8"));
  if (parsed) implemented.set(parsed.id, { ...parsed, file });
}

let failures = 0;

for (const [id, scriptText] of scriptSections) {
  const slide = implemented.get(id);
  if (!slide) {
    console.log(`~ ${id}: not yet implemented`);
    continue;
  }
  if (!slide.annotation) {
    console.log(`✗ ${id} (${slide.file}): no embedded SCRIPT ANNOTATION block`);
    failures++;
    continue;
  }
  if (slide.annotation !== scriptText) {
    console.log(`✗ ${id} (${slide.file}): embedded annotation does not match script.md`);
    console.log(`    script.md: ${scriptText}`);
    console.log(`    slide:     ${slide.annotation}`);
    failures++;
    continue;
  }
  console.log(`✓ ${id} (${slide.file})`);
}

for (const id of implemented.keys()) {
  if (!scriptSections.has(id)) {
    console.log(`? ${id} (${implemented.get(id).file}): no matching "## ${id}" section in script.md`);
    failures++;
  }
}

if (failures > 0) {
  console.log(`\n${failures} issue(s) found.`);
  process.exit(1);
} else {
  console.log("\nAll slides in sync.");
}
