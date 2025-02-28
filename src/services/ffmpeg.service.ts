import ffmpeg from 'fluent-ffmpeg';
import { EventEmitter } from 'events';
import config from '../../config/default';
import Stream, { IStream } from '../models/stream.model';

class FFmpegService extends EventEmitter {
  private activeStreams: Map<string, ffmpeg.FfmpegCommand>;

  constructor() {
    super();
    this.activeStreams = new Map();
  }

  async startStream(stream: IStream): Promise<void> {
    if (this.activeStreams.has(stream.outputKey)) {
      throw new Error('Stream already running');
    }

    const command = ffmpeg(stream.inputUrl)
      .outputOptions([
        '-c:v copy',
        '-c:a copy',
        '-f flv'
      ])
      .output(`${config.stream.pushServer}${stream.outputKey}`)
      .on('start', async (commandLine) => {
        console.log('FFmpeg 进程启动:', commandLine);
        await Stream.findByIdAndUpdate(stream._id, { 
          status: 'running',
          lastError: null
        });
      })
      .on('error', async (err) => {
        console.error('FFmpeg 错误:', err.message);
        await Stream.findByIdAndUpdate(stream._id, {
          status: 'error',
          lastError: err.message
        });
        this.activeStreams.delete(stream.outputKey);
      })
      .on('end', async () => {
        console.log('FFmpeg 进程结束');
        await Stream.findByIdAndUpdate(stream._id, { 
          status: 'stopped',
          processId: null
        });
        this.activeStreams.delete(stream.outputKey);
      });

    this.activeStreams.set(stream.outputKey, command);
    command.run();
  }

  async stopStream(outputKey: string): Promise<void> {
    const command = this.activeStreams.get(outputKey);
    if (command) {
      command.kill('SIGKILL');
      this.activeStreams.delete(outputKey);
      const stream = await Stream.findOne({ outputKey });
      if (stream) {
        await Stream.findByIdAndUpdate(stream._id, { 
          status: 'stopped',
          processId: null
        });
      }
    }
  }

  async restartStream(stream: IStream): Promise<void> {
    await this.stopStream(stream.outputKey);
    await this.startStream(stream);
  }

  getStreamStatus(outputKey: string): boolean {
    return this.activeStreams.has(outputKey);
  }
}

export default new FFmpegService(); 