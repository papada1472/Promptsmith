import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "../dist");
const indexPath = path.join(distDir, "index.html");

if (fs.existsSync(indexPath)) {
  const indexHtml = fs.readFileSync(indexPath, "utf8");

  const routes = ["privacy", "terms", "docs"];
  for (const route of routes) {
    const routeDir = path.join(distDir, route);
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }
    fs.writeFileSync(path.join(routeDir, "index.html"), indexHtml, "utf8");
    console.log(`Generated static route: /${route}/index.html`);
  }

  // Also write dist/404.html
  fs.writeFileSync(path.join(distDir, "404.html"), indexHtml, "utf8");
  console.log("Generated dist/404.html");
}
