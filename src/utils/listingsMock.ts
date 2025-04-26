import { Listing } from '../types/listing';

/**
 * Mock data di annunci per testing e fallback in caso di errore
 */
export const mockListings: Listing[] = [
  {
    id: 'mock-listing-1',
    userId: 'mock-user',
    title: 'Appartamento spazioso in centro città',
    description: 'Bellissimo appartamento ristrutturato nel cuore della città. Vicino a tutti i servizi.',
    price: 850,
    type: 'apartment',
    address: 'Via Roma 123',
    city: 'Milano',
    latitude: 45.464664,
    longitude: 9.188540,
    photos: [
      'https://firebasestorage.googleapis.com/v0/b/inout-app-1234.appspot.com/o/listings%2Fmock1.jpg?alt=media'
    ],
    rooms: 3,
    size: 85,
    months: 12,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    featured: true,
    status: 'active'
  },
  {
    id: 'mock-listing-2',
    userId: 'mock-user',
    title: 'Monolocale moderno vicino università',
    description: 'Monolocale arredato ideale per studenti. A soli 5 minuti a piedi dall\'università.',
    price: 550,
    type: 'studio',
    address: 'Via Università 45',
    city: 'Bologna',
    latitude: 44.496761,
    longitude: 11.350988,
    photos: [
      'https://firebasestorage.googleapis.com/v0/b/inout-app-1234.appspot.com/o/listings%2Fmock2.jpg?alt=media'
    ],
    rooms: 1,
    size: 35,
    months: 9,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    featured: false,
    status: 'active'
  },
  {
    id: 'mock-listing-3',
    userId: 'mock-user',
    title: 'Villa con giardino in zona residenziale',
    description: 'Splendida villa con ampio giardino, piscina e garage doppio. Ideale per famiglie.',
    price: 1800,
    type: 'house',
    address: 'Via dei Pini 78',
    city: 'Roma',
    latitude: 41.907971,
    longitude: 12.498528,
    photos: [
      'https://firebasestorage.googleapis.com/v0/b/inout-app-1234.appspot.com/o/listings%2Fmock3.jpg?alt=media'
    ],
    rooms: 5,
    size: 180,
    months: 24,
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    featured: true,
    status: 'active'
  },
  {
    id: 'mock-listing-4',
    userId: 'mock-user',
    title: 'Loft industriale ristrutturato',
    description: 'Loft di design in ex area industriale completamente ristrutturata. Soffitti alti e spazi aperti.',
    price: 1200,
    type: 'loft',
    address: 'Via dell\'Industria 92',
    city: 'Torino',
    latitude: 45.070312,
    longitude: 7.686856,
    photos: [
      'https://firebasestorage.googleapis.com/v0/b/inout-app-1234.appspot.com/o/listings%2Fmock4.jpg?alt=media'
    ],
    rooms: 2,
    size: 110,
    months: 6,
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 259200000).toISOString(),
    featured: false,
    status: 'active'
  },
  {
    id: 'mock-listing-5',
    userId: 'mock-user',
    title: 'Bilocale luminoso con terrazzo',
    description: 'Grazioso bilocale con ampio terrazzo abitabile e vista panoramica. Completo di tutti i comfort.',
    price: 750,
    type: 'apartment',
    address: 'Via del Mare 15',
    city: 'Genova',
    latitude: 44.407114,
    longitude: 8.933883,
    photos: [
      'https://firebasestorage.googleapis.com/v0/b/inout-app-1234.appspot.com/o/listings%2Fmock5.jpg?alt=media'
    ],
    rooms: 2,
    size: 60,
    months: 12,
    createdAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
    updatedAt: new Date(Date.now() - 345600000).toISOString(),
    featured: true,
    status: 'active'
  }
]; 