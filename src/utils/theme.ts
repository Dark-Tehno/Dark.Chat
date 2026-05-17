export type ButtonVariant = 'flat' | 'glow' | 'outline';
export type MessageStyle = 'rounded' | 'bubble' | 'glass';
export type ThemeMode = 'dark' | 'light' | 'auto';
export type AnimationMode = 'none' | 'soft' | 'full';

export interface ThemeSettings {
  backgroundColor: string;
  surfaceColor: string;
  surfaceStrongColor: string;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  buttonTextColor: string;
  buttonRadius: string;
  buttonVariant: ButtonVariant;
  fontFamily: string;
  fontSizeScale: number;
  messageStyle: MessageStyle;
  messageRadius: string;
  themeMode: ThemeMode;
  animations: AnimationMode;
}

export const defaultThemeSettings: ThemeSettings = {
  backgroundColor: '#020617',
  surfaceColor: '#0f172a',
  surfaceStrongColor: '#111827',
  primaryColor: '#22c55e',
  accentColor: '#60a5fa',
  textColor: '#e5e7eb',
  mutedColor: '#94a3b8',
  borderColor: '#1f2937',
  buttonTextColor: '#ffffff',
  buttonRadius: '14px',
  buttonVariant: 'glow',
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  fontSizeScale: 1,
  messageStyle: 'bubble',
  messageRadius: '20px',
  themeMode: 'dark',
  animations: 'soft',
};

const STORAGE_KEY = 'dark_chat_theme_settings';

export const loadThemeSettings = (): ThemeSettings => {
  if (typeof window === 'undefined') {
    return defaultThemeSettings;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultThemeSettings;
    const parsed = JSON.parse(stored) as Partial<ThemeSettings>;
    return { ...defaultThemeSettings, ...parsed };
  } catch (error) {
    console.error('Failed to load theme settings from localStorage', error);
    return defaultThemeSettings;
  }
};

export const saveThemeSettings = (settings: ThemeSettings) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save theme settings to localStorage', error);
  }
};

function getActiveThemeMode(themeMode: ThemeMode): ThemeMode {
  if (themeMode !== 'auto') {
    return themeMode;
  }

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'dark';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const applyThemeSettings = (settings: ThemeSettings) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const activeMode = getActiveThemeMode(settings.themeMode);

  root.setAttribute('data-theme-mode', activeMode);
  root.style.setProperty('--bg-color', settings.backgroundColor);
  root.style.setProperty('--surface-color', settings.surfaceColor);
  root.style.setProperty('--surface-strong-color', settings.surfaceStrongColor);
  root.style.setProperty('--primary-color', settings.primaryColor);
  root.style.setProperty('--accent-color', settings.accentColor);
  root.style.setProperty('--text-color', settings.textColor);
  root.style.setProperty('--muted-color', settings.mutedColor);
  root.style.setProperty('--border-color', settings.borderColor);
  root.style.setProperty('--button-text-color', settings.buttonTextColor);
  root.style.setProperty('--button-radius', settings.buttonRadius);
  root.style.setProperty('--font-family', settings.fontFamily);
  root.style.setProperty('--font-size-scale', settings.fontSizeScale.toString());
  root.style.setProperty('--message-radius', settings.messageRadius);
  root.style.setProperty('--message-style', settings.messageStyle);
  root.style.setProperty('--animation-mode', settings.animations);

  switch (settings.buttonVariant) {
    case 'flat':
      root.style.setProperty('--button-shadow', 'none');
      root.style.setProperty('--button-border-style', 'transparent');
      break;
    case 'outline':
      root.style.setProperty('--button-shadow', 'none');
      root.style.setProperty('--button-border-style', '1px solid var(--primary-color)');
      break;
    default:
      root.style.setProperty('--button-shadow', `0 0 18px ${settings.primaryColor}33`);
      root.style.setProperty('--button-border-style', 'transparent');
  }

  switch (settings.animations) {
    case 'none':
      root.style.setProperty('--transition-duration', '0ms');
      root.style.setProperty('--transition-ease', 'linear');
      break;
    case 'full':
      root.style.setProperty('--transition-duration', '280ms');
      root.style.setProperty('--transition-ease', 'cubic-bezier(0.25, 0.46, 0.45, 0.94)');
      break;
    default:
      root.style.setProperty('--transition-duration', '140ms');
      root.style.setProperty('--transition-ease', 'ease-out');
  }
};
