import { trackEvent } from "./analytics.js";

/**
 * Performance & Core Web Vitals Monitor for Refinzi Landing
 */
export function initPerformanceMonitoring() {
  if (typeof window === "undefined" || !window.performance) return;

  const vitals = {
    ttfb: null,
    fcp: null,
    lcp: null,
    cls: 0,
    domReady: null,
    windowLoaded: null,
  };

  // 1. Navigation Timing (TTFB, DOM Ready, Window Loaded)
  const reportNavigationTimings = () => {
    try {
      const navEntry = performance.getEntriesByType("navigation")[0];
      if (navEntry) {
        vitals.ttfb = Math.round(navEntry.responseStart - navEntry.requestStart);
        vitals.domReady = Math.round(navEntry.domContentLoadedEventEnd - navEntry.startTime);
        vitals.windowLoaded = Math.round(navEntry.loadEventEnd - navEntry.startTime);

        trackEvent("page_performance_nav", {
          ttfb_ms: vitals.ttfb,
          dom_ready_ms: vitals.domReady,
          load_ms: vitals.windowLoaded,
        });

        if (process.env.NODE_ENV !== "production" || window.location.search.includes("perf=true")) {
          console.log(`⚡ [Performance] TTFB: ${vitals.ttfb}ms | DOM Ready: ${vitals.domReady}ms | Page Load: ${vitals.windowLoaded}ms`);
        }
      }
    } catch (e) {
      // Ignore fallback
    }
  };

  if (document.readyState === "complete") {
    reportNavigationTimings();
  } else {
    window.addEventListener("load", () => setTimeout(reportNavigationTimings, 0));
  }

  // 2. First Contentful Paint (FCP)
  try {
    const fcpObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          vitals.fcp = Math.round(entry.startTime);
          trackEvent("web_vitals_fcp", { value: vitals.fcp });
          fcpObserver.disconnect();
          break;
        }
      }
    });
    fcpObserver.observe({ type: "paint", buffered: true });
  } catch (e) {}

  // 3. Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        vitals.lcp = Math.round(lastEntry.startTime);
        trackEvent("web_vitals_lcp", { value: vitals.lcp });
      }
    });
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
  } catch (e) {}

  // 4. Cumulative Layout Shift (CLS)
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          vitals.cls = parseFloat(clsValue.toFixed(4));
        }
      }
      trackEvent("web_vitals_cls", { value: vitals.cls });
    });
    clsObserver.observe({ type: "layout-shift", buffered: true });
  } catch (e) {}

  return vitals;
}
