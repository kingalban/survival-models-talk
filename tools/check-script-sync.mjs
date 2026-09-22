#!/usr/bin/env node
// Checks that every implemented slide/layer's embedded annotation comment
// still matches the [...] instruction tagged for it in script.md. See
// script.md's header comment and CLAUDE.md for the convention this
// enforces. `##` headings in script.md are purely for human navigation and
// are ignored here — the unit of truth is the {slide:id} / {layer:id on:base}
// tag immediately preceding a [...] block.

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const normalize = (s) => s.trim().replace(/\s+/g, " ");

// Given text and the index of a '[', return the index of its matching ']',
// accounting for nested brackets (e.g. an interval like [0,6] inside the
// annotation prose itself).
function matchingBracket(text, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    if (text[i] === "[") depth++;
    else if (text[i] === "]") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function parseScriptTags(text) {
  const tagRe = /\{(slide):([\w-]+)\}|\{(layer):([\w-]+)\s+on:([\w-]+)\}/g;
  const entries = new Map();
  let m;
  while ((m = tagRe.exec(text))) {
    const kind = m[1] || m[3];
    const id = m[2] || m[4];
    const baseId = m[5] || null;
    const afterTag = text.slice(m.index + m[0].length);
    const relOpen = afterTag.indexOf("[");
    if (relOpen === -1) continue;
    const openIndex = m.index + m[0].length + relOpen;
    const closeIndex = matchingBracket(text, openIndex);
    if (closeIndex === -1) continue;
    const annotation = normalize(text.slice(openIndex + 1, closeIndex));
    entries.set(id, { kind, baseId, annotation });
  }
  return entries;
}

function parseSlideFileAnnotations(text) {
  const blockRe =
    /--- SCRIPT ANNOTATION \[(slide|layer):([\w-]+)(?:\s+on:([\w-]+))?\] ---([\s\S]*?)--- END SCRIPT ANNOTATION ---/g;
  const entries = new Map();
  let m;
  while ((m = blockRe.exec(text))) {
    const [, kind, id, baseId, body] = m;
    const annotation = normalize(
      body
        .split("\n")
        .map((line) => line.replace(/^\s*\/\/\s?/, ""))
        .join(" ")
    );
    entries.set(id, { kind, baseId: baseId || null, annotation });
  }
  return entries;
}

const scriptTags = parseScriptTags(readFileSync(path.join(root, "script.md"), "utf8"));

const slidesDir = path.join(root, "slides");
const slideFiles = readdirSync(slidesDir).filter((f) => f.endsWith(".js"));
const implemented = new Map();
for (const file of slideFiles) {
  const parsed = parseSlideFileAnnotations(readFileSync(path.join(slidesDir, file), "utf8"));
  for (const [id, entry] of parsed) {
    implemented.set(id, { ...entry, file });
  }
}

let failures = 0;

for (const [id, scriptEntry] of scriptTags) {
  const isPlaceholder = scriptEntry.annotation.startsWith("PLACEHOLDER");
  const slide = implemented.get(id);
  const label = scriptEntry.kind === "layer" ? `${id} (layer on ${scriptEntry.baseId})` : id;

  if (!slide) {
    console.log(`~ ${label}: ${isPlaceholder ? "placeholder, not yet designed" : "not yet implemented"}`);
    continue;
  }
  if (slide.kind !== scriptEntry.kind || slide.baseId !== scriptEntry.baseId) {
    console.log(`✗ ${label} (${slide.file}): tag kind/base mismatch with script.md`);
    failures++;
    continue;
  }
  if (slide.annotation !== scriptEntry.annotation) {
    console.log(`✗ ${label} (${slide.file}): embedded annotation does not match script.md`);
    console.log(`    script.md: ${scriptEntry.annotation}`);
    console.log(`    slide:     ${slide.annotation}`);
    failures++;
    continue;
  }
  console.log(`✓ ${label} (${slide.file})`);
}

for (const [id, entry] of implemented) {
  if (!scriptTags.has(id)) {
    console.log(`? ${id} (${entry.file}): no matching {${entry.kind}:${id}...} tag in script.md`);
    failures++;
  }
}

if (failures > 0) {
  console.log(`\n${failures} issue(s) found.`);
  process.exit(1);
} else {
  console.log("\nAll slides in sync.");
}
