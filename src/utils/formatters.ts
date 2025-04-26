import { useTranslation } from '../contexts/LanguageContext';

/**
 * Formats a currency value as EUR 
 * @param amount - The amount to format
 * @returns Formatted currency string with € symbol
 */
export const formatCurrency = (amount: number): string => {
  // Format with thousands separator and add € symbol
  return `€ ${Math.round(amount).toLocaleString('it-IT')}`;
};

/**
 * Formats a relative time (e.g., "2 days ago", "5 minutes ago")
 * @param date - The date to format relative to now
 * @returns Formatted relative time string
 */
export const formatDistanceToNow = (date: Date | string): string => {
  const { t } = useTranslation();
  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  const diffInMilliseconds = now.getTime() - parsedDate.getTime();
  const diffInMinutes = Math.floor(diffInMilliseconds / 60000);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInMinutes < 1) {
    return t('time.justNow');
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? t('time.minuteAgo') : t('time.minutesAgo')}`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? t('time.hourAgo') : t('time.hoursAgo')}`;
  } else if (diffInDays < 30) {
    return `${diffInDays} ${diffInDays === 1 ? t('time.dayAgo') : t('time.daysAgo')}`;
  } else {
    // Return formatted date for older dates
    return parsedDate.toLocaleDateString();
  }
};

// Re-export other formatters
export { formatDistance } from './formatDistance';
export { formatPrice } from './formatPrice'; 