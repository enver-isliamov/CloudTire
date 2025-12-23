import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { validateTelegramWebAppData, getTelegramUserData } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { initData } = body;

    // Валидация данных от Telegram
    if (!validateTelegramWebAppData(initData)) {
      return NextResponse.json(
        { error: 'Invalid Telegram data' },
        { status: 401 }
      );
    }

    // Получаем данные пользователя
    const telegramUser = getTelegramUserData(initData);
    if (!telegramUser) {
      return NextResponse.json(
        { error: 'Failed to parse user data' },
        { status: 400 }
      );
    }

    // Находим или создаем пользователя
    let user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramUser.id) },
    });

    if (!user) {
      // Создаем нового пользователя
      user = await prisma.user.create({
        data: {
          telegramId: BigInt(telegramUser.id),
          username: telegramUser.username,
          fullName: `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
          role: 'client',
        },
      });
    } else {
      // Обновляем последний вход
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    // Создаем сессию
    const session = await getSession();
    session.userId = user.id;
    session.telegramId = Number(user.telegramId);
    session.role = user.role;
    session.fullName = user.fullName;
    await session.save();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
