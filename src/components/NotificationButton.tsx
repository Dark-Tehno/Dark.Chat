import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Bell } from 'lucide-react';


const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const NotificationButton: React.FC = () => {
  
  const [permission, setPermission] = useState<NotificationPermission>('default');

  
  useEffect(() => {
    const checkAndResubscribe = async () => {
      if ('Notification' in window) {
        const currentPermission = Notification.permission;
        setPermission(currentPermission);

        
        
        const hasResubscribed = localStorage.getItem('hasResubscribedAfterDbWipe');

        if (currentPermission === 'granted' && !hasResubscribed) {
          console.log('Разрешение уже есть, попытка автоматической повторной подписки...');
          await subscribeUserToPush();
          
          localStorage.setItem('hasResubscribedAfterDbWipe', 'true');
          console.log('Попытка повторной подписки завершена, установлен флаг в localStorage.');
        }
      }
    };
    checkAndResubscribe();
  }, []);

  const requestNotificationPermission = async () => {
    
    if (!('Notification' in window)) {
      alert('Этот браузер не поддерживает системные уведомления.');
      return;
    }

    
    if (Notification.permission === 'granted') {
      console.log('Разрешение на уведомления уже предоставлено. Проверяем подписку.');
      
      subscribeUserToPush();
      return;
    }

    
    const permissionResult = await Notification.requestPermission();
    setPermission(permissionResult);
    
    if (permissionResult === 'granted') {
      console.log('Разрешение на уведомления получено!');
      subscribeUserToPush();
    } else {
      console.log('Пользователь отклонил запрос на уведомления.');
    }
  };

  const subscribeUserToPush = async () => {
    try {
      console.log('Шаг 1: Начинаем процесс подписки...');
      const registration = await navigator.serviceWorker.ready;
      console.log('Шаг 2: Service Worker готов.', registration);
      
      
      
      
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        console.error('Ключ VAPID_PUBLIC_KEY не найден в переменных окружения. Убедитесь, что он задан в файле .env и имеет префикс VITE_');
        alert('Ошибка конфигурации: ключ для уведомлений не найден.');
        return;
      }

      console.log('Шаг 3: Запрашиваем подписку у Push Manager...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      console.log('Пользователь подписан:', subscription);

      const token = apiService.getToken();
      if (!token) {
        console.error('Не удалось отправить подписку: пользователь не авторизован (нет токена).');
        return;
      }

      
      const apiBaseUrl = import.meta.env.PROD ? 'https:/vsp210.ru' : '';

      
      console.log('Шаг 4: Отправляем подписку на сервер...');
      await fetch(`${apiBaseUrl}/api/v3/save-push-subscription/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify(subscription),
      });

      console.log('Подписка успешно отправлена на сервер.');
    } catch (error) {
      console.error('Не удалось подписать пользователя на уведомления:', error);
    }
  };

  
  if (!('Notification' in window)) {
    return null;
  }

  const getIconAppearance = () => {
    switch (permission) {
      case 'granted':
        return {
          className: 'text-green-400',
          title: 'Уведомления включены',
        };
      case 'denied':
        return {
          className: 'text-red-500',
          title: 'Уведомления заблокированы. Измените настройки в браузере.',
        };
      default:
        return {
          className: 'text-gray-400 hover:text-green-400',
          title: 'Включить уведомления',
        };
    }
  };

  const appearance = getIconAppearance();

  return (
    <button
      onClick={requestNotificationPermission}
      disabled={permission === 'denied'}
      title={appearance.title}
      className="p-2 transition-colors rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Bell className={appearance.className} size={20} />
    </button>
  );
};

export default NotificationButton;
