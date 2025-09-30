// controllers/mergePdf.js
const PDFMerger = require('pdf-merger-js');
const fs = require('fs-extra');
const path = require('path');

const mergePDFs = async (files, orderedFilenames) => {
  try {
    const merger = new PDFMerger();

    // Map filenames to file objects
    const fileMap = {};
    files.forEach(file => {
      fileMap[file.originalname] = file;
    });

    // console.log('Files to merge:', orderedFilenames);
    // console.log('Available files:', Object.keys(fileMap));

    // Add files to merger in the specified order
    for (const name of orderedFilenames) {
      const file = fileMap[name];
      if (file) {
        // console.log(`Adding file: ${name} (${file.path})`);
        await merger.add(file.path);
      } else {
        throw new Error(`File ${name} not found in upload. Available: ${Object.keys(fileMap).join(', ')}`);
      }
    }

    // Ensure outputs directory exists
    const outputsDir = path.join(__dirname, '../outputs');
    await fs.ensureDir(outputsDir);

    // Create merged file path
    const timestamp = Date.now();
    const outputPath = path.join(outputsDir, `merged-${timestamp}.pdf`);
    
    // console.log(`Saving merged PDF to: ${outputPath}`);

    // Save the merged PDF
    await merger.save(outputPath);

    // Verify the file was created
    const fileExists = await fs.pathExists(outputPath);
    if (!fileExists) {
      throw new Error('Failed to create merged PDF file');
    }

    const stats = await fs.stat(outputPath);
    // console.log(`Merged PDF created successfully. Size: ${stats.size} bytes`);

    return outputPath;

  } catch (error) {
    console.error('Error in mergePDFs:', error);
    throw error;
  }
};

module.exports = { mergePDFs };
