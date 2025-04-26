/**
 * Formatta un prezzo come numero intero (senza decimali) con separatore delle migliaia
 * @param price - Prezzo da formattare
 * @returns Prezzo formattato
 */
export const formatPrice = (price: number): string => {
  // Arrotonda al numero intero più vicino
  const roundedPrice = Math.round(price);
  
  // Formatta con separatore delle migliaia (punto)
  return roundedPrice.toLocaleString('it-IT');
};

export default formatPrice; 