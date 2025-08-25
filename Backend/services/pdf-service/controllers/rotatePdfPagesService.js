const fs = require('fs-extra');
const path = require('path');
const { PDFDocument, degrees } = require('pdf-lib');

const rotatePdfPages = async (filePath, rotations = []) => {
  try {
    const fileBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(fileBytes);
    const totalPages = pdfDoc.getPageCount();

    if (totalPages === 0) {
      throw new Error('PDF has no pages');
    }

    // Validate rotation data
    for (const rotation of rotations) {
      if (!rotation.page || !rotation.angle) {
        throw new Error('Each rotation must have page and angle properties');
      }
      
      if (rotation.page < 1 || rotation.page > totalPages) {
        throw new Error(`Page number ${rotation.page} is out of range (1-${totalPages})`);
      }
      
      if (![90, 180, 270].includes(rotation.angle)) {
        throw new Error(`Invalid rotation angle: ${rotation.angle}. Must be 90, 180, or 270 degrees.`);
      }
    }

    // Apply rotations
    rotations.forEach(({ page, angle }) => {
      const pageIndex = page - 1;
      const targetPage = pdfDoc.getPage(pageIndex);
      targetPage.setRotation(degrees(angle));
    });

    // Ensure outputs directory exists
    const outputsDir = path.join(__dirname, '../outputs');
    await fs.ensureDir(outputsDir);

    // Generate output filename
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const outputPath = path.join(outputsDir, `rotated-pages-${timestamp}-${randomSuffix}.pdf`);

    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, pdfBytes);

    return outputPath;
  } catch (error) {
    throw new Error(`Failed to rotate pages: ${error.message}`);
  }
};

module.exports = { rotatePdfPages };
