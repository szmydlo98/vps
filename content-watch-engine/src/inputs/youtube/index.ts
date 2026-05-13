import { InputPlugin } from '../../types';
import { parseAtom } from './parser';
import { subscribeAll, startSubscriptionCron } from './subscribe';
import { process } from '../../pipeline';

export const youtubeInput: InputPlugin = {
  id: 'youtube',
  async register(app) {
    // GET — hub verification challenge
    app.get('/webhook/youtube', async (req, reply) => {
      const { 'hub.mode': mode, 'hub.challenge': challenge } = req.query as Record<string, string>;
      if (mode === 'subscribe' && challenge) return reply.send(challenge);
      return reply.code(400).send();
    });

    // POST — new video notification
    app.post('/webhook/youtube', async (req, reply) => {
      reply.code(204).send();

      const item = await parseAtom(req.body as string).catch(() => null);
      if (!item) return;
      await process(item).catch(err => console.error('[youtube] pipeline error:', err));
    });

    await subscribeAll();
    startSubscriptionCron();
  },
};
