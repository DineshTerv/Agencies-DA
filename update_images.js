const fs = require('fs');
let content = fs.readFileSync('frontend/src/data/products.js', 'utf8');

const specificImages = [
  '225642_11-coffy-bite-candy.jpg',
  '40156942_1-lotte-eclairs',
  'Woods-1000x1000.jpg',
  '40118843_2-cycle-pure-agarbathi-yagna.jpg',
  '266205_3-cycle-pure-agarbathi-lia',
  '5-LIT-IDHAYM-',
  'Pitambari-Shining-Powder-1kg.jpg',
  '298221_3-pitambari-instant-contact-silver-shine-rooperi.jpg',
  'Pitambari-Dishwash-Bar'
];

const lines = content.split('\n');
const newLines = lines.map(line => {
  if (line.includes('image_url:')) {
    const isSpecific = specificImages.some(img => line.includes(img));
    if (!isSpecific) {
      // Extract name
      const nameMatch = line.match(/name: "([^"]+)"/);
      if (nameMatch) {
        let nameText = nameMatch[1].replace(/ /g, '+').replace(/&/g, 'and');
        // Pick a color based on category
        let color = 'FF9900';
        if (line.includes('Candy') || line.includes('Toffee') || line.includes('Lollipop')) color = 'FF4500';
        else if (line.includes('Gum')) color = '32CD32';
        else if (line.includes('Agarbatti') || line.includes('Dhoop') || line.includes('Puja')) color = '8B4513';
        else if (line.includes('Cleaner') || line.includes('Handwash') || line.includes('Sanitall') || line.includes('Dishwash')) color = '1E90FF';
        
        const newUrl = `https://placehold.co/400x400/${color}/FFF?text=${nameText}`;
        return line.replace(/image_url: "[^"]+"/, `image_url: "${newUrl}"`);
      }
    }
  }
  return line;
});

fs.writeFileSync('frontend/src/data/products.js', newLines.join('\n'));
console.log('Successfully updated image URLs in products.js');
