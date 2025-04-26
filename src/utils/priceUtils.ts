/**
 * Utility per la formattazione dei prezzi
 */

/**
 * Formatta il prezzo aggiungendo separatori delle migliaia
 * @param price - Il prezzo da formattare
 * @returns Prezzo formattato
 */
export const formatPrice = (price: number): string => {
  if (typeof price !== 'number') return '0';
  
  return price.toLocaleString('it-IT', {
    maximumFractionDigits: 0
  });
};

/**
 * Calcola il prezzo scontato
 * @param originalPrice - Prezzo originale
 * @param discountPercentage - Percentuale di sconto
 * @returns Prezzo scontato
 */
export const calculateDiscountedPrice = (originalPrice: number, discountPercentage: number): number => {
  return originalPrice * (1 - discountPercentage / 100);
};

/**
 * Formatta il prezzo con simbolo della valuta e separatori
 * @param price - Il prezzo da formattare
 * @param currency - La valuta (default: EUR)
 * @returns Prezzo formattato con simbolo della valuta
 */
export const formatPriceWithCurrency = (price: number, currency: string = 'EUR'): string => {
  if (typeof price !== 'number') return '€0';
  
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  }).format(price);
}; 