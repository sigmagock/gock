import { JsonRpcProvider, Wallet, Network } from 'ethers';
import { PLS_RPC, PLS_CHAIN_ID } from './env.js';

export const provider = new JsonRpcProvider(PLS_RPC, PLS_CHAIN_ID);

export function getWallet() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error('No PRIVATE_KEY set');
  return new Wallet(pk, provider);
}

export async function chainInfo() {
  const [blockNumber, net] = await Promise.all([
    provider.getBlockNumber(),
    provider.getNetwork()
  ]);
  const network = net as Network;
  return {
    chainId: Number(network.chainId),
    name: network.name || 'PulseChain',
    rpcUrl: PLS_RPC,
    latestBlock: '0x' + blockNumber.toString(16)
  };
}
