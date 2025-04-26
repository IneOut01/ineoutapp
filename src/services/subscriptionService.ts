import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp, 
  collection,
  query, 
  where, 
  getDocs,
  DocumentReference
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../config/firebaseConfig';

export interface Subscription {
  userId: string;
  planId: string;
  planTitle: string;
  planPrice: string;
  planDescription: string;
  planValue: string;
  startDate: any; // serverTimestamp
  expiryDate?: string;
  status: 'active' | 'expired' | 'canceled';
  paymentMethod: 'stripe' | 'card' | 'apple_pay' | 'google_pay';
  paymentId?: string;
  createdAt: any; // serverTimestamp
  updatedAt: any; // serverTimestamp
}

/**
 * Servizio per la gestione degli abbonamenti
 */
export const subscriptionService = {
  /**
   * Salva o aggiorna un abbonamento nel database
   * @param subscription Dati dell'abbonamento
   * @returns Promise che risolve con il riferimento al documento
   */
  saveSubscription: async (subscription: Omit<Subscription, 'createdAt' | 'updatedAt' | 'startDate'>): Promise<DocumentReference> => {
    const { userId } = subscription;
    const subscriptionRef = doc(db, 'subscriptions', userId);

    // Verifica se l'abbonamento esiste già
    const existing = await getDoc(subscriptionRef);
    
    if (existing.exists()) {
      // Aggiorna l'abbonamento esistente
      await setDoc(subscriptionRef, {
        ...subscription,
        startDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      console.log('Abbonamento aggiornato con successo');
    } else {
      // Crea un nuovo abbonamento
      await setDoc(subscriptionRef, {
        ...subscription,
        startDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      console.log('Nuovo abbonamento creato con successo');
    }
    
    // Aggiorna anche il profilo utente
    await this.updateUserProfile(userId, subscription.planId, subscription.planValue);
    
    return subscriptionRef;
  },
  
  /**
   * Aggiorna il profilo utente con i dati dell'abbonamento
   * @param userId ID dell'utente
   * @param planId ID del piano
   * @param planValue Valore del piano
   */
  updateUserProfile: async (userId: string, planId: string, planValue: string): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    
    await setDoc(userRef, {
      plan: planValue,
      planId: planId,
      planUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    console.log('Profilo utente aggiornato con piano:', planId);
  },
  
  /**
   * Ottiene l'abbonamento attivo dell'utente
   * @param userId ID dell'utente (opzionale, se non specificato usa l'utente corrente)
   * @returns L'abbonamento attivo o null se non esiste
   */
  getActiveSubscription: async (userId?: string): Promise<Subscription | null> => {
    // Se non è fornito un userId, usa l'utente corrente
    if (!userId) {
      const auth = getAuth();
      userId = auth.currentUser?.uid;
      
      if (!userId) {
        console.error('Nessun utente autenticato');
        return null;
      }
    }
    
    // Ottieni il documento dell'abbonamento
    const subscriptionRef = doc(db, 'subscriptions', userId);
    const subscriptionDoc = await getDoc(subscriptionRef);
    
    if (subscriptionDoc.exists()) {
      const data = subscriptionDoc.data() as Subscription;
      
      // Controlla che l'abbonamento sia attivo
      if (data.status === 'active') {
        return data;
      }
      
      console.log('Abbonamento trovato ma non è attivo');
      return null;
    }
    
    console.log('Nessun abbonamento trovato per l\'utente');
    return null;
  },
  
  /**
   * Verifica se l'utente ha un abbonamento attivo
   * @param userId ID dell'utente (opzionale)
   * @returns True se l'utente ha un abbonamento attivo
   */
  hasActiveSubscription: async (userId?: string): Promise<boolean> => {
    const subscription = await subscriptionService.getActiveSubscription(userId);
    return subscription !== null;
  },
  
  /**
   * Ottiene tutti gli abbonamenti di un utente
   * @param userId ID dell'utente
   * @returns Array di abbonamenti
   */
  getUserSubscriptions: async (userId: string): Promise<Subscription[]> => {
    const subscriptionsRef = collection(db, 'subscriptions');
    const q = query(subscriptionsRef, where('userId', '==', userId));
    
    const querySnapshot = await getDocs(q);
    const subscriptions: Subscription[] = [];
    
    querySnapshot.forEach((doc) => {
      subscriptions.push(doc.data() as Subscription);
    });
    
    return subscriptions;
  },
  
  /**
   * Crea un oggetto Subscription dalle informazioni di pagamento
   * @param planId ID del piano
   * @param planTitle Titolo del piano
   * @param planPrice Prezzo del piano
   * @param planDescription Descrizione del piano
   * @param paymentMethod Metodo di pagamento
   * @param paymentId ID del pagamento (opzionale)
   * @param durationMonths Durata in mesi (default 1)
   * @returns Oggetto Subscription
   */
  createSubscriptionFromPayment: (
    planId: string, 
    planTitle: string, 
    planPrice: string, 
    planDescription: string,
    planValue: string,
    paymentMethod: Subscription['paymentMethod'] = 'stripe',
    paymentId?: string,
    durationMonths: number = 1
  ): Omit<Subscription, 'createdAt' | 'updatedAt' | 'startDate'> => {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    
    if (!userId) {
      throw new Error('Utente non autenticato');
    }
    
    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(now.getMonth() + durationMonths);
    
    return {
      userId,
      planId,
      planTitle,
      planPrice,
      planDescription,
      planValue,
      expiryDate: expiryDate.toISOString(),
      status: 'active',
      paymentMethod,
      paymentId,
    };
  },

  /**
   * Disdice un abbonamento attivo dell'utente
   * @param userId ID dell'utente (opzionale, se non specificato usa l'utente corrente)
   * @returns Promise che risolve con true se l'operazione ha successo, false altrimenti
   */
  cancelSubscription: async (userId?: string): Promise<boolean> => {
    try {
      // Se non è fornito un userId, usa l'utente corrente
      if (!userId) {
        const auth = getAuth();
        userId = auth.currentUser?.uid;
        
        if (!userId) {
          console.error('Nessun utente autenticato');
          return false;
        }
      }
      
      // Ottieni il documento dell'abbonamento
      const subscriptionRef = doc(db, 'subscriptions', userId);
      const subscriptionDoc = await getDoc(subscriptionRef);
      
      if (!subscriptionDoc.exists()) {
        console.error('Nessun abbonamento trovato per l\'utente');
        return false;
      }
      
      // Aggiorna lo stato dell'abbonamento a 'canceled'
      await setDoc(subscriptionRef, {
        status: 'canceled',
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      // Aggiorna anche il profilo utente rimuovendo i riferimenti al piano
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        plan: null,
        planId: null,
        planUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      console.log('Abbonamento disdetto con successo');
      return true;
    } catch (error) {
      console.error('Errore nella disdetta dell\'abbonamento:', error);
      return false;
    }
  }
}; 