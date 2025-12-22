/**
 * Journey Model
 * Represents a user's 21-day transformation journey
 */

const mongoose = require('mongoose');

const SprintSchema = new mongoose.Schema({
    sprintNumber: {
        type: Number,
        required: true,
        min: 1,
        max: 6
    },
    name: {
        type: String,
        required: true
    },
    week: {
        type: Number,
        required: true,
        min: 1,
        max: 3
    },
    days: [{
        type: Number,
        required: true
    }],
    status: {
        type: String,
        enum: ['locked', 'unlocked', 'active', 'completed'],
        default: 'locked'
    },
    startDate: {
        type: Date
    },
    completedDate: {
        type: Date
    },
    goals: [{
        goalId: {
            type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and string for journey goals
            ref: 'WeeklyGoal'
        },
        day: Number,
        title: String,
        tasks: [{
            taskId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Task'
            },
            title: String,
            completed: {
                type: Boolean,
                default: false
            },
            completedAt: Date
        }],
        completed: {
            type: Boolean,
            default: false
        },
        completedAt: Date
    }],
    completionRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }
});

const JourneySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    dreamText: {
        type: String,
        required: true,
        maxlength: 1000
    },
    confidence: {
        type: Number,
        required: true,
        min: 1,
        max: 100
    },
    timeHorizon: {
        type: Number,
        required: true,
        min: 1,
        max: 60
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'paused', 'abandoned'],
        default: 'active'
    },
    currentWeek: {
        type: Number,
        default: 1,
        min: 1,
        max: 3
    },
    currentSprint: {
        type: Number,
        default: 1,
        min: 1,
        max: 6
    },
    currentDay: {
        type: Number,
        default: 1,
        min: 1,
        max: 21
    },
    sprints: [SprintSchema],
    reflectionDays: [{
        day: {
            type: Number,
            required: true
        },
        week: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ['locked', 'unlocked', 'completed'],
            default: 'locked'
        },
        reflectionData: {
            insights: [String],
            challenges: [String],
            achievements: [String],
            nextWeekFocus: String
        },
        completedAt: Date
    }],
    overallProgress: {
        totalDays: {
            type: Number,
            default: 21
        },
        completedDays: {
            type: Number,
            default: 0
        },
        completionPercentage: {
            type: Number,
            default: 0
        },
        totalTasks: {
            type: Number,
            default: 0
        },
        completedTasks: {
            type: Number,
            default: 0
        }
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    completedDate: {
        type: Date
    },
    lastActiveDate: {
        type: Date,
        default: Date.now
    },
    fullJourneyPlan: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for better performance
JourneySchema.index({ user: 1, status: 1 });
JourneySchema.index({ user: 1, currentSprint: 1 });
JourneySchema.index({ status: 1, currentWeek: 1 });

// Methods
JourneySchema.methods.getCurrentSprint = function() {
    return this.sprints.find(sprint => sprint.sprintNumber === this.currentSprint);
};

JourneySchema.methods.updateProgress = function() {
    let completedTasks = 0;
    let totalTasks = 0;
    let completedDays = 0;

    this.sprints.forEach(sprint => {
        sprint.goals.forEach(goal => {
            totalTasks += goal.tasks.length;
            completedTasks += goal.tasks.filter(task => task.completed).length;
            if (goal.completed) {
                completedDays++;
            }
        });
    });

    // Add reflection days
    completedDays += this.reflectionDays.filter(day => day.status === 'completed').length;

    this.overallProgress.totalTasks = totalTasks;
    this.overallProgress.completedTasks = completedTasks;
    this.overallProgress.completedDays = completedDays;
    this.overallProgress.completionPercentage = Math.round((completedDays / 21) * 100);
};

JourneySchema.methods.canProgressToNextSprint = function() {
    const currentSprint = this.getCurrentSprint();
    if (!currentSprint) return false;
    
    return currentSprint.goals.every(goal => goal.completed);
};

JourneySchema.methods.progressToNextSprint = function() {
    if (!this.canProgressToNextSprint()) {
        throw new Error('Current sprint not completed');
    }

    const currentSprint = this.getCurrentSprint();
    currentSprint.status = 'completed';
    currentSprint.completedDate = new Date();

    // Check if we need to unlock reflection day
    if (this.currentSprint % 2 === 0) { // End of week (sprint 2, 4, 6)
        const week = Math.ceil(this.currentSprint / 2);
        const reflectionDay = this.reflectionDays.find(day => day.week === week);
        if (reflectionDay) {
            reflectionDay.status = 'unlocked';
        }
    }

    // Progress to next sprint
    if (this.currentSprint < 6) {
        this.currentSprint++;
        // Don't recalculate currentDay - let it progress naturally
        // Users should advance day-by-day, not jump to calculated days
        this.currentWeek = Math.ceil(this.currentSprint / 2);
        
        // Unlock next sprint
        const nextSprint = this.sprints.find(sprint => sprint.sprintNumber === this.currentSprint);
        if (nextSprint) {
            nextSprint.status = 'unlocked';
        }
    } else {
        // Journey completed
        this.status = 'completed';
        this.completedDate = new Date();
        this.currentDay = 21;
    }

    this.updateProgress();
    this.lastActiveDate = new Date();
};

/**
 * Get current 3-day window for user display
 * Returns only the next 3 days of tasks to avoid overwhelming the user
 */
JourneySchema.methods.getCurrentWindow = function() {
    const today = new Date();
    const todayDayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][today.getDay()];
    
    // For now, return current sprint tasks (can be enhanced to show sliding 3-day window)
    const currentSprint = this.getCurrentSprint();
    if (!currentSprint) return [];
    
    return currentSprint.goals;
};

module.exports = mongoose.model('Journey', JourneySchema);