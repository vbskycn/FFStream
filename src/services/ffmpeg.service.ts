import ffmpeg from 'fluent-ffmpeg';
import { EventEmitter } from 'events';
import config from '../../config/default';
import storage from './storage.service';

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  maxRetryDelay: number;
}

class FFmpegService extends EventEmitter {
  private activeStreams: Map<string, ffmpeg.FfmpegCommand>;
  private retryTimeouts: Map<string, NodeJS.Timeout>;
  private retryConfig: RetryConfig = {
    maxRetries: 10,        // 最大重试次数
    retryDelay: 5000,      // 初始重试延迟（毫秒）
    maxRetryDelay: 300000  // 最大重试延迟（5分钟）
  };

  constructor() {
    super();
    this.activeStreams = new Map();
    this.retryTimeouts = new Map();
    this.init();
  }

  private init() {
    // 启动时自动启动所有流
    const streams = storage.getAllStreams();
    streams.forEach(stream => {
      if (stream.status !== 'stopped') {
        this.startStream(stream.id).catch(err => {
          console.error(`自动启动流 ${stream.name} 失败:`, err);
        });
      }
    });
  }

  private calculateRetryDelay(retryCount: number): number {
    // 指数退避策略
    const delay = Math.min(
      this.retryConfig.retryDelay * Math.pow(2, retryCount),
      this.retryConfig.maxRetryDelay
    );
    return delay;
  }

  private scheduleRetry(streamId: string) {
    const stream = storage.getStream(streamId);
    if (!stream) return;

    const retryCount = stream.retryCount || 0;
    if (retryCount >= this.retryConfig.maxRetries) {
      console.log(`流 ${stream.name} 达到最大重试次数，停止重试`);
      storage.updateStream(streamId, { 
        status: 'error',
        lastError: '达到最大重试次数'
      });
      return;
    }

    const delay = this.calculateRetryDelay(retryCount);
    console.log(`计划在 ${delay/1000} 秒后重试流 ${stream.name}`);

    // 清除之前的重试计时器
    const existingTimeout = this.retryTimeouts.get(streamId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // 设置新的重试计时器
    const timeout = setTimeout(() => {
      this.startStream(streamId).catch(err => {
        console.error(`重试流 ${stream.name} 失败:`, err);
      });
    }, delay);

    this.retryTimeouts.set(streamId, timeout);
  }

  async startStream(streamId: string): Promise<void> {
    const stream = storage.getStream(streamId);
    if (!stream) {
      throw new Error('流不存在');
    }

    if (this.activeStreams.has(stream.id)) {
      console.warn('流已经在运行中:', stream.name);
      return;
    }

    console.log('准备启动流:', stream.name);
    console.log('输入地址:', stream.inputUrl);

    const command = ffmpeg(stream.inputUrl)
      .outputOptions([
        '-c:v copy',
        '-c:a copy',
        '-f flv',
        '-reconnect 1',
        '-reconnect_at_eof 1',
        '-reconnect_streamed 1',
        '-reconnect_delay_max 2'
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
        this.activeStreams.delete(stream.id);
        
        storage.updateStream(stream.id, {
          status: 'error',
          lastError: err.message,
          retryCount: (stream.retryCount || 0) + 1
        });

        this.scheduleRetry(stream.id);
      })
      .on('end', () => {
        console.log('FFmpeg进程结束:', stream.name);
        this.activeStreams.delete(stream.id);
        
        // 非正常结束时也进行重试
        if (stream.status !== 'stopped') {
          storage.updateStream(stream.id, {
            status: 'error',
            lastError: '流意外结束',
            retryCount: (stream.retryCount || 0) + 1
          });
          this.scheduleRetry(stream.id);
        }
      });

    this.activeStreams.set(stream.id, command);
    command.run();
    console.log('流已启动:', stream.name);
  }

  async stopStream(streamId: string): Promise<void> {
    const stream = storage.getStream(streamId);
    if (!stream) {
      throw new Error('流不存在');
    }

    // 清除重试计时器
    const timeout = this.retryTimeouts.get(streamId);
    if (timeout) {
      clearTimeout(timeout);
      this.retryTimeouts.delete(streamId);
    }

    console.log('准备停止流:', stream.name);
    const command = this.activeStreams.get(stream.id);
    if (command) {
      command.kill('SIGKILL');
      this.activeStreams.delete(stream.id);
      storage.updateStream(stream.id, { 
        status: 'stopped',
        retryCount: 0
      });
      console.log('流已停止:', stream.name);
    } else {
      console.log('流未运行:', stream.name);
    }
  }

  getStreamStatus(streamId: string): boolean {
    return this.activeStreams.has(streamId);
  }
}

export default new FFmpegService(); 