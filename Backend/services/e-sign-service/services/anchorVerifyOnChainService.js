// services/anchorVerifyOnChainService.js
const ethers = require('ethers');

function getProvider() {
  const RPC_URL = process.env.ANCHOR_RPC_URL;
  if (!RPC_URL) return null;
  return new ethers.providers.JsonRpcProvider(RPC_URL);
}

async function verifyOnChainTx(txHash, expectedRootHex) {
  const provider = getProvider();
  if (!provider) throw new Error('RPC provider not configured');
  if (!txHash) throw new Error('txHash required');

  const expected = (expectedRootHex || '').toLowerCase();
  const tx = await provider.getTransaction(txHash);
  if (!tx) throw new Error('tx_not_found');
  const onchainData = (tx.data || '').toLowerCase();

  const exactMatch = onchainData === expected;
  const containsRoot = onchainData.includes(expected.replace(/^0x/, ''));

  return {
    found: !!tx,
    exactMatch,
    containsRoot,
    onchainData,
    blockNumber: tx.blockNumber,
    to: tx.to,
  };
}

module.exports = { verifyOnChainTx };
