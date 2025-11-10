/**
 * Global PDF.js Worker Configuration
 * This ensures all components use the correct worker version that matches react-pdf
 * Using react-pdf's recommended approach to set the worker from the package
 */

// Configure PDF.js worker globally using react-pdf's recommended method
// This ensures the worker version matches the PDF.js version used by react-pdf
if (typeof window !== 'undefined') {
  // Use react-pdf's recommended approach to get the worker URL
  // This will resolve to the correct worker file from the pdfjs-dist package
  // The ?url suffix tells Vite to treat it as a URL asset
  import('pdfjs-dist/build/pdf.worker.min.mjs?url').then((workerModule) => {
    const workerSrc = workerModule.default;
    
    // Store the worker URL globally so all components can use it
    (window as any).__PDFJS_WORKER_SRC__ = workerSrc;
    
    // Set for any existing window.pdfjsLib (used by other components)
    if (window.pdfjsLib?.GlobalWorkerOptions) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
    }
    
    // Configure react-pdf's pdfjs immediately if it's already loaded
    import('react-pdf').then((reactPdf) => {
      if (reactPdf.pdfjs?.GlobalWorkerOptions) {
        reactPdf.pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
      }
    }).catch(() => {
      // react-pdf not loaded yet, will be configured when imported
    });
  }).catch((err) => {
    console.warn('Failed to load PDF.js worker from package, using local file:', err);
    const fallbackWorker = '/pdf.worker.min.mjs';
    (window as any).__PDFJS_WORKER_SRC__ = fallbackWorker;
    
    if (window.pdfjsLib?.GlobalWorkerOptions) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = fallbackWorker;
    }
  });
  
  // Monitor for react-pdf imports and configure the worker
  // This ensures react-pdf uses the correct worker even if it loads after this config
  let reactPdfConfigured = false;
  const configureReactPdf = () => {
    if (reactPdfConfigured) return;
    
    import('react-pdf').then((reactPdf) => {
      const workerSrc = (window as any).__PDFJS_WORKER_SRC__;
      if (workerSrc && reactPdf.pdfjs?.GlobalWorkerOptions) {
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
  const workerSrc = (window as any).__PDFJS_WORKER_SRC__;
  if (workerSrc && pdfjsLib?.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
  } else {
    // Try to load from package
    try {
      const workerModule = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;
      (window as any).__PDFJS_WORKER_SRC__ = workerModule.default;
    } catch (error) {
      console.warn('Failed to set PDF.js worker from package, using local file:', error);
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }
  }
};

