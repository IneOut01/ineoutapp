// Define the Category type
export interface Category {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

// Create an array of property categories
export const propertyCategories: Category[] = [
  {
    id: 'apartment',
    name: 'Appartamento',
    icon: 'building',
    description: 'Appartamenti completi per affitti a lungo termine'
  },
  {
    id: 'room',
    name: 'Stanza',
    icon: 'door-open',
    description: 'Stanze singole o condivise in appartamenti'
  },
  {
    id: 'house',
    name: 'Casa',
    icon: 'home',
    description: 'Case indipendenti o ville per famiglie'
  },
  {
    id: 'studio',
    name: 'Monolocale',
    icon: 'cube',
    description: 'Monolocali compatti per una o due persone'
  },
  {
    id: 'student',
    name: 'Studenti',
    icon: 'graduation-cap',
    description: 'Alloggi per studenti vicino alle università'
  },
  {
    id: 'short_term',
    name: 'Breve Termine',
    icon: 'calendar-week',
    description: 'Affitti a breve termine per viaggiatori'
  },
  {
    id: 'luxury',
    name: 'Lusso',
    icon: 'gem',
    description: 'Proprietà di lusso con servizi premium'
  },
  {
    id: 'new',
    name: 'Nuove Costruzioni',
    icon: 'hammer',
    description: 'Proprietà di nuova costruzione o recentemente ristrutturate'
  }
];

export default propertyCategories; 