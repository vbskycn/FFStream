import fs from 'fs';
import path from 'path';

interface IStream {
  id: string;
  name: string;
  inputUrl: string;
  outputKey: string;
  status: 'running' | 'stopped' | 'error';
  lastError?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

class StorageService {
  private dataFile: string;
  private streams: Map<string, IStream>;

  constructor() {
    this.dataFile = path.join(process.cwd(), 'data/streams.json');
    this.streams = new Map();
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(path.dirname(this.dataFile))) {
        fs.mkdirSync(path.dirname(this.dataFile), { recursive: true });
      }
      
      if (fs.existsSync(this.dataFile)) {
        const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf-8'));
        this.streams = new Map(Object.entries(data));
        console.log('已加载流配置数据:', this.streams.size, '个流');
      } else {
        fs.writeFileSync(this.dataFile, JSON.stringify({}));
        console.log('创建了新的流配置文件');
      }
    } catch (err) {
      console.error('初始化存储服务失败:', err);
    }
  }

  private save() {
    try {
      const data = Object.fromEntries(this.streams);
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('保存流配置数据失败:', err);
    }
  }

  getAllStreams(): IStream[] {
    return Array.from(this.streams.values());
  }

  getStream(id: string): IStream | undefined {
    return this.streams.get(id);
  }

  addStream(stream: Pick<IStream, 'name' | 'inputUrl'>): IStream {
    const id = Date.now().toString();
    const newStream: IStream = {
      ...stream,
      id,
      outputKey: `stream_${id}`,  // 自动生成outputKey
      status: 'stopped',
      retryCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.streams.set(id, newStream);
    this.save();
    console.log('新增流:', newStream.name);
    return newStream;
  }

  updateStream(id: string, data: Partial<IStream>): IStream | undefined {
    const stream = this.streams.get(id);
    if (stream) {
      const updatedStream = {
        ...stream,
        ...data,
        updatedAt: new Date()
      };
      this.streams.set(id, updatedStream);
      this.save();
      return updatedStream;
    }
    return undefined;
  }

  deleteStream(id: string): boolean {
    const stream = this.streams.get(id);
    if (stream) {
      this.streams.delete(id);
      this.save();
      console.log('删除流:', stream.name);
      return true;
    }
    return false;
  }
}

export default new StorageService(); 