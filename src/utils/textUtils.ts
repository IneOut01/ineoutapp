/**
 * Utility per la manipolazione del testo
 */

/**
 * Tronca il testo se supera la lunghezza massima
 * @param text - Il testo da troncare
 * @param maxLength - Lunghezza massima 
 * @param suffix - Suffisso da aggiungere (default: "...")
 * @returns Testo troncato
 */
export const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (!text) return '';
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Capitalizza la prima lettera di una stringa
 * @param text - Testo da capitalizzare
 * @returns Testo con prima lettera maiuscola
 */
export const capitalizeFirstLetter = (text: string): string => {
  if (!text) return '';
  
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Rimuove caratteri speciali da una stringa
 * @param text - Testo da pulire
 * @returns Testo pulito
 */
export const removeSpecialChars = (text: string): string => {
  if (!text) return '';
  
  return text.replace(/[^\w\s]/gi, '');
};

export default { truncateText }; 