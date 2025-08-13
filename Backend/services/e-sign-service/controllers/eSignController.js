
const { isEmailValid } = require('@draftnsign/validators');// const { verifyJWT } = require('@draftnsign/auth-lib');

// Documents Upload 
const Upload = async (req, res) => {
  console.log('Files received', req);
    const { files } = req;
    if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
    }
    
    const fileNames = files.map(file => file.originalname);
    console.log('Uploaded files:', fileNames);
    
    // return res.status(200).json({
    //     status: 'success',
    //     message: 'Files uploaded successfully',
    //     data: fileNames
    // });
};


// Export functions
module.exports = {
  Upload
};
