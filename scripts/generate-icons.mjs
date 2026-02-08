// scripts/generate-icons.mjs
// Generates PWA icons from an SVG template
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// SVG template - fitness/dumbbell icon with teal theme
const createSvg = (size) => {
  const padding = size * 0.15;
  const iconSize = size - padding * 2;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#0d9488"/>
  
  <!-- Dumbbell icon -->
  <g transform="translate(${padding}, ${padding})">
    <g fill="white" transform="scale(${iconSize / 24})">
      <!-- Left weight -->
      <rect x="2" y="6" width="3" height="12" rx="1"/>
      <rect x="4" y="8" width="2" height="8" rx="0.5"/>
      
      <!-- Bar -->
      <rect x="6" y="10.5" width="12" height="3" rx="1"/>
      
      <!-- Right weight -->
      <rect x="18" y="8" width="2" height="8" rx="0.5"/>
      <rect x="19" y="6" width="3" height="12" rx="1"/>
    </g>
  </g>
</svg>`;
};

// Generate icons
async function generateIcons() {
  console.log('Generating PWA icons...');
  
  for (const size of sizes) {
    const svg = createSvg(size);
    const outputPath = path.join(iconsDir, `icon-${size}.png`);
    
    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);
    
    console.log(`  ✓ icon-${size}.png`);
  }
  
  // Also create apple-touch-icon (180x180)
  const appleSvg = createSvg(180);
  await sharp(Buffer.from(appleSvg))
    .png()
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  console.log('  ✓ apple-touch-icon.png');
  
  // Create favicon.ico (32x32)
  const faviconSvg = createSvg(32);
  await sharp(Buffer.from(faviconSvg))
    .png()
    .toFile(path.join(__dirname, '..', 'public', 'favicon.png'));
  console.log('  ✓ favicon.png');
  
  console.log('\nDone! Icons generated in public/icons/');
}

generateIcons().catch(console.error);
