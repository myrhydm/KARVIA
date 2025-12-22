/**
 * Vision Data Service
 * Handles vision data collection through journey tasks
 */

const VisionProfile = require('../models/VisionProfile');
const mongoose = require('mongoose');

class VisionDataService {
    
    /**
     * Initialize vision profile for a new journey
     */
    async initializeVisionProfile(userId, journeyId, preferences = {}) {
        try {
            // Check if profile already exists
            const existingProfile = await VisionProfile.findOne({ user: userId });
            if (existingProfile) {
                return existingProfile;
            }

            const profile = new VisionProfile({
                user: userId,
                journeyId: journeyId,
                dataPoints: []
            });

            // Add initial preference data points
            if (preferences.careerPath) {
                profile.addDataPoint('professional', 'career_path', preferences.careerPath, {
                    confidence: 9,
                    collectedFrom: { method: 'initial_form' }
                });
            }

            if (preferences.timeCommitment) {
                profile.addDataPoint('personal', 'time_commitment_style', preferences.timeCommitment, {
                    confidence: 8,
                    collectedFrom: { method: 'initial_form' }
                });
            }

            if (preferences.learningStyle) {
                profile.addDataPoint('learning', 'learning_style', preferences.learningStyle, {
                    confidence: 8,
                    collectedFrom: { method: 'initial_form' }
                });
            }

            if (preferences.confidenceBaseline) {
                profile.addDataPoint('personal', 'confidence_baseline', preferences.confidenceBaseline, {
                    confidence: 9,
                    collectedFrom: { method: 'initial_form' }
                });
            }

            if (preferences.timeHorizon) {
                profile.addDataPoint('timeline', 'target_timeline_weeks', preferences.timeHorizon, {
                    confidence: 9,
                    collectedFrom: { method: 'initial_form' }
                });
            }

            await profile.save();
            return profile;

        } catch (error) {
            throw new Error(`Failed to initialize vision profile: ${error.message}`);
        }
    }

    /**
     * Collect vision data from task completion
     */
    async collectDataFromTask(userId, taskId, taskName, sprintNumber, day, responses = {}) {
        try {
            const profile = await VisionProfile.findOne({ user: userId });
            if (!profile) {
                throw new Error('Vision profile not found');
            }

            // Map task responses to vision data points
            const dataPoints = this.mapTaskToVisionData(taskName, sprintNumber, day, responses);
            
            // Add data points to profile
            for (const dataPoint of dataPoints) {
                profile.addDataPoint(
                    dataPoint.category,
                    dataPoint.key,
                    dataPoint.value,
                    {
                        confidence: dataPoint.confidence,
                        collectedFrom: {
                            taskId,
                            sprintNumber,
                            day,
                            method: 'task_completion'
                        }
                    }
                );
            }

            await profile.save();
            return profile;

        } catch (error) {
            throw new Error(`Failed to collect vision data: ${error.message}`);
        }
    }

    /**
     * Collect data from daily check-in
     */
    async collectDataFromCheckIn(userId, checkInData, sprintNumber, day) {
        try {
            const profile = await VisionProfile.findOne({ user: userId });
            if (!profile) {
                throw new Error('Vision profile not found');
            }

            // Map check-in data to vision data points
            const dataPoints = this.mapCheckInToVisionData(checkInData, sprintNumber, day);
            
            // Add data points to profile
            for (const dataPoint of dataPoints) {
                profile.addDataPoint(
                    dataPoint.category,
                    dataPoint.key,
                    dataPoint.value,
                    {
                        confidence: dataPoint.confidence,
                        collectedFrom: {
                            sprintNumber,
                            day,
                            method: 'check_in'
                        }
                    }
                );
            }

            await profile.save();
            return profile;

        } catch (error) {
            throw new Error(`Failed to collect check-in data: ${error.message}`);
        }
    }

    /**
     * Get vision profile for user
     */
    async getVisionProfile(userId) {
        try {
            // Try both string and ObjectId queries for robustness
            let profile = await VisionProfile.findOne({ user: userId });
            if (!profile && mongoose.Types.ObjectId.isValid(userId)) {
                profile = await VisionProfile.findOne({ user: new mongoose.Types.ObjectId(userId) });
            }
            if (!profile) {
                return null;
            }

            return {
                profile,
                summary: this.generateProfileSummary(profile),
                recommendations: this.generateRecommendations(profile)
            };

        } catch (error) {
            throw new Error(`Failed to get vision profile: ${error.message}`);
        }
    }

    /**
     * Map task completion to vision data points
     */
    mapTaskToVisionData(taskName, sprintNumber, day, responses) {
        const dataPoints = [];
        
        // Week 1 - Personal Discovery
        if (sprintNumber === 1) {
            if (taskName.includes('dream') || taskName.includes('articulate')) {
                if (responses.dreamClarity) {
                    dataPoints.push({
                        category: 'personal',
                        key: 'dream_clarity',
                        value: responses.dreamClarity,
                        confidence: 8
                    });
                }
            }
            
            if (taskName.includes('confidence')) {
                if (responses.confidenceLevel) {
                    dataPoints.push({
                        category: 'personal',
                        key: 'confidence_baseline',
                        value: parseInt(responses.confidenceLevel),
                        confidence: 9
                    });
                }
            }
            
            if (taskName.includes('commitment')) {
                if (responses.commitmentLevel) {
                    dataPoints.push({
                        category: 'personal',
                        key: 'commitment_level',
                        value: responses.commitmentLevel,
                        confidence: 8
                    });
                }
            }
        }
        
        if (sprintNumber === 2) {
            if (taskName.includes('skills') || taskName.includes('assessment')) {
                if (responses.skillLevel) {
                    dataPoints.push({
                        category: 'professional',
                        key: 'current_skill_level',
                        value: responses.skillLevel,
                        confidence: 7
                    });
                }
                if (responses.skillGaps) {
                    dataPoints.push({
                        category: 'professional',
                        key: 'skill_gaps',
                        value: responses.skillGaps,
                        confidence: 8
                    });
                }
            }
            
            if (taskName.includes('learning')) {
                if (responses.learningStyle) {
                    dataPoints.push({
                        category: 'learning',
                        key: 'learning_style',
                        value: responses.learningStyle,
                        confidence: 8
                    });
                }
            }
            
            if (taskName.includes('support') || taskName.includes('network')) {
                if (responses.networkStrength) {
                    dataPoints.push({
                        category: 'networking',
                        key: 'network_strength',
                        value: responses.networkStrength,
                        confidence: 7
                    });
                }
            }
        }
        
        // Week 2 - Professional Development
        if (sprintNumber === 3) {
            if (taskName.includes('skill') && taskName.includes('priorit')) {
                if (responses.skillPriorities) {
                    dataPoints.push({
                        category: 'professional',
                        key: 'skill_priorities',
                        value: responses.skillPriorities,
                        confidence: 8
                    });
                }
            }
            
            if (taskName.includes('industry') || taskName.includes('trend')) {
                if (responses.industryKnowledge) {
                    dataPoints.push({
                        category: 'professional',
                        key: 'industry_knowledge',
                        value: responses.industryKnowledge,
                        confidence: 7
                    });
                }
            }
        }
        
        if (sprintNumber === 4) {
            if (taskName.includes('network') || taskName.includes('connect')) {
                if (responses.networkingComfort) {
                    dataPoints.push({
                        category: 'networking',
                        key: 'networking_comfort',
                        value: responses.networkingComfort,
                        confidence: 8
                    });
                }
            }
            
            if (taskName.includes('mentor')) {
                if (responses.mentorshipStyle) {
                    dataPoints.push({
                        category: 'learning',
                        key: 'mentorship_style',
                        value: responses.mentorshipStyle,
                        confidence: 7
                    });
                }
            }
        }
        
        // Week 3 - Leadership & Vision
        if (sprintNumber === 5) {
            if (taskName.includes('lead') || taskName.includes('initiative')) {
                if (responses.leadershipStyle) {
                    dataPoints.push({
                        category: 'leadership',
                        key: 'leadership_style',
                        value: responses.leadershipStyle,
                        confidence: 8
                    });
                }
            }
            
            if (taskName.includes('impact') || taskName.includes('measure')) {
                if (responses.impactMeasurement) {
                    dataPoints.push({
                        category: 'values',
                        key: 'impact_measurement',
                        value: responses.impactMeasurement,
                        confidence: 7
                    });
                }
            }
        }
        
        if (sprintNumber === 6) {
            if (taskName.includes('vision') || taskName.includes('future')) {
                if (responses.longTermVision) {
                    dataPoints.push({
                        category: 'values',
                        key: 'long_term_vision',
                        value: responses.longTermVision,
                        confidence: 8
                    });
                }
            }
            
            if (taskName.includes('habit') || taskName.includes('routine')) {
                if (responses.energyPatterns) {
                    dataPoints.push({
                        category: 'personal',
                        key: 'energy_patterns',
                        value: responses.energyPatterns,
                        confidence: 7
                    });
                }
            }
        }
        
        return dataPoints;
    }

    /**
     * Map check-in responses to vision data points
     */
    mapCheckInToVisionData(checkInData, sprintNumber, day) {
        const dataPoints = [];
        
        // Common check-in data points
        if (checkInData.motivationLevel) {
            dataPoints.push({
                category: 'motivation',
                key: 'daily_motivation',
                value: checkInData.motivationLevel,
                confidence: 6
            });
        }
        
        if (checkInData.confidenceLevel) {
            dataPoints.push({
                category: 'personal',
                key: 'confidence_trend',
                value: {
                    date: new Date(),
                    score: checkInData.confidenceLevel,
                    context: `Sprint ${sprintNumber} Day ${day}`
                },
                confidence: 7
            });
        }
        
        if (checkInData.reflectionNotes) {
            dataPoints.push({
                category: 'personal',
                key: 'reflection_notes',
                value: {
                    date: new Date(),
                    notes: checkInData.reflectionNotes,
                    sprint: sprintNumber,
                    day: day
                },
                confidence: 8
            });
        }
        
        return dataPoints;
    }

    /**
     * Generate profile summary
     */
    generateProfileSummary(profile) {
        const summary = {
            completionPercentage: profile.completionStatus.overall,
            dataPointsCollected: profile.dataPoints.length,
            categoriesCompleted: Object.keys(profile.completionStatus).filter(key => 
                key !== 'overall' && profile.completionStatus[key] > 50
            ).length,
            strongestCategories: [],
            needsAttention: []
        };

        // Identify strongest categories
        Object.keys(profile.completionStatus).forEach(key => {
            if (key !== 'overall' && profile.completionStatus[key] > 70) {
                summary.strongestCategories.push(key);
            } else if (key !== 'overall' && profile.completionStatus[key] < 30) {
                summary.needsAttention.push(key);
            }
        });

        return summary;
    }

    /**
     * Generate recommendations based on profile
     */
    generateRecommendations(profile) {
        const recommendations = [];

        // Based on completion status
        if (profile.completionStatus.personalDiscovery < 50) {
            recommendations.push({
                type: 'data_collection',
                priority: 'high',
                message: 'Complete more personal discovery tasks to better understand your core values and motivations'
            });
        }

        if (profile.completionStatus.professionalDevelopment < 50) {
            recommendations.push({
                type: 'data_collection',
                priority: 'medium',
                message: 'Focus on professional development activities to identify skill gaps and learning preferences'
            });
        }

        // Based on specific data points
        const confidenceData = profile.getDataByKey('confidence_baseline');
        if (confidenceData && confidenceData.value < 6) {
            recommendations.push({
                type: 'confidence_building',
                priority: 'high',
                message: 'Consider starting with smaller, achievable goals to build confidence gradually'
            });
        }

        const networkData = profile.getDataByKey('network_strength');
        if (networkData && networkData.value === 'weak') {
            recommendations.push({
                type: 'networking',
                priority: 'medium',
                message: 'Prioritize networking activities to build professional connections'
            });
        }

        return recommendations;
    }
}

module.exports = new VisionDataService();