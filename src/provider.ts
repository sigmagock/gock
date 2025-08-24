import { JsonRpcProvider, Network } from 'ethers';
import { PLS_RPC, PLS_CHAIN_ID } from './env.js';


export const provider = new JsonRpcProvider(PLS_RPC, PLS_CHAIN_ID);
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
