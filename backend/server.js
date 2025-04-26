const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
require('dotenv').config();

// IMPORTANT: Create a .env file in this directory with the following content:
// PORT=3000
// STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here

const app = express();
const port = process.env.PORT || 3000;
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

app.post('/payments/create-intent', async (req, res) => {
  const { amount, currency } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: ['card'],
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).send({ error: error.message });
  }
});

app.post('/payments/confirm', async (req, res) => {
  const { paymentIntentId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
    res.send({ success: true, paymentIntent });
  } catch (error) {
    console.error('Error confirming payment intent:', error);
    res.status(500).send({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('API Stripe backend is running 🚀');
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
}); 