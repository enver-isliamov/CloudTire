import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { analyzeTirePhoto } from '@/lib/gemini';
import { uploadPhoto } from '@/lib/storage';

// GET - список заказов
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;

    // Клиенты видят только свои заказы
    if (session.role === 'client') {
      where.clientId = session.userId;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              carNumber: true,
            },
          },
          orderTires: {
            include: {
              tire: {
                include: {
                  photos: { take: 1 },
                  dotCodes: true,
                },
              },
            },
          },
          services: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST - создание заказа
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    // Только admin и manager могут создавать заказы
    if (session.role !== 'admin' && session.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    const {
      clientPhone,
      clientName,
      clientCarNumber,
      clientAddress,
      tires,
      services,
      storagePeriod,
      warehouse,
      cell,
      totalCost,
      debt,
    } = data;

    // Найти или создать клиента
    let client = await prisma.user.findUnique({
      where: { phone: clientPhone },
    });

    if (!client) {
      client = await prisma.user.create({
        data: {
          phone: clientPhone,
          fullName: clientName,
          carNumber: clientCarNumber,
          address: clientAddress,
          role: 'client',
        },
      });
    }

    // Генерация номера заказа (YYMMDD-HHMMSS)
    const now = new Date();
    const orderNumber = `${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

    // Рассчитать даты
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + storagePeriod);
    
    const reminderDate = new Date(endDate);
    reminderDate.setDate(reminderDate.getDate() - 30);

    // Создать заказ с шинами
    const order = await prisma.order.create({
      data: {
        orderNumber,
        clientId: client.id,
        managerId: session.userId,
        storagePeriod,
        startDate,
        endDate,
        reminderDate,
        warehouse: warehouse || 'Склад 1',
        cell: cell || 'A-1',
        totalCost,
        debt: debt || 0,
        status: 'active',
        orderTires: {
          create: await Promise.all(
            tires.map(async (tireData: any) => {
              // Создать шину
              const tire = await prisma.tire.create({
                data: {
                  clientId: client.id,
                  brand: tireData.brand,
                  model: tireData.model,
                  size: tireData.size,
                  season: tireData.season,
                  description: tireData.description,
                  status: 'storage',
                  wearLevel: tireData.wearLevel,
                  storageLocation: `${warehouse}-${cell}`,
                  dotCodes: {
                    create: (tireData.dotCodes || []).map((code: string) => ({
                      dotCode: code,
                    })),
                  },
                  photos: tireData.photos
                    ? {
                        create: await Promise.all(
                          tireData.photos.map(async (photo: any) => {
                            // Загрузить фото
                            const uploaded = await uploadPhoto(
                              photo.file,
                              `tires/${client.id}/${Date.now()}.jpg`
                            );

                            // AI анализ фото
                            let aiAnalysis = null;
                            try {
                              aiAnalysis = await analyzeTirePhoto(photo.file);
                            } catch (e) {
                              console.error('AI analysis failed:', e);
                            }

                            return {
                              url: uploaded.url,
                              storageType: uploaded.storageType,
                              aiAnalysis,
                            };
                          })
                        ),
                      }
                    : undefined,
                },
              });

              return {
                tireId: tire.id,
                quantity: tireData.quantity || 1,
                pricePerUnit: tireData.pricePerUnit || 0,
              };
            })
          ),
        },
        services: services
          ? {
              create: services.map((service: any) => ({
                serviceType: service.type,
                description: service.description,
                price: service.price,
              })),
            }
          : undefined,
      },
      include: {
        client: true,
        orderTires: {
          include: {
            tire: {
              include: {
                dotCodes: true,
                photos: true,
              },
            },
          },
        },
        services: true,
      },
    });

    // Отправить уведомление клиенту через Telegram
    if (client.telegramId) {
      await prisma.notification.create({
        data: {
          userId: client.id,
          type: 'order_created',
          message: `Заказ ${orderNumber} создан. Шины приняты на хранение до ${endDate.toLocaleDateString('ru-RU')}.`,
          data: { orderId: order.id },
        },
      });
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
