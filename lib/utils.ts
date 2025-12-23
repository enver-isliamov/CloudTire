import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, addMonths, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Генерация номера заказа
 * Формат: YYMMDD-HHMMSS (например, 251223-143052)
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

/**
 * Форматирование даты
 */
export function formatDate(date: Date | string, formatStr: string = 'dd.MM.yyyy'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr, { locale: ru });
}

/**
 * Расчет даты окончания хранения
 */
export function calculateEndDate(startDate: Date, months: number): Date {
  return addMonths(startDate, months);
}

/**
 * Расчет даты напоминания (за 30 дней до окончания)
 */
export function calculateReminderDate(endDate: Date, daysBefore: number = 30): Date {
  return subDays(endDate, daysBefore);
}

/**
 * Форматирование суммы
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Проверка, является ли пользователь администратором
 */
export function isAdmin(telegramId: number): boolean {
  const adminIds = process.env.ADMIN_TELEGRAM_IDS?.split(',').map(id => parseInt(id.trim())) || [];
  return adminIds.includes(telegramId);
}

/**
 * Валидация телефона
 */
export function validatePhone(phone: string): boolean {
  // Простая валидация российского номера
  const phoneRegex = /^(\+7|8)?[\s-]?\(?[0-9]{3}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}$/;
  return phoneRegex.test(phone);
}

/**
 * Форматирование телефона
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11 && cleaned.startsWith('7')) {
    return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9)}`;
  }
  
  if (cleaned.length === 10) {
    return `+7 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8)}`;
  }
  
  return phone;
}

/**
 * Валидация DOT-кода
 */
export function validateDotCode(dotCode: string): boolean {
  // DOT код обычно содержит DOT + 10-13 символов
  const dotRegex = /^DOT\s*[A-Z0-9\s]{10,13}$/i;
  return dotRegex.test(dotCode.trim());
}

/**
 * Расчет дней до окончания
 */
export function getDaysUntil(date: Date | string): number {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Определение статуса заказа по дате
 */
export function getOrderStatus(endDate: Date | string): 'active' | 'expiring' | 'overdue' {
  const days = getDaysUntil(endDate);
  
  if (days < 0) return 'overdue';
  if (days <= 30) return 'expiring';
  return 'active';
}

/**
 * Truncate текст
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Получение инициалов
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Склонение слов (1 день, 2 дня, 5 дней)
 */
export function pluralize(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

/**
 * Пример: pluralizeDays(1) => "1 день", pluralizeDays(2) => "2 дня"
 */
export function pluralizeDays(count: number): string {
  return `${count} ${pluralize(count, 'день', 'дня', 'дней')}`;
}
