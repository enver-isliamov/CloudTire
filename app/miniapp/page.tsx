'use client';

import { useEffect, useState } from 'react';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  endDate: string;
  warehouse: string;
  cell: string;
  orderTires: {
    tire: {
      brand: string;
      model: string;
      size: string;
      season: string;
      photos: { url: string }[];
      dotCodes: { dotCode: string }[];
    };
  }[];
}

export default function MiniAppPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      // Проверяем что открыто из Telegram
      const tg = (window as any).Telegram?.WebApp;
      
      if (!tg) {
        setError('Откройте через Telegram бота');
        setLoading(false);
        return;
      }

      tg.ready();
      tg.expand();
      tg.setHeaderColor('#2563eb');
      tg.setBackgroundColor('#f9fafb');

      const initData = tg.initData;
      
      if (!initData) {
        setError('Ошибка авторизации');
        setLoading(false);
        return;
      }

      // Авторизация
      const authRes = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      });

      if (!authRes.ok) {
        setError('Ошибка авторизации');
        setLoading(false);
        return;
      }

      const authData = await authRes.json();
      setUser(authData.user);

      // Загрузка заказов
      const ordersRes = await fetch('/api/orders/my');
      const ordersData = await ordersRes.json();
      setOrders(ordersData.orders || []);
      
      setLoading(false);
    } catch (err) {
      console.error('Init error:', err);
      setError('Ошибка загрузки данных');
      setLoading(false);
    }
  };

  const getSeasonEmoji = (season: string) => {
    switch (season) {
      case 'summer': return '☀️';
      case 'winter': return '❄️';
      case 'all_season': return '🌤️';
      default: return '🚗';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return { text: 'Активен', color: 'text-green-600', bg: 'bg-green-50' };
      case 'expiring': return { text: 'Истекает', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      case 'overdue': return { text: 'Просрочен', color: 'text-red-600', bg: 'bg-red-50' };
      default: return { text: 'Завершен', color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  const handleExtend = (orderId: string) => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.showAlert('Функция продления в разработке. Свяжитесь с менеджером.');
  };

  const handlePickup = (orderId: string) => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.showAlert('Заявка на выдачу принята. Менеджер свяжется с вами.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-red-600 font-medium">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6">
        <div className="text-sm opacity-90">Добро пожаловать</div>
        <div className="text-2xl font-bold">{user?.fullName}</div>
      </div>

      <div className="p-4 space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">📦</div>
            <div className="text-gray-600 font-medium mb-2">
              У вас пока нет активных заказов
            </div>
            <div className="text-sm text-gray-500">
              Обратитесь в шиномонтаж для оформления хранения
            </div>
          </div>
        ) : (
          orders.map((order) => {
            const status = getStatusText(order.status);
            const daysLeft = Math.ceil(
              (new Date(order.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div key={order.id} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Заголовок заказа */}
                <div className="p-4 border-b">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-lg">№ {order.orderNumber}</div>
                      <div className="text-sm text-gray-600">
                        {order.warehouse}, ячейка {order.cell}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                      {status.text}
                    </div>
                  </div>
                  
                  {order.status === 'active' && daysLeft > 0 && (
                    <div className="text-sm">
                      <span className="text-gray-600">Хранение до:</span>{' '}
                      <span className="font-medium">
                        {new Date(order.endDate).toLocaleDateString('ru-RU')}
                      </span>
                      <span className="text-gray-500 ml-2">
                        (осталось {daysLeft} дн.)
                      </span>
                    </div>
                  )}
                </div>

                {/* Шины */}
                <div className="p-4 space-y-3">
                  {order.orderTires.map((ot, idx) => (
                    <div key={idx} className="flex gap-3">
                      {ot.tire.photos[0] && (
                        <img
                          src={ot.tire.photos[0].url}
                          alt="Шина"
                          className="w-20 h-20 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">
                          {getSeasonEmoji(ot.tire.season)} {ot.tire.brand} {ot.tire.model}
                        </div>
                        <div className="text-sm text-gray-600">{ot.tire.size}</div>
                        {ot.tire.dotCodes.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            DOT: {ot.tire.dotCodes.map(d => d.dotCode).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Действия */}
                {order.status === 'active' && (
                  <div className="p-4 bg-gray-50 border-t flex gap-2">
                    <button
                      onClick={() => handleExtend(order.id)}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded font-medium hover:bg-blue-700"
                    >
                      Продлить
                    </button>
                    <button
                      onClick={() => handlePickup(order.id)}
                      className="flex-1 border border-gray-300 py-2 px-4 rounded font-medium hover:bg-gray-100"
                    >
                      Забрать
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-around">
        <button className="flex flex-col items-center text-gray-600">
          <span className="text-2xl mb-1">🚗</span>
          <span className="text-xs">Мои шины</span>
        </button>
        <button className="flex flex-col items-center text-gray-400">
          <span className="text-2xl mb-1">📅</span>
          <span className="text-xs">Записи</span>
        </button>
        <button className="flex flex-col items-center text-gray-400">
          <span className="text-2xl mb-1">📞</span>
          <span className="text-xs">Поддержка</span>
        </button>
      </div>
    </div>
  );
}
