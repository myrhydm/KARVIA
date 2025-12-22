/**
 * Debug Login Routing Issue
 * Check what the /api/dreams/active endpoint returns for existing users
 */

require('dotenv').config();

async function debugRouting() {
    console.log('🔍 Debugging Login Routing Issue...');
    
    // Connect to MongoDB
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/goaltracker');
    console.log('📊 Connected to MongoDB');
    
    const User = require('./server/models/User');
    const UserDream = require('./server/models/UserDream');
    const WeeklyGoal = require('./server/models/WeeklyGoal');
    
    try {
        // Find users and check their dream status
        const users = await User.find({}).select('_id name email onboardingCompleted').limit(5);
        console.log('\n👥 Users and their routing status:');
        
        for (const user of users) {
            console.log(`\n📋 User: ${user.name} (${user._id})`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Onboarding Completed: ${user.onboardingCompleted}`);
            
            // Check their dreams
            const dreams = await UserDream.find({ user: user._id }).select('_id dreamText planGenerated planGeneratedAt goalIds');
            console.log(`   Dreams: ${dreams.length}`);
            
            if (dreams.length > 0) {
                dreams.forEach(dream => {
                    console.log(`   - Dream ID: ${dream._id}`);
                    console.log(`     Text: ${dream.dreamText?.substring(0, 50)}...`);
                    console.log(`     Plan Generated: ${dream.planGenerated}`);
                    console.log(`     Plan Generated At: ${dream.planGeneratedAt}`);
                    console.log(`     Goal IDs: ${dream.goalIds?.length || 0} goals`);
                    console.log();
                });
                
                // Simulate the routing logic
                const hasGeneratedPlan = dreams.some(dream => dream.planGenerated);
                const routingDecision = hasGeneratedPlan ? 'home.html (dashboard)' : 'my_journey.html';
                console.log(`   🎯 Routing Decision: ${routingDecision}`);
                
                // Check what the API would return
                const activeData = {
                    success: true,
                    data: dreams
                };
                console.log(`   📡 API Response: ${JSON.stringify(activeData, null, 2)}`);
                
    if (hasGeneratedPlan) {
                    console.log(`   ✅ User should go to DASHBOARD (home.html)`);
                } else {
                    console.log(`   ❌ User will go to MY_JOURNEY (my_journey.html) - this might be the issue`);
                }
                
            } else {
                console.log(`   🎯 Routing Decision: my_journey.html (no dreams)`);
                console.log(`   ➡️  User should go to MY_JOURNEY (correct for new users)`);
            }
        }
        
        // Check for users with completed onboarding but no dreams
        const completedUsers = await User.find({ onboardingCompleted: true });
        console.log(`\n📊 Users with completed onboarding: ${completedUsers.length}`);
        
        for (const user of completedUsers) {
            const dreams = await UserDream.find({ user: user._id });
            if (dreams.length === 0) {
                console.log(`   ⚠️  ${user.name} has completed onboarding but no dreams - should create dream`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

// Run the debug
if (require.main === module) {
    debugRouting().catch(console.error);
}

module.exports = { debugRouting };