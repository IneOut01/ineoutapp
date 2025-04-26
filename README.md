# In&Out App

Un'applicazione mobile per l'autenticazione con Firebase.

## Configurazione

1. Crea un file `.env` nella root del progetto con le seguenti variabili:

```
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google OAuth (dalla console Google Cloud)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id
```

2. Sostituisci i valori con le tue credenziali Firebase e Google.

3. **Configurazione Google OAuth per Expo Go:**
   - Vai alla [Console Google Cloud](https://console.cloud.google.com/)
   - Seleziona il tuo progetto
   - Vai a "Credenziali" → "ID client OAuth 2.0" → seleziona il tuo Web Client ID
   - Nella sezione "URI di reindirizzamento autorizzati", aggiungi **solo** il seguente URI:
     ```
     https://auth.expo.io/@ineout01/in-and-out
     ```
   - **IMPORTANTE**: Assicurati che l'URI corrisponda esattamente al tuo account Expo (`@ineout01`) e al nome dello slug in app.json (`in-and-out`)
   - Lo slug e l'owner in app.json devono corrispondere esattamente a quelli dell'URI di reindirizzamento
   - Salva le modifiche

## Avvio dell'applicazione

Per avviare l'applicazione, esegui:

```
npx expo start --clear --tunnel
```

## Struttura del progetto

- `src/auth`: Servizi di autenticazione (Firebase, Google)
- `src/config`: Configurazioni Firebase e altre
- `src/screens`: Schermate dell'app (Login, Signup, Home)
- `src/navigation`: Gestione della navigazione 