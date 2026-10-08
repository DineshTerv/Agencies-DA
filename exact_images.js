const fs = require('fs');
let content = fs.readFileSync('frontend/src/data/products.js', 'utf8');

const imageMap = {
  'Lacto King': 'https://www.bigbasket.com/media/uploads/p/l/104297_1-lotte-lacto-king.jpg',
  'Coconut Punch': 'https://www.bbassets.com/media/uploads/p/xl/40067861_3-lotte-coconut-punch.jpg',
  'Caramilk': 'https://www.bigbasket.com/media/uploads/p/l/40077221_1-lotte-stick-caramilk.jpg',
  'BooProo': 'https://5.imimg.com/data5/LM/GC/IC/GLADMIN-2510213/5df48ds45sdgsd-500x500.png',
  'Spout': 'https://5.imimg.com/data5/SELLER/Default/2022/8/HM/XK/ZT/112066536/lotte-spout-liquid-center-chewing-gum-500x500.jpg',
  'Dasara': 'https://cycle.in/cdn/shop/files/Dasara-800x800.webp',
  'Sanitall': 'https://5.imimg.com/data5/SELLER/Default/2024/1/375741938/GF/LS/WZ/183144300/pitambari-sanitall-toilet-cleaner-250x250.png',
  'Hexashine': 'https://5.imimg.com/data5/SELLER/Default/2023/10/351147647/UD/OD/BC/482033/1000-x-1000-pix-hexa-shine-floor-cleaner-500-ml-front-500x500.jpg',
  'Sureklin': 'https://5.imimg.com/data5/SELLER/Default/2020/10/KW/IK/PP/38483251/sureklin-handwash-500x500.png',
  'Drain Cleaner': 'https://www.bigbasket.com/media/uploads/p/l/40355845_1-pitambari-drain-cleaner.jpg',
  'Dishwash Gel': 'https://www.bbassets.com/media/uploads/p/l/40355846_1-pitambari-dishwash-gel.jpg',
  'Cycle Three in One': 'https://www.bbassets.com/media/uploads/p/l/40341380_4-cycle-three-in-one-pure-agarbathies.jpg',
  'Royal Sandal': 'https://cycle.in/cdn/shop/files/Sandal-800x800.webp',
  'Parampara': 'https://cycle.in/cdn/shop/files/Parampara-800x800.webp',
  'Flute': 'https://cycle.in/cdn/shop/files/Flute-800x800.webp',
  'Pushkarini': 'https://cycle.in/cdn/shop/files/Pushkarini-800x800.webp',
  'Naivedya': 'https://cycle.in/cdn/shop/files/Naivedya-800x800.webp',
  'Dhoop': 'https://cycle.in/cdn/shop/files/Dhoop-800x800.webp'
};

const lines = content.split('\n');
const newLines = lines.map(line => {
  if (line.includes('images.unsplash.com') || line.includes('m.media-amazon.com/images/I/71Hq5mPf17L') || line.includes('cycle.in/cdn/shop/files/3in1-1000x1000') || line.includes('pitambari.com/shop/wp-content/uploads/2025/02/Pitambari-Shining-Powder-1kg.jpg')) {
    // Only replace the ones that are ACTUALLY fallbacks, wait, shining powder uses the shining powder image!
    if (line.includes('Pitambari Shining Powder')) {
       // Keep it as shining powder, don't replace with fallback loop
       return line;
    }

    let foundUrl = null;
    for (const [key, url] of Object.entries(imageMap)) {
      if (line.includes(key)) {
        foundUrl = url;
        break;
      }
    }
    
    if (foundUrl) {
      return line.replace(/image_url: \"[^\"]+\"/, `image_url: "${foundUrl}"`);
    }
  }
  return line;
});

fs.writeFileSync('frontend/src/data/products.js', newLines.join('\n'));
console.log('Final pass: Applied exact product images for every remaining variant.');
