import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';

// Login con email e password
export async function login(email: string, password: string) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// Registrazione con email e password
export async function signup(email: string, password: string, displayName?: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Se è stato fornito un displayName, aggiorniamo il profilo utente
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
    }
    
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// Logout
export function logout() {
  return signOut(auth);
} 