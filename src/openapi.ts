// The OpenAPI document provided/expanded earlier, served at /openapi.json
// (Kept inline for simplicity; you can import from a JSON file if you prefer.)
export const openapi = {
openapi: '3.1.0',
info: {
title: 'Terminal for ChatGPT',
version: '1.1.0',
description: 'Adds read-only PulseChain (chainId 369) RPC adapters.'
},
servers: [{ url: 'http://localhost:3000' }],
paths: {
'/api/restart': { post: { summary: 'Restart the Node.js application.' } },
'/api/logs': { get: { summary: 'Retrieves the server\'s logs' } },
'/api/server-url': { get: { summary: 'Retrieves the server\'s URL' } },
'/api/read-or-edit-file': {
get: { summary: 'Read a file content' },
post: { summary: 'Modify a file using search and replace command list' }
},
'/api/runTerminalScript': { get: { summary: 'Execute a shell command' } },
'/api/interrupt': { post: { summary: 'Interrupts a running terminal command.' } },


// Chain 369
'/api/chain/info': { get: { summary: 'Network info (PulseChain 369)' } },
'/api/chain/balance/{address}': { get: { summary: 'Native balance (PLS) for an address' } },
'/api/chain/erc20-balance': { get: { summary: 'ERC-20 balanceOf' } },
'/api/chain/block': { get: { summary: 'Get block by number or hash' } },
'/api/chain/tx/{hash}': { get: { summary: 'Get transaction by hash' } },
'/api/chain/tx/{hash}/receipt': { get: { summary: 'Get transaction receipt' } },
'/api/chain/logs': { get: { summary: 'Query logs' } },
'/api/chain/call': { post: { summary: 'eth_call (read-only)' } },
'/api/chain/read-contract': { post: { summary: 'Simple contract read by ABI fragment' } },


// IM lite
'/api/im/send': { post: { summary: 'Send a chat message to a room' } },
'/api/im/history': { get: { summary: 'Fetch recent chat messages' } },
'/api/im/rooms': { get: { summary: 'List rooms' } },
'/api/im/presence': { post: { summary: 'Update presence' } }
}
} as const;
