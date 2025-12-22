/**
 * server/routes/goals.js
 * Handles routes for creating and managing weekly goals.
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth'); // Auth middleware
const logger = require('../utils/logger');

// Models
const WeeklyGoal = require('../models/WeeklyGoal');
const Task = require('../models/Task');
const { willExceedLimits } = require('../utils/limits');
const { getStartOfWeek, getStartOfNextWeek, isWeekInPast, isWeekCurrentOrFuture } = require('../utils/date');
const journeyService = require('../services/journeyService');

function parseAndValidateWeekOf(value) {
    logger.debug({ value }, 'parseAndValidateWeekOf called');

    if (!value || value === null || value === undefined || value === '') {
        const current = getStartOfWeek();
        logger.debug({ current }, 'No weekOf provided, defaulting to current week');
        return { weekOf: current };
    }
    const date = new Date(value);
    logger.debug({ date, isValid: !isNaN(date) }, 'Parsed weekOf value');

    if (isNaN(date)) {
        logger.warn('weekOf validation failed: invalid date');
        return { error: 'Invalid weekOf date.' };
    }
    const weekOf = getStartOfWeek(date);
    logger.debug({ weekOf }, 'Calculated weekOf');

    const currentWeek = getStartOfWeek();
    logger.debug({ currentWeek }, 'Current week');

    const diffWeeks = Math.abs((weekOf - currentWeek) / (1000 * 60 * 60 * 24 * 7));
    logger.debug({ diffWeeks }, 'Difference in weeks');

    if (diffWeeks > 3) {
        logger.warn('weekOf validation failed: out of range');
        return { error: 'weekOf out of allowed range.' };
    }

    logger.debug({ weekOf }, 'weekOf validation successful');
    return { weekOf };
}

router.get('/', auth, async (req, res) => {
    logger.info('GET /api/weeklyGoals - Request received');
    logger.debug({ query: req.query }, 'Query params');
    logger.debug({ userId: req.user?.id }, 'User ID from auth');

    try {
        const { weekOf, error } = parseAndValidateWeekOf(req.query.weekOf);
        if (error) {
            logger.warn({ error }, 'WeekOf validation error');
            return res.status(400).json({ msg: error });
        }
        logger.info('Searching for goals');
        logger.debug({ weekOf }, 'Week of being searched');

        const nextWeek = getStartOfNextWeek(weekOf);
        const userId = req.user?.id || req.userId;

        logger.debug({ userId, weekOf, nextWeek }, 'Searching goals for user between range');

        const goals = await WeeklyGoal.find({
            user: userId,
            weekOf: { $gte: weekOf, $lt: nextWeek }
        }).populate('tasks');

        logger.info({ count: goals.length }, 'Found goals');

        // If no weekly goals found, check for journey tasks
        if (goals.length === 0) {
            logger.info('No weekly goals found, checking for journey tasks...');
            try {
                const journeyTasks = await journeyService.getCurrentSprintTasks(userId);
                if (journeyTasks.length > 0) {
                    logger.info({ count: journeyTasks.length }, 'Found journey tasks');
                    // Transform journey tasks into goals format
                    const journeyGoal = {
                        _id: 'journey-goal',
                        title: `AI Journey Sprint ${journeyTasks[0].sprintNumber} - Dream Activation`,
                        weekOf: weekOf,
                        tasks: journeyTasks.map(task => ({
                            _id: task._id,
                            name: task.name,
                            estTime: task.estTime,
                            day: task.day,
                            completed: task.completed, // Now uses actual database completion status
                            repeatType: 'none',
                            user: userId,
                            goal: 'journey-goal'
                        })),
                        user: userId,
                        createdAt: new Date(),
                        __v: 0
                    };
                    logger.info('Returning journey goal as weekly goal format');
                    return res.json([journeyGoal]);
                }
            } catch (journeyError) {
                logger.error({ err: journeyError }, 'Error fetching journey tasks');
            }
        }

        logger.debug({ goals }, 'Goals data');
        res.json(goals);
    } catch (err) {
        logger.error({ err }, 'Error in GET goals');
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// NOTE: We have removed the express-validator middleware from the route definition
// to handle validation manually inside the function, which is more robust for this case.
router.post('/', auth, async (req, res) => {
    logger.info('POST /api/weeklyGoals - Request received');
    logger.debug({ body: req.body }, 'Request body');
    logger.debug({ userId: req.user?.id }, 'User ID from auth');

    const body = req.body || {};
    const goalsData = Array.isArray(body) ? body : body.goals;
    const userId = req.user?.id || req.userId;
    const { weekOf, error } = parseAndValidateWeekOf(body.weekOf);
    if (error) {
        return res.status(400).json({ msg: error });
    }
    
    logger.debug({ weekOf }, 'After validation, weekOf');
    
    // Check if week is in the past
    logger.debug('Checking if week is in the past...');
    const isInPast = isWeekInPast(weekOf);
    logger.debug({ isInPast }, 'Is week in past');
    
    if (isInPast) {
        logger.warn('Week is in past, returning error');
        return res.status(400).json({ msg: 'Cannot create goals for past weeks. You can only edit current and future weeks.' });
    }
    
    logger.debug('Week validation passed, continuing with goal creation...');
    
    const nextWeek = getStartOfNextWeek(weekOf);

    // Manual validation
    logger.debug({ goalsData }, 'Goals data');
    logger.debug({ type: typeof goalsData, isArray: Array.isArray(goalsData), length: goalsData?.length }, 'Goals data details');
    
    if (!goalsData || !Array.isArray(goalsData) || goalsData.length === 0) {
        logger.warn('No goals data provided');
        return res.status(400).json({ msg: 'No goals data provided.' });
    }
    
    logger.debug('Goals data validation passed, checking goal titles...');
    
    // Check if any submitted goal has an empty title
    for(const goal of goalsData) {
        logger.debug({ goal }, 'Checking goal');
        if (!goal.title || goal.title.trim() === '') {
            logger.warn('Goal title is required');
            return res.status(400).json({ msg: 'Goal title is required.' });
        }
    }
    
    logger.debug('Goal title validation passed, checking limits...');

    try {
        const existingGoals = await WeeklyGoal.countDocuments({
            user: userId,
            weekOf: { $gte: weekOf, $lt: nextWeek }
        });
        const weekGoals = await WeeklyGoal.find({
            user: userId,
            weekOf: { $gte: weekOf, $lt: nextWeek }
        }, '_id');
        const goalIds = weekGoals.map(g => g._id);
        const existingTasks = goalIds.length > 0 ?
            await Task.countDocuments({ user: userId, goal: { $in: goalIds } }) : 0;

        let newTasksCount = 0;
        for (const g of goalsData) {
            if (g.tasks && Array.isArray(g.tasks)) newTasksCount += g.tasks.length;
        }

        if (willExceedLimits(existingGoals, existingTasks, goalsData.length, newTasksCount)) {
            return res.status(400).json({ msg: 'Weekly goal or task limit exceeded.' });
        }

        // Previous implementation removed any goals for the week before saving.
        // We now simply append new goals so existing data is preserved.

        // Validate each task before starting the transaction
        for (const goalItem of goalsData) {
            if (goalItem.tasks && Array.isArray(goalItem.tasks)) {
                for (const taskItem of goalItem.tasks) {
                    if (!taskItem.name || taskItem.estTime === undefined || !taskItem.day) {
                        return res.status(400).json({ msg: 'Task fields missing.' });
                    }
                    
                    // Post-processing filter: Prevent past-day task creation
                    const today = new Date();
                    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    const todayIndex = today.getDay();
                    const taskDayIndex = dayNames.indexOf(taskItem.day);
                    
                    // Only consider it a past day if it's not Sunday (Sunday can be next week)
                    const isPastDay = taskDayIndex !== -1 && taskDayIndex < todayIndex && taskItem.day !== 'Sun';
                    
                    if (isPastDay) {
                        logger.warn(`⚠️ Task "${taskItem.name}" scheduled for past day ${taskItem.day}, reassigning to today`);
                        taskItem.day = dayNames[todayIndex]; // Reassign to today
                    }
                }
            }
        }
        
        const createdGoals = [];
        const session = await mongoose.startSession();

        await session.withTransaction(async () => {
            // Loop through each valid goal object sent from the client
            for (const goalItem of goalsData) {
                const newGoal = new WeeklyGoal({
                    user: userId,
                    title: goalItem.title,
                    weekOf: weekOf,
                    tasks: []
                });

                const savedGoal = await newGoal.save({ session });
                const taskIds = [];

                if(goalItem.tasks && goalItem.tasks.length > 0) {
                    for (const taskItem of goalItem.tasks) {
                        const newTask = new Task({
                            user: userId,
                            goal: savedGoal._id,
                            name: taskItem.name,
                            estTime: taskItem.estTime,
                            day: taskItem.day,
                            repeatType: taskItem.repeatType || 'none',
                            // Add required fields with defaults
                            rationale: taskItem.rationale || 'Important step towards your goals',
                            skillCategory: taskItem.skillCategory || 'general',
                            difficultyLevel: taskItem.difficultyLevel || 'beginner',
                            adaptiveMetadata: {
                                timeCommitmentStyle: taskItem.adaptiveMetadata?.timeCommitmentStyle || 'focused-blocks',
                                generationMethod: 'user_created',
                                confidenceLevel: 0.8
                            }
                        });
                        const savedTask = await newTask.save({ session });
                        taskIds.push(savedTask._id);
                    }
                }

                savedGoal.tasks = taskIds;
                await savedGoal.save({ session });
                createdGoals.push(savedGoal);
            }
        });
        session.endSession();

        logger.debug({ createdGoals }, 'Batch goals: About to return created goals');
        logger.info({ count: createdGoals.length }, 'Batch goals: Number of goals');
        res.status(201).json(createdGoals);

    } catch (err) {
        logger.error({ err }, 'Error saving weekly goals');
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

router.post('/addGoal', auth, async (req, res) => {
    logger.info('POST /api/weeklyGoals/addGoal - Request received');
    logger.debug({ body: req.body }, 'Request body');
    logger.debug({ userId: req.user?.id }, 'User ID from auth');
    
    const { title, tasks = [] } = req.body;
    const userId = req.user?.id || req.userId;
    
    const { weekOf, error } = parseAndValidateWeekOf(req.body.weekOf);
    if (error) {
        return res.status(400).json({ msg: error });
    }
    
    // Check if week is in the past
    if (isWeekInPast(weekOf)) {
        return res.status(400).json({ msg: 'Cannot create goals for past weeks. You can only edit current and future weeks.' });
    }
    
    const nextWeek = getStartOfNextWeek(weekOf);

    if (!title || title.trim() === '') {
        return res.status(400).json({ msg: 'Goal title is required.' });
    }

    try {
        const existingGoals = await WeeklyGoal.countDocuments({
            user: userId,
            weekOf: { $gte: weekOf, $lt: nextWeek }
        });
        const weekGoals = await WeeklyGoal.find({
            user: userId,
            weekOf: { $gte: weekOf, $lt: nextWeek }
        }, '_id');
        const goalIds = weekGoals.map(g => g._id);
        const existingTasks = goalIds.length > 0 ?
            await Task.countDocuments({ user: userId, goal: { $in: goalIds } }) : 0;

        if (willExceedLimits(existingGoals, existingTasks, 1, tasks.length)) {
            return res.status(400).json({ msg: 'Weekly goal or task limit exceeded.' });
        }

        for (const taskItem of tasks) {
            if (!taskItem.name || taskItem.estTime === undefined || !taskItem.day) {
                return res.status(400).json({ msg: 'Task fields missing.' });
            }
            
            // Post-processing filter: Prevent past-day task creation
            const today = new Date();
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const todayIndex = today.getDay();
            const taskDayIndex = dayNames.indexOf(taskItem.day);
            
            // Only consider it a past day if it's not Sunday (Sunday can be next week)
            const isPastDay = taskDayIndex !== -1 && taskDayIndex < todayIndex && taskItem.day !== 'Sun';
            
            if (isPastDay) {
                logger.warn(`⚠️ Task "${taskItem.name}" scheduled for past day ${taskItem.day}, reassigning to today`);
                taskItem.day = dayNames[todayIndex]; // Reassign to today
            }
        }

        const session = await mongoose.startSession();
        let populated;
        await session.withTransaction(async () => {
            const goal = new WeeklyGoal({ user: userId, title, weekOf, tasks: [] });
            await goal.save({ session });

            const taskIds = [];
            for (const taskItem of tasks) {
                const newTask = new Task({
                    user: userId,
                    goal: goal._id,
                    name: taskItem.name,
                    estTime: taskItem.estTime,
                    day: taskItem.day,
                    repeatType: taskItem.repeatType || 'none',
                    // Add required fields with defaults
                    rationale: taskItem.rationale || 'Important step towards your goals',
                    skillCategory: taskItem.skillCategory || 'general',
                    difficultyLevel: taskItem.difficultyLevel || 'beginner',
                    adaptiveMetadata: {
                        timeCommitmentStyle: taskItem.adaptiveMetadata?.timeCommitmentStyle || 'focused-blocks',
                        generationMethod: 'user_created',
                        confidenceLevel: 0.8
                    }
                });
                const savedTask = await newTask.save({ session });
                taskIds.push(savedTask._id);
            }

            goal.tasks = taskIds;
            await goal.save({ session });

            // Populate within the session
            populated = await WeeklyGoal.findById(goal._id).populate('tasks').session(session);
        });
        session.endSession();

        logger.debug({ populated }, 'addGoal: About to return populated goal');
        
        if (!populated) {
            logger.error('addGoal: populated goal is null!');
            return res.status(500).json({ msg: 'Failed to create goal', error: 'Goal not found after creation' });
        }
        
        res.status(201).json(populated);
    } catch (err) {
        logger.error({ err }, 'Error in addGoal');
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// @route   GET api/weeklyGoals/:id
// @desc    Get a single goal by id
// @access  Private
router.get('/:id', auth, async (req, res) => {
    logger.info('GET /api/weeklyGoals/:id - Request received');
    logger.debug({ id: req.params.id }, 'Request ID');
    logger.debug({ userId: req.user?.id }, 'User ID from auth');
    
    try {
        const userId = req.user?.id || req.userId;
        const goal = await WeeklyGoal.findOne({ _id: req.params.id, user: userId }).populate('tasks');
        
        logger.info({ found: !!goal }, 'Found goal');
        if (goal) {
            logger.debug({ goal }, 'Goal data');
        }
        
        if (!goal) {
            return res.status(404).json({ msg: 'Goal not found' });
        }
        res.json(goal);
    } catch (err) {
        logger.error({ err }, 'Error in GET goal by ID');
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Goal not found' });
        }
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// @route   PUT api/weeklyGoals/:id
// @desc    Update a goal's title and replace its tasks
// @access  Private
router.put('/:id', auth, async (req, res) => {
    logger.info('PUT /api/weeklyGoals/:id - Request received');
    logger.debug({ id: req.params.id }, 'Request ID');
    logger.debug({ body: req.body }, 'Request body');
    logger.debug({ userId: req.user?.id }, 'User ID from auth');
    
    const { title, tasks = [] } = req.body;

    if (!title || title.trim() === '') {
        return res.status(400).json({ msg: 'Goal title is required.' });
    }

    if (!Array.isArray(tasks)) {
        return res.status(400).json({ msg: 'Tasks must be an array.' });
    }

    try {
        const userId = req.user?.id || req.userId;
        const goal = await WeeklyGoal.findOne({ _id: req.params.id, user: userId });
        if (!goal) {
            return res.status(404).json({ msg: 'Goal not found' });
        }
        
        // Check if the goal's week is in the past
        if (isWeekInPast(goal.weekOf)) {
            return res.status(400).json({ msg: 'Cannot edit goals for past weeks. You can only edit current and future weeks.' });
        }

        // Gather counts for limit checking
        const weekStart = goal.weekOf;
        const nextWeek = getStartOfNextWeek(weekStart);
        const weekGoals = await WeeklyGoal.find({
            user: userId,
            weekOf: { $gte: weekStart, $lt: nextWeek }
        }, '_id');
        const goalIds = weekGoals.map(g => g._id);
        const existingTasks = goalIds.length > 0 ?
            await Task.countDocuments({ user: userId, goal: { $in: goalIds } }) : 0;
        const currentGoalTasks = await Task.countDocuments({ user: userId, goal: goal._id });

        if (willExceedLimits(
            weekGoals.length,
            existingTasks - currentGoalTasks,
            0,
            tasks.length
        )) {
            return res.status(400).json({ msg: 'Weekly goal or task limit exceeded.' });
        }

        // Validate each task before starting the transaction
        for (const t of tasks) {
            if (!t.name || t.estTime === undefined || !t.day) {
                return res.status(400).json({ msg: 'Task fields missing.' });
            }
            
            // Post-processing filter: Prevent past-day task creation
            const today = new Date();
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const todayIndex = today.getDay();
            const taskDayIndex = dayNames.indexOf(t.day);
            
            // Only consider it a past day if it's not Sunday (Sunday can be next week)
            const isPastDay = taskDayIndex !== -1 && taskDayIndex < todayIndex && t.day !== 'Sun';
            
            if (isPastDay) {
                logger.warn(`⚠️ Task "${t.name}" scheduled for past day ${t.day}, reassigning to today`);
                t.day = dayNames[todayIndex]; // Reassign to today
            }
        }

        const session = await mongoose.startSession();
        let populated;
        await session.withTransaction(async () => {
            // Fetch existing tasks for this goal
            const existing = await Task.find({ user: userId, goal: goal._id }).session(session);
            const existingMap = new Map(existing.map(t => [String(t._id), t]));

            const finalIds = [];

            for (const t of tasks) {
                if (t._id && existingMap.has(String(t._id))) {
                    const task = existingMap.get(String(t._id));
                    task.name = t.name;
                    task.estTime = t.estTime;
                    task.day = t.day;
                    task.repeatType = t.repeatType || 'none';
                    if (typeof t.completed !== 'undefined') {
                        task.completed = t.completed;
                    }
                    await task.save({ session });
                    finalIds.push(task._id);
                    existingMap.delete(String(t._id));
                } else {
                    const newTask = new Task({
                        user: userId,
                        goal: goal._id,
                        name: t.name,
                        estTime: t.estTime,
                        day: t.day,
                        repeatType: t.repeatType || 'none',
                        completed: !!t.completed
                    });
                    const savedTask = await newTask.save({ session });
                    finalIds.push(savedTask._id);
                }
            }

            // Remove tasks that were not included
            const toDelete = Array.from(existingMap.keys());
            if (toDelete.length > 0) {
                await Task.deleteMany({ _id: { $in: toDelete }, user: userId }, { session });
            }

            goal.title = title;
            goal.tasks = finalIds;
            await goal.save({ session });

            populated = await WeeklyGoal.findById(goal._id).populate('tasks');
        });
        session.endSession();

        res.json(populated);
    } catch (err) {
        logger.error({ err }, 'PUT /api/weeklyGoals/:id error');
        res.status(500).json({ msg: 'Server error while updating goal', error: err.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    logger.info('DELETE /api/weeklyGoals/:id - Request received');
    logger.debug({ id: req.params.id }, 'Request ID');
    logger.debug({ userId: req.user?.id }, 'User ID from auth');
    
    try {
        const userId = req.user?.id || req.userId;
        const goal = await WeeklyGoal.findOne({ _id: req.params.id, user: userId });
        if (!goal) {
            return res.status(404).json({ msg: 'Goal not found' });
        }
        
        // Check if the goal's week is in the past
        if (isWeekInPast(goal.weekOf)) {
            return res.status(400).json({ msg: 'Cannot delete goals for past weeks. You can only edit current and future weeks.' });
        }

        await Task.deleteMany({ goal: goal._id, user: userId });
        await goal.deleteOne();

        logger.info('Goal deleted successfully');
        res.json({ msg: 'Goal deleted' });
    } catch (err) {
        logger.error({ err }, 'Error deleting goal');
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

module.exports = router;
