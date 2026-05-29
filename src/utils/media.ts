import { apiService } from '../services/api';

import { MEDIA_BASE_URL } from '../config';

export function getMediaUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const token = apiService.getToken();
  const url = new URL(path, MEDIA_BASE_URL);
  if (token) url.searchParams.append('token', token);
  return url.href;
}

export const getFileNameFromUrl = (url: string): string => {
  try {
    const decodedUrl = decodeURIComponent(url);
    return decodedUrl.substring(decodedUrl.lastIndexOf('/') + 1);
  } catch (e) {
    
    return url.substring(url.lastIndexOf('/') + 1);
  }
}

export function parseTimestampWithTimezone(timestamp: string): Date {
  const trimmed = timestamp.trim();

  const hhmmDateMatch = trimmed.match(/^(\d{1,2}):(\d{2}),\s*(\d{2})\.(\d{2})\.(\d{4})$/);
  if (hhmmDateMatch) {
    const [, hour, minute, day, month, year] = hhmmDateMatch;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
    );
  }

  const sqlTimestampMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?$/);
  if (sqlTimestampMatch) {
    const [, year, month, day, hour, minute, second = '0', fraction = '0'] = sqlTimestampMatch;
    const ms = Math.floor(Number(`0.${fraction}`) * 1000);
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      ms,
    );
  }

  let parsableTimestamp = trimmed;
  if (trimmed.includes('T') && !trimmed.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(trimmed)) {
    parsableTimestamp += 'Z';
  }

  let date = new Date(parsableTimestamp);

  if (isNaN(date.getTime())) {
    const fallbackMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?$/);
    if (fallbackMatch) {
      const [, year, month, day, hour, minute, second = '0', fraction = '0'] = fallbackMatch;
      const ms = Math.floor(Number(`0.${fraction}`) * 1000);
      date = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
        ms,
      );
    }
  }

  return date;
}

export function formatTimestamp(timestamp: string): string {
  console.log(timestamp);
  const date = parseTimestampWithTimezone(timestamp);
  const now = new Date();

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const isYesterday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate() - 1;

  const timeStr = date.toLocaleTimeString(Intl.DateTimeFormat().resolvedOptions().locale, {
    hour: '2-digit',
    minute: '2-digit', 
    hourCycle: 'h23',  
  });

  if (isToday) {
    return timeStr;
  }

  if (isYesterday) {
    return `Yesterday ${timeStr}`;
  }

  const dateStr = date.toLocaleDateString(Intl.DateTimeFormat().resolvedOptions().locale, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });

  return `${dateStr} ${timeStr}`;
}

export function formatTimeShort(timestamp: string): string {
  const date = parseTimestampWithTimezone(timestamp);
  return date.toLocaleTimeString(
    Intl.DateTimeFormat().resolvedOptions().locale,
    { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }
  );
}

export function formatMessageTime(timestamp: string): string {
  const date = parseTimestampWithTimezone(timestamp);
  const now = new Date();

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return date.toLocaleTimeString(
      Intl.DateTimeFormat().resolvedOptions().locale,
      { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }
    );
  }

  return date.toLocaleDateString(Intl.DateTimeFormat().resolvedOptions().locale, {
    month: 'short',
    day: 'numeric',
  });
}
