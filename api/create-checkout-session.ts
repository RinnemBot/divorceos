import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { enforceBrowserOrigin, enforceRateLimit, sanitizeReturnUrl } from './_security';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('[stripe] STRIPE_SECRET_KEY is not set. Checkout sessions will fail until it is configured.');
}

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' as Stripe.LatestApiVersion })
  : (null as unknown as Stripe);

const priceMap: Record<'monthly' | 'annual', Record<string, string | undefined>> = {
  monthly: {
    basic: process.env.STRIPE_PRICE_BASIC_MONTHLY,
    essential: process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY,
    plus: process.env.STRIPE_PRICE_PLUS_MONTHLY,
    'done-for-you': process.env.STRIPE_PRICE_DONE_MONTHLY,
  },
  annual: {
    basic: process.env.STRIPE_PRICE_BASIC_ANNUAL,
    essential: process.env.STRIPE_PRICE_ESSENTIAL_ANNUAL,
    plus: process.env.STRIPE_PRICE_PLUS_ANNUAL,
    'done-for-you': process.env.STRIPE_PRICE_DONE_ANNUAL,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!enforceBrowserOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, 'checkout', 10, 60_000)) return;

  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured' });
  }

  try {
    const {
      planId,
      billingPeriod = 'monthly',
      successUrl,
      cancelUrl,
      customerEmail,
    }: {
      planId: 'basic' | 'essential' | 'plus' | 'done-for-you';
      billingPeriod?: 'monthly' | 'annual';
      successUrl?: string;
      cancelUrl?: string;
      customerEmail?: string;
    } = req.body;

    if (!planId) {
      return res.status(400).json({ error: 'planId is required' });
    }

    const priceId = priceMap[billingPeriod]?.[planId];

    if (!priceId) {
      return res.status(400).json({ error: `Price not configured for plan ${planId}` });
    }

    const baseAppUrl = process.env.APP_URL || process.env.VITE_APP_URL || 'https://www.divorce-os.com';
    const safeSuccessUrl = sanitizeReturnUrl(successUrl, `${baseAppUrl}/pricing?status=success`);
    const safeCancelUrl = sanitizeReturnUrl(cancelUrl, `${baseAppUrl}/pricing?status=cancelled`);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: safeSuccessUrl,
      cancel_url: safeCancelUrl,
      customer_email: customerEmail,
      metadata: {
        planId,
        billingPeriod,
      },
    });

    return res.status(200).json({ checkoutUrl: session.url });
  } catch (error) {
    console.error('[stripe] checkout session error', error);
    return res.status(500).json({ error: 'Unable to create checkout session' });
  }
}
