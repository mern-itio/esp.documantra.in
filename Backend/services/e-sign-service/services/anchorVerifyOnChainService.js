// services/anchorVerifyOnChainService.js
const ethers = require('ethers');

const RPC_URL = process.env.ANCHOR_RPC_URL;
const provider = RPC_URL ? new ethers.providers.JsonRpcProvider(RPC_URL) : null;

async function verifyOnChainTx(txHash, expectedRootHex) {
  if (!provider) throw new Error('RPC provider not configured');
  if (!txHash) throw new Error('txHash required');

  // ensure expectedRootHex normalized (0x...)
  const expected = (expectedRootHex || '').toLowerCase();
  const tx = await provider.getTransaction(txHash);
  if (!tx) throw new Error('tx_not_found');
  // tx.data is hex string (0x...)
  const onchainData = (tx.data || '').toLowerCase();

  // sometimes stored data might be exactly the root, sometimes more structured.
  // we'll return boolean match and also include onchainData for inspection.
  const exactMatch = onchainData === expected;
  const containsRoot = onchainData.includes(expected.replace(/^0x/, ''));

  return {
    found: !!tx,
    exactMatch,
    containsRoot,
    onchainData,
    blockNumber: tx.blockNumber,
    to: tx.to
  };
}

module.exports = { verifyOnChainTx };
