/**
 * Utility helper to get precise local start and end bounds for date string "YYYY-MM-DD" or Date object.
 * Fixes timezone offset bugs when searching dates in Prisma (e.g. UTC vs WIB UTC+7).
 */
function getLocalDateBounds(dateInput) {
  if (!dateInput) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (typeof dateInput === 'string') {
    const datePart = dateInput.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
      const year = Number(parts[0]);
      const month = Number(parts[1]) - 1;
      const day = Number(parts[2]);

      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        const start = new Date(year, month, day, 0, 0, 0, 0);
        const end = new Date(year, month, day, 23, 59, 59, 999);
        return { start, end };
      }
    }
  }

  const start = new Date(dateInput);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Creates a Date object set to 00:00:00 local time for a "YYYY-MM-DD" string or Date.
 */
function parseLocalDate(dateInput) {
  return getLocalDateBounds(dateInput).start;
}

module.exports = {
  getLocalDateBounds,
  parseLocalDate
};
