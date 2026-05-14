import { FastifyInstance } from 'fastify';
import { InputPlugin } from '../../types';
import { startGmailPoller } from './poller';

export const gmailInput: InputPlugin = {
  id: 'gmail',
  async register(_app: FastifyInstance) {
    await startGmailPoller();
  },
};
