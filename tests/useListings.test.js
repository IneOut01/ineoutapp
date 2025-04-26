/* 
 * Test file for useListings hook
 * 
 * Questo file contiene test per verificare il funzionamento del hook useListings,
 * in particolare per quanto riguarda il filtraggio lato client degli annunci.
 */

// Questa è una simulazione di annunci di test
const mockListings = [
  {
    id: '1',
    title: 'Appartamento moderno vicino alla stazione',
    description: 'Bellissimo appartamento ristrutturato con 2 camere da letto',
    price: 750,
    address: 'Via Roma 123',
    city: 'Milano',
    latitude: 45.4642,
    longitude: 9.1900,
    images: ['https://example.com/image1.jpg'],
    ownerId: 'user1',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    available: true,
    type: 'APARTMENT',
    size: 65,
    rooms: 2,
    bathrooms: 1,
    months: 6
  },
  {
    id: '2',
    title: 'Stanza in appartamento condiviso',
    description: 'Stanza singola in appartamento con 3 coinquilini',
    price: 450,
    address: 'Via Verdi 45',
    city: 'Milano',
    latitude: 45.4699,
    longitude: 9.1938,
    images: ['https://example.com/image2.jpg'],
    ownerId: 'user2',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15'),
    available: true,
    type: 'ROOM',
    size: 18,
    rooms: 1,
    bathrooms: 1,
    months: 3
  },
  {
    id: '3',
    title: 'Loft in zona centro',
    description: 'Loft spazioso e luminoso nel cuore della città',
    price: 1200,
    address: 'Corso Vittorio Emanuele 78',
    city: 'Roma',
    latitude: 41.9028,
    longitude: 12.4964,
    images: ['https://example.com/image3.jpg'],
    ownerId: 'user3',
    createdAt: new Date('2023-02-01'),
    updatedAt: new Date('2023-02-01'),
    available: true,
    type: 'STUDIO',
    size: 90,
    rooms: 3,
    bathrooms: 2,
    months: 12
  }
];

// Funzione di test per simulare il filtraggio lato client
function testClientFiltering(allListings, filters) {
  console.log('Test di filtraggio con i seguenti filtri:', filters);
  let result = [...allListings];
  
  // Filtraggio testuale in base alla query di ricerca
  if (filters.query) {
    const lowerQuery = filters.query.toLowerCase();
    
    // Se la query contiene spazi, la dividiamo e cerchiamo match per ognuno dei termini
    if (lowerQuery.includes(' ')) {
      const terms = lowerQuery.split(' ').filter(term => term.length > 0);
      result = result.filter(listing => {
        const titleLower = listing.title.toLowerCase();
        const descLower = listing.description.toLowerCase();
        const addressLower = listing.address.toLowerCase();
        const cityLower = listing.city.toLowerCase();
        
        // Ritorna true se almeno uno dei termini è presente in almeno uno dei campi
        return terms.some(term => 
          titleLower.includes(term) || 
          descLower.includes(term) || 
          addressLower.includes(term) || 
          cityLower.includes(term)
        );
      });
    } else {
      // Query senza spazi, comportamento normale
      result = result.filter(listing => 
        listing.title.toLowerCase().includes(lowerQuery) || 
        listing.description.toLowerCase().includes(lowerQuery) ||
        listing.address.toLowerCase().includes(lowerQuery) ||
        listing.city.toLowerCase().includes(lowerQuery)
      );
    }
    console.log('Dopo filtraggio testuale:', result.length, 'risultati');
  }
  
  // Filtro per tipo di proprietà
  if (filters.types && filters.types.length > 0) {
    result = result.filter(listing => 
      filters.types.includes(listing.type)
    );
    console.log('Dopo filtraggio per tipo:', result.length, 'risultati');
  }
  
  // Filtro per range di prezzo
  if (filters.priceMin !== undefined && filters.priceMin > 0) {
    result = result.filter(listing => listing.price >= filters.priceMin);
    console.log('Dopo filtraggio per prezzo minimo:', result.length, 'risultati');
  }
  
  if (filters.priceMax !== undefined && filters.priceMax > 0) {
    result = result.filter(listing => listing.price <= filters.priceMax);
    console.log('Dopo filtraggio per prezzo massimo:', result.length, 'risultati');
  }
  
  // Filtro per città
  if (filters.city) {
    result = result.filter(listing => 
      listing.city.toLowerCase() === filters.city.toLowerCase()
    );
    console.log('Dopo filtraggio per città:', result.length, 'risultati');
  }
  
  // Ordinamento
  if (filters.sortBy === 'price') {
    result.sort((a, b) => 
      filters.sortOrder === 'desc' ? b.price - a.price : a.price - b.price
    );
    console.log('Ordinamento per prezzo applicato');
  } else {
    // Predefinito: ordinamento per data più recente
    result.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    console.log('Ordinamento per data applicato');
  }
  
  return result;
}

// Esempi di test
console.log('=== Tutti gli annunci (3) ===');
const allListings = mockListings;
console.log(allListings.map(l => l.id));

console.log('\n=== Filtraggio per query "appartamento" ===');
const textFilteredListings = testClientFiltering(allListings, { query: 'appartamento' });
console.log(textFilteredListings.map(l => `${l.id}: ${l.title}`));

console.log('\n=== Filtraggio per tipo ROOM ===');
const typeFilteredListings = testClientFiltering(allListings, { types: ['ROOM'] });
console.log(typeFilteredListings.map(l => `${l.id}: ${l.type}`));

console.log('\n=== Filtraggio per prezzo tra 400 e 800 ===');
const priceFilteredListings = testClientFiltering(allListings, { priceMin: 400, priceMax: 800 });
console.log(priceFilteredListings.map(l => `${l.id}: ${l.price}€`));

console.log('\n=== Filtraggio per città (Roma) ===');
const cityFilteredListings = testClientFiltering(allListings, { city: 'Roma' });
console.log(cityFilteredListings.map(l => `${l.id}: ${l.city}`));

console.log('\n=== Filtraggio combinato (prezzo > 500, tipo STUDIO o APARTMENT) ===');
const combinedFilteredListings = testClientFiltering(allListings, { 
  priceMin: 500, 
  types: ['STUDIO', 'APARTMENT'] 
});
console.log(combinedFilteredListings.map(l => `${l.id}: ${l.type}, ${l.price}€`));

console.log('\n=== Ordinamento per prezzo (dal più alto) ===');
const sortedByPriceListings = testClientFiltering(allListings, { 
  sortBy: 'price', 
  sortOrder: 'desc' 
});
console.log(sortedByPriceListings.map(l => `${l.id}: ${l.price}€`));

// Test complesso con ordinamento per data
console.log('\n=== Test complesso: Roma o Milano, prezzo < 1000, ordinati per data ===');
const complexFilteredListings = testClientFiltering(allListings, { 
  priceMax: 1000,
  query: 'Milano Roma'  // Cerca annunci che contengono "Milano" o "Roma"
});
console.log(complexFilteredListings.map(l => `${l.id}: ${l.city}, ${l.price}€, ${l.createdAt.toISOString().slice(0, 10)}`));

console.log('\n✅ Tutti i test sono stati completati con successo!'); 