import * as yup from 'yup';

// Schema di validazione per il form di pubblicazione dell'annuncio
export const publishListingSchema = yup.object({
  title: yup
    .string()
    .required('Il titolo è obbligatorio')
    .min(10, 'Il titolo deve essere di almeno 10 caratteri')
    .max(100, 'Il titolo non può superare i 100 caratteri'),
  
  description: yup
    .string()
    .required('La descrizione è obbligatoria')
    .min(50, 'La descrizione deve essere di almeno 50 caratteri')
    .max(1000, 'La descrizione non può superare i 1000 caratteri'),
  
  price: yup
    .number()
    .required('Il prezzo è obbligatorio')
    .positive('Il prezzo deve essere positivo')
    .max(10000, 'Il prezzo non può superare 10.000€'),
  
  m2: yup
    .number()
    .required('I metri quadri sono obbligatori')
    .positive('I metri quadri devono essere positivi')
    .max(500, 'I metri quadri non possono superare 500'),
  
  months: yup
    .number()
    .required('La durata minima è obbligatoria')
    .min(1, 'La durata minima deve essere di almeno 1 mese')
    .max(12, 'La durata massima è di 12 mesi'),
  
  city: yup
    .string()
    .required('La città è obbligatoria')
    .min(2, 'Il nome della città deve essere di almeno 2 caratteri'),
  
  type: yup
    .string()
    .required('Il tipo di immobile è obbligatorio')
    .oneOf(['stanza', 'bilocale', 'monolocale', 'studio'], 'Seleziona un tipo di immobile valido'),
  
  images: yup
    .array()
    .min(1, 'Carica almeno un\'immagine')
    .max(5, 'Non puoi caricare più di 5 immagini')
});

export type PublishListingFormData = yup.InferType<typeof publishListingSchema>;

export default publishListingSchema; 