'use client';

import { useEffect, useState } from 'react';

export default function MiniAppPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function init() {
      try {
        // Проверяем что открыто из Telegram
        const initData = (window as any).Telegram?.WebApp?.initData;
        
        if (!initData) {
          setError('Откройте через Telegram бота');
          setLoading(false);
          return;
        }

        // Настраиваем Telegram WebApp
        const tg = (window as any).Telegram.WebApp;
        tg.ready();
        tg.expand();
        
        setLoading(false);
      } catch (err) {
        setError('Ошибка инициализации');
        setLoading(false);
      }
    }

    init();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">⏳</div>
          <div>Загрузка...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <div className="text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg p-6 shadow mb-4">
          <h1 className="text-2xl font-bold mb-2">🚗 Мои шины</h1>
          <p className="text-gray-600">Telegram Mini App работает!</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-600">
              У вас пока нет активных заказов
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
