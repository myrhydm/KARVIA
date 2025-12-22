const GOAL_LIMIT = 50;
const TASK_LIMIT = 200;

function willExceedLimits(existingGoals, existingTasks, newGoals, newTasks) {
  return (existingGoals + newGoals > GOAL_LIMIT) ||
         (existingTasks + newTasks > TASK_LIMIT);
}

module.exports = {
  GOAL_LIMIT,
  TASK_LIMIT,
  willExceedLimits
};
