import { DocumentData, QuerySnapshot } from 'firebase/firestore';
import { Listing } from '../types/listing';

/**
 * Process query results from Firestore and convert them to typed Listing objects
 * @param querySnapshot - The Firestore query snapshot containing listing documents
 * @returns An array of processed listing objects
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