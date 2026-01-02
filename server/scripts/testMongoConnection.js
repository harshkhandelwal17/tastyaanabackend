const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

console.log('Testing MongoDB connection...');
console.log('MongoDB URI:', process.env.MONGO_URI || 'Not found');

if (!process.env.MONGO_URI) {
  console.error('Error: MONGO_URI is not defined in environment variables');
  process.exit(1);
}

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    
    // Set up connection event handlers
    mongoose.connection.on('connecting', () => {
      console.log('Connecting to MongoDB...');
    });
    
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected successfully!');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    // Attempt to connect
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
    
    console.log('Successfully connected to MongoDB!');
    console.log('Database name:', mongoose.connection.name);
    
    // List all collections in the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections in the database:');
    collections.forEach(collection => console.log(`- ${collection.name}`));
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Connection closed.');
    
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

testConnection();
