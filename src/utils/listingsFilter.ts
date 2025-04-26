import { Listing, MapBounds } from '../types/listing';
import { LocationData } from '../hooks/useLocation';
import { calculateDistance } from './distanceUtils';

export interface ListingFilters {
  query?: string;
  types?: string[];
  priceMin?: number;
  priceMax?: number;
  rooms?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  sortByDistance?: boolean;
  nearbyRadius?: number;
  minMonths?: number;     // Numero minimo di mesi di permanenza
  minSize?: number;       // Metratura minima in m²
  recentOnly?: boolean;   // Annunci recenti (ultimi 30 giorni)
  mapBounds?: {           // Per il filtro "Disegna zona"
    northEast: {latitude: number, longitude: number},
    southWest: {latitude: number, longitude: number}
  };
}

/**
 * Applica il filtro di ricerca testuale agli annunci
 */
const applyTextSearch = (listings: Listing[], query: string): Listing[] => {
  if (!query) return listings;
  
  const lowerQuery = query.toLowerCase();
  return listings.filter(listing => 
    listing.title.toLowerCase().includes(lowerQuery) || 
    listing.description.toLowerCase().includes(lowerQuery) ||
    listing.address.toLowerCase().includes(lowerQuery) ||
    listing.city.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Applica filtri geografici basati sui bounds della mappa
 */
const applyGeographicalFilters = (
  listings: Listing[],
  bounds: MapBounds | null,
  mapBounds?: {
    northEast: {latitude: number, longitude: number},
    southWest: {latitude: number, longitude: number}
  }
): Listing[] => {
  if (!listings || listings.length === 0) return [];
  
  // Filtra per area geografica con mapBounds (per il filtro "Disegna zona")
  if (mapBounds?.northEast && mapBounds?.southWest) {
    const { northEast, southWest } = mapBounds;
    return listings.filter(listing => 
      listing.latitude <= northEast.latitude && 
      listing.latitude >= southWest.latitude &&
      listing.longitude <= northEast.longitude && 
      listing.longitude >= southWest.longitude
    );
  } 
  // Oppure usa il bounds standard se disponibile
  else if (bounds?.northEast && bounds?.southWest) {
    return listings.filter(listing =>
      listing.latitude <= bounds.northEast.latitude && 
      listing.latitude >= bounds.southWest.latitude &&
      listing.longitude <= bounds.northEast.longitude && 
      listing.longitude >= bounds.southWest.longitude
    );
  }
  
  return listings;
};

/**
 * Applica filtri basati sulla posizione dell'utente e calcola le distanze
 */
const applyLocationBasedFilters = (
  listings: Listing[],
  userLocation: LocationData | null,
  nearbyRadius?: number
): Listing[] => {
  if (!listings || listings.length === 0) return [];
  if (!userLocation) return listings;
  
  // Calcolo distanza se è disponibile la posizione dell'utente
  const listingsWithDistance = listings.map(listing => {
    if (listing.latitude && listing.longitude) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        listing.latitude,
        listing.longitude
      );
      return { ...listing, distance };
    }
    return listing;
  });
  
  // Filtra per raggio se specificato
  if (nearbyRadius && nearbyRadius > 0) {
    return listingsWithDistance.filter(
      listing => (listing.distance || 0) <= nearbyRadius
    );
  }
  
  return listingsWithDistance;
};

/**
 * Applica ordinamento ai listings in base ai criteri specificati
 */
const applySorting = (
  listings: Listing[],
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  sortByDistance?: boolean,
  userLocation?: LocationData | null
): Listing[] => {
  if (!listings || listings.length === 0) return [];
  
  const listingsCopy = [...listings];
  
  // Ordinamento per prezzo
  if (sortBy === 'price') {
    return listingsCopy.sort((a, b) => 
      sortOrder === 'desc' ? b.price - a.price : a.price - b.price
    );
  } 
  // Ordinamento per distanza se è abilitato e c'è la posizione utente
  else if (sortByDistance && userLocation) {
    return listingsCopy.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  } 
  // Predefinito: ordinamento per data più recente
  else {
    return listingsCopy.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }
};

/**
 * Applica tutti i filtri specificati agli annunci
 */
export const applyFilters = (
  listings: Listing[],
  filters: ListingFilters = {},
  bounds: MapBounds | null = null,
  userLocation: LocationData | null = null
): Listing[] => {
  if (!listings || listings.length === 0) return [];
  
  let filteredListings = [...listings];
  
  // Filtraggio testuale
  if (filters.query) {
    filteredListings = applyTextSearch(filteredListings, filters.query);
  }
  
  // Filtro per tipo di proprietà
  if (filters.types && filters.types.length > 0) {
    filteredListings = filteredListings.filter(listing => 
      filters.types!.includes(listing.type)
    );
  }
  
  // Filtro per range di prezzo
  if (filters.priceMin !== undefined && filters.priceMin > 0) {
    filteredListings = filteredListings.filter(listing => listing.price >= filters.priceMin!);
  }
  
  if (filters.priceMax !== undefined && filters.priceMax > 0) {
    filteredListings = filteredListings.filter(listing => listing.price <= filters.priceMax!);
  }
  
  // Filtro per metratura minima
  if (filters.minSize && filters.minSize > 0) {
    filteredListings = filteredListings.filter(listing => 
      (listing.size || 0) >= filters.minSize!
    );
  }
  
  // Filtro per numero minimo di mesi
  if (filters.minMonths && filters.minMonths > 0) {
    filteredListings = filteredListings.filter(listing => 
      (listing.months || 0) >= filters.minMonths!
    );
  }
  
  // Filtro per numero di stanze
  if (filters.rooms !== undefined && filters.rooms > 0) {
    filteredListings = filteredListings.filter(listing => listing.rooms === filters.rooms);
  }
  
  // Filtro per annunci recenti (ultimi 7 giorni)
  if (filters.recentOnly) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    filteredListings = filteredListings.filter(listing => 
      new Date(listing.createdAt) >= oneWeekAgo
    );
  }
  
  // Applica filtri geografici
  filteredListings = applyGeographicalFilters(
    filteredListings, 
    bounds, 
    filters.mapBounds
  );
  
  // Applica filtri basati sulla posizione
  filteredListings = applyLocationBasedFilters(
    filteredListings,
    userLocation,
    filters.nearbyRadius
  );
  
  // Applica ordinamento
  filteredListings = applySorting(
    filteredListings,
    filters.sortBy,
    filters.sortOrder,
    filters.sortByDistance,
    userLocation
  );
  
  return filteredListings;
}; 