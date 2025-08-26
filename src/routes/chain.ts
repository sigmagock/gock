import type { Router } from 'express';
const c = new Contract(address, [abiFragment], provider);
const fn = (c as any)[functionName as string];
if (typeof fn !== 'function') return res.status(400).json({ error: 'Function not found on contract' });
const result = await fn.apply(c, Array.isArray(args) ? args : []);
res.json({ result });
} catch (e: any) { res.status(500).json({ error: e?.message || 'failed' }); }
});


// ---- Native send (signed)
r.post('/chain/send', async (req, res) => {
try {
const { to, value } = req.body as { to: string; value: string };
if (!/^0x[a-fA-F0-9]{40}$/.test(to)) return res.status(400).json({ error: 'Invalid recipient address' });
if (!/^0x[0-9a-fA-F]+$/.test(String(value))) return res.status(400).json({ error: 'value must be hex wei (e.g. 0xDE0B6B3A7640000)' });
const wallet = getWallet();
const tx = await wallet.sendTransaction({ to, value });
res.json({ txHash: tx.hash });
} catch (e: any) { res.status(500).json({ error: e?.message || 'send failed' }); }
});


// ---- Generic contract write with gas estimation
r.post('/chain/send-contract', async (req, res) => {
try {
const { address, abiFragment, functionName, args, value } = req.body as {
address: string; abiFragment: string; functionName: string; args?: any[]; value?: string;
};
if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return res.status(400).json({ error: 'Invalid contract address' });
const wallet = getWallet();
const c = new Contract(address, [abiFragment], wallet);
const fn = (c as any)[functionName];
if (typeof fn !== 'function') return res.status(400).json({ error: 'Function not found' });
const txReq: any = { value: value ? BigInt(value) : undefined };
const gasEstimate = await (c.estimateGas as any)[functionName](...(args || []), txReq);
const gasLimit = (gasEstimate * 120n) / 100n;
const tx = await fn(...(args || []), { ...txReq, gasLimit });
res.json({ txHash: tx.hash, gasEstimate: gasEstimate.toString(), gasLimit: gasLimit.toString() });
} catch (e: any) { res.status(500).json({ error: e?.message || 'contract send failed' }); }
});


// ---- AtropaMath preview (eth_call)
r.post('/chain/atropamath/preview', async (req, res) => {
try {
const { address } = req.body as { address: string };
if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return res.status(400).json({ error: 'Invalid contract address' });
const c = new Contract(address, [ 'function Generate() returns (uint64)' ], provider);
const result = await c.Generate();
res.json({ result: result.toString() });
} catch (e: any) { res.status(500).json({ error: e?.message || 'preview failed' }); }
});


// ---- AtropaMath generate (signed)
r.post('/chain/atropamath/generate', async (req, res) => {
try {
const { address } = req.body as { address: string };
if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return res.status(400).json({ error: 'Invalid contract address' });
const wallet = getWallet();
const c = new Contract(address, [ 'function Generate() returns (uint64)' ], wallet);
const gasEstimate = await c.estimateGas.Generate();
const gasLimit = (gasEstimate * 120n) / 100n;
const tx = await c.Generate({ gasLimit });
res.json({ txHash: tx.hash, gasEstimate: gasEstimate.toString(), gasLimit: gasLimit.toString() });
} catch (e: any) { res.status(500).json({ error: e?.message || 'generate failed' }); }
});


return r;
}
