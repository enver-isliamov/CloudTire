import { NextRequest, NextResponse } from 'next/server';
import { bot, messages, getMainMenuKeyboard } from '@/lib/telegram';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Проверка подлинности webhook
    const webhookSecret = process.env.TELEGRAM_BOT_WEBHOOK_SECRET;
    const signature = request.headers.get('x-telegram-bot-api-secret-token');
    
    if (webhookSecret && signature !== webhookSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const update = await request.json();

    // Обработка команд
    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const text = message.text;

      if (text === '/start') {
        const firstName = message.from.first_name;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
        
        await bot.telegram.sendMessage(
          chatId,
          messages.welcome(firstName),
          {
            parse_mode: 'HTML',
            reply_markup: getMainMenuKeyboard(appUrl),
          }
        );
      } else if (text === '/menu') {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
        
        await bot.telegram.sendMessage(
          chatId,
          '📋 Главное меню',
          {
            reply_markup: getMainMenuKeyboard(appUrl),
          }
        );
      } else if (text === '/help') {
        await bot.telegram.sendMessage(
          chatId,
          `
ℹ️ <b>Помощь</b>

<b>Доступные команды:</b>
/start - Начать работу
/menu - Главное меню
/help - Эта справка

<b>Как пользоваться:</b>
1. Нажмите кнопку "🚗 Мои шины" для просмотра ваших шин
2. Используйте веб-приложение для записи на услуги
3. Вы получите автоматические напоминания об окончании срока хранения

<b>Поддержка:</b>
По всем вопросам обращайтесь к вашему менеджеру.
          `,
          { parse_mode: 'HTML' }
        );
      }
    }

    // Обработка callback queries
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const chatId = callbackQuery.message.chat.id;
      const data = callbackQuery.data;

      if (data === 'support') {
        await bot.telegram.sendMessage(
          chatId,
          `
📞 <b>Контакты поддержки</b>

Для связи с нами:
- Телефон: +7 (XXX) XXX-XX-XX
- Email: support@ticrm.ru
- Telegram: @ticrm_support

Мы работаем с 9:00 до 18:00 по будням.
          `,
          { parse_mode: 'HTML' }
        );
      } else if (data === 'help') {
        await bot.telegram.sendMessage(
          chatId,
          `
ℹ️ <b>Помощь</b>

Используйте кнопку "🚗 Мои шины" для доступа к вашим данным.
Для дополнительной информации используйте команду /help
          `,
          { parse_mode: 'HTML' }
        );
      }

      // Отвечаем на callback query
      await bot.telegram.answerCbQuery(callbackQuery.id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
