/**
 * Global PDF.js worker configuration for Vite.
 * Uses the worker bundled from pdfjs-dist (same version as react-pdf).
 */
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export const PDFJS_WORKER_SRC = workerSrc;

if (typeof window !== 'undefined') {
  (window as Window & { __PDFJS_WORKER_SRC__?: string; pdfjsLib?: { GlobalWorkerOptions?: { workerSrc: string } } })
    .__PDFJS_WORKER_SRC__ = workerSrc;

  if (window.pdfjsLib?.GlobalWorkerOptions) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
  }

  let reactPdfConfigured = false;
  const configureReactPdf = () => {
    if (reactPdfConfigured) return;
    import('react-pdf')
      .then((reactPdf) => {
        if (reactPdf.pdfjs?.GlobalWorkerOptions) {
          reactPdf.pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
          reactPdfConfigured = true;
        }
      })
      .catch(() => {
        /* react-pdf not loaded yet */
      });
  };

  configureReactPdf();

  const checkInterval = window.setInterval(() => {
    if (!reactPdfConfigured) {
      configureReactPdf();
    } else {
      window.clearInterval(checkInterval);
    }
  }, 100);

  window.setTimeout(() => window.clearInterval(checkInterval), 5000);
}

export const configurePDFWorker = (pdfjsLib: { GlobalWorkerOptions?: { workerSrc: string } }) => {
  if (pdfjsLib?.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
  }
};
