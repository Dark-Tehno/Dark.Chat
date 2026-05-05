const MEDIA_BASE_URL = 'http://127.0.0.1:8000';

export function getMediaUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${MEDIA_BASE_URL}${path}`;
}

export const getFileNameFromUrl = (url: string): string => {
  try {
    const decodedUrl = decodeURIComponent(url);
    return decodedUrl.substring(decodedUrl.lastIndexOf('/') + 1);
  } catch (e) {
    
    return url.substring(url.lastIndexOf('/') + 1);
  }
}

function parseTimestampWithTimezone(timestamp: string): Date { 
  
  
  
  let parsableTimestamp = timestamp;
  if (timestamp.includes('T') && !timestamp.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(timestamp)) {
    parsableTimestamp += 'Z';
  }

  let date = new Date(parsableTimestamp);

  if (isNaN(date.getTime())) {
    
    const parts = timestamp.match(/(\d{2}):(\d{2}), (\d{2})\.(\d{2})\.(\d{4})/);
    if (parts) {
      const [, hour, minute, day, month, year] = parts;
      
      
      date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute)));
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
