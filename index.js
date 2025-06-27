import stripe from 'stripe';
import { Client, Users } from 'node-appwrite';

export default async (context) => {
  const { req, res, log, error } = context;
  const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

   const lineItems = [
    {
      price_data: {
        unit_amount: 500, // $5.00
        currency: 'usd',
        product_data: {
          name: '1 Week',
        },
      },
      quantity: 1,
    },
    {
      price_data: {
        unit_amount: 1000, // $10.00
        currency: 'usd',
        product_data: {
          name: '1 Month',
        },
      },
      quantity: 1,
    },
    {
      price_data: {
        unit_amount: 2500, // $25.00
        currency: 'usd',
        product_data: {
          name: '3 Months',
        },
      },
      quantity: 1,
    },
    {
      price_data: {
        unit_amount: 4500, // $45.00
        currency: 'usd',
        product_data: {
          name: '6 Months',
        },
      },
      quantity: 1,
    },
    {
      price_data: {
        unit_amount: 8500, // $85.00
        currency: 'usd',
        product_data: {
          name: '1 Year',
        },
      },
      quantity: 1,
    }
  ];

  if (req.method === 'POST' && req.path === '/checkout') {
    const baseUrl = process.env.ENDPOINT_URL;
    const successUrl = `${baseUrl}/success`;
    const failureUrl = `${baseUrl}/failure`;
    const userId = req.headers['x-appwrite-user-id'];

    if (!userId) {
      error('Missing x-appwrite-user-id header.');
      return res.json({ error: 'Missing user ID' }, 400);
    }
    
     try {
      const body = JSON.parse(req.body);
      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [lineItems[body.index]],
        success_url: successUrl,
        cancel_url: failureUrl,
        client_reference_id: userId,
        metadata: { 
          userId: userId,
          item: body.index.toString()
        },
        mode: 'payment',
      });

      if (!session || !session.url) {
        error('Failed to create Stripe session.');
        return res.json({ error: 'Stripe session creation failed' }, 500);
      }
  
      log(`Created Stripe checkout session for user ${userId}`);
      return res.json({ url: session.url }, 200);
    } catch (err) {
      error('Stripe checkout error:', err);
      return null;
    }
  }
  
  // === Fallback ===
  return res.text('Not Found', 404);
};
