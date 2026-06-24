const buildDocumentAccessQuery = (documentId, userId, userEmail) => ({
  _id: documentId,
  isDeleted: { $ne: true },
  $or: [
    { ownerId: userId },
    { uploadedBy: userId },
    { 'sharedWith.userId': userId },
    ...(userEmail
      ? [
          { 'sharedWith.userId': userEmail },
          { 'sharedWith.email': userEmail },
        ]
      : []),
    { isPublic: true },
  ],
});

module.exports = {
  buildDocumentAccessQuery,
};
