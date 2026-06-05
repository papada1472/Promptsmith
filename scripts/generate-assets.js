
import { Jimp } from 'jimp';
import pngToIco from 'png-to-ico';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const SOURCE_IMAGE = path.join(rootDir, 'assets', 'branding', 'Refinzi-logo.png');
const ICONS_DIR = path.join(rootDir, 'assets', 'icons');
const BRANDING_DIR = path.join(rootDir, 'assets', 'branding');

async function generate() {
    console.log('Starting asset generation...');
    console.log('Source:', SOURCE_IMAGE);

    if (!fs.existsSync(SOURCE_IMAGE)) {
        console.error('Source image not found!');
        process.exit(1);
    }

    if (!fs.existsSync(ICONS_DIR)) {
        fs.mkdirSync(ICONS_DIR, { recursive: true });
    }

    const image = await Jimp.read(SOURCE_IMAGE);
    
    // 1. Generate PNG icons
    const sizes = [512, 256, 128, 64, 32];
    for (const size of sizes) {
        console.log(`Generating icon-${size}.png...`);
        const resized = image.clone().resize({ w: size, h: size });
        await resized.write(path.join(ICONS_DIR, `icon-${size}.png`));
    }

    // 2. Generate logo files
    console.log('Generating logo-full.png...');
    await image.clone().write(path.join(BRANDING_DIR, 'logo-full.png'));
    
    console.log('Generating logo-mark.png (256x256)...');
    await image.clone().resize({ w: 256, h: 256 }).write(path.join(BRANDING_DIR, 'logo-mark.png'));

    // 3. Generate tray icon
    console.log('Generating tray.png (32x32)...');
    await image.clone().resize({ w: 32, h: 32 }).write(path.join(ICONS_DIR, 'tray.png'));

    // 4. Generate ICO files
    console.log('Generating app.ico...');
    const icoBuf = await pngToIco([
        path.join(ICONS_DIR, 'icon-256.png'),
        path.join(ICONS_DIR, 'icon-128.png'),
        path.join(ICONS_DIR, 'icon-64.png'),
        path.join(ICONS_DIR, 'icon-32.png')
    ]);
    fs.writeFileSync(path.join(ICONS_DIR, 'app.ico'), icoBuf);

    console.log('Generating favicon.ico...');
    const favBuf = await pngToIco([
        path.join(ICONS_DIR, 'icon-32.png')
    ]);
    fs.writeFileSync(path.join(ICONS_DIR, 'favicon.ico'), favBuf);

    console.log('Asset generation complete!');
}

generate().catch(err => {
    console.error('Generation failed:', err);
    process.exit(1);
});
