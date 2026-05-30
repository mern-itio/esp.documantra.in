/**
 * Global PDF.js Worker Configuration
 * This ensures all components use the worker from the public folder
 * Using /pdf.worker.min.mjs from the public directory
 */

// Configure PDF.js worker globally to use the public folder worker
if (typeof window !== 'undefined') {
  // Use worker from public folder
const workerSrc = '/pdf.worker.min.mjs';
  
  // Store globally 
(window as any).__PDFJS_WORKER_SRC__ = workerSrc;
  
  // Set for any existing window.pdfjsLib (used by other components)
  if (window.pdfjsLib?.GlobalWorkerOptions) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
  }
  
  // Monitor for react-pdf imports and configure the worker
  // This ensures react-pdf uses the correct worker even if it loads after this config
  let reactPdfConfigured = false;
  const configureReactPdf = () => {
    if (reactPdfConfigured) return;
    
    import('react-pdf').then((reactPdf) => {
      if (reactPdf.pdfjs?.GlobalWorkerOptions) {
        reactPdf.pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
        reactPdfConfigured = true;
      }
    }).catch(() => {
      // react-pdf not available yet
    });
  };
  
  // Try to configure react-pdf immediately
  configureReactPdf();
  
  // Also check periodically for react-pdf to be loaded
  const checkInterval = setInterval(() => {
    if (!reactPdfConfigured) {
      configureReactPdf();
    } else {
      clearInterval(checkInterval);
    }
  }, 100);
  
  // Stop checking after 5 seconds
  setTimeout(() => clearInterval(checkInterval), 5000);
}

// Export a function to configure worker for components that load pdfjs-dist dynamically
export const configurePDFWorker = async (pdfjsLib: any) => {
  const workerSrc = '/pdf.worker.min.mjs';
  if (pdfjsLib?.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
  }
};


