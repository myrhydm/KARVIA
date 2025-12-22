#!/usr/bin/env node
/*
 Validates that new documents are placed in the correct folders.
 Rules are defined in docs/.doc-rules.json. The script scans for .md and .html
 files outside allowed locations, and suggests target folders based on filename.

 Usage:
   node scripts/validate-docs.js         # validation only (non-zero exit on violations)
   node scripts/validate-docs.js --fix   # attempt to move files automatically
*/

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const RULES_PATH = path.join(ROOT, 'docs/.doc-rules.json');

function readRules() {
  const raw = fs.readFileSync(RULES_PATH, 'utf8');
  return JSON.parse(raw);
}

function walk(dir) {
  const results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of list) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      // Skip common noise
      if (['.git', 'node_modules', '.github', '.idea', '.vscode'].includes(ent.name)) continue;
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function isDocFile(file) {
  return file.endsWith('.md') || file.endsWith('.html');
}

function relative(p) {
  return path.relative(ROOT, p).replace(/\\/g, '/');
}

function suggestTarget(fileRel, rules) {
  const base = path.basename(fileRel).toUpperCase();
  for (const r of rules.routes) {
    if (base.includes(r.match)) return r.target;
  }
  // Fallback: place under goaltracker specs
  return 'docs/specs/goaltracker';
}

function main() {
  const args = process.argv.slice(2);
  const fix = args.includes('--fix');
  const rules = readRules();

  const files = walk(ROOT);
  const violations = [];

  for (const f of files) {
    if (!isDocFile(f)) continue;
    const rel = relative(f);

    // Only enforce at repository root for now (new doc hygiene)
    const isAtRoot = !rel.includes('/');
    if (!isAtRoot) continue;

    // Allow known exceptions at root
    if (rules.rootDocExceptions.includes(rel)) continue;

    // Otherwise, it's a doc at root and must be moved
    const targetDir = suggestTarget(rel, rules);
    violations.push({ file: rel, targetDir });
  }

  if (violations.length === 0) {
    console.log('✅ docs validation passed');
    return;
  }

  console.error('❌ docs validation failed. Found files outside docs/:');
  for (const v of violations) {
    console.error(` - ${v.file}  →  ${v.targetDir}/`);
  }

  if (fix) {
    for (const v of violations) {
      const src = path.join(ROOT, v.file);
      const dstDir = path.join(ROOT, v.targetDir);
      const dst = path.join(dstDir, path.basename(v.file));
      fs.mkdirSync(dstDir, { recursive: true });
      fs.renameSync(src, dst);
      console.log(`🔧 moved: ${v.file} → ${relative(dst)}`);
    }
    console.log('✅ docs auto-fix complete');
    return;
  }

  process.exitCode = 1;
}

main();
