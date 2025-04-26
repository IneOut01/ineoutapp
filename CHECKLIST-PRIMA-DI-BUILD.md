# Checklist Prima di Creare una Nuova Build Android

## Modifiche Apportate
✅ Sostituito mock di Firebase con configurazione reale
✅ Migliorata gestione degli errori in App.tsx
✅ Resa non bloccante la chiamata API all'avvio
✅ Corretto l'import di react-native-get-random-values
✅ Aggiunti console.log strategici
✅ Migliorati i permessi Android
✅ Ottimizzata la configurazione eas.json

## Verifica Prima di Build
- [ ] Verificare che l'import di 'react-native-get-random-values' sia il primo import in index.ts
- [ ] Verificare che Firebase sia configurato correttamente con le chiavi reali in src/config/firebaseConfig.ts
- [ ] Controllare che tutti i permessi necessari siano presenti in app.json
- [ ] Verificare che App.tsx abbia una robusta gestione degli errori  
- [ ] Verificare che la variabile `C0` sia correttamente inizializzata in fase di avvio
- [ ] Assicurarsi che la chiamata testApiConnection() non blocchi l'interfaccia

## Comandi per la Build

### Build Development APK (per test)
```
eas build --platform android --profile development
```

### Build Production APK 
```
eas build --platform android --profile apk
```

## Dopo l'Installazione
- [ ] Verificare che l'app si avvii correttamente
- [ ] Controllare i log per errori all'avvio
- [ ] Verificare che Firebase si connetta correttamente
- [ ] Testare le funzionalità principali di navigazione
- [ ] Verificare che l'autenticazione funzioni

## Note Importanti
- La configurazione di Firebase è stata modificata per usare l'implementazione reale invece del mock
- Sono stati aggiunti numerosi punti di log per facilitare il debug
- L'errore C0 dovrebbe essere risolto in caso si verifichi
- La gestione delle API è stata resa non bloccante

## In Caso di Problemi
1. Verificare i log per errori specifici
2. Controllare se Firebase si sta inizializzando correttamente
3. Verificare eventuali problemi di permessi
4. Controllare la versione di Android del dispositivo (minimo richiesto: Android 6.0) 