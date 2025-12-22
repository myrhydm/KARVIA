/**
 * My Journey Frontend Implementation
 * Manages the 8-week journey progress display and interactions
 */

class MyJourneyManager {
    constructor() {
        this.apiBase = '/api';
        this.currentWeek = 1;
        this.totalWeeks = 0;
        this.journeyData = null;
        this.hasActiveDream = false;
        this.activeDreamId = null;
        this.weekCards = [];
        this.planData = null;
        
        // Archetype functionality
        this.selectedArchetype = null;
        this.dreamParsingTimer = null;
        
        // Initialize
        this.init().catch(console.error);
    }

    async init() {
        // Check authentication
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.log('No authentication token found. Redirecting to login.');
            window.location.href = 'index.html';
            return;
        }
        
        // Load user data and journey progress
        await this.loadUserData();
        await this.loadJourneyProgress();
        
        // Check if user has an active dream to determine which view to show
        await this.checkUserJourneyStatus();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Show appropriate view
        this.showAppropriateView();
        
        // Hide loading overlay
        this.hideLoading();
    }

    async loadUserData() {
        try {
            // Load user profile
            const profileResponse = await authenticatedFetch('/api/users/profile');
            
            if (profileResponse.ok) {
                const userData = await profileResponse.json();
                this.updateUserProfile(userData.data);
            }

            // Load user's dreams
            await this.loadUserDream();

            // Load scoring data
            await this.loadScoringData();
            
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    async loadUserDream() {
        try {
            const response = await authenticatedFetch('/api/dreams/active');
            
            if (response.ok) {
                const dreamsData = await response.json();
                if (dreamsData.success && dreamsData.data && dreamsData.data.length > 0) {
                    // Get the most recent active dream
                    const activeDream = dreamsData.data[0];
                    this.updateDreamDisplay(activeDream.dreamText);
                } else {
                    // Fallback to user profile dream if no active dreams
                    const fallbackDream = this.userProfileDream || "No active dream found. Please create a dream to get started.";
                    this.updateDreamDisplay(fallbackDream);
                }
            } else {
                console.error('Failed to load dreams:', response.status);
                this.updateDreamDisplay("Unable to load dream. Please try again.");
            }
        } catch (error) {
            console.error('Error loading user dream:', error);
            this.updateDreamDisplay("Unable to load dream. Please try again.");
        }
    }

    async loadScoringData() {
        try {
            const response = await fetch('/api/engines/scoring/user-scores', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (response.ok) {
                const scoringData = await response.json();
                console.log('Scoring data loaded:', scoringData);
                this.updateScoringDisplay(scoringData);
            } else {
                console.error('Failed to load scoring data:', response.status);
                this.showScoringError();
            }
        } catch (error) {
            console.error('Error loading scoring data:', error);
            this.showScoringError();
        }
    }

    async loadJourneyProgress() {
        try {
            const response = await authenticatedFetch('/api/journey/progress');
            
            if (response.ok) {
                const progressData = await response.json();
                this.journeyData = progressData;
                this.updateJourneyProgress(progressData);
            }
        } catch (error) {
            console.error('Error loading journey progress:', error);
        }
    }

    updateUserProfile(userData) {
        // User profile data is handled separately
        // This method can be used for other profile updates in the future
        console.log('User profile loaded:', userData);
        
        // If no active dreams are found, try to get dream from user profile
        if (userData && userData.onboardingData && userData.onboardingData.dream) {
            // This will be used as fallback in loadUserDream if needed
            this.userProfileDream = userData.onboardingData.dream;
        }
    }

    updateDreamDisplay(dreamText) {
        const userDreamElement = document.getElementById('user-dream');
        if (userDreamElement) {
            userDreamElement.textContent = dreamText || "No dream specified yet.";
            userDreamElement.classList.remove('italic');
        }
    }

    updateScoringDisplay(scoringData) {
        try {
            // Update stage information
            const stageNameElement = document.getElementById('stage-name');
            if (stageNameElement && scoringData.stage) {
                stageNameElement.textContent = scoringData.stage.charAt(0).toUpperCase() + scoringData.stage.slice(1);
            }

            // Update current focus
            const currentFocusElement = document.getElementById('current-focus');
            if (currentFocusElement && scoringData.stage) {
                currentFocusElement.textContent = scoringData.stage === 'discovery' ? 'Self Discovery' : 'Professional Readiness';
            }

            // Update overall score
            const overallScoreElement = document.getElementById('overall-score');
            if (overallScoreElement && scoringData.stageProfile && scoringData.stageProfile.overallScore !== undefined) {
                overallScoreElement.textContent = `${Math.round(scoringData.stageProfile.overallScore)}%`;
            }

            // Update dimension scores
            if (scoringData.scores) {
                this.updateDimensionScore('commitment-score', scoringData.scores.commitment);
                this.updateDimensionScore('clarity-score', scoringData.scores.clarity);
                this.updateDimensionScore('growth-readiness-score', scoringData.scores.growth || scoringData.scores.growthReadiness);
                this.updateDimensionScore('competency-score', scoringData.scores.competency || scoringData.scores.readiness);
                this.updateDimensionScore('opportunity-score', scoringData.scores.opportunity);
            }

            // Update insights if available
            if (scoringData.insights && Array.isArray(scoringData.insights)) {
                this.updateInsights(scoringData.insights);
            }

            // Update stage profile insights if available
            if (scoringData.stageProfile && scoringData.stageProfile.insights) {
                this.updateInsights(scoringData.stageProfile.insights);
            }

            // Update recommendations if available
            if (scoringData.stageProfile && scoringData.stageProfile.recommendations) {
                this.updateRecommendations(scoringData.stageProfile.recommendations);
            }

        } catch (error) {
            console.error('Error updating scoring display:', error);
        }
    }

    updateDimensionScore(elementId, score) {
        const element = document.getElementById(elementId);
        if (element) {
            if (score !== undefined && score !== null) {
                // Convert score to percentage if it's a decimal between 0 and 1
                const displayScore = score <= 1 ? Math.round(score * 100) : Math.round(score);
                element.textContent = `${displayScore}%`;
            } else {
                element.textContent = '--';
            }
        }
    }

    updateInsights(insights) {
        const insightsContainer = document.getElementById('insights-container');
        if (insightsContainer && insights.length > 0) {
            insightsContainer.innerHTML = '';
            
            insights.slice(0, 3).forEach(insight => {
                const insightElement = document.createElement('div');
                insightElement.className = 'insight-item';
                
                // Determine insight type based on content
                if (insight.type === 'positive' || insight.message?.includes('strong') || insight.message?.includes('good')) {
                    insightElement.classList.add('positive');
                } else if (insight.type === 'warning' || insight.priority === 'high') {
                    insightElement.classList.add('warning');
                }
                
                insightElement.innerHTML = `
                    <div class="font-medium mb-1">${insight.title || 'Insight'}</div>
                    <div>${insight.message || insight.content || insight}</div>
                `;
                
                insightsContainer.appendChild(insightElement);
            });
        }
    }

    updateRecommendations(recommendations) {
        const recommendationsContainer = document.getElementById('recommendations-container');
        if (recommendationsContainer && recommendations.length > 0) {
            recommendationsContainer.innerHTML = '';
            
            recommendations.slice(0, 3).forEach(recommendation => {
                const recommendationElement = document.createElement('div');
                recommendationElement.className = 'recommendation-item';
                
                // Determine priority class
                const priority = recommendation.priority || 'medium';
                recommendationElement.classList.add(priority);
                
                const priorityColors = {
                    high: 'text-red-800',
                    medium: 'text-orange-800', 
                    low: 'text-green-800'
                };
                
                const priorityLabels = {
                    high: 'Priority Action',
                    medium: 'Suggestion',
                    low: 'Optional'
                };
                
                recommendationElement.innerHTML = `
                    <div class="font-medium ${priorityColors[priority]} mb-1">${priorityLabels[priority]}</div>
                    <div class="${priorityColors[priority].replace('800', '700')}">${recommendation.message || recommendation.content || recommendation}</div>
                `;
                
                recommendationsContainer.appendChild(recommendationElement);
            });
        }
    }

    showScoringError() {
        // Show default values when scoring data fails to load
        const errorMessage = document.createElement('div');
        errorMessage.className = 'text-xs text-gray-500 text-center py-2';
        errorMessage.textContent = 'Unable to load scores. Please refresh to try again.';
        
        const discoveryMetrics = document.getElementById('discovery-metrics');
        if (discoveryMetrics) {
            discoveryMetrics.appendChild(errorMessage);
        }
    }

    updateJourneyProgress(progressData) {
        // Update current week
        if (progressData.currentWeek) {
            this.currentWeek = progressData.currentWeek;
            
            // Update header displays
            const currentWeekElement = document.getElementById('current-week');
            if (currentWeekElement) {
                currentWeekElement.textContent = this.currentWeek;
            }
            
            // Re-render journey if we have plan data
            if (this.hasActiveDream && this.weekCards.length > 0) {
                this.renderDynamicJourney();
            }
        }
    }


    setupEventListeners() {
        // Event listeners are now set up dynamically in createWeekCard method
        // No global event listeners needed for dynamic content
    }


    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    // Method to advance to next week (called from external triggers)
    async advanceToNextWeek() {
        if (this.currentWeek < this.totalWeeks) {
            this.currentWeek++;
            
            try {
                // Update progress on server
                await fetch('/api/journey/advance-week', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({ currentWeek: this.currentWeek })
                });
                
                // Update local state and UI
                this.updateJourneyProgress({ currentWeek: this.currentWeek });
                this.renderJourney();
                
            } catch (error) {
                console.error('Error advancing week:', error);
            }
        }
    }

    // Method to get current week data
    getCurrentWeek() {
        if (this.weekCards.length > 0 && this.currentWeek <= this.weekCards.length) {
            return this.weekCards[this.currentWeek - 1];
        }
        return null;
    }

    async checkUserJourneyStatus() {
        try {
            const response = await authenticatedFetch('/api/dreams/active');
            
            if (response.ok) {
                const dreamsData = await response.json();
                if (dreamsData.success && dreamsData.data && dreamsData.data.length > 0) {
                    const activeDream = dreamsData.data[0];
                    this.hasActiveDream = activeDream.planGenerated;
                    this.activeDreamId = activeDream._id;
                    
                    if (this.hasActiveDream) {
                        // Load the actual plan data
                        await this.loadPlanData();
                    }
                } else {
                    this.hasActiveDream = false;
                }
            } else {
                this.hasActiveDream = false;
            }
        } catch (error) {
            console.error('Error checking journey status:', error);
            this.hasActiveDream = false;
        }
    }

    async loadPlanData() {
        try {
            // Use the same endpoint as the goals page for accurate data
            const response = await authenticatedFetch('/api/goals');
            
            if (response.ok) {
                const goalsData = await response.json();
                console.log('Goals data loaded:', goalsData);
                
                // Convert goals data to week cards format
                this.weekCards = this.convertGoalsToWeekCards(goalsData);
                this.totalWeeks = this.weekCards.length;
                this.planData = { weekCards: this.weekCards };
                
                console.log('Week cards from goals:', this.weekCards);
            } else {
                console.error('Failed to load goals data:', response.status);
            }
        } catch (error) {
            console.error('Error loading plan data:', error);
        }
    }

    convertGoalsToWeekCards(goalsData) {
        const weekCards = [];
        
        // Group goals by journeyWeek
        const goalsByWeek = new Map();
        
        if (goalsData && Array.isArray(goalsData)) {
            goalsData.forEach(goal => {
                const week = goal.journeyWeek || 1;
                if (!goalsByWeek.has(week)) {
                    goalsByWeek.set(week, []);
                }
                goalsByWeek.get(week).push(goal);
            });
        }
        
        // Create week cards for each week that has goals
        const maxWeeks = Math.max(3, goalsByWeek.size > 0 ? Math.max(...goalsByWeek.keys()) : 3);
        
        for (let weekNum = 1; weekNum <= maxWeeks; weekNum++) {
            const weekGoals = goalsByWeek.get(weekNum) || [];
            const allTasks = weekGoals.flatMap(goal => goal.tasks || []);
            const completedTasks = allTasks.filter(task => task.completed || task.status === 'completed');
            const totalEstTime = allTasks.reduce((sum, task) => sum + (task.estTime || 0), 0);
            
            // Calculate progress percentage
            const progressPercentage = allTasks.length > 0 ? 
                Math.round((completedTasks.length / allTasks.length) * 100) : 0;
            
            // Use LLM theme if available, otherwise show descriptive fallback
            const weekTheme = weekGoals[0]?.journeyTheme || 
                             (weekNum === 1 ? "Discovery & Assessment" : 
                              weekNum === 2 ? "Skill Building & Development" : 
                              "Implementation & Action");
            
            weekCards.push({
                weekNumber: weekNum,
                weekTheme: weekTheme,
                progress: {
                    completed: completedTasks.length,
                    total: allTasks.length,
                    percentage: progressPercentage
                },
                timeMetrics: {
                    estimated: totalEstTime,
                    actual: 0 // Could be calculated from task timeSpent if available
                },
                goals: weekGoals.map(goal => ({
                    ...goal,  // Preserve all original goal properties including category and tasks
                    id: goal._id,
                    tasksCompleted: (goal.tasks || []).filter(t => t.completed || t.status === 'completed').length,
                    totalTasks: (goal.tasks || []).length
                }))
            });
        }
        
        return weekCards;
    }

    showAppropriateView() {
        const dreamInputSection = document.getElementById('dream-input-section');
        const journeyOverviewSection = document.getElementById('journey-overview-section');
        const headerSection = document.getElementById('header-section');
        const weeklyPlanCta = document.getElementById('weekly-plan-cta');
        
        if (this.hasActiveDream) {
            // Show journey overview for returning users
            dreamInputSection.style.display = 'none';
            journeyOverviewSection.style.display = 'grid';
            headerSection.style.display = 'block'; // Show default header
            
            // Show motivational button to guide user to weekly planning
            if (weeklyPlanCta) {
                weeklyPlanCta.classList.remove('hidden');
            }
            
            this.renderDynamicJourney();
        } else {
            // Show inspiring content for new users
            dreamInputSection.style.display = 'block';
            journeyOverviewSection.style.display = 'none';
            headerSection.style.display = 'none'; // Hide default header
            
            // Hide motivational button for new users
            if (weeklyPlanCta) {
                weeklyPlanCta.classList.add('hidden');
            }
            
            this.setupFormListeners();
        }
    }

    renderDynamicJourney() {
        // Update header information
        this.updateJourneyHeader();
        
        // Generate week cards
        this.generateWeekCards();
        
        // Show 21-day achievement if applicable
        this.show21DayAchievement();
        
        // Hide loading, show content
        this.hideJourneyLoading();
    }

    updateJourneyHeader() {
        // Update total weeks
        const totalWeeksElement = document.getElementById('total-weeks');
        if (totalWeeksElement) {
            totalWeeksElement.textContent = this.totalWeeks;
        }

        // Update journey title
        const journeyTitleElement = document.getElementById('journey-title');
        if (journeyTitleElement && this.totalWeeks > 0) {
            journeyTitleElement.textContent = `${this.totalWeeks}-Week Journey Progress`;
        }

        // Update journey description
        const journeyDescElement = document.getElementById('journey-description');
        if (journeyDescElement && this.totalWeeks > 0) {
            journeyDescElement.textContent = `Track your ${this.totalWeeks}-week transformation journey`;
        }

        // Update progress
        if (this.totalWeeks > 0) {
            const completionPercentage = Math.round(((this.currentWeek - 1) / this.totalWeeks) * 100);
            const completionElement = document.getElementById('completion-percentage');
            if (completionElement) {
                completionElement.textContent = completionPercentage;
            }

            const progressFill = document.getElementById('overall-progress-fill');
            if (progressFill) {
                progressFill.style.width = `${completionPercentage}%`;
            }
        }
    }

    generateWeekCards() {
        const container = document.getElementById('journey-cards-container');
        if (!container || !this.weekCards.length) {
            this.showJourneyError();
            return;
        }

        container.innerHTML = '';

        this.weekCards.forEach((weekData, index) => {
            const weekNumber = index + 1;
            const weekCard = this.createWeekCard(weekData, weekNumber);
            container.appendChild(weekCard);
        });

        container.classList.remove('hidden');
    }

    createWeekCard(weekData, weekNumber) {
        const card = document.createElement('div');
        
        // Determine card status
        let cardStatus = 'locked';
        let statusText = 'LOCKED';
        let statusColor = 'text-gray-400';
        
        if (weekNumber === this.currentWeek) {
            cardStatus = 'current';
            statusText = 'CURRENT';
            statusColor = 'text-blue-600';
        } else if (weekNumber < this.currentWeek) {
            cardStatus = 'completed';
            statusText = 'COMPLETED';
            statusColor = 'text-green-600';
        }

        // 21-day highlighting for week 3
        let specialHighlight = '';
        if (weekNumber === 3) {
            specialHighlight = 'border-l-4 border-l-green-500';
        }

        card.className = `week-card ${cardStatus} bg-white border border-gray-200 rounded-lg p-4 ${specialHighlight}`;
        
        if (cardStatus === 'current') {
            card.classList.add('border-blue-200');
        }

        const weekTheme = weekData.weekTheme || weekData.theme || `Week ${weekNumber}`;
        
        // Determine AI provider based on available data
        const aiProvider = this.determineAIProvider(weekData);
        const aiProviderBadge = this.createAIProviderBadge(aiProvider);
        
        // Generate weekly analysis
        const weeklyAnalysis = this.generateWeeklyAnalysis(weekData, weekNumber);
        const progressPercentage = weekData.progress?.percentage || 0;

        card.innerHTML = `
            <div class="flex items-start justify-between mb-3">
                <div class="week-number ${cardStatus === 'current' ? '' : cardStatus}">${weekNumber}</div>
                <div class="flex items-center gap-2">
                    ${aiProviderBadge}
                    <div class="text-xs ${statusColor} font-medium">${statusText}</div>
                </div>
            </div>
            <h4 class="font-bold ${cardStatus === 'locked' ? 'text-gray-600' : 'text-gray-800'} mb-2">
                ${weekTheme}
            </h4>
            ${weekNumber === 3 ? '<div class="text-xs text-green-600 font-medium mb-2">🎉 21-Day Foundation Complete!</div>' : ''}
            ${weeklyAnalysis ? `<div class="week-analysis mb-3">${weeklyAnalysis}</div>` : ''}
            ${progressPercentage > 0 ? `
                <div class="mb-3">
                    <div class="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>${progressPercentage}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-blue-600 h-2 rounded-full" style="width: ${progressPercentage}%"></div>
                    </div>
                </div>
            ` : ''}
            ${weekData.progress && weekData.progress.total > 0 ? `
                <div class="text-xs ${cardStatus === 'locked' ? 'text-gray-400' : 'text-gray-600'} mb-2">
                    ${weekData.progress.total} task${weekData.progress.total !== 1 ? 's' : ''} • ${Math.round((weekData.timeMetrics?.estimated || 0) / 60)}h${(weekData.timeMetrics?.estimated || 0) % 60 > 0 ? ` ${(weekData.timeMetrics?.estimated || 0) % 60}m` : ''} planned
                </div>
            ` : ''}
        `;

        // Add click handler for accessible weeks
        if (cardStatus === 'current' || cardStatus === 'completed') {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                this.openWeekDetails(weekData, weekNumber);
            });
        }

        return card;
    }
    
    /**
     * Determine AI provider based on available task metadata
     */
    determineAIProvider(weekData) {
        console.log('Determining AI provider for week data:', weekData);
        
        if (!weekData.goals || weekData.goals.length === 0) {
            console.log('No goals available, returning template');
            return 'template'; // Default when no goals available
        }
        
        // Check if we have enhanced metadata from the enhanced schema validator
        if (weekData.enhancedMetadata) {
            console.log('Found enhancedMetadata:', weekData.enhancedMetadata);
            const provider = weekData.enhancedMetadata.generatedBy;
            if (provider === 'openai') {
                console.log('Enhanced metadata shows OpenAI generation');
                return 'openai';
            }
        }
        
        // Check if we have enhanced plan metadata from Planner Engine v2.0.0 (legacy)
        if (weekData.planMetadata) {
            console.log('Found planMetadata, returning:', weekData.planMetadata.aiProvider);
            return weekData.planMetadata.aiProvider || 'template';
        }
        
        // Check if this is a journey goal (which indicates enhanced AI generation)
        const hasJourneyGoals = weekData.goals.some(goal => goal.category === 'journey');
        if (hasJourneyGoals) {
            console.log('Found journey category goals, indicating enhanced AI generation');
            return 'openai';
        }
        
        // Fallback: analyze task generation methods from existing data
        const tasks = weekData.goals.flatMap(goal => goal.tasks || []);
        console.log('Analyzing tasks for AI generation:', tasks.length, 'total tasks');
        
        if (tasks.length === 0) {
            console.log('No tasks found, returning template');
            return 'template';
        }
        
        const aiGeneratedCount = tasks.filter(task => {
            const isAiGenerated = task.adaptiveMetadata?.generationMethod === 'ai_generated';
            console.log('Task:', task.title || task.name, 'AI Generated:', isAiGenerated, 'Metadata:', task.adaptiveMetadata);
            return isAiGenerated;
        }).length;
        
        console.log('AI generated tasks:', aiGeneratedCount, 'out of', tasks.length);
        
        // If all or majority of tasks are AI generated, return openai
        if (aiGeneratedCount >= tasks.length * 0.5) {
            console.log('Majority AI generated, returning openai');
            return 'openai';
        }
        
        console.log('Returning template as fallback');
        return 'template';
    }
    
    /**
     * Create AI provider badge HTML
     */
    createAIProviderBadge(provider) {
        console.log('Creating AI provider badge for provider:', provider);
        const badges = {
            'openai': '<span class="ai-provider-badge openai" title="Generated with OpenAI">🤖 OpenAI</span>',
            'local': '<span class="ai-provider-badge local" title="Generated with Local AI">🏠 Local AI</span>',
            'template': '<span class="ai-provider-badge template" title="Template-based">📋 Template</span>'
        };
        
        const result = badges[provider] || badges.template;
        console.log('Badge HTML result:', result);
        return result;
    }
    
    /**
     * Generate weekly analysis explaining how this week advances the dream
     */
    generateWeeklyAnalysis(weekData, weekNumber) {
        // Use enhanced plan metadata if available from Planner Engine v2.0.0
        if (weekData.planMetadata?.weeklyAnalysis) {
            return `<div class="text-xs text-indigo-600 italic">${weekData.planMetadata.weeklyAnalysis}</div>`;
        }
        
        // Fallback: generate basic analysis based on week structure and theme
        const analysisTemplates = {
            1: "This week focuses on discovery and assessment, laying the foundation for your journey ahead.",
            2: "Building essential skills and knowledge to progress toward your dream with confidence.",
            3: "Implementing actionable steps and establishing sustainable habits for long-term success."
        };
        
        const defaultAnalysis = analysisTemplates[weekNumber] || "Continuing to build momentum and advance toward your goals.";
        
        // Enhance with specific theme context if available
        if (weekData.weekTheme && weekData.weekTheme !== `Week ${weekNumber}`) {
            const themeContext = this.getThemeContext(weekData.weekTheme);
            if (themeContext) {
                return `<div class="text-xs text-indigo-600 italic">${themeContext}</div>`;
            }
        }
        
        return `<div class="text-xs text-indigo-600 italic">${defaultAnalysis}</div>`;
    }
    
    /**
     * Get contextual explanation for week theme
     */
    getThemeContext(theme) {
        const themeContexts = {
            'Discovery & Assessment': 'Understanding your current position and identifying key opportunities for growth.',
            'Skill Building & Development': 'Developing core competencies and knowledge essential for your success.',
            'Implementation & Action': 'Putting your learning into practice and building sustainable momentum.',
            'Foundation Building': 'Establishing strong fundamentals that will support your continued progress.',
            'Knowledge Expansion': 'Broadening your understanding and exploring new possibilities in your field.',
            'Practical Application': 'Converting theoretical knowledge into real-world skills and achievements.',
            'Network & Community': 'Building valuable relationships and connections that advance your journey.',
            'Advanced Practice': 'Refining your skills and taking on more challenging opportunities.'
        };
        
        // Check for exact matches or partial matches
        for (const [key, context] of Object.entries(themeContexts)) {
            if (theme.includes(key) || key.includes(theme)) {
                return context;
            }
        }
        
        return null;
    }

    show21DayAchievement() {
        if (this.currentWeek >= 4) { // After completing week 3 (21 days)
            const achievementBanner = document.getElementById('day21-achievement');
            if (achievementBanner) {
                achievementBanner.classList.remove('hidden');
            }
        }
    }

    hideJourneyLoading() {
        const loading = document.getElementById('journey-cards-loading');
        const container = document.getElementById('journey-cards-container');
        
        if (loading) loading.classList.add('hidden');
        if (container) container.classList.remove('hidden');
    }

    showJourneyError() {
        const loading = document.getElementById('journey-cards-loading');
        const error = document.getElementById('journey-cards-error');
        const retryButton = document.getElementById('retry-journey-cards');
        
        if (loading) loading.classList.add('hidden');
        if (error) error.classList.remove('hidden');
        
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                this.loadPlanData().then(() => this.renderDynamicJourney());
            });
        }
    }

    openWeekDetails(weekData, weekNumber) {
        this.populateWeekModal(weekData, weekNumber);
        
        const modal = document.getElementById('week-details-modal');
        modal.classList.remove('hidden');
        
        // Setup event listeners for modal close
        const closeBtn = document.getElementById('close-week-modal');
        const closeBtnBottom = document.getElementById('week-modal-close-btn');
        
        const closeModal = () => {
            modal.classList.add('hidden');
        };
        
        closeBtn.onclick = closeModal;
        closeBtnBottom.onclick = closeModal;
        
        // Close on backdrop click
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal();
            }
        };
        
        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }
    
    populateWeekModal(weekData, weekNumber) {
        // Set title and status
        const title = weekData.weekTheme || `Week ${weekNumber}`;
        document.getElementById('week-modal-title').textContent = title;
        
        // Set AI provider badge
        const aiProvider = this.determineAIProvider(weekData);
        document.getElementById('week-modal-ai-badge').innerHTML = this.createAIProviderBadge(aiProvider);
        
        // Set status
        let status = 'LOCKED';
        if (weekNumber === this.currentWeek) status = 'CURRENT WEEK';
        else if (weekNumber < this.currentWeek) status = 'COMPLETED';
        document.getElementById('week-modal-status').textContent = status;
        
        // Set analysis
        const analysisDiv = document.getElementById('week-modal-analysis');
        if (weekData.planMetadata?.weeklyAnalysis) {
            analysisDiv.innerHTML = `
                <h3 class="text-lg font-semibold text-gray-900 mb-2">🎯 Week Focus</h3>
                <div class="text-indigo-600 italic bg-indigo-50 p-4 rounded-lg">
                    ${weekData.planMetadata.weeklyAnalysis}
                </div>
            `;
        } else {
            const analysis = this.generateWeeklyAnalysis(weekData, weekNumber);
            analysisDiv.innerHTML = `
                <h3 class="text-lg font-semibold text-gray-900 mb-2">🎯 Week Focus</h3>
                <div class="bg-indigo-50 p-4 rounded-lg">
                    ${analysis}
                </div>
            `;
        }
        
        // Set progress
        this.populateProgressSection(weekData);
        
        // Set goals and tasks
        this.populateGoalsSection(weekData, weekNumber);
        
        // Set learning resources
        this.populateLearningResources(weekData, weekNumber);
        
        // Set time commitment
        this.populateTimeCommitment(weekData);
    }
    
    populateProgressSection(weekData) {
        const progressDiv = document.getElementById('week-modal-progress');
        const progress = weekData.progress || { completed: 0, total: 0, percentage: 0 };
        
        progressDiv.innerHTML = `
            <h3 class="text-lg font-semibold text-gray-900 mb-3">📊 Progress Overview</h3>
            <div class="bg-white border border-gray-200 rounded-lg p-4">
                <div class="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Tasks Completed</span>
                    <span>${progress.completed} / ${progress.total}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3">
                    <div class="bg-green-600 h-3 rounded-full transition-all duration-300" 
                         style="width: ${progress.percentage || 0}%"></div>
                </div>
                <div class="text-right text-sm text-gray-600 mt-1">
                    ${progress.percentage || 0}% Complete
                </div>
            </div>
        `;
    }
    
    populateGoalsSection(weekData, weekNumber) {
        const goalsDiv = document.getElementById('week-modal-goals');
        const goals = weekData.goals || [];
        
        if (goals.length === 0) {
            goalsDiv.innerHTML = `
                <h3 class="text-lg font-semibold text-gray-900 mb-3">🎯 Goals & Tasks</h3>
                <div class="text-gray-500 italic">No specific goals defined for this week yet.</div>
            `;
            return;
        }
        
        const goalsHtml = goals.map(goal => `
            <div class="bg-white border border-gray-200 rounded-lg p-4 mb-3">
                <h4 class="font-semibold text-gray-900 mb-2">${goal.title || goal.name}</h4>
                <div class="text-sm text-gray-600 mb-2">
                    ${goal.tasksCompleted || 0} / ${goal.totalTasks || 0} tasks completed
                </div>
                ${goal.totalTasks > 0 ? `
                    <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div class="bg-blue-600 h-2 rounded-full" 
                             style="width: ${((goal.tasksCompleted || 0) / (goal.totalTasks || 1)) * 100}%"></div>
                    </div>
                ` : ''}
            </div>
        `).join('');
        
        goalsDiv.innerHTML = `
            <h3 class="text-lg font-semibold text-gray-900 mb-3">🎯 Goals & Tasks</h3>
            ${goalsHtml}
        `;
    }
    
    populateLearningResources(weekData, weekNumber) {
        const resourcesContent = document.getElementById('week-modal-resources-content');
        
        // Get learning preferences from localStorage (from manifest form)
        const manifestData = localStorage.getItem('manifestData');
        let learningPreferences = ['mixed'];
        if (manifestData) {
            try {
                const data = JSON.parse(manifestData);
                learningPreferences = data.learningPreferences || ['mixed'];
            } catch (e) {
                console.log('Could not parse manifest data for learning preferences');
            }
        }
        
        // Use enhanced resources if available from Planner Engine v2.0.0
        if (weekData.planMetadata?.learningResources) {
            resourcesContent.innerHTML = weekData.planMetadata.learningResources.map(resource => `
                <div class="learning-resource-card">
                    <div class="learning-resource-icon">${this.getResourceIcon(resource.type)}</div>
                    <h4 class="learning-resource-title">${resource.title}</h4>
                    <p class="learning-resource-desc">${resource.description}</p>
                    ${resource.url ? `<a href="${resource.url}" target="_blank" class="learning-resource-link">Access Resource →</a>` : ''}
                </div>
            `).join('');
            return;
        }
        
        // Generate contextual resources based on week theme and preferences
        const resources = this.generateContextualResources(weekData, weekNumber, learningPreferences);
        resourcesContent.innerHTML = resources;
    }
    
    populateTimeCommitment(weekData) {
        const timeDiv = document.getElementById('week-modal-time');
        const timeMetrics = weekData.timeMetrics || { estimated: 0 };
        const hours = Math.floor(timeMetrics.estimated / 60);
        const minutes = timeMetrics.estimated % 60;
        
        timeDiv.innerHTML = `
            <h3 class="text-lg font-semibold text-gray-900 mb-2">⏱️ Time Commitment</h3>
            <div class="text-gray-600">
                Estimated: <span class="font-medium">${hours}h ${minutes > 0 ? `${minutes}m` : ''}</span> this week
            </div>
        `;
    }
    
    getResourceIcon(type) {
        const icons = {
            'video': '🎥',
            'text': '📖',
            'audio': '🎧',
            'interactive': '🖐️',
            'course': '🎓',
            'article': '📄',
            'tutorial': '🧑‍🏫',
            'practice': '💪'
        };
        return icons[type] || '📚';
    }
    
    generateContextualResources(weekData, weekNumber, learningPreferences) {
        // Generate basic contextual resources based on week number and theme
        const weekTheme = weekData.weekTheme || `Week ${weekNumber}`;
        const resources = [];
        
        // Week-specific resource suggestions
        if (weekNumber === 1) {
            resources.push(
                { type: 'video', title: 'Getting Started Guide', desc: 'Foundation concepts and first steps' },
                { type: 'text', title: 'Self-Assessment Toolkit', desc: 'Evaluate your current skills and opportunities' }
            );
        } else if (weekNumber === 2) {
            resources.push(
                { type: 'interactive', title: 'Skill Building Exercises', desc: 'Hands-on practice activities' },
                { type: 'course', title: 'Intermediate Concepts', desc: 'Deepen your understanding' }
            );
        } else if (weekNumber === 3) {
            resources.push(
                { type: 'practice', title: 'Implementation Projects', desc: 'Real-world application exercises' },
                { type: 'article', title: 'Success Strategies', desc: 'Tips for sustainable progress' }
            );
        }
        
        // Filter and enhance based on learning preferences
        const filteredResources = resources.filter(resource => 
            learningPreferences.includes('mixed') || 
            learningPreferences.includes(resource.type) ||
            (resource.type === 'course' && learningPreferences.includes('video')) ||
            (resource.type === 'article' && learningPreferences.includes('text'))
        );
        
        return filteredResources.map(resource => `
            <div class="learning-resource-card">
                <div class="learning-resource-icon">${this.getResourceIcon(resource.type)}</div>
                <h4 class="learning-resource-title">${resource.title}</h4>
                <p class="learning-resource-desc">${resource.desc}</p>
                <div class="text-xs text-gray-500 mt-2">Curated for your learning preferences</div>
            </div>
        `).join('');
    }

    setupFormListeners() {
        // Character count for dream text
        const dreamText = document.getElementById('dream-text');
        const charCount = document.getElementById('char-count');
        
        if (dreamText && charCount) {
            dreamText.addEventListener('input', () => {
                charCount.textContent = dreamText.value.length;
                
                // Start 3-second parsing timer
                this.startDreamParsing();
            });
        }

        // Setup archetype template cards
        this.setupArchetypeCards();

        // Slider updates
        const confidenceSlider = document.getElementById('confidence-slider');
        const confidenceValue = document.getElementById('confidence-value');
        
        if (confidenceSlider && confidenceValue) {
            confidenceSlider.addEventListener('input', () => {
                confidenceValue.textContent = confidenceSlider.value;
            });
        }

        const timelineSlider = document.getElementById('timeline-slider');
        const timelineValue = document.getElementById('timeline-value');
        
        if (timelineSlider && timelineValue) {
            timelineSlider.addEventListener('input', () => {
                timelineValue.textContent = `${timelineSlider.value} weeks`;
            });
        }

        // Radio button selections for visual feedback
        const commitmentOptions = document.querySelectorAll('input[name="time-commitment"]');
        commitmentOptions.forEach(option => {
            option.addEventListener('change', () => {
                document.querySelectorAll('.commitment-option').forEach(opt => opt.classList.remove('selected'));
                if (option.checked) {
                    option.closest('.commitment-option-label').querySelector('.commitment-option').classList.add('selected');
                }
            });
        });

        // Generate plan button
        const generateButton = document.getElementById('generate-plan');
        if (generateButton) {
            generateButton.addEventListener('click', () => this.generatePlan());
        }
    }

    async generatePlan() {
        const dreamText = document.getElementById('dream-text').value.trim();
        const confidence = document.getElementById('confidence-slider').value;
        const timeHorizon = document.getElementById('timeline-slider').value;
        const timeCommitment = document.querySelector('input[name="time-commitment"]:checked').value;

        // Comprehensive validation before proceeding
        const validationResult = this.validateBeforeJourneyCreation(dreamText);
        if (!validationResult.isValid) {
            this.showValidationError(validationResult.message);
            return;
        }

        const generateButton = document.getElementById('generate-plan');
        const originalText = generateButton.innerHTML;
        
        try {
            // Update button to show loading
            generateButton.innerHTML = '🔄 Creating Your Journey... <div class="text-sm font-normal opacity-90 mt-1">Please wait ~60s</div>';
            generateButton.disabled = true;

            // Create dream
            const dreamResponse = await authenticatedFetch('/api/dreams/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    dreamText: dreamText,
                    confidence: parseInt(confidence),
                    timeHorizon: parseInt(timeHorizon),
                    timeCommitment: timeCommitment,
                    learningStyle: 'visual', // Default for now
                    archetypeType: this.selectedArchetype || null // Optional archetype type
                })
            });

            if (!dreamResponse.ok) {
                throw new Error('Failed to create dream');
            }

            const dreamData = await dreamResponse.json();
            console.log('Dream creation response:', dreamData);
            
            if (!dreamData.success || !dreamData.data || !dreamData.data.dreamId) {
                throw new Error('Invalid dream creation response: missing dreamId');
            }
            
            const dreamId = dreamData.data.dreamId;
            console.log('Dream created with ID:', dreamId);

            // Generate plan
            const planResponse = await authenticatedFetch(`/api/dreams/${dreamId}/generate-plan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!planResponse.ok) {
                throw new Error('Failed to generate plan');
            }

            // Success! Switch to journey view
            this.hasActiveDream = true;
            
            // Mark onboarding as completed to enable full navigation
            this.markOnboardingCompleted();
            
            this.showSuccess('🎯 Your 8-week journey has been created!');
            
            setTimeout(() => {
                this.showAppropriateView();
                // Reload data to show the new journey
                this.loadUserData();
                this.loadJourneyProgress();
            }, 1500);

        } catch (error) {
            console.error('Error generating plan:', error);
            this.showError('Failed to generate your journey. Please try again.');
            
            // Reset button
            generateButton.innerHTML = originalText;
            generateButton.disabled = false;
        }
    }

    markOnboardingCompleted() {
        // Update user status in localStorage to enable full navigation
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.onboardingCompleted = true;
        localStorage.setItem('user', JSON.stringify(user));
        
        console.log('✅ Onboarding marked as completed - full navigation enabled');
        
        // Trigger navigation refresh to show all menu items
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }

    showSuccess(message) {
        // Simple success message - you can enhance this with a proper notification system
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        successDiv.textContent = message;
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    showError(message) {
        // Simple error message - you can enhance this with a proper notification system
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    // ============ ARCHETYPE FUNCTIONALITY ============

    setupArchetypeCards() {
        const templateCards = document.querySelectorAll('.template-card');
        
        templateCards.forEach(card => {
            card.addEventListener('click', () => {
                const archetype = card.dataset.archetype;
                const template = card.dataset.template;
                
                // Update selected archetype
                this.selectedArchetype = archetype;
                
                // Replace textarea content
                const dreamText = document.getElementById('dream-text');
                if (dreamText) {
                    dreamText.value = template;
                    dreamText.focus();
                    
                    // Update character count
                    const charCount = document.getElementById('char-count');
                    if (charCount) {
                        charCount.textContent = template.length;
                    }
                }
                
                // Hide suggestions when template is selected
                this.hideSuggestions();
                
                console.log('Selected archetype:', archetype);
            });
        });
    }

    startDreamParsing() {
        // Clear existing timer
        if (this.dreamParsingTimer) {
            clearTimeout(this.dreamParsingTimer);
        }
        
        // Hide suggestions initially
        this.hideSuggestions();
        
        // Start 3-second timer
        this.dreamParsingTimer = setTimeout(() => {
            this.parseDreamAndSuggest();
        }, 3000);
    }

    parseDreamAndSuggest() {
        const dreamText = document.getElementById('dream-text');
        if (!dreamText || !dreamText.value.trim()) {
            return;
        }
        
        const text = dreamText.value.trim();
        console.log('Parsing dream:', text.substring(0, 50) + '...');
        
        // Simple client-side validation for dream completeness
        const suggestions = this.validateDreamText(text);
        
        if (suggestions.length > 0) {
            this.showSuggestions(suggestions[0]); // Show first suggestion
        } else {
            this.hideSuggestions();
        }
    }

    validateDreamText(text) {
        const suggestions = [];
        
        // General dream completeness suggestions
        if (text.length < 30) {
            suggestions.push('Try adding more details about what you want to achieve');
        } else if (!text.includes('because') && !text.includes('so that')) {
            suggestions.push('Try adding "because [your motivation]" to explain why this matters to you');
        } else if (!text.includes('from ') && !text.includes('after ')) {
            suggestions.push('Try adding context about your current situation or starting point');
        }
        
        return suggestions;
    }

    showSuggestions(suggestionText) {
        const suggestionsDiv = document.getElementById('dream-suggestions');
        const suggestionTextSpan = document.getElementById('suggestion-text');
        
        if (suggestionsDiv && suggestionTextSpan) {
            suggestionTextSpan.textContent = suggestionText;
            suggestionsDiv.classList.remove('hidden');
        }
    }

    hideSuggestions() {
        const suggestionsDiv = document.getElementById('dream-suggestions');
        if (suggestionsDiv) {
            suggestionsDiv.classList.add('hidden');
        }
    }

    // ============ VALIDATION FUNCTIONALITY ============

    validateBeforeJourneyCreation(dreamText) {
        // 1. Check if dream text exists
        if (!dreamText || dreamText.trim().length === 0) {
            return {
                isValid: false,
                message: "Please enter your dream to continue."
            };
        }

        // 2. Check minimum length (should be substantial)
        if (dreamText.trim().length < 20) {
            return {
                isValid: false,
                message: "Please provide more details about your dream (at least 20 characters)."
            };
        }

        return {
            isValid: true,
            message: "Ready to create your journey!"
        };
    }


    showValidationError(message) {
        // Show a more prominent error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-md';
        errorDiv.innerHTML = `
            <div class="flex items-start gap-3">
                <span class="text-lg">⚠️</span>
                <div>
                    <div class="font-medium mb-1">Please complete your dream</div>
                    <div class="text-sm opacity-90 whitespace-pre-line">${message}</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 8 seconds (longer for validation errors)
        setTimeout(() => {
            errorDiv.remove();
        }, 8000);

        // Also focus back on the dream text area
        const dreamText = document.getElementById('dream-text');
        if (dreamText) {
            dreamText.focus();
            dreamText.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.myJourneyManager = new MyJourneyManager();
});