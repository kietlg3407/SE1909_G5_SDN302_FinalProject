const mongoose = require('mongoose');

const connectDB = async () => {
  const connectionUri = process.env.MONGO_URI;

  if (!connectionUri) {
    const error = new Error('MONGO_URI environment variable is not set');
    console.error(`MongoDB connection failed: ${error.message}`);
    throw error;
  }

  try {
    await mongoose.connect(connectionUri);
    console.log('Connection successful');
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;