import { buildServer } from './server';
import { registerInputs } from './inputs';
import { config } from './config';

async function main() {
  const app = buildServer();
  await registerInputs(app);
  await app.listen({ port: config.port, host: '0.0.0.0' });
  console.log(`Server listening on port ${config.port}`);
}

main().catch(err => { console.error(err); process.exit(1); });
