import { LatLng } from 'react-native-maps';

/**
 * Interfaccia che rappresenta una previsione di un luogo dall'API Places di Google o dalle fonti locali
 */
export interface MatchedSubstring {
  offset: number;
  length: number;
}

export interface StructuredFormatting {
  mainText: string;
  secondaryText: string;
  mainTextMatchedSubstrings?: MatchedSubstring[];
}

export interface Location {
  latitude: number;
  longitude: number;
}

/**
 * Interfaccia per le previsioni di luoghi da Google Places API
 */
export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types?: string[];
  matchedSubstrings?: {
    offset: number;
    length: number;
  }[];
  terms?: {
    value: string;
    offset: number;
  }[];
  distanceMeters?: number;
  structuredFormatting?: {
    mainText: string;
    secondaryText: string;
    mainTextMatchedSubstrings?: {
      offset: number;
      length: number;
    }[];
  };
  // Campi aggiuntivi per l'integrazione con il sistema di preferenze
  score?: number;
  isFavorite?: boolean;
  lastUsed?: number; // timestamp
  useCount?: number;
}

export interface PlaceLocation {
  lat: number;
  lng: number;
}

export interface PlaceGeometry {
  location: PlaceLocation;
  viewport?: {
    northeast: PlaceLocation;
    southwest: PlaceLocation;
  };
}

/**
 * Interfaccia che rappresenta un componente dell'indirizzo nei dettagli di un luogo
 */
export interface AddressComponent {
  longName: string;
  shortName: string;
  types: string[];
}

/**
 * Interfaccia per la risposta dettagliata di un luogo
 */
export interface PlaceDetails {
  place_id: string;
  name?: string;
  formatted_address?: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
    viewport?: {
      northeast: {
        lat: number;
        lng: number;
      };
      southwest: {
        lat: number;
        lng: number;
      };
    };
  };
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  types?: string[];
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
    html_attributions: string[];
  }>;
}

/**
 * Interfaccia per l'indirizzo formattato
 */
export interface FormattedAddress {
  fullAddress: string;
  streetNumber?: string;
  route?: string;
  neighborhood?: string;
  locality?: string;
  administrativeArea?: string;
  country?: string;
  postalCode?: string;
  formattedComponents?: {
    street?: string; // Via + numero
    city?: string; // Località, amministrativa
    region?: string; // Regione o provincia
    state?: string; // Stato o nazione
  };
  location?: {
    lat: number;
    lng: number;
  };
}

/**
 * Interfaccia per le opzioni di ricerca con preferenze utente
 */
export interface PlacesAutocompleteOptions {
  types?: string;
  components?: string;
  language?: string;
  location?: { 
    lat: number; 
    lng: number; 
  };
  radius?: number;
  countryRestrictions?: string[];
  strictbounds?: boolean;
  applyUserPreferences?: boolean;
}

/**
 * Interfaccia che rappresenta le informazioni di un luogo selezionato da fornire al componente parent
 */
export interface SelectedPlace {
  placeId: string;
  name: string;
  address: string;
  location: Location;
  addressComponents: AddressComponent[];
}

/**
 * Configurazione dell'SDK Google Places
 */
export interface GooglePlacesApiOptions {
  debounce?: number;
  types?: string[];
  componentRestrictions?: {
    country: string | string[];
  };
  fields?: string[];
  locationBias?: {
    center: Location;
    radius: number;
  };
  language?: string;
  strictBounds?: boolean;
}

export interface UserPreferences {
  recentSearches?: string[];
  lastLanguage?: string;
  homeLocation?: Location;
  workLocation?: Location;
  defaultCountry?: string;
}

/**
 * Estensione dell'interfaccia Window per supportare l'SDK Google Maps
 */
declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          AutocompleteService: new () => {
            getPlacePredictions: (
              request: {
                input: string;
                componentRestrictions?: { country: string };
                language?: string;
                types?: string[];
                bounds?: any;
                strictbounds?: boolean;
                locationBias?: any;
                radius?: number;
              },
              callback: (
                predictions: any[] | null,
                status: 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST'
              ) => void
            ) => void;
          };
          PlacesService: new (attrContainer: HTMLDivElement) => {
            getDetails: (
              request: { placeId: string; fields: string[]; language?: string },
              callback: (
                place: any | null,
                status: 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST'
              ) => void
            ) => void;
          };
        };
      };
    };
  }
} 