/**
 * Sprint AI Service
 * Handles AI-powered sprint review and next sprint generation
 */

const visionDataService = require('./visionDataService');

class SprintAIService {
    
    /**
     * Analyze completed sprint and generate insights
     */
    async analyzeSprint(userId, sprintData, journeyData) {
        try {
            // Get user's vision profile
            const visionProfile = await visionDataService.getVisionProfile(userId);
            
            // Analyze sprint completion patterns
            const sprintAnalysis = this.analyzeSprintCompletion(sprintData);
            
            // Generate AI insights (simplified for now - will be enhanced with actual LLM)
            const insights = await this.generateSprintInsights(sprintAnalysis, visionProfile, journeyData);
            
            return {
                success: true,
                analysis: sprintAnalysis,
                insights: insights,
                recommendations: this.generateRecommendations(sprintAnalysis, visionProfile)
            };

        } catch (error) {
            throw new Error(`Failed to analyze sprint: ${error.message}`);
        }
    }

    /**
     * Generate next sprint based on user progress and AI analysis
     */
    async generateNextSprint(userId, currentSprintNumber, sprintAnalysis, dreamText) {
        try {
            // Get user's vision profile for personalization
            const visionProfile = await visionDataService.getVisionProfile(userId);
            
            // Generate sprint based on template and personalization
            const nextSprintGoals = this.createPersonalizedSprint(
                currentSprintNumber + 1, 
                sprintAnalysis, 
                visionProfile, 
                dreamText
            );
            
            return {
                success: true,
                sprintNumber: currentSprintNumber + 1,
                goals: nextSprintGoals,
                personalization: this.getPersonalizationSummary(visionProfile)
            };

        } catch (error) {
            throw new Error(`Failed to generate next sprint: ${error.message}`);
        }
    }

    /**
     * Analyze sprint completion patterns
     */
    analyzeSprintCompletion(sprintData) {
        const analysis = {
            completionRate: 0,
            taskCompletionPattern: [],
            timeToComplete: null,
            consistencyScore: 0,
            engagementLevel: 'medium',
            challengeLevel: 'appropriate'
        };

        if (!sprintData || !sprintData.goals) {
            return analysis;
        }

        // Calculate completion rate
        let totalTasks = 0;
        let completedTasks = 0;
        const dailyCompletion = [0, 0, 0]; // Day 1, 2, 3

        sprintData.goals.forEach((goal, index) => {
            totalTasks += goal.tasks.length;
            goal.tasks.forEach(task => {
                if (task.completed) {
                    completedTasks++;
                    dailyCompletion[index]++;
                }
            });
        });

        analysis.completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        analysis.taskCompletionPattern = dailyCompletion;

        // Calculate consistency score
        const completionVariance = this.calculateVariance(dailyCompletion);
        analysis.consistencyScore = Math.max(0, 100 - (completionVariance * 20));

        // Determine engagement level
        if (analysis.completionRate >= 80) {
            analysis.engagementLevel = 'high';
        } else if (analysis.completionRate >= 50) {
            analysis.engagementLevel = 'medium';
        } else {
            analysis.engagementLevel = 'low';
        }

        // Determine challenge level
        if (analysis.completionRate >= 95) {
            analysis.challengeLevel = 'too_easy';
        } else if (analysis.completionRate >= 70) {
            analysis.challengeLevel = 'appropriate';
        } else if (analysis.completionRate >= 40) {
            analysis.challengeLevel = 'challenging';
        } else {
            analysis.challengeLevel = 'too_difficult';
        }

        return analysis;
    }

    /**
     * Generate AI insights based on sprint analysis
     */
    async generateSprintInsights(sprintAnalysis, visionProfile, journeyData) {
        // This is a simplified version - in a real implementation, this would call an LLM
        const insights = {
            strengths: [],
            challenges: [],
            patterns: [],
            motivationFactors: [],
            recommendedAdjustments: []
        };

        // Analyze strengths
        if (sprintAnalysis.completionRate >= 80) {
            insights.strengths.push('High task completion rate shows strong commitment');
        }
        if (sprintAnalysis.consistencyScore >= 70) {
            insights.strengths.push('Consistent daily performance demonstrates good habit formation');
        }

        // Identify challenges
        if (sprintAnalysis.completionRate < 50) {
            insights.challenges.push('Low completion rate suggests tasks may be too challenging or time-consuming');
        }
        if (sprintAnalysis.consistencyScore < 50) {
            insights.challenges.push('Inconsistent completion pattern indicates need for better routine');
        }

        // Pattern recognition
        const pattern = sprintAnalysis.taskCompletionPattern;
        if (pattern[0] > pattern[1] && pattern[1] > pattern[2]) {
            insights.patterns.push('Declining completion pattern - may need motivation boost mid-sprint');
        } else if (pattern[2] > pattern[1] && pattern[1] > pattern[0]) {
            insights.patterns.push('Improving completion pattern - good momentum building');
        }

        // Motivation factors (based on vision profile)
        if (visionProfile && visionProfile.profile) {
            const motivationData = visionProfile.profile.getDataByKey('primary_motivation');
            if (motivationData) {
                insights.motivationFactors.push(`Primary motivation: ${motivationData.value}`);
            }
        }

        // Recommended adjustments
        if (sprintAnalysis.challengeLevel === 'too_difficult') {
            insights.recommendedAdjustments.push('Reduce task complexity or time requirements');
        } else if (sprintAnalysis.challengeLevel === 'too_easy') {
            insights.recommendedAdjustments.push('Increase challenge level with stretch goals');
        }

        return insights;
    }

    /**
     * Generate recommendations based on analysis
     */
    generateRecommendations(sprintAnalysis, visionProfile) {
        const recommendations = [];

        // Performance-based recommendations
        if (sprintAnalysis.engagementLevel === 'low') {
            recommendations.push({
                type: 'engagement',
                priority: 'high',
                message: 'Consider breaking tasks into smaller chunks or adding more variety',
                action: 'reduce_task_size'
            });
        }

        if (sprintAnalysis.consistencyScore < 60) {
            recommendations.push({
                type: 'consistency',
                priority: 'medium',
                message: 'Focus on building a consistent daily routine',
                action: 'routine_building'
            });
        }

        // Personalization recommendations
        if (visionProfile && visionProfile.profile) {
            const learningStyle = visionProfile.profile.getDataByKey('learning_style');
            if (learningStyle && learningStyle.value === 'visual') {
                recommendations.push({
                    type: 'personalization',
                    priority: 'medium',
                    message: 'Add more visual elements to task descriptions',
                    action: 'visual_enhancement'
                });
            }
        }

        return recommendations;
    }

    /**
     * Create personalized sprint based on analysis and profile
     */
    createPersonalizedSprint(sprintNumber, sprintAnalysis, visionProfile, dreamText) {
        // Get base sprint template
        const baseGoals = this.getBaseSprintTemplate(sprintNumber);
        
        // Personalize based on vision profile and performance
        const personalizedGoals = baseGoals.map(goal => this.personalizeGoal(
            goal, 
            sprintAnalysis, 
            visionProfile, 
            dreamText
        ));

        return personalizedGoals;
    }

    /**
     * Get base sprint template
     */
    getBaseSprintTemplate(sprintNumber) {
        const sprintTemplates = {
            2: [ // Reality Mapping
                {
                    day: 1,
                    title: 'Current State Assessment',
                    tasks: [
                        { name: 'Complete honest skills assessment', estTime: 45, day: 'Thu' },
                        { name: 'Identify top 3 skill gaps', estTime: 30, day: 'Thu' },
                        { name: 'Daily check-in: Self-awareness level', estTime: 10, day: 'Thu' }
                    ]
                },
                {
                    day: 2,
                    title: 'Learning Style Discovery',
                    tasks: [
                        { name: 'Research different learning resources', estTime: 45, day: 'Fri' },
                        { name: 'Test your preferred learning method', estTime: 30, day: 'Fri' },
                        { name: 'Daily check-in: Learning preference', estTime: 10, day: 'Fri' }
                    ]
                },
                {
                    day: 3,
                    title: 'Support System Mapping',
                    tasks: [
                        { name: 'Identify people who can support your journey', estTime: 30, day: 'Sat' },
                        { name: 'Assess your network strength', estTime: 30, day: 'Sat' },
                        { name: 'Daily check-in: Support system confidence', estTime: 10, day: 'Sat' }
                    ]
                }
            ],
            3: [ // Skill Building
                {
                    day: 1,
                    title: 'Skill Prioritization',
                    tasks: [
                        { name: 'Rank your top 5 skills to develop', estTime: 30, day: 'Mon' },
                        { name: 'Create skill development timeline', estTime: 45, day: 'Mon' },
                        { name: 'Daily check-in: Learning motivation', estTime: 10, day: 'Mon' }
                    ]
                },
                {
                    day: 2,
                    title: 'Industry Deep-Dive',
                    tasks: [
                        { name: 'Research industry trends and opportunities', estTime: 60, day: 'Tue' },
                        { name: 'Identify 3 emerging opportunities in your field', estTime: 30, day: 'Tue' },
                        { name: 'Daily check-in: Industry knowledge confidence', estTime: 10, day: 'Tue' }
                    ]
                },
                {
                    day: 3,
                    title: 'Learning Application',
                    tasks: [
                        { name: 'Practice new skill with hands-on project', estTime: 90, day: 'Wed' },
                        { name: 'Document what you learned', estTime: 30, day: 'Wed' },
                        { name: 'Daily check-in: Application confidence', estTime: 10, day: 'Wed' }
                    ]
                }
            ],
            4: [ // Network Expansion
                {
                    day: 1,
                    title: 'Networking Style Assessment',
                    tasks: [
                        { name: 'Connect with one professional in your field', estTime: 45, day: 'Thu' },
                        { name: 'Assess your networking comfort level', estTime: 15, day: 'Thu' },
                        { name: 'Daily check-in: Networking confidence', estTime: 10, day: 'Thu' }
                    ]
                },
                {
                    day: 2,
                    title: 'Mentorship Approach',
                    tasks: [
                        { name: 'Identify 3 potential mentors', estTime: 30, day: 'Fri' },
                        { name: 'Draft thoughtful approach messages', estTime: 45, day: 'Fri' },
                        { name: 'Daily check-in: Mentorship readiness', estTime: 10, day: 'Fri' }
                    ]
                },
                {
                    day: 3,
                    title: 'Community Engagement',
                    tasks: [
                        { name: 'Join one professional community', estTime: 30, day: 'Sat' },
                        { name: 'Introduce yourself meaningfully', estTime: 30, day: 'Sat' },
                        { name: 'Daily check-in: Community comfort', estTime: 10, day: 'Sat' }
                    ]
                }
            ],
            5: [ // Leadership Practice
                {
                    day: 1,
                    title: 'Leadership Style Exploration',
                    tasks: [
                        { name: 'Lead a small initiative or help someone', estTime: 60, day: 'Mon' },
                        { name: 'Reflect on your leadership approach', estTime: 30, day: 'Mon' },
                        { name: 'Daily check-in: Leadership confidence', estTime: 10, day: 'Mon' }
                    ]
                },
                {
                    day: 2,
                    title: 'Impact Measurement',
                    tasks: [
                        { name: 'Define how you measure success', estTime: 45, day: 'Tue' },
                        { name: 'Create accountability system', estTime: 30, day: 'Tue' },
                        { name: 'Daily check-in: Impact clarity', estTime: 10, day: 'Tue' }
                    ]
                },
                {
                    day: 3,
                    title: 'Future Vision',
                    tasks: [
                        { name: 'Describe where you see yourself in 2 years', estTime: 45, day: 'Wed' },
                        { name: 'Identify key milestones to get there', estTime: 30, day: 'Wed' },
                        { name: 'Daily check-in: Vision clarity', estTime: 10, day: 'Wed' }
                    ]
                }
            ],
            6: [ // Integration & Mastery
                {
                    day: 1,
                    title: 'System Integration',
                    tasks: [
                        { name: 'Create comprehensive 3-month action plan', estTime: 60, day: 'Thu' },
                        { name: 'Identify key success metrics', estTime: 30, day: 'Thu' },
                        { name: 'Daily check-in: Plan confidence', estTime: 10, day: 'Thu' }
                    ]
                },
                {
                    day: 2,
                    title: 'Habit Formation',
                    tasks: [
                        { name: 'Design your ongoing daily practice', estTime: 45, day: 'Fri' },
                        { name: 'Set up accountability partners', estTime: 30, day: 'Fri' },
                        { name: 'Daily check-in: Habit readiness', estTime: 10, day: 'Fri' }
                    ]
                },
                {
                    day: 3,
                    title: 'Community Contribution',
                    tasks: [
                        { name: 'Share one insight to help others', estTime: 45, day: 'Sat' },
                        { name: 'Commit to ongoing learning plan', estTime: 30, day: 'Sat' },
                        { name: 'Daily check-in: Contribution readiness', estTime: 10, day: 'Sat' }
                    ]
                }
            ]
        };

        return sprintTemplates[sprintNumber] || [];
    }

    /**
     * Personalize goal based on user data
     */
    personalizeGoal(goal, sprintAnalysis, visionProfile, dreamText) {
        let personalizedGoal = { ...goal };

        // Adjust task time based on completion patterns
        if (sprintAnalysis.challengeLevel === 'too_difficult') {
            personalizedGoal.tasks = goal.tasks.map(task => ({
                ...task,
                estTime: Math.max(15, task.estTime - 15) // Reduce time by 15 minutes
            }));
        } else if (sprintAnalysis.challengeLevel === 'too_easy') {
            personalizedGoal.tasks = goal.tasks.map(task => ({
                ...task,
                estTime: task.estTime + 15 // Add 15 minutes for more depth
            }));
        }

        // Add dream context to task names
        if (dreamText && dreamText.includes('AI')) {
            personalizedGoal.tasks = personalizedGoal.tasks.map(task => {
                if (task.name.includes('skill') && !task.name.includes('AI')) {
                    return {
                        ...task,
                        name: task.name.replace('skill', 'AI skill')
                    };
                }
                return task;
            });
        }

        return personalizedGoal;
    }

    /**
     * Get personalization summary
     */
    getPersonalizationSummary(visionProfile) {
        if (!visionProfile || !visionProfile.profile) {
            return { applied: false, factors: [] };
        }

        const factors = [];
        
        const confidenceData = visionProfile.profile.getDataByKey('confidence_baseline');
        if (confidenceData) {
            factors.push(`Confidence level: ${confidenceData.value}/10`);
        }

        const learningStyle = visionProfile.profile.getDataByKey('learning_style');
        if (learningStyle) {
            factors.push(`Learning style: ${learningStyle.value}`);
        }

        return {
            applied: factors.length > 0,
            factors: factors
        };
    }

    /**
     * Calculate variance for consistency scoring
     */
    calculateVariance(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    }
}

module.exports = new SprintAIService();