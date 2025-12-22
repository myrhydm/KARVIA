/**
 * Migration script to update existing WeeklyGoal records with proper journeyWeek values
 * This script analyzes goal titles and creation dates to assign correct week numbers
 */

const mongoose = require('mongoose');
const WeeklyGoal = require('../models/WeeklyGoal');
const UserDream = require('../models/UserDream');

async function migrateJourneyWeeks() {
    try {
        console.log('🔄 Starting journey week migration...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goaltracker');
        console.log('✅ Connected to MongoDB');
        
        // Find all goals that don't have journeyWeek set
        const goalsToUpdate = await WeeklyGoal.find({
            $or: [
                { journeyWeek: { $exists: false } },
                { journeyWeek: null }
            ]
        }).populate('tasks');
        
        console.log(`📋 Found ${goalsToUpdate.length} goals to update`);
        
        if (goalsToUpdate.length === 0) {
            console.log('✅ No goals need updating');
            return;
        }
        
        // Group goals by user to process each user's journey separately
        const goalsByUser = new Map();
        goalsToUpdate.forEach(goal => {
            const userId = goal.user.toString();
            if (!goalsByUser.has(userId)) {
                goalsByUser.set(userId, []);
            }
            goalsByUser.get(userId).push(goal);
        });
        
        console.log(`👥 Processing ${goalsByUser.size} users`);
        
        // Process each user's goals
        for (const [userId, userGoals] of goalsByUser) {
            console.log(`\n🔍 Processing user ${userId} with ${userGoals.length} goals`);
            
            // Sort goals by creation date to assign weeks chronologically
            userGoals.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            
            // Assign week numbers based on goal patterns
            for (let i = 0; i < userGoals.length; i++) {
                const goal = userGoals[i];
                let weekNumber = 1;
                let theme = 'Week 1';
                
                // Method 1: Extract from title (e.g., "Goal Title - Week 2")
                const weekMatch = goal.title.match(/Week (\d+)/i);
                if (weekMatch) {
                    weekNumber = parseInt(weekMatch[1]);
                    theme = `Week ${weekNumber}`;
                } else {
                    // Method 2: Distribute evenly across 3 weeks based on creation order
                    const goalsPerWeek = Math.ceil(userGoals.length / 3);
                    weekNumber = Math.floor(i / goalsPerWeek) + 1;
                    weekNumber = Math.min(weekNumber, 3); // Cap at week 3
                    
                    // Assign themes based on week number
                    const themes = {
                        1: 'Discovery & Assessment',
                        2: 'Skill Development',
                        3: 'Implementation & Action'
                    };
                    theme = themes[weekNumber] || `Week ${weekNumber}`;
                }
                
                // Update the goal with proper values
                await WeeklyGoal.findByIdAndUpdate(goal._id, {
                    journeyWeek: weekNumber,
                    journeyTheme: theme,
                    category: 'journey'
                });
                
                console.log(`  ✅ Updated goal "${goal.title}" -> Week ${weekNumber} (${theme})`);
            }
        }
        
        console.log('\n🎉 Migration completed successfully!');
        
        // Verify the migration
        const updatedCount = await WeeklyGoal.countDocuments({
            journeyWeek: { $exists: true, $ne: null }
        });
        console.log(`📊 Total goals with journeyWeek after migration: ${updatedCount}`);
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Export for use as a module or run directly
module.exports = migrateJourneyWeeks;

// Run if called directly
if (require.main === module) {
    migrateJourneyWeeks()
        .then(() => {
            console.log('✅ Migration script completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Migration script failed:', error);
            process.exit(1);
        });
}