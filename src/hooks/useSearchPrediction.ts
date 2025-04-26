import { useCallback, useMemo } from 'react';
import useSearchHistory, { SearchHistoryItem } from './useSearchHistory';

interface SearchPredictionOptions {
  maxPredictions?: number;
  recentWeight?: number;    // Peso per la recenza (valore da 0 a 1)
  frequencyWeight?: number; // Peso per la frequenza (valore da 0 a 1)
  daysFactor?: number;      // Fattore di decadimento temporale in giorni
}

/**
 * Hook che analizza la cronologia di ricerca dell'utente per predire e suggerire
 * luoghi o termini di ricerca in base alle sue abitudini di utilizzo.
 * @param options Opzioni di configurazione per le predizioni
 */
const useSearchPrediction = (options: SearchPredictionOptions = {}) => {
  const {
    maxPredictions = 5,
    recentWeight = 0.7,
    frequencyWeight = 0.3,
    daysFactor = 7
  } = options;

  const { history } = useSearchHistory();

  /**
   * Calcola un punteggio di rilevanza per un elemento della cronologia
   * basato su recenza e frequenza d'uso
   */
  const calculateRelevanceScore = useCallback((item: SearchHistoryItem, allItems: SearchHistoryItem[]) => {
    // Calcolo score basato sulla recenza (timestamp più recente = punteggio più alto)
    const now = Date.now();
    const ageInDays = (now - item.timestamp) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.exp(-ageInDays / daysFactor); // Decadimento esponenziale
    
    // Calcolo score basato sulla frequenza (quante volte appare un termine simile)
    const similarItems = allItems.filter(historyItem => 
      historyItem.query.toLowerCase().includes(item.query.toLowerCase()) ||
      item.query.toLowerCase().includes(historyItem.query.toLowerCase())
    );
    
    const frequencyScore = similarItems.length / Math.max(allItems.length, 1);
    
    // Score combinato con pesi configurabili
    return (recencyScore * recentWeight) + (frequencyScore * frequencyWeight);
  }, [recentWeight, frequencyWeight, daysFactor]);

  /**
   * Ottiene predizioni in base alla cronologia di ricerca
   * opzionalmente filtrabili con un termine di ricerca parziale
   * @param partialQuery Termine di ricerca parziale per filtrare le predizioni
   */
  const getPredictions = useCallback((partialQuery?: string) => {
    if (!history.length) return [];
    
    // Rimuovi duplicati basati sulla query
    const uniqueHistory = history.reduce<SearchHistoryItem[]>((acc, item) => {
      if (!acc.some(i => i.query.toLowerCase() === item.query.toLowerCase())) {
        acc.push(item);
      }
      return acc;
    }, []);
    
    // Filtra per query parziale se specificata
    const filteredHistory = partialQuery 
      ? uniqueHistory.filter(item => 
          item.query.toLowerCase().includes(partialQuery.toLowerCase()))
      : uniqueHistory;
    
    // Calcola punteggi e ordina
    return filteredHistory
      .map(item => ({
        ...item,
        score: calculateRelevanceScore(item, history)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxPredictions);
  }, [history, calculateRelevanceScore, maxPredictions]);

  /**
   * Ottiene le predizioni più probabili in base alla località
   * @param area Area geografica di interesse (es. città o regione)
   */
  const getPredictionsByArea = useCallback((area: string) => {
    // Filtra per area geografica
    const areaHistory = history.filter(item => 
      item.query.toLowerCase().includes(area.toLowerCase()) ||
      (item.type === 'place' && item.data?.address?.toLowerCase()?.includes(area.toLowerCase()))
    );
    
    return areaHistory
      .map(item => ({
        ...item,
        score: calculateRelevanceScore(item, history)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxPredictions);
  }, [history, calculateRelevanceScore, maxPredictions]);

  /**
   * Calcola e memorizza le predizioni prioritarie (top N)
   */
  const topPredictions = useMemo(() => {
    return getPredictions();
  }, [getPredictions]);

  return {
    getPredictions,
    getPredictionsByArea,
    topPredictions
  };
};

export default useSearchPrediction; 