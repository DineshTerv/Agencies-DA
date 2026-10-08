const { image_search } = require('duckduckgo-images-api');
const fs = require('fs');

async function run() {
  const products = [
    { name: 'Lacto King candy', key: 'Lacto King Milk & Butter Candy' },
    { name: 'Lacto King candy Toffee', key: 'Lacto King Milk Toffee' },
    { name: 'Lacto King Caramel Lollipop', key: 'Lacto King Caramel Lollipop' },
    { name: 'Lacto King Strawberry Lollipop', key: 'Lacto King Strawberry Lollipop' },
    { name: 'Coconut Punch Candy', key: 'Coconut Punch' },
    { name: 'Cycle Dasara Agarbatti', key: 'Dasara' },
    { name: 'Cycle Parampara Agarbatti', key: 'Parampara' },
    { name: 'Flute Agarbatti cycle', key: 'Flute' },
    { name: 'Pushkarini Agarbatti cycle', key: 'Pushkarini' },
    { name: 'Naivedya Sambrani Cups', key: 'Naivedya Sambrani Cups' },
    { name: 'Bambooless Dhoop Sticks', key: 'Bambooless Dhoop Sticks' },
    { name: 'Dhoop Cones', key: 'Dhoop Cones' },
    { name: 'Sanitall Toilet Cleaner Pitambari', key: 'Sanitall' },
    { name: 'Hexashine Floor Cleaner Pitambari', key: 'Hexashine' },
    { name: 'Sureklin Handwash Pitambari', key: 'Sureklin Handwash' },
    { name: 'Pitambari Drain Cleaner', key: 'Pitambari Drain Cleaner' },
    { name: 'Pitambari Dishwash Gel', key: 'Pitambari Dishwash Gel' },
    { name: 'BooProo gum', key: 'BooProo' },
    { name: 'Spout gum', key: 'Spout' },
    { name: 'Caramilk toffee', key: 'Caramilk' }
  ];
  
  let updates = {};
  for(let p of products) {
    try {
      const results = await image_search({ query: p.name, moderate: true, retries: 2, iterations: 1 });
      if(results && results.length > 0) {
        updates[p.key] = results[0].image;
        console.log('Found:', p.name, '->', results[0].image);
      }
    } catch(e) {
      console.log('Error on', p.name, e.message);
    }
  }
  
  let content = fs.readFileSync('src/data/products.js', 'utf8');
  for (let key in updates) {
    let url = updates[key];
    // escape regex chars in key if any (e.g. &)
    const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    content = content.replace(new RegExp(`name: "${escapedKey}"[^\\n]+image_url: "[^"]+"`, 'g'), (match) => {
      return match.replace(/image_url: "[^"]+"/, `image_url: "${url}"`);
    });
  }
  fs.writeFileSync('src/data/products.js', content);
  console.log('Updated products.js successfully');
}
run();
