const Envelope = require('../models/Envelope');
const axios = require('axios');
const envelopesData = async (req, res) => {
    const userId = req.user.data.id;
    try {
        // Step 1: Fetch envelopes for the user
        const envelopes = await Envelope.find({ sender: userId })
                        .populate("documentIds")       // fetch docs
                        .populate("recipientIds");     // fetch recipients
        if (!envelopes || envelopes.length === 0) {
            return res.status(404).json({ message: 'No envelopes found' });
        }
        // Fetch sender details from User service
        const senderResponse = await axios.get(
        `${process.env.AUTH_URL}/api/user-details/${userId}`, //
                {
                    headers: {
                    Authorization: req.headers.authorization, // forward toke
                    },
                }
        );
        const senderDetails = senderResponse.data;
        if (!senderDetails || !senderDetails.data) {
            return res.status(404).json({ message: 'Sender not found' });
        }

        // Step 2: Format the response
        const formattedEnvelopes = envelopes.map(envelope => ({
        id: envelope._id,
        subject: envelope.subject,
        status: envelope.status,
        priority: envelope.priority,
        createdAt: envelope.createdAt,
        sentAt: envelope.updatedAt,
        expiresAt: envelope.expirationDate,
        sender:{
            id: senderDetails?.data?._id,
            name: senderDetails?.data?.fullname,
            email: senderDetails?.data?.email,
            role: senderDetails?.data?.role || 'sender',
            organization: "ITIO",
            avatar:""
        },
        signatureType: envelope.signatureType,
        documents: envelope.documentIds.map(doc => ({
            id: doc._id,
            name: doc.fileName,
            size: doc.fileSize,
            type: doc.mimeType
        })),
        recipients: envelope.recipientIds.map(recipient => ({
            id: recipient._id,
            name: recipient.name,
            email: recipient.email,
            role: recipient.role,
            order: recipient.order,
            status: recipient.status,
            authentication: recipient.authLevel
        })),
        }));

        // Step 3: Count the total number of envelopes
        const envelopeCount = envelopes.length;
    
        return res.status(200).json({
        status: 'success',
        data: formattedEnvelopes,
        totalEnvelopes: envelopeCount
        });
    } catch (error) {
        console.error('Error fetching envelopes:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
const envelopesDetail = async (req, res) => {
    const userId = req.user.data.id;
    const envelopeId = req.params.id;

    try {
        // Step 1: Fetch single envelope by ID
        const envelope = await Envelope.findById(envelopeId)
            .populate("documentIds")   // fetch docs
            .populate("recipientIds"); // fetch recipients

        if (!envelope) {
            return res.status(404).json({ message: 'Envelope not found' });
        }

        // Step 2: Fetch sender details from User service
        const senderResponse = await axios.get(
            `${process.env.AUTH_URL}/api/user-details/${userId}`,
            {
                headers: {
                    Authorization: req.headers.authorization, // forward token
                },
            }
        );

        const senderDetails = senderResponse.data;
        if (!senderDetails || !senderDetails.data) {
            return res.status(404).json({ message: 'Sender not found' });
        }

        // Step 3: Format the response (single envelope object)
        const formattedEnvelope = {
            id: envelope._id,
            subject: envelope.subject,
            status: envelope.status,
            priority: envelope.priority,
            createdAt: envelope.createdAt,
            sentAt: envelope.updatedAt,
            expiresAt: envelope.expirationDate,
            sender: {
                id: senderDetails?.data?._id,
                name: senderDetails?.data?.fullname,
                email: senderDetails?.data?.email,
                role: senderDetails?.data?.role || 'sender',
                organization: "ITIO",
                avatar: ""
            },
            signatureType: envelope.signatureType,
            documents: envelope.documentIds.map(doc => ({
                id: doc._id,
                name: doc.fileName,
                size: doc.fileSize,
                type: doc.mimeType
            })),
            recipients: envelope.recipientIds.map(recipient => ({
                id: recipient._id,
                name: recipient.name,
                email: recipient.email,
                role: recipient.role,
                order: recipient.order,
                status: recipient.status,
                authentication: recipient.authLevel
            }))
        };

        // Step 4: Return single envelope
        return res.status(200).json({
            status: 'success',
            data: formattedEnvelope
        });

    } catch (error) {
        console.error('Error fetching envelope:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
const getEnvelopeStats = async (req, res) => {
  try {
    const now = new Date();

    const stats = await Envelope.aggregate([
      {
        $addFields: {
          derivedStatus: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [
                      { $eq: ["$status", "in-progress"] },
                      { $lt: ["$expirationDate", now] }
                    ]
                  },
                  then: "expired"
                },
                { case: { $eq: ["$status", "draft"] }, then: "draft" },
                { case: { $eq: ["$status", "in-progress"] }, then: "pending" },
                { case: { $eq: ["$status", "completed"] }, then: "completed" }
              ],
              default: "unknown"
            }
          }
        }
      },
      {
        $group: {
          _id: "$derivedStatus",
          count: { $sum: 1 }
        }
      }
    ]);

    // Format response
    const response = {
      Completed: 0,
      Pending: 0,
      Expired: 0,
      Draft: 0,
      Total: 0
    };

    stats.forEach(item => {
      const key = item._id.charAt(0).toUpperCase() + item._id.slice(1);
      response[key] = item.count;
      response.Total += item.count;
    });

    return res.status(200).json({
      status: "success",
      data: response
    });
  } catch (error) {
    console.error("Error fetching envelope stats:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
const envelopExists = async (envelopeId) => {
  try {
    const envelope = await Envelope.findById(envelopeId);
    return !!envelope; // Returns true if envelope exists, false otherwise
  } catch (error) {
    console.error("Error checking envelope existence:", error);
    return false; // In case of error, assume envelope does not exist
  }
};


// Export functions
module.exports = {
  envelopesData,
  envelopesDetail,
  getEnvelopeStats,
  envelopExists
};