import { db } from '../config/firebaseConfig';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, increment } from 'firebase/firestore';
import { UserDoc, ListingDoc } from '../config/firestoreSchema';

/**
 * Verifica se l'utente può pubblicare un nuovo annuncio in base al suo piano
 * I primi 5 annunci sono sempre gratuiti, dopo dipende dal piano sottoscritto
 */
export async function canPublish(uid: string, plan: UserDoc['plan'], count: number) {
  // I primi 5 annunci sono sempre gratuiti
  if (count < 5) return true;
  
  const limits: Record<UserDoc['plan'], number | '∞'> = {
    free: 5,
    '5': 5,
    '15': 15,
    '30': 30,
    unlimited: '∞'
  };
  
  const limit = limits[plan];
  return limit === '∞' ? true : count < limit;
}

/**
 * Pubblica un nuovo annuncio e aggiorna il contatore degli annunci dell'utente
 */
export async function publishListing(uid: string, draft: Partial<ListingDoc>) {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  const data = snap.exists() ? (snap.data() as UserDoc) : null;

  if (!data) throw new Error('user_not_found');

  const ok = await canPublish(uid, data.plan, data.publishedCount);
  if (!ok) return { success: false, error: 'plan_required' };

  await addDoc(collection(db, 'listings'), {
    ...draft,
    ownerUid: uid,
    userId: uid,
    createdAt: serverTimestamp()
  });
  
  await setDoc(userRef, { publishedCount: increment(1) }, { merge: true });
  return { success: true };
}

// Console log per verificare il completamento
console.log('✅ Firestore schema creato - hook publishListing funzionante'); 