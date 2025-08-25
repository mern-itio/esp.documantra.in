const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

const deletePdfPages = async (filePath, pagesToDelete = []) => {
  const fileBytes = fs.readFileSync(filePath);
  const originalPdf = await PDFDocument.load(fileBytes);
  const totalPages = originalPdf.getPageCount();

  const newPdf = await PDFDocument.create();

  // Convert to 0-based index and sort
  const toDelete = new Set(pagesToDelete.map(p => parseInt(p) - 1));

  for (let i = 0; i < totalPages; i++) {
    if (!toDelete.has(i)) {
      const [copiedPage] = await newPdf.copyPages(originalPdf, [i]);
      newPdf.addPage(copiedPage);
    }
  }

  const outputPath = path.join("split", `deleted-pages-${Date.now()}.pdf`);
  const newBytes = await newPdf.save();
  fs.writeFileSync(outputPath, newBytes);

  return outputPath;
};

module.exports = { deletePdfPages };
