/**
 * Frontend Tracking Client
 * 
 * Lightweight client for tracking user interactions and sending them
 * to the tracking engine. Designed to fail gracefully and not disrupt
 * the main application flow.
 */

class TrackingClient {
    constructor(options = {}) {
        this.options = {
            enabled: options.enabled ?? this.isTrackingEnabled(),
            apiBase: options.apiBase ?? '/api/engines/tracker',
            batchSize: options.batchSize ?? 10,
            flushInterval: options.flushInterval ?? 30000, // 30 seconds
            maxRetries: options.maxRetries ?? 3,
            retryDelay: options.retryDelay ?? 5000,
            debug: options.debug ?? false,
            ...options
        };
        
        this.eventQueue = [];
        this.failedEvents = [];
        this.sessionId = this.generateSessionId();
        this.userId = this.getUserId();
        this.isOnline = navigator.onLine;
        
        if (this.options.enabled) {
            this.initializeTracking();
        }
        
        this.log('Tracking client initialized', { 
            enabled: this.options.enabled,
            userId: this.userId,
            sessionId: this.sessionId
        });
    }
    
    /**
     * Track a user event
     * @param {string} eventType - Type of event
     * @param {Object} eventData - Event data payload
     * @param {Object} metadata - Additional metadata
     */
    track(eventType, eventData = {}, metadata = {}) {
        if (!this.options.enabled) {
            this.log('Tracking disabled, ignoring event', { eventType });
            return;
        }
        
        try {
            const event = {
                eventType,
                eventData: this.sanitizeEventData(eventData),
                userId: this.userId,
                sessionId: this.sessionId,
                timestamp: new Date().toISOString(),
                metadata: {
                    source: this.getCurrentPage(),
                    userAgent: navigator.userAgent,
                    deviceType: this.getDeviceType(),
                    viewport: this.getViewportSize(),
                    referrer: document.referrer,
                    ...metadata
                }
            };
            
            // Add to queue
            this.eventQueue.push(event);
            
            this.log('Event queued', { eventType, queueSize: this.eventQueue.length });
            
            // Flush if queue is full
            if (this.eventQueue.length >= this.options.batchSize) {
                this.flush();
            }
            
        } catch (error) {
            this.log('Failed to track event', { eventType, error: error.message });
        }
    }
    
    /**
     * Track page visit
     * @param {string} page - Page identifier
     * @param {Object} additionalData - Additional page data
     */
    trackPageVisit(page = null, additionalData = {}) {
        const pageData = {
            page: page || this.getCurrentPage(),
            url: window.location.href,
            title: document.title,
            loadTime: this.getPageLoadTime(),
            ...additionalData
        };
        
        this.track('page_visited', pageData);
    }
    
    /**
     * Track user login
     * @param {string} method - Login method (email, google, etc.)
     */
    trackLogin(method = 'email') {
        this.userId = this.getUserId(); // Refresh user ID
        this.track('user_login', { method });
    }
    
    /**
     * Track task completion
     * @param {string} taskId - Task identifier
     * @param {number} timeSpent - Time spent in minutes
     * @param {string} quality - Task quality (low, medium, high)
     */
    trackTaskCompletion(taskId, timeSpent = null, quality = null) {
        const eventData = { taskId };
        if (timeSpent !== null) eventData.timeSpent = timeSpent;
        if (quality !== null) eventData.quality = quality;
        
        this.track('task_completed', eventData);
    }
    
    /**
     * Track task skip
     * @param {string} taskId - Task identifier
     * @param {string} reason - Skip reason
     */
    trackTaskSkip(taskId, reason = null) {
        const eventData = { taskId };
        if (reason) eventData.reason = reason;
        
        this.track('task_skipped', eventData);
    }
    
    /**
     * Track reflection submission
     * @param {string} content - Reflection content
     * @param {string} sentiment - Sentiment analysis result
     */
    trackReflection(content, sentiment = null) {
        const eventData = { 
            content: content.substring(0, 1000), // Limit content length
            wordCount: content.split(' ').length
        };
        if (sentiment) eventData.sentiment = sentiment;
        
        this.track('reflection_submitted', eventData);
    }
    
    /**
     * Track plan generation
     * @param {string} planId - Plan identifier
     * @param {string} method - Generation method (llm, template, manual)
     */
    trackPlanGeneration(planId, method = 'llm') {
        this.track('plan_generated', { planId, method });
    }
    
    /**
     * Track feature exploration
     * @param {string} feature - Feature name
     * @param {Object} context - Feature context
     */
    trackFeatureExploration(feature, context = {}) {
        this.track('feature_explored', { feature, ...context });
    }
    
    /**
     * Track error occurrence
     * @param {Error} error - Error object
     * @param {string} context - Error context
     */
    trackError(error, context = 'unknown') {
        this.track('error_occurred', {
            message: error.message,
            stack: error.stack?.substring(0, 500), // Limit stack trace
            context,
            url: window.location.href
        });
    }
    
    /**
     * Flush queued events to server
     */
    async flush() {
        if (this.eventQueue.length === 0) {
            return;
        }
        
        const events = [...this.eventQueue];
        this.eventQueue = [];
        
        try {
            await this.sendEvents(events);
            this.log('Events flushed successfully', { count: events.length });
        } catch (error) {
            this.log('Failed to flush events', { count: events.length, error: error.message });
            
            // Add failed events to retry queue
            this.failedEvents.push(...events);
            this.scheduleRetry();
        }
    }
    
    /**
     * Send events to server
     * @param {Array} events - Events to send
     */
    async sendEvents(events) {
        if (!this.isOnline) {
            throw new Error('Offline - events will be retried when online');
        }
        
        const response = await fetch(`${this.options.apiBase}/log-events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.getAuthHeader()
            },
            body: JSON.stringify({ events })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Unknown server error');
        }
        
        return result;
    }
    
    /**
     * Schedule retry for failed events
     */
    scheduleRetry() {
        if (this.retryTimeout) {
            return; // Retry already scheduled
        }
        
        this.retryTimeout = setTimeout(() => {
            this.retryFailedEvents();
            this.retryTimeout = null;
        }, this.options.retryDelay);
    }
    
    /**
     * Retry failed events
     */
    async retryFailedEvents() {
        if (this.failedEvents.length === 0) {
            return;
        }
        
        const events = [...this.failedEvents];
        this.failedEvents = [];
        
        try {
            await this.sendEvents(events);
            this.log('Failed events retried successfully', { count: events.length });
        } catch (error) {
            this.log('Retry failed', { count: events.length, error: error.message });
            
            // Limit retry attempts
            if (events[0].retryCount < this.options.maxRetries) {
                events.forEach(event => {
                    event.retryCount = (event.retryCount || 0) + 1;
                });
                this.failedEvents.push(...events);
                this.scheduleRetry();
            } else {
                this.log('Max retries exceeded, dropping events', { count: events.length });
            }
        }
    }
    
    /**
     * Initialize tracking features
     */
    initializeTracking() {
        // Set up periodic flushing
        this.flushInterval = setInterval(() => {
            this.flush();
        }, this.options.flushInterval);
        
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.flush(); // Flush when page becomes hidden
            }
        });
        
        // Track page unload
        window.addEventListener('beforeunload', () => {
            // Use sendBeacon for reliable delivery on page unload
            this.flushWithBeacon();
        });
        
        // Track online/offline status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.retryFailedEvents();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
        
        // Automatically track page visit
        this.trackPageVisit();
    }
    
    /**
     * Flush using sendBeacon for page unload
     */
    flushWithBeacon() {
        if (this.eventQueue.length === 0) {
            return;
        }
        
        const events = [...this.eventQueue];
        this.eventQueue = [];
        
        const data = JSON.stringify({ events });
        
        if (navigator.sendBeacon) {
            navigator.sendBeacon(`${this.options.apiBase}/log-events`, data);
        }
    }
    
    /**
     * Check if tracking is enabled
     */
    isTrackingEnabled() {
        // Check local storage preference
        const userPreference = localStorage.getItem('trackingEnabled');
        if (userPreference !== null) {
            return userPreference === 'true';
        }
        
        // Check for Do Not Track header
        if (navigator.doNotTrack === '1') {
            return false;
        }
        
        // Default to enabled
        return true;
    }
    
    /**
     * Get current user ID
     */
    getUserId() {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return user.id || user.email || null;
        } catch {
            return null;
        }
    }
    
    /**
     * Get authorization header
     */
    getAuthHeader() {
        const token = localStorage.getItem('authToken');
        return token ? `Bearer ${token}` : '';
    }
    
    /**
     * Generate session ID
     */
    generateSessionId() {
        return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Get current page identifier
     */
    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index';
        return page.replace('.html', '');
    }
    
    /**
     * Get device type
     */
    getDeviceType() {
        const width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    }
    
    /**
     * Get viewport size
     */
    getViewportSize() {
        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }
    
    /**
     * Get page load time
     */
    getPageLoadTime() {
        if (performance && performance.timing) {
            return performance.timing.loadEventEnd - performance.timing.navigationStart;
        }
        return null;
    }
    
    /**
     * Sanitize event data to remove sensitive information
     */
    sanitizeEventData(data) {
        const sanitized = { ...data };
        
        // Remove potentially sensitive fields
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'authToken'];
        sensitiveFields.forEach(field => {
            delete sanitized[field];
        });
        
        return sanitized;
    }
    
    /**
     * Log debug messages
     */
    log(message, data = {}) {
        if (this.options.debug) {
            console.log(`[Tracking] ${message}`, data);
        }
    }
    
    /**
     * Enable/disable tracking
     */
    setEnabled(enabled) {
        this.options.enabled = enabled;
        localStorage.setItem('trackingEnabled', enabled.toString());
        
        if (enabled && !this.flushInterval) {
            this.initializeTracking();
        } else if (!enabled && this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }
        
        this.log(`Tracking ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Get tracking status
     */
    getStatus() {
        return {
            enabled: this.options.enabled,
            queueSize: this.eventQueue.length,
            failedEvents: this.failedEvents.length,
            sessionId: this.sessionId,
            userId: this.userId,
            isOnline: this.isOnline
        };
    }
    
    /**
     * Destroy tracking client
     */
    destroy() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
        }
        
        if (this.retryTimeout) {
            clearTimeout(this.retryTimeout);
        }
        
        // Final flush
        this.flush();
    }
}

// Create global tracking instance
window.tracker = new TrackingClient({
    debug: localStorage.getItem('trackingDebug') === 'true'
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrackingClient;
}