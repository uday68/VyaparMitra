// MongoDB Schema for Negotiation Rooms and Messages
import { Schema, model, Document, Model } from 'mongoose';
import { NegotiationRoom, Message, AgreementDetails } from '../../types/qr-commerce';

// Message Schema
const MessageSchema = new Schema({
  id: { type: String, required: true, unique: true },
  sessionId: { type: String, required: true, index: true },
  senderId: { type: String, required: true },
  senderType: { type: String, enum: ['VENDOR', 'CUSTOMER'], required: true },
  content: { type: String, required: true },
  originalContent: { type: String, required: true },
  language: { 
    type: String, 
    required: true,
    enum: ['en', 'hi', 'bn', 'te', 'ta', 'ml', 'kn', 'gu', 'mr', 'pa', 'or', 'as']
  },
  targetLanguage: { 
    type: String, 
    required: true,
    enum: ['en', 'hi', 'bn', 'te', 'ta', 'ml', 'kn', 'gu', 'mr', 'pa', 'or', 'as']
  },
  type: { type: String, enum: ['TEXT', 'VOICE'], required: true },
  translationStatus: { 
    type: String, 
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'NOT_REQUIRED'], 
    default: 'PENDING' 
  },
  audioUrl: { type: String },
  timestamp: { type: Date, default: Date.now },
  deliveredAt: { type: Date },
  readAt: { type: Date }
}, {
  timestamps: true
});

// Agreement Details Schema
const AgreementDetailsSchema = new Schema({
  productId: { type: String, required: true },
  agreedPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  deliveryDate: { type: Date },
  specialTerms: { type: String },
  agreedAt: { type: Date, default: Date.now }
});

// Negotiation Room Schema
const NegotiationRoomSchema = new Schema({
  id: { type: String, required: true, unique: true },
  sessionId: { type: String, required: true, unique: true, index: true },
  vendorId: { type: String, required: true, index: true },
  customerId: { type: String, index: true },
  vendorLanguage: { 
    type: String, 
    required: true,
    enum: ['en', 'hi', 'bn', 'te', 'ta', 'ml', 'kn', 'gu', 'mr', 'pa', 'or', 'as']
  },
  customerLanguage: { 
    type: String,
    enum: ['en', 'hi', 'bn', 'te', 'ta', 'ml', 'kn', 'gu', 'mr', 'pa', 'or', 'as']
  },
  status: { 
    type: String, 
    enum: ['WAITING', 'ACTIVE', 'COMPLETED', 'ABANDONED'], 
    default: 'WAITING',
    index: true
  },
  messages: [MessageSchema],
  lastMessageAt: { type: Date },
  agreementReached: { type: Boolean, default: false },
  agreementDetails: AgreementDetailsSchema
}, {
  timestamps: true,
  collection: 'negotiation_rooms'
});

// Indexes for performance
NegotiationRoomSchema.index({ sessionId: 1 });
NegotiationRoomSchema.index({ vendorId: 1, status: 1 });
NegotiationRoomSchema.index({ customerId: 1, status: 1 });
NegotiationRoomSchema.index({ createdAt: -1 });
NegotiationRoomSchema.index({ 'messages.timestamp': -1 });

// TTL index for automatic cleanup after 7 days of inactivity
NegotiationRoomSchema.index(
  { lastMessageAt: 1 }, 
  { 
    expireAfterSeconds: 7 * 24 * 60 * 60, // 7 days
    partialFilterExpression: { status: { $in: ['COMPLETED', 'ABANDONED'] } }
  }
);

// Methods
NegotiationRoomSchema.methods.addMessage = function(message: Partial<Message>) {
  const newMessage = {
    ...message,
    id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    timestamp: new Date()
  };
  
  this.messages.push(newMessage);
  this.lastMessageAt = new Date();
  return this.save();
};

NegotiationRoomSchema.methods.markAsActive = function() {
  this.status = 'ACTIVE';
  return this.save();
};

NegotiationRoomSchema.methods.completeNegotiation = function(agreementDetails: AgreementDetails) {
  this.status = 'COMPLETED';
  this.agreementReached = true;
  this.agreementDetails = agreementDetails;
  return this.save();
};

// Static methods
NegotiationRoomSchema.statics.findBySessionId = function(sessionId: string) {
  return this.findOne({ sessionId });
};

NegotiationRoomSchema.statics.findActiveByVendor = function(vendorId: string) {
  return this.find({ vendorId, status: { $in: ['WAITING', 'ACTIVE'] } });
};

NegotiationRoomSchema.statics.findActiveByCustomer = function(customerId: string) {
  return this.find({ customerId, status: { $in: ['WAITING', 'ACTIVE'] } });
};

// Document interfaces
export interface MessageDocument extends Omit<Message, 'id'>, Document {
  _id: string;
}

export interface NegotiationRoomDocument extends Omit<NegotiationRoom, 'id'>, Document {
  _id: string;
  addMessage(message: Partial<Message>): Promise<NegotiationRoomDocument>;
  markAsActive(): Promise<NegotiationRoomDocument>;
  completeNegotiation(agreementDetails: AgreementDetails): Promise<NegotiationRoomDocument>;
}

// Model interfaces
export interface NegotiationRoomModelType extends Model<NegotiationRoomDocument> {
  findBySessionId(sessionId: string): Promise<NegotiationRoomDocument | null>;
  findActiveByVendor(vendorId: string): Promise<NegotiationRoomDocument[]>;
  findActiveByCustomer(customerId: string): Promise<NegotiationRoomDocument[]>;
}

export const NegotiationRoomModel = model<NegotiationRoomDocument, NegotiationRoomModelType>('NegotiationRoom', NegotiationRoomSchema);