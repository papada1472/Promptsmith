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

  // Also write dist/404.html
  fs.writeFileSync(path.join(distDir, "404.html"), baseHtml, "utf8");
  console.log("Generated dist/404.html");
}
