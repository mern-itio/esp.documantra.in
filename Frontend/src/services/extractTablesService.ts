import { pdfApi } from "./apiHelper";
import type { ExtractTablesRequest, ExtractTablesResponse, ExtractTablesTools } from '../types/extractTables';

export const extractTablesService = {
  async extractTables(request: ExtractTablesRequest): Promise<ExtractTablesResponse> {
    const formData = new FormData();
    
    request.files.forEach((file) => {
      formData.append('files', file);
    });
    
    // formData.append('detectionMethod', request.detectionMethod);
    formData.append('outputFormat', request.outputFormat);
    formData.append('preserveFormatting', request.preserveFormatting.toString());
    formData.append('extractHeaders', request.extractHeaders.toString());
    formData.append('mergeTables', request.mergeTables.toString());
    
    if (request.pageRange) {
      formData.append('pageRange', request.pageRange);
    }
    
    // formData.append('language', request.language);

    const response = await pdfApi.post('/pdf-extract-tables/process', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes timeout for large files
    });

    return response.data;
  },

  async checkTools(): Promise<ExtractTablesTools> {
    const response = await pdfApi.get('/pdf-extract-tables/tools');
    return response.data;
  },

  async downloadFile(filename: string): Promise<void> {
    const response = await pdfApi.get(`/pdf-extract-tables/download/${filename}`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // getDetectionMethodLabel(method: string): string {
  //   const labels = {
  //     auto: 'Auto-detect tables',
  //     manual: 'Manual selection',
  //     all: 'Convert all content'
  //   };
  //   return labels[method as keyof typeof labels] || method;
  // },

  getOutputFormatLabel(format: string): string {
    const labels = {
      xlsx: 'Excel (.xlsx)',
      xls: 'Excel 97-2003 (.xls)',
      csv: 'CSV (.csv)'
    };
    return labels[format as keyof typeof labels] || format;
  },

  // getLanguageName(code: string): string {
  //   const languages: { [key: string]: string } = {
  //     eng: 'English',
  //     jpn: 'Japanese',
  //     chi_sim: 'Chinese (Simplified)',
  //     chi_tra: 'Chinese (Traditional)',
  //     kor: 'Korean',
  //     ara: 'Arabic',
  //     rus: 'Russian',
  //     deu: 'German',
  //     fra: 'French',
  //     spa: 'Spanish',
  //     ita: 'Italian',
  //     por: 'Portuguese'
  //   };
  //   return languages[code] || code;
  // },

  validatePageRange(pageRange: string): boolean {
    if (!pageRange) return true;
    
    const pattern = /^(\d+(-\d+)?)(,\s*\d+(-\d+)?)*$/;
    return pattern.test(pageRange);
  },

  parsePageRange(pageRange: string): number[] {
    if (!pageRange) return [];
    
    const pages: number[] = [];
    const ranges = pageRange.split(',').map(r => r.trim());
    
    for (const range of ranges) {
      if (range.includes('-')) {
        const [start, end] = range.split('-').map(p => parseInt(p.trim()));
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            pages.push(i);
          }
        }
      } else {
        const page = parseInt(range);
        if (!isNaN(page)) {
          pages.push(page);
        }
      }
    }
    
    return pages.sort((a, b) => a - b);
  }
};
