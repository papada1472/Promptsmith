/**
 * Refinzi 2.0 — Global Payment Gateway Configuration
 * 
 * Recommended Free/Low-Cost Global Gateways (Zero Monthly Subscription):
 * 
 * 1. Lemon Squeezy (Recommended for Digital Software / MoR)
 *    - Fee: 5% + $0.50 per sale (No monthly fees)
 *    - Automatically handles Global VAT/GST & local currencies in 135+ countries.
 *    - Accepts Apple Pay, Google Pay, Credit/Debit Cards, PayPal.
 *    - Link: https://www.lemonsqueezy.com/
 * 
 * 2. Stripe Payment Links (Direct Card & Wallet Processing)
 *    - Fee: 2.9% + $0.30 per sale (No monthly fees)
 *    - Instant 1-click checkout hosted by Stripe.
 *    - Link: https://dashboard.stripe.com/payment-links
 * 
 * 3. PayPal / PayPal.me (Universal Worldwide Wallet)
 *    - Fee: ~3.49% + fixed fee (No monthly fees)
 *    - Link: https://paypal.me/
 * 
 * 4. Gumroad (Simple Software Storefront)
 *    - Fee: 10% flat per sale (No monthly fees)
 *    - Link: https://gumroad.com/
 */

export const PAYMENT_GATEWAY_CONFIG = {
  // Set your active primary gateway: "lemonsqueezy" | "stripe" | "paypal" | "gumroad"
  activeGateway: "paypal",

  // 1. Lemon Squeezy Checkout URL (e.g. "https://yourstore.lemonsqueezy.com/buy/product-id")
  lemonSqueezyUrl: "https://yourstore.lemonsqueezy.com/buy/YOUR_PRODUCT_ID",

  // 2. Stripe Payment Link URL (e.g. "https://buy.stripe.com/YOUR_PAYMENT_LINK")
  stripePaymentLink: "https://buy.stripe.com/YOUR_PAYMENT_LINK",

  // 3. PayPal Configuration
  paypal: {
    paypalMeUrl: "https://paypal.me/yourusername/19USD",
    merchantEmail: "your-email@example.com",
    clientId: "YOUR_LIVE_PAYPAL_CLIENT_ID",
  },

  // 4. Gumroad Checkout URL (e.g. "https://yourusername.gumroad.com/l/refinzi")
  gumroadUrl: "https://yourusername.gumroad.com/l/refinzi",

  // Base Product Details (in USD)
  product: {
    name: "Refinzi 2.0 Lifetime Pro License",
    usdPrice: 19.00,
    usdRegularPrice: 79.00,
    discountPercentage: 73,
    description: "One-time payment for lifetime license & updates",
  },
};

export default PAYMENT_GATEWAY_CONFIG;
