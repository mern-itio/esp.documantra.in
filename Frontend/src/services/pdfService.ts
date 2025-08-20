import { pdfApi } from './apiHelper';

// PDF Service API functions
export const pdfService = {
  // Health check
  checkHealth: async () => {
    try {
      const response = await pdfApi.get('/health');
      return response.data;
    } catch (error) {
      console.error('PDF Service health check failed:', error);
      throw error;
    }
  },

  // Convert PDF to DOCX
  convertPdfToDoc: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await pdfApi.post('/pdf/pdf-to-doc', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('PDF to DOC conversion failed:', error);
      throw error;
    }
  },

  // Convert PDF to Excel
  convertPdfToExcel: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await pdfApi.post('/pdf/pdf-to-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('PDF to Excel conversion failed:', error);
      throw error;
    }
  },

  // Convert PDF to PowerPoint
  convertPdfToPpt: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await pdfApi.post('/pdf/pdf-to-ppt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('PDF to PowerPoint conversion failed:', error);
      throw error;
    }
  },

  // Convert PDF to TXT
  convertPdfToTxt: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await pdfApi.post('/pdf/pdf-to-txt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('PDF to TXT conversion failed:', error);
      throw error;
    }
  },

  // Convert PDF to HTML
  convertPdfToHtml: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await pdfApi.post('/pdf/pdf-to-html', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('PDF to HTML conversion failed:', error);
      throw error;
    }
  },

  // Convert DOC/DOCX to PDF
  convertDocToPdf: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await pdfApi.post('/pdf/doc-to-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('DOC to PDF conversion failed:', error);
      throw error;
    }
  },

  // Convert Excel to PDF
  convertExcelToPdf: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await pdfApi.post('/pdf/excel-to-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Excel to PDF conversion failed:', error);
      throw error;
    }
  },

  // Convert PowerPoint to PDF (Advanced)
  convertPptToPdf: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await pdfApi.post('/pdf/ppt-to-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('PowerPoint to PDF conversion failed:', error);
      throw error;
    }
  },

  // Convert PowerPoint to PDF (Basic)
  convertPptToPdfBasic: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await pdfApi.post('/pdf/ppt-to-pdf-basic', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('PowerPoint to PDF basic conversion failed:', error);
      throw error;
    }
  },

  // Convert TXT to PDF
  convertTxtToPdf: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await pdfApi.post('/pdf/txt-to-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('TXT to PDF conversion failed:', error);
      throw error;
    }
  },

  // Convert HTML to PDF
  convertHtmlToPdf: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await pdfApi.post('/pdf/html-to-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('HTML to PDF conversion failed:', error);
      throw error;
    }
  },

  // Test HTML to PDF conversion
  testHtmlToPdf: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await pdfApi.post('/pdf/test-html-to-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('HTML to PDF conversion test failed:', error);
      throw error;
    }
  },
  convertPdftoImage: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await pdfApi.post('/convert/pdf-to-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('PDF to Image conversion failed:', error);
      throw error;
    }
  },

convertImgToPdf: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('images', file);

      const response = await pdfApi.post('/convert/images-to-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Images to PDF conversion failed:', error);
      throw error;
    }
  },

  convertPdfToEpub: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await pdfApi.post('/convert/pdf-to-epub', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes timeout for complex EPUB conversion
      });

      return response.data;
    } catch (error) {
      console.error('PDF to EPUB conversion failed:', error);
      throw error;
    }
  },

  // Batch conversion for multiple files
  batchConvert: async (files: File[], outputFormats: string[]) => {
    try {
      const formData = new FormData();
      
      // Add files
      files.forEach((file) => {
        formData.append('files', file);
      });
      
      // Add output formats
      formData.append('outputFormats', JSON.stringify(outputFormats));

      const response = await pdfApi.post('/convert/batch-convert', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 600000, // 10 minutes timeout for batch conversion
      });

      return response.data;
    } catch (error) {
      console.error('Batch conversion failed:', error);
      throw error;
    }
  },
  // Download converted file
  downloadFile: async (downloadUrl: string, filename: string) => {
    try {
      // For static file downloads, we don't need authentication
      // Use direct fetch instead of the authenticated pdfApi
      const baseUrl = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';
      const fullUrl = `${baseUrl}${downloadUrl}`;
      
      console.log(`Downloading file from: ${fullUrl}`);
      
      const response = await fetch(fullUrl);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log(`File downloaded successfully: ${filename}`);
      return true;
    } catch (error) {
      console.error('File download failed:', error);
      throw error;
    }
  },

  // Get supported formats
  getSupportedFormats: async () => {
    try {
      const response = await pdfApi.get('/pdf/formats');
      return response.data;
    } catch (error) {
      console.error('Failed to get supported formats:', error);
      throw error;
    }
  },

  // Test PowerPoint extraction methods
  testPptxExtraction: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await pdfApi.post('/pdf/test-pptx-extraction', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('PowerPoint extraction test failed:', error);
      throw error;
    }
  },
};

export default pdfService;
