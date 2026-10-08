const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

const PRODUCTS_DATA = [
  { id: 1, name: "180 RS", category_id: 1, category_name: "Agarbatti", price: 336, stock: 50, image_url: "/180_rs.jpg" },
  { id: 2, name: "220 RS", category_id: 1, category_name: "Agarbatti", price: 440, stock: 45, image_url: "/220_rs.webp" },
  { id: 3, name: "30 RS", category_id: 1, category_name: "Agarbatti", price: 168, stock: 100, image_url: "/30_rs.jpg" },
  { id: 4, name: "90 RS", category_id: 1, category_name: "Agarbatti", price: 168, stock: 80, image_url: "/90_rs.jpg" },
  { id: 5, name: "Coffy Bite", category_id: 2, category_name: "Confectionery", price: 80, stock: 200, image_url: "/coffy_bite.jpg" },
  { id: 6, name: "Coffy Bite Classic", category_id: 2, category_name: "Confectionery", price: 85, stock: 150, image_url: "/coffy_bite_classic.jpg" },
  { id: 7, name: "Cycle Yagna", category_id: 1, category_name: "Agarbatti", price: 210, stock: 60, image_url: "/cycle_yagna.jpg" },
  { id: 8, name: "Dhoop", category_id: 3, category_name: "Dhoop", price: 120, stock: 90, image_url: "/dhoop.jpg" },
  { id: 9, name: "Dhoop Cone", category_id: 3, category_name: "Dhoop", price: 150, stock: 70, image_url: "/dhoop_cone.jpg" },
  { id: 10, name: "Lacto King Candy", category_id: 2, category_name: "Confectionery", price: 50, stock: 300, image_url: "/lacto_king_candy.jpg" },
  { id: 11, name: "Lacto King Milk Toffee", category_id: 2, category_name: "Confectionery", price: 60, stock: 250, image_url: "/lacto_king_milk_toffee.webp" },
  { id: 12, name: "Lia", category_id: 1, category_name: "Agarbatti", price: 180, stock: 110, image_url: "/lia.jpg" },
  { id: 13, name: "Lotte Eclairs", category_id: 2, category_name: "Confectionery", price: 100, stock: 180, image_url: "/lotte_eclairs.jpg" },
  { id: 14, name: "Parampara", category_id: 1, category_name: "Agarbatti", price: 250, stock: 40, image_url: "/parampara.webp" },
  { id: 15, name: "Puja", category_id: 1, category_name: "Agarbatti", price: 130, stock: 120, image_url: "/puja.jpg" },
  { id: 16, name: "Pushkarini", category_id: 1, category_name: "Agarbatti", price: 200, stock: 55, image_url: "/pushkarini.webp" },
  { id: 17, name: "Royal Sandal", category_id: 1, category_name: "Agarbatti", price: 300, stock: 30, image_url: "/royal_sandal.jpg" }
];

const connectDB = require('./db');

const uploadData = async () => {
  await connectDB();
  try {
    await Product.deleteMany({});
    console.log('Cleared old products');
    
    await Product.insertMany(PRODUCTS_DATA);
    console.log('Successfully uploaded all products to MongoDB Atlas!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error uploading data:', error);
    process.exit(1);
  }
};

uploadData();
