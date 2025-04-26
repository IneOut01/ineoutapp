# Backend per i pagamenti Stripe - IneOut

Questo è il backend dedicato alla gestione dei pagamenti con Stripe per l'app IneOut.

## Configurazione

1. Installa le dipendenze:
   ```
   cd backend
   npm install
   ```

2. Crea un file `.env` nella cartella backend con il seguente contenuto:
   ```
   PORT=3000
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
   ```
   Sostituisci `sk_test_your_stripe_secret_key_here` con la tua chiave segreta di Stripe.

## Avvio del server

```
cd backend
npm start
```

Il server sarà disponibile all'indirizzo http://localhost:3000.

## Endpoint disponibili

- `GET /`: Verifica che il server sia attivo
- `POST /payments/create-intent`: Crea un nuovo payment intent
- `POST /payments/confirm`: Conferma un payment intent

## Uso con il frontend

Il frontend è già configurato per comunicare con questo backend attraverso le seguenti impostazioni:

- In ambiente di sviluppo, il frontend utilizza implementazioni simulate
- In produzione, il frontend si connette al backend API tramite gli endpoint `/payments/create-intent` e `/payments/confirm` 