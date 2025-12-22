// Configuration for default journey tasks created for new users
// Modify this file to change the task template without touching route logic

module.exports = [
    // Week 1 - Foundation Building
    { name: "Define your vision and core values", day: "Mon", estTime: 30, isReflection: false },
    { name: "Set 3 specific goals for this journey", day: "Tue", estTime: 25, isReflection: false },
    { name: "Create action plan for first goal", day: "Wed", estTime: 35, isReflection: false },
    { name: "Reflect on progress and insights", day: "Thu", estTime: 20, isReflection: true },

    // Week 2 - Momentum Building
    { name: "Take action on goal #1", day: "Fri", estTime: 45, isReflection: false },
    { name: "Identify potential obstacles", day: "Sat", estTime: 30, isReflection: false },
    { name: "Develop contingency plans", day: "Sun", estTime: 25, isReflection: false },
    { name: "Weekly reflection and adjustment", day: "Mon", estTime: 20, isReflection: true },

    // Week 3 - Growth and Refinement
    { name: "Expand action on goal #2", day: "Tue", estTime: 40, isReflection: false },
    { name: "Track and measure progress", day: "Wed", estTime: 30, isReflection: false },
    { name: "Seek feedback and support", day: "Thu", estTime: 35, isReflection: false },
    { name: "Mid-journey reflection", day: "Fri", estTime: 25, isReflection: true },

    // Final week continuation...
    { name: "Focus on goal #3 implementation", day: "Sat", estTime: 45, isReflection: false },
    { name: "Build accountability systems", day: "Sun", estTime: 30, isReflection: false },
    { name: "Document lessons learned", day: "Mon", estTime: 25, isReflection: false },
    { name: "Plan next steps", day: "Tue", estTime: 30, isReflection: false },

    { name: "Celebrate achievements", day: "Wed", estTime: 20, isReflection: false },
    { name: "Create maintenance plan", day: "Thu", estTime: 35, isReflection: false },
    { name: "Set future vision", day: "Fri", estTime: 30, isReflection: false },
    { name: "Share journey insights", day: "Sat", estTime: 25, isReflection: false },

    { name: "Final journey reflection and completion", day: "Sun", estTime: 40, isReflection: true }
];
