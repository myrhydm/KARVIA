/**
 * Scoring Consent Service
 * 
 * Manages user consent for different data bundles used in scoring calculations
 * Ensures privacy compliance and user control over their data usage
 */

const User = require('../models/User');

class ScoringConsentService {
    
    /**
     * Get user's current consent settings
     */
    async getUserConsent(userId) {
        try {
            const user = await User.findById(userId).select('scoringConsent').lean();
            
            if (!user || !user.scoringConsent) {
                return this.getDefaultConsent();
            }
            
            return user.scoringConsent;
        } catch (error) {
            console.error('Error getting user consent:', error);
            return this.getDefaultConsent();
        }
    }
    
    /**
     * Update user consent for specific data bundle
     */
    async updateConsent(userId, bundleType, consentData) {
        try {
            const updatePath = `scoringConsent.${bundleType}`;
            const updateData = {
                [`${updatePath}.enabled`]: consentData.enabled,
                [`${updatePath}.consentedAt`]: new Date()
            };
            
            // Update individual data type consents if provided
            if (consentData.includes) {
                Object.keys(consentData.includes).forEach(dataType => {
                    updateData[`${updatePath}.includes.${dataType}`] = consentData.includes[dataType];
                });
            }
            
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $set: updateData },
                { new: true, select: 'scoringConsent' }
            );
            
            console.log(`✅ Updated ${bundleType} consent for user ${userId}:`, consentData.enabled);
            
            return updatedUser.scoringConsent;
        } catch (error) {
            console.error(`Error updating ${bundleType} consent:`, error);
            throw error;
        }
    }
    
    /**
     * Get filtered user data based on consent settings
     */
    async getConsentedUserData(userId) {
        try {
            const user = await User.findById(userId).lean();
            if (!user) {
                throw new Error('User not found');
            }
            
            const consent = user.scoringConsent || this.getDefaultConsent();
            const filteredData = {
                userId: user._id,
                basicInfo: {
                    fullName: user.fullName || '',
                    email: user.email || ''
                },
                consentedData: {}
            };
            
            // Professional Profile Bundle
            if (consent.professionalProfile?.enabled) {
                filteredData.consentedData.professionalProfile = {};
                
                if (consent.professionalProfile.includes?.bio) {
                    filteredData.consentedData.professionalProfile.bio = user.bio || '';
                }
                if (consent.professionalProfile.includes?.blogUrl) {
                    filteredData.consentedData.professionalProfile.blogUrl = user.blogUrl || '';
                }
                if (consent.professionalProfile.includes?.twitterHandle) {
                    filteredData.consentedData.professionalProfile.twitterHandle = user.twitterHandle || '';
                }
                if (consent.professionalProfile.includes?.linkedinUrl) {
                    filteredData.consentedData.professionalProfile.linkedinUrl = user.linkedinUrl || '';
                }
                if (consent.professionalProfile.includes?.sideProjects) {
                    filteredData.consentedData.professionalProfile.sideProjects = user.sideProjects || '';
                }
                if (consent.professionalProfile.includes?.location) {
                    filteredData.consentedData.professionalProfile.location = user.location || '';
                }
            }
            
            // User Preferences (always included - not sensitive)
            filteredData.consentedData.preferences = user.preferences || {};
            
            // Resume data (if professional profile is enabled)
            if (consent.professionalProfile?.enabled && user.resumes) {
                filteredData.consentedData.resumeCount = user.resumes.length;
                filteredData.consentedData.hasResume = user.resumes.length > 0;
            }
            
            return filteredData;
        } catch (error) {
            console.error('Error getting consented user data:', error);
            throw error;
        }
    }
    
    /**
     * Check if specific data type is consented for scoring
     */
    isDataTypeConsented(consent, bundleType, dataType) {
        return consent?.[bundleType]?.enabled && 
               consent?.[bundleType]?.includes?.[dataType];
    }
    
    /**
     * Get available data bundles with descriptions
     */
    getAvailableDataBundles() {
        return {
            professionalProfile: {
                title: "Professional Profile",
                description: "Your bio, social links, projects, and professional information",
                impact: "Enhances Competency and Opportunity scores based on your professional presence",
                dataTypes: {
                    bio: "Professional bio/description",
                    blogUrl: "Blog or website URL",
                    twitterHandle: "Twitter/X handle",
                    linkedinUrl: "LinkedIn profile URL",
                    sideProjects: "Side projects and portfolio",
                    location: "Geographic location"
                },
                default: false,
                sensitive: true
            },
            
            assessmentData: {
                title: "Assessment & Vision Data",
                description: "Results from questionnaires, assessments, and vision exercises",
                impact: "Provides foundation for all 5-dimension scores through structured insights",
                dataTypes: {
                    visionQuestionnaire: "Vision and dream clarity responses",
                    pmAssessment: "Professional management assessment results",
                    visionProfile: "Comprehensive vision profile journey data",
                    personalityData: "Personality and working style assessments"
                },
                default: true,
                sensitive: false
            },
            
            behavioralTracking: {
                title: "Behavioral & Engagement Tracking",
                description: "Your task completion patterns, login behavior, and engagement metrics",
                impact: "Core data for Commitment and Growth Readiness scores",
                dataTypes: {
                    taskPatterns: "Task completion patterns and efficiency",
                    loginBehavior: "Login frequency and consistency",
                    engagementQuality: "Time spent and interaction depth",
                    reflectionContent: "Content analysis of your reflections",
                    timeTracking: "Time spent on activities and tasks"
                },
                default: true,
                sensitive: false
            },
            
            externalIntegrations: {
                title: "External Integrations",
                description: "Data from connected external platforms and services",
                impact: "Enhanced market engagement and network analysis for Opportunity scores",
                dataTypes: {
                    socialMediaActivity: "Activity on connected social platforms",
                    professionalNetworks: "Professional network connections and interactions",
                    contentCreation: "Content creation and sharing activity",
                    marketEngagement: "Industry research and market engagement"
                },
                default: false,
                sensitive: true
            }
        };
    }
    
    /**
     * Get default consent settings
     */
    getDefaultConsent() {
        return {
            professionalProfile: {
                enabled: false,
                includes: {
                    bio: false,
                    blogUrl: false,
                    twitterHandle: false,
                    linkedinUrl: false,
                    sideProjects: false,
                    location: false
                }
            },
            assessmentData: {
                enabled: true,
                includes: {
                    visionQuestionnaire: true,
                    pmAssessment: true,
                    visionProfile: true,
                    personalityData: false
                }
            },
            behavioralTracking: {
                enabled: true,
                includes: {
                    taskPatterns: true,
                    loginBehavior: true,
                    engagementQuality: true,
                    reflectionContent: false,
                    timeTracking: true
                }
            },
            externalIntegrations: {
                enabled: false,
                includes: {
                    socialMediaActivity: false,
                    professionalNetworks: false,
                    contentCreation: false,
                    marketEngagement: false
                }
            }
        };
    }
    
    /**
     * Generate consent summary for user display
     */
    generateConsentSummary(consent) {
        const bundles = this.getAvailableDataBundles();
        const summary = {};
        
        Object.keys(bundles).forEach(bundleKey => {
            const bundle = bundles[bundleKey];
            const userConsent = consent[bundleKey] || this.getDefaultConsent()[bundleKey];
            
            summary[bundleKey] = {
                title: bundle.title,
                enabled: userConsent.enabled,
                consentedAt: userConsent.consentedAt,
                impact: bundle.impact,
                dataTypesEnabled: Object.keys(userConsent.includes || {}).filter(
                    key => userConsent.includes[key]
                ).length,
                totalDataTypes: Object.keys(bundle.dataTypes).length
            };
        });
        
        return summary;
    }
}

module.exports = ScoringConsentService;