'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Step = 1 | 2 | 3 | 4;

interface ClientData {
  phone: string;
  fullName: string;
  carNumber: string;
  address: string;
}

interface TireData {
  brand: string;
  model: string;
  size: string;
  season: 'summer' | 'winter' | 'all_season';
  quantity: number;
  dotCodes: string[];
  photos: File[];
  description: string;
}

export default function CreateOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  const [client, setClient] = useState<ClientData>({
    phone: '',
    fullName: '',
    carNumber: '',
    address: '',
  });

  const [tires, setTires] = useState<TireData[]>([{
    brand: '',
    model: '',
    size: '',
    season: 'summer',
    quantity: 4,
    dotCodes: ['', '', '', ''],
    photos: [],
    description: '',
  }]);

  const [services, setServices] = useState<any[]>([]);
  const [storagePeriod, setStoragePeriod] = useState(6);
  const [warehouse, setWarehouse] = useState('Склад 1');
  const [cell, setCell] = useState('');

  const handleAddTireSet = () => {
    setTires([...tires, {
      brand: '',
      model: '',
      size: '',
      season: 'summer',
      quantity: 4,
      dotCodes: ['', '', '', ''],
      photos: [],
      description: '',
    }]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Рассчитать стоимость
      const basePrice = 2000; // за комплект в месяц
      const totalCost = tires.length * basePrice * storagePeriod;

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientPhone: client.phone,
          clientName: client.fullName,
          clientCarNumber: client.carNumber,
          clientAddress: client.address,
          tires: tires.map(tire => ({
            brand: tire.brand,
            model: tire.model,
            size: tire.size,
            season: tire.season,
            quantity: tire.quantity,
            dotCodes: tire.dotCodes.filter(c => c),
            description: tire.description,
            pricePerUnit: basePrice,
          })),
          services,
          storagePeriod,
          warehouse,
          cell: cell || 'A-1',
          totalCost,
          debt: 0,
        }),
      });

      if (response.ok) {
        const { order } = await response.json();
        router.push(`/dashboard/orders/${order.id}`);
      } else {
        alert('Ошибка создания заказа');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Ошибка создания заказа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Создание заказа</h1>

      {/* Прогресс */}
      <div className="mb-8 flex items-center">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              {s}
            </div>
            {s < 4 && <div className={`flex-1 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        {/* Шаг 1: Клиент */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Информация о клиенте</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1">Телефон *</label>
              <input
                type="tel"
                value={client.phone}
                onChange={(e) => setClient({ ...client, phone: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="+7 900 123-45-67"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">ФИО *</label>
              <input
                type="text"
                value={client.fullName}
                onChange={(e) => setClient({ ...client, fullName: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="Иванов Иван Иванович"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Номер авто</label>
              <input
                type="text"
                value={client.carNumber}
                onChange={(e) => setClient({ ...client, carNumber: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="А123БВ777"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Адрес</label>
              <textarea
                value={client.address}
                onChange={(e) => setClient({ ...client, address: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows={2}
                placeholder="Москва, ул. Ленина, д. 1"
              />
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!client.phone || !client.fullName}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Далее →
            </button>
          </div>
        )}

        {/* Шаг 2: Шины */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Информация о шинах</h2>

            {tires.map((tire, idx) => (
              <div key={idx} className="border p-4 rounded space-y-3">
                <h3 className="font-semibold">Комплект {idx + 1}</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Бренд</label>
                    <input
                      type="text"
                      value={tire.brand}
                      onChange={(e) => {
                        const newTires = [...tires];
                        newTires[idx].brand = e.target.value;
                        setTires(newTires);
                      }}
                      className="w-full border rounded px-3 py-2"
                      placeholder="Michelin"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Модель</label>
                    <input
                      type="text"
                      value={tire.model}
                      onChange={(e) => {
                        const newTires = [...tires];
                        newTires[idx].model = e.target.value;
                        setTires(newTires);
                      }}
                      className="w-full border rounded px-3 py-2"
                      placeholder="Pilot Sport 4"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Размер</label>
                    <input
                      type="text"
                      value={tire.size}
                      onChange={(e) => {
                        const newTires = [...tires];
                        newTires[idx].size = e.target.value;
                        setTires(newTires);
                      }}
                      className="w-full border rounded px-3 py-2"
                      placeholder="225/45 R17"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Сезон</label>
                    <select
                      value={tire.season}
                      onChange={(e) => {
                        const newTires = [...tires];
                        newTires[idx].season = e.target.value as any;
                        setTires(newTires);
                      }}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="summer">Лето</option>
                      <option value="winter">Зима</option>
                      <option value="all_season">Всесезон</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">DOT-коды</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 1, 2, 3].map((i) => (
                      <input
                        key={i}
                        type="text"
                        value={tire.dotCodes[i]}
                        onChange={(e) => {
                          const newTires = [...tires];
                          newTires[idx].dotCodes[i] = e.target.value;
                          setTires(newTires);
                        }}
                        className="w-full border rounded px-3 py-2"
                        placeholder={`DOT ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={handleAddTireSet}
              className="w-full border-2 border-dashed border-gray-300 py-2 rounded hover:border-blue-500 hover:text-blue-500"
            >
              + Добавить комплект
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border py-2 rounded hover:bg-gray-50"
              >
                ← Назад
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Далее →
              </button>
            </div>
          </div>
        )}

        {/* Шаг 3: Хранение */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Условия хранения</h2>

            <div>
              <label className="block text-sm font-medium mb-1">Срок хранения (месяцев)</label>
              <select
                value={storagePeriod}
                onChange={(e) => setStoragePeriod(parseInt(e.target.value))}
                className="w-full border rounded px-3 py-2"
              >
                <option value="3">3 месяца</option>
                <option value="6">6 месяцев</option>
                <option value="9">9 месяцев</option>
                <option value="12">12 месяцев</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Склад</label>
              <select
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="Склад 1">Склад 1</option>
                <option value="Склад 2">Склад 2</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Ячейка</label>
              <input
                type="text"
                value={cell}
                onChange={(e) => setCell(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="A-1"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">Стоимость хранения:</div>
              <div className="text-2xl font-bold">
                {(tires.length * 2000 * storagePeriod).toLocaleString('ru-RU')} ₽
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {tires.length} комплект(а) × 2000 ₽/мес × {storagePeriod} мес
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border py-2 rounded hover:bg-gray-50"
              >
                ← Назад
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Далее →
              </button>
            </div>
          </div>
        )}

        {/* Шаг 4: Подтверждение */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Подтверждение заказа</h2>

            <div className="space-y-3">
              <div className="border-b pb-2">
                <div className="text-sm text-gray-600">Клиент</div>
                <div className="font-semibold">{client.fullName}</div>
                <div className="text-sm">{client.phone}</div>
              </div>

              <div className="border-b pb-2">
                <div className="text-sm text-gray-600">Шины</div>
                {tires.map((tire, idx) => (
                  <div key={idx} className="text-sm">
                    Комплект {idx + 1}: {tire.brand} {tire.model} {tire.size}
                  </div>
                ))}
              </div>

              <div className="border-b pb-2">
                <div className="text-sm text-gray-600">Хранение</div>
                <div className="text-sm">
                  {storagePeriod} месяцев, {warehouse}, ячейка {cell || 'A-1'}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded">
                <div className="text-sm text-gray-600">Итого к оплате:</div>
                <div className="text-3xl font-bold text-blue-600">
                  {(tires.length * 2000 * storagePeriod).toLocaleString('ru-RU')} ₽
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex-1 border py-2 rounded hover:bg-gray-50"
                disabled={loading}
              >
                ← Назад
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Создание...' : '✓ Создать заказ'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
