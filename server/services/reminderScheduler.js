/**
 * server/services/reminderScheduler.js
 * Automated reminder scheduler using cron jobs
 */

const cron = require('node-cron');
const User = require('../models/User');
const emailService = require('./emailService');
const stageManager = require('./stageManager');

class ReminderScheduler {
    constructor() {
        this.jobs = [];
        this.isRunning = false;
    }

    /**
     * Start all scheduled reminder jobs
     */
    start() {
        if (this.isRunning) {
            console.log('📅 Reminder scheduler already running');
            return;
        }

        console.log('📅 Starting reminder scheduler...');
        
        // Daily check-in reminders - 9 AM every day
        const dailyReminderJob = cron.schedule('0 9 * * *', () => {
            this.sendDailyReminders();
        }, {
            scheduled: false,
            timezone: 'America/New_York' // Adjust timezone as needed
        });

        // Streak broken reminders - 8 PM every day
        const streakBrokenJob = cron.schedule('0 20 * * *', () => {
            this.sendStreakBrokenReminders();
        }, {
            scheduled: false,
            timezone: 'America/New_York'
        });

        // Weekly progress updates - Sunday 10 AM
        const weeklyProgressJob = cron.schedule('0 10 * * 0', () => {
            this.sendWeeklyProgressUpdates();
        }, {
            scheduled: false,
            timezone: 'America/New_York'
        });

        // Vision unlocked notifications - Check every hour
        const visionUnlockedJob = cron.schedule('0 * * * *', () => {
            this.sendVisionUnlockedNotifications();
        }, {
            scheduled: false,
            timezone: 'America/New_York'
        });

        this.jobs = [
            { name: 'dailyReminder', job: dailyReminderJob },
            { name: 'streakBroken', job: streakBrokenJob },
            { name: 'weeklyProgress', job: weeklyProgressJob },
            { name: 'visionUnlocked', job: visionUnlockedJob }
        ];

        // Start all jobs
        this.jobs.forEach(({ name, job }) => {
            job.start();
            console.log(`✅ Started ${name} job`);
        });

        this.isRunning = true;
        console.log('📅 All reminder jobs started successfully');
    }

    /**
     * Stop all scheduled jobs
     */
    stop() {
        if (!this.isRunning) {
            console.log('📅 Reminder scheduler not running');
            return;
        }

        this.jobs.forEach(({ name, job }) => {
            job.stop();
            console.log(`⏹️  Stopped ${name} job`);
        });

        this.isRunning = false;
        console.log('📅 All reminder jobs stopped');
    }

    /**
     * Send daily check-in reminders
     */
    async sendDailyReminders() {
        try {
            console.log('📧 Sending daily reminders...');
            
            const now = new Date();
            const yesterday = new Date(now - 24 * 60 * 60 * 1000);
            
            // Find users who haven't checked in today
            const users = await User.find({
                lastCheckIn: { $lt: yesterday },
                streakCount: { $gte: 1 }, // Only send to users with active streaks
                // Add email preferences check here if implemented
            });

            console.log(`📧 Found ${users.length} users for daily reminders`);
            
            const reminderPromises = users.map(async (user) => {
                try {
                    const visionUnlock = await stageManager.checkPathwayUnlock(user._id, 'vision');
                    
                    const emailData = {
                        name: user.name,
                        dream: user.onboardingData?.dream || 'your goal',
                        streakCount: user.streakCount,
                        visionUnlocked: visionUnlock.unlocked,
                        remainingDays: visionUnlock.remainingDays || 0,
                        appUrl: process.env.APP_URL || 'http://localhost:3000',
                        unsubscribeUrl: `${process.env.APP_URL}/unsubscribe?token=${user._id}`
                    };

                    return emailService.sendEmail(
                        user.email,
                        'Daily Check-in Reminder - All You Have To Do Is Show Up! 🌟',
                        'daily-reminder',
                        emailData
                    );
                } catch (error) {
                    console.error(`Failed to send daily reminder to ${user.email}:`, error);
                    return null;
                }
            });

            const results = await Promise.allSettled(reminderPromises);
            const successCount = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
            
            console.log(`📧 Daily reminders sent: ${successCount}/${users.length}`);
        } catch (error) {
            console.error('Failed to send daily reminders:', error);
        }
    }

    /**
     * Send streak broken reminders
     */
    async sendStreakBrokenReminders() {
        try {
            console.log('📧 Sending streak broken reminders...');
            
            const now = new Date();
            const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);
            
            // Find users who haven't checked in for 3+ days but had a streak
            const users = await User.find({
                lastCheckIn: { $lt: threeDaysAgo },
                streakCount: { $gte: 3 }, // Had a decent streak
                // Add flag to prevent multiple streak broken emails
            });

            console.log(`📧 Found ${users.length} users for streak broken reminders`);
            
            const reminderPromises = users.map(async (user) => {
                try {
                    const daysMissed = Math.floor((now - user.lastCheckIn) / (24 * 60 * 60 * 1000));
                    
                    const emailData = {
                        name: user.name,
                        dream: user.onboardingData?.dream || 'your goal',
                        daysMissed: daysMissed,
                        previousStreak: user.streakCount,
                        appUrl: process.env.APP_URL || 'http://localhost:3000',
                        unsubscribeUrl: `${process.env.APP_URL}/unsubscribe?token=${user._id}`
                    };

                    return emailService.sendEmail(
                        user.email,
                        'Don\'t Give Up! Your Journey Continues 🚨',
                        'streak-broken',
                        emailData
                    );
                } catch (error) {
                    console.error(`Failed to send streak broken reminder to ${user.email}:`, error);
                    return null;
                }
            });

            const results = await Promise.allSettled(reminderPromises);
            const successCount = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
            
            console.log(`📧 Streak broken reminders sent: ${successCount}/${users.length}`);
        } catch (error) {
            console.error('Failed to send streak broken reminders:', error);
        }
    }

    /**
     * Send weekly progress updates
     */
    async sendWeeklyProgressUpdates() {
        try {
            console.log('📧 Sending weekly progress updates...');
            
            const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            
            // Find active users (checked in within last week)
            const users = await User.find({
                lastCheckIn: { $gte: oneWeekAgo },
                streakCount: { $gte: 1 }
            });

            console.log(`📧 Found ${users.length} users for weekly progress updates`);
            
            const updatePromises = users.map(async (user) => {
                try {
                    const emailData = {
                        name: user.name,
                        dream: user.onboardingData?.dream || 'your goal',
                        streakCount: user.streakCount,
                        tasksCompleted: 0, // Calculate from task data
                        goalsAchieved: 0, // Calculate from goals data
                        progressPercentage: Math.min(100, (user.streakCount / 30) * 100), // Simple calculation
                        appUrl: process.env.APP_URL || 'http://localhost:3000',
                        unsubscribeUrl: `${process.env.APP_URL}/unsubscribe?token=${user._id}`
                    };

                    return emailService.sendEmail(
                        user.email,
                        'Your Weekly Progress Update 📊',
                        'progress-update',
                        emailData
                    );
                } catch (error) {
                    console.error(`Failed to send progress update to ${user.email}:`, error);
                    return null;
                }
            });

            const results = await Promise.allSettled(updatePromises);
            const successCount = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
            
            console.log(`📧 Weekly progress updates sent: ${successCount}/${users.length}`);
        } catch (error) {
            console.error('Failed to send weekly progress updates:', error);
        }
    }

    /**
     * Send vision unlocked notifications
     */
    async sendVisionUnlockedNotifications() {
        try {
            console.log('📧 Checking for vision unlocked notifications...');
            
            const now = new Date();
            const oneHourAgo = new Date(now - 60 * 60 * 1000);
            
            // Find users who just reached 3-day streak in the last hour
            const users = await User.find({
                streakCount: 3,
                lastCheckIn: { $gte: oneHourAgo },
                // Add flag to prevent multiple vision unlocked emails
            });

            console.log(`📧 Found ${users.length} users for vision unlocked notifications`);
            
            const notificationPromises = users.map(async (user) => {
                try {
                    const emailData = {
                        name: user.name,
                        dream: user.onboardingData?.dream || 'your goal',
                        streakCount: user.streakCount,
                        visionUrl: `${process.env.APP_URL}/vision-questionnaire` || 'http://localhost:3000/vision-questionnaire',
                        appUrl: process.env.APP_URL || 'http://localhost:3000',
                        unsubscribeUrl: `${process.env.APP_URL}/unsubscribe?token=${user._id}`
                    };

                    return emailService.sendEmail(
                        user.email,
                        'Congratulations! Vision Questionnaire Unlocked! 🎉',
                        'vision-unlocked',
                        emailData
                    );
                } catch (error) {
                    console.error(`Failed to send vision unlocked notification to ${user.email}:`, error);
                    return null;
                }
            });

            const results = await Promise.allSettled(notificationPromises);
            const successCount = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
            
            console.log(`📧 Vision unlocked notifications sent: ${successCount}/${users.length}`);
        } catch (error) {
            console.error('Failed to send vision unlocked notifications:', error);
        }
    }

    /**
     * Send welcome email to new user
     */
    async sendWelcomeEmail(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const emailData = {
                name: user.name,
                dream: user.onboardingData?.dream || 'your goal',
                timeline: user.onboardingData?.timeline || 12,
                confidence: user.onboardingData?.confidence || 50,
                appUrl: process.env.APP_URL || 'http://localhost:3000',
                unsubscribeUrl: `${process.env.APP_URL}/unsubscribe?token=${user._id}`
            };

            const result = await emailService.sendEmail(
                user.email,
                'Welcome to GoalTracker! Your Journey Starts Now 🌟',
                'welcome',
                emailData
            );

            console.log(`📧 Welcome email sent to ${user.email}`);
            return result;
        } catch (error) {
            console.error('Failed to send welcome email:', error);
            throw error;
        }
    }

    /**
     * Get scheduler status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            jobs: this.jobs.map(({ name, job }) => ({
                name,
                running: job.running || false
            }))
        };
    }
}

module.exports = new ReminderScheduler();