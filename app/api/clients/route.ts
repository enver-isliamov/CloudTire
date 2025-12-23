import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

// GET - список клиентов
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    // Только admin и manager могут просматривать клиентов
    if (session.role !== 'admin' && session.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { role: 'client' };
    
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { carNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          phone: true,
          carNumber: true,
          address: true,
          trafficSource: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
              tires: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      clients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

// POST - создание клиента
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    if (session.role !== 'admin' && session.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    const { fullName, phone, carNumber, address, trafficSource } = data;

    // Проверка существующего клиента
    const existing = await prisma.user.findUnique({
      where: { phone },
    });

    if (existing) {
      return NextResponse.json({ error: 'Client with this phone already exists' }, { status: 400 });
    }

    const client = await prisma.user.create({
      data: {
        fullName,
        phone,
        carNumber,
        address,
        trafficSource,
        role: 'client',
      },
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
