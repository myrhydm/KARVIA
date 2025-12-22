/**
 * Journey System Configuration
 * Defines the 7-stage recursive dream-driven personal growth system
 */

const JOURNEY_STAGES = {
    STAGE_1: {
        id: 1,
        name: "3-Day Activation",
        duration: 3,
        purpose: "Establish momentum and set emotional ownership of dream",
        goals: {
            count: 3,
            tasks_per_goal: 3,
            total_tasks: 9
        },
        requirements: {
            completion_threshold: 0.7, // 70% task completion
            min_reflections: 2,
            streak_requirement: false
        },
        unlocks: {
            next_stage: 2,
            rewards: ["momentum_badge", "dream_anchor_quote", "progress_visual"]
        },
        failure_action: "regenerate_goals",
        nudge_frequency: "daily",
        adaptation_rules: {
            low_belief_low_completion: "easier_goals",
            high_belief_high_completion: "stretch_goals",
            missed_multiple: "micro_goals"
        }
    },
    
    STAGE_2: {
        id: 2,
        name: "5-Day Vision Builder",
        duration: 5,
        purpose: "Move from dreaming to defining the identity shift",
        goals: {
            count: 5,
            tasks_per_goal: 3,
            total_tasks: 15
        },
        requirements: {
            completion_threshold: 0.75,
            min_reflections: 3,
            vision_questionnaire: true
        },
        unlocks: {
            next_stage: 3,
            rewards: ["vision_builder_badge", "dream_map_visual", "identity_quote_generator"],
            features: ["vision_questionnaire", "identity_tracker"]
        },
        failure_action: "refine_vision",
        nudge_frequency: "daily",
        adaptation_rules: {
            unclear_vision: "vision_clarity_tasks",
            strong_vision: "implementation_tasks"
        }
    },
    
    STAGE_3: {
        id: 3,
        name: "7-Day Momentum Challenge",
        duration: 7,
        purpose: "Reinforce identity, test persistence",
        goals: {
            count: 6,
            tasks_per_goal: 3,
            total_tasks: 18
        },
        requirements: {
            completion_threshold: 0.8,
            min_reflections: 5,
            why_story: true,
            stretch_tasks: 2
        },
        unlocks: {
            next_stage: 4,
            rewards: ["consistency_badge", "momentum_graph", "persistence_story"],
            features: ["why_story_writer", "challenge_tracker"]
        },
        failure_action: "persistence_coaching",
        nudge_frequency: "twice_daily",
        adaptation_rules: {
            low_persistence: "smaller_challenges",
            high_momentum: "bigger_challenges"
        }
    },
    
    STAGE_4: {
        id: 4,
        name: "12-Day Discipline Builder",
        duration: 12,
        purpose: "Build structured discipline and routine",
        goals: {
            count: 8,
            tasks_per_goal: 4,
            total_tasks: 32
        },
        requirements: {
            completion_threshold: 0.82,
            min_reflections: 8,
            custom_schedule: true,
            ai_feedback_sessions: 3
        },
        unlocks: {
            next_stage: 5,
            rewards: ["discipline_master_badge", "routine_optimizer", "coach_avatar"],
            features: ["schedule_builder", "ai_coach_feedback", "habit_tracker"]
        },
        failure_action: "schedule_optimization",
        nudge_frequency: "context_aware",
        adaptation_rules: {
            schedule_conflicts: "flexible_timing",
            high_discipline: "advanced_challenges"
        }
    },
    
    STAGE_5: {
        id: 5,
        name: "15-Day Resilience Training",
        duration: 15,
        purpose: "Build resilience and overcome obstacles",
        goals: {
            count: 10,
            tasks_per_goal: 4,
            total_tasks: 40
        },
        requirements: {
            completion_threshold: 0.85,
            min_reflections: 10,
            obstacle_stories: 2,
            comeback_plan: true
        },
        unlocks: {
            next_stage: 6,
            rewards: ["resilience_warrior_badge", "against_odds_story", "obstacle_crusher"],
            features: ["obstacle_tracker", "resilience_stories", "comeback_planner"]
        },
        failure_action: "resilience_boost",
        nudge_frequency: "supportive_daily",
        adaptation_rules: {
            major_setback: "recovery_focus",
            high_resilience: "stretch_obstacles"
        }
    },
    
    STAGE_6: {
        id: 6,
        name: "18-Day Transformation",
        duration: 18,
        purpose: "Deep transformation and identity shift",
        goals: {
            count: 12,
            tasks_per_goal: 5,
            total_tasks: 60
        },
        requirements: {
            completion_threshold: 0.85,
            min_reflections: 15,
            transformation_evidence: 3,
            community_reflection: true
        },
        unlocks: {
            next_stage: 7,
            rewards: ["transformation_master_badge", "identity_shift_visual", "transformation_story"],
            features: ["transformation_tracker", "evidence_collector", "community_sharing"]
        },
        failure_action: "transformation_support",
        nudge_frequency: "transformation_focused",
        adaptation_rules: {
            slow_transformation: "identity_reinforcement",
            rapid_transformation: "integration_focus"
        }
    },
    
    STAGE_7: {
        id: 7,
        name: "21-Day Identity Integration",
        duration: 21,
        purpose: "Final identity integration and mastery",
        goals: {
            count: 15,
            tasks_per_goal: 5,
            total_tasks: 75
        },
        requirements: {
            completion_threshold: 0.9,
            min_reflections: 20,
            identity_story: true,
            dream_declaration: true,
            mastery_evidence: 5
        },
        unlocks: {
            graduation: true,
            rewards: ["dream_master_badge", "identity_integration_certificate", "shareable_declaration"],
            features: ["mastery_tracker", "declaration_creator", "graduation_ceremony"]
        },
        failure_action: "mastery_coaching",
        nudge_frequency: "mastery_focused",
        adaptation_rules: {
            integration_struggles: "identity_support",
            ready_for_mastery: "advanced_integration"
        }
    }
};

const HABIT_LOOP_SYSTEM = {
    trigger: {
        types: ["time_based", "context_based", "belief_based", "progress_based"],
        timing: {
            morning: "identity_anchor",
            afternoon: "progress_check",
            evening: "reflection_prompt"
        },
        contexts: {
            high_belief: "challenge_prompt",
            low_belief: "encouragement_prompt",
            streak_break: "recovery_prompt",
            milestone: "celebration_prompt"
        }
    },
    
    action: {
        task_types: ["skill_building", "identity_reinforcing", "progress_making", "reflection"],
        difficulty_adaptation: {
            success_streak: "increase_difficulty",
            failure_streak: "decrease_difficulty",
            mixed_results: "maintain_difficulty"
        },
        time_ranges: {
            micro: "2-5 minutes",
            short: "10-15 minutes",
            medium: "20-30 minutes",
            long: "45-60 minutes"
        }
    },
    
    reward: {
        variable_rewards: {
            immediate: ["badges", "quotes", "visual_progress"],
            delayed: ["stories", "insights", "unlocks"],
            social: ["community_recognition", "sharing_opportunities"],
            intrinsic: ["identity_reinforcement", "mastery_evidence"]
        },
        reward_schedule: {
            continuous: "new_user_first_week",
            variable_ratio: "established_users",
            fixed_interval: "weekly_milestones",
            variable_interval: "surprise_rewards"
        }
    },
    
    investment: {
        types: ["time_invested", "emotional_investment", "identity_investment", "social_investment"],
        tracking: {
            streak_days: "consecutive_completion",
            total_hours: "cumulative_effort",
            reflection_depth: "emotional_investment",
            sharing_frequency: "social_investment"
        }
    }
};

const ADAPTATION_ENGINE = {
    belief_patterns: {
        increasing: {
            threshold: 0.1, // 10% increase over week
            actions: ["increase_challenge", "add_stretch_goals", "share_success_story"]
        },
        decreasing: {
            threshold: -0.1, // 10% decrease over week
            actions: ["provide_support", "simplify_goals", "share_encouragement"]
        },
        stable_high: {
            range: [0.8, 1.0],
            actions: ["maintain_challenge", "focus_on_mastery", "leadership_opportunities"]
        },
        stable_low: {
            range: [0.0, 0.4],
            actions: ["rebuild_confidence", "micro_wins", "success_reminders"]
        }
    },
    
    completion_patterns: {
        high_performer: {
            threshold: 0.9,
            adaptations: ["advanced_challenges", "mentorship_opportunities", "innovation_tasks"]
        },
        consistent_performer: {
            threshold: 0.7,
            adaptations: ["gradual_increase", "skill_building", "consistency_rewards"]
        },
        struggling_performer: {
            threshold: 0.5,
            adaptations: ["simplified_tasks", "support_resources", "smaller_goals"]
        },
        inconsistent_performer: {
            pattern: "variable",
            adaptations: ["routine_building", "accountability_systems", "barrier_identification"]
        }
    },
    
    engagement_patterns: {
        high_engagement: {
            indicators: ["daily_logins", "long_sessions", "deep_reflections"],
            adaptations: ["rich_content", "advanced_features", "community_roles"]
        },
        medium_engagement: {
            indicators: ["regular_logins", "task_completion", "basic_reflections"],
            adaptations: ["gamification_boost", "social_features", "variety_injection"]
        },
        low_engagement: {
            indicators: ["sporadic_logins", "minimal_tasks", "shallow_reflections"],
            adaptations: ["re_onboarding", "motivation_boost", "barrier_removal"]
        }
    }
};

const REWARD_SYSTEM = {
    badges: {
        momentum: {
            "first_steps": "Complete first 3 tasks",
            "week_warrior": "Complete 7 days straight",
            "momentum_master": "Complete Stage 1",
            "vision_builder": "Complete Stage 2",
            "resilience_warrior": "Complete Stage 5",
            "transformation_master": "Complete Stage 6",
            "dream_master": "Complete entire journey"
        },
        
        streaks: {
            "3_day_streak": "3 consecutive days",
            "week_streak": "7 consecutive days",
            "month_streak": "30 consecutive days",
            "unbreakable": "60 consecutive days"
        },
        
        special: {
            "against_odds": "Complete after major setback",
            "early_bird": "Complete tasks before 8am",
            "night_owl": "Complete evening reflections",
            "storyteller": "Write detailed reflections",
            "helper": "Support community member"
        }
    },
    
    visual_rewards: {
        progress_trees: "Growing visual representation",
        dream_maps: "Visual journey progression",
        identity_avatars: "Evolving character representation",
        achievement_galleries: "Personal museum of wins"
    },
    
    content_rewards: {
        quotes: "Personalized motivational quotes",
        stories: "Inspiring success stories matched to user",
        insights: "AI-generated progress insights",
        celebrations: "Milestone celebration content"
    }
};

const MONGODB_SCHEMAS = {
    journey_progress: {
        userId: "ObjectId",
        currentStage: "Number",
        stageStartDate: "Date",
        overallStartDate: "Date",
        totalDaysInJourney: "Number",
        stageHistory: [{
            stage: "Number",
            startDate: "Date",
            endDate: "Date",
            completed: "Boolean",
            completionRate: "Number",
            retryCount: "Number"
        }]
    },
    
    goals_and_tasks: {
        userId: "ObjectId",
        stage: "Number",
        goals: [{
            id: "String",
            title: "String",
            description: "String",
            aiGenerated: "Boolean",
            createdAt: "Date",
            completed: "Boolean",
            completedAt: "Date",
            tasks: [{
                id: "String",
                title: "String",
                description: "String",
                estimatedDuration: "Number",
                scheduledDate: "Date",
                status: "String", // pending, in_progress, completed, skipped
                completedAt: "Date",
                reflection: "String",
                difficulty: "Number",
                adaptationApplied: "String"
            }]
        }]
    },
    
    reflections_and_beliefs: {
        userId: "ObjectId",
        entries: [{
            date: "Date",
            stage: "Number",
            type: "String", // daily, weekly, milestone, crisis
            beliefScore: "Number",
            content: "String",
            promptUsed: "String",
            emotionalState: "String",
            keyInsights: ["String"],
            aiAnalysis: "String"
        }],
        beliefTrend: [{
            date: "Date",
            score: "Number",
            context: "String"
        }]
    },
    
    rewards_and_achievements: {
        userId: "ObjectId",
        badges: [{
            id: "String",
            name: "String",
            description: "String",
            earnedAt: "Date",
            stage: "Number",
            category: "String"
        }],
        streaks: {
            current: "Number",
            longest: "Number",
            broken: [{
                length: "Number",
                brokenAt: "Date",
                reason: "String"
            }]
        },
        unlocks: [{
            feature: "String",
            unlockedAt: "Date",
            stage: "Number"
        }]
    },
    
    adaptation_data: {
        userId: "ObjectId",
        patterns: {
            beliefPattern: "String",
            completionPattern: "String",
            engagementPattern: "String",
            adaptationHistory: [{
                date: "Date",
                trigger: "String",
                adaptation: "String",
                result: "String"
            }]
        },
        personalizations: {
            preferredTaskTime: "String",
            preferredTaskLength: "String",
            motivationStyle: "String",
            challengeLevel: "String"
        }
    }
};

module.exports = {
    JOURNEY_STAGES,
    HABIT_LOOP_SYSTEM,
    ADAPTATION_ENGINE,
    REWARD_SYSTEM,
    MONGODB_SCHEMAS
};