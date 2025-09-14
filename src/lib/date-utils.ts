
// A list of Guatemalan holidays for the current year.
// Note: Some holidays are movable (like Holy Week). 
// This list is a simplified version and might need to be updated annually for full accuracy.
const guatemalanHolidays: string[] = [
    '01-01', // New Year's Day
    '05-01', // Labor Day
    '06-30', // Army Day
    '08-15', // Assumption of Mary (Guatemala City only, but often taken elsewhere)
    '09-15', // Independence Day
    '10-20', // Revolution Day
    '11-01', // All Saints' Day
    '12-25', // Christmas Day
];

// This function doesn't account for variable holidays like Holy Week for simplicity.
// For a production app, a more robust holiday API or library would be recommended.
const isHoliday = (date: Date): boolean => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${month}-${day}`;
    return guatemalanHolidays.includes(dateString);
};

export function parseDate(input?: string | Date | number | null): Date {
  if (input == null) return new Date(0);

  if (input instanceof Date) return input;

  if (typeof input === 'number' && Number.isFinite(input)) {
    // si parece ser segundos, multiplica
    return new Date(input > 1e12 ? input : input * 1000);
  }

  let s = String(input).trim();
  if (!s) return new Date(0);

  const iso = Date.parse(s);
  if (!Number.isNaN(iso)) return new Date(iso);

  if (s.includes('T')) s = s.split('T')[0];

  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (m) {
    const [, y, mo, d] = m;
    return new Date(Number(y), Number(mo) - 1, Number(d));
  }

  m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return new Date(Number(y), Number(mo) - 1, Number(d));
  }

  return new Date(0);
}

export const calculateBusinessDays = (startDate: Date, endDate: Date): number => {
    let count = 0;
    const curDate = new Date(startDate.getTime());

    // Ensure endDate is not in the past relative to startDate
    if (endDate < startDate) {
        return 0;
    }

    while (curDate <= endDate) {
        const dayOfWeek = curDate.getDay();
        // 0 = Sunday, 6 = Saturday
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday(curDate)) {
            count++;
        }
        curDate.setDate(curDate.getDate() + 1);
    }
    // Subtract 1 to not count the start day itself, but only the days passed.
    return count > 0 ? count - 1 : 0;
};
