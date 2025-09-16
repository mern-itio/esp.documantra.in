// src/types/template.ts
export type ElementType =
  | 'text'
  | 'rectangle'
  | 'circle'
  | 'image'
  | 'signature'
  | 'input'
  | 'checkbox'
  | 'table'
  | 'chart';

export interface ElementStyles {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
  color?: string;
  fontSize?: number;
  fontWeight?: number | string;

  // per-table toggles (optional, not required immediately)
  borderTop?: boolean;
  borderBottom?: boolean;
  borderLeft?: boolean;
  borderRight?: boolean;
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;         // text, labels, etc.
  src?: string;             // image URL
  placeholder?: string;
  checked?: boolean;
  rows?: number;            // for table
  cols?: number;            // for table
  tableData?: string[][];   // per-cell contents for table
  chartKind?: 'bar' | 'line' | 'pie';
  required?: boolean;
  styles?: ElementStyles;
  chartData?: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string;
      borderColor?: string;
      borderWidth?: number;
    }>;
  }; // <- add this
}
