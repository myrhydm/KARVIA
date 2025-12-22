/**
 * Journey Progress Page Manager
 * Handles the 21-day gamified journey progression system
 */

class JourneyProgressManager {
    constructor() {
        this.apiBase = '/api';
        this.currentUser = null;
        this.journeyData = null;
        this.stageNames = [];
        this.currentDay = 1;
        this.currentStreak = 0;
        this.userXP = 0;
        this.overallScore = 0;
        this._cachedTasks = null; // Cache for loadAllJourneyTasks
        this._isNewJourneyFromURL = false; // Preserve new journey state from URL
        
        // 21-Day Structure: 6 stages with reflection days after every 3-4 work days
        this.journeyStructure = {
            totalDays: 21,
            stages: [
                { id: 1, days: [1, 2, 3], reflectionDay: 4, milestone: false },
                { id: 2, days: [5, 6, 7], reflectionDay: 8, milestone: true }, // Week 1 milestone
                { id: 3, days: [9, 10, 11], reflectionDay: 12, milestone: false },
                { id: 4, days: [13, 14, 15], reflectionDay: 16, milestone: true }, // Week 2 milestone
                { id: 5, days: [17, 18, 19], reflectionDay: 20, milestone: false },
                { id: 6, days: [21], reflectionDay: null, milestone: true } // Final milestone
            ]
        };
        
        this.init();
        
        // Make instance available globally for refreshing from other pages
        window.journeyProgressInstance = this;
    }

    async init() {
        try {
            this.showLoading();
            
            // Check if this is a new journey from URL parameter
            const urlParams = new URLSearchParams(window.location.search);
            const isNewFromURL = urlParams.get('new') === 'true';
            
            if (isNewFromURL) {
                console.log('🆕 NEW JOURNEY FLAG detected in URL - this is definitely a new journey!');
                // Preserve the new journey state before removing URL parameter
                this._isNewJourneyFromURL = true;
                // Clean up the URL to remove the parameter
                window.history.replaceState({}, document.title, window.location.pathname);
            }
            
            // Check authentication first
            const token = getAuthToken();
            if (!token) {
                console.log('No auth token found, redirecting to login');
                logout();
                return;
            }
            
            await this.loadUserData();
            
            try {
                await this.loadJourneyData();
            } catch (journeyError) {
                console.error('❌ Journey data loading failed:', journeyError);
                throw new Error(`Journey data loading failed: ${journeyError.message}`);
            }
            await Promise.all([
                this.generateStageNames(),
                this.loadAndDisplayScores()
            ]);
            
            if (isNewFromURL) {
                await this.forceInitializeNewJourney();
            } else {
                await this.calculateProgress();
            }
            
            await this.validateAllScenarios();
            await this.checkDailyTaskCompletion();
            
            this.renderSidebar();
            this.renderHeader();
            this.renderCurrentStage();
            this.renderProgressVisualization();
            this.setupEventListeners();
            this.logCurrentState();
            
            this.hideLoading();
        } catch (error) {
            console.error('❌ Error initializing journey progress:', error);
            console.error('Stack trace:', error.stack);
            
            // Show more detailed error for debugging
            this.showError(`Failed to load your journey: ${error.message}. Please check console for details.`);
            
            // Also show the page even if there's an error
            this.hideLoading();
        }
    }

    async checkDailyTaskCompletion() {
        try {
            console.log(`🔍 Checking task completion for Day ${this.currentDay}...`);
            
            // Load current tasks and check if today's tasks are completed
            const allTasks = await this.loadAllJourneyTasks();
            const tasksByDay = this.groupTasksByDay(allTasks);
            const todayTasks = tasksByDay[this.currentDay] || [];
            
            // Validate all scenarios
            console.log(`📋 Day ${this.currentDay} has ${todayTasks.length} planned tasks`);
            
            if (todayTasks.length > 0) {
                const completedTasks = todayTasks.filter(task => 
                    task.completed || task.status === 'completed' || task.status === 'postponed'
                );
                
                const pendingTasks = todayTasks.filter(task => 
                    !task.completed && task.status !== 'completed' && task.status !== 'postponed'
                );
                
                const completionRate = completedTasks.length / todayTasks.length;
                
                console.log(`✅ Completed: ${completedTasks.length}, ⏳ Pending: ${pendingTasks.length}, 📊 Rate: ${Math.round(completionRate * 100)}%`);
                
                // Scenario 1: All tasks completed - user can progress
                if (completionRate === 1.0) {
                    console.log(`🎉 Day ${this.currentDay} fully completed! User can progress to next day.`);
                    this.showProgressCelebration();
                    
                    // Recalculate progress to advance to next day
                    await this.calculateTaskBasedProgress();
                    
                    // Check if stage can be progressed too
                    await this.checkStageProgression();
                    
                } else if (completionRate > 0) {
                    // Scenario 2: Partial completion - encourage user
                    console.log(`⚡ Day ${this.currentDay}: Partial progress made`);
                    this.showPartialProgress(completedTasks.length, todayTasks.length);
                    
                } else {
                    // Scenario 3: No progress - focus on overview
                    console.log(`📝 Day ${this.currentDay}: Showing progress overview`);
                    // Journey progress is for tracking, not task management
                }
                
                // Additional validation: Check if user is trying to access future days
                this.validateDayAccess();
                
            } else {
                // Scenario 4: No tasks planned for this day
                console.log(`📅 No tasks planned for Day ${this.currentDay} - checking if progression is allowed`);
                
                // Only allow progression if previous days are complete
                const canProgress = await this.validateProgressionToCurrentDay();
                if (canProgress) {
                    console.log(`✅ Progression to Day ${this.currentDay} is valid`);
                    await this.checkStageProgression();
                } else {
                    console.log(`❌ Cannot access Day ${this.currentDay} - previous days incomplete`);
                    // Reset to appropriate day
                    await this.calculateTaskBasedProgress();
                }
            }
            
        } catch (error) {
            console.error('❌ Error checking daily task completion:', error);
        }
    }

    async validateProgressionToCurrentDay() {
        // Validate that user can legitimately be on current day
        try {
            const allTasks = await this.loadAllJourneyTasks();
            const tasksByDay = this.groupTasksByDay(allTasks);
            
            // Check all previous days are completed
            for (let day = 1; day < this.currentDay; day++) {
                const dayTasks = tasksByDay[day] || [];
                if (dayTasks.length > 0) {
                    const completedTasks = dayTasks.filter(task => 
                        task.completed || task.status === 'completed' || task.status === 'postponed'
                    );
                    
                    if (completedTasks.length < dayTasks.length) {
                        console.log(`❌ Day ${day} is not complete - cannot access Day ${this.currentDay}`);
                        return false;
                    }
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error validating progression:', error);
            return false;
        }
    }

    validateDayAccess() {
        // Prevent user from accessing future days without completing current tasks
        if (this.currentDay > 21) {
            console.log('⚠️ User is beyond Day 21 - resetting to Day 21');
            this.currentDay = 21;
        } else if (this.currentDay < 1) {
            console.log('⚠️ User is before Day 1 - resetting to Day 1');
            this.currentDay = 1;
        }
    }

    showProgressCelebration() {
        // Show celebration for completed day - focus on journey progress
        this.showInfo(`🎉 Congratulations! You've made excellent progress on Day ${this.currentDay} of your journey!`);
    }

    showPartialProgress(completed, total) {
        // Show partial progress - focus on journey overview, not task management
        this.showInfo(`✨ Great progress! You're actively working on your dream journey. Keep up the momentum!`);
    }

    // Removed showTaskReminder - Journey Progress is for overview only, not task management

    async refreshProgress() {
        // Method to refresh progress when tasks are updated
        try {
            await this.calculateProgress();
            await this.checkDailyTaskCompletion();
            this.renderHeader();
            this.renderProgressVisualization();
            this.updateOverallProgress();
        } catch (error) {
            console.error('Error refreshing progress:', error);
        }
    }

    // Static method to be called from other pages when tasks are updated
    static async refreshJourneyProgress() {
        // If we're on the journey progress page, refresh it
        if (window.location.pathname.includes('journey_progress')) {
            const journeyProgress = window.journeyProgressInstance;
            if (journeyProgress) {
                await journeyProgress.refreshProgress();
            }
        }
    }

    // Method to check if user can progress to next day
    async canProgressToNextDay() {
        try {
            const allTasks = await this.loadAllJourneyTasks();
            const tasksByDay = this.groupTasksByDay(allTasks);
            const todayTasks = tasksByDay[this.currentDay] || [];
            
            if (todayTasks.length === 0) {
                // No tasks for today - can progress
                return { canProgress: true, reason: 'No tasks planned for today' };
            }
            
            const completedTasks = todayTasks.filter(task => 
                task.completed || task.status === 'completed' || task.status === 'postponed'
            );
            
            const allCompleted = completedTasks.length === todayTasks.length;
            
            return {
                canProgress: allCompleted,
                reason: allCompleted 
                    ? 'All tasks completed' 
                    : `${todayTasks.length - completedTasks.length} tasks still pending`,
                completedTasks: completedTasks.length,
                totalTasks: todayTasks.length
            };
            
        } catch (error) {
            console.error('Error checking progression eligibility:', error);
            return { canProgress: false, reason: 'Error checking tasks' };
        }
    }

    // Method to manually advance to next day (only if eligible)
    async advanceToNextDay() {
        const progressCheck = await this.canProgressToNextDay();
        
        if (!progressCheck.canProgress) {
            this.showError(`Cannot advance to next day: ${progressCheck.reason}`);
            return false;
        }
        
        if (this.currentDay >= 21) {
            this.showInfo('🎉 Congratulations! You have completed your 21-day journey!');
            return false;
        }
        
        // Advance to next day
        this.currentDay++;
        this.currentStreak++;
        this.userXP += 10; // Base XP for completing a day
        
        await this.saveProgressToDatabase();
        
        // Update UI
        this.renderHeader();
        this.renderProgressVisualization();
        this.updateOverallProgress();
        
        this.showSuccess(`🎉 Advanced to Day ${this.currentDay}! Keep up the great work!`);
        return true;
    }

    // Comprehensive validation of all progression scenarios
    async validateAllScenarios() {
        
        try {
            const allTasks = await this.loadAllJourneyTasks();
            const tasksByDay = this.groupTasksByDay(allTasks);
            
            // Test Scenario 1: New Journey (CRITICAL - Force Day 1)
            if (this.isNewJourney()) {
                console.log('✅ Scenario 1: New Journey - MUST start at Day 1');
                console.log('🔍 DEBUG: Current day before new journey check:', this.currentDay);
                if (this.currentDay !== 1) {
                    console.error(`❌ CRITICAL NEW JOURNEY VALIDATION FAILED: Day ${this.currentDay} instead of Day 1`);
                    this.currentDay = 1;
                    // Legacy streak tracking removed
                    this.overallScore = 0;
                    await this.saveProgressToDatabase();
                    console.log('🔧 FIXED: Reset new journey to Day 1');
                }
            } else {
                console.log('🔍 DEBUG: Not detected as new journey by validateAllScenarios');
            }
            
            // Test Scenario 2: Day 1 with incomplete tasks
            const day1Tasks = tasksByDay[1] || [];
            console.log('🔍 DEBUG: day1Tasks count:', day1Tasks.length);
            if (day1Tasks.length > 0) {
                const day1Completed = day1Tasks.filter(t => t.completed || t.status === 'completed').length;
                console.log('🔍 DEBUG: day1Completed:', day1Completed, 'out of', day1Tasks.length, 'current day:', this.currentDay);
                if (day1Completed < day1Tasks.length && this.currentDay > 1) {
                    console.error('❌ PROGRESSION VALIDATION FAILED: Advanced past Day 1 without completing Day 1 tasks');
                    console.log('🔍 DEBUG: SETTING currentDay to 1 due to incomplete day 1 tasks');
                    this.currentDay = 1;
                    await this.saveProgressToDatabase();
                }
            }
            
            // Test Scenario 3: Sequential progression validation
            console.log('🔍 DEBUG: Starting sequential validation, current day:', this.currentDay);
            for (let day = 1; day < this.currentDay; day++) {
                const dayTasks = tasksByDay[day] || [];
                console.log(`🔍 DEBUG: Day ${day} has ${dayTasks.length} tasks`);
                if (dayTasks.length > 0) {
                    const completedTasks = dayTasks.filter(t => t.completed || t.status === 'completed' || t.status === 'postponed');
                    console.log(`🔍 DEBUG: Day ${day}: ${completedTasks.length}/${dayTasks.length} tasks completed`);
                    if (completedTasks.length < dayTasks.length) {
                        console.error(`❌ SEQUENTIAL VALIDATION FAILED: Day ${day} incomplete but user on Day ${this.currentDay}`);
                        console.log(`🔍 DEBUG: SETTING currentDay from ${this.currentDay} to ${day} due to incomplete sequential tasks`);
                        // Reset to the first incomplete day
                        this.currentDay = day;
                        await this.saveProgressToDatabase();
                        break;
                    }
                }
            }
            
            // Test Scenario 4: Day boundaries (1-21)
            if (this.currentDay < 1 || this.currentDay > 21) {
                console.error(`❌ BOUNDARY VALIDATION FAILED: Day ${this.currentDay} is out of bounds`);
                this.currentDay = Math.max(1, Math.min(21, this.currentDay));
                await this.saveProgressToDatabase();
            }
            
            // Test Scenario 5: Stage progression alignment
            const currentStage = this.getCurrentStage();
            if (!currentStage.days.includes(this.currentDay)) {
                console.warn(`⚠️ STAGE ALIGNMENT: Day ${this.currentDay} not in current stage days`);
            }
            
            console.log('✅ All scenario validations completed');
            
        } catch (error) {
            console.error('❌ Error during scenario validation:', error);
        }
    }

    // Method to reset journey progress (for testing/debugging)
    async resetJourneyProgress() {
        console.log('🔄 Resetting journey progress to Day 1...');
        this.currentDay = 1;
        // Legacy streak tracking removed
        this.overallScore = 0;
        await this.saveProgressToDatabase();
        
        // Refresh the UI
        this.renderHeader();
        
        console.log('✅ Journey progress reset to Day 1');
    }

    // Force initialize a new journey to Day 1 (call this immediately after journey creation)
    async forceInitializeNewJourney() {
        console.log('🔧 FORCE INITIALIZING NEW JOURNEY to Day 1...');
        this.currentDay = 1;
        // Legacy streak tracking removed
        this.overallScore = 0;
        
        // Clear localStorage to ensure clean state for new journey
        console.log('🧹 Cleaning localStorage for new journey...');
        localStorage.removeItem('selectedWeekOf');
        
        // Set proper week date for new journey  
        const { getStartOfWeek } = window;
        if (getStartOfWeek) {
            const weekOf = getStartOfWeek(new Date());
            localStorage.setItem('selectedWeekOf', weekOf.toISOString());
            console.log('📅 Set selectedWeekOf to:', weekOf.toISOString());
        }
        
        // Clear any existing progress
        await this.saveProgressToDatabase();
        
        // Update UI immediately
        this.renderHeader();
        
        console.log('✅ NEW JOURNEY FORCE INITIALIZED: Day 1, Streak 0, XP 0');
    }

    // Static method to force initialize when called from journey creation
    static async forceInitializeNewJourneyFromCreation() {
        // Wait a moment for the page to load, then force initialize
        setTimeout(async () => {
            if (window.journeyProgressInstance) {
                await window.journeyProgressInstance.forceInitializeNewJourney();
            }
        }, 1000);
    }

    // Debug method to log current state
    logCurrentState() {
        console.log('📊 CURRENT JOURNEY STATE:');
        console.log(`   Day: ${this.currentDay}/21`);
        console.log(`   Streak: ${this.currentStreak} days`);
        console.log(`   XP: ${this.userXP}`);
        console.log(`   Journey Start: ${this.journeyData?.journeyStartDate}`);
        console.log(`   Plan Generated: ${this.journeyData?.planGeneratedAt}`);
        console.log(`   Goal IDs: ${this.journeyData?.goalIds?.length || 0} goals`);
        console.log(`   Is New Journey: ${this.isNewJourney()}`);
        
        const currentStage = this.getCurrentStage();
        console.log(`   Current Stage: ${currentStage.id} (Days: ${currentStage.days.join(', ')})`);
    }

    async loadUserData() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/users/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                this.currentUser = await response.json();
            } else {
                throw new Error('Failed to load user profile');
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            // For demo purposes, create mock user data for new user
            this.currentUser = {
                data: {
                    loginCount: 1,
                    firstLoginDate: new Date(), // Today
                    totalXP: 0
                }
            };
        }
    }

    async loadJourneyData() {
        const token = localStorage.getItem('authToken');
        
        // First check for journey data in localStorage (works for both demo and real journeys)
        const localJourney = localStorage.getItem('currentJourney');
        if (localJourney) {
            try {
                this.journeyData = JSON.parse(localJourney);
                console.log('✅ Loaded journey data from localStorage:', this.journeyData);
                
                // Ensure data has required fields for progress page
                if (!this.journeyData.confidence) this.journeyData.confidence = 75;
                if (!this.journeyData.timeCommitment) this.journeyData.timeCommitment = 'focused-blocks';
                if (!this.journeyData.learningStyle) this.journeyData.learningStyle = 'hands-on';
                if (!this.journeyData.assessmentScores) {
                    this.journeyData.assessmentScores = {
                        readiness: this.journeyData.confidence || 75
                    };
                }
                
                // If we have valid journey data, use it
                if (this.journeyData.planGenerated && this.journeyData.goalIds && this.journeyData.goalIds.length > 0) {
                    return;
                }
                
                console.log('⚠️ Local journey data exists but incomplete, trying API fallback...');
            } catch (error) {
                console.error('Error parsing journey data from localStorage:', error);
            }
        }
        
        // If no demo data, try to load from API
        try {
            const response = await fetch(`${this.apiBase}/dreams/active`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data && data.data.length > 0) {
                    this.journeyData = data.data[0]; // Get the first active dream
                    console.log('🔍 LOADED JOURNEY DATA:', {
                        currentDay: this.journeyData.currentDay,
                        planGenerated: this.journeyData.planGenerated,
                        goalIds: this.journeyData.goalIds?.length,
                        journeyStartDate: this.journeyData.journeyStartDate
                    });
                    
                    // Check if journey is properly set up
                    if (!this.journeyData.planGenerated || !this.journeyData.goalIds || this.journeyData.goalIds.length === 0) {
                        // Journey not properly generated - redirect to create one
                        window.location.href = '/journey.html';
                        return;
                    }
                } else {
                    throw new Error('No active journey found');
                }
            } else {
                throw new Error('Failed to load journey data');
            }
        } catch (error) {
            console.error('Error loading journey data from API:', error);
            
            // Try to create a default journey structure if we have user data
            const userData = localStorage.getItem('user');
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    console.log('📋 Creating fallback journey for user:', user.name);
                    
                    // Create a basic fallback journey
                    this.journeyData = {
                        dreamText: "Ready to start your professional journey",
                        confidence: 75,
                        timeHorizon: 12,
                        timeCommitment: 'focused-blocks',
                        learningStyle: 'hands-on',
                        planGenerated: true,
                        currentDay: 1,
                        goalIds: ['fallback-goal-1', 'fallback-goal-2', 'fallback-goal-3'],
                        assessmentScores: {
                            readiness: 75
                        }
                    };
                    
                    // Save fallback journey to localStorage
                    localStorage.setItem('currentJourney', JSON.stringify(this.journeyData));
                    console.log('✅ Created fallback journey structure');
                    return;
                } catch (parseError) {
                    console.error('Error creating fallback journey:', parseError);
                }
            }
            
            // Last resort - redirect to create one
            console.log('❌ No journey data available, redirecting to create one');
            setTimeout(() => {
                window.location.href = '/journey.html';
            }, 2000);
            // Don't throw error - let the page continue loading while redirect happens
        }
    }

    async generateStageNames() {
        // First try to load from DreamDiscovery data
        try {
            const discoveryData = await this.loadDreamDiscoveryData();
            if (discoveryData && discoveryData.weekThemes) {
                // Use week themes from LLM-generated plan
                this.stageNames = this.createStageNamesFromWeekThemes(discoveryData.weekThemes);
                console.log('✅ Using stage names from DreamDiscovery:', this.stageNames);
                return;
            }
        } catch (error) {
            console.log('DreamDiscovery data not available, falling back to dynamic generation');
        }

        // Fallback to LLM generation or dynamic names
        try {
            const prompt = `Based on this user's dream: "${this.journeyData.dreamText}"
            
Generate exactly 6 inspiring stage names for a 21-day transformation journey. Each stage represents 3 days of focused work.

Return ONLY a JSON array of 6 stage names, like:
["Stage 1", "Stage 2", "Stage 3", "Stage 4", "Stage 5", "Stage 6"]

The names should be:
- Inspiring and motivational
- Specific to their dream/goal
- Progressive (building on each other)
- 2-3 words each

Dream context: ${this.journeyData.dreamText}`;

            const llmResponse = await this.callLLM(prompt);
            
            try {
                this.stageNames = JSON.parse(llmResponse);
            } catch (parseError) {
                // Generate dynamic fallback stage names
                this.stageNames = this.generateDynamicStageNames();
            }
        } catch (error) {
            console.log('Using fallback stage names (LLM unavailable)');
            // Generate dynamic fallback stage names
            this.stageNames = this.generateDynamicStageNames();
        }
    }

    generateDynamicStageNames() {
        const dreamKeywords = this.extractDreamKeywords(this.journeyData.dreamText);
        
        // Generate meaningful stage names based on the user's specific dream
        return [
            `${dreamKeywords.field} Start`,
            `${dreamKeywords.skill} Learning`,
            `Network Building`,
            `Practical Experience`,
            `Skill Growth`,
            `Goal Progress`
        ];
    }

    async calculateProgress() {
        console.log('📊 Starting simple progress calculation...');
        
        try {
            // Get user's login count and task completion status
            const userProgress = await this.getUserProgressFromDB();
            
            console.log('📈 User progress data:', userProgress);
            
            // Always prioritize server's currentDay from journey data
            console.log('🔍 Journey data currentDay:', this.journeyData?.currentDay, 'planGenerated:', this.journeyData?.planGenerated);
            console.log('🔍 Current this.currentDay before main logic:', this.currentDay);
            
            // ALWAYS prioritize newly generated plans to start at day 1
            if (this.journeyData && this.journeyData.planGenerated) {
                // Check if this is a newly generated plan (within last 24 hours)
                const now = new Date();
                const planDate = this.journeyData.planGeneratedAt ? new Date(this.journeyData.planGeneratedAt) : null;
                const isNewPlan = planDate && (now - planDate) < (24 * 60 * 60 * 1000); // 24 hours
                
                if (isNewPlan) {
                    console.log('📅 New plan detected (within 24h) - forcing start at day 1');
                    this.currentDay = 1;
                    console.log('📅 Set this.currentDay to (new plan):', this.currentDay);
                    
                    // Also update the server if it has wrong currentDay
                    if (this.journeyData.currentDay !== 1) {
                        console.log('🔧 Server has wrong currentDay, will update it');
                        this.updateServerCurrentDay(1);
                    }
                } else if (this.journeyData.currentDay !== undefined && this.journeyData.currentDay !== null && this.journeyData.currentDay > 0) {
                    console.log('📅 Using server\'s authoritative currentDay:', this.journeyData.currentDay);
                    this.currentDay = this.journeyData.currentDay;
                    console.log('📅 Set this.currentDay to (server):', this.currentDay);
                } else {
                    console.log('📅 Plan exists but no valid currentDay - defaulting to 1');
                    this.currentDay = 1;
                    console.log('📅 Set this.currentDay to (default):', this.currentDay);
                }
            } else {
                // For journeys without planGenerated flag, start at day 1
                console.log('📅 No plan generated flag - starting at day 1');
                this.currentDay = 1;
                console.log('📅 Set this.currentDay to (no plan):', this.currentDay);
            }
            
            // Calculate streak based on consecutive completed days
            this.currentStreak = userProgress.currentStreak || 0;
            
            // Calculate XP based on completed tasks
            this.userXP = userProgress.completedTasks * 10;
            
            console.log(`✅ Progress calculated: Day ${this.currentDay}, Streak: ${this.currentStreak}, XP: ${this.userXP}`);
            
            // Save progress to database
            await this.saveProgressToDatabase();
            
        } catch (error) {
            console.error('❌ Error calculating progress:', error);
            // Fallback to Day 1 for new users
            this.currentDay = 1;
            // Legacy streak tracking removed
            this.overallScore = 0;
            await this.saveProgressToDatabase();
        }
    }

    async getUserProgressFromDB() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return { loginCount: 1, completedTasks: 0, currentStreak: 0 };
            
            const response = await fetch(`${this.apiBase}/users/progress`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return {
                    loginCount: data.loginCount || 1,
                    completedTasks: data.completedTasks || 0,
                    currentStreak: data.currentStreak || 0
                };
            } else {
                console.log('⚠️ Could not fetch user progress, using defaults');
                return { loginCount: 1, completedTasks: 0, currentStreak: 0 };
            }
        } catch (error) {
            console.error('Error fetching user progress:', error);
            return { loginCount: 1, completedTasks: 0, currentStreak: 0 };
        }
    }

    isNewJourney() {
        console.log('🔍 Checking if this is a new journey...');
        console.log('📋 Journey data:', this.journeyData);
        
        // Priority check: If no journey data, definitely new
        if (!this.journeyData) {
            console.log('   ✅ No journey data - NEW JOURNEY');
            return true;
        }
        
        // 1. Check preserved URL parameter state first (highest priority)
        if (this._isNewJourneyFromURL) {
            console.log('   ✅ Preserved URL parameter ?new=true - NEW JOURNEY');
            return true;
        }
        
        // Legacy check for URL parameter (in case direct access)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('new') === 'true') {
            console.log('   ✅ URL parameter ?new=true - NEW JOURNEY');
            return true;
        }
        
        // 2. Check if this is demo data (always treat as new)
        if (this.journeyData.goalIds?.includes('demo-goal-1') || this.journeyData.goalIds?.includes('fallback-goal-1')) {
            console.log('   ✅ Demo/fallback data detected - ALWAYS NEW JOURNEY');
            return true;
        }
        
        // 3. No journey start date
        if (!this.journeyData.journeyStartDate) {
            console.log('   ✅ No journey start date - NEW JOURNEY');
            return true;
        }
        
        // 4. Plan was just generated (planGeneratedAt is very recent - within 60 minutes)
        if (this.journeyData.planGeneratedAt) {
            const now = new Date();
            const planAge = Math.floor((now - new Date(this.journeyData.planGeneratedAt)) / (1000 * 60)); // Age in minutes
            console.log(`   📅 Plan generated ${planAge} minutes ago`);
            if (planAge < 60) {
                console.log('   ✅ Plan generated recently - NEW JOURNEY');
                return true;
            }
        }
        
        // 5. Journey was created very recently (within 60 minutes)
        const startDate = new Date(this.journeyData.journeyStartDate);
        const now = new Date();
        const journeyAge = Math.floor((now - startDate) / (1000 * 60)); // Age in minutes
        console.log(`   📅 Journey started ${journeyAge} minutes ago`);
        if (journeyAge < 60) {
            console.log('   ✅ Journey created recently - NEW JOURNEY');
            return true;
        }
        
        // 6. Check user login count (new users should start at Day 1)
        if (this.currentUser && this.currentUser.data && (this.currentUser.data.loginCount || 0) <= 2) {
            console.log(`   ✅ New user (login count: ${this.currentUser.data.loginCount || 0}) - NEW JOURNEY`);
            return true;
        }
        
        // 7. Check if no progress has been saved yet
        const savedProgress = this.loadSavedProgressSync();
        if (!savedProgress) {
            console.log('   ✅ No saved progress found - NEW JOURNEY');
            return true;
        }
        
        console.log('   ❌ Existing journey detected - NOT NEW JOURNEY');
        return false;
    }

    loadSavedProgressSync() {
        // Synchronous version to check if progress exists
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return null;
            
            // Check if this is demo/fallback data
            if (this.journeyData && (this.journeyData.goalIds?.includes('demo-goal-1') || this.journeyData.goalIds?.includes('fallback-goal-1'))) {
                console.log('🎯 Demo/fallback data - forcing fresh start');
                return null; // Always treat demo/fallback as new
            }
            
            // Check URL parameter
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('new') === 'true') {
                console.log('🎯 URL parameter ?new=true - forcing fresh start');
                return null;
            }
            
            // Check localStorage for any existing progress
            const savedProgress = localStorage.getItem('journeyProgress');
            if (savedProgress) {
                try {
                    const progress = JSON.parse(savedProgress);
                    console.log('📚 Found saved progress in localStorage:', progress);
                    return progress;
                } catch (e) {
                    console.warn('Invalid saved progress in localStorage');
                    return null;
                }
            }
            
            // No saved progress found
            return null;
        } catch (error) {
            console.error('Error loading saved progress:', error);
            return null;
        }
    }

    async calculateTaskBasedProgress() {
        try {
            console.log('📊 Calculating task-based progress...');
            console.log('🔍 DEBUG: isNewJourney():', this.isNewJourney());
            console.log('🔍 DEBUG: journeyData:', this.journeyData);
            console.log('🔍 DEBUG: journeyData.currentDay:', this.journeyData?.currentDay);
            console.log('🔍 DEBUG: current this.currentDay before logic:', this.currentDay);
            
            // CRITICAL: For new journeys, respect the server's authoritative currentDay
            if (this.isNewJourney() || (this.journeyData && this.journeyData.currentDay !== undefined)) {
                console.log('🚨 CRITICAL: New journey or server currentDay detected - respecting server value');
                const serverCurrentDay = this.journeyData?.currentDay || 1;
                this.currentDay = serverCurrentDay;
                console.log('📅 Using server authoritative currentDay:', serverCurrentDay);
                console.log('📅 Set this.currentDay to:', this.currentDay);
                // Legacy streak tracking removed
                this.overallScore = 0;
                await this.saveProgressToDatabase();
                return; // Skip task-based calculation for new journeys
            }
            
            console.log('⚠️ WARNING: Proceeding with task-based calculation (not a new journey)');
            
            // Load all tasks for the journey
            const allTasks = await this.loadAllJourneyTasks();
            
            if (!allTasks || allTasks.length === 0) {
                console.log('⚠️ No tasks found - starting from Day 1');
                this.currentDay = 1;
                // Legacy streak tracking removed
                this.overallScore = 0;
                await this.saveProgressToDatabase();
                return;
            }
            
            // Group tasks by day and check completion status
            const tasksByDay = this.groupTasksByDay(allTasks);
            let completedDays = 0;
            let consecutiveDays = 0;
            
            console.log('📋 Checking task completion for each day...');
            
            // Check each day from 1 to 21
            for (let day = 1; day <= 21; day++) {
                const dayTasks = tasksByDay[day] || [];
                
                if (dayTasks.length === 0) {
                    // No tasks planned for this day - skip it, don't count as completed
                    console.log(`Day ${day}: No tasks planned`);
                    continue;
                }
                
                // Check if all tasks for this day are completed or postponed
                const completedTasks = dayTasks.filter(task => 
                    task.completed || task.status === 'completed' || task.status === 'postponed'
                );
                
                const completionRate = completedTasks.length / dayTasks.length;
                console.log(`Day ${day}: ${completedTasks.length}/${dayTasks.length} tasks completed (${Math.round(completionRate * 100)}%)`);
                
                if (completedTasks.length === dayTasks.length) {
                    // All tasks for this day are done
                    completedDays++;
                    consecutiveDays++;
                } else {
                    // Some tasks are still pending - stop progression here
                    console.log(`Day ${day}: Tasks pending - progression stops here`);
                    break;
                }
            }
            
            // Set current day as the next day to work on (minimum Day 1)
            this.currentDay = Math.max(1, Math.min(completedDays + 1, 21));
            this.currentStreak = consecutiveDays;
            
            // Calculate XP based on completed days and milestones
            this.userXP = (completedDays * 10) + this.calculateMilestoneXP(completedDays);
            
            console.log(`📈 Progress calculated: Day ${this.currentDay}, Streak: ${this.currentStreak}, XP: ${this.userXP}`);
            
            // Save progress to database
            await this.saveProgressToDatabase();
            
        } catch (error) {
            console.error('❌ Error calculating task-based progress:', error);
            // Fallback to day 1 if calculation fails
            this.currentDay = 1;
            // Legacy streak tracking removed
            this.overallScore = 0;
            await this.saveProgressToDatabase();
        }
    }

    async loadAllJourneyTasks() {
        // Return cached tasks if available
        if (this._cachedTasks) {
            console.log('📋 Using cached journey tasks...');
            return this._cachedTasks;
        }
        
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return [];
            
            // Check if this is demo/fallback data first
            if (this.journeyData && (this.journeyData.goalIds?.includes('demo-goal-1') || this.journeyData.goalIds?.includes('fallback-goal-1'))) {
                return this.getDemoTasks();
            }
            
            // Get all goals and their tasks
            const goalsResponse = await fetch(`${this.apiBase}/goals`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (goalsResponse.ok) {
                const goalsData = await goalsResponse.json();
                if (goalsData.success && goalsData.data) {
                    let allTasks = [];
                    
                    goalsData.data.forEach(goal => {
                        if (goal.tasks) {
                            goal.tasks.forEach(task => {
                                // Create task object with proper status mapping
                                const taskObj = {
                                    id: task._id,
                                    title: task.name,
                                    description: task.description || '',
                                    completed: task.completed || task.status === 'completed',
                                    status: task.status || (task.completed ? 'completed' : 'pending'),
                                    estTime: task.estTime || 30,
                                    goalTitle: goal.title,
                                    scheduledDate: task.scheduledDate,
                                    // Pass raw task data for day extraction
                                    day: task.day,
                                    weekOf: goal.weekOf,
                                    createdAt: task.createdAt
                                };
                                
                                // Extract journey day from the task
                                taskObj.day = this.extractDayFromTask(taskObj);
                                
                                allTasks.push(taskObj);
                            });
                        }
                    });
                    
                    return allTasks;
                }
            }
            
            return [];
        } catch (error) {
            console.error('Error loading all journey tasks:', error);
            return [];
        }
    }

    extractDayFromTask(task) {
        // 1. Check if task has a direct journeyDay property
        if (task.journeyDay && typeof task.journeyDay === 'number') {
            return task.journeyDay;
        }
        
        // 2. Check if task.day is already a number
        if (task.day && typeof task.day === 'number') {
            return task.day;
        }
        
        // 3. Check if task.day is a string number
        if (task.day && typeof task.day === 'string' && /^\d+$/.test(task.day)) {
            return parseInt(task.day);
        }
        
        // 4. Handle weekday format (Mon, Tue, Wed, etc.) from database
        if (task.day && typeof task.day === 'string') {
            const weekdayToJourneyDay = this.mapWeekdayToJourneyDay(task.day, task);
            if (weekdayToJourneyDay) {
                return weekdayToJourneyDay;
            }
        }
        
        // 5. Try to extract from task name or description
        const dayMatch = (task.name || '').match(/day\s*(\d+)/i) || 
                        (task.description || '').match(/day\s*(\d+)/i);
        if (dayMatch) return parseInt(dayMatch[1]);
        
        // 6. Try to extract from scheduled date relative to journey start
        if (task.scheduledDate && this.journeyData.journeyStartDate) {
            const startDate = new Date(this.journeyData.journeyStartDate);
            const taskDate = new Date(task.scheduledDate);
            const daysDiff = Math.floor((taskDate - startDate) / (1000 * 60 * 60 * 24));
            return Math.max(1, daysDiff + 1);
        }
        
        // 7. Default assignment based on goal week
        return this.assignDefaultJourneyDay(task);
    }

    mapWeekdayToJourneyDay(weekday, task) {
        // Map weekdays to journey days based on goal week
        const weekdayMap = {
            'Mon': 1, 'Monday': 1,
            'Tue': 2, 'Tuesday': 2, 
            'Wed': 3, 'Wednesday': 3,
            'Thu': 4, 'Thursday': 4,
            'Fri': 5, 'Friday': 5,
            'Sat': 6, 'Saturday': 6,
            'Sun': 7, 'Sunday': 7
        };
        
        const baseDay = weekdayMap[weekday];
        if (!baseDay) {
            console.log(`   ❌ Unknown weekday: ${weekday}`);
            return null;
        }
        
        // Determine which week this task belongs to
        const weekOffset = this.getTaskWeekOffset(task);
        
        // Calculate journey day: (week * 7) + weekday
        const journeyDay = (weekOffset * 7) + baseDay;
        
        console.log(`   📅 Mapping: ${weekday} (${baseDay}) + Week ${weekOffset + 1} offset = Day ${journeyDay} for task "${task.title}"`);
        
        return journeyDay;
    }

    getTaskWeekOffset(task) {
        // Try to extract week from goal title
        if (task.goalTitle) {
            const weekMatch = task.goalTitle.match(/week\s*(\d+)/i);
            if (weekMatch) {
                return parseInt(weekMatch[1]) - 1; // Convert to 0-based offset
            }
        }
        
        // Try to extract from scheduled date
        if (task.scheduledDate && this.journeyData.journeyStartDate) {
            const startDate = new Date(this.journeyData.journeyStartDate);
            const taskDate = new Date(task.scheduledDate);
            const daysDiff = Math.floor((taskDate - startDate) / (1000 * 60 * 60 * 24));
            return Math.floor(daysDiff / 7);
        }
        
        // Default to week 0 (first week)
        return 0;
    }

    assignDefaultJourneyDay(task) {
        // If we can't determine the day, assign based on creation order
        // This is a fallback to ensure all tasks get assigned to some day
        return 1;
    }

    groupTasksByDay(tasks) {
        const tasksByDay = {};
        
        console.log('📋 Grouping tasks by day...');
        
        tasks.forEach(task => {
            const day = task.day || 1;
            if (!tasksByDay[day]) {
                tasksByDay[day] = [];
            }
            tasksByDay[day].push(task);
            
            console.log(`   Task "${task.title}" assigned to Day ${day} (goalTitle: "${task.goalTitle}", originalDay: "${task.day}", status: "${task.status}")`);
        });
        
        // Log summary
        Object.keys(tasksByDay).sort((a, b) => parseInt(a) - parseInt(b)).forEach(day => {
            const dayTasks = tasksByDay[day];
            const completedCount = dayTasks.filter(t => t.completed || t.status === 'completed' || t.status === 'postponed').length;
            console.log(`   Day ${day}: ${dayTasks.length} tasks, ${completedCount} completed`);
        });
        
        return tasksByDay;
    }

    calculateMilestoneXP(completedDays) {
        let milestoneXP = 0;
        
        // Give bonus XP for completing stages (every 3-4 days)
        this.journeyStructure.stages.forEach(stage => {
            const stageMaxDay = Math.max(...stage.days);
            if (completedDays >= stageMaxDay) {
                milestoneXP += 100; // 100 XP per completed stage
            }
        });
        
        // Bonus for milestones
        if (completedDays >= 7) milestoneXP += 50;   // Week 1 bonus
        if (completedDays >= 14) milestoneXP += 50;  // Week 2 bonus
        if (completedDays >= 21) milestoneXP += 100; // Journey completion bonus
        
        return milestoneXP;
    }

    async saveProgressToDatabase() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;
            
            const progressData = {
                currentDay: this.currentDay,
                currentStreak: this.currentStreak,
                userXP: this.userXP,
                lastUpdated: new Date().toISOString(),
                useTaskBasedProgress: true
            };
            
            // Save to localStorage for immediate access
            localStorage.setItem('journeyProgress', JSON.stringify(progressData));
            
            // Also save to database (use users progress endpoint)
            await fetch(`${this.apiBase}/users/progress`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentDay: this.currentDay,
                    currentStreak: this.currentStreak || 0,
                    userXP: this.userXP || 0
                })
            });
            
            console.log(`💾 Progress saved: Day ${this.currentDay}, Streak: ${this.currentStreak}, XP: ${this.userXP}`);
            
        } catch (error) {
            console.error('Error saving progress to database:', error);
        }
    }

    getDemoTasks() {
        // Return demo tasks for NEW journey - all tasks should be pending to ensure Day 1 start
        return [
            {
                id: 'demo-task-1',
                title: 'Define Your Dream Vision',
                completed: false,
                status: 'pending',
                day: 1
            },
            {
                id: 'demo-task-2',
                title: 'Research Your Target Field',
                completed: false, 
                status: 'pending',
                day: 1
            },
            {
                id: 'demo-task-3',
                title: 'Set Learning Goals',
                completed: false,
                status: 'pending',
                day: 2
            },
            {
                id: 'demo-task-4',
                title: 'Complete Skill Building Activity',
                completed: false,
                status: 'pending', 
                day: 2
            },
            {
                id: 'demo-task-5',
                title: 'Create First Project',
                completed: false,
                status: 'pending',
                day: 3
            },
            {
                id: 'demo-task-6',
                title: 'Test Your Progress',
                completed: false,
                status: 'pending',
                day: 3
            }
        ];
    }

    async loadSavedProgress() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return null;
            
            // Check if this is demo data first
            if (this.journeyData && (this.journeyData.dreamId === undefined || this.journeyData.goalIds?.includes('demo-goal-1'))) {
                // This is demo data, return default progress
                return {
                    currentDay: 1,
                    currentStreak: 0,
                    userXP: 0
                };
            }
            
            const response = await fetch(`${this.apiBase}/dreams/${this.journeyData._id}/progress`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    return data.data;
                }
            }
        } catch (error) {
            console.error('Error loading saved progress:', error);
        }
        return null;
    }

    async loadAndDisplayScores() {
        try {
            console.log('📊 Loading stage-aware user profile...');
            const token = getAuthToken();
            if (!token) {
                console.log('No auth token found, redirecting to login');
                logout();
                return;
            }

            const response = await fetch(`${this.apiBase}/scoring/user-scores`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                console.log('Token expired, redirecting to login');
                logout();
                return;
            }

            if (response.ok) {
                const profileData = await response.json();
                console.log('✅ Profile loaded:', profileData);
                
                // Store stage information
                this.currentStage = profileData.stage;
                this.stageProfile = profileData.stageProfile;
                this.progressionResult = profileData.progressionResult;
                
                // Display stage-specific UI
                this.displayStageSpecificUI(profileData);
            } else {
                console.log('⚠️ No profile available yet, showing default discovery stage');
                await this.displayDefaultDiscoveryStage();
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            await this.displayDefaultDiscoveryStage();
        }
    }

    /**
     * Display stage-specific UI based on user's current stage
     */
    displayStageSpecificUI(profileData) {
        const stage = profileData.stage;
        console.log('🎯 Stage detection - profileData:', profileData);
        console.log('🎯 Detected stage:', stage);
        console.log('🎯 User stage from currentUser:', this.currentUser?.userStage);
        
        // Check both profileData.stage and user.userStage for Discovery Stage
        const isDiscoveryStage = stage === 'discovery' || this.currentUser?.userStage === 'discovery';
        
        if (isDiscoveryStage) {
            console.log('✅ Discovery Stage detected - loading Self Discovery cards');
            this.displayDiscoveryStage(profileData);
        } else if (stage === 'onboarding') {
            console.log('📚 Onboarding Stage detected');
            this.displayOnboardingStage(profileData);
        } else {
            console.log('⚠️ Unknown stage, defaulting to onboarding. Stage:', stage);
            // Default to onboarding for unknown stages
            this.displayOnboardingStage(profileData);
        }
        
        // Update stage indicator
        this.updateStageIndicator(stage || this.currentUser?.userStage || 'discovery');
    }

    /**
     * Display Discovery Stage UI with Self Discovery Cards
     */
    async displayDiscoveryStage(profileData) {
        console.log('🌟 Displaying Self Discovery Stage UI with engine-driven cards');
        
        // Hide onboarding elements and show discovery elements
        this.hideOnboardingElements();
        this.showDiscoveryElements();
        
        // Load Self Discovery Stage cards
        await this.loadSelfDiscoveryCards();
        
        // Update daily message for discovery stage
        this.updateDailyMessage('discovery');
    }

    /**
     * Display Onboarding Stage UI (existing 5-dimension system)
     */
    displayOnboardingStage(profileData) {
        console.log('🎓 Displaying Onboarding Stage UI');
        
        const stageProfile = profileData.stageProfile;
        
        // Show 5-dimension scores and hide discovery metrics
        this.showOnboardingElements();
        this.hideDiscoveryElements();
        
        // Use existing 5-dimension display logic
        if (stageProfile.dimensionScores) {
            this.displayScores(stageProfile.dimensionScores);
        } else {
            // Fallback to backward compatibility
            this.displayScores(profileData.scores || {
                readiness: 0,
                clarity: 0,
                commitment: 0,
                growth: 0,
                opportunity: 0
            });
        }
        
        // Achievements and progression removed from UI
        
        // Update insights and recommendations
        this.updateInsights(stageProfile.insights);
        this.updateRecommendations(stageProfile.recommendations);
        
        // Update overall score and current focus
        this.updateOverallScore(stageProfile.overallScore);
        this.updateCurrentFocus('Personal Growth');
        
        // Update daily message
        this.updateDailyMessage('onboarding');
    }

    /**
     * Display default discovery stage for new users
     */
    async displayDefaultDiscoveryStage() {
        console.log('🌱 Displaying default Discovery Stage with Self Discovery cards');
        
        this.currentStage = 'discovery';
        this.hideOnboardingElements();
        this.showDiscoveryElements();
        
        // Load Self Discovery Stage cards (same as full Discovery Stage)
        await this.loadSelfDiscoveryCards();
        
        // Update daily message for discovery stage
        this.updateDailyMessage('discovery');
    }

    /**
     * Discovery Stage Helper Methods
     */
    hideOnboardingElements() {
        const elements = document.querySelectorAll('.onboarding-only');
        elements.forEach(el => el.style.display = 'none');
        
        // Hide 5-dimension scores
        const scoreElements = document.querySelectorAll('.dimension-score');
        scoreElements.forEach(el => el.style.display = 'none');
    }

    showDiscoveryElements() {
        const elements = document.querySelectorAll('.discovery-only');
        elements.forEach(el => el.style.display = 'block');
        
        // Show discovery metrics
        const discoveryContainer = document.getElementById('discovery-metrics');
        if (discoveryContainer) {
            discoveryContainer.style.display = 'block';
        }
    }

    hideDiscoveryElements() {
        const elements = document.querySelectorAll('.discovery-only');
        elements.forEach(el => el.style.display = 'none');
        
        // Hide discovery metrics
        const discoveryContainer = document.getElementById('discovery-metrics');
        if (discoveryContainer) {
            discoveryContainer.style.display = 'none';
        }
    }

    showOnboardingElements() {
        const elements = document.querySelectorAll('.onboarding-only');
        elements.forEach(el => el.style.display = 'block');
        
        // Show 5-dimension scores
        const scoreElements = document.querySelectorAll('.dimension-score');
        scoreElements.forEach(el => el.style.display = 'block');
    }

    /**
     * Load Self Discovery Stage cards using the discovery-cards API
     */
    async loadSelfDiscoveryCards() {
        try {
            console.log('🔄 Loading Self Discovery Stage cards...');
            console.log('Current user:', this.currentUser);
            console.log('Journey data:', this.journeyData);
            
            // Show loading state
            this.showDiscoveryCardsLoading();
            
            // Get the current dream ID
            const dreamId = this.getCurrentDreamId();
            console.log('Dream ID found:', dreamId);
            
            if (!dreamId) {
                console.error('❌ No dream ID available - user data:', this.currentUser);
                // Show fallback UI with sample data instead of error
                this.displayFallbackDiscoveryCards();
                return;
            }
            
            const apiUrl = `${this.apiBase}/dreams/${dreamId}/discovery-cards`;
            console.log('API URL:', apiUrl);
            
            // Fetch discovery cards data
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('API Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error response:', errorText);
                throw new Error(`Failed to load discovery cards: ${response.status} - ${errorText}`);
            }
            
            const discoveryData = await response.json();
            console.log('✅ Discovery cards data loaded:', discoveryData);
            
            // Check if data is in expected format
            if (!discoveryData || !discoveryData.data) {
                console.error('❌ Invalid discovery data format:', discoveryData);
                throw new Error('Invalid discovery data format received');
            }
            
            // Update the UI with the loaded data
            this.displayDiscoveryCards(discoveryData.data);
            
        } catch (error) {
            console.error('❌ Error loading discovery cards:', error);
            console.error('Error stack:', error.stack);
            
            // Show error state but also populate with default values
            this.showDiscoveryCardsError();
            
            // Still update sidebar with default values so it's not empty
            this.updateDiscoveryMetrics({
                commitment: 0,
                clarity: 0,
                growthReadiness: 0,
                competency: 0,
                opportunity: 0
            });
        }
    }
    
    /**
     * Display the discovery cards data in the UI
     */
    displayDiscoveryCards(data) {
        console.log('🎨 Displaying discovery cards:', data);
        
        // Hide loading and show content
        this.hideDiscoveryCardsLoading();
        this.showDiscoveryCardsContent();
        
        // Update progress overview
        this.updateProgressOverview(data);
        
        // Update 5-dimension scores in sidebar
        this.updateDiscoveryMetrics(data.scores);
        
        // Update detailed cards
        this.updateDimensionCards(data.scores);
        
        // Update overall score
        this.updateOverallScore(data.scores.overall || 0);
        
        // Update insights and recommendations
        if (data.insights) this.updateInsights(data.insights);
        if (data.recommendations) this.updateRecommendations(data.recommendations);
    }
    
    /**
     * Update progress overview (Planner, Tracker, Scoring engines)
     */
    updateProgressOverview(data) {
        // Planner Engine progress
        const plannerEl = document.getElementById('planner-progress');
        if (plannerEl && data.plannerData) {
            const progress = data.plannerData.goalsCreated || 0;
            plannerEl.textContent = `${progress}`;
        }
        
        // Tracker Engine progress  
        const trackerEl = document.getElementById('tracker-progress');
        if (trackerEl && data.trackerData) {
            const progress = Math.round((data.trackerData.completedTasks / Math.max(1, data.trackerData.totalTasks)) * 100);
            trackerEl.textContent = `${progress}%`;
        }
        
        // Scoring Engine progress
        const scoringEl = document.getElementById('scoring-progress');
        if (scoringEl && data.scores) {
            const progress = Math.round((data.scores.overall || 0) * 100);
            scoringEl.textContent = `${progress}%`;
        }
    }
    
    /**
     * Update dimension cards with detailed scores and insights
     */
    updateDimensionCards(scores) {
        // Commitment Card
        this.updateDimensionCard('commitment', scores.commitment || 0, this.getDimensionInsights('commitment', scores));
        
        // Clarity Card
        this.updateDimensionCard('clarity', scores.clarity || 0, this.getDimensionInsights('clarity', scores));
        
        // Adaptability Card
        this.updateDimensionCard('growth-readiness', scores.growthReadiness || 0, this.getDimensionInsights('growthReadiness', scores));
        
        // Locked dimensions (show calculated values but grayed out)
        this.updateDimensionCard('competency', scores.competency || 0, ['Building foundation...']);
        this.updateDimensionCard('opportunity', scores.opportunity || 0, ['Preparing for next stage...']);
    }
    
    /**
     * Update individual dimension card
     */
    updateDimensionCard(dimension, score, insights) {
        // Update score display
        const scoreEl = document.getElementById(`${dimension}-card-score`);
        if (scoreEl) {
            scoreEl.textContent = `${Math.round(score * 100)}%`;
        }
        
        // Update insights
        const insightsEl = document.getElementById(`${dimension}-insights`);
        if (insightsEl && insights) {
            insightsEl.innerHTML = insights.slice(0, 2).map(insight => 
                `<div class="mb-1">• ${insight}</div>`
            ).join('');
        }
    }
    
    /**
     * Generate dimension-specific insights
     */
    getDimensionInsights(dimension, scores) {
        const score = scores[dimension] || 0;
        const percentage = Math.round(score * 100);
        
        switch (dimension) {
            case 'commitment':
                if (percentage >= 70) return ['Strong consistency pattern', 'Excellent follow-through'];
                if (percentage >= 40) return ['Building good habits', 'Room for more consistency'];
                return ['Focus on daily engagement', 'Start with small commitments'];
                
            case 'clarity':
                if (percentage >= 70) return ['Clear goal definition', 'Strong strategic thinking'];
                if (percentage >= 40) return ['Goals taking shape', 'Continue refining vision'];
                return ['Explore your vision more', 'Define specific outcomes'];
                
            case 'growthReadiness':
                if (percentage >= 70) return ['Highly adaptable mindset', 'Embraces learning'];
                if (percentage >= 40) return ['Open to feedback', 'Growing mindset'];
                return ['Embrace new experiences', 'Be open to change'];
                
            default:
                return ['Building progress...'];
        }
    }
    
    /**
     * Get current dream ID for API calls
     */
    getCurrentDreamId() {
        // Try to get from journey data first
        if (this.journeyData && this.journeyData.dreamId) {
            return this.journeyData.dreamId;
        }
        
        // Fallback to user data
        if (this.currentUser && this.currentUser.dreams && this.currentUser.dreams.length > 0) {
            return this.currentUser.dreams[this.currentUser.dreams.length - 1]._id;
        }
        
        return null;
    }
    
    /**
     * Show/hide discovery cards states
     */
    showDiscoveryCardsLoading() {
        this.toggleElement('discovery-cards-loading', true);
        this.toggleElement('discovery-cards-container', false);
        this.toggleElement('discovery-cards-error', false);
    }
    
    hideDiscoveryCardsLoading() {
        this.toggleElement('discovery-cards-loading', false);
    }
    
    showDiscoveryCardsContent() {
        this.toggleElement('discovery-cards-container', true);
        this.toggleElement('discovery-cards-error', false);
    }
    
    showDiscoveryCardsError() {
        this.toggleElement('discovery-cards-loading', false);
        this.toggleElement('discovery-cards-container', false);
        this.toggleElement('discovery-cards-error', true);
    }

    /**
     * Display fallback discovery cards when no dream ID is available
     */
    displayFallbackDiscoveryCards() {
        console.log('🎨 Displaying fallback discovery cards for users without dreams');
        
        // Hide loading and show content
        this.hideDiscoveryCardsLoading();
        this.showDiscoveryCardsContent();
        
        // Sample fallback data for new users
        const fallbackData = {
            plannerData: {
                progress: 0,
                message: 'Create your first dream to start planning'
            },
            trackerData: {
                progress: 0,
                message: 'Start tracking your activities'
            },
            scores: {
                commitment: 10,
                clarity: 5,
                growthReadiness: 15,
                competency: 0,
                opportunity: 0,
                overall: 10
            },
            insights: [{
                type: 'welcome',
                message: 'Welcome to your Self Discovery journey! Start by creating your first dream.'
            }],
            recommendations: [{
                priority: 'high',
                title: 'Create Your First Dream',
                description: 'Define what you want to achieve to unlock personalized insights.'
            }]
        };
        
        // Update progress overview
        this.updateProgressOverview(fallbackData);
        
        // Update 5-dimension scores in sidebar
        this.updateDiscoveryMetrics(fallbackData.scores);
        
        // Update detailed cards
        this.updateDimensionCards(fallbackData.scores);
        
        // Update overall score
        this.updateOverallScore(fallbackData.scores.overall || 10);
        
        // Update insights and recommendations
        this.updateInsights(fallbackData.insights);
        this.updateRecommendations(fallbackData.recommendations);
    }
    
    toggleElement(elementId, show) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.toggle('hidden', !show);
        }
    }

    updateDiscoveryMetrics(scores) {
        console.log('📊 Updating discovery metrics with 5-dimension scores:', scores);
        
        // Update commitment score in sidebar
        const commitmentEl = document.getElementById('commitment-score-discovery');
        if (commitmentEl) {
            commitmentEl.textContent = `${Math.round((scores.commitment || 0) * 100)}%`;
        }
        
        // Update clarity score in sidebar
        const clarityEl = document.getElementById('clarity-score-discovery');
        if (clarityEl) {
            clarityEl.textContent = `${Math.round((scores.clarity || 0) * 100)}%`;
        }
        
        // Update adaptability score in sidebar
        const growthEl = document.getElementById('growth-readiness-score-discovery');
        if (growthEl) {
            growthEl.textContent = `${Math.round((scores.growthReadiness || 0) * 100)}%`;
        }
        
        // Update locked scores (competency and opportunity)
        const competencyEl = document.getElementById('competency-score-discovery');
        if (competencyEl) {
            competencyEl.textContent = `${Math.round((scores.competency || 0) * 100)}%`;
        }
        
        const opportunityEl = document.getElementById('opportunity-score-discovery');
        if (opportunityEl) {
            opportunityEl.textContent = `${Math.round((scores.opportunity || 0) * 100)}%`;
        }
    }

    updateStageIndicator(stage) {
        const stageIndicator = document.getElementById('stage-indicator');
        if (stageIndicator) {
            stageIndicator.textContent = stage === 'discovery' ? 'Self Discovery' : 'Onboarding';
            stageIndicator.className = `stage-indicator ${stage}`;
        }
    }

    // Removed updateAchievements - achievements section removed from UI

    // Removed updateProgressionIndicator - stage progression section removed from UI

    updateInsights(insights) {
        const insightsContainer = document.getElementById('insights-container');
        if (insightsContainer) {
            if (insights.length === 0) {
                insightsContainer.innerHTML = '<div class="text-sm text-gray-500 text-center py-4">Insights will appear as you progress through your journey.</div>';
                return;
            }
            
            insightsContainer.innerHTML = '';
            
            insights.forEach(insight => {
                const insightEl = document.createElement('div');
                insightEl.className = `insight-item ${insight.type}`;
                insightEl.textContent = insight.message;
                insightsContainer.appendChild(insightEl);
            });
        }
    }

    updateRecommendations(recommendations) {
        const recommendationsContainer = document.getElementById('recommendations-container');
        if (recommendationsContainer) {
            if (recommendations.length === 0) {
                recommendationsContainer.innerHTML = '<div class="text-sm text-gray-500 text-center py-4">Personalized recommendations will appear here.</div>';
                return;
            }
            
            recommendationsContainer.innerHTML = '';
            
            recommendations.forEach(rec => {
                const recEl = document.createElement('div');
                recEl.className = `recommendation-item ${rec.priority}`;
                recEl.textContent = rec.action;
                recommendationsContainer.appendChild(recEl);
            });
        }
    }

    updateDailyMessage(stage) {
        const dailyMessageEl = document.getElementById('daily-message');
        if (dailyMessageEl) {
            if (stage === 'discovery') {
                dailyMessageEl.textContent = 'Ready to visit your dream today?';
            } else {
                dailyMessageEl.textContent = 'Time to develop your skills and clarity.';
            }
        }
    }

    updateOverallScore(score) {
        const overallScoreEl = document.getElementById('overall-score');
        if (overallScoreEl) {
            overallScoreEl.textContent = `${Math.round(score)}%`;
        }
    }

    updateCurrentFocus(focus) {
        const currentFocusEl = document.getElementById('current-focus');
        if (currentFocusEl) {
            currentFocusEl.textContent = focus;
        }
    }

    getAchievementDisplayName(achievement) {
        const displayNames = {
            'login_streak_3': '3-Day Streak 🔥',
            'login_streak_7': '7-Day Streak 🔥🔥',
            'login_streak_14': '14-Day Streak 🔥🔥🔥',
            'login_streak_21': '21-Day Streak 🏆',
            'dream_engagement_high': 'Dream Connector 🌟',
            'emotional_connection_established': 'Heart Connection 💖',
            'consistency_master': 'Consistency Master 🎯',
            'completion_champion': 'Completion Champion 🏃‍♂️',
            'halfway_hero': 'Halfway Hero 🚀',
            'dream_foundation_complete': 'Strong Foundation 🏗️',
            'readiness_master': 'Readiness Master 🧠',
            'clarity_master': 'Clarity Master 🔍',
            'commitment_master': 'Commitment Master 🧭',
            'growth_master': 'Growth Master 🌱',
            'opportunity_master': 'Opportunity Master 📈',
            'five_dimension_mastery': '5D Mastery 🎖️'
        };
        
        return displayNames[achievement] || achievement;
    }

    displayScores(scores) {
        const elements = {
            'readiness-score': scores.readiness,
            'clarity-score': scores.clarity,
            'commitment-score': scores.commitment,
            'growth-score': scores.growth,
            'opportunity-score': scores.opportunity
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = `${Math.round(value * 100)}%`;
            }
        });
    }

    renderSidebar() {
        // Render user dream
        const userDreamEl = document.getElementById('user-dream');
        if (userDreamEl && this.journeyData) {
            userDreamEl.textContent = this.journeyData.dreamText;
        }
    }

    async renderHeader() {
        const header = document.getElementById('motivational-header');
        
        // Generate dynamic motivational content
        const currentStage = this.getCurrentStage();
        const stageProgress = this.getStageProgress(currentStage);
        const stageName = this.stageNames[currentStage.id - 1] || `Stage ${currentStage.id}`;
        const dayInStage = currentStage.days.findIndex(day => day === this.currentDay) + 1;
        
        const motivationalContent = await this.generateMotivationalContent(currentStage, stageProgress);
        
        header.innerHTML = `
            <div class="relative overflow-hidden rounded-xl">
                <!-- Animated fading background effect -->
                <div class="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 fade-bg"></div>
                <div class="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-transparent to-purple-100/30 fade-bg" style="animation-delay: 2s;"></div>
                
                <!-- Content -->
                <div class="relative z-10 text-center py-4 px-6">
                    <h1 class="text-lg lg:text-xl font-bold text-gray-900 mb-1">
                        ${stageName} - Day ${this.currentDay}
                    </h1>
                    <p class="text-sm text-gray-600 mb-2">
                        Stage ${currentStage.id} of 6 • Day ${dayInStage} of ${currentStage.days.length} • Overall Progress: ${this.currentDay}/21
                    </p>
                    <blockquote class="text-sm font-medium text-gray-700 italic">
                        "${motivationalContent.quote}"
                    </blockquote>
                </div>
            </div>
        `;
    }

    getCurrentStage() {
        return this.journeyStructure.stages.find(stage => 
            this.currentDay >= stage.days[0] && 
            (stage.days.includes(this.currentDay) || 
             (stage.reflectionDay && this.currentDay === stage.reflectionDay))
        ) || this.journeyStructure.stages[0];
    }

    async checkStageProgression() {
        // Check if user has completed all tasks for current stage and can progress
        try {
            const allTasks = await this.loadAllJourneyTasks();
            const tasksByDay = this.groupTasksByDay(allTasks);
            const currentStage = this.getCurrentStage();
            
            // Check if all days in current stage are completed
            let stageCompleted = true;
            for (const day of currentStage.days) {
                const dayTasks = tasksByDay[day] || [];
                if (dayTasks.length > 0) {
                    const completedTasks = dayTasks.filter(task => 
                        task.completed || task.status === 'completed' || task.status === 'postponed'
                    );
                    if (completedTasks.length < dayTasks.length) {
                        stageCompleted = false;
                        break;
                    }
                }
            }
            
            if (stageCompleted && this.currentDay < Math.max(...currentStage.days)) {
                // All tasks for stage completed, advance to next stage
                const nextDay = Math.max(...currentStage.days) + 1;
                if (nextDay <= 21) {
                    this.currentDay = nextDay;
                    await this.saveProgressToDatabase();
                    this.showStageCompletion(currentStage);
                }
            }
            
        } catch (error) {
            console.error('Error checking stage progression:', error);
        }
    }

    showStageCompletion(completedStage) {
        const stageIndex = this.journeyStructure.stages.indexOf(completedStage);
        const stageName = this.stageNames[stageIndex] || `Stage ${stageIndex + 1}`;
        this.showInfo(`🏆 Stage Complete! You've finished ${stageName}. Moving to the next stage!`);
    }

    getStageProgress(stage) {
        const completedDays = stage.days.filter(day => day < this.currentDay).length;
        return {
            completed: completedDays,
            total: stage.days.length,
            percentage: Math.round((completedDays / stage.days.length) * 100)
        };
    }

    async generateMotivationalContent(currentStage, stageProgress) {
        try {
            const prompt = `Generate motivational content for day ${this.currentDay} of a 21-day journey.

User Context:
- Dream: "${this.journeyData.dreamText}"
- Current Stage: "${this.stageNames[currentStage.id - 1]}" (Stage ${currentStage.id}/6)
- Progress: ${stageProgress.completed}/${stageProgress.total} days completed in this stage
- Overall Progress: Day ${this.currentDay}/21

Generate a JSON response with:
{
  "title": "Stage-specific inspiring title",
  "subtitle": "Day ${this.currentDay} progress indicator", 
  "quote": "Motivational quote relevant to their journey",
  "stageMessage": "Encouraging message about current stage progress"
}

Make it personal, inspiring, and specific to their dream and current progress.`;

            const llmResponse = await this.callLLM(prompt);
            
            try {
                return JSON.parse(llmResponse);
            } catch (parseError) {
                throw new Error('Failed to parse LLM response');
            }
        } catch (error) {
            console.log('Using fallback motivational content (LLM unavailable)');
            // Generate dynamic fallback based on user's dream
            const dreamKeywords = this.extractDreamKeywords(this.journeyData.dreamText);
            const stageName = this.stageNames[currentStage.id - 1] || 'Current Stage';
            
            return {
                title: `${stageName} - Day ${this.currentDay}`,
                subtitle: `Stage ${currentStage.id} of 6 • ${stageProgress.percentage}% Complete`,
                quote: `Every ${dreamKeywords.field} expert started where you are now. Your ${dreamKeywords.goal} is within reach.`,
                stageMessage: `You're building toward your ${dreamKeywords.goal}! Each day of ${dreamKeywords.action} brings you closer to success.`
            };
        }
    }

    renderCurrentStage() {
        const currentStage = this.getCurrentStage();
        
        if (!currentStage) {
            console.warn('No current stage found');
            return;
        }
        
        const isReflectionDay = currentStage.reflectionDay === this.currentDay;
        
        const stageContent = document.getElementById('stage-content');
        const reflectionPanel = document.getElementById('reflection-panel');
        
        // Add null checks for required DOM elements
        if (!stageContent) {
            console.warn('stage-content element not found');
            return;
        }
        
        if (isReflectionDay) {
            // Show reflection interface
            if (reflectionPanel) {
                reflectionPanel.classList.remove('hidden');
            }
            stageContent.innerHTML = `
                <div class="text-center py-8">
                    <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">Reflection Day</h2>
                    <p class="text-gray-600 mb-4">Take a moment to reflect on your progress and insights from the past 3 days.</p>
                    <div class="bg-purple-50 rounded-lg p-4 text-left">
                        <h3 class="font-semibold text-purple-800 mb-2">Reflection Prompts:</h3>
                        <ul class="text-sm text-purple-700 space-y-1">
                            <li>• What key insights did you gain this week?</li>
                            <li>• What challenged you the most?</li>
                            <li>• What are you most proud of accomplishing?</li>
                            <li>• How will you apply what you learned moving forward?</li>
                        </ul>
                    </div>
                </div>
            `;
        } else {
            // Show regular stage content
            if (reflectionPanel) {
                reflectionPanel.classList.add('hidden');
            }
            this.renderStageContent(currentStage);
        }
    }

    async renderStageContent(stage) {
        const stageContent = document.getElementById('stage-content');
        
        if (!stageContent) {
            console.warn('stage-content element not found in renderStageContent');
            return;
        }
        
        stageContent.innerHTML = ``;
        
        // Stage-specific content generation removed - focusing on overall progress view
    }

    async generateStageContent(stage, dayInStage) {
        try {
            // First try to load actual tasks from goals system
            const currentTasks = await this.loadCurrentTasks();
            
            if (currentTasks && currentTasks.length > 0) {
                // Use actual tasks from goals system
                const todayTasks = currentTasks.filter(task => !task.completed).slice(0, 3);
                
                if (todayTasks.length > 0) {
                    const dailyFocusEl = document.getElementById('daily-focus');
                    if (dailyFocusEl) {
                        dailyFocusEl.textContent = `Focus on your ${this.stageNames[stage.id - 1]} journey progress`;
                    }
                    
                    const actionsEl = document.getElementById('key-actions');
                    if (actionsEl) {
                        actionsEl.innerHTML = `<li>• Track your journey progress</li><li>• Review achievements and insights</li><li>• Visit Goals page for task management</li>`;
                    }
                    
                    const tipsEl = document.getElementById('success-tips');
                    tipsEl.innerHTML = [
                        `<li>• Consistency beats intensity in your journey</li>`,
                        `<li>• Reflect on your progress regularly</li>`,
                        `<li>• Focus on learning and growth, not perfection</li>`
                    ].join('');
                    return;
                }
            }
            
            // Fallback to LLM generation if no tasks found
            const stageName = this.stageNames[stage.id - 1];
            const prompt = `Generate specific daily content for day ${this.currentDay} of a 21-day journey.

Context:
- User's Dream: "${this.journeyData.dreamText}"
- Current Stage: "${stageName}" (Day ${dayInStage} of ${stage.days.length})
- Commitment Style: ${this.journeyData.timeCommitment}
- Learning Style: ${this.journeyData.learningStyle}

Generate JSON with:
{
  "dailyFocus": "One clear focus statement for today",
  "keyActions": ["Action 1", "Action 2", "Action 3"],
  "successTips": ["Tip 1", "Tip 2", "Tip 3"]
}

Make it specific to their dream, practical, and achievable in one day.`;

            const llmResponse = await this.callLLM(prompt);
            const content = JSON.parse(llmResponse);
            
            // Update the content
            const dailyFocusEl = document.getElementById('daily-focus');
            if (dailyFocusEl) {
                dailyFocusEl.textContent = content.dailyFocus;
            }
            
            const actionsEl = document.getElementById('key-actions');
            if (actionsEl) {
                actionsEl.innerHTML = content.keyActions.map(action => `<li>• ${action}</li>`).join('');
            }
            
            const tipsEl = document.getElementById('success-tips');
            if (tipsEl) tipsEl.innerHTML = content.successTips.map(tip => `<li>• ${tip}</li>`).join('');
            
        } catch (error) {
            console.log('Using fallback stage content (LLM unavailable)');
            // Generate dynamic fallback content based on user's dream
            const dreamKeywords = this.extractDreamKeywords(this.journeyData.dreamText);
            
            const dailyFocusEl = document.getElementById('daily-focus');
            if (dailyFocusEl) {
                dailyFocusEl.textContent = `Focus on ${dreamKeywords.action} toward your ${dreamKeywords.goal} today.`;
            }
            
            const actionsEl = document.getElementById('key-actions');
            if (actionsEl) {
                actionsEl.innerHTML = [
                    `<li>• Research ${dreamKeywords.field} opportunities</li>`,
                    `<li>• Build ${dreamKeywords.skill} skills</li>`,
                    `<li>• Network with ${dreamKeywords.field} professionals</li>`
                ].join('');
            }
            
            const successTipsEl = document.getElementById('success-tips');
            if (successTipsEl) {
                successTipsEl.innerHTML = [
                    `<li>• Focus on ${dreamKeywords.field}-specific actions</li>`,
                    `<li>• Track progress toward ${dreamKeywords.goal}</li>`,
                    `<li>• Stay consistent with daily learning</li>`
                ].join('');
            }
        }
    }

    async loadCurrentTasks() {
        try {
            const token = localStorage.getItem('authToken');
            
            // Check if this is demo data first
            if (!token || (this.journeyData && this.journeyData.goalIds?.includes('demo-goal-1'))) {
                // Return demo tasks for demo journey
                return [
                    {
                        id: 'demo-task-1',
                        title: 'Define Your Dream Vision',
                        description: 'Articulate your vision and goals',
                        completed: false,
                        estTime: 45,
                        day: 'Today',
                        goalTitle: 'Foundation Building'
                    },
                    {
                        id: 'demo-task-2',
                        title: 'Research Your Target Field',
                        description: 'Study current opportunities and requirements',
                        completed: false,
                        estTime: 60,
                        day: 'Today',
                        goalTitle: 'Market Research'
                    },
                    {
                        id: 'demo-task-3',
                        title: 'Set Learning Goals',
                        description: 'Identify key areas to focus your learning',
                        completed: false,
                        estTime: 30,
                        day: 'Today',
                        goalTitle: 'Skill Development'
                    }
                ];
            }
            
            // Try journey endpoint first
            const journeyResponse = await fetch(`${this.apiBase}/journey/current-stage`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (journeyResponse.ok) {
                const journeyData = await journeyResponse.json();
                if (journeyData.success && journeyData.data.tasks) {
                    return journeyData.data.tasks;
                }
            }
            
            // Fallback: Get current week's goals and tasks
            const goalsResponse = await fetch(`${this.apiBase}/goals`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (goalsResponse.ok) {
                const goalsData = await goalsResponse.json();
                if (goalsData.success && goalsData.data) {
                    // Filter for current week's journey goals
                    const journeyGoals = goalsData.data.filter(goal => 
                        goal.category === 'journey' || 
                        goal.journeyWeek || 
                        goal.title.includes('Week')
                    );
                    
                    // Get tasks for today or recent tasks
                    let allTasks = [];
                    journeyGoals.forEach(goal => {
                        if (goal.tasks) {
                            goal.tasks.forEach(task => {
                                allTasks.push({
                                    id: task._id,
                                    title: task.name,
                                    description: task.description || '',
                                    completed: task.status === 'completed',
                                    estTime: task.estTime || 30,
                                    day: task.day,
                                    goalTitle: goal.title
                                });
                            });
                        }
                    });
                    
                    return allTasks.slice(0, 5); // Return first 5 tasks
                }
            }
        } catch (error) {
            console.error('Error loading current tasks:', error);
        }
        return null;
    }

    getCurrentWeekStart() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const start = new Date(now);
        start.setDate(now.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        return start;
    }

    extractDreamKeywords(dreamText) {
        // Extract key elements from dream text to create dynamic fallback content
        const dream = dreamText.toLowerCase();
        
        // Extract role/goal with better pattern matching
        const roleMatch = dream.match(/(?:become|be)\s+(?:a|an)\s+([^,.\n]+)/i);
        let goal = roleMatch ? roleMatch[1].trim() : 'Dream';
        
        // Clean up goal extraction - capitalize and limit length
        goal = goal.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        // Limit goal length and clean up
        if (goal.length > 20) {
            goal = goal.substring(0, 20).trim();
        }
        
        // Extract field/industry with nutrition support
        let field = 'Career';
        if (dream.includes('ai') || dream.includes('artificial intelligence')) field = 'AI';
        else if (dream.includes('product manager') || dream.includes('pm')) field = 'Product';
        else if (dream.includes('software') || dream.includes('engineer')) field = 'Tech';
        else if (dream.includes('data') || dream.includes('analytics')) field = 'Data';
        else if (dream.includes('design') || dream.includes('ux')) field = 'Design';
        else if (dream.includes('marketing')) field = 'Marketing';
        else if (dream.includes('startup') || dream.includes('entrepreneur')) field = 'Business';
        else if (dream.includes('nutrition') || dream.includes('health') || dream.includes('wellness')) field = 'Health';
        else if (dream.includes('fitness') || dream.includes('trainer')) field = 'Fitness';
        else if (dream.includes('coach') || dream.includes('mentor')) field = 'Coaching';
        
        // Extract action verb
        let action = 'working';
        if (dream.includes('learn')) action = 'learning';
        else if (dream.includes('build')) action = 'building';
        else if (dream.includes('create')) action = 'creating';
        else if (dream.includes('develop')) action = 'developing';
        
        // Extract skill with nutrition support
        let skill = 'Essential';
        if (field === 'AI') skill = 'AI/ML';
        else if (field === 'Product') skill = 'Strategy';
        else if (field === 'Tech') skill = 'Coding';
        else if (field === 'Data') skill = 'Analysis';
        else if (field === 'Design') skill = 'Creative';
        else if (field === 'Marketing') skill = 'Digital';
        else if (field === 'Health') skill = 'Wellness';
        else if (field === 'Fitness') skill = 'Training';
        else if (field === 'Coaching') skill = 'Mentoring';
        
        return { goal, field, action, skill };
    }

    async loadDreamDiscoveryData() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token || !this.journeyData?.dreamId) return null;

            const response = await fetch(`${this.apiBase}/dreams/${this.journeyData.dreamId}/discovery`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.success ? data.data : null;
            }
            return null;
        } catch (error) {
            console.log('Error loading DreamDiscovery data:', error);
            return null;
        }
    }

    createStageNamesFromWeekThemes(weekThemes) {
        // Convert 3 week themes into 6 stage names (2 stages per week)
        const stageNames = [];
        
        weekThemes.forEach((theme, index) => {
            const weekNum = index + 1;
            stageNames.push(`${theme} Start`);
            stageNames.push(`${theme} Progress`);
        });
        
        return stageNames;
    }


    renderProgressVisualization() {
        // Check if we're in Discovery Stage with Self Discovery cards
        const isDiscoveryStage = this.currentUser && this.currentUser.userStage === 'discovery';
        const hasDiscoveryCards = document.getElementById('discovery-cards-container');
        
        if (isDiscoveryStage || hasDiscoveryCards) {
            console.log('🌟 Discovery Stage detected - Self Discovery cards mode active');
            return; // Skip traditional progress visualization for Discovery Stage
        }
        
        const visualization = document.getElementById('progress-visualization');
        if (!visualization) {
            console.warn('⚠️ Progress visualization element not found - may be in Discovery Stage mode');
            return;
        }
        
        visualization.innerHTML = '';
        
        // Create Duolingo-style 2x3 grid layout for stage tiles
        const stagesContainer = document.createElement('div');
        stagesContainer.className = 'grid grid-cols-3 gap-4 max-w-2xl mx-auto journey-path';
        
        this.journeyStructure.stages.forEach((stage, index) => {
            const stageName = this.stageNames[index] || `Stage ${index + 1}`;
            const isUnlocked = this.currentDay >= stage.days[0];
            const isCompleted = this.currentDay > Math.max(...stage.days);
            const isCurrent = this.currentDay >= stage.days[0] && this.currentDay <= Math.max(...stage.days);
            const hasReflection = stage.reflectionDay !== null;
            const hasMilestone = stage.milestone;
            
            const stageEl = document.createElement('div');
            stageEl.className = `stage-card border-2 rounded-xl aspect-square p-4 transition-all duration-300 hover:shadow-lg cursor-pointer ${
                isCurrent ? 'border-blue-500 bg-blue-50 shadow-md current transform scale-105' : 
                isCompleted ? 'border-green-500 bg-green-50' : 
                isUnlocked ? 'border-gray-300 bg-white hover:border-blue-300' : 
                'border-gray-200 bg-gray-50 opacity-60'
            }`;
            
            stageEl.innerHTML = `
                <div class="h-full flex flex-col justify-center text-center">
                    <!-- Stage header -->
                    <div class="mb-2">
                        <h3 class="text-sm font-bold text-gray-900 leading-tight">${stageName}</h3>
                        <p class="text-xs text-gray-500 mt-1">
                            Journey Stage ${index + 1}
                        </p>
                    </div>
                    
                    <!-- Status indicator with larger badge -->
                    <div class="mb-3">
                        ${isCompleted ? 
                            '<div class="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto text-xl">✓</div>' : 
                            isCurrent ? 
                            '<div class="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto text-sm font-bold">' + this.currentDay + '</div>' :
                            isUnlocked ?
                            '<div class="w-12 h-12 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center mx-auto text-sm font-bold">' + stage.days[0] + '</div>' :
                            '<div class="w-12 h-12 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center mx-auto">🔒</div>'
                        }
                        <span class="inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                            isCompleted ? 'bg-green-100 text-green-700' : 
                            isCurrent ? 'bg-blue-100 text-blue-700' : 
                            isUnlocked ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-gray-100 text-gray-500'
                        }">
                            ${isCompleted ? 'Completed' : 
                              isCurrent ? 'In Progress' : 
                              isUnlocked ? 'Available' : 
                              'Locked'}
                        </span>
                    </div>
                    
                    <!-- Progress dots -->
                    <div class="flex items-center justify-center space-x-1">
                        ${stage.days.map(day => `
                            <div class="progress-dot-small w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                day < this.currentDay ? 'bg-green-500 text-white' : 
                                day === this.currentDay ? 'bg-blue-500 text-white' : 
                                day <= this.currentDay || isUnlocked ? 'bg-gray-200 text-gray-600' : 
                                'bg-gray-100 text-gray-400'
                            }">
                                ${day < this.currentDay ? '✓' : day}
                            </div>
                        `).join('')}
                        
                        ${hasReflection ? `
                            <div class="progress-dot-small w-6 h-6 rounded-full flex items-center justify-center ${
                                this.currentDay > stage.reflectionDay ? 'bg-purple-500 text-white' : 
                                this.currentDay === stage.reflectionDay ? 'bg-purple-500 text-white' : 
                                'bg-purple-100 text-purple-600'
                            }">
                                💭
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Milestone indicator -->
                    ${hasMilestone ? '<div class="text-xs text-amber-600 mt-2">🏆 Milestone</div>' : ''}
                </div>
            `;
            
            stagesContainer.appendChild(stageEl);
        });
        
        visualization.appendChild(stagesContainer);
        
        // Update overall progress slider
        this.updateOverallProgress();
    }

    updateOverallProgress() {
        try {
            // Check if we're in Discovery Stage with Self Discovery cards
            const isDiscoveryStage = this.currentUser && this.currentUser.userStage === 'discovery';
            const hasDiscoveryCards = document.getElementById('discovery-cards-container');
            
            if (isDiscoveryStage || hasDiscoveryCards) {
                console.log('🌟 Discovery Stage - skipping traditional progress bar update');
                return; // Skip traditional progress bar for Discovery Stage
            }
            
            const progressText = document.getElementById('overall-progress-text');
            const progressBar = document.getElementById('overall-progress-bar');
            
            if (progressText && progressBar) {
                const progressPercentage = ((this.currentDay - 1) / 21) * 100;
                
                progressText.textContent = `Day ${this.currentDay} of 21`;
                progressBar.style.width = `${Math.max(5, progressPercentage)}%`; // Minimum 5% for visibility
                
                // Update color based on progress
                if (progressPercentage >= 100) {
                    progressBar.className = 'bg-green-500 h-2 rounded-full transition-all duration-500';
                } else if (progressPercentage >= 66) {
                    progressBar.className = 'bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-500';
                } else if (progressPercentage >= 33) {
                    progressBar.className = 'bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full transition-all duration-500';
                } else {
                    progressBar.className = 'bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500';
                }
                
                console.log(`📊 Progress bar updated: Day ${this.currentDay} (${progressPercentage.toFixed(1)}%)`);
            } else {
                console.warn('⚠️ Progress bar elements not found:', { progressText: !!progressText, progressBar: !!progressBar });
            }
        } catch (error) {
            console.error('❌ Error updating progress bar:', error);
        }
    }

    async loadStagePreviewContent() {
        // Find the current stage and load its content
        const currentStageIndex = this.journeyStructure.stages.findIndex(stage => 
            this.currentDay >= stage.days[0] && this.currentDay <= Math.max(...stage.days)
        );
        
        if (currentStageIndex !== -1) {
            const stage = this.journeyStructure.stages[currentStageIndex];
            const dayInStage = stage.days.findIndex(day => day === this.currentDay) + 1;
            
            try {
                const stageName = this.stageNames[currentStageIndex];
                const prompt = `Generate specific daily content for day ${this.currentDay} of a 21-day journey.

Context:
- User's Dream: "${this.journeyData.dreamText}"
- Current Stage: "${stageName}" (Day ${dayInStage} of ${stage.days.length})
- Commitment Style: ${this.journeyData.timeCommitment}
- Learning Style: ${this.journeyData.learningStyle}

Generate JSON with:
{
  "dailyFocus": "One clear focus statement for today",
  "keyActions": ["Action 1", "Action 2", "Action 3"],
  "successTips": ["Tip 1", "Tip 2", "Tip 3"]
}

Make it specific to their dream, practical, and achievable in one day.`;

                const llmResponse = await this.callLLM(prompt);
                const content = JSON.parse(llmResponse);
                
                // Update the current stage preview
                const focusEl = document.getElementById(`stage-${currentStageIndex}-focus`);
                if (focusEl) focusEl.textContent = content.dailyFocus;
                
                const actionsEl = document.getElementById(`stage-${currentStageIndex}-actions`);
                if (actionsEl) actionsEl.innerHTML = content.keyActions.map(action => `<div>• ${action}</div>`).join('');
                
                const tipsEl = document.getElementById(`stage-${currentStageIndex}-tips`);
                if (tipsEl) tipsEl.innerHTML = content.successTips.map(tip => `<div>• ${tip}</div>`).join('');
                
            } catch (error) {
                console.error('Error loading stage preview content:', error);
                // Use dynamic fallback
                const dreamKeywords = this.extractDreamKeywords(this.journeyData.dreamText);
                
                const fallbackFocusEl = document.getElementById(`stage-${currentStageIndex}-focus`);
                if (fallbackFocusEl) fallbackFocusEl.textContent = `Focus on ${dreamKeywords.action} toward your ${dreamKeywords.goal} today.`;
                
                const fallbackActionsEl = document.getElementById(`stage-${currentStageIndex}-actions`);
                if (fallbackActionsEl) fallbackActionsEl.innerHTML = `<div>• Research ${dreamKeywords.field} opportunities</div><div>• Build ${dreamKeywords.skill} skills</div><div>• Network with professionals</div>`;
                
                const fallbackTipsEl = document.getElementById(`stage-${currentStageIndex}-tips`);
                if (fallbackTipsEl) fallbackTipsEl.innerHTML = `<div>• Focus on ${dreamKeywords.field}-specific actions</div><div>• Track progress toward ${dreamKeywords.goal}</div><div>• Stay consistent with learning</div>`;
            }
        }
    }

    setupEventListeners() {
        // Mark complete
        document.getElementById('mark-complete')?.addEventListener('click', () => {
            this.markDayComplete();
        });
        
        // Retry discovery cards
        document.getElementById('retry-discovery-cards')?.addEventListener('click', () => {
            this.loadSelfDiscoveryCards();
        });
    }


    async markDayComplete() {
        try {
            // Save progress to database first
            const token = localStorage.getItem('authToken');
            if (token) {
                await fetch(`${this.apiBase}/dreams/progress`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        dreamId: this.journeyData._id,
                        day: this.currentDay,
                        completed: true,
                        xpEarned: this.currentDay === Math.max(...this.getCurrentStage().days) && this.getCurrentStage().milestone ? 100 : 25,
                        progressData: {
                            currentDay: this.currentDay,
                            currentStreak: this.currentStreak + 1,
                            userXP: this.userXP + (this.currentDay === Math.max(...this.getCurrentStage().days) && this.getCurrentStage().milestone ? 100 : 25)
                        }
                    })
                });
            }
            
            // Mark day as complete
            const currentStage = this.getCurrentStage();
            if (currentStage.milestone && this.currentDay === Math.max(...currentStage.days)) {
                // Award milestone XP
                this.userXP += 100;
                this.showSuccess('🎉 Milestone achieved! +100 XP earned!');
            } else {
                this.userXP += 25;
                this.showSuccess('✅ Day completed! +25 XP earned!');
            }
            
            // Legacy XP and streak tracking removed
            
            // Move to next day (if user chooses)
            if (this.currentDay < 21) {
                setTimeout(() => {
                    if (confirm('Ready to move to the next day?')) {
                        this.currentDay++;
                        this.renderHeader(); // Update header with new day
                        this.renderCurrentStage();
                    }
                }, 1500);
            }
            
        } catch (error) {
            console.error('Error marking day complete:', error);
            this.showError('Failed to mark day as complete.');
        }
    }


    formatCommitmentStyle(style) {
        const styles = {
            'micro-burst': 'Quick Sessions',
            'focused-blocks': 'Deep Focus',
            'flexible-flow': 'Flexible Timing'
        };
        return styles[style] || style;
    }

    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type) {
        // Create a simple notification system
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    /**
     * Update server's currentDay value
     */
    updateServerCurrentDay(newDay) {
        if (!this.journeyData?._id) return;
        
        fetch(`${this.apiBase}/dreams/${this.journeyData._id}/update-current-day`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ currentDay: newDay })
        }).then(response => {
            if (response.ok) {
                console.log('✅ Server currentDay updated to:', newDay);
                this.journeyData.currentDay = newDay;
            } else {
                console.log('❌ Failed to update server currentDay');
            }
        }).catch(error => {
            console.log('❌ Error updating server currentDay:', error);
        });
    }
}

/**
 * Update the current day and date display for journey progress page
 */
function updateCurrentDayDateDisplay() {
    const currentDayDateEl = document.getElementById('current-day-date-progress');
    if (!currentDayDateEl) return;
    
    const now = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = dayNames[now.getDay()];
    const date = now.getDate();
    const monthName = monthNames[now.getMonth()];
    
    // Format as "Thu, 17 Jul"
    const formattedDate = `${dayName}, ${date} ${monthName}`;
    currentDayDateEl.textContent = formattedDate;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Update current day and date display
    updateCurrentDayDateDisplay();
    
    new JourneyProgressManager();
});