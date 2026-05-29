import React, { useEffect, useState } from 'react';

const APK_URL = 'https://vsp210.ru/static/files/Dark-Chat.apk';
const STORAGE_KEY = 'install_prompt_last_shown';

export const InstallPrompt: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname || '';

    // Показываем только когда сайт размещён на vsp210.ru
    if (!hostname.includes('vsp210.ru')) return;

    try {
      const last = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
      const now = Date.now();

      // Не показывать чаще, чем раз в 6 часов
      const DAY = 6 * 60 * 60 * 1000;
      if (last && now - last < DAY) return;

      // Редкость показывания: ~40% на загрузку
      const chance = 0.4;
      if (Math.random() <= chance) {
        setVisible(true);
        localStorage.setItem(STORAGE_KEY, String(now));
      }
    } catch (e) {
      // если localStorage недоступен — всё равно иногда показываем
      if (Math.random() <= 0.05) setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-xs w-full">
      <div className="bg-gray-900 border border-green-500/30 rounded-lg p-3 shadow-lg flex items-start gap-3">
        <div className="flex-1">
          <h4 className="text-green-400 font-semibold">Установите Dark.Chat</h4>
          <p className="text-sm text-gray-300">Удобное приложение — точная копия сайта. Установите APK для быстрого доступа.</p>
          <div className="mt-3 flex gap-2">
            <a href={APK_URL} className="btn-primary inline-block px-3 py-1 rounded bg-green-600 hover:bg-green-500 text-white" rel="noopener noreferrer" target="_blank">Скачать APK</a>
            <button onClick={() => setVisible(false)} className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300">Закрыть</button>
          </div>
        </div>
        <button onClick={() => setVisible(false)} title="Close" className="text-gray-400 hover:text-gray-200">✕</button>
      </div>
    </div>
  );
};

export default InstallPrompt;
