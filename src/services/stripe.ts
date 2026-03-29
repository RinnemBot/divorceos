import { loadStripe } from '@stripe/stripe-js';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

const priceMap: Record<'monthly' | 'annual', Record<string, string | undefined>> = {
  monthly: {
    basic: import.meta.env.VITE_STRIPE_PRICE_BASIC_MONTHLY,
    essential: import.meta.env.VITE_STRIPE_PRICE_ESSENTIAL_MONTHLY,
    plus: import.meta.env.VITE_STRIPE_PRICE_PLUS_MONTHLY,
    'done-for-you': import.meta.env.VITE_STRIPE_PRICE_DONE_MONTHLY,
  },
  annual: {
    basic: import.meta.env.VITE_STRIPE_PRICE_BASIC_ANNUAL,
    essential: import.meta.env.VITE_STRIPE_PRICE_ESSENTIAL_ANNUAL,
    plus: import.meta.env.VITE_STRIPE_PRICE_PLUS_ANNUAL,
    'done-for-you': import.meta.env.VITE_STRIPE_PRICE_DONE_ANNUAL,
  },
};

const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export async function redirectToCheckout(
  planId: 'free' | 'basic' | 'essential' | 'plus' | 'done-for-you',
  billingPeriod: 'monthly' | 'annual',
  customerEmail?: string
) {
  if (planId === 'free') {
    throw new Error('Stripe checkout is only required for paid plans.');
  }

  if (!publishableKey || !stripePromise) {
    throw new Error('Stripe publishable key is not configured.');
  }

  const priceId = priceMap[billingPeriod]?.[planId];
  if (!priceId) {
    throw new Error(`Price ID is not configured for plan "${planId}".`);
  }

  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      planId,
      billingPeriod,
      customerEmail,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Unable to start checkout.');
  }

  const { checkoutUrl } = await response.json();

  if (!checkoutUrl) {
    throw new Error('Stripe did not return a checkout URL.');
  }

  window.location.href = checkoutUrl;
}
