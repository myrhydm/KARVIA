const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const axios = require('axios');

// Tracking Engine Client - communicates with standalone tracking service
class TrackingEngineClient {
    constructor(options = {}) {
        this.enabled = options.enabled !== false;
        this.baseUrl = options.baseUrl || process.env.TRACKING_ENGINE_URL || 'http://localhost:8086';
    }

    async createTask(taskData) {
        if (!this.enabled) return null;
        try {
            const response = await axios.post(`${this.baseUrl}/api/tasks`, taskData);
            return response.data;
        } catch (error) {
            console.error('Tracking engine task creation failed:', error.message);
            return null;
        }
    }

    async updateProgress(trackerId, progressData) {
        if (!this.enabled) return null;
        try {
            const response = await axios.post(`${this.baseUrl}/api/progress/${trackerId}/update`, progressData);
            return response.data;
        } catch (error) {
            console.error('Tracking engine progress update failed:', error.message);
            return null;
        }
    }

    async logEvent(eventType, eventData, userId, metadata = {}) {
        if (!this.enabled) return null;
        try {
            const response = await axios.post(`${this.baseUrl}/api/events/log`, {
                eventType,
                eventData,
                userId,
                metadata
            });
            return response.data;
        } catch (error) {
            console.error('Tracking engine event logging failed:', error.message);
            return null;
        }
    }

    async logEvents(events) {
        if (!this.enabled) return null;
        try {
            const response = await axios.post(`${this.baseUrl}/api/events/bulk`, {
                events
            });
            return response.data;
        } catch (error) {
            console.error('Tracking engine bulk event logging failed:', error.message);
            return null;
        }
    }

    async getUserEvents(userId, options = {}) {
        if (!this.enabled) return [];
        try {
            const params = new URLSearchParams();
            if (options.limit) params.append('limit', options.limit);
            if (options.timeRange) params.append('timeRange', options.timeRange);
            
            const response = await axios.get(`${this.baseUrl}/api/events/user/${userId}?${params}`);
            return response.data;
        } catch (error) {
            console.error('Tracking engine get user events failed:', error.message);
            return [];
        }
    }

    async getUserEventStats(userId, timeRange) {
        if (!this.enabled) return null;
        try {
            const response = await axios.get(`${this.baseUrl}/api/events/user/${userId}/stats?timeRange=${timeRange}`);
            return response.data;
        } catch (error) {
            console.error('Tracking engine get user event stats failed:', error.message);
            return null;
        }
    }

    getQueueSize() {
        return 0;
    }

    get options() {
        return {
            enabled: this.enabled,
            baseUrl: this.baseUrl
        };
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

// Initialize tracking engine client
const trackingEngine = new TrackingEngineClient({
    enabled: process.env.TRACKING_ENABLED !== 'false',
    baseUrl: process.env.TRACKING_ENGINE_URL || 'http://localhost:8086'
});

// POST /api/reflections - Create reflection
router.post('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { reflectionType, content, context = {} } = req.body;

        // Validate input
        if (!reflectionType || !content?.text) {
            return res.status(400).json({ 
                success: false, 
                message: 'Reflection type and text are required' 
            });
        }

        // Validate text length
        if (content.text.length < 10) {
            return res.status(400).json({ 
                success: false, 
                message: 'Reflection text must be at least 10 characters' 
            });
        }

        // Create reflection data for tracking
        const reflectionData = {
            reflectionType,
            content: content.text,
            mood: content.mood,
            context: {
                ...context,
                dreamId: req.user.activeDreamId, // If available
                userAgent: req.headers['user-agent'],
                source: 'home_page'
            },
            wordCount: content.text.split(/\s+/).length,
            timestamp: new Date()
        };

        // Save to tracking engine (leverages existing event system)
        const eventResult = await trackingEngine.logEvent(
            'reflection_submitted',
            reflectionData,
            userId,
            {
                source: 'home_page',
                userAgent: req.headers['user-agent'],
                reflectionType: reflectionType
            }
        );

        if (eventResult.success) {
            res.json({
                success: true,
                message: 'Reflection saved successfully',
                reflectionId: eventResult.eventId
            });
        } else {
            throw new Error('Failed to save reflection event');
        }

    } catch (error) {
        console.error('Reflection save error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save reflection'
        });
    }
});

// GET /api/reflections/user/:userId - Get user reflections (for future diary view)
router.get('/user/:userId', authMiddleware, async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Verify user can access these reflections
        if (userId !== req.user.userId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied' 
            });
        }

        const reflections = await trackingEngine.getUserEvents(userId, {
            eventType: 'reflection_submitted',
            limit: 50
        });

        res.json({
            success: true,
            reflections: reflections.map(event => ({
                id: event.eventId,
                type: event.eventData.reflectionType,
                text: event.eventData.content,
                mood: event.eventData.mood,
                wordCount: event.eventData.wordCount,
                timestamp: event.timestamp,
                context: event.eventData.context
            }))
        });

    } catch (error) {
        console.error('Get reflections error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reflections'
        });
    }
});

module.exports = router;