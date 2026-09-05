# RefInzi 2.0 — Cloudflare Edge Download Redirector

An ad-blocker-proof edge redirector route (`/download/windows`) powered by Cloudflare Workers and GA4 Measurement Protocol.

## How It Works
1. When a user clicks "Download Free (.exe)" or navigates to `https://refinzi.com/download/windows`:
2. The Cloudflare Edge Worker intercepts the request before reaching your static hosting.
3. It filters out bot crawlers (Googlebot, Bing, scrapers, etc.).
4. It asynchronously dispatches a `file_download` event directly to Google Analytics 4 via the server-side **Measurement Protocol** (`https://www.google-analytics.com/mp/collect`), completely bypassing client-side ad-blockers (uBlock, Brave, etc.).
5. It returns an immediate HTTP `302 Found` redirecting the browser to the official GitHub release binary:
   `https://github.com/papada1472/refinzi/releases/download/v2.0.0/Refinzi-Setup-v2.0.0.exe`

---

## Deployment Options

### Option 1: Deploy with Wrangler (CLI)
From this directory (`landing/cloudflare-redirector`):
```bash
npx wrangler deploy
```

### Option 2: Deploy via Cloudflare Dashboard (Web UI — 2 minutes)
1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Workers & Pages** > **Create application** > **Create Worker**.
3. Name it: `refinzi-download-redirector` and click **Deploy**.
4. Click **Quick Edit** / **Edit code**, paste the contents of [`worker.js`](worker.js), and click **Save and Deploy**.
5. Add Route:
   - Go to your domain `refinzi.com` in Cloudflare Dashboard.
   - Go to **Workers Routes** > **Add route**.
   - Route: `refinzi.com/download/*`
   - Service: `refinzi-download-redirector`
   - Environment: `production`
6. (Optional) Set Environment Variables:
   - Go to Worker **Settings** > **Variables and Secrets**.
   - Add `GA_MEASUREMENT_ID`: your `G-XXXXXXXXXX`.
   - Add `GA_API_SECRET`: generated in GA4 Admin > Data Streams > Web > Measurement Protocol API secrets.
