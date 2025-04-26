import { useCallback } from 'react';

// Dictionary of common words that can be used for suggestions
const DEFAULT_DICTIONARY = [
  // Comuni termini immobiliari in italiano
  'appartamento', 'casa', 'villa', 'monolocale', 'bilocale', 'trilocale', 'quadrilocale',
  'affitto', 'vendita', 'asta', 'mutuo', 'agenzia', 'immobiliare', 'catasto',
  'residenziale', 'commerciale', 'industriale', 'rustico', 'terreno', 'garage',
  'box', 'cantina', 'mansarda', 'attici', 'giardino', 'balcone', 'terrazza',
  'piano', 'ascensore', 'portineria', 'condominio', 'locazione', 
  
  // Città italiane più grandi
  'roma', 'milano', 'napoli', 'torino', 'palermo', 'genova', 'bologna', 'firenze',
  'bari', 'catania', 'venezia', 'verona', 'messina', 'padova', 'trieste',
  
  // Termini di ricerca comuni
  'vicino', 'centro', 'periferia', 'stazione', 'metro', 'scuola', 'università',
  'ospedale', 'parco', 'mare', 'montagna', 'lago', 'nuovo', 'ristrutturato',
  'arredato', 'non arredato', 'classe energetica', 'riscaldamento',
  'aria condizionata', 'parcheggio', 'posto auto'
];

/**
 * Calcola la distanza di Levenshtein tra due stringhe
 * @param a Prima stringa
 * @param b Seconda stringa
 * @returns La distanza di Levenshtein
 */
const levenshteinDistance = (a: string, b: string): number => {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // inserimento
        matrix[j - 1][i] + 1, // eliminazione
        matrix[j - 1][i - 1] + indicator // sostituzione
      );
    }
  }

  return matrix[b.length][a.length];
};

interface UseAutoCorrectOptions {
  dictionary?: string[];
  threshold?: number;
  maxSuggestions?: number;
}

/**
 * Hook per la correzione automatica dei termini in base a un dizionario
 */
const useAutoCorrect = ({
  dictionary = DEFAULT_DICTIONARY,
  threshold = 2, // Distanza massima per considerare una parola simile
  maxSuggestions = 3, // Numero massimo di suggerimenti
}: UseAutoCorrectOptions = {}) => {

  /**
   * Ottiene suggerimenti per una parola potenzialmente errata
   * @param word La parola da correggere
   * @returns Array di suggerimenti ordinati per similarità
   */
  const getSuggestions = useCallback((word: string): string[] => {
    if (!word || word.length < 3) return [];
    
    const lowercaseWord = word.toLowerCase().trim();
    
    // Se la parola è già nel dizionario, non serve correzione
    if (dictionary.includes(lowercaseWord)) return [];
    
    // Calcola la distanza per ogni parola nel dizionario
    const distances = dictionary.map(dictWord => ({
      word: dictWord,
      distance: levenshteinDistance(lowercaseWord, dictWord)
    }));
    
    // Filtra le parole con distanza entro la soglia e ordina per distanza
    return distances
      .filter(item => item.distance <= threshold)
      .sort((a, b) => a.distance - b.distance)
      .map(item => item.word)
      .slice(0, maxSuggestions);
  }, [dictionary, threshold, maxSuggestions]);

  /**
   * Analizza una query di ricerca e suggerisce correzioni per termini potenzialmente errati
   * @param query La query di ricerca da analizzare
   * @returns Oggetto con la query corretta e informazioni sulle correzioni
   */
  const correctQuery = useCallback((query: string) => {
    if (!query) return { corrected: '', hasCorrections: false, original: '' };
    
    const words = query.split(/\s+/);
    let hasCorrections = false;
    const corrections: { original: string; suggestion: string }[] = [];
    
    const correctedWords = words.map(word => {
      // Ignora parole troppo corte
      if (word.length < 3) return word;
      
      const suggestions = getSuggestions(word);
      if (suggestions.length > 0) {
        hasCorrections = true;
        corrections.push({ original: word, suggestion: suggestions[0] });
        return suggestions[0]; // Usa il primo suggerimento (più probabile)
      }
      
      return word;
    });
    
    return {
      original: query,
      corrected: correctedWords.join(' '),
      hasCorrections,
      corrections
    };
  }, [getSuggestions]);

  return {
    getSuggestions,
    correctQuery
  };
};

export default useAutoCorrect; 