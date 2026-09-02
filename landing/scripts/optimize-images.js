import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "../public");

async function convertDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await convertDir(fullPath);
    } else if (entry.isFile() && /\.(png|jpe?g)$/i.test(entry.name)) {
      const ext = path.extname(entry.name);
      const baseName = path.basename(entry.name, ext);
      const webpPath = path.join(dir, `${baseName}.webp`);
      
      console.log(`Optimizing ${entry.name} -> ${baseName}.webp ...`);
      await sharp(fullPath)
        .webp({ quality: 85, effort: 6 })
        .toFile(webpPath);
      
      const origSize = fs.statSync(fullPath).size;
      const webpSize = fs.statSync(webpPath).size;
      console.log(`  Done: ${(origSize / 1024).toFixed(1)}KB -> ${(webpSize / 1024).toFixed(1)}KB (-${Math.round((1 - webpSize / origSize) * 100)}%)`);
    }
  }
}

async function main() {
  console.log("Starting image optimization to WebP...");
  await convertDir(publicDir);
  console.log("Image optimization complete.");
}

main().catch(console.error);
