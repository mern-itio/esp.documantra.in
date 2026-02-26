// src/controllers/identityController.js
const diditProvider = require('../providers/diditProvider');
const identitySession = require('../models/identityModal');

exports.startIdentity = async (req, res) => {
  try {
    const { userId } = req.body;  

     const data = await diditProvider.createSession(userId);
     console.log('Didit response:', data);
       await identitySession.create({
            userId,
            sessionId: data.session_id
        });

    return res.json({ success: true, url:data.url });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start identity verification' });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const session = await identitySession.findOne({ userId }).sort({ createdAt: -1 });
    console.log('Session found:', session);
    if (!session) {
      return res.status(404).json({ error: 'No identity session found for this user' });
    }
    return res.json(session);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to get status' });
  }
};