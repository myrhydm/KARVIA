/**
 * Journey System Frontend Implementation
 * Handles dream parsing, journey initialization, and progress tracking
 */

class JourneyManager {
    constructor() {
        this.apiBase = '/api';
        this.currentJourney = null;
        this.currentDay = 1;
        this.userXP = 0;
        this.currentStreak = 0;
        this.stageNames = [];
        
        // 21-Day Structure: 6 stages (3 days each) + 3 reflection days + 3 milestones
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
        
        // Initialize asynchronously
        this.init().catch(console.error);
    }

    async init() {
        // Ensure user is authenticated before initializing
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.log('No authentication token found. Redirecting to login.');
            window.location.href = 'index.html';
            return;
        }
        
        this.setupEventListeners();
        this.setupSliders();
        
        // Check form lock status
        await this.checkFormLockStatus();
        
        // Initialize header for form stage
        this.renderFormHeader();
        
        // Check for existing journey immediately
        this.checkExistingJourney();
    }

    setupEventListeners() {
        // Dream input character count and autocomplete
        const dreamText = document.getElementById('dream-text');
        const charCount = document.getElementById('char-count');
        
        if (dreamText && charCount) {
            dreamText.addEventListener('input', () => {
                charCount.textContent = dreamText.value.length;
                this.handleDreamAutocomplete(dreamText.value);
            });

            // Hide suggestions when clicking outside
            document.addEventListener('click', (e) => {
                const dreamSuggestions = document.getElementById('dream-suggestions');
                if (!dreamText.contains(e.target) && dreamSuggestions && !dreamSuggestions.contains(e.target)) {
                    this.hideDreamSuggestions();
                }
            });
        }

        // Generate plan button (was Start Journey)
        const generateButton = document.getElementById('generate-plan');
        if (generateButton) {
            generateButton.addEventListener('click', () => this.generatePlan());
        }

        // Example dreams
        const exampleDreams = document.querySelectorAll('.example-dream');
        exampleDreams.forEach(example => {
            example.addEventListener('click', () => {
                const dreamText = example.getAttribute('data-dream');
                document.getElementById('dream-text').value = dreamText;
                document.getElementById('char-count').textContent = dreamText.length;
                this.hideDreamSuggestions();
            });
        });

        // Radio button selections
        this.setupRadioButtons();

        // Action buttons
        const motivationBtn = document.getElementById('get-motivation');
        const adaptationBtn = document.getElementById('view-adaptation');
        const regenerateBtn = document.getElementById('regenerate-goals');

        if (motivationBtn) {
            motivationBtn.addEventListener('click', () => this.getMotivation());
        }
        if (adaptationBtn) {
            adaptationBtn.addEventListener('click', () => this.viewAdaptation());
        }
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => this.regenerateGoals());
        }

    }

    setupSliders() {
        const confidenceSlider = document.getElementById('confidence-slider');
        const confidenceValue = document.getElementById('confidence-value');
        const timelineSlider = document.getElementById('timeline-slider');
        const timelineValue = document.getElementById('timeline-value');

        if (confidenceSlider && confidenceValue) {
            confidenceSlider.addEventListener('input', () => {
                confidenceValue.textContent = confidenceSlider.value;
            });
        }

        if (timelineSlider && timelineValue) {
            timelineSlider.addEventListener('input', () => {
                const weeks = timelineSlider.value;
                const weeksText = weeks == 1 ? 'week' : 'weeks';
                timelineValue.textContent = `${weeks} ${weeksText}`;
            });
        }
    }

    setupRadioButtons() {
        // Handle career path radio buttons
        const careerOptions = document.querySelectorAll('input[name="career-path"]');
        careerOptions.forEach(radio => {
            radio.addEventListener('change', () => {
                this.updateDreamSuggestions();
            });
        });

        // Handle time commitment radio buttons
        const commitmentOptions = document.querySelectorAll('input[name="time-commitment"]');
        commitmentOptions.forEach(radio => {
            radio.addEventListener('change', () => {
                // Could update task timing preferences here
            });
        });

        // Handle learning style radio buttons
        const learningOptions = document.querySelectorAll('input[name="learning-style"]');
        learningOptions.forEach(radio => {
            radio.addEventListener('change', () => {
                // Could update learning content preferences here
            });
        });
    }

    handleDreamAutocomplete(input) {
        if (input.length < 3) {
            this.hideDreamSuggestions();
            return;
        }

        const careerPath = document.querySelector('input[name="career-path"]:checked')?.value || 'employee';
        const suggestions = this.getDreamSuggestions(input, careerPath);
        
        if (suggestions.length > 0) {
            this.showDreamSuggestions(suggestions);
        } else {
            this.hideDreamSuggestions();
        }
    }

    getDreamSuggestions(input, careerPath) {
        const employeeSuggestions = [
            "I want to become a Software Engineer at Google, working on machine learning projects",
            "I want to become a Product Manager at a top tech company, leading innovative products",
            "I want to become a Data Scientist at Netflix, analyzing user behavior and content optimization",
            "I want to become a UX Designer at Apple, creating intuitive and beautiful user experiences",
            "I want to become a Marketing Manager at Tesla, promoting sustainable technology",
            "I want to become a Financial Analyst at Goldman Sachs, specializing in tech investments",
            "I want to become a Sales Director at Salesforce, helping businesses transform digitally",
            "I want to become a Research Scientist at OpenAI, advancing artificial intelligence capabilities"
        ];

        const entrepreneurSuggestions = [
            "I want to start a SaaS company that helps small businesses automate their operations",
            "I want to launch a sustainable fashion brand that uses only eco-friendly materials",
            "I want to build a fintech startup that makes investing accessible to everyone",
            "I want to create an edtech platform that personalizes learning for students",
            "I want to start a healthcare startup that improves mental health access",
            "I want to launch a food delivery service focused on healthy, local meals",
            "I want to build a renewable energy company that powers rural communities",
            "I want to create a travel platform that connects authentic local experiences"
        ];

        const suggestions = careerPath === 'entrepreneur' ? entrepreneurSuggestions : employeeSuggestions;
        
        return suggestions.filter(suggestion => 
            suggestion.toLowerCase().includes(input.toLowerCase()) ||
            input.toLowerCase().split(' ').some(word => 
                suggestion.toLowerCase().includes(word) && word.length > 2
            )
        ).slice(0, 5);
    }

    showDreamSuggestions(suggestions) {
        const suggestionsEl = document.getElementById('dream-suggestions');
        if (!suggestionsEl) return;

        suggestionsEl.innerHTML = suggestions.map(suggestion => 
            `<div class="dream-suggestion" onclick="journeyManager.selectDreamSuggestion('${suggestion.replace(/'/g, "\\'")}')">
                ${suggestion}
            </div>`
        ).join('');
        
        suggestionsEl.classList.remove('hidden');
    }

    hideDreamSuggestions() {
        const suggestionsEl = document.getElementById('dream-suggestions');
        if (suggestionsEl) {
            suggestionsEl.classList.add('hidden');
        }
    }

    selectDreamSuggestion(suggestion) {
        document.getElementById('dream-text').value = suggestion;
        document.getElementById('char-count').textContent = suggestion.length;
        this.hideDreamSuggestions();
    }

    updateDreamSuggestions() {
        const dreamText = document.getElementById('dream-text');
        if (dreamText && dreamText.value.length >= 3) {
            this.handleDreamAutocomplete(dreamText.value);
        }
    }

    async checkExistingJourney() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                // No auth token - ensure form is unlocked and visible
                localStorage.removeItem('journeyFormLocked');
                this.showJourneyForm();
                return;
            }

            const response = await fetch(`${this.apiBase}/dreams/active`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            
            if (response.ok) {
                const result = await response.json();
                
                if (result.success && result.data && result.data.length > 0) {
                    // Found active dreams, use the first one
                    const activeDream = result.data[0];
                    
                    if (activeDream.planGenerated && activeDream.goalIds && activeDream.goalIds.length > 0) {
                        // User has an active journey - redirect to dedicated progress page
                        this.showSuccess('Welcome back! Redirecting to your journey...');
                        
                        setTimeout(() => {
                            window.location.href = '/my_journey.html';
                        }, 1500);
                    } else if (activeDream.planGenerated) {
                        // Plan exists but no goals - might be a data issue
                        this.showJourneyForm();
                        this.showInfo('Your plan is being processed. Please regenerate if needed.');
                    } else {
                        this.showJourneyForm();
                        this.showInfo('Complete your dream setup to see your progress map!');
                    }
                } else {
                    // No active journey found - ensure form is unlocked and visible
                    localStorage.removeItem('journeyFormLocked');
                    this.showJourneyForm();
                    this.showInfo('Create your personalized 21-day journey to see your progress map!');
                }
            } else {
                // API call failed - ensure form is unlocked and visible
                localStorage.removeItem('journeyFormLocked');
                this.showJourneyForm();
                this.showInfo('Please create your personalized 21-day journey to get started!');
            }
        } catch (error) {
            // Error occurred - ensure form is unlocked and visible
            localStorage.removeItem('journeyFormLocked');
            this.showJourneyForm();
            this.showInfo('Welcome! Create your personalized journey to begin tracking your progress.');
        }
    }


    showJourneyForm() {
        const formSection = document.getElementById('dream-input-section');
        if (formSection) {
            formSection.style.display = 'block';
            formSection.classList.remove('hidden');
            
            // Remove any existing lock overlay
            const lockOverlay = formSection.querySelector('.absolute.inset-0');
            if (lockOverlay) {
                lockOverlay.remove();
            }
            
            // Re-enable all form inputs
            const formInputs = formSection.querySelectorAll('input, textarea, button');
            formInputs.forEach(input => {
                input.disabled = false;
                input.style.opacity = '1';
                input.style.cursor = 'pointer';
            });
        }
        
        // Show example dreams section too
        const exampleSections = document.querySelectorAll('.glass-effect');
        exampleSections.forEach((section, index) => {
            if (index > 0) { // Skip the first one which is the form
                section.style.display = 'block';
                section.classList.remove('hidden');
            }
        });
    }

    async generatePlan() {
        const dreamText = document.getElementById('dream-text').value.trim();
        const confidence = parseInt(document.getElementById('confidence-slider').value);
        const timeHorizon = parseInt(document.getElementById('timeline-slider').value);
        const timeCommitment = document.querySelector('input[name="time-commitment"]:checked')?.value;
        const learningStyle = document.querySelector('input[name="learning-style"]:checked')?.value;

        if (!dreamText) {
            this.showError('Please enter your dream or aspiration');
            return;
        }

        if (!timeCommitment || !learningStyle) {
            this.showError('Please complete all form fields');
            return;
        }

        try {
            this.showLoading();

            const token = localStorage.getItem('authToken');
            
            // If no token, proceed with local journey creation
            if (!token) {
                await this.createDemoJourney(dreamText, confidence, timeHorizon, timeCommitment, learningStyle);
                return;
            }

            // Step 1: Create the dream
            const createDreamResponse = await fetch(`${this.apiBase}/dreams/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    dreamText,
                    confidence,
                    timeHorizon,
                    timeCommitment,
                    learningStyle
                })
            });

            const dreamData = await createDreamResponse.json();
            
            if (!dreamData.success) {
                throw new Error(dreamData.error || 'Failed to create dream');
            }

            // Step 2: Generate enhanced 21-day plan and create goals
            const generatePlanResponse = await fetch(`${this.apiBase}/dreams/${dreamData.data.dreamId}/generate-plan`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const planData = await generatePlanResponse.json();
            this.hideLoading();

            if (planData.success) {
                console.log('📅 Server returned currentDay:', planData.data.currentDay);
                console.log('🤖 Plan generation method:', planData.data.provider, planData.data.model);
                
                this.currentJourney = {
                    dreamId: dreamData.data.dreamId,
                    dreamText,
                    confidence,
                    timeHorizon,
                    timeCommitment,
                    learningStyle,
                    hasActiveJourney: true,
                    goalIds: planData.data.goalIds,
                    totalGoals: planData.data.totalGoals,
                    journeyStartDate: planData.data.journeyStartDate,
                    currentDay: planData.data.currentDay || 1, // Use server response
                    planGenerated: true,
                    // Store AI generation metadata
                    generationMethod: planData.data.provider || 'template',
                    aiModel: planData.data.model,
                    overallProgress: {
                        completionPercentage: 5,
                        completedTasks: 0,
                        completedDays: 0
                    }
                };
                
                // Store generation method info for goals page
                localStorage.setItem('lastPlanGenerationMethod', JSON.stringify({
                    provider: planData.data.provider || 'template',
                    model: planData.data.model,
                    timestamp: Date.now()
                }));
                
                // Create success message with AI generation indicator
                const generationInfo = this.getGenerationMethodInfo(planData.data.provider, planData.data.model);
                const activitiesInfo = planData.data.totalActivities ? ` with ${planData.data.totalActivities} discovery activities` : '';
                this.showSuccess(`🧠 Your personalized 21-day Discovery Journey has been created${activitiesInfo}! ${generationInfo}`);
                
                // Complete journey creation and lock form
                await this.completeJourneyCreation();
                
                // Redirect to my journey page to show the generated plan
                setTimeout(() => {
                    window.location.href = 'my_journey.html';
                }, 1500);
            } else {
                await this.createDemoJourney(dreamText, confidence, timeHorizon, timeCommitment, learningStyle);
            }
        } catch (error) {
            this.hideLoading();
            console.error('Error generating plan:', error);
            await this.createDemoJourney(dreamText, confidence, timeHorizon, timeCommitment, learningStyle);
        }
    }

    async createDemoJourney(dreamText, confidence, timeHorizon, timeCommitment, learningStyle) {
        this.hideLoading();
        
        this.currentJourney = {
            dreamText,
            confidence,
            timeHorizon,
            timeCommitment,
            learningStyle,
            hasActiveJourney: true,
            currentDay: 1,
            currentSprint: 1,
            currentWeek: 1,
            overallProgress: {
                completionPercentage: 5,
                completedTasks: 0,
                completedDays: 0,
                totalDays: 21,
                totalTasks: 63
            },
            currentSprintData: {
                sprintNumber: 1,
                name: 'Dream Activation',
                goals: [
                    { completed: false, day: 1, title: 'Define Your Vision' },
                    { completed: false, day: 2, title: 'Set Foundation Goals' },
                    { completed: false, day: 3, title: 'Create Action Plan' }
                ]
            },
            // Add demo goal IDs and journey data for progress page
            goalIds: ['demo-goal-1', 'demo-goal-2', 'demo-goal-3'],
            totalGoals: 3,
            journeyStartDate: new Date(),
            planGenerated: true
        };
        
        // Store journey data for access by progress page
        localStorage.setItem('currentJourney', JSON.stringify(this.currentJourney));
        localStorage.setItem('journeyFormLocked', 'true');
        
        this.showSuccess('🧠 Your personalized 21-day Discovery Journey has been created!');
        
        // Direct redirect to my journey page
        setTimeout(() => {
            this.showInfo('🎯 Redirecting to your journey...');
            setTimeout(() => {
                window.location.href = '/my_journey.html?new=true';
            }, 1000);
        }, 1500);
    }

    async completeJourneyCreation() {
        // Lock the form to prevent further edits
        this.lockJourneyForm();
        
        // Update user onboarding status to unlock full navigation
        await this.markOnboardingComplete();
        
        // Redirect to dedicated progress page
        setTimeout(() => {
            this.showInfo('🎯 Your journey is ready! Redirecting to your progress page...');
            
            setTimeout(() => {
                window.location.href = '/my_journey.html?new=true';
            }, 1500);
        }, 1500);
    }

    lockJourneyForm() {
        // Disable all form inputs to prevent editing
        const formInputs = document.querySelectorAll('#dream-input-section input, #dream-input-section textarea, #dream-input-section button');
        formInputs.forEach(input => {
            input.disabled = true;
            input.style.opacity = '0.6';
            input.style.cursor = 'not-allowed';
        });

        // Add a locked overlay to the form
        const formSection = document.getElementById('dream-input-section');
        if (formSection) {
            const lockOverlay = document.createElement('div');
            lockOverlay.className = 'absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50 rounded-lg';
            lockOverlay.innerHTML = `
                <div class="text-center">
                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Journey Created!</h3>
                    <p class="text-gray-600">Your personalized 21-day journey is ready.</p>
                </div>
            `;
            
            formSection.style.position = 'relative';
            formSection.appendChild(lockOverlay);
        }

        // Mark form as locked in localStorage
        localStorage.setItem('journeyFormLocked', 'true');
    }

    async checkFormLockStatus() {
        const isLocked = localStorage.getItem('journeyFormLocked') === 'true';
        if (isLocked) {
            // Only lock the form if the user actually has an active journey
            const hasActiveJourney = await this.hasActiveJourney();
            if (hasActiveJourney) {
                this.lockJourneyForm();
            } else {
                // Clear the lock status if no active journey exists
                localStorage.removeItem('journeyFormLocked');
            }
        }
    }

    async hasActiveJourney() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            // No auth token - clear lock status and return false
            localStorage.removeItem('journeyFormLocked');
            return false;
        }
        
        try {
            const response = await fetch(`${this.apiBase}/dreams/active`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data && result.data.length > 0) {
                    const activeDream = result.data[0];
                    return activeDream.planGenerated && activeDream.goalIds && activeDream.goalIds.length > 0;
                }
            }
        } catch (error) {
            console.error('Error checking active journey:', error);
        }
        
        return false;
    }
    
    async markOnboardingComplete() {
        // Update localStorage to mark onboarding as completed
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.onboardingCompleted = true;
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('onboardingCompleted', 'true');
        
        // Also update server-side user record
        try {
            const token = localStorage.getItem('authToken');
            if (token && this.currentJourney) {
                await fetch(`${this.apiBase}/auth/onboarding`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        dream: this.currentJourney.dreamText,
                        timeline: this.currentJourney.timeHorizon,
                        confidence: this.currentJourney.confidence
                    })
                });
            }
        } catch (error) {
            console.warn('⚠️ Failed to update server-side onboarding status:', error);
        }
        
    }
    
    refreshNavigation() {
        // Refresh the navigation to show all available pages
        if (typeof NavigationComponent !== 'undefined' && NavigationComponent.initializeNavigation) {
            NavigationComponent.initializeNavigation();
        }
    }

    async loadCurrentStage() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.apiBase}/journey/current-sprint`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.updateTasksList(data.data.tasks || []);
                    this.updateProgressMetrics(data.data);
                }
            }
        } catch (error) {
            console.error('Error loading current stage:', error);
        }
    }

    updateTasksList(tasks) {
        const taskList = document.getElementById('task-list');
        if (!taskList) return;

        if (tasks.length === 0) {
            taskList.innerHTML = '<p class="text-gray-500 text-center py-4">No tasks for today. Great job!</p>';
            return;
        }

        taskList.innerHTML = tasks.map(task => `
            <div class="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                <div class="flex-1">
                    <h4 class="font-medium text-gray-800">${task.title}</h4>
                    ${task.description ? `<p class="text-sm text-gray-600 mt-1">${task.description}</p>` : ''}
                    <div class="flex items-center space-x-4 mt-2">
                        <span class="text-xs text-gray-500">Est. ${task.estimatedTime || 30} min</span>
                        ${task.status === 'completed' ? '<span class="text-xs text-green-600 font-medium">✓ Completed</span>' : ''}
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    ${task.status !== 'completed' ? `
                        <button onclick="journeyManager.completeTask('${task.id}')" 
                                class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors">
                            Complete
                        </button>
                        <button onclick="journeyManager.skipTask('${task.id}')" 
                                class="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors">
                            Skip
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    updateProgressMetrics(sprintData) {
        // Update sprint info
        if (sprintData.sprint) {
            const stageLabel = document.getElementById('current-stage-label');
            const stageProgress = document.getElementById('stage-progress');
            const progressBar = document.getElementById('stage-progress-bar');

            if (stageLabel) stageLabel.textContent = `Sprint ${sprintData.sprint.sprintNumber}: ${sprintData.sprint.name}`;
            if (stageProgress) stageProgress.textContent = `${sprintData.sprint.completedGoals || 0}/${sprintData.sprint.goalsCount || 3} goals`;
            
            if (progressBar) {
                const percentage = sprintData.sprint.completionRate || 0;
                progressBar.style.width = `${percentage}%`;
            }
        }

        // Update metrics
        if (sprintData.progress) {
            const completedTasks = document.getElementById('completed-tasks');
            const currentStreak = document.getElementById('current-streak');
            const beliefScore = document.getElementById('belief-score');

            if (completedTasks) completedTasks.textContent = sprintData.progress.completedTasks || 0;
            if (currentStreak) currentStreak.textContent = sprintData.progress.completedDays || 0;
            if (beliefScore) beliefScore.textContent = sprintData.progress.completionPercentage ? `${sprintData.progress.completionPercentage}%` : '--';
        }
    }

    async completeTask(taskId) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.apiBase}/journey/complete-task`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ taskId })
            });

            const data = await response.json();
            if (data.success) {
                this.showSuccess(data.message || 'Task completed successfully!');
                this.loadCurrentStage(); // Refresh the display
            } else {
                this.showError(data.error || 'Failed to complete task');
            }
        } catch (error) {
            console.error('Error completing task:', error);
            this.showError('Unable to complete task. Please try again.');
        }
    }

    async skipTask(taskId) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.apiBase}/journey/skip-task`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ taskId })
            });

            const data = await response.json();
            if (data.success) {
                this.showInfo(data.message || 'Task skipped. We\'ll adapt your journey accordingly.');
                this.loadCurrentStage(); // Refresh the display
            } else {
                this.showError(data.error || 'Failed to skip task');
            }
        } catch (error) {
            console.error('Error skipping task:', error);
            this.showError('Unable to skip task. Please try again.');
        }
    }

    async getMotivation() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.apiBase}/journey/trigger?context=manual`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (data.success && data.data.trigger) {
                this.showMotivation(data.data.trigger.message);
            } else {
                this.showInfo('Keep pushing forward! Every small step counts toward your dream.');
            }
        } catch (error) {
            console.error('Error getting motivation:', error);
            this.showInfo('You\'re doing great! Stay focused on your goals.');
        }
    }

    async viewAdaptation() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.apiBase}/journey/adaptation-analysis`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (data.success && data.data.insights) {
                const insights = data.data.insights;
                let message = 'Your Journey Insights:\n\n';
                if (insights.patterns) {
                    message += `Performance Pattern: ${insights.patterns.performance}\n`;
                    message += `Engagement Level: ${insights.patterns.engagement}\n`;
                }
                if (insights.recommendations && insights.recommendations.length > 0) {
                    message += `\nRecommendations:\n${insights.recommendations.map(r => `• ${r}`).join('\n')}`;
                }
                this.showInfo(message);
            } else {
                this.showInfo('Continue your current approach. You\'re making steady progress!');
            }
        } catch (error) {
            console.error('Error getting adaptation analysis:', error);
            this.showInfo('Keep up the good work! Your journey is progressing well.');
        }
    }

    async regenerateGoals() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.apiBase}/journey/regenerate-goals`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (data.success) {
                this.showSuccess('Goals regenerated successfully! Fresh content has been created for your journey.');
                this.loadCurrentStage(); // Refresh the display
            } else {
                this.showError(data.error || 'Failed to regenerate goals');
            }
        } catch (error) {
            console.error('Error regenerating goals:', error);
            this.showError('Unable to regenerate goals. Please try again.');
        }
    }

    async updateMotivationalContent() {
        const dreamText = this.currentJourney.dreamText || "Building my dream career in tech";
        const currentStreak = this.calculateCurrentStreak();
        
        try {
            // Generate motivational header content
            await this.generateMotivationalHeader(dreamText, currentStreak);
            
            // Populate real journey stages with actual plan data
            await this.populateJourneyStages();
            
        } catch (error) {
            console.error('Error generating motivational content:', error);
            // Fallback to static content
            this.setFallbackMotivationalContent(dreamText, currentStreak);
        }
    }

    async generateMotivationalHeader(dreamText, currentStreak) {
        try {
            const token = localStorage.getItem('authToken');
            
            // Call LLM service for dynamic motivational content
            const response = await fetch(`${this.apiBase}/llm/generate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: `Generate a motivational header for someone pursuing this dream: "${dreamText}". 
                    
                    Current streak: ${currentStreak} days
                    
                    Create 3 elements:
                    1. TITLE: A short, punchy title (max 6 words) with relevant emoji
                    2. SUBTITLE: Industry-specific motivational fact with salary/market data (max 15 words)  
                    3. CHALLENGE: Personal streak-based encouragement (max 8 words)
                    
                    Make it specific to their dream, not generic. Include real numbers/data when possible.
                    
                    Format as JSON:
                    {
                        "title": "🚀 Wellness-Tech Founder Journey",
                        "subtitle": "HealthTech startups raised $29B in 2023. Your opportunity awaits!",
                        "challenge": "Day ${currentStreak + 1} starts your empire! 🔥"
                    }`,
                    temperature: 0.8,
                    max_tokens: 200
                })
            });

            const data = await response.json();
            
            if (data.success && data.response) {
                try {
                    // Parse the LLM response as JSON
                    const motivationData = JSON.parse(data.response);
                    
                    document.getElementById('dynamic-title').textContent = motivationData.title;
                    document.getElementById('dynamic-subtitle').textContent = motivationData.subtitle;
                    document.getElementById('dynamic-challenge').textContent = motivationData.challenge;
                    
                } catch (parseError) {
                    console.error('Error parsing LLM response:', parseError);
                    throw new Error('Invalid LLM response format');
                }
            } else {
                throw new Error('Failed to generate header content from LLM');
            }
        } catch (error) {
            console.error('Error generating dynamic header:', error);
            this.setFallbackHeaderContent(dreamText, currentStreak);
        }
    }

    async populateJourneyStages() {
        try {
            const token = localStorage.getItem('authToken');
            
            // Fetch the actual 21-day journey plan
            const response = await fetch(`${this.apiBase}/journey/plan-overview`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (data.success && data.data && data.data.stages) {
                const stages = data.data.stages;
                
                // Update Stage 1
                if (stages[0]) {
                    this.updateStageInfo(1, stages[0]);
                }
                
                // Update Stage 2  
                if (stages[1]) {
                    this.updateStageInfo(2, stages[1]);
                }
                
                // Update Stage 3
                if (stages[2]) {
                    this.updateStageInfo(3, stages[2]);
                }
                
            } else {
                throw new Error('Failed to get journey plan data');
            }
        } catch (error) {
            console.error('Error fetching journey stages:', error);
            this.setFallbackStageData();
        }
    }

    updateStageInfo(stageNumber, stageData) {
        // Update stage title and subtitle with real data
        const titleEl = document.getElementById(`stage-${stageNumber}-title`);
        const subtitleEl = document.getElementById(`stage-${stageNumber}-subtitle`);
        
        if (titleEl && stageData.name) {
            titleEl.textContent = `Stage ${stageNumber}: ${stageData.name}`;
        }
        
        if (subtitleEl && stageData.description) {
            subtitleEl.textContent = `${stageData.description} • Days ${stageData.startDay}-${stageData.endDay}`;
        }
        
        // Update the unlock condition with real goals preview
        const unlockEl = document.getElementById(`stage-${stageNumber}-unlock-condition`);
        if (unlockEl && stageData.goals && stageData.goals.length > 0) {
            const goalsList = stageData.goals.slice(0, 2).map(goal => goal.title).join(', ');
            unlockEl.innerHTML = `
                <div class="flex items-start">
                    <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <span class="text-blue-600 text-sm">📋</span>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-700">Coming up: ${goalsList}${stageData.goals.length > 2 ? ', and more...' : ''}</p>
                        <p class="text-xs text-gray-500 mt-1">${stageData.goals.length} actionable goals await in this stage</p>
                    </div>
                </div>
            `;
        }
    }

    setFallbackStageData() {
        // Fallback stage data based on dream context
        const dreamText = this.currentJourney.dreamText || "";
        const isStartup = dreamText.toLowerCase().includes('startup') || dreamText.toLowerCase().includes('launch');
        
        if (isStartup) {
            this.updateStageInfo(1, {
                name: "Foundation",
                description: "Validate your idea & market research",
                startDay: 1,
                endDay: 3,
                goals: [
                    { title: "Market Research & Validation" },
                    { title: "Competitive Analysis" },
                    { title: "Define MVP Features" }
                ]
            });
            
            this.updateStageInfo(2, {
                name: "Development", 
                description: "Build and prototype your solution",
                startDay: 4,
                endDay: 6,
                goals: [
                    { title: "Create MVP Wireframes" },
                    { title: "Technical Architecture Planning" },
                    { title: "Initial Prototype Development" }
                ]
            });
            
            this.updateStageInfo(3, {
                name: "Launch Prep",
                description: "Prepare for market entry",
                startDay: 7,
                endDay: 9, 
                goals: [
                    { title: "Beta Testing Strategy" },
                    { title: "Marketing Plan Development" },
                    { title: "Funding Preparation" }
                ]
            });
        } else {
            // Default fallback for other career goals
            this.updateStageInfo(1, {
                name: "Foundation",
                description: "Build core skills & knowledge",
                startDay: 1,
                endDay: 3,
                goals: [
                    { title: "Skill Gap Analysis" },
                    { title: "Learning Path Creation" },
                    { title: "Network Building Start" }
                ]
            });
        }
    }

    setFallbackMotivationalContent(dreamText, currentStreak) {
        this.setFallbackHeaderContent(dreamText, currentStreak);
        this.setFallbackStageData();
    }

    setFallbackHeaderContent(dreamText, currentStreak) {
        // Extract career goal from dream text
        const careerMatch = dreamText.match(/(?:become|be)\s+(?:a|an)\s+([^,.\n]+)/i);
        const career = careerMatch ? careerMatch[1].trim() : "your dream role";
        
        // Fallback motivational messages
        const titles = [
            `🚀 ${career.toUpperCase()} Journey`,
            `💫 Your Path to ${career}`,
            `🎯 ${career} in 21 Days`
        ];
        
        const subtitles = [
            `${career}s earn $200K+ annually - Your consistency determines everything`,
            `Top ${career}s share one trait: They never break their streaks`,
            `Every day you skip, someone else gets closer to your dream job`
        ];
        
        const challenges = [
            currentStreak === 0 ? "Start your first streak today!" : `${currentStreak} days strong! Keep the momentum!`,
            "Your future self is watching. Make them proud.",
            "Consistency beats perfection. Start now!"
        ];
        
        document.getElementById('dynamic-title').textContent = titles[currentStreak % titles.length];
        document.getElementById('dynamic-subtitle').textContent = subtitles[Math.floor(Math.random() * subtitles.length)];
        document.getElementById('dynamic-challenge').textContent = challenges[currentStreak === 0 ? 0 : Math.floor(Math.random() * challenges.length)];
    }


    calculateCurrentStreak() {
        if (!this.currentJourney || !this.currentJourney.overallProgress) return 0;
        
        const completedDays = this.currentJourney.overallProgress.completedDays || 0;
        
        // If no completed days but we have sprint data, use completed goals
        if (completedDays === 0 && this.currentJourney.currentSprintData) {
            const sprint = this.currentJourney.currentSprintData;
            if (sprint.goals) {
                return sprint.goals.filter(g => g.completed).length;
            }
        }
        
        return completedDays;
    }


    showLoading() {
        const modal = document.getElementById('loading-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    hideLoading() {
        const modal = document.getElementById('loading-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
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

    /**
     * Get formatted generation method information for display
     */
    getGenerationMethodInfo(provider, model) {
        if (provider === 'openai') {
            return `✨ AI-powered by ${model || 'OpenAI GPT'}`;
        } else if (provider === 'claude') {
            return `✨ AI-powered by ${model || 'Claude'}`;
        } else if (provider === 'llama') {
            return `✨ AI-powered by ${model || 'LLaMA'}`;
        } else if (provider === 'gemini') {
            return `✨ AI-powered by ${model || 'Gemini'}`;
        } else {
            return `📋 Template-based plan`;
        }
    }

    showMotivation(message) {
        this.showNotification(message, 'motivation');
    }

    showNotification(message, type = 'info') {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 max-w-md p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' :
            type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' :
            type === 'motivation' ? 'bg-purple-100 border border-purple-400 text-purple-700' :
            'bg-blue-100 border border-blue-400 text-blue-700'
        }`;
        
        notification.innerHTML = `
            <div class="flex items-start">
                <div class="flex-1">
                    <p class="text-sm font-medium">${message.replace(/\n/g, '<br>')}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-gray-400 hover:text-gray-600">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    hideJourneyForm() {
        const formSection = document.getElementById('dream-input-section');
        if (formSection) {
            formSection.style.display = 'none';
        }
        
        // Hide example dreams section too  
        const exampleSections = document.querySelectorAll('.glass-effect');
        exampleSections.forEach((section, index) => {
            if (index > 0) { // Skip the first one which is the form
                section.style.display = 'none';
            }
        });
    }

    showJourneyProgress() {
        const progressSection = document.getElementById('journey-progress-section');
        
        if (progressSection) {
            // AGGRESSIVE force show - remove all hiding styles
            progressSection.removeAttribute('style');
            progressSection.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; min-height: 500px !important;';
            progressSection.className = 'mb-8';
            
            // Force all children to be visible
            const allChildren = progressSection.querySelectorAll('*');
            allChildren.forEach(child => {
                child.style.visibility = 'visible';
                child.style.opacity = '1';
            });
            
            // Ensure grid layout works properly
            const gridContainer = progressSection.querySelector('.grid');
            if (gridContainer) {
                gridContainer.style.cssText = 'display: grid !important; grid-template-columns: 300px 1fr !important; gap: 1.5rem !important; min-height: 400px !important;';
                
                // Ensure sidebar and journey map are visible
                const sidebar = gridContainer.querySelector('.lg\\:col-span-1');
                const journeyMap = gridContainer.querySelector('.lg\\:col-span-3');
                
                if (sidebar) {
                    sidebar.style.cssText = 'display: block !important; grid-column: 1 !important; visibility: visible !important; opacity: 1 !important;';
                }
                
                if (journeyMap) {
                    journeyMap.style.cssText = 'display: block !important; grid-column: 2 !important; visibility: visible !important; opacity: 1 !important;';
                }
            }
            
            // Populate data first
            this.populateJourneyData();
            
            // Replace the complex HTML structure with a simple, working layout
            progressSection.innerHTML = `
                ${this.generateMainInspirationalHeader()}
                <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
                    <div style="display: grid; grid-template-columns: 350px 1fr; gap: 30px; align-items: start;">
                        <!-- Sidebar -->
                        <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            ${this.generateStageMotivationHeader()}
                            
                            <!-- Dream Summary -->
                            <div style="margin-bottom: 20px;">
                                <h4 style="font-size: 14px; font-weight: 600; color: #6b7280; margin-bottom: 8px;">Dream</h4>
                                <p style="font-size: 14px; color: #1f2937; background: #dbeafe; padding: 12px; border-radius: 8px; line-height: 1.5;">${this.currentJourney?.dreamText || 'Your dream will appear here'}</p>
                            </div>
                            
                            <!-- Progress Stats -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                                <div style="text-align: center; background: #f3f4f6; padding: 12px; border-radius: 8px;">
                                    <div style="font-size: 24px; font-weight: bold; color: #1f2937;">${this.currentJourney?.currentDay || 1}</div>
                                    <div style="font-size: 12px; color: #6b7280;">Current Day</div>
                                </div>
                                <div style="text-align: center; background: #f3f4f6; padding: 12px; border-radius: 8px;">
                                    <div style="font-size: 24px; font-weight: bold; color: #1f2937;">${this.currentJourney?.confidence || 0}%</div>
                                    <div style="font-size: 12px; color: #6b7280;">Readiness</div>
                                </div>
                            </div>
                            
                            <!-- Journey Details -->
                            <div style="space-y: 12px;">
                                <div style="margin-bottom: 12px;">
                                    <span style="font-size: 12px; color: #6b7280;">Timeline:</span>
                                    <span style="font-size: 14px; font-weight: 600; color: #1f2937; margin-left: 8px;">${this.currentJourney?.timeHorizon || 0} weeks</span>
                                </div>
                                <div style="margin-bottom: 12px;">
                                    <span style="font-size: 12px; color: #6b7280;">Commitment:</span>
                                    <span style="font-size: 14px; font-weight: 600; color: #1f2937; margin-left: 8px;">${this.formatCommitmentText(this.currentJourney?.timeCommitment) || 'Not set'}</span>
                                </div>
                                <div style="margin-bottom: 12px;">
                                    <span style="font-size: 12px; color: #6b7280;">Learning Style:</span>
                                    <span style="font-size: 14px; font-weight: 600; color: #1f2937; margin-left: 8px;">${this.capitalizeFirst(this.currentJourney?.learningStyle) || 'Not set'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Journey Map -->
                        <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <h3 style="font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 20px;">21-Day Progress Map</h3>
                            ${this.generateJourneyMap()}
                        </div>
                    </div>
                </div>
            `;
            
            // Then scroll to show it
            setTimeout(() => {
                progressSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Final verification
                const rect = progressSection.getBoundingClientRect();
                console.log('🔍 Progress section details:', {
                    height: rect.height,
                    width: rect.width,
                    top: rect.top,
                    left: rect.left,
                    bottom: rect.bottom,
                    display: window.getComputedStyle(progressSection).display,
                    visibility: window.getComputedStyle(progressSection).visibility,
                    opacity: window.getComputedStyle(progressSection).opacity
                });
                
                if (rect.height > 100) {
                    console.log('✅ Progress section is visible! Height:', rect.height);
                    
                    // Check if it's in viewport
                    const isInViewport = rect.top >= 0 && rect.left >= 0 && 
                                       rect.bottom <= window.innerHeight && 
                                       rect.right <= window.innerWidth;
                    console.log('📍 Is in viewport:', isInViewport);
                    
                } else {
                    console.log('❌ Progress section still not visible. Height:', rect.height);
                }
            }, 300);
        } else {
            console.log('❌ journey-progress-section element not found!');
        }
    }

    async populateJourneyData() {
        if (!this.currentJourney) {
            return;
        }

        
        // Skip motivational content for now to avoid errors
        // await this.updateMotivationalContent();

        // Populate user context with fallback values
        const dreamEl = document.getElementById('journey-dream-text');
        const confidenceEl = document.getElementById('journey-confidence');
        const confidenceBar = document.getElementById('confidence-bar');
        const timelineEl = document.getElementById('journey-timeline');
        const commitmentEl = document.getElementById('journey-commitment');
        const learningStyleEl = document.getElementById('journey-learning-style');

        // Use stored values or defaults
        const dreamText = this.currentJourney.dreamText || "Building my dream career in tech";
        const confidence = this.currentJourney.confidence || 75;
        const timeHorizon = this.currentJourney.timeHorizon || 52;
        const timeCommitment = this.currentJourney.timeCommitment || "micro-burst";
        const learningStyle = this.currentJourney.learningStyle || "visual";

        console.log('🔍 Populating with data:', { dreamText, confidence, timeHorizon, timeCommitment, learningStyle });
        console.log('🔍 Looking for dreamEl:', dreamEl);
        
        if (dreamEl) {
            dreamEl.textContent = dreamText;
            dreamEl.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; background-color: lime !important; padding: 20px !important; border: 5px solid red !important; font-size: 18px !important; font-weight: bold !important; color: black !important; z-index: 9999 !important; position: relative !important; margin: 10px !important;';
            console.log('✅ Dream element populated:', dreamEl.textContent);
        } else {
            console.log('❌ Dream element not found!');
        }
        
        if (confidenceEl) {
            confidenceEl.textContent = `${confidence}%`;
            confidenceEl.style.cssText = 'display: inline !important; visibility: visible !important; opacity: 1 !important; background-color: cyan !important; padding: 10px !important; border: 3px solid blue !important; font-size: 16px !important; font-weight: bold !important; color: black !important; z-index: 9999 !important; position: relative !important;';
            console.log('✅ Confidence element populated:', confidenceEl.textContent);
            if (confidenceBar) {
                confidenceBar.style.width = `${confidence}%`;
                confidenceBar.style.display = 'block';
            }
        } else {
            console.log('❌ Confidence element not found!');
        }
        
        if (timelineEl) {
            timelineEl.textContent = `${timeHorizon} weeks`;
            timelineEl.style.display = 'inline';
        }
        
        if (commitmentEl) {
            commitmentEl.textContent = this.formatCommitmentText(timeCommitment);
            commitmentEl.style.display = 'inline';
        }
        
        if (learningStyleEl) {
            learningStyleEl.textContent = this.capitalizeFirst(learningStyle);
            learningStyleEl.style.display = 'inline';
        }

        // Force all sidebar content to be visible
        const sidebarElements = [
            'journey-dream-text', 'journey-confidence', 'journey-timeline', 
            'journey-commitment', 'journey-learning-style', 'current-streak', 
            'goals-completed', 'overall-progress-percent', 'current-day'
        ];
        
        sidebarElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                // Don't override display - let CSS handle it
                el.style.visibility = 'visible';
                el.style.opacity = '1';
            }
        });

        // Also force parent containers to be visible
        const parentContainers = [
            'journey-progress-section',
            'journey-progress-section .lg\\:col-span-1',
            'journey-progress-section .glass-effect'
        ];
        
        parentContainers.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.style.display = 'block';
                el.style.visibility = 'visible';
                el.style.opacity = '1';
            });
        });

        // Update progress display
        this.updateProgressDisplayFromCurrentJourney();
        
    }

    updateProgressDisplayFromCurrentJourney() {
        if (!this.currentJourney) return;


        // Update overall progress
        const progressPercent = document.getElementById('overall-progress-percent');
        const progressBar = document.getElementById('overall-progress-bar');
        const currentDayEl = document.getElementById('current-day');
        const streakEl = document.getElementById('current-streak');
        const goalsCompletedEl = document.getElementById('goals-completed');

        const overallProgress = this.currentJourney.overallProgress || {};
        const percentage = overallProgress.completionPercentage || 5;
        const currentDay = this.currentJourney.currentDay || 1;
        const completedTasks = overallProgress.completedTasks || 0;
        const completedDays = overallProgress.completedDays || 0;

        // Calculate actual streak based on completed goals or current progress
        let actualStreak = completedDays;
        
        // If completedDays is 0 but we have progress, calculate streak differently
        if (completedDays === 0 && this.currentJourney.currentSprintData) {
            const sprint = this.currentJourney.currentSprintData;
            if (sprint.goals) {
                actualStreak = sprint.goals.filter(g => g.completed).length;
            }
        }
        
        // If still 0 and we're past day 1, use currentDay - 1 as a fallback
        if (actualStreak === 0 && currentDay > 1) {
            actualStreak = currentDay - 1;
        }


        if (progressPercent) {
            progressPercent.textContent = `${percentage}%`;
            progressPercent.style.visibility = 'visible';
            progressPercent.style.opacity = '1';
        }
        
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
        
        if (currentDayEl) {
            currentDayEl.textContent = currentDay;
            currentDayEl.style.visibility = 'visible';
            currentDayEl.style.opacity = '1';
        }
        
        if (streakEl) {
            streakEl.textContent = actualStreak;
            streakEl.style.visibility = 'visible';
            streakEl.style.opacity = '1';
        }
        
        if (goalsCompletedEl) {
            goalsCompletedEl.textContent = completedTasks;
            goalsCompletedEl.style.visibility = 'visible';
            goalsCompletedEl.style.opacity = '1';
        }

        // Update stage progress
        this.updateStageDisplayFromCurrentJourney();
    }

    updateStageDisplayFromCurrentJourney() {
        if (!this.currentJourney.currentSprintData) return;

        const sprint = this.currentJourney.currentSprintData;
        const completedGoals = sprint.goals ? sprint.goals.filter(g => g.completed).length : 0;

        // Update stage 1 progress
        const stage1Completed = document.getElementById('stage-1-completed');
        if (stage1Completed) {
            stage1Completed.textContent = completedGoals;
        }

        // Update day dots based on completed goals
        for (let i = 1; i <= 3; i++) {
            const dayDot = document.getElementById(`day-${i}-dot`);
            if (dayDot) {
                if (i <= completedGoals) {
                    dayDot.className = 'w-4 h-4 rounded-full bg-green-500 flex items-center justify-center';
                    dayDot.innerHTML = '<span class="w-2 h-2 bg-white rounded-full"></span>';
                } else if (i === completedGoals + 1) {
                    dayDot.className = 'w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center';
                    dayDot.innerHTML = '<span class="w-2 h-2 bg-white rounded-full"></span>';
                } else {
                    dayDot.className = 'w-4 h-4 rounded-full bg-gray-300';
                    dayDot.innerHTML = '';
                }
            }
        }

        // Update stage 1 status
        const stage1Status = document.getElementById('stage-1-status');
        if (stage1Status) {
            if (completedGoals >= 3) {
                stage1Status.textContent = 'Completed';
                stage1Status.className = 'px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium';
                this.unlockStage2();
            } else {
                stage1Status.textContent = 'In Progress';
                stage1Status.className = 'px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium';
            }
        }
    }

    async updateProgressDisplay() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.apiBase}/journey/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    this.updateOverallProgress(result.data);
                    this.updateStageProgress(result.data);
                }
            }
        } catch (error) {
            console.error('Failed to update progress:', error);
        }
    }

    updateOverallProgress(journeyStatus) {
        const progressPercent = document.getElementById('overall-progress-percent');
        const progressBar = document.getElementById('overall-progress-bar');
        const currentDayEl = document.getElementById('current-day');
        const streakEl = document.getElementById('current-streak');
        const goalsCompletedEl = document.getElementById('goals-completed');

        if (journeyStatus.overallProgress) {
            const percentage = journeyStatus.overallProgress.completionPercentage || 0;
            if (progressPercent) progressPercent.textContent = `${percentage}%`;
            if (progressBar) progressBar.style.width = `${percentage}%`;
        }

        if (currentDayEl && journeyStatus.currentDay) {
            currentDayEl.textContent = journeyStatus.currentDay;
        }

        // Update streak and goals completed
        if (streakEl) {
            const streak = this.calculateStreak(journeyStatus);
            streakEl.textContent = streak;
        }

        if (goalsCompletedEl && journeyStatus.currentSprintData) {
            const completedGoals = journeyStatus.currentSprintData.goals ? 
                journeyStatus.currentSprintData.goals.filter(g => g.completed).length : 0;
            goalsCompletedEl.textContent = completedGoals;
        }
    }

    updateStageProgress(journeyStatus) {
        if (!journeyStatus.currentSprintData) return;

        const sprint = journeyStatus.currentSprintData;
        const completedGoals = sprint.goals ? sprint.goals.filter(g => g.completed).length : 0;

        // Update stage 1 progress
        const stage1Completed = document.getElementById('stage-1-completed');
        if (stage1Completed) {
            stage1Completed.textContent = completedGoals;
        }

        // Update day dots based on completed goals
        for (let i = 1; i <= 3; i++) {
            const dayDot = document.getElementById(`day-${i}-dot`);
            if (dayDot) {
                if (i <= completedGoals) {
                    dayDot.className = 'w-4 h-4 rounded-full bg-green-500 flex items-center justify-center';
                    dayDot.innerHTML = '<span class="w-2 h-2 bg-white rounded-full"></span>';
                } else if (i === completedGoals + 1) {
                    dayDot.className = 'w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center';
                    dayDot.innerHTML = '<span class="w-2 h-2 bg-white rounded-full"></span>';
                } else {
                    dayDot.className = 'w-4 h-4 rounded-full bg-gray-300';
                    dayDot.innerHTML = '';
                }
            }
        }

        // Update stage 1 status
        const stage1Status = document.getElementById('stage-1-status');
        if (stage1Status) {
            if (completedGoals >= 3) {
                stage1Status.textContent = 'Completed';
                stage1Status.className = 'px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium';
                
                // Trigger stage 2 unlock
                this.unlockStage2();
            } else {
                stage1Status.textContent = 'In Progress';
                stage1Status.className = 'px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium';
            }
        }
    }

    unlockStage2() {
        const stage2Container = document.getElementById('stage-2-container');
        const stage2Icon = document.getElementById('stage-2-icon');
        const stage2Title = document.getElementById('stage-2-title');
        const stage2Subtitle = document.getElementById('stage-2-subtitle');
        const stage2Status = document.getElementById('stage-2-status');
        const unlockCondition = document.getElementById('stage-2-unlock-condition');

        if (stage2Container) {
            // Remove opacity and make it active
            stage2Container.className = 'mb-8 transition-all duration-500';
            
            // Update icon to unlocked
            if (stage2Icon) {
                stage2Icon.className = 'w-12 h-12 rounded-full bg-green-500 flex items-center justify-center mr-4';
                stage2Icon.innerHTML = '<span class="text-white font-bold">2</span>';
            }
            
            // Update text colors
            if (stage2Title) {
                stage2Title.className = 'text-lg font-semibold text-gray-800';
            }
            if (stage2Subtitle) {
                stage2Subtitle.className = 'text-sm text-gray-600';
            }
            
            // Update status
            if (stage2Status) {
                stage2Status.textContent = 'Unlocked!';
                stage2Status.className = 'px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium';
            }
            
            // Replace unlock condition with success message
            if (unlockCondition) {
                unlockCondition.innerHTML = `
                    <div class="flex items-start">
                        <div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                            <span class="text-green-600 text-sm">🎉</span>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-green-800">Stage 2 Unlocked!</p>
                            <p class="text-xs text-green-600 mt-1">Great work! You've completed Stage 1. Ready for the next challenge?</p>
                        </div>
                    </div>
                `;
                unlockCondition.className = 'bg-green-50 border border-green-200 rounded-lg p-4';
            }
            
            // Show celebration animation
            this.showCelebration('🎉 Stage 2 Unlocked! Amazing progress!');
        }
    }

    calculateStreak(journeyStatus) {
        // Simple streak calculation based on completed goals
        // In a real implementation, this would track consecutive days
        if (!journeyStatus.currentSprintData || !journeyStatus.currentSprintData.goals) return 0;
        
        const completedGoals = journeyStatus.currentSprintData.goals.filter(g => g.completed).length;
        return completedGoals; // For now, streak = completed goals in current sprint
    }

    showCelebration(message) {
        // Create a temporary celebration message
        const celebration = document.createElement('div');
        celebration.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-500';
        celebration.textContent = message;
        
        document.body.appendChild(celebration);
        
        // Animate in
        setTimeout(() => {
            celebration.style.transform = 'translateY(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            celebration.style.transform = 'translateY(-100px)';
            celebration.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(celebration);
            }, 500);
        }, 3000);
    }

    formatCommitmentText(commitment) {
        const commitmentMap = {
            'micro-burst': 'Micro Burst',
            'focused-blocks': 'Focused Blocks', 
            'flexible-flow': 'Flexible Flow'
        };
        return commitmentMap[commitment] || commitment;
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    inferCareerPath(dreamText) {
        const entrepreneurKeywords = [
            'start', 'startup', 'launch', 'build', 'create', 'found', 'company', 
            'business', 'venture', 'entrepreneur', 'own', 'establish'
        ];
        
        const lowerDreamText = dreamText.toLowerCase();
        const hasEntrepreneurKeywords = entrepreneurKeywords.some(keyword => 
            lowerDreamText.includes(keyword)
        );
        
        return hasEntrepreneurKeywords ? 'entrepreneur' : 'employee';
    }

    generateStageMotivationHeader() {
        const currentDay = this.currentJourney?.currentDay || 1;
        
        // Determine current stage and messaging
        let headerHTML = '';
        
        if (currentDay === 1) {
            headerHTML = `
                <div style="text-align: center; margin-bottom: 20px; padding: 16px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 8px; color: white;">
                    <div style="font-size: 20px; margin-bottom: 8px;">🌟</div>
                    <h3 style="margin: 0; font-size: 16px; font-weight: bold; margin-bottom: 4px;">The Journey Begins</h3>
                    <p style="margin: 0; font-size: 12px; opacity: 0.9;">Day 1: Foundation stage awaits. Can you make it 3 days?</p>
                </div>
            `;
        } else if (currentDay >= 2 && currentDay <= 3) {
            headerHTML = `
                <div style="text-align: center; margin-bottom: 20px; padding: 16px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 8px; color: white;">
                    <div style="font-size: 20px; margin-bottom: 8px;">🔥</div>
                    <h3 style="margin: 0; font-size: 16px; font-weight: bold; margin-bottom: 4px;">Building Momentum</h3>
                    <p style="margin: 0; font-size: 12px; opacity: 0.9;">Day ${currentDay}: Keep going! Discovery stage unlocks soon...</p>
                </div>
            `;
        } else if (currentDay === 4) {
            headerHTML = `
                <div style="text-align: center; margin-bottom: 20px; padding: 16px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); border-radius: 8px; color: white;">
                    <div style="font-size: 20px; margin-bottom: 8px;">🤔</div>
                    <h3 style="margin: 0; font-size: 16px; font-weight: bold; margin-bottom: 4px;">Reflection Time</h3>
                    <p style="margin: 0; font-size: 12px; opacity: 0.9;">Pause. Think. You've come so far. What's next?</p>
                </div>
            `;
        } else if (currentDay >= 5 && currentDay <= 8) {
            headerHTML = `
                <div style="text-align: center; margin-bottom: 20px; padding: 16px; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 8px; color: white;">
                    <div style="font-size: 20px; margin-bottom: 8px;">🔍</div>
                    <h3 style="margin: 0; font-size: 16px; font-weight: bold; margin-bottom: 4px;">Discovery Unlocked!</h3>
                    <p style="margin: 0; font-size: 12px; opacity: 0.9;">Day ${currentDay}: You did it! Now, what will you discover?</p>
                </div>
            `;
        } else if (currentDay >= 9 && currentDay <= 12) {
            headerHTML = `
                <div style="text-align: center; margin-bottom: 20px; padding: 16px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 8px; color: white;">
                    <div style="font-size: 20px; margin-bottom: 8px;">🔨</div>
                    <h3 style="margin: 0; font-size: 16px; font-weight: bold; margin-bottom: 4px;">Building Phase</h3>
                    <p style="margin: 0; font-size: 12px; opacity: 0.9;">Day ${currentDay}: Milestone 2 approaches. Ready to build?</p>
                </div>
            `;
        } else if (currentDay >= 13 && currentDay <= 16) {
            headerHTML = `
                <div style="text-align: center; margin-bottom: 20px; padding: 16px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); border-radius: 8px; color: white;">
                    <div style="font-size: 20px; margin-bottom: 8px;">⚡</div>
                    <h3 style="margin: 0; font-size: 16px; font-weight: bold; margin-bottom: 4px;">Momentum Mode</h3>
                    <p style="margin: 0; font-size: 12px; opacity: 0.9;">Day ${currentDay}: You're unstoppable now. Mastery awaits...</p>
                </div>
            `;
        } else if (currentDay >= 17 && currentDay <= 20) {
            headerHTML = `
                <div style="text-align: center; margin-bottom: 20px; padding: 16px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 8px; color: white;">
                    <div style="font-size: 20px; margin-bottom: 8px;">🎯</div>
                    <h3 style="margin: 0; font-size: 16px; font-weight: bold; margin-bottom: 4px;">Mastery Level</h3>
                    <p style="margin: 0; font-size: 12px; opacity: 0.9;">Day ${currentDay}: So close! Transformation is within reach...</p>
                </div>
            `;
        } else if (currentDay === 21) {
            headerHTML = `
                <div style="text-align: center; margin-bottom: 20px; padding: 16px; background: linear-gradient(135deg, #06b6d4, #0891b2); border-radius: 8px; color: white;">
                    <div style="font-size: 20px; margin-bottom: 8px;">🚀</div>
                    <h3 style="margin: 0; font-size: 16px; font-weight: bold; margin-bottom: 4px;">Transformation Day</h3>
                    <p style="margin: 0; font-size: 12px; opacity: 0.9;">Day 21: The final push. You've become who you set out to be.</p>
                </div>
            `;
        } else {
            headerHTML = `
                <div style="text-align: center; margin-bottom: 20px; padding: 16px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 8px; color: white;">
                    <div style="font-size: 20px; margin-bottom: 8px;">🎉</div>
                    <h3 style="margin: 0; font-size: 16px; font-weight: bold; margin-bottom: 4px;">Journey Complete!</h3>
                    <p style="margin: 0; font-size: 12px; opacity: 0.9;">You did it! Your transformation is complete. What's next?</p>
                </div>
            `;
        }
        
        return headerHTML;
    }

    getUnlockHint(stageId, currentDay) {
        const hints = {
            1: '🔒 Start here!',
            2: currentDay >= 4 ? '🔓 Unlocked!' : '🔒 Complete Foundation',
            3: currentDay >= 8 ? '🔓 Unlocked!' : '🔒 Finish Discovery',
            4: currentDay >= 12 ? '🔓 Unlocked!' : '🔒 Complete Building',
            5: currentDay >= 16 ? '🔓 Unlocked!' : '🔒 Finish Momentum',
            6: currentDay >= 20 ? '🔓 Final Stage!' : '🔒 Master all previous'
        };
        return hints[stageId] || '🔒 Locked';
    }

    getStageMotivation(stageId, currentDay) {
        const motivations = {
            1: currentDay === 1 ? 'First step counts!' : 
                currentDay === 2 ? 'Momentum building!' : 
                'Almost to Discovery!',
            2: currentDay === 5 ? 'New stage unlocked!' : 
                currentDay <= 7 ? 'What will you find?' : 
                'Reflection time!',
            3: currentDay === 9 ? 'Building begins!' : 
                currentDay <= 11 ? 'Creating something great!' : 
                'Time to reflect!',
            4: currentDay === 13 ? 'Momentum mode!' : 
                currentDay <= 15 ? 'Unstoppable now!' : 
                'Almost to Mastery!',
            5: currentDay === 17 ? 'Mastery level!' : 
                currentDay <= 19 ? 'So close to the end!' : 
                'Final reflection!',
            6: 'Final transformation!'
        };
        return motivations[stageId] || 'Keep going!';
    }

    generateMainInspirationalHeader() {
        const currentDay = this.currentJourney?.currentDay || 1;
        const dreamText = this.currentJourney?.dreamText || "Your Dream";
        
        // Extract first few words of dream for personalization
        const dreamSummary = dreamText.length > 50 ? 
            dreamText.substring(0, 50) + "..." : 
            dreamText;
        
        let headerContent = '';
        
        if (currentDay === 1) {
            headerContent = `
                <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 40px; text-align: center; color: white; margin-bottom: 30px;">
                        <div style="font-size: 48px; margin-bottom: 16px;">🌟</div>
                        <h1 style="font-size: 32px; font-weight: bold; margin: 0 0 16px 0; line-height: 1.2;">The Journey Begins</h1>
                        <p style="font-size: 18px; margin: 0 0 20px 0; opacity: 0.9; max-width: 600px; margin-left: auto; margin-right: auto;">"${dreamSummary}"</p>
                        <div style="background: rgba(255,255,255,0.2); border-radius: 12px; padding: 20px; max-width: 500px; margin: 0 auto;">
                            <p style="margin: 0; font-size: 16px; font-weight: 600;">Day 1 Challenge</p>
                            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Can you commit to just 3 days? Let's find out what you're made of.</p>
                        </div>
                    </div>
                </div>
            `;
        } else if (currentDay >= 2 && currentDay <= 3) {
            headerContent = `
                <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px; padding: 40px; text-align: center; color: white; margin-bottom: 30px;">
                        <div style="font-size: 48px; margin-bottom: 16px;">🔥</div>
                        <h1 style="font-size: 32px; font-weight: bold; margin: 0 0 16px 0; line-height: 1.2;">Momentum is Building</h1>
                        <p style="font-size: 18px; margin: 0 0 20px 0; opacity: 0.9;">Day ${currentDay}: You're proving something to yourself right now.</p>
                        <div style="background: rgba(255,255,255,0.2); border-radius: 12px; padding: 20px; max-width: 500px; margin: 0 auto;">
                            <p style="margin: 0; font-size: 16px; font-weight: 600;">The Discovery stage is so close...</p>
                            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Every day you continue, you're becoming someone new.</p>
                        </div>
                    </div>
                </div>
            `;
        } else if (currentDay === 4) {
            headerContent = `
                <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 16px; padding: 40px; text-align: center; color: white; margin-bottom: 30px;">
                        <div style="font-size: 48px; margin-bottom: 16px;">🤔</div>
                        <h1 style="font-size: 32px; font-weight: bold; margin: 0 0 16px 0; line-height: 1.2;">Time to Reflect</h1>
                        <p style="font-size: 18px; margin: 0 0 20px 0; opacity: 0.9;">You've completed your first 3 days. How does it feel?</p>
                        <div style="background: rgba(255,255,255,0.2); border-radius: 12px; padding: 20px; max-width: 500px; margin: 0 auto;">
                            <p style="margin: 0; font-size: 16px; font-weight: 600;">Foundation Stage: Complete ✨</p>
                            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Tomorrow, Discovery unlocks. What will you find?</p>
                        </div>
                    </div>
                </div>
            `;
        } else if (currentDay >= 5 && currentDay <= 8) {
            headerContent = `
                <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 16px; padding: 40px; text-align: center; color: white; margin-bottom: 30px;">
                        <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
                        <h1 style="font-size: 32px; font-weight: bold; margin: 0 0 16px 0; line-height: 1.2;">Discovery Mode: Activated</h1>
                        <p style="font-size: 18px; margin: 0 0 20px 0; opacity: 0.9;">Day ${currentDay}: You unlocked this! Now, what will you discover about yourself?</p>
                        <div style="background: rgba(255,255,255,0.2); border-radius: 12px; padding: 20px; max-width: 500px; margin: 0 auto;">
                            <p style="margin: 0; font-size: 16px; font-weight: 600;">You're in the top 20% who make it this far</p>
                            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Most people quit by day 3. Not you.</p>
                        </div>
                    </div>
                </div>
            `;
        } else if (currentDay >= 9 && currentDay <= 12) {
            headerContent = `
                <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 16px; padding: 40px; text-align: center; color: white; margin-bottom: 30px;">
                        <div style="font-size: 48px; margin-bottom: 16px;">🔨</div>
                        <h1 style="font-size: 32px; font-weight: bold; margin: 0 0 16px 0; line-height: 1.2;">Building Something Great</h1>
                        <p style="font-size: 18px; margin: 0 0 20px 0; opacity: 0.9;">Day ${currentDay}: Week 2 unlocked. You're officially committed now.</p>
                        <div style="background: rgba(255,255,255,0.2); border-radius: 12px; padding: 20px; max-width: 500px; margin: 0 auto;">
                            <p style="margin: 0; font-size: 16px; font-weight: 600;">Milestone 2 is within reach 🏆</p>
                            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">The person you're becoming is already showing.</p>
                        </div>
                    </div>
                </div>
            `;
        } else if (currentDay >= 13 && currentDay <= 16) {
            headerContent = `
                <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 16px; padding: 40px; text-align: center; color: white; margin-bottom: 30px;">
                        <div style="font-size: 48px; margin-bottom: 16px;">⚡</div>
                        <h1 style="font-size: 32px; font-weight: bold; margin: 0 0 16px 0; line-height: 1.2;">You're Unstoppable</h1>
                        <p style="font-size: 18px; margin: 0 0 20px 0; opacity: 0.9;">Day ${currentDay}: This is momentum. This is what transformation feels like.</p>
                        <div style="background: rgba(255,255,255,0.2); border-radius: 12px; padding: 20px; max-width: 500px; margin: 0 auto;">
                            <p style="margin: 0; font-size: 16px; font-weight: 600;">You're in the top 5% now</p>
                            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Mastery awaits. Can you feel it?</p>
                        </div>
                    </div>
                </div>
            `;
        } else if (currentDay >= 17 && currentDay <= 20) {
            headerContent = `
                <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 16px; padding: 40px; text-align: center; color: white; margin-bottom: 30px;">
                        <div style="font-size: 48px; margin-bottom: 16px;">🎯</div>
                        <h1 style="font-size: 32px; font-weight: bold; margin: 0 0 16px 0; line-height: 1.2;">Mastery Level Achieved</h1>
                        <p style="font-size: 18px; margin: 0 0 20px 0; opacity: 0.9;">Day ${currentDay}: Week 3. You're not the same person who started this journey.</p>
                        <div style="background: rgba(255,255,255,0.2); border-radius: 12px; padding: 20px; max-width: 500px; margin: 0 auto;">
                            <p style="margin: 0; font-size: 16px; font-weight: 600;">Transformation is so close you can taste it</p>
                            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Less than 1% make it this far. You're legendary.</p>
                        </div>
                    </div>
                </div>
            `;
        } else if (currentDay === 21) {
            headerContent = `
                <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); border-radius: 16px; padding: 40px; text-align: center; color: white; margin-bottom: 30px;">
                        <div style="font-size: 48px; margin-bottom: 16px;">🚀</div>
                        <h1 style="font-size: 32px; font-weight: bold; margin: 0 0 16px 0; line-height: 1.2;">Transformation Day</h1>
                        <p style="font-size: 18px; margin: 0 0 20px 0; opacity: 0.9;">Day 21: You've become the person your dream needed you to be.</p>
                        <div style="background: rgba(255,255,255,0.2); border-radius: 12px; padding: 20px; max-width: 500px; margin: 0 auto;">
                            <p style="margin: 0; font-size: 16px; font-weight: 600;">Final Push. Final Glory. 🏆</p>
                            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">This is your moment. Make it count.</p>
                        </div>
                    </div>
                </div>
            `;
        } else {
            headerContent = `
                <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px; padding: 40px; text-align: center; color: white; margin-bottom: 30px;">
                        <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
                        <h1 style="font-size: 32px; font-weight: bold; margin: 0 0 16px 0; line-height: 1.2;">Legend Status: Achieved</h1>
                        <p style="font-size: 18px; margin: 0 0 20px 0; opacity: 0.9;">You completed the impossible. You transformed "${dreamSummary}"</p>
                        <div style="background: rgba(255,255,255,0.2); border-radius: 12px; padding: 20px; max-width: 500px; margin: 0 auto;">
                            <p style="margin: 0; font-size: 16px; font-weight: 600;">You're now in the 0.1% who finish what they start</p>
                            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">What's your next impossible dream?</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        return headerContent;
    }

    generateJourneyMap() {
        const currentDay = this.currentJourney?.currentDay || 1;
        
        // Define the stage structure: 3 days + 1 reflection day = 4 days per stage
        const stages = [
            // Week 1
            { id: 1, name: "Foundation", days: [1, 2, 3], reflection: 4, milestone: true, icon: "🌱", color: "#10b981" },
            { id: 2, name: "Self Discovery", days: [5, 6, 7], reflection: 8, milestone: false, icon: "🔍", color: "#3b82f6" },
            
            // Week 2
            { id: 3, name: "Building", days: [9, 10, 11], reflection: 12, milestone: true, icon: "🔨", color: "#f59e0b" },
            { id: 4, name: "Momentum", days: [13, 14, 15], reflection: 16, milestone: false, icon: "⚡", color: "#8b5cf6" },
            
            // Week 3
            { id: 5, name: "Mastery", days: [17, 18, 19], reflection: 20, milestone: false, icon: "🎯", color: "#ef4444" },
            { id: 6, name: "Transformation", days: [21], reflection: null, milestone: true, icon: "🚀", color: "#06b6d4" }
        ];
        
        let mapHTML = '<div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">';
        
        // Add gamified title with dynamic messaging
        const unlockedStages = stages.filter(stage => {
            const stageStartDay = stage.days[0];
            return currentDay >= stageStartDay;
        }).length;
        
        let stageMessage = '';
        if (currentDay === 1) {
            stageMessage = 'Ready for the challenge? 🎮';
        } else if (unlockedStages === 2) {
            stageMessage = 'Discovery unlocked! What\'s next? 🔓';
        } else if (unlockedStages === 3) {
            stageMessage = 'Building mode activated! 🔥';
        } else if (unlockedStages >= 4) {
            stageMessage = 'You\'re on fire! Keep going! ⚡';
        } else {
            stageMessage = 'Progress to unlock more! 🌟';
        }
        
        mapHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f3f4f6;">
                <h4 style="margin: 0; font-size: 16px; font-weight: bold; color: #1f2937;">🗺️ Journey Stages</h4>
                <span style="font-size: 11px; color: #6b7280; font-style: italic;">${stageMessage}</span>
            </div>
        `;
        
        // Create a more compact grid layout - 2 stages per row
        mapHTML += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">';
        
        stages.forEach((stage) => {
            // Determine stage status
            const stageStartDay = stage.days[0];
            const stageEndDay = stage.reflection || stage.days[stage.days.length - 1];
            let stageStatus = '';
            let stageOpacity = '1';
            let stageBorder = '1px solid #e5e7eb';
            
            if (currentDay > stageEndDay) {
                stageStatus = 'completed';
                stageBorder = '2px solid #10b981';
            } else if (currentDay >= stageStartDay) {
                stageStatus = 'active';
                stageBorder = '2px solid #fbbf24';
            } else {
                stageStatus = 'locked';
                stageOpacity = '0.5';
            }
            
            mapHTML += `
                <div style="
                    background: #f9fafb; 
                    border-radius: 8px; 
                    padding: 12px; 
                    opacity: ${stageOpacity};
                    border: ${stageBorder};
                    transition: all 0.2s ease;
                ">
                    <!-- Stage Header -->
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <div style="
                            width: 28px; 
                            height: 28px; 
                            background: ${stageStatus === 'completed' ? '#10b981' : stage.color}; 
                            border-radius: 50%; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center; 
                            font-size: 14px;
                        ">
                            ${stageStatus === 'completed' ? '✅' : stageStatus === 'locked' ? '🔒' : stage.icon}
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 13px; font-weight: 600; color: #1f2937; margin-bottom: 2px;">
                                ${stage.name} ${stage.milestone ? '🏆' : ''}
                            </div>
                            <div style="font-size: 10px; color: #6b7280;">
                                ${stageStatus === 'completed' ? '✨ Mastered!' : 
                                  stageStatus === 'active' ? '🎯 In Progress' : 
                                  this.getUnlockHint(stage.id, currentDay)}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Compact Day Progress -->
                    <div style="display: flex; gap: 4px;">
                        ${stage.days.map(day => {
                            let dayColor = '#e5e7eb';
                            let dayIcon = '○';
                            
                            if (day < currentDay) {
                                dayColor = '#10b981';
                                dayIcon = '●';
                            } else if (day === currentDay) {
                                dayColor = '#3b82f6';
                                dayIcon = '●';
                            }
                            
                            return `
                                <div style="
                                    flex: 1;
                                    height: 20px;
                                    background: ${dayColor}; 
                                    border-radius: 4px; 
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 10px;
                                    color: ${day <= currentDay ? 'white' : '#6b7280'};
                                    font-weight: 600;
                                " title="Day ${day}">
                                    ${day <= currentDay ? dayIcon : day}
                                </div>
                            `;
                        }).join('')}
                        
                        ${stage.reflection ? `
                            <div style="
                                flex: 1;
                                height: 20px;
                                background: ${currentDay > stage.reflection ? '#8b5cf6' : currentDay === stage.reflection ? '#3b82f6' : '#f3f4f6'}; 
                                border: 1px dashed #d1d5db;
                                border-radius: 4px; 
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 10px;
                                color: ${currentDay >= stage.reflection ? 'white' : '#9ca3af'};
                            " title="Reflection Day ${stage.reflection}">
                                ${currentDay > stage.reflection ? '🤔' : currentDay === stage.reflection ? '●' : '💭'}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        mapHTML += '</div>';
        
        // Add compact progress summary
        const completedStages = stages.filter(stage => {
            const stageEndDay = stage.reflection || stage.days[stage.days.length - 1];
            return currentDay > stageEndDay;
        }).length;
        
        const currentStage = stages.find(stage => {
            const stageStartDay = stage.days[0];
            const stageEndDay = stage.reflection || stage.days[stage.days.length - 1];
            return currentDay >= stageStartDay && currentDay <= stageEndDay;
        });
        
        mapHTML += `
            <div style="background: #f3f4f6; border-radius: 6px; padding: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 12px; color: #6b7280;">Progress</span>
                    <span style="font-size: 12px; font-weight: 600; color: #1f2937;">${completedStages}/6 stages</span>
                </div>
                <div style="background: #e5e7eb; border-radius: 3px; height: 6px; overflow: hidden; margin-bottom: 8px;">
                    <div style="background: linear-gradient(90deg, #10b981, #3b82f6); height: 100%; width: ${(completedStages / 6) * 100}%; border-radius: 3px; transition: width 0.3s;"></div>
                </div>
                <div style="text-align: center;">
                    ${currentStage ? `
                        <span style="font-size: 11px; color: #6b7280;">
                            <strong>${currentStage.name}</strong> ${currentStage.icon} • ${this.getStageMotivation(currentStage.id, currentDay)}
                        </span>
                    ` : completedStages === 6 ? `
                        <span style="font-size: 11px; color: #10b981; font-weight: 600;">
                            🎉 Legend Status Achieved! You've transformed! 🎉
                        </span>
                    ` : `
                        <span style="font-size: 11px; color: #6b7280;">
                            Your epic journey awaits! 🌟
                        </span>
                    `}
                </div>
            </div>
        `;
        
        mapHTML += '</div>';
        return mapHTML;
    }

    // Show existing journey progress

    /**
     * NEW DYNAMIC FUNCTIONALITY
     * Handles the enhanced journey progress with LLM integration
     */
    
    async initializeProgressStage() {
        this.isProgressStage = true;
        
        // This method is now only used for the dedicated progress page
        // Load user data and generate dynamic content
        await this.loadUserJourneyData();
        await this.generateStageNames();
        this.calculateProgress();
        this.renderDynamicHeader();
        this.renderCurrentStageContent();
        this.updateSidebarWithXP();
        this.setupProgressEventListeners();
    }
    
    async loadUserJourneyData() {
        // Try to load real journey data from server first
        if (!this.currentJourney) {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`${this.apiBase}/dreams/active`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const dreamsData = await response.json();
                    if (dreamsData.success && dreamsData.data.length > 0) {
                        // Use the most recent active dream
                        const latestDream = dreamsData.data[0];
                        this.currentJourney = {
                            dreamId: latestDream._id,
                            dreamText: latestDream.dreamText,
                            confidence: latestDream.confidence,
                            timeHorizon: latestDream.timeHorizon,
                            timeCommitment: latestDream.timeCommitment,
                            learningStyle: latestDream.learningStyle,
                            currentDay: latestDream.currentDay || 1,
                            journeyStartDate: latestDream.journeyStartDate,
                            planGenerated: latestDream.planGenerated,
                            goalIds: latestDream.goalIds
                        };
                        console.log('✅ Loaded real journey data with currentDay:', this.currentJourney.currentDay);
                        return;
                    }
                }
            } catch (error) {
                console.error('Error loading journey data:', error);
            }
            
            // Fallback to demo data if no real journey found
            this.currentJourney = {
                dreamText: "I want to become an AI Product Manager at Anthropic, leading a team to build revolutionary AI experiences",
                confidence: 85,
                timeHorizon: 26,
                timeCommitment: "focused-blocks",
                learningStyle: "kinesthetic",
                currentDay: 1,
                assessmentScores: {
                    readiness: 85,
                    clarity: 90,
                    commitment: 80
                },
                journeyStartDate: new Date()
            };
        }
    }
    
    async generateStageNames() {
        try {
            const prompt = `Based on this user's dream: "${this.currentJourney.dreamText}"
            
Generate exactly 6 inspiring stage names for a 21-day transformation journey. Each stage represents 3 days of focused work.

Return ONLY a JSON array of 6 stage names, like:
["Foundation Discovery", "Skill Building", "Network Expansion", "Portfolio Creation", "Interview Mastery", "Career Launch"]

Dream context: ${this.currentJourney.dreamText}`;

            const response = await this.callLLM(prompt);
            try {
                this.stageNames = JSON.parse(response);
            } catch (parseError) {
                this.stageNames = [
                    "Foundation Building", "Skill Development", "Network Expansion", 
                    "Experience Gaining", "Goal Acceleration", "Dream Achievement"
                ];
            }
        } catch (error) {
            this.stageNames = [
                "Foundation Building", "Skill Development", "Network Expansion", 
                "Experience Gaining", "Goal Acceleration", "Dream Achievement"
            ];
        }
    }
    
    calculateProgress() {
        // Use the server's currentDay instead of calculating from dates
        // This prevents timezone and date calculation issues
        this.currentDay = this.currentJourney.currentDay || 1;
        this.currentStreak = Math.min(this.currentDay - 1, 5); // Mock streak
        
        // Calculate XP (100 XP per milestone)
        let xp = 0;
        const journeyStructure = {
            stages: [
                { id: 1, days: [1, 2, 3], milestone: false },
                { id: 2, days: [5, 6, 7], milestone: true },
                { id: 3, days: [9, 10, 11], milestone: false },
                { id: 4, days: [13, 14, 15], milestone: true },
                { id: 5, days: [17, 18, 19], milestone: false },
                { id: 6, days: [21], milestone: true }
            ]
        };
        
        journeyStructure.stages.forEach(stage => {
            if (stage.milestone && this.currentDay > Math.max(...stage.days)) {
                xp += 100;
            }
        });
        this.userXP = xp + (this.currentDay * 25); // 25 XP per day
    }
    
    renderDynamicHeader() {
        const header = document.getElementById('motivational-header');
        
        if (this.isProgressStage) {
            // Progress stage header
            const currentStage = this.getCurrentStage();
            const stageName = this.stageNames[currentStage.id - 1];
            
            header.innerHTML = `
                <div class="relative overflow-hidden rounded-xl shadow-lg border border-gray-100">
                    <!-- Animated fading background effect -->
                    <div class="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 fade-bg"></div>
                    <div class="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-transparent to-purple-100/30 fade-bg" style="animation-delay: 2s;"></div>
                    
                    <!-- Content -->
                    <div class="relative z-10 text-center py-4 px-6">
                        <h1 class="text-lg lg:text-xl font-bold text-gray-900 mb-1">
                            ${stageName} - Day ${this.currentDay}
                        </h1>
                        <blockquote class="text-sm font-medium text-gray-700 italic">
                            "Every step forward brings you closer to your dream"
                        </blockquote>
                    </div>
                </div>
            `;
        } else {
            // Form stage header
            header.innerHTML = `
                <div class="relative overflow-hidden rounded-xl shadow-lg border border-gray-100">
                    <div class="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 fade-bg"></div>
                    
                    <div class="relative z-10 text-center py-4 px-6">
                        <h1 class="text-lg lg:text-xl font-bold text-gray-900 mb-1">
                            Your Dream Deserves a Plan
                        </h1>
                        <p class="text-sm font-medium text-gray-700">
                            Transform wishes into reality with your personalized 21-day journey
                        </p>
                    </div>
                </div>
            `;
        }
    }
    
    getCurrentStage() {
        const journeyStructure = {
            stages: [
                { id: 1, days: [1, 2, 3], reflectionDay: 4 },
                { id: 2, days: [5, 6, 7], reflectionDay: 8 },
                { id: 3, days: [9, 10, 11], reflectionDay: 12 },
                { id: 4, days: [13, 14, 15], reflectionDay: 16 },
                { id: 5, days: [17, 18, 19], reflectionDay: 20 },
                { id: 6, days: [21], reflectionDay: null }
            ]
        };
        
        return journeyStructure.stages.find(stage => 
            this.currentDay >= stage.days[0] && 
            (stage.days.includes(this.currentDay) || 
             (stage.reflectionDay && this.currentDay === stage.reflectionDay))
        ) || journeyStructure.stages[0];
    }
    
    async renderCurrentStageContent() {
        const currentStage = this.getCurrentStage();
        const isReflectionDay = currentStage.reflectionDay === this.currentDay;
        const stageContent = document.getElementById('current-stage-content');
        const reflectionPanel = document.getElementById('reflection-panel');
        
        if (!stageContent) return; // Skip if not in progress stage
        
        if (isReflectionDay) {
            // Show reflection interface
            reflectionPanel?.classList.remove('hidden');
            stageContent.innerHTML = '';
        } else {
            // Show regular stage content
            reflectionPanel?.classList.add('hidden');
            
            const stageName = this.stageNames[currentStage.id - 1];
            const dayInStage = currentStage.days.findIndex(day => day === this.currentDay) + 1;
            
            stageContent.innerHTML = `
                <div class="mb-4">
                    <div class="flex items-center justify-between mb-3">
                        <h2 class="text-xl font-bold text-gray-900">${stageName}</h2>
                        <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            Day ${dayInStage} of ${currentStage.days.length}
                        </span>
                    </div>
                    
                    <div class="bg-gray-100 rounded-full h-2 mb-4">
                        <div class="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                             style="width: ${(dayInStage / currentStage.days.length) * 100}%"></div>
                    </div>
                </div>
                
                <div class="space-y-4">
                    <div class="bg-blue-50 rounded-lg p-4">
                        <h3 class="font-semibold text-blue-900 mb-2">Today's Focus</h3>
                        <p class="text-blue-800" id="daily-focus">Focus on taking one meaningful step toward your dream today.</p>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-green-50 rounded-lg p-4">
                            <h4 class="font-semibold text-green-900 mb-2">Key Actions</h4>
                            <ul id="key-actions" class="text-green-800 text-sm space-y-1">
                                <li>• Review your goals</li>
                                <li>• Take action on priority tasks</li>
                                <li>• Track your progress</li>
                            </ul>
                        </div>
                        
                        <div class="bg-purple-50 rounded-lg p-4">
                            <h4 class="font-semibold text-purple-900 mb-2">Success Tips</h4>
                            <ul id="success-tips" class="text-purple-800 text-sm space-y-1">
                                <li>• Start small and build momentum</li>
                                <li>• Celebrate small wins</li>
                                <li>• Stay consistent</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="text-center pt-4">
                        <button id="complete-day" class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                            Complete Day ${this.currentDay}
                        </button>
                    </div>
                </div>
            `;
            
            // Generate dynamic content
            await this.generateStageContent(currentStage, dayInStage);
        }
    }
    
    async generateStageContent(stage, dayInStage) {
        try {
            const stageName = this.stageNames[stage.id - 1];
            const prompt = `Generate specific daily content for day ${this.currentDay} of a 21-day journey.

Context:
- User's Dream: "${this.currentJourney.dreamText}"
- Current Stage: "${stageName}" (Day ${dayInStage} of ${stage.days.length})
- Commitment Style: ${this.currentJourney.timeCommitment}
- Learning Style: ${this.currentJourney.learningStyle}

Generate JSON with:
{
  "dailyFocus": "One clear focus statement for today",
  "keyActions": ["Action 1", "Action 2", "Action 3"],
  "successTips": ["Tip 1", "Tip 2", "Tip 3"]
}

Make it specific to their dream, practical, and achievable in one day.`;

            const response = await this.callLLM(prompt);
            const content = JSON.parse(response);
            
            // Update the content
            const dailyFocusEl = document.getElementById('daily-focus');
            const keyActionsEl = document.getElementById('key-actions');
            const successTipsEl = document.getElementById('success-tips');
            
            if (dailyFocusEl) dailyFocusEl.textContent = content.dailyFocus;
            if (keyActionsEl) keyActionsEl.innerHTML = content.keyActions.map(action => `<li>• ${action}</li>`).join('');
            if (successTipsEl) successTipsEl.innerHTML = content.successTips.map(tip => `<li>• ${tip}</li>`).join('');
            
        } catch (error) {
            console.error('Error generating stage content:', error);
            // Fallback content is already in place
        }
    }
    
    updateSidebarWithXP() {
        const totalXpEl = document.getElementById('total-xp');
        const currentStreakEl = document.getElementById('current-streak');
        
        if (totalXpEl) totalXpEl.textContent = this.userXP;
        if (currentStreakEl) currentStreakEl.textContent = this.currentStreak;
    }
    
    setupProgressEventListeners() {
        // Complete day button
        const completeDayBtn = document.getElementById('complete-day');
        if (completeDayBtn) {
            completeDayBtn.addEventListener('click', () => this.markDayComplete());
        }
        
        // Save reflection button
        const saveReflectionBtn = document.getElementById('save-reflection');
        if (saveReflectionBtn) {
            saveReflectionBtn.addEventListener('click', () => this.saveReflection());
        }
    }
    
    async markDayComplete() {
        this.userXP += 25;
        this.currentStreak++;
        
        this.showSuccess('✅ Day completed! +25 XP earned!');
        this.updateSidebarWithXP();
        
        // Advance to next day (for demo)
        if (this.currentDay < 21) {
            setTimeout(() => {
                if (confirm('Ready to move to the next day?')) {
                    this.currentDay++;
                    this.renderDynamicHeader();
                    this.renderCurrentStageContent();
                }
            }, 1500);
        }
    }
    
    async saveReflection() {
        const reflectionText = document.getElementById('reflection-text')?.value.trim();
        if (!reflectionText) {
            this.showError('Please write your reflection before saving.');
            return;
        }
        
        this.showSuccess('Reflection saved successfully!');
        this.userXP += 25;
        this.updateSidebarWithXP();
    }
    
    async callLLM(prompt) {
        try {
            const response = await fetch(`${this.apiBase}/llm/generate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt })
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.content || data.response;
            } else {
                throw new Error('LLM service unavailable');
            }
        } catch (error) {
            console.error('LLM call failed:', error);
            throw error;
        }
    }

    calculateProgress() {
        // Use the server's currentDay instead of calculating from dates
        // This prevents timezone and date calculation issues
        this.currentDay = this.currentJourney.currentDay || 1;
        
        // New users start with 0 streak
        this.currentStreak = 0;
        
        // New users start with 0 XP
        this.userXP = 0;
    }

    getCurrentStage() {
        return this.journeyStructure.stages.find(stage => 
            this.currentDay >= stage.days[0] && 
            (stage.days.includes(this.currentDay) || 
             (stage.reflectionDay && this.currentDay === stage.reflectionDay))
        ) || this.journeyStructure.stages[0];
    }

    async generateStageContent(stage, dayInStage) {
        try {
            const stageName = this.stageNames[stage.id - 1];
            const prompt = `Generate specific daily content for day ${this.currentDay} of a 21-day journey.

Context:
- User's Dream: "${this.currentJourney.dreamText}"
- Current Stage: "${stageName}" (Day ${dayInStage} of ${stage.days.length})
- Commitment Style: ${this.currentJourney.timeCommitment}
- Learning Style: ${this.currentJourney.learningStyle}

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
            document.getElementById('daily-focus').textContent = content.dailyFocus;
            
            const actionsEl = document.getElementById('key-actions');
            actionsEl.innerHTML = content.keyActions.map(action => `<li>• ${action}</li>`).join('');
            
            const tipsEl = document.getElementById('success-tips');
            tipsEl.innerHTML = content.successTips.map(tip => `<li>• ${tip}</li>`).join('');
            
        } catch (error) {
            console.error('Error generating stage content:', error);
            // Fallback content
            document.getElementById('daily-focus').textContent = "Focus on taking one meaningful step toward your dream today.";
            document.getElementById('key-actions').innerHTML = '<li>• Review your goals</li><li>• Take action on priority tasks</li><li>• Track your progress</li>';
            document.getElementById('success-tips').innerHTML = '<li>• Start small and build momentum</li><li>• Celebrate small wins</li><li>• Stay consistent</li>';
        }
    }

    updateJourneyMapVisual() {
        // Update the existing journey map with dynamic stage names and progress
        for (let i = 0; i < Math.min(this.stageNames.length, 6); i++) {
            const stageTitle = document.getElementById(`stage-${i + 1}-title`);
            const stageSubtitle = document.getElementById(`stage-${i + 1}-subtitle`);
            
            if (stageTitle && this.stageNames[i]) {
                stageTitle.textContent = `Stage ${i + 1}: ${this.stageNames[i]}`;
            }
            if (stageSubtitle && this.stageNames[i]) {
                const stage = this.journeyStructure.stages[i];
                const dayRange = stage.days.length === 1 ? `Day ${stage.days[0]}` : `Days ${stage.days[0]}-${stage.days[stage.days.length - 1]}`;
                stageSubtitle.textContent = `${this.stageNames[i]} • ${dayRange}`;
            }
            
            // Update stage status
            const stageStatus = document.getElementById(`stage-${i + 1}-status`);
            const stageContainer = document.getElementById(`stage-${i + 1}-container`);
            const stageIcon = document.getElementById(`stage-${i + 1}-icon`);
            
            if (stageStatus && stageContainer && stageIcon) {
                const stage = this.journeyStructure.stages[i];
                const isUnlocked = this.currentDay >= stage.days[0];
                const isCompleted = this.currentDay > Math.max(...stage.days);
                const isCurrent = this.currentDay >= stage.days[0] && this.currentDay <= Math.max(...stage.days);
                
                if (isCompleted) {
                    stageStatus.textContent = 'Completed';
                    stageStatus.className = 'px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium';
                    stageContainer.className = 'mb-8 opacity-100';
                    stageIcon.className = 'w-12 h-12 rounded-full bg-green-500 flex items-center justify-center mr-4';
                    stageIcon.innerHTML = '✓';
                } else if (isCurrent) {
                    stageStatus.textContent = 'In Progress';
                    stageStatus.className = 'px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium';
                    stageContainer.className = 'mb-8 opacity-100';
                    stageIcon.className = 'w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center mr-4';
                    stageIcon.innerHTML = `<span class="text-white font-bold">${i + 1}</span>`;
                } else if (isUnlocked) {
                    stageStatus.textContent = 'Available';
                    stageStatus.className = 'px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium';
                    stageContainer.className = 'mb-8 opacity-100';
                    stageIcon.className = 'w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center mr-4';
                    stageIcon.innerHTML = `<span class="text-white font-bold">${i + 1}</span>`;
                } else {
                    stageStatus.textContent = 'Locked';
                    stageStatus.className = 'px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm';
                    stageContainer.className = 'mb-8 opacity-50';
                    stageIcon.className = 'w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center mr-4';
                    stageIcon.innerHTML = `<svg class="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>`;
                }
            }
        }
        
        // Update progress dots and stage states
        this.updateProgressDots();
        
        // Add visual progress map for all 21 days
        this.renderFullJourneyMap();
    }

    updateProgressDots() {
        // Update the day dots based on current progress
        for (let day = 1; day <= 21; day++) {
            const dayDot = document.getElementById(`day-${day}-dot`);
            if (dayDot) {
                if (day < this.currentDay) {
                    dayDot.className = 'w-4 h-4 rounded-full bg-green-500';
                } else if (day === this.currentDay) {
                    dayDot.className = 'w-4 h-4 rounded-full bg-blue-500';
                } else {
                    dayDot.className = 'w-4 h-4 rounded-full bg-gray-300';
                }
            }
        }
    }

    updateSidebarWithXP() {
        // Update sidebar elements with current journey data
        const dreamEl = document.getElementById('journey-dream-text');
        const confidenceEl = document.getElementById('journey-confidence');
        const timelineEl = document.getElementById('journey-timeline');
        const commitmentEl = document.getElementById('journey-commitment');
        const learningEl = document.getElementById('journey-learning-style');
        const xpEl = document.getElementById('total-xp');
        const streakEl = document.getElementById('current-streak');
        const progressPercentEl = document.getElementById('overall-progress-percent');
        const progressBarEl = document.getElementById('overall-progress-bar');
        const currentDayEl = document.getElementById('current-day');
        
        if (dreamEl) dreamEl.textContent = this.currentJourney.dreamText;
        if (confidenceEl) confidenceEl.textContent = `${this.currentJourney.confidence}%`;
        if (timelineEl) timelineEl.textContent = `${this.currentJourney.timeHorizon} weeks`;
        if (commitmentEl) commitmentEl.textContent = this.formatCommitmentStyle(this.currentJourney.timeCommitment);
        if (learningEl) learningEl.textContent = this.formatLearningStyle(this.currentJourney.learningStyle);
        if (xpEl) xpEl.textContent = this.userXP || 0;
        if (streakEl) streakEl.textContent = this.currentStreak || 0;
        if (currentDayEl) currentDayEl.textContent = this.currentDay;
        
        // Update overall progress
        const progressPercent = Math.round((this.currentDay / 21) * 100);
        if (progressPercentEl) progressPercentEl.textContent = `${progressPercent}%`;
        if (progressBarEl) progressBarEl.style.width = `${progressPercent}%`;
    }

    formatCommitmentStyle(style) {
        const styles = {
            'micro-burst': 'Micro Burst',
            'focused-blocks': 'Focused Blocks',
            'flexible-flow': 'Flexible Flow'
        };
        return styles[style] || style;
    }

    formatLearningStyle(style) {
        const styles = {
            'visual': 'Visual',
            'auditory': 'Auditory',
            'kinesthetic': 'Hands-on',
            'reading': 'Reading'
        };
        return styles[style] || style;
    }

    setupProgressEventListeners() {
        // Add event listeners for progress stage interactions
        const saveReflectionBtn = document.getElementById('save-reflection');
        if (saveReflectionBtn) {
            saveReflectionBtn.addEventListener('click', () => this.saveReflection());
        }
    }

    renderFormHeader() {
        // Header content for the initial form stage
        const headerContent = document.getElementById('motivational-header');
        if (headerContent) {
            headerContent.innerHTML = `
                <div class="relative overflow-hidden rounded-xl bg-white shadow-lg border border-gray-100">
                    <div class="absolute inset-0 bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 fade-bg"></div>
                    <div class="relative z-10 py-8 px-8">
                        <div class="text-center mb-6">
                            <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                                🌟 It Starts with a Dream.
                            </h1>
                            <p class="text-xl text-gray-700 mb-4">
                                What if the life you imagine isn't far away — just a few habits away?
                            </p>
                            <p class="text-lg text-gray-600 mb-2">
                                This is your invitation to begin.
                            </p>
                            <p class="text-lg text-gray-600">
                                Not with pressure. With possibility.
                            </p>
                        </div>
                        
                        <div class="max-w-4xl mx-auto">
                            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
                                <h2 class="text-lg font-semibold text-gray-900 mb-4 text-center">
                                    🧠 Why Start Here? The Science of Sustainable Change
                                </h2>
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div class="text-center p-4">
                                        <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <span class="text-blue-600 text-xl">🧬</span>
                                        </div>
                                        <h3 class="font-medium text-gray-800 mb-2">Neural Rewiring</h3>
                                        <p class="text-sm text-gray-600">Your brain adapts with repetition. 21 days of intentional action begins rewiring how you think, decide, and behave.</p>
                                    </div>
                                    <div class="text-center p-4">
                                        <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <span class="text-green-600 text-xl">🔁</span>
                                        </div>
                                        <h3 class="font-medium text-gray-800 mb-2">Behavioral Momentum</h3>
                                        <p class="text-sm text-gray-600">Consistent micro-actions bypass motivation traps and build real, measurable progress.</p>
                                    </div>
                                    <div class="text-center p-4">
                                        <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <span class="text-purple-600 text-xl">🧭</span>
                                        </div>
                                        <h3 class="font-medium text-gray-800 mb-2">Clarity Through Action</h3>
                                        <p class="text-sm text-gray-600">You don't find your path by thinking about it — you uncover it by walking it. One aligned habit at a time.</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="text-center">
                                <blockquote class="text-lg font-medium text-gray-700 italic mb-3">
                                    "You don't manifest what you want — you manifest what you consistently do."
                                </blockquote>
                                <p class="text-gray-600 mb-2">
                                    Let's begin turning your vision into action.
                                </p>
                                <p class="text-gray-600">
                                    Your personalized 21-day system starts here.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    renderDynamicHeader() {
        // Generate dynamic header content based on current stage
        const headerContent = document.getElementById('motivational-header');
        if (headerContent && this.stageNames.length > 0) {
            const currentStage = this.getCurrentStage();
            const stageName = this.stageNames[currentStage.id - 1];
            
            headerContent.innerHTML = `
                <div class="relative overflow-hidden rounded-xl">
                    <div class="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 fade-bg"></div>
                    <div class="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-transparent to-purple-100/30 fade-bg" style="animation-delay: 2s;"></div>
                    <div class="relative z-10 text-center py-4 px-6">
                        <h1 class="text-lg lg:text-xl font-bold text-gray-900 mb-1">
                            ${stageName} - Day ${this.currentDay}
                        </h1>
                        <blockquote class="text-sm font-medium text-gray-700 italic">
                            "Every expert was once a beginner. Every pro was once an amateur. Keep going."
                        </blockquote>
                    </div>
                </div>
            `;
        }
    }

    renderFullJourneyMap() {
        // Create a complete 21-day journey visualization
        const journeyMapContainer = document.querySelector('.glass-effect:has(h3:contains("Your 21-Day Journey Map"))');
        
        if (journeyMapContainer) {
            // Add comprehensive 21-day visualization at the end
            const existing21DayMap = journeyMapContainer.querySelector('.full-journey-map');
            if (!existing21DayMap) {
                const fullMap = document.createElement('div');
                fullMap.className = 'full-journey-map mt-8 pt-6 border-t border-gray-200';
                fullMap.innerHTML = `
                    <h4 class="text-lg font-semibold text-gray-800 mb-4">Complete 21-Day Progress</h4>
                    <div class="grid grid-cols-7 gap-3 mb-4">
                        ${this.generate21DayGrid()}
                    </div>
                    <div class="text-center">
                        <div class="inline-flex items-center space-x-4 text-sm text-gray-600">
                            <div class="flex items-center">
                                <div class="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                                <span>Completed</span>
                            </div>
                            <div class="flex items-center">
                                <div class="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                                <span>Current</span>
                            </div>
                            <div class="flex items-center">
                                <div class="w-4 h-4 rounded-full bg-purple-500 mr-2"></div>
                                <span>Reflection</span>
                            </div>
                            <div class="flex items-center">
                                <div class="w-4 h-4 rounded-full bg-gray-300 mr-2"></div>
                                <span>Locked</span>
                            </div>
                        </div>
                    </div>
                `;
                journeyMapContainer.appendChild(fullMap);
            }
        }
    }

    generate21DayGrid() {
        let gridHTML = '';
        
        for (let day = 1; day <= 21; day++) {
            const isCompleted = day < this.currentDay;
            const isCurrent = day === this.currentDay;
            const isReflectionDay = [4, 8, 12, 16, 20].includes(day);
            const isMilestone = [7, 14, 21].includes(day);
            
            let dayClass = 'w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300';
            let dayContent = day;
            
            if (isCompleted) {
                dayClass += ' bg-green-500 text-white';
                dayContent = '✓';
            } else if (isCurrent) {
                dayClass += ' bg-blue-500 text-white animate-pulse';
            } else if (isReflectionDay) {
                dayClass += ' bg-purple-500 text-white opacity-50';
                dayContent = '💭';
            } else if (isMilestone) {
                dayClass += ' bg-yellow-500 text-white opacity-50';
                dayContent = '🏆';
            } else {
                dayClass += ' bg-gray-300 text-gray-500 opacity-50';
            }
            
            gridHTML += `
                <div class="${dayClass}" title="Day ${day}${isReflectionDay ? ' (Reflection)' : isMilestone ? ' (Milestone)' : ''}">
                    ${dayContent}
                </div>
            `;
        }
        
        return gridHTML;
    }

}

// Initialize the journey manager when the page loads
/**
 * Update the current day and date display for journey page
 */
function updateCurrentDayDateDisplay() {
    const currentDayDateEl = document.getElementById('current-day-date-journey');
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

let journeyManager;
document.addEventListener('DOMContentLoaded', () => {
    
    // Update current day and date display
    updateCurrentDayDateDisplay();
    
    journeyManager = new JourneyManager();
    
    // Export for global access
    window.journeyManager = journeyManager;
    
    // Make the page visible (fixes CSS opacity: 0 issue)
    document.body.style.opacity = '1';
    
});