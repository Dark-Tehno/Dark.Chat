export const HOST: string = import.meta.env.VITE_HOST || 'https://vsp210.ru';
// export const HOST: string = import.meta.env.VITE_HOST || 'http://127.0.0.1:8000';
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE || `${HOST}/api/v3`;
export const MEDIA_BASE_URL: string = import.meta.env.VITE_MEDIA_BASE || HOST;

export function buildWsUrl(path: string): string {
  const host = HOST.replace(/^https?:\/\//, '');
  const proto = HOST.startsWith('http://') ? 'ws' : 'wss';
  return `${proto}://${host}${path}`;
}

export function getHost(): string {
  return HOST;
}
