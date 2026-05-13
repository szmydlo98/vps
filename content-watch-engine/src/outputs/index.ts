import { OutputPlugin } from '../types';
import { youtubeWatchLaterOutput } from './youtube-watch-later';

// Add new output plugins to this array to activate them
const outputs: OutputPlugin[] = [youtubeWatchLaterOutput];

export function getOutputPlugin(id: string): OutputPlugin | undefined {
  return outputs.find(o => o.id === id);
}
