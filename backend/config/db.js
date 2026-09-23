import mongoose from 'mongoose';
import dns from 'dns';

// Fix for Windows / Node SRV query ECONNREFUSED with MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  console.warn('DNS server configuration warning:', dnsErr.message);
}

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://24eg105j17:laasya@cluster0.xyjr3mb.mongodb.net/medassist?retryWrites=true&w=majority';
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};
