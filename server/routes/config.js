const express = require('express');
const router = express.Router();

const { GOAL_LIMIT, TASK_LIMIT } = require('../utils/limits');

// Simple endpoint to expose plan limits to the frontend
router.get('/limits', (req, res) => {
  res.json({ goalLimit: GOAL_LIMIT, taskLimit: TASK_LIMIT });
});

module.exports = router;
