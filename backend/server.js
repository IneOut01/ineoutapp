const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
require('dotenv').config();

// IMPORTANT: Create a .env file in this directory with the following content:
// PORT=3000
// STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
// STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

const app = express();
const port = process.env.PORT || 3000;
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Apply CORS middleware for all routes except webhooks
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(cors());
app.use(express.json());

app.post('/payments/create-intent', async (req, res) => {
  const { amount, currency, planId, description } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: ['card'],
      metadata: {
        planId,
        description
      }
    });

    // Create an ephemeral key and customer for mobile app integration
    const customer = await stripe.customers.create();
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2023-10-16' }
    );

    res.send({
      paymentIntent: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).send({ error: error.message });
  }
});

app.post('/payments/confirm', async (req, res) => {
  const { paymentIntentId, planId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      const confirmedIntent = await stripe.paymentIntents.confirm(paymentIntentId);
      res.send({ success: true, paymentIntent: confirmedIntent });
    } else {
      res.send({ success: true, paymentIntent });
    }
  } catch (error) {
    console.error('Error confirming payment intent:', error);
    res.status(500).send({ error: error.message });
  }
});

// Stripe Webhook handling
app.post('/webhook', async (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error('Missing Stripe webhook secret');
    return res.status(500).send('Webhook secret not configured');
  }

  const signature = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret
    );

    // Handle specific event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`Payment succeeded: ${paymentIntent.id}`);
        
        // Here you would typically:
        // 1. Update database records
        // 2. Activate the subscription
        // 3. Send confirmation email
        
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log(`Payment failed: ${failedPayment.id}`);
        
        // Here you would typically:
        // 1. Log the failure
        // 2. Notify the user
        
        break;
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        console.log(`Subscription event: ${event.type} for subscription ${subscription.id}`);
        
        // Handle subscription lifecycle events
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.send({ received: true });
  } catch (error) {
    console.error(`Webhook error: ${error.message}`);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// Get payment status endpoint
app.get('/payments/status/:paymentIntentId', async (req, res) => {
  const { paymentIntentId } = req.params;

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    res.send({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata,
      created: paymentIntent.created,
      succeeded: paymentIntent.status === 'succeeded'
    });
  } catch (error) {
    console.error('Error retrieving payment intent status:', error);
    res.status(500).send({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('API Stripe backend is running 🚀');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 