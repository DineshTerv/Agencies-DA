const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

// Ensure Node.js can resolve MongoDB Atlas SRV records on Windows & varied DNS environments
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Ignore if custom DNS servers not permitted in environment
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dinesh_agencies');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
