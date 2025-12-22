/**
 * server/models/TaskChatLog.js
 * Mongoose schema for logging task chat interactions.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TaskChatLogSchema = new Schema({
    task: {
        type: Schema.Types.ObjectId,
        ref: 'Task',
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    aiResponse: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('TaskChatLog', TaskChatLogSchema);
