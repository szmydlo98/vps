import { FastifyInstance } from 'fastify';
import { youtubeInput } from './youtube';

// Add new input plugins to this array to activate them
const inputs = [youtubeInput];

export async function registerInputs(app: FastifyInstance): Promise<void> {
  for (const input of inputs) {
    await input.register(app);
  }
}
