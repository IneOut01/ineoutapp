import axios from 'axios';

export const testApiConnection = async () => {
  try {
    console.log('🔄 Test connessione API a:', process.env.EXPO_PUBLIC_API_BASE_URL || 'N/A');
    
    // Imposta un timeout più breve per evitare blocchi
    const axiosConfig = { timeout: 5000 };
    
    if (!process.env.EXPO_PUBLIC_API_BASE_URL) {
      console.log('⚠️ EXPO_PUBLIC_API_BASE_URL non configurato, test API saltato');
      return false;
    }
    
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/healthcheck`,
        axiosConfig
      );
      console.log('✅ Connessione API riuscita:', response.data);
      return true;
    } catch (error) {
      console.log('⚠️ Errore primo tentativo API:', error.message || 'Errore sconosciuto');
      
      // Prova con endpoint alternativo
      try {
        console.log('🔄 Tentativo con endpoint alternativo "/"');
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_API_BASE_URL}/`,
          axiosConfig
        );
        console.log('✅ Connessione API riuscita all\'endpoint root:', response.data);
        return true;
      } catch (altError) {
        console.log('⚠️ Errore anche all\'endpoint alternativo:', altError.message || 'Errore sconosciuto');
        return false;
      }
    }
  } catch (error) {
    // Cattura errori non previsti per evitare di bloccare l'avvio dell'app
    console.log('⚠️ Errore imprevisto durante test API:', error);
    return false;
  }
}; 