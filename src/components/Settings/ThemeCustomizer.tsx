import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { X, RefreshCcw, UploadCloud, DownloadCloud } from 'lucide-react';
import { ThemeSettings, defaultThemeSettings } from '../../utils/theme';

const APK_URL = 'https://vsp210.ru/static/files/Dark-Chat.apk';

const presets: Array<{ name: string; theme: ThemeSettings }> = [
  {
    name: 'Neon Night',
    theme: {
      backgroundColor: '#020617',
      surfaceColor: '#0f172a',
      surfaceStrongColor: '#111827',
      primaryColor: '#22c55e',
      accentColor: '#7c3aed',
      textColor: '#e5e7eb',
      mutedColor: '#94a3b8',
      borderColor: '#1f2937',
      buttonTextColor: '#ffffff',
      buttonRadius: '16px',
      buttonVariant: 'glow',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      fontSizeScale: 1,
      messageStyle: 'bubble',
      messageRadius: '20px',
      themeMode: 'dark',
      animations: 'soft',
    },
  },
  {
    name: 'Deep Ocean',
    theme: {
      backgroundColor: '#020f2f',
      surfaceColor: '#0b193f',
      surfaceStrongColor: '#11213e',
      primaryColor: '#38bdf8',
      accentColor: '#38bdf8',
      textColor: '#e2e8f0',
      mutedColor: '#94a3b8',
      borderColor: '#1e293b',
      buttonTextColor: '#ffffff',
      buttonRadius: '12px',
      buttonVariant: 'flat',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      fontSizeScale: 1,
      messageStyle: 'bubble',
      messageRadius: '20px',
      themeMode: 'dark',
      animations: 'soft',
    },
  },
  {
    name: 'Warm Ember',
    theme: {
      backgroundColor: '#21130d',
      surfaceColor: '#2f1c12',
      surfaceStrongColor: '#3b261c',
      primaryColor: '#f59e0b',
      accentColor: '#f97316',
      textColor: '#f8fafc',
      mutedColor: '#cbd5e1',
      borderColor: '#43342a',
      buttonTextColor: '#111827',
      buttonRadius: '20px',
      buttonVariant: 'outline',
      fontFamily: 'ui-serif, Georgia, serif',
      fontSizeScale: 1,
      messageStyle: 'rounded',
      messageRadius: '20px',
      themeMode: 'dark',
      animations: 'soft',
    },
  },
];

interface ThemeCustomizerProps {
  theme: ThemeSettings;
  onClose: () => void;
  onSaveTheme: (theme: ThemeSettings) => void;
}

export function ThemeCustomizer({ theme, onClose, onSaveTheme }: ThemeCustomizerProps) {
  const [draft, setDraft] = useState<ThemeSettings>(theme);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewStyle = useMemo(
    () => ({
      backgroundColor: draft.surfaceStrongColor,
      color: draft.textColor,
      borderColor: draft.borderColor,
      borderRadius: draft.buttonRadius,
      boxShadow: draft.buttonVariant === 'glow' ? '0 0 20px rgba(34,197,94,0.2)' : 'none',
    }),
    [draft]
  );

  const updateField = (field: keyof ThemeSettings, value: string | number) => {
    setDraft((current) => ({ ...current, [field]: value } as ThemeSettings));
  };

  const selectPreset = (themeConfig: ThemeSettings) => {
    setDraft(themeConfig);
  };

  const resetTheme = () => {
    setDraft(defaultThemeSettings);
  };

  const handleExportTheme = () => {
    const json = JSON.stringify(draft, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dark-chat-theme.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<ThemeSettings>;
      setDraft({ ...defaultThemeSettings, ...parsed });
      setImportError(null);
    } catch (error) {
      setImportError('Неверный формат файла темы.');
    } finally {
      event.target.value = '';
    }
  };

  const handleOpenImport = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-auto">
      <div className="w-full max-w-4xl max-h-[calc(100vh-3rem)] rounded-3xl border border-[color:var(--border-color)] bg-[color:var(--surface-color)] shadow-2xl overflow-auto">
        <div className="flex flex-col gap-4 p-6 border-b border-[color:var(--border-color)] bg-[color:var(--surface-strong-color)] md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[color:var(--text-color)]">Настройки темы</h2>
            <p className="mt-1 text-sm text-[color:var(--muted-color)]">Цвета, шрифты и стили сообщений сохраняются локально.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={handleExportTheme} className="btn-secondary px-4 py-2 text-sm">
              <DownloadCloud className="inline-block mr-2" size={16} />Экспорт
            </button>
            <button onClick={handleOpenImport} className="btn-secondary px-4 py-2 text-sm">
              <UploadCloud className="inline-block mr-2" size={16} />Импорт
            </button>
            <button onClick={resetTheme} className="btn-secondary px-4 py-2 text-sm">
              <RefreshCcw className="inline-block mr-2" size={16} />Сбросить
            </button>
            <button onClick={onClose} className="p-3 rounded-full hover:bg-white/10 transition-colors text-[color:var(--text-color)]">
              <X size={20} />
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
        </div>
        {importError ? <div className="px-6 text-sm text-rose-400">{importError}</div> : null}

        <div className="grid gap-6 p-6 md:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-[color:var(--text-color)]">Палитра</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {presets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => selectPreset(preset.theme)}
                    className="rounded-2xl border border-[color:var(--border-color)] p-4 text-left transition-colors hover:bg-white/10"
                  >
                    <p className="font-semibold text-[color:var(--text-color)]">{preset.name}</p>
                    <div className="mt-2 flex gap-2">
                      <span className="h-6 flex-1 rounded-full" style={{ backgroundColor: preset.theme.backgroundColor }} />
                      <span className="h-6 flex-1 rounded-full" style={{ backgroundColor: preset.theme.primaryColor }} />
                      <span className="h-6 flex-1 rounded-full" style={{ backgroundColor: preset.theme.accentColor }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-[color:var(--text-color)]">Фоновый цвет</span>
                <input
                  type="color"
                  value={draft.backgroundColor}
                  onChange={(event) => updateField('backgroundColor', event.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-[color:var(--border-color)] bg-[color:var(--surface-color)] p-2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[color:var(--text-color)]">Основной цвет</span>
                <input
                  type="color"
                  value={draft.primaryColor}
                  onChange={(event) => updateField('primaryColor', event.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-[color:var(--border-color)] bg-[color:var(--surface-color)] p-2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[color:var(--text-color)]">Акцентный цвет</span>
                <input
                  type="color"
                  value={draft.accentColor}
                  onChange={(event) => updateField('accentColor', event.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-[color:var(--border-color)] bg-[color:var(--surface-color)] p-2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[color:var(--text-color)]">Цвет текста</span>
                <input
                  type="color"
                  value={draft.textColor}
                  onChange={(event) => updateField('textColor', event.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-[color:var(--border-color)] bg-[color:var(--surface-color)] p-2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[color:var(--text-color)]">Цвет поверхностей</span>
                <input
                  type="color"
                  value={draft.surfaceColor}
                  onChange={(event) => updateField('surfaceColor', event.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-[color:var(--border-color)] bg-[color:var(--surface-color)] p-2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[color:var(--text-color)]">Цвет сильной поверхности</span>
                <input
                  type="color"
                  value={draft.surfaceStrongColor}
                  onChange={(event) => updateField('surfaceStrongColor', event.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-[color:var(--border-color)] bg-[color:var(--surface-color)] p-2"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-[color:var(--text-color)]">Цвет бордера</span>
                <input
                  type="color"
                  value={draft.borderColor}
                  onChange={(event) => updateField('borderColor', event.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-[color:var(--border-color)] bg-[color:var(--surface-color)] p-2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[color:var(--text-color)]">Цвет текста кнопок</span>
                <input
                  type="color"
                  value={draft.buttonTextColor}
                  onChange={(event) => updateField('buttonTextColor', event.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-[color:var(--border-color)] bg-[color:var(--surface-color)] p-2"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-[color:var(--text-color)]">Форма кнопки</span>
                <select
                  value={draft.buttonRadius}
                  onChange={(event) => updateField('buttonRadius', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[color:var(--border-color)] bg-[color:var(--surface-color)] p-3 text-[color:var(--text-color)]"
                >
                  <option value="6px">Мягкая</option>
                  <option value="12px">Средняя</option>
                  <option value="20px">Крупная</option>
                  <option value="999px">Пилюлька</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[color:var(--text-color)]">Стиль кнопки</span>
                <select
                  value={draft.buttonVariant}
                  onChange={(event) => updateField('buttonVariant', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[color:var(--border-color)] bg-[color:var(--surface-color)] p-3 text-[color:var(--text-color)]"
                >
                  <option value="flat">Плоская</option>
                  <option value="glow">Неоновая</option>
                  <option value="outline">Контур</option>
                </select>
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-[color:var(--text-color)]">Семейство шрифтов</span>
                <select
                  value={draft.fontFamily}
                  onChange={(event) => updateField('fontFamily', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[color:var(--border-color)] bg-[color:var(--surface-color)] p-3 text-[color:var(--text-color)]"
                >
                  <option value="ui-sans-serif, system-ui, sans-serif">Система</option>
                  <option value="ui-serif, Georgia, serif">Сериф</option>
                  <option value="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace">Моно</option>
                  <option value="'Monocraft', ui-sans-serif, system-ui, sans-serif">Monocraft</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[color:var(--text-color)]">Размер шрифта</span>
                <input
                  type="range"
                  min="0.8"
                  max="1.25"
                  step="0.05"
                  value={draft.fontSizeScale}
                  onChange={(event) => updateField('fontSizeScale', Number(event.target.value))}
                  className="mt-2 w-full accent-[color:var(--primary-color)]"
                />
                <div className="mt-2 text-xs text-[color:var(--muted-color)]">Масштаб: {draft.fontSizeScale.toFixed(2)}x</div>
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-[color:var(--text-color)]">Стиль сообщений</span>
                <select
                  value={draft.messageStyle}
                  onChange={(event) => updateField('messageStyle', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[color:var(--border-color)] bg-[color:var(--surface-color)] p-3 text-[color:var(--text-color)]"
                >
                  <option value="rounded">Округлённый</option>
                  <option value="bubble">Пузырь</option>
                  <option value="glass">Стекло</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[color:var(--text-color)]">Радиус сообщений</span>
                <select
                  value={draft.messageRadius}
                  onChange={(event) => updateField('messageRadius', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[color:var(--border-color)] bg-[color:var(--surface-color)] p-3 text-[color:var(--text-color)]"
                >
                  <option value="8px">Мягкий</option>
                  <option value="16px">Средний</option>
                  <option value="28px">Максимальный</option>
                </select>
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-[color:var(--text-color)]">Тема</span>
                <select
                  value={draft.themeMode}
                  onChange={(event) => updateField('themeMode', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[color:var(--border-color)] bg-[color:var(--surface-color)] p-3 text-[color:var(--text-color)]"
                >
                  <option value="dark">Тёмная</option>
                  <option value="light">Светлая</option>
                  <option value="auto">Авто</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[color:var(--text-color)]">Анимации</span>
                <select
                  value={draft.animations}
                  onChange={(event) => updateField('animations', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[color:var(--border-color)] bg-[color:var(--surface-color)] p-3 text-[color:var(--text-color)]"
                >
                  <option value="full">Полные</option>
                  <option value="soft">Мягкие</option>
                  <option value="none">Отключены</option>
                </select>
              </label>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-[color:var(--border-color)] p-6" style={{ backgroundColor: draft.backgroundColor }}>
              <h3 className="text-lg font-semibold text-[color:var(--text-color)]">Превью темы</h3>
              <p className="mt-2 text-sm text-[color:var(--muted-color)]">Визуальное оформление этого чата будет использовать ваши цвета.</p>
              <div className="mt-6 flex flex-col gap-4">
                <div className={`message-bubble ${draft.messageStyle} p-4`} style={previewStyle}>
                  <div className="text-[color:var(--text-color)]">Заголовок сообщения</div>
                  <p className="mt-2 text-sm text-[color:var(--muted-color)]">Фоновый стиль сообщений.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button type="button" className="btn-primary px-5 py-3">
                    Основная кнопка
                  </button>
                  <button type="button" className="btn-secondary px-5 py-3">
                    Вторичная кнопка
                  </button>
                </div>
                <div className="rounded-2xl border border-[color:var(--border-color)] p-4 bg-[color:var(--surface-color)] text-[color:var(--text-color)]">
                  <p className="text-sm">Пользовательский текст и карточный стиль.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[color:var(--border-color)] bg-[color:var(--surface-strong-color)] p-4">
          {typeof window !== 'undefined' && (window.location.hostname.includes('vsp210.ru') || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
            <button
              onClick={() => window.open(APK_URL, '_blank', 'noopener')}
              className="btn-secondary px-6 py-3 flex items-center gap-2"
              title="Установить приложение"
            >
              <DownloadCloud size={16} />Установить приложение
            </button>
          )}
          <button
            onClick={() => onSaveTheme(draft)}
            className="btn-primary px-6 py-3"
          >
            Сохранить
          </button>
          <button
            onClick={onClose}
            className="btn-secondary px-6 py-3"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
