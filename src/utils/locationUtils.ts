/**
 * Utility functions for location-related operations
 */

/**
 * Calculates the distance between two coordinates using the Haversine formula
 * @param lat1 Latitude of the first point
 * @param lon1 Longitude of the first point
 * @param lat2 Latitude of the second point
 * @param lon2 Longitude of the second point
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  if (!lat1 || !lon1 || !lat2 || !lon2) {
    return 0;
  }
  
  const R = 6371; // Raggio della Terra in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
};

/**
 * Formats a distance for display
 * @param distance Distance in kilometers
 * @returns Formatted string (e.g. "2.5 km" or "500 m")
 */
export const formatDistance = (distance: number): string => {
  if (!distance) return '';
  
  if (distance < 1) {
    // Convert to meters for distances less than 1 km
    const meters = Math.round(distance * 1000);
    return `${meters} m`;
  } else {
    // Round to 1 decimal place for larger distances
    return `${distance.toFixed(1)} km`;
  }
};

/**
 * Re-export functions from other location-related utility files
 * to maintain a centralized API
 */
export * from './location';
export * from './distanceUtils'; 