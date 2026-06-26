const BRAND_NAME = String(process.env.APP_NAME || process.env.BRAND_NAME || 'Documantra').trim();

const formatEnvelopeSubject = (documentName) => {
  const label = String(documentName || '').trim() || 'Document';
  return `Complete with ${BRAND_NAME}: ${label}`;
};

module.exports = {
  BRAND_NAME,
  getBrandName: () => BRAND_NAME,
  formatEnvelopeSubject,
};
