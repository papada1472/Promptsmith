/**
 * PayPal Integration Configuration
 * 
 * Choose one of the 3 easy ways below to receive your $19 Lifetime Pro payments:
 */

export const PAYPAL_CONFIG = {
  // Option A: Your PayPal.me Link or PayPal Payment Link (Fastest - 2 minutes)
  // Example: "https://paypal.me/yourusername/19USD"
  paypalMeUrl: "https://paypal.me/yourusername/19USD",

  // Option B: Your PayPal Account Email (For direct checkout invoice)
  merchantEmail: "your-email@example.com",

  // Option C: PayPal Developer Live Client ID (For in-page Smart Buttons)
  // Get this at: https://developer.paypal.com/dashboard/applications/live
  clientId: "YOUR_LIVE_PAYPAL_CLIENT_ID",

  // Product Details
  item: {
    name: "Refinzi 2.0 Lifetime Pro License",
    price: "19.00",
    currency: "USD",
    description: "One-time payment for lifetime access & updates",
  },
};

export default PAYPAL_CONFIG;
