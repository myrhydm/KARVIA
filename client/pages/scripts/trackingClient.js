/**
 * Client-side Tracking Utilities
 * 
 * Handles tracking of user interactions and behaviors in the frontend
 */

class TrackingClient {
    constructor() {
        this.apiBase = '/api/engines/tracker';
        this.sessionStartTime = Date.now();
        this.pageStartTime = Date.now();
        this.interactions = 0;
        this.maxScrollDepth = 0;
        this.isTracking = true;
        this.pendingRequests = new Set(); // Track pending requests to avoid duplicates
        
        this.initializeTracking();
    }

    async initializeTracking() {
        // Track page visit
        await this.trackPageVisit();
        
        // Set up periodic tracking
        this.setupPeriodicTracking();
        
        // Set up interaction tracking
        this.setupInteractionTracking();
        
        // Set up scroll tracking
        this.setupScrollTracking();
    }

    async trackPageVisit() {
        const pageData = {
            page: window.location.pathname,
            referrer: document.referrer,
            timestamp: new Date().toISOString()
        };

        await this.logEvent('page_visited', pageData);
    }

    async trackEngagement(eventType, eventData = {}) {
        const engagementData = {
            page: window.location.pathname,
            timeSpent: Date.now() - this.pageStartTime,
            interactions: this.interactions,
            scrollDepth: this.maxScrollDepth,
            ...eventData
        };

        await this.logEvent(eventType, engagementData);
    }

    async trackTaskAction(actionType, taskData = {}) {
        const taskActionData = {
            actionType,
            page: window.location.pathname,
            timestamp: new Date().toISOString(),
            ...taskData
        };

        await this.logEvent('task_completed', taskActionData);
    }

    async trackBehavior(behaviorType, behaviorData = {}) {
        const behaviorEventData = {
            behaviorType,
            page: window.location.pathname,
            sessionTime: Date.now() - this.sessionStartTime,
            ...behaviorData
        };

        await this.logEvent(behaviorType, behaviorEventData);
    }

    async trackDecision(decisionData = {}) {
        const startTime = Date.now();
        
        return {
            complete: async (outcome) => {
                const decisionTime = Date.now() - startTime;
                await this.logEvent('feature_explored', {
                    decisionSpeed: decisionTime,
                    outcome,
                    ...decisionData
                });
            }
        };
    }

    async trackProblemSolving(problemData = {}) {
        const startTime = Date.now();
        
        return {
            complete: async (solution, success = true) => {
                const solveTime = Date.now() - startTime;
                await this.logEvent('feature_explored', {
                    timeToSolve: solveTime,
                    solutionApproach: solution,
                    successful: success,
                    ...problemData
                });
            }
        };
    }

    async trackLearning(learningType, learningData = {}) {
        await this.logEvent(learningType, {
            learningContext: window.location.pathname,
            timestamp: new Date().toISOString(),
            ...learningData
        });
    }

    setupPeriodicTracking() {
        // Track time spent every 30 seconds
        setInterval(() => {
            this.trackTimeSpent();
        }, 30000);

        // Track session before page unload
        window.addEventListener('beforeunload', () => {
            this.trackSessionEnd();
        });
    }

    setupInteractionTracking() {
        // Track clicks
        document.addEventListener('click', (e) => {
            this.interactions++;
            this.trackInteraction('click', {
                element: e.target.tagName,
                elementId: e.target.id,
                className: e.target.className,
                text: e.target.textContent?.substring(0, 50)
            });
        });

        // Track form submissions
        document.addEventListener('submit', (e) => {
            this.trackInteraction('form_submit', {
                formId: e.target.id,
                formAction: e.target.action
            });
        });

        // Track keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                this.trackInteraction('keyboard_shortcut', {
                    key: e.key,
                    ctrlKey: e.ctrlKey,
                    metaKey: e.metaKey
                });
            }
        });
    }

    setupScrollTracking() {
        window.addEventListener('scroll', () => {
            const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
            this.maxScrollDepth = Math.max(this.maxScrollDepth, scrollPercent);
        });
    }

    async trackTimeSpent() {
        const timeSpentData = {
            page: window.location.pathname, // Required field for page_visited events
            sessionDuration: Date.now() - this.sessionStartTime,
            pageTime: Date.now() - this.pageStartTime,
            activeTime: this.calculateActiveTime(),
            interactions: this.interactions
        };

        await this.logEvent('page_visited', timeSpentData);
    }

    async trackSessionEnd() {
        const sessionData = {
            totalDuration: Date.now() - this.sessionStartTime,
            totalInteractions: this.interactions,
            maxScrollDepth: this.maxScrollDepth,
            pagesVisited: this.getPagesVisited()
        };

        await this.logEvent('user_logout', sessionData);
    }

    async trackInteraction(interactionType, interactionData = {}) {
        // Debounce rapid interactions
        if (this.lastInteractionTime && Date.now() - this.lastInteractionTime < 100) {
            return;
        }
        this.lastInteractionTime = Date.now();

        await this.logEvent('feature_explored', {
            interactionType,
            timestamp: new Date().toISOString(),
            ...interactionData
        });
    }

    calculateActiveTime() {
        // Simple estimation based on interactions and scroll
        const baseTime = Date.now() - this.sessionStartTime;
        const activityFactor = Math.min(this.interactions / 10, 1);
        return baseTime * activityFactor;
    }

    getPagesVisited() {
        // This would be enhanced with actual page tracking
        return [window.location.pathname];
    }

    async logEvent(eventType, eventData = {}) {
        if (!this.isTracking) return;

        // Create a unique key for this request to prevent duplicates
        const requestKey = `${eventType}-${JSON.stringify(eventData)}`;
        if (this.pendingRequests.has(requestKey)) {
            console.log('Skipping duplicate tracking request:', eventType);
            return;
        }

        let timeoutId;
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            // Mark request as pending
            this.pendingRequests.add(requestKey);

            // Add timeout to prevent hanging requests
            const controller = new AbortController();
            timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch(`${this.apiBase}/log-event`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    eventType,
                    eventData,
                    metadata: {
                        source: 'client',
                        page: window.location.pathname,
                        userAgent: navigator.userAgent,
                        timestamp: new Date().toISOString()
                    }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            this.pendingRequests.delete(requestKey);

            if (!response.ok) {
                console.warn('Failed to log tracking event:', response.statusText);
            }
        } catch (error) {
            if (timeoutId) clearTimeout(timeoutId);
            this.pendingRequests.delete(requestKey);
            
            if (error.name === 'AbortError') {
                console.warn('Tracking request timed out');
            } else {
                console.warn('Tracking error:', error);
            }
        }
    }

    // Helper methods for common tracking scenarios
    async trackFeatureUsage(featureName, usageData = {}) {
        await this.logEvent('feature_explored', {
            feature: featureName,
            successful: true,
            ...usageData
        });
    }

    async trackError(errorType, errorData = {}) {
        await this.logEvent('error_occurred', {
            errorType,
            page: window.location.pathname,
            timestamp: new Date().toISOString(),
            ...errorData
        });
    }

    async trackHelp(helpType, helpData = {}) {
        await this.logEvent('help_requested', {
            helpType,
            context: window.location.pathname,
            timestamp: new Date().toISOString(),
            ...helpData
        });
    }

    // Enable/disable tracking
    setTracking(enabled) {
        this.isTracking = enabled;
    }
}

// Initialize global tracking instance
window.trackingClient = new TrackingClient();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrackingClient;
}