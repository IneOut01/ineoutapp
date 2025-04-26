/**
 * Tipi relativi ai filtri di ricerca per gli annunci immobiliari
 */

// Interfaccia per i bounds geografici della mappa
export interface MapBounds {
  northEast: {
    latitude: number;
    longitude: number;
  };
  southWest: {
    latitude: number;
    longitude: number;
  };
}

// Interfaccia principale per i filtri di ricerca
export interface ListingFilters {
  // Ricerca testuale
  query?: string;
  searchText?: string;
  
  // Filtri per tipo di proprietà e contratto
  types?: string[];
  listingType?: string;
  contractType?: string;
  
  // Filtri per prezzo
  priceMin?: number;
  priceMax?: number;
  price?: { 
    min?: number; 
    max?: number 
  };
  
  // Filtri per caratteristiche
  rooms?: number | { 
    min?: number; 
    max?: number 
  };
  size?: { 
    min?: number; 
    max?: number 
  };
  minSize?: number;
  
  // Filtri temporali
  minMonths?: number;
  recentOnly?: boolean;
  
  // Filtri geografici
  distance?: number;
  nearbyRadius?: number;
  mapBounds?: {
    northEast: { latitude: number; longitude: number };
    southWest: { latitude: number; longitude: number };
  };
  
  // Ordinamento
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  sortByDistance?: boolean;
  
  // Altri filtri
  amenities?: string[];
} 