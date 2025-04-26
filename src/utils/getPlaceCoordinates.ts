import { PlacePrediction } from '../types/placePrediction';

/**
 * Extracts coordinates from a place object
 * Supports different formats:
 * - Google Place Details result
 * - PlacePrediction with lat/lng
 * - Custom object with latitude/longitude
 */
export function getPlaceCoordinates(
  place: PlacePrediction | google.maps.places.PlaceResult | any
): { latitude: number; longitude: number } | null {
  // Handle PlacePrediction with lat/lng
  if (place.lat && place.lng) {
    return {
      latitude: typeof place.lat === 'function' ? place.lat() : Number(place.lat),
      longitude: typeof place.lng === 'function' ? place.lng() : Number(place.lng),
    };
  }

  // Handle Google Place Details result
  if (place.geometry?.location) {
    const location = place.geometry.location;
    return {
      latitude: typeof location.lat === 'function' ? location.lat() : Number(location.lat),
      longitude: typeof location.lng === 'function' ? location.lng() : Number(location.lng),
    };
  }

  // Handle object with latitude/longitude
  if (place.latitude !== undefined && place.longitude !== undefined) {
    return {
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
    };
  }

  // Handle case where place has a position property
  if (place.position) {
    return {
      latitude: Number(place.position.latitude || place.position.lat),
      longitude: Number(place.position.longitude || place.position.lng),
    };
  }

  return null;
} 