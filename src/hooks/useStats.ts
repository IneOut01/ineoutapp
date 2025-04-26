import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import { UserDoc } from '../config/firestoreSchema';

export interface UserStats {
  publishedCount: number;
  plan: string;
  loading: boolean;
  error: string | null;
}

/**
 * Hook personalizzato per recuperare le statistiche dell'utente
 * Restituisce il numero di annunci pubblicati e il piano attuale
 */
export const useStats = (): UserStats => {
  const [stats, setStats] = useState<UserStats>({
    publishedCount: 0,
    plan: 'free',
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          setStats(prev => ({
            ...prev,
            loading: false
          }));
          return;
        }

        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserDoc;
          setStats({
            publishedCount: userData.publishedCount || 0,
            plan: userData.plan || 'free',
            loading: false,
            error: null
          });
        } else {
          setStats({
            publishedCount: 0,
            plan: 'free',
            loading: false,
            error: 'Dati utente non trovati'
          });
        }
      } catch (error) {
        setStats({
          publishedCount: 0,
          plan: 'free',
          loading: false,
          error: 'Errore nel recupero dei dati'
        });
        console.error('Error fetching user stats:', error);
      }
    };

    fetchUserStats();
  }, []);

  return stats;
};

export default useStats; 