import emailjs from '@emailjs/browser';
import Constants from 'expo-constants';

// Ottieni le credenziali EmailJS dalle variabili d'ambiente
const EMAILJS_SERVICE_ID = Constants.expoConfig?.extra?.EXPO_PUBLIC_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID = Constants.expoConfig?.extra?.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_USER_ID = Constants.expoConfig?.extra?.EXPO_PUBLIC_EMAILJS_USER_ID || '';

/**
 * Service for sending emails to users
 */
export const emailService = {
  /**
   * Verifica se EmailJS è configurato correttamente
   */
  isConfigured: (): boolean => {
    return !!(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_USER_ID);
  },

  /**
   * Send a confirmation email after a successful subscription payment
   * @param userEmail Email address of the user
   * @param userName Name of the user
   * @param subscriptionDetails Details of the subscription (plan name, price, etc.)
   * @returns Promise that resolves when the email is sent
   */
  sendConfirmationEmail: async (
    userEmail: string,
    userName: string,
    subscriptionDetails: {
      planTitle: string;
      planPrice: string;
      expiryDate: string;
    }
  ): Promise<{success: boolean; message: string}> => {
    if (!emailService.isConfigured()) {
      console.warn('EmailJS non configurato. Impossibile inviare email di conferma.');
      return { success: false, message: 'Servizio email non configurato' };
    }
    
    try {
      // Prepare template parameters
      const templateParams = {
        to_email: userEmail,
        to_name: userName,
        plan_name: subscriptionDetails.planTitle,
        plan_price: subscriptionDetails.planPrice,
        expiry_date: new Date(subscriptionDetails.expiryDate).toLocaleDateString('it-IT'),
        date: new Date().toLocaleDateString('it-IT'),
        message: `Grazie per aver sottoscritto il piano ${subscriptionDetails.planTitle}. Il tuo abbonamento è ora attivo e valido fino al ${new Date(subscriptionDetails.expiryDate).toLocaleDateString('it-IT')}.`
      };
      
      // Send the email
      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_USER_ID
      );
      
      console.log('Email inviata con successo:', response.status, response.text);
      return { success: true, message: 'Email di conferma inviata' };
    } catch (error) {
      console.error('Errore nell\'invio dell\'email:', error);
      return { success: false, message: 'Errore nell\'invio dell\'email' };
    }
  },
  
  /**
   * Send a payment receipt email
   * @param userEmail Email address of the user
   * @param userName Name of the user
   * @param paymentDetails Details of the payment (amount, date, etc.)
   * @returns Promise that resolves when the email is sent
   */
  sendReceiptEmail: async (
    userEmail: string,
    userName: string,
    paymentDetails: {
      planTitle: string;
      planPrice: string;
      paymentMethod: string;
      paymentId?: string;
      date: Date;
    }
  ): Promise<{success: boolean; message: string}> => {
    if (!emailService.isConfigured()) {
      console.warn('EmailJS non configurato. Impossibile inviare ricevuta.');
      return { success: false, message: 'Servizio email non configurato' };
    }
    
    try {
      // Prepare template parameters
      const templateParams = {
        to_email: userEmail,
        to_name: userName,
        plan_name: paymentDetails.planTitle,
        amount: paymentDetails.planPrice,
        payment_method: paymentDetails.paymentMethod,
        payment_id: paymentDetails.paymentId || 'N/A',
        date: paymentDetails.date.toLocaleDateString('it-IT'),
        message: `Questo è il tuo riepilogo di pagamento per il piano ${paymentDetails.planTitle}. Grazie per aver scelto INEOUT!`
      };
      
      // Send the email
      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_USER_ID
      );
      
      console.log('Ricevuta inviata con successo:', response.status, response.text);
      return { success: true, message: 'Ricevuta inviata con successo' };
    } catch (error) {
      console.error('Errore nell\'invio della ricevuta:', error);
      return { success: false, message: 'Errore nell\'invio della ricevuta' };
    }
  }
};