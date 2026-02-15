export const formatDate = (d: Date) => d.toISOString().split('T')[0];
export const isToday = (d: Date) => formatDate(d) === formatDate(new Date());