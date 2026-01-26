import mongoose from 'mongoose';
import { config } from '../config/settings';

export async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(config.database.mongodb.uri);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

// Vendor Schema
const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  language: { type: String, required: true },
  location: { type: String, required: true },
  qrCode: { type: String, unique: true },
  voiceProfile: {
    hasProfile: { type: Boolean, default: false },
    embedding: { type: Buffer },
    consentGiven: { type: Boolean, default: false },
  },
  createdAt: { type: Date, default: Date.now },
});

// Product Schema
const productSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  name: { type: String, required: true },
  description: { type: String },
  basePrice: { type: Number, required: true },
  stock: { type: Number, required: true },
  category: { type: String, required: true },
  images: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  language: { type: String, required: true },
  location: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Voice Profile Schema
const voiceProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  userType: { type: String, enum: ['vendor', 'customer'], required: true },
  embedding: { type: Buffer, required: true },
  consentGiven: { type: Boolean, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Vendor = mongoose.model('Vendor', vendorSchema);
export const Product = mongoose.model('Product', productSchema);
export const User = mongoose.model('User', userSchema);
export const VoiceProfile = mongoose.model('VoiceProfile', voiceProfileSchema);