/**
 * Global PDF.js worker configuration for Vite.
 * Served from public/pdf.worker.min.mjs (copied at build from pdfjs-dist by vite.config.ts).
 */
export const PDFJS_WORKER_SRC = '/pdf.worker.min.mjs';

if (typeof window !== 'undefined') {
  (window as Window & { __PDFJS_WORKER_SRC__?: string; pdfjsLib?: { GlobalWorkerOptions?: { workerSrc: string } } })
    .__PDFJS_WORKER_SRC__ = PDFJS_WORKER_SRC;

  if (window.pdfjsLib?.GlobalWorkerOptions) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
  }

  let reactPdfConfigured = false;
  const configureReactPdf = () => {
    if (reactPdfConfigured) return;
    import('react-pdf')
      .then((reactPdf) => {
        if (reactPdf.pdfjs?.GlobalWorkerOptions) {
          reactPdf.pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
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
