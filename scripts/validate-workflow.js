#!/usr/bin/env node
// Validates that per-story required artifacts exist based on status.
// Non-destructive, exits 1 if violations found.

const fs = require('fs');
const path = require('path');

function exists(p) { try { return fs.existsSync(p); } catch { return false; } }
function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }

const ROOT = process.cwd();
const INDEX = path.join(ROOT, 'docs/pm/user-stories/index.json');

function main() {
  if (!exists(INDEX)) {
    console.log('No story index found; skipping.');
    return;
  }
  const arr = JSON.parse(read(INDEX));
  let violations = 0;

  for (const s of arr) {
    const id = s.id;
    const yml = path.join(ROOT, 'docs/pm/user-stories', `${id}.yaml`);
    if (!exists(yml)) {
      console.error(`❌ ${id}: missing story file ${path.relative(ROOT, yml)}`);
      violations++;
      continue;
    }
    // Minimal checks by status
    const status = s.status || 'draft';
    const domain = s.domain || 'goaltracker';
    const artifacts = {
      mock: path.join(ROOT, 'previews', id),
      specDir: path.join(ROOT, 'docs/specs', domain),
      testPlan: path.join(ROOT, 'docs/qa/test-plans', `${id}.md`),
      archDir: path.join(ROOT, 'docs/architecture', domain),
    };

    function hasAnySpec() {
      if (!exists(artifacts.specDir)) return false;
      const list = fs.readdirSync(artifacts.specDir);
      return list.some(name => name.startsWith(id));
    }
    function hasAnyArch() {
      if (!exists(artifacts.archDir)) return false;
      const list = fs.readdirSync(artifacts.archDir);
      return list.some(name => name.startsWith(id));
    }

    if (['finalized', 'mock_accepted', 'test_plan_ready', 'design_final', 'in_development', 'ready_for_review', 'qa_passed', 'released'].includes(status)) {
      if (!exists(yml)) { violations++; console.error(`❌ ${id}: missing story YAML`); }
    }
    if (['mock_accepted', 'test_plan_ready', 'design_final', 'in_development', 'ready_for_review', 'qa_passed', 'released'].includes(status)) {
      if (!exists(artifacts.mock)) { violations++; console.error(`❌ ${id}: missing mock/prototype at previews/${id}/`); }
    }
    if (['test_plan_ready', 'design_final', 'in_development', 'ready_for_review', 'qa_passed', 'released'].includes(status)) {
      if (!exists(artifacts.testPlan)) { violations++; console.error(`❌ ${id}: missing test plan at docs/qa/test-plans/${id}.md`); }
    }
    if (['design_final', 'in_development', 'ready_for_review', 'qa_passed', 'released'].includes(status)) {
      if (!hasAnyArch()) { violations++; console.error(`❌ ${id}: missing architecture doc in docs/architecture/${domain}/ (prefix ${id})`); }
    }
    if (['in_development', 'ready_for_review', 'qa_passed', 'released'].includes(status)) {
      if (!hasAnySpec()) { violations++; console.error(`❌ ${id}: missing spec in docs/specs/${domain}/ (prefix ${id})`); }
    }
  }

  if (violations > 0) {
    process.exitCode = 1;
  } else {
    console.log('✅ workflow validation passed');
  }
}

main();

