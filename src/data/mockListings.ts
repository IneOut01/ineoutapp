import { Listing } from '../types/listing';

/**
 * Dati simulati per gli annunci
 * Usati come fallback in caso di errori di connessione
 */
export const MOCK_LISTINGS: Listing[] = [
  {
    id: 'mock-listing-1',
    title: 'Appartamento spazioso in centro città',
    description: 'Bellissimo appartamento ristrutturato nel cuore della città. Vicino a tutti i servizi.',
    price: 850,
    type: 'apartment',
    address: 'Via Roma 123',
    city: 'Milano',
    latitude: 45.464664,
    longitude: 9.188540,
    images: [
      'https://firebasestorage.googleapis.com/v0/b/inout-app-1234.appspot.com/o/listings%2Fmock1.jpg?alt=media'
    ],
    rooms: 3,
    bathrooms: 1,
    size: 85,
    months: 12,
    ownerId: 'mock-user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    available: true
  },
  {
    id: 'mock-listing-2',
    title: 'Monolocale moderno vicino università',
    description: 'Monolocale arredato ideale per studenti. A soli 5 minuti a piedi dall\'università.',
    price: 550,
    type: 'studio',
    address: 'Via Università 45',
    city: 'Bologna',
    latitude: 44.496761,
    longitude: 11.350988,
    images: [
      'https://firebasestorage.googleapis.com/v0/b/inout-app-1234.appspot.com/o/listings%2Fmock2.jpg?alt=media'
    ],
    rooms: 1,
    bathrooms: 1,
    size: 35,
    months: 9,
    ownerId: 'mock-user-2',
    createdAt: new Date(Date.now() - 86400000), // Ieri
    updatedAt: new Date(Date.now() - 86400000),
    available: true
  },
  {
    id: 'mock-listing-3',
    title: 'Villa con giardino in zona residenziale',
    description: 'Splendida villa con ampio giardino, piscina e garage doppio. Ideale per famiglie.',
    price: 1800,
    type: 'house',
    address: 'Via dei Pini 78',
    city: 'Roma',
    latitude: 41.907971,
    longitude: 12.498528,
    images: [
      'https://firebasestorage.googleapis.com/v0/b/inout-app-1234.appspot.com/o/listings%2Fmock3.jpg?alt=media'
    ],
    rooms: 5,
    bathrooms: 3,
    size: 180,
    months: 24,
    ownerId: 'mock-user-3',
    createdAt: new Date(Date.now() - 172800000), // 2 giorni fa
    updatedAt: new Date(Date.now() - 172800000),
    available: true
  },
  {
    id: 'mock-listing-4',
    title: 'Loft industriale ristrutturato',
    description: 'Loft di design in ex area industriale completamente ristrutturata. Soffitti alti e spazi aperti.',
    price: 1200,
    type: 'loft',
    address: 'Via dell\'Industria 92',
    city: 'Torino',
    latitude: 45.070312,
    longitude: 7.686856,
    images: [
      'https://firebasestorage.googleapis.com/v0/b/inout-app-1234.appspot.com/o/listings%2Fmock4.jpg?alt=media'
    ],
    rooms: 2,
    bathrooms: 2,
    size: 110,
    months: 6,
    ownerId: 'mock-user-1',
    createdAt: new Date(Date.now() - 259200000), // 3 giorni fa
    updatedAt: new Date(Date.now() - 259200000),
    available: true
  },
  {
    id: 'mock-listing-5',
    title: 'Bilocale luminoso con terrazzo',
    description: 'Grazioso bilocale con ampio terrazzo abitabile e vista panoramica. Completo di tutti i comfort.',
    price: 750,
    type: 'apartment',
    address: 'Via del Mare 15',
    city: 'Genova',
    latitude: 44.407114,
    longitude: 8.933883,
    images: [
      'https://firebasestorage.googleapis.com/v0/b/inout-app-1234.appspot.com/o/listings%2Fmock5.jpg?alt=media'
    ],
    rooms: 2,
    bathrooms: 1,
    size: 60,
    months: 12,
    ownerId: 'mock-user-2',
    createdAt: new Date(Date.now() - 345600000), // 4 giorni fa
    updatedAt: new Date(Date.now() - 345600000),
    available: true
  }
]; 