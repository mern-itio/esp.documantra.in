// Common types shared across PDF services
// This file contains interfaces that are used by multiple PDF manipulation services
// to avoid duplication and maintain consistency.

export interface PDFInfo {
  pages: number;
  size: number;
  isValid: boolean;
}
