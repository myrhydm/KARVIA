/**
 * server/services/emailService.js
 * Email service for sending reminders and notifications
 */

const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

class EmailService {
    constructor() {
        this.transporter = null;
        this.isInitialized = false;
        this.initPromise = this.initializeTransporter();
    }

    /**
     * Initialize email transporter
     */
    async initializeTransporter() {
        // For development, use Gmail SMTP or test service
        // In production, use your preferred email service (SendGrid, AWS SES, etc.)
        
        if (process.env.NODE_ENV === 'production') {
            // Production email configuration
            this.transporter = nodemailer.createTransport({
                service: 'gmail', // or your email service
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
            this.isInitialized = true;
        } else {
            // Development: Create test account
            await this.createTestAccount();
        }
    }

    /**
     * Create test account for development
     */
    async createTestAccount() {
        try {
            const testAccount = await nodemailer.createTestAccount();
            
            this.transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
            
            this.isInitialized = true;
            console.log('📧 Test email account created:');
            console.log('User:', testAccount.user);
            console.log('Pass:', testAccount.pass);
        } catch (error) {
            console.error('Failed to create test account:', error);
        }
    }

    /**
     * Send email with template
     * @param {string} to - Recipient email
     * @param {string} subject - Email subject
     * @param {string} template - Template name
     * @param {Object} data - Template data
     */
    async sendEmail(to, subject, template, data) {
        try {
            // Ensure transporter is initialized
            if (!this.isInitialized) {
                await this.initPromise;
            }
            
            if (!this.transporter) {
                throw new Error('Email transporter not initialized');
            }
            
            const htmlContent = this.renderTemplate(template, data);
            
            const mailOptions = {
                from: process.env.EMAIL_FROM || 'GoalTracker <noreply@goaltracker.com>',
                to: to,
                subject: subject,
                html: htmlContent
            };

            const info = await this.transporter.sendMail(mailOptions);
            
            if (process.env.NODE_ENV !== 'production') {
                console.log('📧 Email sent:', nodemailer.getTestMessageUrl(info));
            }
            
            return {
                success: true,
                messageId: info.messageId,
                previewUrl: nodemailer.getTestMessageUrl(info)
            };
        } catch (error) {
            console.error('Failed to send email:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Render email template with data
     * @param {string} template - Template name
     * @param {Object} data - Template data
     * @returns {string} Rendered HTML
     */
    renderTemplate(template, data) {
        const templates = {
            'daily-reminder': this.getDailyReminderTemplate(data),
            'streak-broken': this.getStreakBrokenTemplate(data),
            'vision-unlocked': this.getVisionUnlockedTemplate(data),
            'welcome': this.getWelcomeTemplate(data),
            'progress-update': this.getProgressUpdateTemplate(data)
        };

        return templates[template] || this.getDefaultTemplate(data);
    }

    /**
     * Daily reminder template
     */
    getDailyReminderTemplate(data) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { text-align: center; margin-bottom: 30px; }
                .title { color: #2c3e50; font-size: 24px; margin-bottom: 10px; }
                .message { color: #34495e; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
                .cta-button { display: inline-block; background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .streak-info { background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 30px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 class="title">🌟 Daily Check-in Reminder</h1>
                </div>
                
                <div class="message">
                    <p>Hi ${data.name},</p>
                    <p><strong>All you have to do is show up!</strong></p>
                    <p>Your journey toward achieving "${data.dream}" continues today. Remember, consistency is key to turning your dreams into reality.</p>
                </div>
                
                <div class="streak-info">
                    <p><strong>Current Streak:</strong> ${data.streakCount} days</p>
                    ${data.visionUnlocked ? 
                        '<p>🎉 <strong>Vision Questionnaire Unlocked!</strong> You can now access advanced insights.</p>' : 
                        `<p>📍 <strong>${data.remainingDays} more days</strong> to unlock the Vision Questionnaire!</p>`
                    }
                </div>
                
                <div style="text-align: center;">
                    <a href="${data.appUrl}" class="cta-button">Check In Now</a>
                </div>
                
                <div class="message">
                    <p>Every day you show up is a day closer to your goal. Keep building that momentum!</p>
                </div>
                
                <div class="footer">
                    <p>GoalTracker - Making Dreams Reality</p>
                    <p>If you don't want to receive these reminders, you can <a href="${data.unsubscribeUrl}">unsubscribe here</a></p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Streak broken template
     */
    getStreakBrokenTemplate(data) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { text-align: center; margin-bottom: 30px; }
                .title { color: #e74c3c; font-size: 24px; margin-bottom: 10px; }
                .message { color: #34495e; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
                .cta-button { display: inline-block; background-color: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .motivation { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
                .footer { text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 30px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 class="title">🚨 Don't Give Up!</h1>
                </div>
                
                <div class="message">
                    <p>Hi ${data.name},</p>
                    <p>We noticed you haven't checked in for ${data.daysMissed} days. Your ${data.previousStreak}-day streak was amazing!</p>
                    <p>Remember: <strong>"${data.dream}"</strong> is still waiting for you.</p>
                </div>
                
                <div class="motivation">
                    <p><strong>💪 Every champion has fallen before rising again.</strong></p>
                    <p>The difference between success and failure isn't perfection - it's persistence. Your journey toward "${data.dream}" is still valid, and today is the perfect day to restart.</p>
                </div>
                
                <div style="text-align: center;">
                    <a href="${data.appUrl}" class="cta-button">Restart Your Journey</a>
                </div>
                
                <div class="message">
                    <p>All you have to do is show up. One day at a time.</p>
                </div>
                
                <div class="footer">
                    <p>GoalTracker - Making Dreams Reality</p>
                    <p>If you don't want to receive these reminders, you can <a href="${data.unsubscribeUrl}">unsubscribe here</a></p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Vision unlocked template
     */
    getVisionUnlockedTemplate(data) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { text-align: center; margin-bottom: 30px; }
                .title { color: #27ae60; font-size: 24px; margin-bottom: 10px; }
                .message { color: #34495e; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
                .cta-button { display: inline-block; background-color: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .celebration { background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #27ae60; }
                .footer { text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 30px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 class="title">🎉 Congratulations!</h1>
                </div>
                
                <div class="message">
                    <p>Hi ${data.name},</p>
                    <p><strong>You did it!</strong> Your consistency has paid off.</p>
                </div>
                
                <div class="celebration">
                    <p><strong>🏆 Vision Questionnaire Unlocked!</strong></p>
                    <p>After ${data.streakCount} days of showing up, you've unlocked access to our advanced Vision Questionnaire. This will provide deeper insights into your journey toward "${data.dream}".</p>
                </div>
                
                <div style="text-align: center;">
                    <a href="${data.visionUrl}" class="cta-button">Take Vision Questionnaire</a>
                </div>
                
                <div class="message">
                    <p>This is just the beginning. Your commitment to showing up daily is already transforming your path to success.</p>
                    <p>The Vision Questionnaire will help you gain clarity, set better goals, and accelerate your progress.</p>
                </div>
                
                <div class="footer">
                    <p>GoalTracker - Making Dreams Reality</p>
                    <p>If you don't want to receive these reminders, you can <a href="${data.unsubscribeUrl}">unsubscribe here</a></p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Welcome template
     */
    getWelcomeTemplate(data) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { text-align: center; margin-bottom: 30px; }
                .title { color: #2c3e50; font-size: 24px; margin-bottom: 10px; }
                .message { color: #34495e; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
                .cta-button { display: inline-block; background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .welcome-info { background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 30px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 class="title">🌟 Welcome to GoalTracker!</h1>
                </div>
                
                <div class="message">
                    <p>Hi ${data.name},</p>
                    <p>Welcome to your journey toward achieving "${data.dream}"!</p>
                    <p>We're here to support you every step of the way.</p>
                </div>
                
                <div class="welcome-info">
                    <p><strong>🎯 Your Goal:</strong> ${data.dream}</p>
                    <p><strong>⏰ Timeline:</strong> ${data.timeline} months</p>
                    <p><strong>💪 Confidence Level:</strong> ${data.confidence}%</p>
                </div>
                
                <div class="message">
                    <p><strong>Remember: All you have to do is show up!</strong></p>
                    <p>Check in daily for 3 days to unlock the Vision Questionnaire and gain deeper insights into your goal.</p>
                </div>
                
                <div style="text-align: center;">
                    <a href="${data.appUrl}" class="cta-button">Start Your Journey</a>
                </div>
                
                <div class="footer">
                    <p>GoalTracker - Making Dreams Reality</p>
                    <p>If you don't want to receive these reminders, you can <a href="${data.unsubscribeUrl}">unsubscribe here</a></p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Progress update template
     */
    getProgressUpdateTemplate(data) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { text-align: center; margin-bottom: 30px; }
                .title { color: #8e44ad; font-size: 24px; margin-bottom: 10px; }
                .message { color: #34495e; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
                .cta-button { display: inline-block; background-color: #8e44ad; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .progress-info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 30px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 class="title">📊 Your Progress Update</h1>
                </div>
                
                <div class="message">
                    <p>Hi ${data.name},</p>
                    <p>Here's your weekly progress toward "${data.dream}":</p>
                </div>
                
                <div class="progress-info">
                    <p><strong>🔥 Current Streak:</strong> ${data.streakCount} days</p>
                    <p><strong>✅ Tasks Completed:</strong> ${data.tasksCompleted}</p>
                    <p><strong>🎯 Goals Achieved:</strong> ${data.goalsAchieved}</p>
                    <p><strong>📈 Progress:</strong> ${data.progressPercentage}%</p>
                </div>
                
                <div class="message">
                    <p>Your consistency is paying off! Keep showing up and you'll reach your goal.</p>
                </div>
                
                <div style="text-align: center;">
                    <a href="${data.appUrl}" class="cta-button">Continue Your Journey</a>
                </div>
                
                <div class="footer">
                    <p>GoalTracker - Making Dreams Reality</p>
                    <p>If you don't want to receive these reminders, you can <a href="${data.unsubscribeUrl}">unsubscribe here</a></p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Default template fallback
     */
    getDefaultTemplate(data) {
        return `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
                <h1 style="color: #2c3e50;">GoalTracker</h1>
                <p>Hi ${data.name},</p>
                <p>${data.message || 'Thank you for using GoalTracker!'}</p>
                <p><a href="${data.appUrl}" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Visit App</a></p>
            </div>
        </body>
        </html>
        `;
    }
}

module.exports = new EmailService();