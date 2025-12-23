import { NextRequest, NextResponse } from 'next/server';
import { Telegraf } from 'telegraf';
import { prisma } from '@/lib/prisma';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

bot.command('start', async (ctx) => {
  try {
    const telegramId = ctx.from.id;
    const username = ctx.from.username;
    const firstName = ctx.from.first_name;
    const lastName = ctx.from.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();

    await prisma.user.upsert({
      where: { telegramId: BigInt(telegramId) },
      update: { username, fullName, lastLoginAt: new Date() },
      create: {
        telegramId: BigInt(telegramId),
        username,
        fullName,
        role: 'client',
        lastLoginAt: new Date(),
      },
    });

    await ctx.reply(
      `👋 Добро пожаловать, ${firstName}!\n\n🚗 TiCRM - система учета хранения шин\n\n/menu - Главное меню\n/help - Помощь`,
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '🚗 Мои шины', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}/miniapp` } }
          ]],
        },
      }
    );
  } catch (error) {
    console.error('Error /start:', error);
    await ctx.reply('Произошла ошибка. Попробуйте позже.');
  }
});

bot.command('menu', async (ctx) => {
  await ctx.reply('📋 Главное меню:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🚗 Мои шины', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}/miniapp` } }],
        [{ text: '📞 Поддержка', callback_data: 'support' }],
      ],
    },
  });
});

bot.command('help', async (ctx) => {
  await ctx.reply('ℹ️ Справка:\n\n🚗 Мои шины - просмотр шин на хранении\n📞 Поддержка - связь с оператором');
});

bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;
  await ctx.answerCbQuery();
  
  if (data === 'support') {
    await ctx.reply('📞 Служба поддержки:\nТелефон: +7 (XXX) XXX-XX-XX\nEmail: support@ticrm.com');
  }
});

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get('x-telegram-bot-api-secret-token');
    if (secret !== process.env.TELEGRAM_BOT_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ ok: true }); // Всегда 200 для Telegram
  }
}
