import express, { Router } from 'express';

interface Message {
  id: string;
  roomId: string;
  from: string;
  text: string;
  ts: number;
}
interface Presence { user: string; roomId: string; lastSeen: number; }

const rooms = new Set<string>(['general']);
const messages: Message[] = [];
const presence: Presence[] = [];

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function buildImRouter(): Router {
  const r = express.Router();

  r.post('/im/send', (req, res) => {
    const { roomId, from, text } = req.body || {};
    if (!roomId || typeof roomId !== 'string') return res.status(400).json({ error: 'roomId required' });
    if (!from || typeof from !== 'string') return res.status(400).json({ error: 'from required' });
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text required' });
    rooms.add(roomId);
    const msg: Message = { id: uid(), roomId, from, text, ts: Date.now() };
    messages.push(msg);
    res.json({ ok: true, message: msg });
  });

  r.get('/im/history', (req, res) => {
    const roomId = String(req.query.roomId || 'general');
    const sinceTs = Number(req.query.sinceTs || 0);
    const limit = Math.min(Number(req.query.limit || 100), 500);
    const out = messages
      .filter((m) => m.roomId === roomId && m.ts > sinceTs)
      .sort((a, b) => a.ts - b.ts)
      .slice(-limit);
    res.json({ roomId, messages: out, now: Date.now() });
  });

  r.get('/im/rooms', (_req, res) => {
    res.json({ rooms: Array.from(rooms) });
  });

  r.post('/im/presence', (req, res) => {
    const { roomId, user } = req.body || {};
    if (!roomId || !user) return res.status(400).json({ error: 'roomId & user required' });
    const now = Date.now();
    const idx = presence.findIndex((p) => p.roomId === roomId && p.user === user);
    if (idx >= 0) presence[idx].lastSeen = now;
    else presence.push({ roomId, user, lastSeen: now });
    const active = presence
      .filter((p) => p.roomId === roomId && now - p.lastSeen < 60_000)
      .map((p) => p.user);
    res.json({ roomId, active, now });
  });

  return r;
}
