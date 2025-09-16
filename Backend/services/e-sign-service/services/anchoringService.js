// services/anchoringService.js
const { MerkleTree } = require('merkletreejs');
const crypto = require('crypto');
const ethers = require('ethers');

const DigitalSignature = require('../models/DigitalSignature');
const AuditTrail = require('../models/AuditTrail'); // optional

// env
const RPC_URL = process.env.ANCHOR_RPC_URL;
const PRIVATE_KEY = process.env.ANCHOR_WALLET_PRIVATE_KEY || '';
const CHAIN_NAME = process.env.ANCHOR_CHAIN_NAME || 'sepolia';
const BATCH_SIZE = Number(process.env.ANCHOR_BATCH_SIZE || 200);

if (!RPC_URL) {
  console.warn('Anchoring: ANCHOR_RPC_URL not set — anchoring disabled');
}
if (!PRIVATE_KEY) {
  console.warn('Anchoring: ANCHOR_WALLET_PRIVATE_KEY not set — anchoring disabled');
}

const provider = RPC_URL ? new ethers.providers.JsonRpcProvider(RPC_URL) : null;
const wallet = PRIVATE_KEY && provider ? new ethers.Wallet(PRIVATE_KEY, provider) : null;

// helper: sha256 -> Buffer
function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest();
}

// Build merkle using sha256 (consistent with pdfHash which is SHA-256 hex)
function buildMerkleFromHex(hexList) {
  if (!Array.isArray(hexList) || hexList.length === 0) {
    return { tree: null, leaves: [], rootHex: null };
  }

  // leaves as Buffers
  const leaves = hexList.map(h => Buffer.from(h.replace(/^0x/, ''), 'hex'));
  const tree = new MerkleTree(leaves, sha256, { sortPairs: true });
  const rootBuf = tree.getRoot();
  const rootHex = (rootBuf && rootBuf.length) ? '0x' + rootBuf.toString('hex') : null;
  return { tree, leaves, rootHex };
}

// publish root on-chain: simple zero-value tx with data=root (dev/simple approach)
async function publishRootOnChain(hexRoot) {
  if (!wallet) throw new Error('No wallet configured for anchoring');
  if (!hexRoot) throw new Error('empty root');

  // ensure 0x prefix
  const data = hexRoot.startsWith('0x') ? hexRoot : '0x' + hexRoot;

  const tx = await wallet.sendTransaction({
    to: wallet.address,   // self-send
    value: 0,
    data
  });

  const receipt = await tx.wait(1); // wait for 1 confirmation
  return { txHash: receipt.transactionHash, blockNumber: receipt.blockNumber };
}

// main batch function
async function runAnchoringBatch(batchSize = BATCH_SIZE) {
  if (!wallet) {
    console.warn('Anchoring disabled: wallet not configured');
    return null;
  }

  // find pending signatures (no anchoring.txHash)
  const pending = await DigitalSignature.find({ 'anchoring.txHash': { $exists: false } }).limit(batchSize).lean();
  if (!pending || pending.length === 0) {
    console.log('Anchoring: nothing to anchor');
    return null;
  }

  // normalize pdfHash and validate format
  const pdfHashes = pending.map(p => {
    const h = (p.pdfHash || '').replace(/^0x/, '');
    if (!/^[0-9a-fA-F]{64}$/.test(h)) throw new Error('invalid pdfHash for id ' + p._id);
    return h.toLowerCase();
  });

  // build Merkle tree
  const { tree, leaves, rootHex } = buildMerkleFromHex(pdfHashes);
  if (!rootHex) throw new Error('empty merkle root');

  console.log('Anchoring: merkle root =', rootHex, 'count =', pending.length);

  // publish to chain
  const chainResult = await publishRootOnChain(rootHex);
  const txHash = chainResult.txHash;
  const blockNumber = chainResult.blockNumber;
  console.log('Anchoring txHash:', txHash, 'block:', blockNumber);

  // store per-doc anchoring: proof array (0x..), root, index, txHash, chain
  for (let i = 0; i < pending.length; i++) {
    const sig = pending[i];
    const leaf = Buffer.from(pdfHashes[i], 'hex');

    // get proof objects and convert to hex array
    const proofObjs = tree.getProof(leaf);
    const proofHex = proofObjs.map(p => '0x' + p.data.toString('hex'));

    // get leaf index: prefer tree.getLeafIndex if available, otherwise fallback
    let index = null;
    if (typeof tree.getLeafIndex === 'function') {
      try { index = tree.getLeafIndex(leaf); } catch (e) { index = null; }
    }
    if (index === null) {
      index = leaves.findIndex(l => l.equals(leaf));
    }

    await DigitalSignature.updateOne({ _id: sig._id }, {
      $set: {
        'anchoring.chain': CHAIN_NAME,
        'anchoring.txHash': txHash,
        'anchoring.blockNumber': blockNumber,
        'anchoring.merkleRoot': rootHex,
        'anchoring.merkleProof': proofHex,
        'anchoring.leafIndex': index,
        'anchoring.leaf': '0x' + pdfHashes[i]
      }
    });

    // optional audit record
    try {
      await AuditTrail.create({
        envelopeId: sig.envelopeId,
        recipientId: sig.recipientId,
        action: 'BLOCKCHAIN_ANCHORED',
        details: { signatureId: sig._id.toString(), txHash, merkleRoot: rootHex, index }
      });
    } catch (e) {
      // non-fatal - continue
      console.warn('Anchoring: failed to write audit for', sig._id, e.message || e);
    }
  }

  return { txHash, merkleRoot: rootHex, count: pending.length, blockNumber };
}

// Verify a proof locally (returns true/false)
function verifyProof(leafHex, proofHexArray, rootHex) {
  if (!leafHex || !rootHex || !Array.isArray(proofHexArray)) return false;
  const leaf = Buffer.from(leafHex.replace(/^0x/, ''), 'hex');
  const proof = proofHexArray.map(h => Buffer.from(h.replace(/^0x/, ''), 'hex'));
  const root = Buffer.from(rootHex.replace(/^0x/, ''), 'hex');
  return MerkleTree.verify(proof, leaf, root, sha256, { sortPairs: true });
}

module.exports = { runAnchoringBatch, buildMerkleFromHex, publishRootOnChain, verifyProof };
