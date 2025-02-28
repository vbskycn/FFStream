import express, { Request, Response } from 'express';
import path from 'path';
import ffmpegService from './services/ffmpeg.service';
import storage from './services/storage.service';

const app = express();

console.log('初始化服务器...');

// 中间件配置
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

// API 路由
app.get('/api/streams', (req: Request, res: Response) => {
  console.log('获取所有流列表');
  const streams = storage.getAllStreams();
  res.json(streams);
});

app.post('/api/streams', async (req: Request, res: Response) => {
  try {
    console.log('收到新建流请求:', req.body);
    const stream = storage.addStream({
      name: req.body.name,
      inputUrl: req.body.inputUrl
    });
    
    // 自动启动新添加的流
    await ffmpegService.startStream(stream.id);
    
    res.status(201).json(stream);
  } catch (err: any) {
    console.error('创建流失败:', err);
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/streams/:id/start', async (req: Request, res: Response) => {
  try {
    console.log('收到启动流请求:', req.params.id);
    await ffmpegService.startStream(req.params.id);
    res.json({ message: '流已启动' });
  } catch (err: any) {
    console.error('启动流失败:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/streams/:id/stop', async (req: Request, res: Response) => {
  try {
    console.log('收到停止流请求:', req.params.id);
    await ffmpegService.stopStream(req.params.id);
    res.json({ message: '流已停止' });
  } catch (err: any) {
    console.error('停止流失败:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/streams/:id', async (req: Request, res: Response) => {
  try {
    console.log('收到删除流请求:', req.params.id);
    await ffmpegService.stopStream(req.params.id);
    storage.deleteStream(req.params.id);
    res.json({ message: '流已删除' });
  } catch (err: any) {
    console.error('删除流失败:', err);
    res.status(500).json({ error: err.message });
  }
});

// 启动服务器
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
  console.log('服务器初始化完成');
}); 