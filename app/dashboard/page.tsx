import { prisma } from '@/lib/prisma';
import Link from 'next/link';

async function getDashboardData() {
  try {
    const [
      totalOrders,
      activeOrders,
      completedOrders,
      totalClients,
      totalRevenue,
      totalDebt,
      expiringOrders,
      recentOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'active' } }),
      prisma.order.count({ where: { status: 'completed' } }),
      prisma.user.count({ where: { role: 'client' } }),
      prisma.order.aggregate({
        _sum: { totalCost: true },
        where: { status: { in: ['active', 'completed'] } },
      }),
      prisma.order.aggregate({
        _sum: { debt: true },
        where: { status: 'active', debt: { gt: 0 } },
      }),
      prisma.order.findMany({
        where: {
          status: 'active',
          reminderDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          client: {
            select: {
              fullName: true,
              phone: true,
            },
          },
        },
        orderBy: { endDate: 'asc' },
        take: 10,
      }),
      prisma.order.findMany({
        include: {
          client: {
            select: {
              fullName: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      totalOrders,
      activeOrders,
      completedOrders,
      totalClients,
      totalRevenue: totalRevenue._sum.totalCost || 0,
      totalDebt: totalDebt._sum.debt || 0,
      expiringOrders,
      recentOrders,
    };
  } catch (error) {
    console.error('Dashboard error:', error);
    return {
      totalOrders: 0,
      activeOrders: 0,
      completedOrders: 0,
      totalClients: 0,
      totalRevenue: 0,
      totalDebt: 0,
      expiringOrders: [],
      recentOrders: [],
    };
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link
          href="/dashboard/orders/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Новый заказ
        </Link>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Всего заказов</div>
          <div className="text-3xl font-bold mt-2">{data.totalOrders}</div>
          <div className="text-sm text-green-600 mt-1">
            {data.activeOrders} активных
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Клиентов</div>
          <div className="text-3xl font-bold mt-2">{data.totalClients}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Выручка</div>
          <div className="text-3xl font-bold mt-2">
            {data.totalRevenue.toLocaleString('ru-RU')} ₽
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Долги</div>
          <div className="text-3xl font-bold mt-2 text-red-600">
            {data.totalDebt.toLocaleString('ru-RU')} ₽
          </div>
        </div>
      </div>

      {/* Истекающие заказы */}
      {data.expiringOrders.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">
            ⚠️ Истекают в ближайшие 30 дней ({data.expiringOrders.length})
          </h2>
          <div className="space-y-3">
            {data.expiringOrders.map((order) => (
              <div
                key={order.id}
                className="flex justify-between items-center p-3 border rounded hover:bg-gray-50"
              >
                <div>
                  <div className="font-semibold">{order.orderNumber}</div>
                  <div className="text-sm text-gray-600">
                    {order.client.fullName} - {order.client.phone}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-red-600">
                    до {new Date(order.endDate).toLocaleDateString('ru-RU')}
                  </div>
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Продлить →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Последние заказы */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Последние заказы</h2>
          <Link href="/dashboard/orders" className="text-blue-600 hover:underline">
            Все заказы →
          </Link>
        </div>
        <div className="space-y-3">
          {data.recentOrders.map((order) => (
            <div
              key={order.id}
              className="flex justify-between items-center p-3 border rounded hover:bg-gray-50"
            >
              <div>
                <div className="font-semibold">{order.orderNumber}</div>
                <div className="text-sm text-gray-600">
                  {order.client.fullName} - {order.client.phone}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm">
                  {order.totalCost.toLocaleString('ru-RU')} ₽
                </div>
                <div className={`text-xs ${
                  order.status === 'active' ? 'text-green-600' :
                  order.status === 'completed' ? 'text-gray-600' :
                  'text-red-600'
                }`}>
                  {order.status === 'active' ? 'Активен' :
                   order.status === 'completed' ? 'Завершен' :
                   order.status === 'overdue' ? 'Просрочен' : order.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
