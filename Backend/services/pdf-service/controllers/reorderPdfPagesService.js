const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

const reorderPdfPages = async (filePath, newOrder = []) => {
  const fileBytes = fs.readFileSync(filePath);
  const originalPdf = await PDFDocument.load(fileBytes);
  const totalPages = originalPdf.getPageCount();

  const newPdf = await PDFDocument.create();

  // Ensure all values are valid page indices (1-based input)
  const pageIndices = newOrder.map(p => parseInt(p) - 1);

  for (const index of pageIndices) {
    if (index < 0 || index >= totalPages) {
      throw new Error(`Invalid page number: ${index + 1}`);
    }

    const [copiedPage] = await newPdf.copyPages(originalPdf, [index]);
    newPdf.addPage(copiedPage);
  }

  const outputPath = path.join("split", `reordered-${Date.now()}.pdf`);
  const pdfBytes = await newPdf.save();
  fs.writeFileSync(outputPath, pdfBytes);

  return outputPath;
};

module.exports = { reorderPdfPages };
