import { ANALYTICS_CONFIG } from "../config/analyticsConfig.js";

/**
 * Initialize analytics scripts (GA4, etc.) dynamically
 */
export function initAnalytics() {
  if (typeof window === "undefined" || !ANALYTICS_CONFIG.enabled) return;

  // 1. Initialize Cloudflare Web Analytics if token is provided
  const cfToken = ANALYTICS_CONFIG.cloudflareToken;
  if (cfToken && cfToken.trim() !== "" && !document.getElementById("cf-beacon")) {
    const cfScript = document.createElement("script");
    cfScript.id = "cf-beacon";
    cfScript.defer = true;
    cfScript.src = "https://static.cloudflareinsights.com/beacon.min.js";
    cfScript.setAttribute("data-cf-beacon", JSON.stringify({ token: cfToken.trim() }));
    document.body.appendChild(cfScript);

    if (ANALYTICS_CONFIG.debugConsole) {
      console.log(`[Analytics] Cloudflare Web Analytics initialized (token: ${cfToken.slice(0, 6)}...)`);
    }
  }

  // 2. Initialize GA4 if valid measurement ID is provided
  const gaId = ANALYTICS_CONFIG.gaMeasurementId;
  if (gaId && gaId.startsWith("G-") && gaId !== "G-YOUR_MEASUREMENT_ID") {
    // Ensure window.dataLayer & window.gtag exist so events can be queued safely
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== "function") {
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
    }

    // Avoid double injection of script tag
    if (!document.getElementById("ga-gtag")) {
      const script = document.createElement("script");
      script.id = "ga-gtag";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);

      window.gtag("js", new Date());
      window.gtag("config", gaId, {
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
 * Track standard file download event (GA4 recommended event: file_download)
 * @param {object} options
 * @param {string} options.fileName - e.g. 'Refinzi-Setup-v2.0.0.exe'
 * @param {string} options.fileExtension - e.g. 'exe'
 * @param {string} options.linkUrl - Direct URL to the setup file
 * @param {string} [options.source] - Component source (e.g. 'hero', 'navbar', 'pricing')
 * @param {string} [options.linkText] - Button text (e.g. 'Download Free (.exe)')
 */
export function trackFileDownload({
  fileName = "Refinzi-Setup-v2.0.0.exe",
  fileExtension = "exe",
  linkUrl = "",
  source = "unknown",
  linkText = "Download Free (.exe)",
} = {}) {
  if (typeof window === "undefined") return;

  const eventPayload = {
    file_name: fileName,
    file_extension: fileExtension,
    link_url: linkUrl,
    link_text: linkText,
    download_source: source,
    timestamp: new Date().toISOString(),
    path: window.location.pathname,
  };

  // 1. Send standard GA4 file_download event
  if (typeof window.gtag === "function") {
    window.gtag("event", "file_download", eventPayload);
  }

  // 2. Send to Plausible if available
  if (typeof window.plausible === "function") {
    window.plausible("file_download", { props: eventPayload });
  }

  // 3. Debug logging in dev mode
  if (ANALYTICS_CONFIG.debugConsole) {
    console.log("📥 [GA4 file_download event]:", eventPayload);
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
