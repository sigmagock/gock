import dotenv from 'dotenv';
dotenv.config();


export const PORT = Number(process.env.PORT || 3000);
export const HOST = process.env.HOST || '0.0.0.0';
export const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL; // optional


export const SAFE_ROOT = (process.env.SAFE_ROOT || process.cwd()).replace(/\\/g, '/');
export const ALLOW_SHELL = process.env.ALLOW_SHELL === '1';
export const SHELL_TIMEOUT_MS = Number(process.env.SHELL_TIMEOUT_MS || 60_000);


export const PLS_RPC = process.env.PLS_RPC || 'https://rpc.pulsechain.com';
export const PLS_CHAIN_ID = 369;
