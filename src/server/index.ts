import express from 'express';
import { StreamController } from './controllers/stream.controller';
import { connectDB } from './config/database';

const app = express();
app.use(express.json());

// 路由配置
app.use('/api/streams', StreamController);

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
}); 