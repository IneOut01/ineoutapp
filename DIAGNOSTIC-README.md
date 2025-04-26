# Modalità Diagnostic per In&Out

Questa modalità è stata creata per diagnosticare e risolvere il problema della "schermata bianca" che appare dopo l'installazione dell'app su dispositivi Android.

## Cosa Fa la Modalità Diagnostic

- Attiva un avanzato sistema di logging degli errori
- Mostra un overlay con informazioni dettagliate sui problemi
- Invia automaticamente i log di errore al server (quando possibile)
- Cattura problemi non visibili nella versione normale
- Mostra dettagli su Firebase, API e crash dell'app

## Come Utilizzarla

### Creare una Build Diagnostic

Per creare una build in modalità diagnostic, esegui:

```bash
eas build --platform android --profile diagnostic
```

Questo comando creerà un APK speciale con tutte le funzionalità di debug attivate.

### Installare l'APK

1. Scarica l'APK dal link fornito al termine della build EAS
2. Installa l'APK sul dispositivo Android
3. Apri l'app

### Interpretare i Log

- Un piccolo pulsante "D" apparirà nell'angolo in basso a destra dell'app
- Se diventa rosso con un "!" significa che sono stati rilevati errori
- Tocca il pulsante per aprire l'overlay diagnostico completo
- Puoi espandere le sezioni per visualizzare dettagli su:
  - Errori JavaScript
  - Problemi di connessione API
  - Errori di inizializzazione Firebase
  - Crash dell'app

### In Caso di Crash

- Una schermata di emergenza apparirà con dettagli sull'errore
- L'errore verrà inviato automaticamente al server se possibile
- Puoi condividere uno screenshot della schermata di emergenza per l'analisi

## Punti Importanti

1. La modalità diagnostic è più lenta della modalità normale
2. I log sono molto più dettagliati
3. La build non ha minificazione per facilitare il debug
4. Evita di usare questa versione per uso quotidiano

## Come Ripristinare la Versione Normale

Dopo aver diagnosticato il problema, rimuovi l'app diagnostic e installa la versione normale creata con:

```bash
eas build --platform android --profile apk
``` 