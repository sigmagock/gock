import type { Router } from 'express';
const rcpt = await provider.getTransactionReceipt(hash);
res.json(rcpt);
} catch (e: any) {
res.status(500).json({ error: e?.message || 'failed' });
}
});


r.get('/chain/logs', async (req, res) => {
try {
const fromBlock = (req.query.fromBlock as string) || undefined;
const toBlock = (req.query.toBlock as string) || undefined;
const addressCsv = (req.query.address as string) || '';
const topicsCsv = (req.query.topics as string) || '';


const addresses = addressCsv ? addressCsv.split(',').map((s) => s.trim()) : undefined;
const topics = topicsCsv
? topicsCsv.split(',').map((slot) => (slot.includes('|') ? slot.split('|').map((t) => (t === 'null' ? null : t)) : slot))
: undefined;


const filter: any = {};
if (fromBlock) filter.fromBlock = fromBlock;
if (toBlock) filter.toBlock = toBlock;
if (addresses && addresses.length) filter.address = addresses.length === 1 ? addresses[0] : addresses;
if (topics) filter.topics = topics as any;


const logs = await provider.getLogs(filter);
res.json(logs);
} catch (e: any) {
res.status(500).json({ error: e?.message || 'failed' });
}
});


r.post('/chain/call', async (req, res) => {
try {
const { to, data, blockTag } = req.body as { to: string; data: string; blockTag?: string };
if (!/^0x[a-fA-F0-9]{40}$/.test(to)) return res.status(400).json({ error: 'Invalid `to` address' });
if (!isHexString(data)) return res.status(400).json({ error: 'Invalid calldata' });
const ret = await provider.call({ to, data }, parseBlockTag(blockTag));
res.json({ data: ret });
} catch (e: any) {
res.status(500).json({ error: e?.message || 'failed' });
}
});


r.post('/chain/read-contract', async (req, res) => {
try {
const { address, abiFragment, functionName, args, blockTag } = req.body as any;
if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return res.status(400).json({ error: 'Invalid contract address' });
const c = new Contract(address, [abiFragment], provider);
const fn = (c as any)[functionName as string];
if (typeof fn !== 'function') return res.status(400).json({ error: 'Function not found on contract' });
const result = await fn.apply(c, Array.isArray(args) ? args : []);
res.json({ result });
} catch (e: any) {
res.status(500).json({ error: e?.message || 'failed' });
}
});


return r;
}
