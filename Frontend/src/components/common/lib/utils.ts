import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDate(date: string | Date | undefined | null): string {
  try {
    // Handle undefined, null, or empty values
    if (!date) {
      return 'No date available';
    }
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error, 'Date value:', date);
    return 'Invalid Date';
  }
}

export function getFileIcon(type: string): string {
  const icons: Record<string, string> = {
    'pdf': '📄',
    'doc': '📄',
    'docx': '📄',
    'txt': '📝',
    'rtf': '📝',
    'xls': '📊',
    'xlsx': '📊',
    'csv': '📊',
    'ppt': '📊',
    'pptx': '📊',
    'jpg': '🖼️',
    'jpeg': '🖼️',
    'png': '🖼️',
    'gif': '🖼️',
    'bmp': '🖼️',
    'tiff': '🖼️',
    'html': '🌐',
    'xml': '🌐',
    'json': '⚙️'
  };
  
  return icons[type.toLowerCase()] || '📎';
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getStorageUsagePercentage(used: number, total: number): number {
  if (total === -1) return 0; // Unlimited storage
  return Math.round((used / total) * 100);
}

export function isImageFile(type: string): boolean {
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'].includes(type.toLowerCase());
}

export function isPdfFile(type: string): boolean {
  return type.toLowerCase() === 'pdf';
}

export function isTextFile(type: string): boolean {
  return ['txt', 'rtf', 'html', 'xml', 'json'].includes(type.toLowerCase());
}