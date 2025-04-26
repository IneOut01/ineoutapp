export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  images: string[];
  ownerId: string;
  createdAt: Date | number;
  updatedAt: Date | number;
  available: boolean;
  distance?: number;
  type?: string;
  size?: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  months?: number;
  rentalPeriod?: string;
  imageUrl?: string;
}

export interface ListingRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

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