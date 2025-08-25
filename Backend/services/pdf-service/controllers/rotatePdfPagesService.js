const fs = require("fs");
const path = require("path");
const { PDFDocument, degrees } = require("pdf-lib");

const rotatePdfPages = async (filePath, rotations = []) => {
  const fileBytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(fileBytes);
  const totalPages = pdfDoc.getPageCount();

  rotations.forEach(({ page, angle }) => {
    const pageIndex = page - 1;
    if (pageIndex >= 0 && pageIndex < totalPages) {
      const targetPage = pdfDoc.getPage(pageIndex);
      targetPage.setRotation(degrees(angle));
    }
  });

  const outputPath = path.join("split", `rotated-${Date.now()}.pdf`);
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);

  return outputPath;
};

module.exports = { rotatePdfPages };
