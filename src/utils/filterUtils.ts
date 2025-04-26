import { Listing } from '../types/listing';
import { calculateDistance } from './distanceUtils';

/**
 * Applies client-side filters to a list of listings
 * @param listings - Array of listings to filter
 * @param filters - Object containing filter criteria
 * @param userLocation - Optional user location for distance filtering
 * @returns Filtered array of listings
 */
export const applyClientFilters = (
  listings: Listing[],
  filters: {
    searchText?: string;
    listingType?: string;
    contractType?: string;
    price?: { min?: number; max?: number };
    rooms?: { min?: number; max?: number };
    size?: { min?: number; max?: number };
    distance?: number;
    amenities?: string[];
  },
  userLocation?: { latitude: number; longitude: number }
): Listing[] => {
  if (!listings || listings.length === 0) {
    return [];
  }

  return listings.filter(listing => {
    // Filter by search text (title, description, address, city)
    if (filters.searchText && filters.searchText.trim() !== '') {
      const searchText = filters.searchText.toLowerCase().trim();
      const titleMatch = listing.title?.toLowerCase().includes(searchText);
      const descriptionMatch = listing.description?.toLowerCase().includes(searchText);
      const addressMatch = listing.address?.toLowerCase().includes(searchText);
      const cityMatch = listing.city?.toLowerCase().includes(searchText);
      
      if (!(titleMatch || descriptionMatch || addressMatch || cityMatch)) {
        return false;
      }
    }

    // Filter by listing type
    if (filters.listingType && listing.type !== filters.listingType) {
      return false;
    }

    // Filter by contract type
    if (filters.contractType && listing.contractType !== filters.contractType) {
      return false;
    }

    // Filter by price range
    if (filters.price) {
      const { min, max } = filters.price;
      if (min !== undefined && listing.price < min) {
        return false;
      }
      if (max !== undefined && listing.price > max) {
        return false;
      }
    }

    // Filter by number of rooms
    if (filters.rooms) {
      const { min, max } = filters.rooms;
      if (min !== undefined && listing.rooms < min) {
        return false;
      }
      if (max !== undefined && listing.rooms > max) {
        return false;
      }
    }

    // Filter by size
    if (filters.size) {
      const { min, max } = filters.size;
      if (min !== undefined && listing.size < min) {
        return false;
      }
      if (max !== undefined && listing.size > max) {
        return false;
      }
    }

    // Filter by distance
    if (
      filters.distance !== undefined && 
      userLocation && 
      listing.latitude && 
      listing.longitude
    ) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        listing.latitude,
        listing.longitude
      );
      
      if (distance > filters.distance) {
        return false;
      }
    }

    // Filter by amenities
    if (filters.amenities && filters.amenities.length > 0) {
      // Ensure that all specified amenities are included in the listing
      if (!listing.amenities) {
        return false;
      }
      
      const listingAmenities = Array.isArray(listing.amenities) 
        ? listing.amenities 
        : Object.keys(listing.amenities).filter(key => listing.amenities[key]);
        
      for (const amenity of filters.amenities) {
        if (!listingAmenities.includes(amenity)) {
          return false;
        }
      }
    }

    return true;
  });
};

/**
 * Sorts a list of listings based on specified criteria
 * @param listings - Array of listings to sort
 * @param sortBy - Criteria to sort by: 'price', 'distance', or 'date'
 * @param sortOrder - Order to sort: 'asc' or 'desc'
 * @param userLocation - User location for distance sorting
 * @returns Sorted array of listings
 */
export const sortListings = (
  listings: Listing[],
  sortBy: 'price' | 'distance' | 'date',
  sortOrder: 'asc' | 'desc' = 'asc',
  userLocation?: { latitude: number; longitude: number }
): Listing[] => {
  if (!listings || listings.length === 0) {
    return [];
  }

  const sortedListings = [...listings];
  
  switch (sortBy) {
    case 'price':
      sortedListings.sort((a, b) => {
        const priceA = a.price || 0;
        const priceB = b.price || 0;
        return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
      });
      break;
      
    case 'distance':
      if (userLocation && userLocation.latitude && userLocation.longitude) {
        sortedListings.sort((a, b) => {
          const distanceA = (a.latitude && a.longitude) 
            ? calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                a.latitude,
                a.longitude
              ) 
            : Number.MAX_SAFE_INTEGER;
            
          const distanceB = (b.latitude && b.longitude)
            ? calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                b.latitude,
                b.longitude
              )
            : Number.MAX_SAFE_INTEGER;
            
          return sortOrder === 'asc' ? distanceA - distanceB : distanceB - distanceA;
        });
      }
      break;
      
    case 'date':
      sortedListings.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return sortOrder === 'asc' 
          ? dateA.getTime() - dateB.getTime() 
          : dateB.getTime() - dateA.getTime();
      });
      break;
  }
  
  return sortedListings;
}; 