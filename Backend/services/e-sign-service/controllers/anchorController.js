// controllers/anchorController.js
const DigitalSignature = require('../models/DigitalSignature');
const { verifyProof } = require('../services/anchoringService');
const { verifyOnChainTx } = require('../services/anchorVerifyOnChainService'); // optional helper below

/**
 * GET /api/anchor/signature/:id/verify
 * Returns:
 *  { ok: true, localProofValid: true/false, onChainMatch: true/false|null, details: {...} }
 */
async function verifyAnchorController(req, res) {
  try {
    const id = req.params.id;
    const sig = await DigitalSignature.findById(id).lean();
    if (!sig) return res.status(404).json({ ok: false, error: 'signature_not_found' });

    const anch = sig.anchoring;
    if (!anch || !anch.merkleRoot || !anch.merkleProof || !anch.leaf) {
      return res.status(400).json({ ok: false, error: 'no_anchoring_data', anchoring: anch || null });
    }

    // local Merkle proof verification
    let localProofValid = false;
    try {
      localProofValid = verifyProof(anch.leaf, anch.merkleProof, anch.merkleRoot);
    } catch (e) {
      console.warn('local proof verify error', e.message);
      localProofValid = false;
    }

    // Optional: verify the root exists in-chain (if txHash present)
    let onChainMatch = null;
    if (anch.txHash) {
      try {
        onChainMatch = await verifyOnChainTx(anch.txHash, anch.merkleRoot);
      } catch (e) {
        console.warn('onChain verify error', e.message);
        onChainMatch = null;
      }
    }

    return res.json({
      ok: true,
      localProofValid,
      onChainMatch,
      details: {
        signatureId: sig._id,
        envelopeId: sig.envelopeId,
        leaf: anch.leaf,
        merkleRoot: anch.merkleRoot,
        txHash: anch.txHash || null,
        merkleProof: anch.merkleProof
      }
    });
  } catch (err) {
    console.error('verifyAnchorController error', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

module.exports = { verifyAnchorController };
