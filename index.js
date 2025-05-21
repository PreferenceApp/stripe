import stripe from 'stripe';

export default async (context) => {
  const { req, res, log, error } = context;

  const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

  const createCheckoutSession = async (userId, successUrl, failureUrl) => {
    const lineItem = {
      price_data: {
        unit_amount: 1000, // $10.00
        currency: 'usd',
        product_data: {
          name: 'Product',
        },
      },
      quantity: 1,
    };

    try {
      return await stripeClient.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [lineItem],
        success_url: successUrl,
        cancel_url: failureUrl,
        client_reference_id: userId,
        metadata: { userId },
        mode: 'payment',
      });
    } catch (err) {
      error('Stripe checkout error:', err);
      return null;
    }
  };

  if (req.method === 'POST' && req.path === '/checkout') {
    const baseUrl = process.env.ENDPOINT_URL;
    const successUrl = `${baseUrl}/success`;
    const failureUrl = `${baseUrl}/failure`;
    const userId = req.headers['x-appwrite-user-id'];

    if (!userId) {
      error('Missing x-appwrite-user-id header.');
      return res.json({ error: 'Missing user ID' }, 400);
    }

    const session = await createCheckoutSession(userId, successUrl, failureUrl);
    if (!session || !session.url) {
      error('Failed to create Stripe session.');
      return res.json({ error: 'Stripe session creation failed' }, 500);
    }

    log(`Created Stripe checkout session for user ${userId}`);
    return res.json({ url: session.url }, 200);
  }

  // === Fallback ===
  return res.text('Not Found', 404);
};

  // === Handle /webhook ===
 /* if (req.method === 'POST' && req.path === '/webhook') {
    const event = validateStripeWebhook(req);
    if (!event) {
      return res.json({ success: false }, 401);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.userId;

      if (!userId) {
        error('Missing userId in Stripe session metadata.');
        return res.json({ success: false }, 400);
      }

      try {
        await addPaidLabelToUser(userId, req.headers['x-appwrite-key']);
        return res.json({ success: true });
      } catch (err) {
        error('Failed to update user labels:', err);
        return res.json({ success: false }, 500);
      }
    }

    return res.json({ success: true }); // Ignore other event types
  }
*/

