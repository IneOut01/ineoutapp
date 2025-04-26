import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { I18nManager } from 'react-native';

// Importo i file delle traduzioni
import en from './locales/en.json';
import it from './locales/it.json';

// Rilevo la lingua del dispositivo
const deviceLanguage = Localization.locale.split('-')[0];

// Lingue supportate dall'app
const LANGUAGES = {
  en: 'English',
  it: 'Italiano',
};

// Configuro i18next
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en: { translation: en },
      it: { translation: it },
    },
    lng: deviceLanguage in LANGUAGES ? deviceLanguage : 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Controllo della direzione del testo (LTR/RTL)
// Attualmente non supportiamo lingue RTL, ma è buona pratica impostarlo
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

export default i18n;
export { LANGUAGES }; 