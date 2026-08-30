const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconDir = path.join(__dirname, 'public', 'icons');

// Ensure directory exists
if (!fs.existsSync(iconDir)) fs.mkdirSync(iconDir, { recursive: true });

async function generateIcon(size) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
      <rect width="512" height="512" rx="100" fill="#14204A"/>
      <text x="256" y="300" font-family="Arial, Helvetica, sans-serif" font-size="220" font-weight="bold" fill="#F26522" text-anchor="middle">G</text>
      <text x="256" y="420" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="bold" fill="#FFFFFF" text-anchor="middle" letter-spacing="6">STARTUP</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(path.join(iconDir, `icon-${size}.png`));

  console.log(`Generated icon-${size}.png`);
}

async function main() {
  for (const size of sizes) {
    await generateIcon(size);
  }

  // Generate favicon.ico and app icon
  const svgFavicon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 512 512">
      <rect width="512" height="512" rx="100" fill="#14204A"/>
      <text x="256" y="320" font-family="Arial, Helvetica, sans-serif" font-size="280" font-weight="bold" fill="#F26522" text-anchor="middle">G</text>
    </svg>
  `;

  const faviconBuf = await sharp(Buffer.from(svgFavicon)).resize(32, 32).png().toBuffer();
  fs.writeFileSync(path.join(__dirname, 'public', 'favicon.ico'), faviconBuf);
  fs.writeFileSync(path.join(__dirname, 'src', 'app', 'favicon.ico'), faviconBuf);
  
  const iconBuf = await sharp(Buffer.from(svgFavicon)).resize(192, 192).png().toBuffer();
  fs.writeFileSync(path.join(__dirname, 'src', 'app', 'icon.png'), iconBuf);

  console.log('All icons and favicons generated!');
}

main().catch(console.error);
