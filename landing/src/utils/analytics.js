import { ANALYTICS_CONFIG } from "../config/analyticsConfig.js";

/**
 * Initialize analytics scripts (GA4, etc.) dynamically
 */
export function initAnalytics() {
  if (typeof window === "undefined" || !ANALYTICS_CONFIG.enabled) return;

  // Initialize GA4 if valid measurement ID is provided
  const gaId = ANALYTICS_CONFIG.gaMeasurementId;
  if (gaId && gaId.startsWith("G-") && gaId !== "G-YOUR_MEASUREMENT_ID") {
    // Avoid double injection
    if (!document.getElementById("ga-gtag")) {
      const script = document.createElement("script");
      script.id = "ga-gtag";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag() {
        window.dataLayer.push(arguments);
      }
      window.gtag = gtag;
      gtag("js", new Date());
      gtag("config", gaId, {
        anonymize_ip: true,
        send_page_view: true,
      });

      if (ANALYTICS_CONFIG.debugConsole) {
        console.log(`[Analytics] Google Analytics 4 initialized (${gaId})`);
      }
    }
  }
}

/**
 * Track custom conversion events across the funnel
 * @param {string} eventName - e.g. 'download_click', 'checkout_open', 'purchase_initiated'
 * @param {object} params - custom metadata (currency, value, source, etc.)
 */
export function trackEvent(eventName, params = {}) {
  if (typeof window === "undefined") return;

  const eventPayload = {
    ...params,
    timestamp: new Date().toISOString(),
    path: window.location.pathname,
  };

  // 1. Send to Google Analytics 4 if available
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, eventPayload);
  }

  // 2. Send to Plausible if available
  if (typeof window.plausible === "function") {
    window.plausible(eventName, { props: eventPayload });
  }

  // 3. Debug logging in dev mode
  if (ANALYTICS_CONFIG.debugConsole) {
    console.log(`📊 [Analytics Event] ${eventName}:`, eventPayload);
  }
}
