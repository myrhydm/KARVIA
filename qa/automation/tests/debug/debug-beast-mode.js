/**
 * Debug Beast Mode Prompt Generation
 * See exactly what prompt is sent to OpenAI for beast mode
 */

require('dotenv').config();

async function debugBeastModePrompt() {
    console.log('🐅 Debugging Beast Mode Prompt Generation...');
    
    const planPrompts = require('./server/engines/planner/prompts/planGeneration');
    
    const userInput = {
        dreamText: 'I want to become a senior software engineer and launch my own SaaS product',
        confidence: 85,
        timeHorizon: 8,
        careerPath: 'entrepreneur',
        timeCommitment: 'beast-mode',
        learningStyle: 'hands-on',
        startDate: new Date(),
        startDay: 'Monday',
        availableDaysWeek1: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    };
    
    const ragContext = { hasContext: false, examples: [] };
    
    const prompt = planPrompts.buildPlanPrompt(userInput, ragContext);
    
    console.log('\n📋 Generated Prompt for Beast Mode:');
    console.log('=' + '='.repeat(80));
    console.log(prompt);
    console.log('=' + '='.repeat(80));
    
    // Extract specific sections
    const timeCommitmentSection = prompt.match(/TIME COMMITMENT GUIDANCE:\n(.*?)(?=\n\n|\nLEARNING)/s);
    if (timeCommitmentSection) {
        console.log('\n🔥 Beast Mode Time Commitment Guidance:');
        console.log(timeCommitmentSection[1]);
    }
    
    // Check if 6-hour commitment is mentioned
    const has6HourMention = prompt.includes('6 hours') || prompt.includes('6 hour');
    console.log('\n⏰ 6-hour commitment mentioned:', has6HourMention ? '✅' : '❌');
    
    // Look for aggressive/intensive language
    const aggressiveTerms = ['intensive', 'aggressive', 'accelerate', 'power sessions', 'beast', 'comprehensive'];
    const foundTerms = aggressiveTerms.filter(term => prompt.toLowerCase().includes(term.toLowerCase()));
    console.log('🚀 Aggressive terms found:', foundTerms.join(', ') || 'None');
    
    console.log('\n📊 Prompt Analysis:');
    console.log('   Total length:', prompt.length, 'characters');
    console.log('   Estimated tokens:', Math.round(prompt.length / 4));
}

// Run the debug
if (require.main === module) {
    debugBeastModePrompt().catch(console.error);
}

module.exports = { debugBeastModePrompt };