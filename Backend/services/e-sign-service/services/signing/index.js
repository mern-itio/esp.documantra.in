const digitalSignatureService = require("./digitalSignature.service");
const aadharVsignService = require("./aadhar.vsign.service");
const signValidationService = require("./signature.validation.service");
const signingServices = {
  draftAndSign: digitalSignatureService,
  vSign: aadharVsignService,
  validate:signValidationService
};

module.exports = signingServices;   