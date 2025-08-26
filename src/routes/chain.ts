// ============================== src/routes/chain.ts ==========================
import type { Router } from 'express';
import express from 'express';
import { provider, chainInfo, getWallet } from '../provider.js';
import { Contract, isHexString } from 'ethers';

/** normalize ethers v6 blockTag */
function parseBlockTag(tag?: string) {
  if (!tag) return 'latest' as const;
  const allowed = ['latest', 'safe', 'finalized'];
  return (allowed as string[]).includes(tag) ? (tag as any) : 'latest';
}

export function buildChainRouter(): Router {
  const r = express.Router();

  // ─────────────────────────── network info
  r.get('/chain/info', async (_req, res) => {
    try {
      res.json(await chainInfo());
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'failed' });
    }
  });

  // ─────────────────────────── native balance
  r.get('/chain/balance/:address', async (req, res) => {
    try {
      const { address } = req.params as { address: string };
      const blockTag = parseBlockTag(String(req.query.blockTag || ''));
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return res.status(400).json({ error: 'Invalid address' });
      }
      const wei = await provider.getBalance(address, blockTag);
      res.json({ wei: '0x' + wei.toString(16) });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'failed' });
    }
  });

  // ─────────────────────────── erc20 balance
  r.get('/chain/erc20-balance', async (req, res) => {
    try {
      const token = String(req.query.token || '');
      const holder = String(req.query.holder || '');
      if (!/^0x[a-fA-F0-9]{40}$/.test(token) || !/^0x[a-fA-F0-9]{40}$/.test(holder)) {
        return res.status(400).json({ error: 'Invalid token or holder address' });
      }
      const erc20 = new Contract(
        token,
        [
          'function decimals() view returns (uint8)',
          'function symbol() view returns (string)',
          'function balanceOf(address) view returns (uint256)',
        ],
        provider
      );
      const [decimals, symbol, balance] = await Promise.all([
        erc20.decimals(),
        erc20.symbol(),
        erc20.balanceOf(holder),
      ]);
      res.json({ balance: balance.toString(), decimals: Number(decimals), symbol: String(symbol) });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'failed' });
    }
  });

  // ─────────────────────────── block by number/hash (v6-safe)
  r.get('/chain/block', async (req, res) => {
    try {
      const num = req.query.number as string | undefined;
      const hash = req.query.hash as string | undefined;
      const includeTxs = String(req.query.includeTxs || 'false') === 'true';
      if (!num && !hash) return res.status(400).json({ error: 'Provide number or hash' });

      if (includeTxs) {
        if (hash) {
          const block = await provider.send('eth_getBlockByHash', [hash, true]);
          return res.json(block);
        } else {
          const n = isHexString(num!) ? num! : '0x' + BigInt(num!).toString(16);
          const block = await provider.send('eth_getBlockByNumber', [n, true]);
          return res.json(block);
        }
      } else {
        let block: any;
        if (hash) block = await provider.getBlock(hash);
        else {
          const n = isHexString(num!) ? BigInt(num!) : BigInt(num!);
          block = await provider.getBlock(n);
        }
        return res.json(block);
      }
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'failed' });
    }
  });

  // ─────────────────────────── tx + receipt
  r.get('/chain/tx/:hash', async (req, res) => {
    try {
      const { hash } = req.params;
      if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) return res.status(400).json({ error: 'Invalid tx hash' });
      const tx = await provider.getTransaction(hash);
      res.json(tx);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'failed' });
    }
  });

  r.get('/chain/tx/:hash/receipt', async (req, res) => {
    try {
      const { hash } = req.params;
      if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) return res.status(400).json({ error: 'Invalid tx hash' });
      const rcpt = await provider.getTransactionReceipt(hash);
      res.json(rcpt);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'failed' });
    }
  });

  // ─────────────────────────── logs
  r.get('/chain/logs', async (req, res) => {
    try {
      const fromBlock = (req.query.fromBlock as string) || undefined;
      const toBlock = (req.query.toBlock as string) || undefined;
      const addressCsv = (req.query.address as string) || '';
      const topicsCsv = (req.query.topics as string) || '';

      const addresses = addressCsv ? addressCsv.split(',').map((s) => s.trim()) : undefined;
      const topics = topicsCsv
        ? topicsCsv
            .split(',')
            .map((slot) => (slot.includes('|') ? slot.split('|').map((t) => (t === 'null' ? null : t)) : slot))
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

  // ─────────────────────────── eth_call
  r.post('/chain/call', async (req, res) => {
    try {
      const { to, data, blockTag } = req.body as { to: string; data: string; blockTag?: string };
      if (!/^0x[a-fA-F0-9]{40}$/.test(to)) return res.status(400).json({ error: 'Invalid `to` address' });
      if (!isHexString(data)) return res.status(400).json({ error: 'Invalid calldata' });
const ret = await provider.call({
  to,
  data,
  blockTag: parseBlockTag(blockTag) as any, // BlockTag fits TransactionRequest in v6
});
      res.json({ data: ret });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'failed' });
    }
  });

  // ─────────────────────────── read contract via ABI fragment
  r.post('/chain/read-contract', async (req, res) => {
    try {
      const { address, abiFragment, functionName, args } = req.body as any;
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

  // ─────────────────────────── send native PLS (signed)
  r.post('/chain/send', async (req, res) => {
    try {
      const { to, value } = req.body as { to: string; value: string };
      if (!/^0x[a-fA-F0-9]{40}$/.test(to)) return res.status(400).json({ error: 'Invalid recipient address' });
      if (!/^0x[0-9a-fA-F]+$/.test(String(value)))
        return res.status(400).json({ error: 'value must be hex wei (e.g. 0xDE0B6B3A7640000)' });
      const wallet = getWallet();
      const tx = await wallet.sendTransaction({ to, value });
      res.json({ txHash: tx.hash });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'send failed' });
    }
  });

  // ─────────────────────────── generic contract write (gas-estimated)
  r.post('/chain/send-contract', async (req, res) => {
    try {
      const { address, abiFragment, functionName, args, value } = req.body as {
        address: string;
        abiFragment: string;
        functionName: string;
        args?: any[];
        value?: string; // hex wei
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
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'contract send failed' });
    }
  });

  // ─────────────────────────── AtropaMath preview (eth_call)
  r.post('/chain/atropamath/preview', async (req, res) => {
    try {
      const { address } = req.body as { address: string };
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return res.status(400).json({ error: 'Invalid contract address' });

const c = new Contract(address, ['function Generate() returns (uint64)'], provider);

// v6-typed handle
const method = c.getFunction('Generate');
const result = await method.staticCall();   // read-only
res.json({ result: result.toString() });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'preview failed' });
    }
  });

  // ─────────────────────────── AtropaMath generate (signed + gas-estimated)
r.post('/chain/atropamath/generate', async (req, res) => {
  try {
    const { address } = req.body as { address: string };
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid contract address' });
    }

    const wallet = getWallet();
    const abi = [
      "function Generate() returns (uint64)",
      "event DysnomiaNuclearEvent(string What, uint64 Value)"
    ];
    const c = new Contract(address, abi, wallet);
    const method = c.getFunction("Generate");

    // estimate gas
    const gasEstimate = await method.estimateGas();
    const gasLimit = (gasEstimate * 120n) / 100n;

    // send tx
    const tx = await method.send({ gasLimit });

    // wait for mining
    const receipt = await tx.wait();
    if (!receipt) {
      return res.status(500).json({ error: "Transaction receipt is null (not mined yet)" });
    }

    // parse logs for DysnomiaNuclearEvent
    let generated: string | null = null;
    for (const log of receipt.logs || []) {
      try {
        const parsed = c.interface.parseLog(log);
        if (parsed && parsed.name === "DysnomiaNuclearEvent") {
          generated = parsed.args?.Value?.toString?.() ?? null;
          break;
        }
      } catch {
        // ignore unrelated logs
      }
    }

    res.json({
      txHash: tx.hash,
      gasEstimate: gasEstimate.toString(),
      gasLimit: gasLimit.toString(),
      result: generated
    });
