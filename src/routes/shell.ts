import type { Router } from 'express';
import express from 'express';
import { exec, ChildProcess } from 'child_process';
import { ALLOW_SHELL, SHELL_TIMEOUT_MS } from '../env.js';


let running: ChildProcess | null = null;


export function buildShellRouter(): Router {
const r = express.Router();


r.get('/runTerminalScript', async (req, res) => {
if (!ALLOW_SHELL) return res.status(403).json({ error: 'Shell disabled. Set ALLOW_SHELL=1 to enable.' });
const command = String(req.query.command || '');
if (!command) return res.status(400).json({ error: 'Missing command' });


if (running) return res.status(409).json({ error: 'Another command is running. Interrupt first.' });


running = exec(command, { timeout: SHELL_TIMEOUT_MS, windowsHide: true }, (err, stdout, stderr) => {
// No response here; handled below via event listeners
});


let combined = '';
running.stdout?.on('data', (d) => (combined += String(d)));
running.stderr?.on('data', (d) => (combined += String(d)));


running.on('close', (code, signal) => {
running = null;
res.json({ message: `Command finished (code=${code}, signal=${signal})`, output: combined });
});


running.on('error', (err) => {
running = null;
res.status(500).json({ error: String(err) });
});
});


r.post('/interrupt', async (_req, res) => {
if (!running) return res.json({ message: 'No command running.' });
running.kill('SIGINT');
res.json({ message: 'Interrupt signal sent.' });
});


return r;
}
