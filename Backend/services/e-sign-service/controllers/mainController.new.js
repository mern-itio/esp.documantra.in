const envelopesData = async (req, res) => {
  const userId = req?.user?.data?.id;
  const userType = req?.userType;
  const filterUserId = req.query.userId;
  
  try {
    // Step 1: Build query
    let query = {};
    if (userType === 'admin') {
      if (filterUserId) {
        query.sender = filterUserId;
      }
    } else {
      query.sender = userId;
    }

    // Step 2: Fetch all envelopes with documents and recipients
    const envelopes = await Envelope.find(query)
      .sort({ createdAt: -1 })
      .populate('documentIds')
      .populate({
        path: 'recipientIds',
        model: 'Recipient',
        select: 'name email UserId',
      })
      .lean();

    if (!envelopes || envelopes.length === 0) {
      return res.status(404).json({ message: 'No envelopes found' });
    }

    // Step 3: Fetch permissions for each envelope separately
    for (const envelope of envelopes) {
      const envelopePermissions = await RecipientPermission.find({
        envelopeId: envelope._id,
        recipientId: { $in: envelope.recipientIds.map(r => r._id) }
      }).select('recipientId envelopeId role order status authLevel');

      // Create a map for quick lookup of permissions by recipient ID
      const permissionsByRecipient = new Map();
      envelopePermissions.forEach(permission => {
        permissionsByRecipient.set(permission.recipientId.toString(), permission);
      });

      // Attach permissions to recipients, ensuring each recipient only gets their permissions for this specific envelope
      envelope.recipientIds.forEach(recipient => {
        const permission = permissionsByRecipient.get(recipient._id.toString());
        recipient.permissions = permission ? [permission] : [];
      });
    }

    // Step 4: Fetch sender details
    const senderIds = [...new Set(envelopes.map(env => env.sender?.toString()).filter(Boolean))];
    const senderDetailsMap = {};

    await Promise.all(senderIds.map(async (senderId) => {
      try {
        const response = await axios.get(`${process.env.AUTH_URL}/api/user-details/${senderId}`, {
          headers: { Authorization: req.headers.authorization },
        });
        if (response.data?.data) {
          senderDetailsMap[senderId] = response.data.data;
        }
      } catch (err) {
        console.warn(`Failed to fetch sender details for ID ${senderId}:`, err.message);
      }
    }));

    // Step 5: Format the response
    const formattedEnvelopes = envelopes.map((envelope) => {
      const sender = senderDetailsMap[envelope.sender?.toString()] || {};
      return {
        id: envelope._id,
        subject: envelope.subject,
        status: envelope.status,
        priority: envelope.priority,
        createdAt: envelope.createdAt,
        sentAt: envelope.updatedAt,
        expiresAt: envelope.expirationDate,
        isPowerForm: envelope.isPowerForm,
        completionCertificate: envelope.completionCertificate,
        sender: {
          id: sender._id || envelope.sender,
          name: sender.fullname || 'Unknown',
          email: sender.email || 'N/A',
          role: sender.role || 'sender',
          organization: sender.organization || 'ITIO',
          avatar: sender.avatar || '',
        },
        signatureType: envelope.signatureType,
        documents: envelope.documentIds.map((doc) => ({
          id: doc._id,
          name: doc.fileName,
          size: doc.fileSize,
          type: doc.mimeType,
        })),
        recipients: envelope.recipientIds.map((recipient) => {
          const recipientPermissions = recipient.permissions[0] || {};
          return {
            id: recipient._id,
            name: recipient.name,
            email: recipient.email,
            role: recipientPermissions.role || '',
            order: recipientPermissions.order || 0,
            status: recipientPermissions.status || 'pending',
            authentication: recipientPermissions.authLevel || 'none',
          };
        }),
      };
    });

    // Step 6: Respond
    return res.status(200).json({
      status: 'success',
      data: formattedEnvelopes,
      totalEnvelopes: envelopes.length,
    });

  } catch (error) {
    console.error('Error fetching envelopes:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};