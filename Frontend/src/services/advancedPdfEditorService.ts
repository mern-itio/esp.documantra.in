import { pdfApi } from './apiHelper';
import type { EditOperation } from '../types/advancedPdfEditor';

export interface TextBlock {
  id: string;
  text: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  flags: number;
}

export interface PdfInfo {
  pageCount: number;
  fileSize: number;
  pageWidth: number;
  pageHeight: number;
  isEncrypted: boolean;
  metadata: {
    title: string;
    author: string;
    subject: string;
    creator: string;
    producer: string;
    creationDate: string;
    modificationDate: string;
  };
  pages: Array<{
    pageNumber: number;
    width: number;
    height: number;
    rotation: number;
  }>;
}

export interface UploadResponse {
  success: boolean;
  data: {
    fileName: string;
    originalName: string;
    filePath: string;
    pageCount: number;
    fileSize: number;
    pageWidth: number;
    pageHeight: number;
    isEncrypted: boolean;
    metadata: any;
    pages: any[];
  };
}

export interface TextBlocksResponse {
  success: boolean;
  data: {
    textBlocks: TextBlock[];
    pageInfo: {
      pageNumber: number;
      width: number;
      height: number;
      totalPages: number;
    };
  };
}

export interface EditResponse {
  success: boolean;
  data: {
    fileName: string;
    downloadUrl: string;
    fileSize: number;
  };
}

export const advancedPdfEditorService = {
  // Upload PDF file
  async uploadPdf(file: File): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await pdfApi.post('/advanced-editor/upload', formData);
      return response.data;
    } catch (error: any) {
      console.error('PDF upload failed:', error);
      throw new Error(error.response?.data?.error || 'Failed to upload PDF');
    }
  },

  // Extract text blocks from a specific page
  async extractTextBlocks(fileName: string, pageNumber: number = 1): Promise<TextBlocksResponse> {
    try {
      const response = await pdfApi.post('/advanced-editor/extract-text-blocks', {
        fileName,
        pageNumber
      });

      return response.data;
    } catch (error: any) {
      console.error('Text extraction failed:', error);
      throw new Error(error.response?.data?.error || 'Failed to extract text blocks');
    }
  },

  // Apply edits to PDF
  async applyEdits(fileName: string, edits: EditOperation[]): Promise<EditResponse> {
    try {
      const response = await pdfApi.post('/advanced-editor/apply-edits', {
        fileName,
        edits
      });

      return response.data;
    } catch (error: any) {
      console.error('Edit application failed:', error);
      throw new Error(error.response?.data?.error || 'Failed to apply edits');
    }
  },

  // Download edited PDF
  async downloadPdf(fileName: string): Promise<Blob> {
    try {
      const response = await pdfApi.get(`/advanced-editor/download/${fileName}`, {
        responseType: 'blob'
      });

      return response.data;
    } catch (error: any) {
      console.error('PDF download failed:', error);
      throw new Error(error.response?.data?.error || 'Failed to download PDF');
    }
  },

  // Get page preview as image
  async getPagePreview(fileName: string, pageNumber: number = 1): Promise<string> {
    try {
      const response = await pdfApi.get('/advanced-editor/preview', {
        params: { fileName, pageNumber },
        responseType: 'blob'
      });

      // Convert blob to data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(response.data);
      });
    } catch (error: any) {
      console.error('Preview generation failed:', error);
      throw new Error(error.response?.data?.error || 'Failed to generate preview');
    }
  },

  // Helper function to create download link
  createDownloadLink(blob: Blob, filename: string): string {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return url;
  },

  // Test file upload
  async testUpload(file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await pdfApi.post('/advanced-editor/test-upload', formData);
      return response.data;
    } catch (error: any) {
      console.error('Test upload failed:', error);
      throw new Error(error.response?.data?.error || 'Failed to test upload');
    }
  }
};
