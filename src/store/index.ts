/**
 * Store Redux centralizzato
 */
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import locationReducer from './slices/locationSlice';

export const store = configureStore({
  reducer: {
    location: locationReducer,
    // Altri reducer possono essere aggiunti qui
  },
  // Opzionale: middleware, devTools, ecc.
});

// Opzionale: setup listeners per rtk-query
setupListeners(store.dispatch);

// Tipi per i dispatch e selettori
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 