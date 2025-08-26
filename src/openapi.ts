// The OpenAPI document provided/expanded earlier, served at /openapi.json
// (Updated with write-capable endpoints and AtropaMath helpers.)
export const openapi = {
openapi: '3.1.0',
info: { title: 'Terminal for ChatGPT', version: '1.2.0', description: 'Adds read-only + write PulseChain (chainId 369) RPC adapters.' },
servers: [{ url: 'http://localhost:3000' }],
tags: [
{ name: 'System' }, { name: 'Files' }, { name: 'Shell' }, { name: 'Chain' }, { name: 'IM' }
],
paths: {
'/api/restart': { post: { tags:['System'], summary: 'Restart the Node.js application.' } },
'/api/logs': { get: { tags:['System'], summary: 'Retrieves the server\'s logs' } },
'/api/server-url': { get: { tags:['System'], summary: 'Retrieves the server\'s URL' } },
'/api/read-or-edit-file': { get: { tags:['Files'], summary: 'Read a file content' }, post: { tags:['Files'], summary: 'Modify a file using search and replace command list' } },
'/api/runTerminalScript': { get: { tags:['Shell'], summary: 'Execute a shell command' } },
'/api/interrupt': { post: { tags:['Shell'], summary: 'Interrupts a running terminal command.' } },


// Chain 369
'/api/chain/info': { get: { tags:['Chain'], summary: 'Network info (PulseChain 369)' } },
'/api/chain/balance/{address}': { get: { tags:['Chain'], summary: 'Native balance (PLS) for an address' } },
'/api/chain/erc20-balance': { get: { tags:['Chain'], summary: 'ERC-20 balanceOf' } },
'/api/chain/block': { get: { tags:['Chain'], summary: 'Get block by number or hash' } },
'/api/chain/tx/{hash}': { get: { tags:['Chain'], summary: 'Get transaction by hash' } },
'/api/chain/tx/{hash}/receipt': { get: { tags:['Chain'], summary: 'Get transaction receipt' } },
'/api/chain/logs': { get: { tags:['Chain'], summary: 'Query logs' } },
'/api/chain/call': { post: { tags:['Chain'], summary: 'eth_call (read-only)' } },
'/api/chain/read-contract': { post: { tags:['Chain'], summary: 'Simple contract read by ABI fragment' } },


// New write endpoints
'/api/chain/send': { post: { tags:['Chain'], summary: 'Send native PLS (signed tx)' } },
'/api/chain/send-contract': { post: { tags:['Chain'], summary: 'Write to a smart contract (signed tx, gas-estimated)' } },


// AtropaMath helpers
'/api/chain/atropamath/preview': { post: { tags:['Chain'], summary: 'Dry-run AtropaMath Generate() with eth_call' } },
'/api/chain/atropamath/generate': { post: { tags:['Chain'], summary: 'Execute AtropaMath Generate() on-chain (signed tx)' } },


// IM lite
'/api/im/send': { post: { tags:['IM'], summary: 'Send a chat message to a room' } },
'/api/im/history': { get: { tags:['IM'], summary: 'Fetch recent chat messages' } },
'/api/im/rooms': { get: { tags:['IM'], summary: 'List rooms' } },
'/api/im/presence': { post: { tags:['IM'], summary: 'Update presence' } },
'/api/im/send-safe': { get: { tags:['IM'], summary: 'Send a chat message (GET-safe)' } }
}
} as const;
