import type { Router } from 'express';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { SAFE_ROOT } from '../env.js';


function safeJoinSafeRoot(p: string) {
const target = path.resolve(SAFE_ROOT, p);
const root = path.resolve(SAFE_ROOT);
if (!target.startsWith(root)) throw new Error('Path escapes SAFE_ROOT');
return target;
}


export function buildFileRouter(): Router {
const r = express.Router();


r.get('/read-or-edit-file', async (req, res) => {
try {
const filePath = String(req.query.filePath || '');
if (!filePath) return res.status(400).json({ error: 'Missing filePath' });
const full = safeJoinSafeRoot(filePath);
const content = await fs.readFile(full, 'utf8');
res.type('text/plain').send(content);
} catch (err: any) {
res.status(400).json({ error: err?.message || 'Error reading the file' });
}
});


r.post('/read-or-edit-file', async (req, res) => {
try {
const { filePath, replacements } = req.body as {
filePath: string;
replacements: { originalText: string; replacementText: string }[];
};
if (!filePath) return res.status(400).json({ error: 'Missing filePath' });
const full = safeJoinSafeRoot(filePath);
let content = await fs.readFile(full, 'utf8');
if (Array.isArray(replacements)) {
for (const { originalText, replacementText } of replacements) {
if (typeof originalText !== 'string') continue;
const pattern = new RegExp(originalText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
content = content.replace(pattern, String(replacementText ?? ''));
}
await fs.writeFile(full, content, 'utf8');
}
res.json({ content });
} catch (err: any) {
res.status(400).json({ error: err?.message || 'Edit failed' });
}
});


return r;
}
