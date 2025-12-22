Node-based ad hoc tests (non-Jest)

This folder contains Node scripts and JSON fixtures that are useful for
manual or ad hoc validation of the agent workflows (ARIA, SYNTH, CODEX,
VALIDAR) and end-to-end orchestration.

How to run
- Run individual files with Node, e.g.:
  - `node qa/automation/node-tests/test-aria-enhanced.js`
  - `node qa/automation/node-tests/test-direct-e2e.js`

Notes
- These tests are intentionally separate from Jest tests under `test/`.
- They were moved here from the repository root for cleanliness.

