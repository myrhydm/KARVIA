/**
 * Debug script to test for weeklyGoals endpoint calls without weekOf parameter
 */

// Test function to simulate the potential issue
function testWeeklyGoalsCall() {
    console.log('=== Testing weeklyGoals endpoint calls ===');
    
    // Simulate the case where localStorage might be empty
    const mockGetSelectedWeekStartDate = () => {
        const stored = localStorage.getItem('selectedWeekOf');
        console.log('Stored selectedWeekOf:', stored);
        
        if (stored) {
            const date = new Date(stored);
            console.log('Parsed stored date:', date);
            console.log('Is valid date:', !isNaN(date));
            return date;
        }
        
        // This is what happens when no stored value exists
        const def = getStartOfWeek(new Date());
        console.log('Default calculated weekOf:', def);
        localStorage.setItem('selectedWeekOf', def.toISOString());
        return def;
    };
    
    // Test the URL generation
    const selected = mockGetSelectedWeekStartDate();
    console.log('Selected date:', selected);
    console.log('toISOString():', selected.toISOString());
    
    const url = `/api/weeklyGoals?weekOf=${encodeURIComponent(selected.toISOString())}`;
    console.log('Generated URL:', url);
    
    // Test if there's any scenario where selected could be null/undefined
    if (!selected || selected === null || selected === undefined) {
        console.log('ERROR: selected is null/undefined!');
        return;
    }
    
    // Test if toISOString() could fail
    try {
        const isoString = selected.toISOString();
        console.log('ISO string generation successful:', isoString);
        
        if (!isoString || isoString === 'null' || isoString === 'undefined') {
            console.log('ERROR: toISOString() returned invalid value!');
        }
    } catch (e) {
        console.log('ERROR: toISOString() threw an exception:', e);
    }
}

// Helper function (simplified version of utils.js)
function getStartOfWeek(d = new Date()) {
    const date = new Date(d);
    const day = date.getUTCDay(); // 0 (Sun) to 6 (Sat)
    const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(date.setUTCDate(diff));
    monday.setUTCHours(0, 0, 0, 0);
    return monday;
}

// Test potential edge cases
console.log('=== Testing edge cases ===');

// Test 1: Empty localStorage
localStorage.removeItem('selectedWeekOf');
testWeeklyGoalsCall();

// Test 2: Invalid date in localStorage
localStorage.setItem('selectedWeekOf', 'invalid-date');
testWeeklyGoalsCall();

// Test 3: null in localStorage
localStorage.setItem('selectedWeekOf', 'null');
testWeeklyGoalsCall();

// Test 4: undefined in localStorage
localStorage.setItem('selectedWeekOf', 'undefined');
testWeeklyGoalsCall();

// Test 5: Empty string in localStorage
localStorage.setItem('selectedWeekOf', '');
testWeeklyGoalsCall();

console.log('=== Debug test completed ===');