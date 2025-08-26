const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs-extra');
const path = require('path');

/**
 * Insert pages into a PDF document
 * @param {string} inputPath - Path to the input PDF file
 * @param {Array} insertions - Array of insertion operations
 * @param {string} outputPath - Path to save the output PDF
 * @returns {Promise<Object>} - Result object with success status and file info
 */
async function insertPdfPages(inputPath, insertions, outputPath) {
  try {
    // console.log('Starting insertPdfPages with:', { inputPath, insertionsCount: insertions.length, outputPath });
    
    // Read the main PDF
    const mainBytes = await fs.readFile(inputPath);
    const mainPdf = await PDFDocument.load(mainBytes);
    const mainPages = mainPdf.getPages();
    const mainPageCount = mainPages.length;
    
    // console.log(`Main PDF has ${mainPageCount} pages`);
    
    // Create a new PDF document for the final result
    const finalPdf = await PDFDocument.create();
    
    // Sort insertions by position (ascending) to avoid index shifting issues
    const sortedInsertions = [...insertions].sort((a, b) => a.position - b.position);
    
    // console.log('Sorted insertions:', sortedInsertions);
    
    // Calculate the total number of pages we'll have
    let totalPages = mainPageCount;
    for (const insertion of sortedInsertions) {
      if (insertion.type === 'import') {
        totalPages++;
      } else if (insertion.type === 'blank') {
        totalPages++;
      }
    }
    
    // console.log(`Expected total pages: ${totalPages}`);
    
    // Create an array to hold all pages in the final order
    const finalPageOrder = [];
    
    // First, add all pages from the main document
    for (let i = 0; i < mainPageCount; i++) {
      finalPageOrder.push({ type: 'main', pageIndex: i, source: 'main' });
    }
    
    // console.log(`Added ${mainPageCount} main document pages to final order`);
    
    // Now process insertions to modify the final page order
    for (const insertion of sortedInsertions) {
      const { type, position, sourcePath, sourcePageIndex, blankPageSize } = insertion;
      
      // console.log(`Processing insertion:`, insertion);
      // console.log(`Insertion details: type=${type}, position=${position}, sourcePath=${sourcePath}, sourcePageIndex=${sourcePageIndex}, sourcePageIndexType=${typeof sourcePageIndex}`);
      
      if (type === 'blank') {
        // Insert blank page
        const pageSize = blankPageSize || { width: 595, height: 842 }; // Default A4 size
        finalPageOrder.splice(position - 1, 0, { type: 'blank', pageSize, source: 'blank' });
        // console.log(`Added blank page at position ${position}`);
        
      } else if (type === 'import' && sourcePath) {
        try {
          // Insert imported page
          finalPageOrder.splice(position - 1, 0, { 
            type: 'import', 
            sourcePath, 
            sourcePageIndex, 
            source: 'import' 
          });
          // console.log(`Added import page at position ${position} from ${sourcePath}, page ${sourcePageIndex} (0-based index)`);
        } catch (sourceError) {
          console.error(`Error processing import insertion:`, sourceError);
          throw new Error(`Failed to process import insertion: ${sourceError.message}`);
        }
      }
    }
    
    // console.log(`Final page order has ${finalPageOrder.length} items:`, finalPageOrder);
    
    // Now build the final PDF by adding pages in the correct order
    for (let i = 0; i < finalPageOrder.length; i++) {
      const pageItem = finalPageOrder[i];
      
      if (pageItem.type === 'main') {
        // Add page from main document
        // console.log(`Attempting to embed main document page ${pageItem.pageIndex}...`);
        const embedResult = await finalPdf.embedPdf(mainBytes, [pageItem.pageIndex]);
        // console.log(`Main embed result:`, embedResult, `Type:`, typeof embedResult, `Length:`, Array.isArray(embedResult) ? embedResult.length : 'not array');
        
        // Validate the embed result
        if (!embedResult || !Array.isArray(embedResult) || embedResult.length === 0) {
          throw new Error(`embedPdf returned invalid result for main document: ${JSON.stringify(embedResult)}`);
        }
        
        const importedPage = embedResult[0];
        // console.log(`Main imported page:`, importedPage, `Type:`, typeof importedPage);
        
        // Validate that the imported page is valid
        if (!importedPage || typeof importedPage !== 'object') {
          throw new Error(`Failed to import main document page ${pageItem.pageIndex + 1}. Got: ${JSON.stringify(importedPage)}`);
        }
        
        // Create a new page with the same dimensions as the imported page
        const newPage = finalPdf.addPage([importedPage.width, importedPage.height]);
        
        // Copy the content from the embedded page to the new page
        newPage.drawPage(importedPage);
        
        // console.log(`Added main document page ${pageItem.pageIndex + 1} at position ${i + 1}`);
        
      } else if (pageItem.type === 'import') {
        // Add page from source document
        try {
          // console.log(`Reading source PDF: ${pageItem.sourcePath}`);
          const sourceBytes = await fs.readFile(pageItem.sourcePath);
          const sourcePdf = await PDFDocument.load(sourceBytes);
          const sourcePageCount = sourcePdf.getPageCount();
          
          // console.log(`Source PDF has ${sourcePageCount} pages, requesting page ${pageItem.sourcePageIndex + 1} (0-based index: ${pageItem.sourcePageIndex})`);
          
          // Validate that the requested page exists
          if (pageItem.sourcePageIndex < 0 || pageItem.sourcePageIndex >= sourcePageCount) {
            throw new Error(`Source page index ${pageItem.sourcePageIndex} is out of range. Source PDF only has ${sourcePageCount} pages.`);
          }
          
          // console.log(`Attempting to embed page ${pageItem.sourcePageIndex} from source PDF...`);
          const embedResult = await finalPdf.embedPdf(sourceBytes, [pageItem.sourcePageIndex]);
          // console.log(`Embed result:`, embedResult, `Type:`, typeof embedResult, `Length:`, Array.isArray(embedResult) ? embedResult.length : 'not array');
          
          // Validate the embed result
          if (!embedResult || !Array.isArray(embedResult) || embedResult.length === 0) {
            throw new Error(`embedPdf returned invalid result: ${JSON.stringify(embedResult)}`);
          }
          
          const importedPage = embedResult[0];
          // console.log(`Imported page:`, importedPage, `Type:`, typeof importedPage);
          
          // Validate that the imported page is valid
          if (!importedPage || typeof importedPage !== 'object') {
            throw new Error(`Failed to import page ${pageItem.sourcePageIndex + 1} from source PDF. Got: ${JSON.stringify(importedPage)}`);
          }
          
          // console.log(`Successfully imported page, adding to final PDF...`);
          
          // Create a new page with the same dimensions as the imported page
          const newPage = finalPdf.addPage([importedPage.width, importedPage.height]);
          
          // Copy the content from the embedded page to the new page
          newPage.drawPage(importedPage);
          
          // console.log(`Added imported page ${pageItem.sourcePageIndex + 1} from source at position ${i + 1}`);
        } catch (sourceError) {
          console.error(`Error importing page from ${pageItem.sourcePath}:`, sourceError);
          throw new Error(`Failed to import page from source document: ${sourceError.message}`);
        }
        
      } else if (pageItem.type === 'blank') {
        // Add blank page
        const blankPage = finalPdf.addPage([pageItem.pageSize.width, pageItem.pageSize.height]);
        // console.log(`Added blank page at position ${i + 1}`);
      }
    }
    
    // console.log(`Final PDF has ${finalPdf.getPageCount()} pages`);
    
    // Save the final PDF
    const finalPdfBytes = await finalPdf.save();
    await fs.writeFile(outputPath, finalPdfBytes);
    
    // Get file info
    const stats = await fs.stat(outputPath);
    
    // console.log('PDF processing completed successfully');
    
    return {
      success: true,
      message: 'Pages inserted successfully',
      file: {
        filename: path.basename(outputPath),
        path: outputPath,
        size: stats.size
      },
      originalPageCount: mainPageCount,
      finalPageCount: finalPdf.getPageCount(),
      insertionsApplied: insertions.length
    };
    
  } catch (error) {
    console.error('Error inserting PDF pages:', error);
    throw error;
  }
}

/**
 * Reorder pages from a single PDF document
 * @param {string} inputPath - Path to the input PDF file
 * @param {Array} pageOrder - Array of page indices in the desired order (0-based)
 * @param {string} outputPath - Path to save the output PDF
 * @returns {Promise<Object>} - Result object with success status and file info
 */
async function reorderPdfPages(inputPath, pageOrder, outputPath) {
  try {
    // Read the input PDF
    const inputBytes = await fs.readFile(inputPath);
    const pdfDoc = await PDFDocument.load(inputBytes);
    
    // Get the original pages
    const originalPages = pdfDoc.getPages();
    const originalPageCount = originalPages.length;
    
    // Validate page order
    if (pageOrder.length !== originalPageCount) {
      throw new Error(`Page order length (${pageOrder.length}) must match original page count (${originalPageCount})`);
    }
    
    // Check if all indices are valid
    for (let i = 0; i < pageOrder.length; i++) {
      if (pageOrder[i] < 0 || pageOrder[i] >= originalPageCount) {
        throw new Error(`Invalid page index ${pageOrder[i]} at position ${i + 1}`);
      }
    }
    
    // Create a new PDF document
    const newPdfDoc = await PDFDocument.create();
    
    // Add pages in the new order
    for (const pageIndex of pageOrder) {
      const [importedPage] = await newPdfDoc.embedPdf(inputBytes, [pageIndex]);
      newPdfDoc.addPage(importedPage);
    }
    
    // Save the reordered PDF
    const reorderedPdfBytes = await newPdfDoc.save();
    await fs.writeFile(outputPath, reorderedPdfBytes);
    
    // Get file info
    const stats = await fs.stat(outputPath);
    
    return {
      success: true,
      message: 'Pages reordered successfully',
      file: {
        filename: path.basename(outputPath),
        path: outputPath,
        size: stats.size
      },
      originalPageCount,
      finalPageCount: newPdfDoc.getPageCount(),
      insertionsApplied: pageOrder.length
    };
    
  } catch (error) {
    console.error('Error reordering PDF pages:', error);
    throw error;
  }
}

/**
 * Get information about a PDF file
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<Object>} - PDF information
 */
async function getPDFInfo(filePath) {
  try {
    const inputBytes = await fs.readFile(filePath);
    const pdfDoc = await PDFDocument.load(inputBytes);
    const pages = pdfDoc.getPages();
    
    const pageDimensions = pages.length > 0 ? {
      width: pages[0].getWidth(),
      height: pages[0].getHeight()
    } : null;
    
    return {
      success: true,
      pages: pages.length,
      pageDimensions,
      size: inputBytes.length
    };
  } catch (error) {
    console.error('Error getting PDF info:', error);
    throw error;
  }
}

module.exports = {
  insertPdfPages,
  reorderPdfPages,
  getPDFInfo
};
