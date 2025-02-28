import ffmpeg from 'fluent-ffmpeg';
import { EventEmitter } from 'events';
import config from '../../config/default';
import storage from './storage.service';

class FFmpegService extends EventEmitter {
  private activeStreams: Map<string, ffmpeg.FfmpegCommand>;

  constructor() {
    super();
    this.activeStreams = new Map();
    console.log('FFmpeg服务已初始化');
  }

  async startStream(streamId: string): Promise<void> {
    const stream = storage.getStream(streamId);
    if (!stream) {
      throw new Error('流不存在');
    }

    if (this.activeStreams.has(stream.outputKey)) {
      console.warn('流已经在运行中:', stream.name);
      throw new Error('流已经在运行中');
    }

    console.log('准备启动流:', stream.name);
    console.log('输入地址:', stream.inputUrl);
    console.log('输出密钥:', stream.outputKey);

    const command = ffmpeg(stream.inputUrl)
      .outputOptions([
        '-c:v copy',
        '-c:a copy',
        '-f flv'
      ])
      .output(`${config.stream.pushServer}${stream.outputKey}`)
      .on('start', (commandLine) => {
        console.log('FFmpeg进程启动:', stream.name);
        console.log('命令行:', commandLine);
        storage.updateStream(stream.id, { 
          status: 'running',
          lastError: undefined
        });
      })
      .on('error', (err) => {
        console.error('FFmpeg错误:', stream.name, err.message);
        storage.updateStream(stream.id, {
          status: 'error',
          lastError: err.message
        });
        this.activeStreams.delete(stream.outputKey);
      })
      .on('end', () => {
        console.log('FFmpeg进程结束:', stream.name);
        storage.updateStream(stream.id, { 
          status: 'stopped'
        });
        this.activeStreams.delete(stream.outputKey);
      });

    this.activeStreams.set(stream.outputKey, command);
    command.run();
    console.log('流已启动:', stream.name);
  }

  async stopStream(streamId: string): Promise<void> {
    const stream = storage.getStream(streamId);
    if (!stream) {
      throw new Error('流不存在');
    }

    console.log('准备停止流:', stream.name);
    const command = this.activeStreams.get(stream.outputKey);
    if (command) {
      command.kill('SIGKILL');
      this.activeStreams.delete(stream.outputKey);
      storage.updateStream(stream.id, { 
        status: 'stopped'
      });
      console.log('流已停止:', stream.name);
    } else {
      console.log('流未运行:', stream.name);
    }
  }

  getStreamStatus(streamId: string): boolean {
    const stream = storage.getStream(streamId);
    return stream ? this.activeStreams.has(stream.outputKey) : false;
  }
}

export default new FFmpegService(); 