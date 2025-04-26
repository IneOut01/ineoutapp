/**
 * Redux slice per gestire la posizione dell'utente
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

interface LocationState {
  userLocation: {
    latitude: number;
    longitude: number;
  } | null;
  locationPermission: 'granted' | 'denied' | 'unknown';
  lastUpdated: string | null;
}

const initialState: LocationState = {
  userLocation: null,
  locationPermission: 'unknown',
  lastUpdated: null
};

export const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setUserLocation: (state, action: PayloadAction<{latitude: number; longitude: number} | null>) => {
      state.userLocation = action.payload;
      state.lastUpdated = action.payload ? new Date().toISOString() : state.lastUpdated;
    },
    setLocationPermission: (state, action: PayloadAction<'granted' | 'denied' | 'unknown'>) => {
      state.locationPermission = action.payload;
    },
    clearUserLocation: (state) => {
      state.userLocation = null;
    }
  }
});

export const { setUserLocation, setLocationPermission, clearUserLocation } = locationSlice.actions;

// Selettori
export const selectUserLocation = (state: RootState) => state.location.userLocation;
export const selectLocationPermission = (state: RootState) => state.location.locationPermission;

export default locationSlice.reducer; 