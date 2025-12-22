/**
 * server/config/stages.js
 * Configurable stage definitions for flexible user progression
 */

const stageConfigs = {
    1: {
        name: "Dream Collection",
        description: "Initial dream and goal setting",
        
        // Data fields to collect for this stage
        dataFields: [
            'dream',
            'urgency', 
            'beliefLevel'
        ],
        
        // Available pathways for users
        pathways: {
            vision: {
                name: "Vision Questionnaire",
                description: "Unlock advanced insights with detailed vision assessment",
                locked: true,
                unlockConditions: {
                    streakDays: 3,
                    message: "Complete 3 days of check-ins to unlock!"
                },
                reward: {
                    type: "stage_upgrade",
                    upgradeToStage: 2,
                    immediate: true
                }
            },
            continue: {
                name: "Continue Journey", 
                description: "Start with 3 goals for 3 days - All you have to do is show up!",
                locked: false,
                requirements: {
                    goals: 3,
                    tasks: 3,
                    days: 3,
                    feedbackRequired: true
                }
            }
        },
        
        // Completion criteria
        completionCriteria: {
            requiredFields: ['dream', 'urgency', 'beliefLevel'],
            pathwayChosen: true,
            pathwayCompleted: true
        },
        
        // LLM prompts for this stage
        llmPrompts: {
            goalGeneration: `The user has a dream: "{{dream}}"
Their urgency level is: "{{urgency}}"
Their belief level is: {{beliefLevel}}

Generate:
- 3 SMART goals for the next 3 days
- Each goal should have:
  - 3 beginner tasks
  - Estimated time for each task
  - Short feedback message
  - Reference source or link (if helpful)
  - One-line insight (like a coach's takeaway)

Format JSON as:
{
  "goals": [
    {
      "title": "Goal title",
      "tasks": [
        {
          "name": "Task name",
          "duration": 45,
          "feedback": "Motivational message",
          "reference": "https://helpful-link.com",
          "insight": "Coach's insight"
        }
      ]
    }
  ]
}`
        },
        
        // Dashboard messages
        dashboardMessages: {
            welcome: "Hi {{name}}, let's turn your dream into reality! All you have to do is show up.",
            progress: "Great start {{name}}! Day {{streakCount}} of your journey. Keep showing up!",
            completion: "Amazing {{name}}! Ready for Stage 2?",
            visionUnlocked: "🎉 {{name}}, you've unlocked the Vision Questionnaire! Your consistency paid off!",
            visionLocked: "{{name}}, complete {{remainingDays}} more check-ins to unlock the Vision Questionnaire!"
        }
    },
    
    2: {
        name: "Deep Engagement",
        description: "Detailed feedback and behavior tracking",
        
        dataFields: [
            'taskFeedback',
            'excitementLevel',
            'motivationLevel',
            'behaviorPatterns'
        ],
        
        pathways: {
            mentor: {
                name: "Get Mentor",
                description: "Connect with experienced mentor",
                reward: {
                    type: "feature_unlock",
                    features: ["mentorship", "advanced_insights"]
                }
            },
            community: {
                name: "Join Community",
                description: "Connect with like-minded people",
                reward: {
                    type: "feature_unlock", 
                    features: ["community_access", "peer_support"]
                }
            }
        },
        
        completionCriteria: {
            streakDays: 7,
            feedbackSubmissions: 5,
            engagementScore: 80
        },
        
        llmPrompts: {
            behaviorAnalysis: `User feedback data: {{feedbackData}}
Excitement levels: {{excitementLevels}}
Motivation trends: {{motivationTrends}}

Analyze and provide:
- Behavior patterns
- Motivation insights
- Personalized recommendations
- Next stage readiness assessment`,
            
            rewardGeneration: `User has completed {{completedTasks}} tasks this week.
Their excitement level is {{excitementLevel}}/10.
Their motivation level is {{motivationLevel}}/10.

Generate personalized variable rewards (OpenAI will handle this):
- Achievement badges
- Unlock new features
- Personalized encouragement
- Surprise bonuses`
        },
        
        dashboardMessages: {
            welcome: "Welcome to Stage 2, {{name}}! Time to dive deeper.",
            progress: "You're building momentum {{name}}! {{streakCount}} days strong.",
            completion: "Incredible growth {{name}}! Ready for advanced features?"
        }
    },
    
    3: {
        name: "Advanced Mastery",
        description: "Long-term commitment and advanced features",
        
        dataFields: [
            'longTermGoals',
            'communityContributions',
            'mentorshipActivity',
            'masteryMetrics'
        ],
        
        pathways: {
            teacher: {
                name: "Become Teacher",
                description: "Help others achieve their dreams",
                reward: {
                    type: "role_unlock",
                    role: "mentor",
                    privileges: ["mentor_dashboard", "mentee_matching"]
                }
            },
            expert: {
                name: "Domain Expert",
                description: "Specialize in your field",
                reward: {
                    type: "specialization",
                    features: ["expert_content", "advanced_analytics"]
                }
            }
        },
        
        completionCriteria: {
            streakDays: 30,
            goalsAchieved: 10,
            communityScore: 90
        },
        
        llmPrompts: {
            masteryAssessment: `User has been active for {{totalDays}} days.
Goals achieved: {{goalsAchieved}}
Community contributions: {{communityScore}}

Assess mastery level and provide:
- Advanced goal recommendations
- Leadership opportunities
- Specialization suggestions
- Long-term vision refinement`
        },
        
        dashboardMessages: {
            welcome: "Master level achieved {{name}}! Time to lead others.",
            progress: "{{name}}, you're inspiring others with {{communityScore}} community points!",
            completion: "{{name}}, you've mastered the art of goal achievement!"
        }
    }
};

// Helper functions for stage management
const stageHelpers = {
    getStageConfig: (stageNumber) => {
        return stageConfigs[stageNumber] || null;
    },
    
    getRequiredFields: (stageNumber) => {
        const config = stageConfigs[stageNumber];
        return config ? config.dataFields : [];
    },
    
    getPathways: (stageNumber) => {
        const config = stageConfigs[stageNumber];
        return config ? config.pathways : {};
    },
    
    checkCompletion: (stageNumber, userData) => {
        const config = stageConfigs[stageNumber];
        if (!config) return false;
        
        const criteria = config.completionCriteria;
        
        // Check required fields
        if (criteria.requiredFields) {
            for (const field of criteria.requiredFields) {
                if (!userData[field]) return false;
            }
        }
        
        // Check pathway completion
        if (criteria.pathwayChosen && !userData.pathwayChosen) return false;
        if (criteria.pathwayCompleted && !userData.pathwayCompleted) return false;
        
        return true;
    },
    
    getNextStage: (currentStage, pathway = null) => {
        const config = stageConfigs[currentStage];
        if (!config) return currentStage;
        
        // Check if pathway has immediate upgrade
        if (pathway && config.pathways[pathway]?.reward?.immediate) {
            return config.pathways[pathway].reward.upgradeToStage;
        }
        
        // Default progression
        return currentStage + 1;
    }
};

module.exports = {
    stageConfigs,
    stageHelpers
};