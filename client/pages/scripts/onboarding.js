/**
 * onboarding.js
 * Handles the onboarding experience for first-time users
 */

document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const dreamInput = document.getElementById('dream-input');
    const timelineSlider = document.getElementById('timeline-slider');
    const timelineDisplay = document.getElementById('timeline-display');
    const confidenceSlider = document.getElementById('confidence-slider');
    const confidenceDisplay = document.getElementById('confidence-display');
    const visionQuestionnaireLink = document.getElementById('vision-questionnaire-link');
    const continueBtn = document.getElementById('continue-btn');
    const onboardingForm = document.getElementById('onboarding-form');

    // Check if user is already authenticated
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Check user permissions and stage
    checkUserPermissions();

    // Check if user has already completed onboarding
    const existingUser = localStorage.getItem('user');
    let hasCompletedOnboarding = false;
    
    if (existingUser) {
        try {
            const userData = JSON.parse(existingUser);
            hasCompletedOnboarding = userData.onboardingCompleted === true;
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    }
    
    // Fallback to legacy check
    if (!hasCompletedOnboarding) {
        const legacyOnboarding = localStorage.getItem('onboardingCompleted');
        hasCompletedOnboarding = legacyOnboarding === 'true';
    }
    
    if (hasCompletedOnboarding) {
        window.location.href = 'home.html';
        return;
    }

    // Initialize sliders
    updateTimelineDisplay();
    updateConfidenceDisplay();
    checkFormValidity();

    // Timeline slider handler
    timelineSlider.addEventListener('input', updateTimelineDisplay);
    
    // Confidence slider handler
    confidenceSlider.addEventListener('input', updateConfidenceDisplay);

    // Dream input handler
    dreamInput.addEventListener('input', checkFormValidity);

    // Vision questionnaire link handler
    visionQuestionnaireLink.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Check if vision questionnaire is unlocked
        if (visionQuestionnaireLink.classList.contains('locked')) {
            showLockedMessage();
            return;
        }
        
        // Save current onboarding data before navigating
        saveOnboardingData();
        window.location.href = 'vision-questionnaire.html';
    });

    // Form submission handler
    onboardingForm.addEventListener('submit', handleFormSubmission);

    /**
     * Update timeline display based on slider value
     */
    function updateTimelineDisplay() {
        const months = parseInt(timelineSlider.value);
        let displayText;
        
        if (months === 1) {
            displayText = '1 month';
        } else if (months < 12) {
            displayText = `${months} months`;
        } else if (months === 12) {
            displayText = '1 year';
        } else {
            const years = Math.floor(months / 12);
            const remainingMonths = months % 12;
            
            if (remainingMonths === 0) {
                displayText = `${years} year${years > 1 ? 's' : ''}`;
            } else {
                displayText = `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
            }
        }
        
        timelineDisplay.textContent = displayText;
    }

    /**
     * Update confidence display based on slider value
     */
    function updateConfidenceDisplay() {
        const confidence = parseInt(confidenceSlider.value);
        confidenceDisplay.textContent = `${confidence}%`;
        
        // Update slider background color based on confidence level
        const hue = (confidence / 100) * 120; // 0 (red) to 120 (green)
        confidenceSlider.style.background = `linear-gradient(to right, 
            hsl(${hue}, 70%, 50%) 0%, 
            hsl(${hue}, 70%, 50%) ${confidence}%, 
            #e5e7eb ${confidence}%, 
            #e5e7eb 100%)`;
    }

    /**
     * Check form validity and enable/disable continue button
     */
    function checkFormValidity() {
        const dreamValue = dreamInput.value.trim();
        const isValid = dreamValue.length > 0;
        
        continueBtn.disabled = !isValid;
        
        if (isValid) {
            continueBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            continueBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }

    /**
     * Save onboarding data to localStorage and server with dream parsing
     */
    async function saveOnboardingData() {
        const dreamText = dreamInput.value.trim();
        const timeline = parseInt(timelineSlider.value);
        const confidence = parseInt(confidenceSlider.value);
        
        const onboardingData = {
            dream: dreamText,
            timeline: timeline,
            confidence: confidence,
            completedAt: new Date().toISOString()
        };

        // Parse dream using dream parser service
        let parsedDream = null;
        try {
            const parseResponse = await fetch('/api/dream-parser/parse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    dreamText: dreamText,
                    confidence: confidence,
                    timeHorizon: timeline
                })
            });

            if (parseResponse.ok) {
                const parseResult = await parseResponse.json();
                if (parseResult.success) {
                    parsedDream = parseResult.data;
                    console.log('Dream parsed successfully:', parsedDream);
                } else {
                    console.warn('Dream parsing failed:', parseResult.error);
                }
            }
        } catch (error) {
            console.warn('Dream parsing failed:', error);
            // Continue with raw dream data if parsing fails
        }

        // Add parsed dream to onboarding data if available
        if (parsedDream) {
            onboardingData.parsedDream = parsedDream;
        }

        // Save to localStorage
        localStorage.setItem('onboardingData', JSON.stringify(onboardingData));
        
        // Send to server
        return fetch('/api/auth/onboarding', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(onboardingData)
        });
    }

    /**
     * Handle form submission
     */
    async function handleFormSubmission(e) {
        e.preventDefault();
        
        if (continueBtn.disabled) return;

        try {
            // Show loading state
            const originalText = continueBtn.textContent;
            continueBtn.textContent = 'Saving...';
            continueBtn.disabled = true;

            // Save onboarding data
            const response = await saveOnboardingData();
            
            if (response && response.ok) {
                const responseData = await response.json();
                
                // Update user data in localStorage in the format expected by navigation system
                const existingUser = localStorage.getItem('user');
                let userData = {};
                
                try {
                    userData = existingUser ? JSON.parse(existingUser) : {};
                } catch (error) {
                    console.error('Error parsing existing user data:', error);
                }
                
                // Update the onboarding status
                userData.onboardingCompleted = true;
                localStorage.setItem('user', JSON.stringify(userData));
                
                // Also keep the legacy onboardingCompleted for compatibility
                localStorage.setItem('onboardingCompleted', 'true');
                
                // Redirect to home page
                window.location.href = 'home.html';
            } else {
                throw new Error('Failed to save onboarding data');
            }
        } catch (error) {
            console.error('Error saving onboarding data:', error);
            
            // Reset button state
            continueBtn.textContent = 'Continue Your Journey';
            continueBtn.disabled = false;
            
            // Show error message
            alert('There was an error saving your information. Please try again.');
        }
    }

    /**
     * Add smooth animations to form elements
     */
    function addAnimations() {
        // Add staggered fade-in animations
        const elements = document.querySelectorAll('.animate-fade-in');
        elements.forEach((element, index) => {
            element.style.animationDelay = `${index * 0.2}s`;
        });

        // Add hover effects to sliders
        [timelineSlider, confidenceSlider].forEach(slider => {
            slider.addEventListener('mouseenter', () => {
                slider.style.transform = 'scaleY(1.1)';
            });
            
            slider.addEventListener('mouseleave', () => {
                slider.style.transform = 'scaleY(1)';
            });
        });
    }

    // Initialize animations
    addAnimations();

    /**
     * Check user permissions and update UI accordingly
     */
    async function checkUserPermissions() {
        try {
            const response = await fetch('/api/permissions/dashboard', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const dashboardConfig = data.data;
                
                // Update vision questionnaire button based on permissions
                updateVisionQuestionnaireButton(dashboardConfig.components.visionQuestionnaireButton);
                
                // Update any other UI elements based on stage
                updateUIForStage(dashboardConfig);
            } else {
                console.error('Failed to fetch user permissions');
            }
        } catch (error) {
            console.error('Error checking user permissions:', error);
        }
    }

    /**
     * Update vision questionnaire button based on permissions
     */
    function updateVisionQuestionnaireButton(visionConfig) {
        if (visionConfig.locked) {
            // Lock the button
            visionQuestionnaireLink.classList.add('locked');
            visionQuestionnaireLink.classList.remove('bg-gradient-to-r', 'from-emerald-500', 'to-teal-600', 'hover:from-emerald-600', 'hover:to-teal-700');
            visionQuestionnaireLink.classList.add('bg-gray-400', 'cursor-not-allowed');
            
            // Update button text and appearance
            visionQuestionnaireLink.innerHTML = `
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                </svg>
                Vision Questionnaire (Locked)
            `;
            
            // Add lock message
            const existingMessage = document.getElementById('vision-lock-message');
            if (!existingMessage) {
                const lockMessage = document.createElement('p');
                lockMessage.id = 'vision-lock-message';
                lockMessage.className = 'text-sm text-gray-500 mt-2';
                lockMessage.textContent = visionConfig.message || 'Complete 3 day streak to unlock!';
                visionQuestionnaireLink.parentNode.appendChild(lockMessage);
            }
            
            // Add progress bar if available
            if (visionConfig.streakProgress) {
                const existingProgress = document.getElementById('vision-progress');
                if (!existingProgress) {
                    const progressContainer = document.createElement('div');
                    progressContainer.id = 'vision-progress';
                    progressContainer.className = 'mt-3';
                    
                    const progressBar = document.createElement('div');
                    progressBar.className = 'w-full bg-gray-200 rounded-full h-2';
                    
                    const progressFill = document.createElement('div');
                    progressFill.className = 'bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all duration-300';
                    const progressPercent = (visionConfig.streakProgress.current / visionConfig.streakProgress.required) * 100;
                    progressFill.style.width = `${progressPercent}%`;
                    
                    progressBar.appendChild(progressFill);
                    progressContainer.appendChild(progressBar);
                    
                    const progressText = document.createElement('p');
                    progressText.className = 'text-xs text-gray-500 mt-1 text-center';
                    progressText.textContent = `${visionConfig.streakProgress.current}/${visionConfig.streakProgress.required} days`;
                    progressContainer.appendChild(progressText);
                    
                    visionQuestionnaireLink.parentNode.appendChild(progressContainer);
                }
            }
        } else {
            // Unlock the button
            visionQuestionnaireLink.classList.remove('locked', 'bg-gray-400', 'cursor-not-allowed');
            visionQuestionnaireLink.classList.add('bg-gradient-to-r', 'from-emerald-500', 'to-teal-600', 'hover:from-emerald-600', 'hover:to-teal-700');
            
            // Update button text
            visionQuestionnaireLink.innerHTML = `
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                </svg>
                Take Vision Questionnaire
            `;
            
            // Remove lock message and progress bar
            const lockMessage = document.getElementById('vision-lock-message');
            if (lockMessage) lockMessage.remove();
            
            const progressBar = document.getElementById('vision-progress');
            if (progressBar) progressBar.remove();
        }
    }

    /**
     * Update UI elements based on user stage
     */
    function updateUIForStage(dashboardConfig) {
        // You can add more stage-specific UI updates here
        console.log('User stage:', dashboardConfig.stage);
        console.log('Streak count:', dashboardConfig.streakCount);
        
        // Add stage indicator if needed
        const stageIndicator = document.querySelector('.stage-indicator');
        if (stageIndicator) {
            stageIndicator.textContent = `Stage ${dashboardConfig.stage}`;
        }
    }

    /**
     * Show locked message when user tries to access locked feature
     */
    function showLockedMessage() {
        // Create and show a modal or alert
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
                <div class="text-6xl mb-4">🔒</div>
                <h3 class="text-xl font-bold text-gray-800 mb-2">Vision Questionnaire Locked</h3>
                <p class="text-gray-600 mb-4">Complete your 3-day check-in streak to unlock the Vision Questionnaire!</p>
                <p class="text-sm text-gray-500 mb-6">All you have to do is show up each day.</p>
                <button onclick="this.parentElement.parentElement.remove()" class="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2 rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-300">
                    Got it!
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 5000);
    }
});