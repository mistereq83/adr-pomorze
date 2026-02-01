const sharp = require('sharp');
const path = require('path');

// Tworzymy prosty obrazek z tekstem 'ADR' na niebieskim tle
function svgIcon(size) {
  return `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#1e3a5f" rx="${size * 0.2}"/>
  <text x="50%" y="52%" font-family="Arial, sans-serif" font-size="${size * 0.38}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">ADR</text>
  <text x="50%" y="80%" font-family="Arial, sans-serif" font-size="${size * 0.13}" fill="#f97316" text-anchor="middle" font-weight="bold">ADMIN</text>
</svg>
  `.trim();
}

async function generateIcons() {
  const outputDir = path.join(__dirname, '..', 'public', 'icons');
  
  // 192x192
  await sharp(Buffer.from(svgIcon(192)))
    .png()
    .toFile(path.join(outputDir, 'icon-192.png'));
  console.log('✅ icon-192.png');
  
  // 512x512
  await sharp(Buffer.from(svgIcon(512)))
    .png()
    .toFile(path.join(outputDir, 'icon-512.png'));
  console.log('✅ icon-512.png');
  
  // Apple touch icon (180x180)
  await sharp(Buffer.from(svgIcon(180)))
    .png()
    .toFile(path.join(outputDir, 'apple-touch-icon.png'));
  console.log('✅ apple-touch-icon.png');
  
  // Favicon 32x32
  await sharp(Buffer.from(svgIcon(32)))
    .png()
    .toFile(path.join(outputDir, 'favicon-32.png'));
  console.log('✅ favicon-32.png');
}

generateIcons()
  .then(() => console.log('🎉 All icons generated!'))
  .catch(err => console.error('Error:', err));
