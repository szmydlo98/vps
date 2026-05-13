import Fastify from 'fastify';
import { config } from './config';

export function buildServer() {
  const app = Fastify({ logger: { level: config.logLevel } });

  app.addContentTypeParser(
    ['application/atom+xml', 'application/xml', 'text/xml'],
    { parseAs: 'string' },
    (_req, body, done) => done(null, body)
  );

  return app;
}
