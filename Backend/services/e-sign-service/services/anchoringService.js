// services/anchoringService.js
const { MerkleTree } = require('merkletreejs');
const crypto = require('crypto');
const ethers = require('ethers');

const DigitalSignature = require('../models/DigitalSignature');
const { AuditTrail } = require('../models/AuditTrail');

const BATCH_SIZE_DEFAULT = 200;
const PDF_HASH_HEX_RE = /^[0-9a-fA-F]{64}$/;

function getAnchorConfig() {
  const RPC_URL = process.env.ANCHOR_RPC_URL || '';
  const PRIVATE_KEY = process.env.ANCHOR_WALLET_PRIVATE_KEY || '';
  const CHAIN_NAME = process.env.ANCHOR_CHAIN_NAME || 'sepolia';
  const BATCH_SIZE = Number(process.env.ANCHOR_BATCH_SIZE || BATCH_SIZE_DEFAULT);
  return { RPC_URL, PRIVATE_KEY, CHAIN_NAME, BATCH_SIZE };
}

function getWallet() {
  const { RPC_URL, PRIVATE_KEY } = getAnchorConfig();
  if (!RPC_URL || !PRIVATE_KEY) return null;
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  return new ethers.Wallet(PRIVATE_KEY, provider);
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest();
}

function buildMerkleFromHex(hexList) {
  if (!Array.isArray(hexList) || hexList.length === 0) {
    return { tree: null, leaves: [], rootHex: null };
  }

  const leaves = hexList.map((h) => Buffer.from(h.replace(/^0x/, ''), 'hex'));
  const tree = new MerkleTree(leaves, sha256, { sortPairs: true });
  const rootBuf = tree.getRoot();
  const rootHex = rootBuf && rootBuf.length ? `0x${rootBuf.toString('hex')}` : null;
  return { tree, leaves, rootHex };
}

async function publishRootOnChain(hexRoot) {
  const wallet = getWallet();
  if (!wallet) throw new Error('No wallet configured for anchoring');
  if (!hexRoot) throw new Error('empty root');

  const data = hexRoot.startsWith('0x') ? hexRoot : `0x${hexRoot}`;

  const tx = await wallet.sendTransaction({
    to: wallet.address,
    value: 0,
    data,
  });

  const receipt = await tx.wait(1);
  return { txHash: receipt.transactionHash, blockNumber: receipt.blockNumber };
}

async function runAnchoringBatch(batchSize) {
  const { CHAIN_NAME, BATCH_SIZE } = getAnchorConfig();
  const limit = Number(batchSize) > 0 ? Number(batchSize) : BATCH_SIZE;

  if (!getWallet()) {
    console.warn('Anchoring disabled: ANCHOR_RPC_URL / ANCHOR_WALLET_PRIVATE_KEY not configured');
    return null;
  }

  // Only pick signatures with a valid SHA-256 pdfHash and no tx yet
  // (avoids invalid rows forever filling the batch window).
  const candidates = await DigitalSignature.find({
    $and: [
      {
        $or: [
          { 'anchoring.txHash': { $exists: false } },
          { 'anchoring.txHash': null },
          { 'anchoring.txHash': '' },
        ],
      },
      { pdfHash: { $regex: /^([0-9a-fA-F]{64}|0x[0-9a-fA-F]{64})$/ } },
    ],
  })
    .limit(limit)
    .lean();

  if (!candidates || candidates.length === 0) {
    console.log('Anchoring: nothing to anchor');
    return null;
  }

  const pending = [];
  const pdfHashes = [];
  for (const p of candidates) {
    const h = String(p.pdfHash || '').replace(/^0x/, '').toLowerCase();
    if (!PDF_HASH_HEX_RE.test(h)) {
      console.warn('Anchoring: skipping invalid pdfHash for id', p._id);
      continue;
    }
    pending.push(p);
    pdfHashes.push(h);
  }
  if (pending.length === 0) {
    console.log('Anchoring: no valid pending hashes to anchor');
    return null;
  }

  const { tree, leaves, rootHex } = buildMerkleFromHex(pdfHashes);
  if (!rootHex) throw new Error('empty merkle root');

  console.log('Anchoring: merkle root =', rootHex, 'count =', pending.length);

  const chainResult = await publishRootOnChain(rootHex);
  const txHash = chainResult.txHash;
  const blockNumber = chainResult.blockNumber;
  console.log('Anchoring txHash:', txHash, 'block:', blockNumber);

  const anchoredAt = new Date();

  for (let i = 0; i < pending.length; i++) {
    const sig = pending[i];
    const leaf = Buffer.from(pdfHashes[i], 'hex');

    const proofObjs = tree.getProof(leaf);
    const proofHex = proofObjs.map((p) => `0x${p.data.toString('hex')}`);

    let index = null;
    if (typeof tree.getLeafIndex === 'function') {
      try {
        index = tree.getLeafIndex(leaf);
      } catch (e) {
        index = null;
      }
    }
    if (index === null) {
      index = leaves.findIndex((l) => l.equals(leaf));
    }

    await DigitalSignature.updateOne(
      { _id: sig._id },
      {
        $set: {
          'anchoring.chain': CHAIN_NAME,
          'anchoring.txHash': txHash,
          'anchoring.blockNumber': blockNumber,
          'anchoring.merkleRoot': rootHex,
          'anchoring.merkleProof': proofHex,
          'anchoring.leafIndex': index,
          'anchoring.leaf': `0x${pdfHashes[i]}`,
          'anchoring.anchoredAt': anchoredAt,
        },
      }
    );

    try {
      await AuditTrail.create({
        envelopeId: sig.envelopeId,
        recipientId: sig.recipientId,
        action: 'BLOCKCHAIN_ANCHORED',
        details: {
          signatureId: sig._id.toString(),
          txHash,
          merkleRoot: rootHex,
          index,
          chain: CHAIN_NAME,
          blockNumber,
        },
      });
    } catch (e) {
      console.warn('Anchoring: failed to write audit for', sig._id, e.message || e);
    }
  }

  return { txHash, merkleRoot: rootHex, count: pending.length, blockNumber, chain: CHAIN_NAME };
}

function verifyProof(leafHex, proofHexArray, rootHex) {
  if (!leafHex || !rootHex || !Array.isArray(proofHexArray)) return false;
  const leaf = Buffer.from(String(leafHex).replace(/^0x/, ''), 'hex');
  const proof = proofHexArray.map((h) => Buffer.from(String(h).replace(/^0x/, ''), 'hex'));
  const root = Buffer.from(String(rootHex).replace(/^0x/, ''), 'hex');
  return MerkleTree.verify(proof, leaf, root, sha256, { sortPairs: true });
}

module.exports = {
  runAnchoringBatch,
  buildMerkleFromHex,
  publishRootOnChain,
  verifyProof,
  getAnchorConfig,
};
