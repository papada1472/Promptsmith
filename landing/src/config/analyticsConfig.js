/**
 * Refinzi 2.0 — Web Analytics & Conversion Tracking Configuration
 * 
 * Set up your analytics in 1 minute:
 * 
 * 1. Google Analytics 4 (GA4):
 *    - Create a free property at: https://analytics.google.com/
 *    - Copy your Measurement ID (e.g. "G-XXXXXXXXXX") into `gaMeasurementId` below.
 * 
 * 2. Cloudflare Web Analytics / Plausible (Optional privacy-first alternative):
 *    - Add token or domain below.
 */

export const ANALYTICS_CONFIG = {
  // Set to true to activate live tracking
  enabled: true,

  // Cloudflare Web Analytics Token
  cloudflareToken: "d434469361874705bd59d8eb1310d192",

  // Google Analytics 4 Measurement ID (Optional alternative)
  gaMeasurementId: "",

  // Plausible Analytics domain (Optional)
  plausibleDomain: "",

  // Log all tracked events in browser console during development
  debugConsole: process.env.NODE_ENV !== "production",
};

export default ANALYTICS_CONFIG;
