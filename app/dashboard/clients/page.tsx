'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Client {
  id: string;
  fullName: string;
  phone: string;
  carNumber: string;
  createdAt: string;
  _count: {
    orders: number;
    tires: number;
  };
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async (searchQuery?: string) => {
    try {
      const url = searchQuery 
        ? `/api/clients?search=${encodeURIComponent(searchQuery)}`
        : '/api/clients';
      const res = await fetch(url);
      const data = await res.json();
      setClients(data.clients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClients(search);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Клиенты</h1>
        <Link
          href="/dashboard/orders/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Новый заказ
        </Link>
      </div>

      {/* Поиск */}
      <div className="bg-white p-4 rounded-lg shadow">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени, телефону или номеру авто..."
            className="flex-1 border rounded px-4 py-2"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Найти
          </button>
        </form>
      </div>

      {/* Таблица клиентов */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Клиент
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Телефон
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Авто
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Заказов
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Комплектов
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Дата регистрации
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium">{client.fullName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {client.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {client.carNumber || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {client._count.orders}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {client._count.tires}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(client.createdAt).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link
                    href={`/dashboard/clients/${client.id}`}
                    className="text-blue-600 hover:underline mr-3"
                  >
                    Открыть
                  </Link>
                  <Link
                    href={`/dashboard/orders?clientId=${client.id}`}
                    className="text-gray-600 hover:underline"
                  >
                    Заказы
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {clients.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Клиенты не найдены
          </div>
        )}
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Всего клиентов</div>
          <div className="text-2xl font-bold">{clients.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Всего заказов</div>
          <div className="text-2xl font-bold">
            {clients.reduce((sum, c) => sum + c._count.orders, 0)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Всего комплектов</div>
          <div className="text-2xl font-bold">
            {clients.reduce((sum, c) => sum + c._count.tires, 0)}
          </div>
        </div>
      </div>
    </div>
  );
}
