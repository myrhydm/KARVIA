#!/usr/bin/env node
/*
Moves root-level ad hoc test files (test-*.js|json) into qa/automation/node-tests/.
Defaults to dry-run. Use --apply to perform the move.
*/
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const TARGET_DIR = path.join(ROOT, 'qa/automation/node-tests');
const apply = process.argv.includes('--apply');

function listRootTests() {
  const names = fs.readdirSync(ROOT);
  return names.filter(n => /^test-.*\.(js|json)$/i.test(n));
}

function ensureTarget() {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

function main() {
  const files = listRootTests();
  if (files.length === 0) {
    console.log('No root-level test-* files found.');
    return;
  }

  console.log(`${apply ? 'Moving' : 'Would move'} ${files.length} file(s):`);
  for (const f of files) {
    const src = path.join(ROOT, f);
    const dst = path.join(TARGET_DIR, f);
    console.log(` - ${f} -> ${path.relative(ROOT, dst)}`);
    if (apply) {
      ensureTarget();
      fs.renameSync(src, dst);
    }
  }

  if (!apply) {
    console.log('\nDry run complete. Re-run with --apply to perform moves.');
  } else {
    console.log('✅ Move complete.');
  }
}

main();

