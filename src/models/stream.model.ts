import mongoose, { Schema, Document } from 'mongoose';

export interface IStream extends Document {
  name: string;           // 流名称
  inputUrl: string;       // 输入流地址
  outputKey: string;      // 推流密钥
  status: string;         // 状态：running, stopped, error
  createdAt: Date;       // 创建时间
  updatedAt: Date;       // 更新时间
  lastError?: string;    // 最后一次错误信息
  processId?: number;    // FFmpeg进程ID
}

const StreamSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: true,
    unique: true 
  },
  inputUrl: { 
    type: String, 
    required: true 
  },
  outputKey: { 
    type: String, 
    required: true,
    unique: true 
  },
  status: { 
    type: String, 
    enum: ['running', 'stopped', 'error'],
    default: 'stopped' 
  },
  lastError: String,
  processId: Number
}, {
  timestamps: true
});

export default mongoose.model<IStream>('Stream', StreamSchema); 