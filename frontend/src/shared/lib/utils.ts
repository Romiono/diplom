import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ru';

dayjs.extend(relativeTime);

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatTON = (amount: number, decimals = 2): string =>
  `${amount.toFixed(decimals)} TON`;

export const formatNanoTON = (nano: string): string => {
  const ton = Number(BigInt(nano)) / 1e9;
  return formatTON(ton);
};

export const formatDate = (date: string, locale = 'ru'): string =>
  dayjs(date).locale(locale).format('D MMMM YYYY');

export const formatRelative = (date: string, locale = 'ru'): string =>
  dayjs(date).locale(locale).fromNow();

export const truncateAddress = (addr: string): string =>
  addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

/**
 * Конвертирует relative URL из API в абсолютный для <Image>.
 * Backend отдаёт "/api/uploads/year/month/file.ext"
 * Результат: "http://localhost:3000/api/uploads/year/month/file.ext"
 */
export const toAbsoluteUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const base = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api').replace(/\/api$/, '');
  return `${base}${url}`;
};
