function getStartOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setUTCDate(diff));
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

function getStartOfNextWeek(date = new Date()) {
  const currentWeekStart = getStartOfWeek(date);
  const nextWeek = new Date(currentWeekStart);
  nextWeek.setUTCDate(currentWeekStart.getUTCDate() + 7);
  nextWeek.setUTCHours(0, 0, 0, 0);
  return nextWeek;
}

function isWeekInPast(weekOfDate) {
  const weekStart = getStartOfWeek(weekOfDate);
  const currentWeekStart = getStartOfWeek(new Date());
  return weekStart < currentWeekStart;
}

function isWeekCurrentOrFuture(weekOfDate) {
  const weekStart = getStartOfWeek(weekOfDate);
  const currentWeekStart = getStartOfWeek(new Date());
  return weekStart >= currentWeekStart;
}

module.exports = { getStartOfWeek, getStartOfNextWeek, isWeekInPast, isWeekCurrentOrFuture };
