import type { Router } from 'express';
import express from 'express';
import { getLogs } from '../logs.js';


export function buildSystemRouter(baseUrlResolver: () => string): Router {
const r = express.Router();


r.post('/restart', async (_req, res) => {
res.json({ message: 'Application is exiting.' });
setTimeout(() => process.exit(0), 150);
});


r.get('/logs', (_req, res) => {
res.json(getLogs());
});


r.get('/server-url', (req, res) => {
const hinted = baseUrlResolver();
const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
const host = (req.headers['x-forwarded-host'] as string) || req.get('host');
res.json({ url: hinted || `${proto}://${host}` });
});


return r;
}
