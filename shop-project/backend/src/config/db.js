const mongoose = require('mongoose');

const connectDB = async () => {
  const connectionUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!connectionUri) {
    const error = new Error('Neither MONGO_URI nor MONGODB_URI environment variable is set');
    console.error(`MongoDB connection failed: ${error.message}`);
    throw error;
  }

  try {
    await mongoose.connect(connectionUri);
    console.log('MongoDB connection successful');
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
