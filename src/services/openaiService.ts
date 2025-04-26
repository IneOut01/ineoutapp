import OpenAI from 'openai';
import Constants from 'expo-constants';

// Creiamo un'istanza di OpenAI con la chiave API
const openai = new OpenAI({
  apiKey: Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true // Necessario per l'uso client-side
});

/**
 * Genera un titolo per un annuncio immobiliare
 * @param tipo Tipo di immobile (stanza, bilocale, monolocale, studio)
 * @param citta Città dove si trova l'immobile
 * @param prezzo Prezzo dell'immobile
 * @param m2 Metri quadri dell'immobile
 */
export async function generateTitle(tipo: string, citta: string, prezzo: number, m2: number) {
  try {
    const prompt = `Genera un titolo accattivante per un annuncio di ${tipo} a ${citta}, prezzo ${prezzo}€ e ${m2}mq.`;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Sei un agente immobiliare esperto nel creare titoli accattivanti. Rispondi solo con il titolo, senza aggiungere altro testo.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 50,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('Errore nella generazione del titolo:', error);
    return '';
  }
}

/**
 * Genera una descrizione per un annuncio immobiliare
 * @param tipo Tipo di immobile (stanza, bilocale, monolocale, studio)
 * @param citta Città dove si trova l'immobile
 * @param prezzo Prezzo dell'immobile
 * @param m2 Metri quadri dell'immobile
 * @param mesi Durata minima del contratto in mesi
 */
export async function generateDescription(tipo: string, citta: string, prezzo: number, m2: number, mesi: number) {
  try {
    const prompt = `Scrivi una descrizione dettagliata per un ${tipo} in affitto a ${citta}, ${m2}mq, ${mesi} mesi minimo, prezzo ${prezzo}€`;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Sei un agente immobiliare esperto nel creare descrizioni dettagliate e accattivanti. Descrivi l\'immobile in modo professionale, evidenziando i punti di forza e le caratteristiche principali.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 250,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('Errore nella generazione della descrizione:', error);
    return '';
  }
} 