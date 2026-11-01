export interface StandardTimeParts {
  hour: number;
  minute: number;
  period: 'AM' | 'PM';
}

export function parseStandardTime(value: string): StandardTimeParts | null {
  const trimmed = value.trim();
  const twelveHour = trimmed.match(/^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i);
  if (twelveHour) {
    const hour = Number(twelveHour[1]);
    if (hour < 1 || hour > 12) return null;
    return {
      hour,
      minute: Number(twelveHour[2]),
      period: twelveHour[3].toUpperCase() as 'AM' | 'PM',
    };
  }

  const twentyFourHour = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!twentyFourHour) return null;
  const hour = Number(twentyFourHour[1]);
  return {
    hour: hour % 12 || 12,
    minute: Number(twentyFourHour[2]),
    period: hour >= 12 ? 'PM' : 'AM',
  };
}

export function formatStandardTime(value: string, format: '12-hour' | '24-hour' = '12-hour'): string {
  const parts = parseStandardTime(value);
  if (!parts) return value;
  return format === '24-hour' ? toTwentyFourHourTime(parts) : toStandardTime(parts);
}

export function toStandardTime(parts: StandardTimeParts): string {
  return `${parts.hour}:${String(parts.minute).padStart(2, '0')} ${parts.period}`;
}

export function toTwentyFourHourTime(parts: StandardTimeParts): string {
  const hour = (parts.hour % 12) + (parts.period === 'PM' ? 12 : 0);
  return `${String(hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
}
