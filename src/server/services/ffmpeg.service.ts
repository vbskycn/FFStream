import { spawn } from 'child_process';
import { Stream } from '../models/stream.model';

export class FFmpegService {
  private processes: Map<string, any> = new Map();

  async startStream(stream: any) {
    const args = [
      '-i', stream.inputUrl,
      '-c:v', 'copy',
      '-c:a', 'copy',
      '-f', 'flv',
      `${process.env.PUSH_SERVER}${stream.name}`
    ];

    const ffmpeg = spawn('ffmpeg', args);
    this.processes.set(stream._id, ffmpeg);

    ffmpeg.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    ffmpeg.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });

    await Stream.findByIdAndUpdate(stream._id, { status: 'running' });
  }

  async stopStream(streamId: string) {
    const process = this.processes.get(streamId);
    if (process) {
      process.kill();
      this.processes.delete(streamId);
      await Stream.findByIdAndUpdate(streamId, { status: 'stopped' });
    }
  }
} 