import Stripe from 'stripe';
import { loadStripe, Stripe as StripeClient } from '@stripe/stripe-js';

// Server-side Stripe client (lazy-loaded to avoid build-time errors)
let _stripe: Stripe | null = null;

export const stripe = new Proxy({} as Stripe, {
  get(target, prop) {
    if (!_stripe) {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY is not configured');
      }
      _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-10-29.clover',
        typescript: true,
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (_stripe as any)[prop];
  }
});

// Client-side Stripe promise
let stripePromise: Promise<StripeClient | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Credit package definitions
export const CREDIT_PACKAGES = {
  small: {
    id: 'small',
    amount: 5,
    credits: 500,
    bonus: 0,
    totalCredits: 500,
    label: '$5',
    description: '500 messages',
    popular: false,
    savings: undefined,
  },
  medium: {
    id: 'medium',
    amount: 10,
    credits: 1000,
    bonus: 100,
    totalCredits: 1100,
    label: '$10',
    description: '1,100 messages',
    popular: false,
    savings: '10% bonus',
  },
  large: {
    id: 'large',
    amount: 20,
    credits: 2000,
    bonus: 400,
    totalCredits: 2400,
    label: '$20',
    description: '2,400 messages',
    popular: false,
    savings: '20% bonus',
  },
} as const;

export type CreditPackageId = keyof typeof CREDIT_PACKAGES;
