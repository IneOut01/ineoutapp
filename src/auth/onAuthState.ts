import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { UserDoc } from '../config/firestoreSchema';

/**
 * Gestisce l'inizializzazione di un utente in Firestore dopo il login
 * Se il documento utente non esiste, lo crea con valori predefiniti
 */
export async function handleUserLogin(user: User) {
  if (!user) return;
  
  const { uid, email } = user;
  
  // Verifica se il documento utente esiste già
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  // Se l'utente non esiste, crea un nuovo documento
  if (!userSnap.exists()) {
    const userData: UserDoc = {
      email: email || '',
      createdAt: serverTimestamp() as any,
      plan: 'free', // Piano gratuito di default
      publishedCount: 0
    };
    
    await setDoc(userRef, userData);
    console.log('Nuovo utente creato in Firestore:', uid);
  }
  
  return userSnap.exists() ? userSnap.data() : null;
} 