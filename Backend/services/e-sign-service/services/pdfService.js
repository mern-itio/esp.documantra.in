const axios = require('axios');
const fs = require('fs');

async function prepareDocForSignature(payload) {

  try {
    const javaServiceUrl = process.env.PDF_SIGNATURE_JAVA_SERVICE_URL || 'http://localhost:2115';
    const response = await axios.post(
      `${javaServiceUrl}/api/pdf/prepare-template`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Response:', response.data);
    return response.data;

  } catch (error) {
    console.error('Error preparing document:', error.response?.data || error.message);
    throw error;
  }
}

async function embedFieldsValueToPDF(payload) {
  try{
    const javaServiceUrl = process.env.PDF_SIGNATURE_JAVA_SERVICE_URL || 'http://localhost:2115';
    const response = await axios.post(
      `${javaServiceUrl}/api/pdf/embed-values`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Response:', response.data);
    return response.data;

  }catch (err){
    console.log(err);
    throw new Error("Error occurred while embedding fields value to PDF");
  }
}

async function pdfToBase64(filePath) {
  try {
    const fileBuffer = await fs.readFileSync(filePath);
    const base64String = fileBuffer.toString('base64');
    return base64String;
  } catch (err) {
    console.error('Error converting PDF to Base64:', err);
    throw err;
  }
}
async function base64ToPdf(base64String, outPath) {
  try {
    const buffer = Buffer.from(base64String, 'base64');
    await fs.writeFileSync(outPath, buffer);
    
    return outPath;
  } catch (err) {
    console.error('Error converting Base64 to PDF:', err);
    throw err;
  }
}

module.exports = {
  prepareDocForSignature,
  pdfToBase64,
  base64ToPdf,
  embedFieldsValueToPDF
};