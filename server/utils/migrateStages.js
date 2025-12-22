/**
 * Migration script to update users from old numeric stage system to new string-based stage system
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

async function migrateUserStages() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find all users with numeric userStage
        const users = await User.find({ userStage: { $type: "number" } });
        console.log(`Found ${users.length} users with numeric stages`);

        // Update each user
        for (const user of users) {
            let newStage = 'discovery';
            
            // Map old numeric stages to new string stages
            switch (user.userStage) {
                case 1:
                    newStage = 'discovery';
                    break;
                case 2:
                    newStage = 'onboarding';
                    break;
                case 3:
                    newStage = 'growth';
                    break;
                case 4:
                    newStage = 'mastery';
                    break;
                case 5:
                    newStage = 'mentorship';
                    break;
                default:
                    newStage = 'discovery';
            }

            // Update user
            await User.findByIdAndUpdate(user._id, {
                userStage: newStage,
                stageStartDate: user.stageStartDate || new Date(),
                stageProgress: 0,
                stageMetrics: new Map(),
                stageHistory: []
            });

            console.log(`Updated user ${user._id} from stage ${user.userStage} to ${newStage}`);
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

// Run migration if called directly
if (require.main === module) {
    migrateUserStages();
}

module.exports = migrateUserStages;