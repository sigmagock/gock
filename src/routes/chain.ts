import express, { Router } from 'express';
import { provider, chainInfo } from '../provider.js';
import { Contract, isHexString } from 'ethers';

function parseBlockTag(tag?: string) {
  if (!tag) return 'latest' as const;
  const allowed = ['latest', 'safe', 'finalized'];
  return (allowed as string[]).includes(tag) ? (tag as any) : 'latest';
}

export function buildChainRouter(): Router {
  const r = express.Router();

  r.get('/chain/info', async (_req, res) => {
    try { res.json(await chainInfo()); }
    catch (e: any) { res.status(500).json({ error: e?.message || 'failed' }); }
  });

  r.get('/chain/balance/:address', async (req, res) => {
    try {
      const { address } = req.params as { address: string };
      const blockTag = parseBlockTag(String(req.query.blockTag || ''));
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return res.status(400).json({ error: 'Invalid address' });
      const wei = await provider.getBalance(address, blockTag);
      res.json({ wei: '0x' + wei.toString(16) });
    } catch (e: any) { res.status(500).json({ error: e?.message || 'failed' }); }
  });

  r.get('/chain/erc20-balance', async (req, res) => {
    try {
      const token  = String(req.query.token  || '');
      const holder = String(req.query.holder || '');
      if (!/^0x[a-fA-F0-9]{40}$/.test(token) || !/^0x[a-fA-F0-9]{40}$/.test(holder)) {
        return res.status(400).json({ error: 'Invalid token or holder address' });
      }
      const erc20 = new Contract(token, [
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)',
        'function balanceOf(address) view returns (uint256)',
      ], provider);
      const [decimals, symbol, balance] = await Promise.all([
        erc20.decimals(), erc20.symbol(), erc20.balanceOf(holder),
      ]);
      res.json({ balance: balance.toString(), decimals: Number(decimals), symbol: String(symbol) });
    } catch (e: any) { res.status(500).json({ error: e?.message || 'failed' }); }
  });

  // v6: pick the right method; there is NO boolean arg
  r.get('/chain/block', async (req, res) => {
    try {
      const num = req.query.number as string | undefined;
      const hash = req.query.hash as string | undefined;
      const includeTxs = String(req.query.includeTxs || 'false') === 'true';
      if (!num && !hash) return res.status(400).json({ error: 'Provide number or hash' });

      const getBlock = includeTxs
        ? provider.getBlockWithTransactions.bind(provider)
        : provider.getBlock.bind(provider);

      let block: any;
      if (hash) {
        block = await getBlock(hash);                   // by hash
      } else {
        const n = isHexString(num!) ? BigInt(num!) : BigInt(num!);
        block = await getBlock(n);                      // by number (hex or decimal)
      }
      res.json(block);
    } catch (e: any) { res.status(500).json({ error: e?.message || 'failed' }); }
  });

  r.get('/chain/tx/:hash', async (req, res) => {
    try {
      const { hash } = req.params;
      if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) return res.status(400).json({ error: 'Invalid tx hash' });
      const tx = await provider.getTransaction(hash);
      res.json(tx);
    } catch (e: any) { res.status(500).json({ error: e?.message || 'failed' }); }
  });

  r.get('/chain/tx/:hash/receipt', async (req, res) => {
    try {
      const { hash } = req.params;
      if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) return res.status(400).json({ error: 'Invalid tx hash' });
      const rcpt = await provider.getTransactionReceipt(hash);
      res.json(rcpt);
    } catch (e: any) { res.status(500).json({ error: e?.message || 'failed' }); }
  });

  r.get('/chain/logs', async (req, res) => {
    try {
      const fromBlock = (req.query.fromBlock as string) || undefined;
      const toBlock   = (req.query.toBlock   as string) || undefined;
      const addressCsv = (req.query.address as string) || '';
      const topicsCsv  = (req.query.topics  as string) || '';

      const addresses = addressCsv ? addressCsv.split(',').map(s => s.trim()) : undefined;
      const topics = topicsCsv
        ? topicsCsv.split(',').map(slot => slot.includes('|')
            ? slot.split('|').map(t => (t === 'null' ? null : t))
            : slot)
        : undefined;

      const filter: any = {};
      if (fromBlock) filter.fromBlock = fromBlock;
      if (toBlock)   filter.toBlock   = toBlock;
      if (addresses && addresses.length) filter.address = addresses.length === 1 ? addresses[0] : addresses;
      if (topics) filter.topics = topics as any;

      const logs = await provider.getLogs(filter);
      res.json(logs);
    } catch (e: any) { res.status(500).json({ error: e?.message || 'failed' }); }
  });

  r.post('/chain/call', async (req, res) => {
    try {
      const { to, data, blockTag } = req.body as { to: string; data: string; blockTag?: string };
      if (!/^0x[a-fA-F0-9]{40}$/.test(to)) return res.status(400).json({ error: 'Invalid `to` address' });
      if (!isHexString(data)) return res.status(400).json({ error: 'Invalid calldata' });
      const ret = await provider.call({ to, data }, parseBlockTag(blockTag));
      res.json({ data: ret });
    } catch (e: any) { res.status(500).json({ error: e?.message || 'failed' }); }
  });

  r.post('/chain/read-contract', async (req, res) => {
    try {
      const { address, abiFragment, functionName, args } = req.body as any;
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return res.status(400).json({ error: 'Invalid contract address' });
      const c = new Contract(address, [abiFragment], provider);
      const fn = (c as any)[functionName as string];
      if (typeof fn !== 'function') return res.status(400).json({ error: 'Function not found on contract' });
      const result = await fn.apply(c, Array.isArray(args) ? args : []);
      res.json({ result });
    } catch (e: any) { res.status(500).json({ error: e?.message || 'failed' }); }
  });

  return r;
}
