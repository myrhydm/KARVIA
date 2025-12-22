/**
 * server/routes/taskChat.js
 * API routes for task interaction with LLM - personalized guidance
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const User = require('../models/User');
const llamaService = require('../services/llamaService');
const TaskChatLog = require('../models/TaskChatLog');

/**
 * POST /api/task-chat/:taskId/interact
 * Chat with LLM about a specific task with full user context
 */
router.post('/:taskId/interact', auth, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { message, conversationHistory = [] } = req.body;
        const userId = req.user?.id || req.userId;

        if (!message || !message.trim()) {
            return res.status(400).json({ msg: 'Message is required' });
        }

        // Get task with user context
        const task = await Task.findOne({ _id: taskId, user: userId })
            .populate('user', 'archetype progressStage weeklyGoals')
            .populate('goal', 'title description');

        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        // Get user details for context
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Get user's recent task patterns for context
        const recentTasks = await Task.find({
            user: userId,
            completed: true,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        }).limit(5);

        // Get a brief summary of other tasks
        const otherTasks = await Task.find({
            user: userId,
            _id: { $ne: taskId }
        }).sort({ createdAt: -1 }).limit(3);

        const taskListSummary = otherTasks && otherTasks.length > 0
            ? `${otherTasks.length} other task${otherTasks.length > 1 ? 's' : ''}: ${otherTasks.map(t => t.name).join(', ')}`
            : '';

        const overallObjective = (task.goal && task.goal.title) || user.overallObjective || 'Not set';

        // Build rich context for LLM
        const userContext = buildUserContext(user, overallObjective, recentTasks, taskListSummary);
        
        // Create personalized prompt
        const systemPrompt = `You are an AI coach helping a user with their personal development tasks. 
        
        User Context:
        ${userContext}
        
        Current Task Details:
        - Name: ${task.name}
        - Estimated Time: ${task.estTime} minutes
        - Day: ${task.day}
        - Priority: ${task.priority}
        - Completion Status: ${task.completed ? 'Completed' : 'Not completed'}
        - User Familiarity: ${task.userFamiliarity || 'Not rated'}
        - Rationale: ${task.rationale || 'Not provided'}
        
        ${task.metricsImpacted && task.metricsImpacted.length > 0 ? `
        Metrics This Task Impacts:
        ${task.metricsImpacted.map(m => `- ${m.metric}: ${m.expectedImpact} impact - ${m.reasoning}`).join('\n')}
        ` : ''}
        
        Guidelines:
        1. Provide personalized advice based on the user's archetype and progress stage
        2. Consider their familiarity level with similar tasks
        3. Suggest specific strategies that align with their archetype
        4. Be encouraging and actionable
        5. Reference their recent task patterns when relevant
        6. Keep responses conversational and supportive
        
        Remember: This is a coaching conversation, not just information delivery.`;

        // Build conversation messages
        const messages = [
            { role: 'system', content: systemPrompt }
        ];

        // Add conversation history
        conversationHistory.forEach(msg => {
            messages.push({
                role: msg.role,
                content: msg.content
            });
        });

        // Add current user message
        messages.push({
            role: 'user',
            content: message
        });

        // Get AI response from configured LLM provider
        const result = await llamaService.generateChatResponse(messages);

        if (!result.success) {
            throw new Error(result.error || 'LLM chat failed');
        }

        const aiResponse = result.response;

        // Log interaction for learning
        await logTaskInteraction(taskId, userId, message, aiResponse);

        res.json({
            response: aiResponse,
            taskContext: {
                name: task.name,
                priority: task.priority,
                userFamiliarity: task.userFamiliarity,
                completed: task.completed
            },
            suggestions: generateTaskSuggestions(task, user)
        });

    } catch (error) {
        console.error('Task chat error:', error);
        res.status(500).json({ msg: 'Error processing chat request', error: error.message });
    }
});

/**
 * GET /api/task-chat/:taskId/context
 * Get task context for chat initialization
 */
router.get('/:taskId/context', auth, async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user?.id || req.userId;

        const task = await Task.findOne({ _id: taskId, user: userId })
            .populate('goal', 'title')
            .select('name estTime day priority completed userFamiliarity rationale metricsImpacted');

        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        const user = await User.findById(userId).select('archetype progressStage');

        // Generate context-aware greeting
        const greeting = generateContextualGreeting(task, user);

        res.json({
            task: {
                name: task.name,
                estTime: task.estTime,
                day: task.day,
                priority: task.priority,
                completed: task.completed,
                userFamiliarity: task.userFamiliarity,
                rationale: task.rationale,
                metricsImpacted: task.metricsImpacted
            },
            user: {
                archetype: user.archetype,
                progressStage: user.progressStage
            },
            greeting,
            suggestedQuestions: generateSuggestedQuestions(task, user)
        });

    } catch (error) {
        console.error('Task context error:', error);
        res.status(500).json({ msg: 'Error getting task context' });
    }
});

/**
 * Helper Functions
 */

function buildUserContext(user, overallObjective, recentTasks, taskListSummary) {
    const status = user.userStage || 'Unknown';
    const progress = typeof user.stageProgress === 'number' ? user.stageProgress : 0;
    const archetype = user.archetype || 'Not set';
    const name = user.firstName || user.name || 'User';

    let context = `- Overall Objective: ${overallObjective}`;
    context += `\n- Current Status: ${status}`;
    context += `\n- Progress: ${progress}%`;
    context += `\n- Archetype: ${archetype}`;

    if (taskListSummary) {
        context += `\n- Task Summary: ${taskListSummary}`;
    }

    context += `\n- Name: ${name}`;

    if (user.progressStage) {
        context += `\n- Progress Stage: ${user.progressStage}`;
    }

    if (recentTasks.length > 0) {
        context += `\n\nRecent Task Patterns (Last 7 days):`;
        recentTasks.forEach(t => {
            context += `\n- ${t.name}: ${t.completed ? 'Completed' : 'Not completed'}, ${t.timeSpent || 0}min spent`;
        });
    }

    return context;
}

function generateContextualGreeting(task, user) {
    const archetype = user.archetype || 'achiever';
    const greetings = {
        'career': `Hi! Ready to tackle "${task.name}"? Let's strategize how this fits into your career development goals.`,
        'creative': `Hey there! I see you're working on "${task.name}". Let's explore how to approach this creatively.`,
        'emotional': `Hello! "${task.name}" - that sounds meaningful. Let's talk about how this connects to your personal growth.`,
        'self-discovery': `Hi! Working on "${task.name}"? Perfect timing to reflect on what this means for your journey.`
    };

    return greetings[archetype] || `Hi! Ready to discuss "${task.name}"? I'm here to help you succeed with this task.`;
}

function generateSuggestedQuestions(task, user) {
    const base = [
        "How should I approach this task?",
        "I'm feeling stuck. Any suggestions?",
        "What if I don't have enough time for this?",
        "Can you break this down into smaller steps?"
    ];

    // Add context-specific questions
    if (!task.completed && task.userFamiliarity === 'no_idea') {
        base.unshift("I'm not familiar with this type of task. Where should I start?");
    }

    if (task.priority === 'high') {
        base.push("This is high priority. How do I make sure I get it done?");
    }

    return base.slice(0, 4); // Return top 4 questions
}

function generateTaskSuggestions(task, user) {
    const suggestions = [];

    // Familiarity-based suggestions
    if (task.userFamiliarity === 'no_idea') {
        suggestions.push("Consider breaking this task into smaller research steps");
        suggestions.push("Look for online resources or tutorials first");
    } else if (task.userFamiliarity === 'know_this') {
        suggestions.push("You know this - trust your expertise and dive in");
        suggestions.push("Consider how to do this more efficiently than before");
    }

    // Priority-based suggestions
    if (task.priority === 'high') {
        suggestions.push("Schedule this for your peak energy hours");
        suggestions.push("Remove distractions before starting");
    }

    // Time-based suggestions
    if (task.estTime > 60) {
        suggestions.push("Consider using the Pomodoro technique (25-minute blocks)");
        suggestions.push("Plan short breaks to maintain focus");
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
}

async function logTaskInteraction(taskId, userId, userMessage, aiResponse) {
    try {
        await TaskChatLog.create({
            task: taskId,
            user: userId,
            message: userMessage,
            aiResponse
        });
    } catch (err) {
        console.error('Error logging task interaction:', err);
    }
}

module.exports = router;
