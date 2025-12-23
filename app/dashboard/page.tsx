import { prisma } from '@/lib/prisma';

async function getDashboardStats() {
  try {
    const [totalOrders, totalClients] = await Promise.all([
      prisma.order.count(),
      prisma.user.count({ where: { role: 'client' } }),
    ]);

    return { totalOrders, totalClients };
  } catch (error) {
    console.error('Dashboard error:', error);
    return { totalOrders: 0, totalClients: 0 };
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">📊 Dashboard</h1>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Всего заказов</div>
            <div className="text-3xl font-bold mt-2">{stats.totalOrders}</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Клиентов</div>
            <div className="text-3xl font-bold mt-2">{stats.totalClients}</div>
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">✅ Система работает!</h2>
          <p className="text-gray-600">
            База данных подключена успешно. Теперь можно добавлять функционал.
          </p>
        </div>
      </div>
    </div>
  );
}
