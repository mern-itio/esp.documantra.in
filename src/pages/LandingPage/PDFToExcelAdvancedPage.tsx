import { FileSpreadsheet } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const PDFToExcelAdvancedPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing advanced PDF to Excel conversion:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Table Detection Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="detection" value="auto" className="text-primary-600" defaultChecked />
            <span>Auto-detect tables (recommended)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="detection" value="grid" className="text-primary-600" />
            <span>Grid-based detection</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="detection" value="structure" className="text-primary-600" />
            <span>Structure-based detection</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="detection" value="manual" className="text-primary-600" />
            <span>Manual table selection</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Format
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="format" value="xlsx" className="text-primary-600" defaultChecked />
            <span>Excel (.xlsx)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="format" value="xls" className="text-primary-600" />
            <span>Excel 97-2003 (.xls)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="format" value="csv" className="text-primary-600" />
            <span>CSV (.csv)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="format" value="ods" className="text-primary-600" />
            <span>OpenDocument (.ods)</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Table Organization
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="organization" value="sheets" className="text-primary-600" defaultChecked />
            <span>One sheet per table</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="organization" value="pages" className="text-primary-600" />
            <span>One sheet per page</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="organization" value="single" className="text-primary-600" />
            <span>All tables in one sheet</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Advanced Options
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Detect merged cells</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Preserve formatting</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Extract formulas (if present)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Include images</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Extract hidden data</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Range (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g., 1-5, 10, 15-20"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="ocr" className="text-primary-600" defaultChecked />
        <label htmlFor="ocr" className="text-sm text-gray-700">
          Use OCR for scanned documents
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="data-cleaning" className="text-primary-600" defaultChecked />
        <label htmlFor="data-cleaning" className="text-sm text-gray-700">
          Apply data cleaning and formatting
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="PDF to Excel Advanced"
      toolDescription="Extract tables and data from PDF files to Excel with advanced options. Perfect for complex documents, financial reports, and data analysis."
      toolIcon={FileSpreadsheet}
      acceptedFormats={['.pdf']}
      outputFormats={['xlsx', 'xls', 'csv', 'ods']}
      maxFileSize="200MB"
      processingTime="45-120 seconds"
      features={[
        "Advanced table detection algorithms",
        "Multiple detection methods",
        "Custom table organization",
        "Merged cell recognition",
        "Formula extraction",
        "Data cleaning and formatting",
        "Multiple output formats",
        "OCR for scanned documents"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select PDF files containing tables or data"
        },
        {
          title: "Choose Method",
          description: "Select table detection method and output format"
        },
        {
          title: "Configure Options",
          description: "Set advanced extraction parameters"
        },
        {
          title: "Download",
          description: "Get your data in Excel format ready for analysis"
        }
      ]}
      faqs={[
        {
          question: "What's the difference between detection methods?",
          answer: "Auto-detect uses AI to identify tables automatically. Grid-based works best for tables with visible borders. Structure-based analyzes text positioning for tables without borders. Manual allows you to specify table regions."
        },
        {
          question: "How accurate is the table extraction?",
          answer: "Our advanced algorithms achieve 98%+ accuracy for well-formatted tables and 90%+ for complex layouts. Accuracy for scanned documents depends on scan quality and OCR processing."
        },
        {
          question: "Can it handle complex tables with merged cells?",
          answer: "Yes, our advanced detection can identify and preserve merged cells, maintaining the original table structure in the Excel output."
        },
        {
          question: "What does data cleaning and formatting do?",
          answer: "It automatically detects and formats numbers, dates, currencies, and percentages appropriately in Excel. It also removes unnecessary whitespace and normalizes text formatting."
        },
        {
          question: "Can it extract tables from scanned PDFs?",
          answer: "Yes, with OCR enabled, we can extract tables from scanned documents. The accuracy depends on scan quality, table complexity, and text clarity."
        },
        {
          question: "How secure are my files during processing?",
          answer: "Your files are protected with 256-bit SSL encryption during upload and processing. We use the same security standards as banks and financial institutions."
        },
        {
          question: "How long do you store my files?",
          answer: "We automatically delete all uploaded files after 1 hour for your privacy and security. You can also manually delete files immediately after processing."
        },
        {
          question: "Is this tool really free to use?",
          answer: "Yes! Our PDF tools are completely free to use with no hidden costs. You can process unlimited files without any charges."
        },
        {
          question: "Why do you delete files automatically?",
          answer: "We automatically delete files after 1 hour to protect your privacy and ensure your sensitive documents don't remain on our servers longer than necessary."
        },
        {
          question: "Do I need to create an account to use this tool?",
          answer: "No account is required for basic usage. However, creating a free account gives you access to additional features like file history and batch processing."
        },
        {
          question: "Can I process multiple files at once?",
          answer: "Yes, our batch processing feature allows you to upload and convert multiple files simultaneously, saving you time and effort."
        },
        {
          question: "What happens if my internet connection is interrupted?",
          answer: "If your connection is interrupted during upload, you can resume the upload when reconnected. Processed files are temporarily stored for 1 hour."
        }
      ]}
      relatedTools={[
        {
          name: "PDF to Excel",
          path: "/pdf-to-excel",
          description: "Standard Excel conversion"
        },
        {
          name: "Excel to PDF",
          path: "/excel-to-pdf",
          description: "Convert Excel files to PDF"
        },
        {
          name: "OCR PDF",
          path: "/ocr-pdf",
          description: "Make scanned PDFs searchable"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default PDFToExcelAdvancedPage