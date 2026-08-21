const mongoose = require('mongoose');

/**
 * Singleton VSign / Aadhaar eSign settings — admin-configurable.
 */
const VSignConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true, index: true },
    enabled: { type: Boolean, default: false },
    vsignEnv: { type: String, enum: ['uat', 'production'], default: 'uat' },
    certMode: { type: String, enum: ['live', 'uat'], default: 'live' },
    aspId: { type: String, default: 'IIPLUAT001' },
    vsignAuthPage: { type: String, default: 'https://esignuat.vsign.in/esp' },
    /** Public HTTPS logo URL for live VSign auth page (authpagev4) only. */
    vsignAuthLogoUrl: {
      type: String,
      default: '',
    },
    vsignCallbackUrl: {
      type: String,
      default: 'https://esp.documantra.in/esign/api/e-sign/public/v-sign/response',
    },
    vsignEspResponseUrl: { type: String, default: '' },
    utilityUrl: { type: String, default: 'http://127.0.0.1:7077' },
    pfxPath: { type: String, default: 'uploads/vSign/signCertificate.pfx' },
    pfxPassword: { type: String, default: '', select: false },
    pfxAlias: { type: String, default: '' },
    publicCertPath: { type: String, default: 'uploads/vSign/ITIO_PUBLIC_KEY.cer' },
    dmEncryptionKeyPath: { type: String, default: 'uploads/vSign/dm_encryption_key.pfx' },
    dmEncryptionKeyPassword: { type: String, default: '', select: false },
    appearanceMode: { type: String, default: 'custom-tick' },
    useJar: { type: Boolean, default: true },
    signatureFontSize: { type: String, default: '10' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model('VSignConfig', VSignConfigSchema);
