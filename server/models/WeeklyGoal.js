/**
 * server/models/WeeklyGoal.js
 * Mongoose schema for the WeeklyGoal collection.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the WeeklyGoal Schema
const WeeklyGoalSchema = new Schema({
    // Reference to the user who owns this goal
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Goal title is required.'],
        trim: true
    },
    // Represents the start of the week (e.g., the date of the Monday)
    // This allows for easy querying of all goals for a specific week.
    weekOf: {
        type: Date,
        required: true
    },
    // An array of references to the tasks that make up this goal
    tasks: [{
        type: Schema.Types.ObjectId,
        ref: 'Task'
    }],
    // Journey-specific fields for tracking week-based progress
    journeyWeek: {
        type: Number,
        min: 1,
        max: 52
    },
    journeyTheme: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        default: 'general'
    },
    description: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create and export the WeeklyGoal model
module.exports = mongoose.model('WeeklyGoal', WeeklyGoalSchema);
