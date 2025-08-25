import express from 'express';
import cors from 'cors';
import { HOST, PORT, PUBLIC_BASE_URL } from './env.js';
import { logger } from './logs.js';
import { buildSystemRouter } from './routes/system.js';
import { buildFileRouter } from './routes/files.js';
import { buildShellRouter } from './routes/shell.js';
import { buildChainRouter } from './routes/chain.js';
import { buildImRouter } from './routes/im.js';
import swaggerUi from 'swagger-ui-express';
import { openapi } from './openapi.js';

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(logger);

app.get('/openapi.json', (_req, res) => res.json(openapi));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi as any));

app.use('/api', buildSystemRouter(() => PUBLIC_BASE_URL || ''));
app.use('/api', buildFileRouter());
app.use('/api', buildShellRouter());
app.use('/api', buildChainRouter());
app.use('/api', buildImRouter());

app.get('/', (_req, res) => {
  res.type('text/plain').send('pulsechain-369-terminal-server: see /docs for API.');
});

app.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
