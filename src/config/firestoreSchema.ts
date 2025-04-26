import { FirebaseFirestore } from '@firebase/firestore-types';

export interface UserDoc {
  email: string;
  createdAt: FirebaseFirestore.Timestamp;
  plan: 'free' | '5' | '10' | '15' | '30' | 'unlimited';
  publishedCount: number;
  favoriteListings?: string[]; // Array degli ID degli annunci preferiti
}

export interface ListingDoc {
  ownerUid: string;
  type: 'stanza' | 'bilocale' | 'monolocale' | 'studio';
  title: string;
  description: string;
  price: number;
  city: string;
  m2: number;
  months: number;     // minimo soggiorno
  images: string[];
  createdAt: FirebaseFirestore.Timestamp;
} 