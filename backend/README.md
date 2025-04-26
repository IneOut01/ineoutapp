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
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```
   Sostituisci `sk_test_your_stripe_secret_key_here` con la tua chiave segreta di Stripe e `whsec_your_webhook_secret_here` con la chiave segreta del webhook di Stripe.

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
- `POST /webhook`: Endpoint per i webhook di Stripe

## Configurazione del webhook Stripe

Per configurare correttamente i webhook di Stripe:

1. Accedi al [dashboard di Stripe](https://dashboard.stripe.com/)
2. Vai alla sezione Developers > Webhooks
3. Clicca su "Add endpoint"
4. Per lo sviluppo locale, usa [Stripe CLI](https://stripe.com/docs/stripe-cli) o un servizio come [ngrok](https://ngrok.com/) per esporre il tuo server locale
5. L'URL del webhook sarà `https://your-domain.com/webhook` o `http://localhost:3000/webhook` in sviluppo locale
6. Seleziona gli eventi da ascoltare:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
7. Copia la chiave segreta del webhook generata e inseriscila nel tuo file `.env`

## Test con Stripe CLI

Se stai sviluppando localmente, puoi testare il webhook con Stripe CLI:

```
stripe listen --forward-to localhost:3000/webhook
```

Questo comando ti fornirà una chiave webhook segreta che puoi usare per lo sviluppo locale.

## Uso con il frontend

Il frontend è già configurato per comunicare con questo backend attraverso le seguenti impostazioni:

- In ambiente di sviluppo, il frontend utilizza implementazioni simulate
- In produzione, il frontend si connette al backend API tramite gli endpoint `/payments/create-intent` e `/payments/confirm` 