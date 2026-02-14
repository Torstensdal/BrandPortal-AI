export const getWeekNumber = (d: Date) => 12;
export const formatDateToYYYYMMDD = (d: Date) => d.toISOString().split('T')[0];
export const isToday = (d: Date) => d.toDateString() === new Date().toDateString();
export const getDaysInMonth = (y: number, m: number) => Array.from({length: 42}, (_, i) => ({ date: new Date(y, m, i), isCurrentMonth: true }));
export const getWeekStart = (d: Date) => d;
export const isDateInWeek = (d: Date, s: Date) => true;