const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

async function updateDb() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    const col = mongoose.connection.db.collection('products');

    const res1 = await col.updateOne(
      { $or: [{ id: 'C001' }, { name: /cycle three in one/i, variant: /40g/i }] },
      { 
        $set: { 
          name: 'Cycle Pure Agarbathi (Three in One)',
          variant: '100s Pack (40g)',
          image_url: '/cycle_pure_100s.jpg',
          description: 'Cycle Pure Three in One Agarbathi 100s pack with iconic Serene, Yugantar, and Jagrane fragrances.'
        } 
      }
    );
    console.log('Updated C001:', res1.modifiedCount, 'matched:', res1.matchedCount);

    const res2 = await col.updateOne(
      { $or: [{ id: 'C002' }, { name: /cycle three in one/i, variant: /50g/i }] },
      { 
        $set: { 
          name: 'Cycle Pure Agarbathi (Three in One)',
          image_url: '/cycle_pure_100s.jpg'
        } 
      }
    );
    console.log('Updated C002:', res2.modifiedCount, 'matched:', res2.matchedCount);

    const res3 = await col.updateOne(
      { $or: [{ id: 'C003' }, { name: /cycle three in one/i, variant: /250g/i }] },
      { 
        $set: { 
          name: 'Cycle Pure Agarbathi (Three in One)',
          variant: '250g Mega Pack',
          image_url: '/cycle_pure_three_in_one.jpg'
        } 
      }
    );
    console.log('Updated C003:', res3.modifiedCount, 'matched:', res3.matchedCount);

    await mongoose.disconnect();
    console.log('Successfully updated database records!');
  } catch (err) {
    console.error('Error updating database:', err);
  }
}

updateDb();
