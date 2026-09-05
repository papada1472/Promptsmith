import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "../dist");
const indexPath = path.join(distDir, "index.html");

const ROUTE_METADATA = {
  docs: {
    title: "Documentation & User Manual — Refinzi 2.0",
    description: "Complete user manual, shortcuts, 5-block blueprint framework, BYOK API setup, and model configuration for Refinzi on Windows 10/11.",
    canonical: "https://refinzi.com/docs/",
  },
  privacy: {
    title: "Privacy Policy — Refinzi 2.0",
    description: "Refinzi Privacy Policy. Learn about our local-first architecture, Windows DPAPI encryption, zero prompt logging, and data safety guarantees.",
    canonical: "https://refinzi.com/privacy/",
  },
  terms: {
    title: "Terms of Service — Refinzi 2.0",
    description: "Refinzi Terms of Service, software licensing details, and Lifetime Pro access policy.",
    canonical: "https://refinzi.com/terms/",
  },
};

if (fs.existsSync(indexPath)) {
  const baseHtml = fs.readFileSync(indexPath, "utf8");

  for (const [route, meta] of Object.entries(ROUTE_METADATA)) {
    const routeDir = path.join(distDir, route);
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }

    let customHtml = baseHtml
      .replace(/<title>.*?<\/title>/, `<title>${meta.title}</title>`)
      .replace(
        /<meta\s+name="description"\s+content=".*?"\s*\/>/,
        `<meta name="description" content="${meta.description}" />`
      )
      .replace(
        /<meta\s+property="og:title"\s+content=".*?"\s*\/>/,
        `<meta property="og:title" content="${meta.title}" />`
      )
      .replace(
        /<meta\s+property="og:description"\s+content=".*?"\s*\/>/,
        `<meta property="og:description" content="${meta.description}" />`
      )
      .replace(
        /<meta\s+property="og:url"\s+content=".*?"\s*\/>/,
        `<meta property="og:url" content="${meta.canonical}" />`
      )
      .replace(
        /<link\s+rel="canonical"\s+href=".*?"\s*\/>/,
        `<link rel="canonical" href="${meta.canonical}" />`
      );

    fs.writeFileSync(path.join(routeDir, "index.html"), customHtml, "utf8");
    console.log(`Generated customized static route: /${route}/index.html`);
  }

  // Generate /download/windows/index.html & /download/exe/index.html (Edge / GitHub Pages Redirector)
  const downloadExeUrl =
    "https://github.com/papada1472/refinzi/releases/download/v2.0.0/Refinzi-Setup-v2.0.0.exe";
  const downloadFileName = "Refinzi-Setup-v2.0.0.exe";
  const gaId = "G-T496C1YCYB";

  const downloadHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Downloading RefInzi 2.0 for Windows...</title>
  <meta name="robots" content="noindex, nofollow">
  <meta http-equiv="refresh" content="2; url=${downloadExeUrl}">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <!-- Google Analytics 4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${gaId}', { send_page_view: true });
  </script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #08090c;
      color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: rgba(24, 24, 27, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 40px 32px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(12px);
    }
    .spinner {
      width: 48px;
      height: 48px;
      margin: 0 auto 20px;
      border: 3px solid rgba(59, 130, 246, 0.2);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 12px; color: #fff; }
    p { font-size: 14px; color: #a1a1aa; line-height: 1.6; margin-bottom: 20px; }
    .btn {
      display: inline-block;
      background: #2563eb;
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      padding: 10px 20px;
      border-radius: 10px;
      text-decoration: none;
      transition: background 0.15s ease;
    }
    .btn:hover { background: #1d4ed8; }
    .file-badge {
      display: inline-block;
      margin-top: 14px;
      font-family: monospace;
      font-size: 11px;
      color: #60a5fa;
      background: rgba(37, 99, 235, 0.15);
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h1>Your RefInzi 2.0 Download is Starting...</h1>
    <p>The 64-bit Windows setup binary will download automatically. If your download doesn't start in a few seconds, click below:</p>
    <a href="${downloadExeUrl}" class="btn" id="manual-btn">Download RefInzi 2.0 (.exe)</a>
    <div><span class="file-badge">${downloadFileName} · 111.8 MB</span></div>
  </div>

  <script>
    (function() {
      // 1. Dispatch GA4 event if gtag is present
      try {
        if (typeof window.gtag === "function") {
          var urlParams = new URLSearchParams(window.location.search);
          var source = urlParams.get("source") || "static_redirector";
          window.gtag("event", "file_download", {
            file_name: "${downloadFileName}",
            file_extension: "exe",
            link_url: "${downloadExeUrl}",
            download_source: source,
            transport_type: "beacon"
          });
        }
      } catch (e) {}

      // 2. Trigger immediate download replace
      setTimeout(function() {
        window.location.replace("${downloadExeUrl}");
      }, 400);
    })();
  </script>
</body>
</html>`;

  const redirectRoutes = ["download/windows", "download/exe"];
  for (const relRoute of redirectRoutes) {
    const targetDir = path.join(distDir, relRoute);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.writeFileSync(path.join(targetDir, "index.html"), downloadHtml, "utf8");
    console.log(`Generated customized static route: /${relRoute}/index.html`);
  }

  // Also write dist/404.html
  fs.writeFileSync(path.join(distDir, "404.html"), baseHtml, "utf8");
  console.log("Generated dist/404.html");
}
