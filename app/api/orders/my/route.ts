import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    const orders = await prisma.order.findMany({
      where: {
        clientId: session.userId,
        status: {
          in: ['active', 'expiring'],
        },
      },
      include: {
        orderTires: {
          include: {
            tire: {
              include: {
                photos: {
                  select: {
                    url: true,
                  },
                  take: 1,
                },
                dotCodes: {
                  select: {
                    dotCode: true,
                  },
                },
              },
            },
          },
        },
        services: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching client orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
