/**
 * Debug date comparison logic
 */

function getStartOfWeek(date = new Date()) {
    const d = new Date(date);
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setUTCDate(diff));
    monday.setUTCHours(0, 0, 0, 0);
    return monday;
}

function isWeekInPast(weekOfDate) {
    const weekStart = getStartOfWeek(weekOfDate);
    const currentWeekStart = getStartOfWeek(new Date());
    console.log('Week start:', weekStart.toISOString());
    console.log('Current week start:', currentWeekStart.toISOString());
    console.log('Is past?', weekStart < currentWeekStart);
    return weekStart < currentWeekStart;
}

// Test with last week
const lastWeek = new Date();
lastWeek.setDate(lastWeek.getDate() - 7);
console.log('Testing last week:', lastWeek.toISOString());
isWeekInPast(lastWeek);

console.log('\nTesting current week:', new Date().toISOString());
isWeekInPast(new Date());

// Test with next week
const nextWeek = new Date();
nextWeek.setDate(nextWeek.getDate() + 7);
console.log('\nTesting next week:', nextWeek.toISOString());
isWeekInPast(nextWeek);