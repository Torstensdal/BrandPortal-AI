
export interface MonthDay {
    date: Date;
    isCurrentMonth: boolean;
}

/**
 * Beregner ISO-ugenummeret for en given dato.
 */
export const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

/**
 * Formaterer en Date til YYYY-MM-DD baseret på lokal tid.
 * Dette sikrer at vi ikke får tidszone-forskydninger (som ved toISOString).
 */
export const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getDaysInMonth = (year: number, month: number): MonthDay[] => {
    const date = new Date(year, month, 1);
    const days: MonthDay[] = [];

    // Previous month's days
    const firstDayIndex = (date.getDay() + 6) % 7; // Monday is 0, Sunday is 6
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex; i > 0; i--) {
        days.push({
            date: new Date(year, month - 1, prevMonthLastDate - i + 1),
            isCurrentMonth: false,
        });
    }

    // Current month's days
    while (date.getMonth() === month) {
        days.push({
            date: new Date(date),
            isCurrentMonth: true,
        });
        date.setDate(date.getDate() + 1);
    }
    
    // Next month's days
    const lastDay = new Date(year, month + 1, 0);
    const adjustedLastDayIndex = (lastDay.getDay() + 6) % 7;
    const nextDaysCount = adjustedLastDayIndex === 6 ? 0 : 6 - adjustedLastDayIndex;

    for (let i = 1; i <= nextDaysCount; i++) {
        days.push({
            date: new Date(year, month + 1, i),
            isCurrentMonth: false,
        });
    }

    // Ensure calendar is always 6 rows (42 days) for a consistent layout
     while (days.length < 42 && days.length > 0) {
        const lastDay = days[days.length - 1].date;
        const nextDay = new Date(lastDay);
        nextDay.setDate(lastDay.getDate() + 1);
        days.push({
            date: nextDay,
            isCurrentMonth: false,
        });
    }


    return days.slice(0, 42); // Ensure it's exactly 42 days
};

export const isSameDay = (date1: Date, date2: Date): boolean =>
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();

export const isToday = (date: Date): boolean => {
    const today = new Date();
    return isSameDay(date, today);
};

/**
 * Generates a schedule mapping items to future dates based on selected weekdays, avoiding existing dates.
 * @param items - An array of items to be scheduled.
 * @param weekdays - An array of numbers representing the day of the week (0=Sun, 1=Mon, ..., 6=Sat).
 * @param existingDates - A Set of date strings ('YYYY-MM-DD') that are already occupied.
 * @returns A Map where keys are date strings (YYYY-MM-DD) and values are the corresponding items.
 */
export const generateSchedule = <T>(items: T[], weekdays: number[], existingDates: Set<string>): Map<string, T> => {
    const schedule = new Map<string, T>();
    if (weekdays.length === 0 || items.length === 0) {
        return schedule;
    }

    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1); // Start scheduling from tomorrow
    let itemIndex = 0;
    const MAX_SCHEDULE_DAYS = 365; // Prevent infinite loops
    let daysChecked = 0;

    while (itemIndex < items.length && daysChecked < MAX_SCHEDULE_DAYS) {
        const dateKey = formatDateToYYYYMMDD(currentDate);
        // Check if the current day is a selected weekday AND is not already taken
        if (weekdays.includes(currentDate.getDay()) && !existingDates.has(dateKey)) {
            schedule.set(dateKey, items[itemIndex]);
            itemIndex++;
        }
        // Move to the next day
        currentDate.setDate(currentDate.getDate() + 1);
        daysChecked++;
    }
    
    if (daysChecked >= MAX_SCHEDULE_DAYS) {
        console.warn("generateSchedule reached max iteration limit. Could not schedule all items.");
    }

    return schedule;
};

// --- New functions for Weekly View ---

/**
 * Gets the start of the week (Monday) for a given date.
 * @param date The date to find the week start for.
 * @returns A new Date object set to the beginning of that Monday.
 */
export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
};

/**
 * Checks if a date falls within a week starting on a specific date.
 * @param date The check.
 * @param weekStartDate The Monday the week starts on.
 * @returns True if the date is in the week, false otherwise.
 */
export const isDateInWeek = (date: Date, weekStartDate: Date): boolean => {
    const start = new Date(weekStartDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    return checkDate >= start && checkDate <= end;
};