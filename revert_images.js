const fs = require('fs');
let content = fs.readFileSync('frontend/src/data/products.js', 'utf8');

const imageMap = {
  'Lacto King': 'https://m.media-amazon.com/images/I/71Hq5mPf17L._AC_UF350,350_QL80_.jpg',
  'Coconut Punch': 'https://m.media-amazon.com/images/I/71Hq5mPf17L._AC_UF350,350_QL80_.jpg',
  'Caramilk': 'https://m.media-amazon.com/images/I/71Hq5mPf17L._AC_UF350,350_QL80_.jpg',
  'BooProo': 'https://m.media-amazon.com/images/I/71Hq5mPf17L._AC_UF350,350_QL80_.jpg',
  'Spout': 'https://m.media-amazon.com/images/I/71Hq5mPf17L._AC_UF350,350_QL80_.jpg',
  'Dasara': 'https://cycle.in/cdn/shop/files/Dasara-800x800.webp',
  'Parampara': 'https://cycle.in/cdn/shop/files/3in1-1000x1000_07df39b2-76d8-4a3e-970f-1f94e1c019ff.jpg',
  'Flute': 'https://cycle.in/cdn/shop/files/3in1-1000x1000_07df39b2-76d8-4a3e-970f-1f94e1c019ff.jpg',
  'Pushkarini': 'https://cycle.in/cdn/shop/files/3in1-1000x1000_07df39b2-76d8-4a3e-970f-1f94e1c019ff.jpg',
  'Naivedya': 'https://cycle.in/cdn/shop/files/3in1-1000x1000_07df39b2-76d8-4a3e-970f-1f94e1c019ff.jpg',
  'Dhoop': 'https://cycle.in/cdn/shop/files/3in1-1000x1000_07df39b2-76d8-4a3e-970f-1f94e1c019ff.jpg',
  'Sanitall': 'https://www.pitambari.com/shop/wp-content/uploads/2025/02/Pitambari-Shining-Powder-1kg.jpg',
  'Hexashine': 'https://www.pitambari.com/shop/wp-content/uploads/2025/02/Pitambari-Shining-Powder-1kg.jpg',
  'Sureklin': 'https://5.imimg.com/data5/SELLER/Default/2020/10/KW/IK/PP/38483251/sureklin-handwash-500x500.png',
  'Drain Cleaner': 'https://www.pitambari.com/shop/wp-content/uploads/2025/02/Pitambari-Shining-Powder-1kg.jpg',
  'Dishwash Gel': 'https://www.pitambari.com/shop/wp-content/uploads/2025/02/Pitambari-Shining-Powder-1kg.jpg'
};

const lines = content.split('\n');
const newLines = lines.map(line => {
  if (line.includes('placehold.co')) {
    let foundUrl = 'https://m.media-amazon.com/images/I/71Hq5mPf17L._AC_UF350,350_QL80_.jpg';
    for (const [key, url] of Object.entries(imageMap)) {
      if (line.includes(key)) {
        foundUrl = url;
        break;
      }
    }
    return line.replace(/image_url: \"[^\"]+\"/, `image_url: "${foundUrl}"`);
  }
  return line;
});

fs.writeFileSync('frontend/src/data/products.js', newLines.join('\n'));
console.log('Reverted placeholders to realistic product packaging URLs.');
