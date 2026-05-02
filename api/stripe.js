// Stripe Checkout API
// ====================

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { priceId, customerEmail, successUrl, cancelUrl, userId } = req.body || {};

  if (!priceId) {
    return res.status(400).json({ error: 'Missing priceId' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    // Create Stripe checkout session
    const sessionPayload = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${req.headers.origin || 'https://streambox-n5uw.vercel.app'}/profile?checkout=success`,
      cancel_url: cancelUrl || `${req.headers.origin || 'https://streambox-n5uw.vercel.app'}/subscription?checkout=cancel`,
      subscription_data: {
        metadata: { user_id: userId || '' },
      },
      metadata: { user_id: userId || '' },
    };

    if (customerEmail) {
      sessionPayload.customer_email = customerEmail;
    }

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'subscription',
        'payment_method_types[0]': 'card',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        'success_url': sessionPayload.success_url,
        'cancel_url': sessionPayload.cancel_url,
        'subscription_data[metadata][user_id]': userId || '',
        'metadata[user_id]': userId || '',
        ...(customerEmail ? { 'customer_email': customerEmail } : {}),
      }).toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Stripe error:', data);
      return res.status(400).json({ error: data.error?.message || 'Stripe error' });
    }

    res.status(200).json({ sessionId: data.id, url: data.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Checkout failed', message: error.message });
  }
}
