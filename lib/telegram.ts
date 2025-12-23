import { Telegraf } from 'telegraf';
import crypto from 'crypto';

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined');
}

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

/**
 * Проверка подлинности данных Telegram Web App
 */
export function validateTelegramWebAppData(initData: string): boolean {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    
    if (!hash) return false;
    
    params.delete('hash');
    
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.TELEGRAM_BOT_TOKEN!)
      .digest();
    
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    return calculatedHash === hash;
  } catch (error) {
    console.error('Error validating Telegram data:', error);
    return false;
  }
}

/**
 * Получение данных пользователя из initData
 */
export function getTelegramUserData(initData: string) {
  try {
    const params = new URLSearchParams(initData);
    const userParam = params.get('user');
    
    if (!userParam) return null;
    
    return JSON.parse(userParam);
  } catch (error) {
    console.error('Error parsing Telegram user data:', error);
    return null;
  }
}

/**
 * Отправка уведомления пользователю
 */
export async function sendNotification(
  telegramId: number,
  message: string,
  options?: {
    parseMode?: 'HTML' | 'Markdown';
    replyMarkup?: any;
  }
) {
  try {
    await bot.telegram.sendMessage(telegramId, message, {
      parse_mode: options?.parseMode || 'HTML',
      reply_markup: options?.replyMarkup,
    });
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

/**
 * Отправка фото с подписью
 */
export async function sendPhoto(
  telegramId: number,
  photoUrl: string,
  caption?: string
) {
  try {
    await bot.telegram.sendPhoto(telegramId, photoUrl, {
      caption,
      parse_mode: 'HTML',
    });
    return true;
  } catch (error) {
    console.error('Error sending photo:', error);
    return false;
  }
}

/**
 * Форматирование сообщений
 */
export const messages = {
  welcome: (name: string) => `
👋 Привет, <b>${name}</b>!

Добро пожаловать в TiCRM - систему учета хранения автомобильных шин.

Используйте кнопку ниже для доступа к вашим шинам.
  `,
  
  orderCreated: (orderNumber: string, endDate: string) => `
✅ <b>Заказ создан!</b>

Номер заказа: <code>${orderNumber}</code>
Окончание хранения: <b>${endDate}</b>

Мы напомним вам за 30 дней до окончания срока.
  `,
  
  storageExpires: (orderNumber: string, daysLeft: number) => `
⚠️ <b>Напоминание о хранении</b>

Номер заказа: <code>${orderNumber}</code>
Осталось дней: <b>${daysLeft}</b>

Не забудьте продлить хранение или забрать шины.
  `,
  
  appointmentConfirmed: (date: string, partnerName: string) => `
✅ <b>Запись подтверждена!</b>

Дата: <b>${date}</b>
Мастер: <b>${partnerName}</b>

Ждем вас в назначенное время!
  `,
};

/**
 * Inline клавиатура для главного меню
 */
export function getMainMenuKeyboard(appUrl: string) {
  return {
    inline_keyboard: [
      [
        {
          text: '🚗 Мои шины',
          web_app: { url: `${appUrl}/miniapp` },
        },
      ],
      [
        { text: '📞 Поддержка', callback_data: 'support' },
        { text: 'ℹ️ Помощь', callback_data: 'help' },
      ],
    ],
  };
}
