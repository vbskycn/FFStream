import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import config from '../config/default';
import Stream from './models/stream.model';
import ffmpegService from './services/ffmpeg.service';

const app = express();

// 中间件配置
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API 路由
// 获取所有流
app.get('/api/streams', async (req, res) => {
  try {
    const streams = await Stream.find();
    res.json(streams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 添加新流
app.post('/api/streams', async (req, res) => {
  try {
    const stream = new Stream(req.body);
    await stream.save();
    res.status(201).json(stream);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 启动流
app.post('/api/streams/:id/start', async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);
    if (!stream) {
      return res.status(404).json({ error: '流不存在' });
    }
    await ffmpegService.startStream(stream);
    res.json({ message: '流已启动' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 停止流
app.post('/api/streams/:id/stop', async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);
    if (!stream) {
      return res.status(404).json({ error: '流不存在' });
    }
    await ffmpegService.stopStream(stream.outputKey);
    res.json({ message: '流已停止' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除流
app.delete('/api/streams/:id', async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);
    if (!stream) {
      return res.status(404).json({ error: '流不存在' });
    }
    await ffmpegService.stopStream(stream.outputKey);
    await Stream.findByIdAndDelete(req.params.id);
    res.json({ message: '流已删除' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 连接数据库并启动服务器
mongoose.connect(config.database.url)
  .then(() => {
    console.log('数据库连接成功');
    app.listen(config.app.port, () => {
      console.log(`服务器运行在 http://localhost:${config.app.port}`);
    });
  })
  .catch((err) => {
    console.error('数据库连接失败:', err);
  }); 