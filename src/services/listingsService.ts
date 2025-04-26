import { collection, query, where, getDocs, orderBy, startAfter, limit, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Listing } from '../types/listing';

/**
 * Processa i risultati di una query Firestore e li converte in oggetti Listing
 * @param querySnapshot - Risultato della query Firestore
 * @returns Array di oggetti Listing
 */
export const processQueryResults = (querySnapshot: QuerySnapshot<DocumentData>): Listing[] => {
  let fetchedListings: Listing[] = [];
  
  querySnapshot.forEach((doc) => {
    try {
      const data = doc.data();
      
      // Gestione sicura dei valori mancanti con valori di fallback
      const listing: Listing = {
        id: doc.id,
        title: data.title || data.titolo || 'Annuncio senza titolo',
        description: data.description || data.descrizione || 'Nessuna descrizione disponibile',
        price: data.price || data.prezzo || 0,
        address: data.address || data.indirizzo || 'Indirizzo non disponibile',
        city: data.city || data.città || 'Città non specificata',
        latitude: parseFloat(data.latitude || data.latitudine || 0),
        longitude: parseFloat(data.longitude || data.longitudine || 0),
        images: Array.isArray(data.images) ? data.images : 
               (Array.isArray(data.immagini) && data.immagini.length > 0) ? data.immagini :
               (data.immagine ? [data.immagine] : 
               ['https://via.placeholder.com/400x300/cccccc/333333?text=Immagine+non+disponibile']),
        ownerId: data.ownerUid || data.ownerId || data.userId || 'proprietario sconosciuto',
        rooms: data.rooms || data.stanze || 0,
        bathrooms: data.bathrooms || data.bagni || 0,
        size: data.size || data.dimensione || data.m2 || 0,
        type: data.type || data.tipo || 'non specificato',
        months: data.months || data.mesi || 0,
        available: data.available !== false,
        createdAt: data.createdAt?.toDate?.() || data.timestamp?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || data.timestamp?.toDate?.() || new Date(),
      };
      
      fetchedListings.push(listing);
    } catch (itemError) {
      console.error('Errore durante l\'elaborazione di un annuncio:', itemError);
      // Continua con il prossimo annuncio se uno ha problemi
    }
  });
  
  return fetchedListings;
};

/**
 * Recupera tutti gli annunci dal database Firestore
 * @returns Promise con l'array di oggetti Listing
 */
export const fetchAllListings = async (): Promise<Listing[]> => {
  try {
    console.log('📊 Caricamento di tutti gli annunci dal database...');
    const listingsRef = collection(db, 'listings');
    
    // Query semplice senza limit per recuperare tutti gli annunci
    // Ordina per data di creazione (dal più recente)
    let q = query(listingsRef, orderBy('timestamp', 'desc'));
    
    console.log('🔄 Esecuzione query Firestore...');
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('⚠️ Nessun annuncio trovato nel database');
      return [];
    }
    
    console.log(`🔄 Elaborazione di ${querySnapshot.docs.length} annunci...`);
    const fetchedListings = processQueryResults(querySnapshot);
    console.log(`✅ Caricati ${fetchedListings.length} annunci con successo`);
    
    return fetchedListings;
  } catch (error) {
    console.error('❌ Errore durante il recupero degli annunci:', error);
    throw error;
  }
};

/**
 * Recupera una pagina di annunci dal database Firestore
 * @param lastDoc - Ultimo documento dell'ultima pagina caricata
 * @param pageSize - Dimensione della pagina
 * @returns Promise con l'array di oggetti Listing e l'ultimo documento
 */
export const fetchListingsPage = async (lastDoc: any, pageSize: number = 20): Promise<{ 
  listings: Listing[], 
  lastDoc: any 
}> => {
  try {
    const listingsRef = collection(db, 'listings');
    let q = query(listingsRef, orderBy('timestamp', 'desc'));
    
    // Se abbiamo già caricato degli annunci, carichiamo a partire dall'ultimo
    if (lastDoc) {
      q = query(q, startAfter(lastDoc), limit(pageSize));
    } else {
      q = query(q, limit(pageSize));
    }
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { listings: [], lastDoc: lastDoc };
    }
    
    const fetchedListings = processQueryResults(querySnapshot);
    const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    return { 
      listings: fetchedListings, 
      lastDoc: newLastDoc 
    };
  } catch (error) {
    console.error('❌ Errore durante il recupero della pagina di annunci:', error);
    throw error;
  }
}; 