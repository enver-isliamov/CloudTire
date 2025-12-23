import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="text-6xl mb-4">🚗</div>
        <h1 className="text-4xl font-bold mb-2">TiCRM</h1>
        <p className="text-gray-600 mb-8">
          Система учета хранения автомобильных шин
        </p>
        
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Панель управления
          </Link>
          
          <div className="text-sm text-gray-500">
            или откройте бота в Telegram
          </div>
        </div>

        <div className="mt-8 pt-8 border-t">
          <div className="text-sm text-gray-600">
            © 2024 TiCRM. Все права защищены.
          </div>
        </div>
      </div>
    </main>
  );
}
