import mongoose from 'mongoose';

const StreamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  inputUrl: { type: String, required: true },
  outputUrl: { type: String, required: true },
  status: { type: String, enum: ['running', 'stopped'], default: 'stopped' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Stream = mongoose.model('Stream', StreamSchema); 