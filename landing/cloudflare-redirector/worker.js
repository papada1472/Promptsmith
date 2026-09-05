/**
 * RefInzi 2.0 — Cloudflare Edge Download Redirector & Telemetry Worker
 * Route: refinzi.com/download/windows* (or /download/exe)
 * 
 * Functions:
 * 1. Filters out automated search crawlers / bots.
 * 2. Asynchronously logs a server-side GA4 `file_download` event via Measurement Protocol (immune to ad-blockers).
 * 3. Returns HTTP 302 Found redirecting directly to the GitHub release .exe installer.
 */

const DEFAULT_EXE_URL =
  "https://github.com/papada1472/refinzi/releases/download/v2.0.0/Refinzi-Setup-v2.0.0.exe";
const FILE_NAME = "Refinzi-Setup-v2.0.0.exe";

// Common crawler user-agents to avoid inflating download stats
const BOT_REGEX =
  /bot|crawler|spider|crawling|googlebot|bingbot|yandex|baiduspider|facebookexternalhit|twitterbot|linkedinbot|embedly|quora|whatsapp|discordbot|slackbot|curl|wget|python-requests|headlesschrome/i;

/**
 * Generate an anonymous deterministic client ID from IP and User-Agent
 */
async function generateClientId(ip, userAgent) {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${ip || "unknown"}-${userAgent || "unknown"}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Send server-side event to GA4 Measurement Protocol
 */
async function sendGa4MeasurementProtocol(env, { clientId, source, country, city }) {
  const measurementId = env.GA_MEASUREMENT_ID || "G-XXXXXXXXXX";
  const apiSecret = env.GA_API_SECRET;

  if (!measurementId || measurementId === "G-XXXXXXXXXX" || !apiSecret) {
    // Measurement ID or API secret not yet configured
    return;
  }

  const endpoint = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(
    measurementId
  )}&api_secret=${encodeURIComponent(apiSecret)}`;

  const payload = {
    client_id: clientId,
    non_personalized_ads: true,
    events: [
      {
        name: "file_download",
        params: {
          file_name: FILE_NAME,
          file_extension: "exe",
          link_url: DEFAULT_EXE_URL,
          link_text: "Download Free (.exe)",
          download_source: source || "edge_redirector",
          country: country || "unknown",
          city: city || "unknown",
          engagement_time_msec: 100,
        },
      },
    ],
  };

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("[GA4 MP] Error sending event:", err);
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const userAgent = request.headers.get("User-Agent") || "";
    const clientIp =
      request.headers.get("CF-Connecting-IP") ||
      request.headers.get("X-Forwarded-For") ||
      "";
    const country = request.cf?.country || request.headers.get("CF-IPCountry") || "unknown";
    const city = request.cf?.city || "unknown";

    // Detect if this is a known bot / crawler
    const isBot = BOT_REGEX.test(userAgent);

    // Get source query param if passed (?source=hero, ?source=navbar, etc.)
    const source = url.searchParams.get("source") || "edge_redirector";

    // Target release executable
    const targetExeUrl = env.OVERRIDE_EXE_URL || DEFAULT_EXE_URL;

    // Asynchronously log to GA4 Measurement Protocol if not a crawler
    if (!isBot && ctx && typeof ctx.waitUntil === "function") {
      ctx.waitUntil(
        (async () => {
          const clientId = await generateClientId(clientIp, userAgent);
          await sendGa4MeasurementProtocol(env, {
            clientId,
            source,
            country,
            city,
          });
        })()
      );
    }

    // Return immediate HTTP 302 Found redirect to the .exe binary
    return new Response(null, {
      status: 302,
      headers: {
        Location: targetExeUrl,
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
        "X-Robots-Tag": "noindex, nofollow",
        "X-Download-File": FILE_NAME,
      },
    });
  },
};
