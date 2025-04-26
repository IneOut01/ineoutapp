/**
 * Calcola la distanza in km tra due punti geografici utilizzando la formula di Haversine
 * @param lat1 Latitudine del primo punto
 * @param lon1 Longitudine del primo punto
 * @param lat2 Latitudine del secondo punto
 * @param lon2 Longitudine del secondo punto
 * @returns Distanza in km tra i due punti
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const toRad = (value: number) => value * Math.PI / 180;
  
  const R = 6371; // Raggio della Terra in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distanza in km
  
  return Math.round(distance * 100) / 100; // Arrotonda a 2 decimali
}; 