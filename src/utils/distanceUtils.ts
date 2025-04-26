/**
 * Calculates the distance between two geographic coordinates using the Haversine formula
 * @param lat1 - Latitude of the first point in degrees
 * @param lon1 - Longitude of the first point in degrees
 * @param lat2 - Latitude of the second point in degrees
 * @param lon2 - Longitude of the second point in degrees
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  // If any coordinates are missing, return a large number to effectively exclude the listing
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return Number.MAX_SAFE_INTEGER;
  }

  // Earth radius in kilometers
  const R = 6371;
  
  // Convert coordinates from degrees to radians
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  // Haversine formula
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  // Distance in kilometers
  return R * c;
};

/**
 * Checks if a location is within the specified bounds
 * @param latitude - Latitude of the location to check
 * @param longitude - Longitude of the location to check
 * @param bounds - Object containing north, south, east, and west boundaries
 * @returns Boolean indicating if the location is within bounds
 */
export const isLocationWithinBounds = (
  latitude: number,
  longitude: number,
  bounds: { north: number; south: number; east: number; west: number }
): boolean => {
  return (
    latitude <= bounds.north &&
    latitude >= bounds.south &&
    longitude <= bounds.east &&
    longitude >= bounds.west
  );
}; 