import { FileSpreadsheet } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const PDFToExcelPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF to Excel:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Table Detection
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="detection" value="auto" className="text-primary-600" defaultChecked />
            <span>Auto-detect tables</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="detection" value="manual" className="text-primary-600" />
            <span>Manual table selection</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="detection" value="all" className="text-primary-600" />
            <span>Convert all content</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Format
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="xlsx">Excel (.xlsx)</option>
          <option value="xls">Excel 97-2003 (.xls)</option>
          <option value="csv">CSV (.csv)</option>
          <option value="ods">OpenDocument (.ods)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Range (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g., 1-3, 5, 7-10"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-formatting" className="text-primary-600" defaultChecked />
        <label htmlFor="preserve-formatting" className="text-sm text-gray-700">
          Preserve cell formatting
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="merge-tables" className="text-primary-600" />
        <label htmlFor="merge-tables" className="text-sm text-gray-700">
          Merge tables from multiple pages
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="PDF to Excel Converter"
      toolDescription="Extract tables and data from PDF files to Excel spreadsheets. Perfect for data analysis and reporting."
      toolIcon={FileSpreadsheet}
      acceptedFormats={['.pdf']}
      outputFormats={['xlsx', 'xls', 'csv', 'ods']}
      maxFileSize="100MB"
      processingTime="30-90 seconds"
      features={[
        "Smart table detection and extraction",
        "Preserves cell formatting and structure",
        "Multiple output formats supported",
        "Batch conversion capability",
        "OCR for scanned documents",
        "Custom page range selection",
        "Merge tables across pages",
        "Data validation and cleanup"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select PDF files containing tables or data"
        },
        {
          title: "Configure Settings",
          description: "Choose table detection method and output format"
        },
        {
          title: "Extract Data",
          description: "Our AI identifies and extracts table data"
        },
        {
          title: "Download Excel",
          description: "Get your data in Excel format ready for analysis"
        }
      ]}
      faqs={[
        {
          question: "How accurate is the table extraction?",
          answer: "Our AI-powered extraction achieves 95%+ accuracy for well-formatted tables and 85%+ for complex layouts."
        },
        {
          question: "Can it handle scanned PDF documents?",
          answer: "Yes, we use advanced OCR technology to extract data from scanned PDFs and images."
        },
        {
          question: "What if my PDF has multiple tables?",
          answer: "Each table will be extracted to a separate worksheet in the Excel file, or you can choose to merge them."
        },
        {
          question: "Can I extract data from specific pages only?",
          answer: "Yes, you can specify page ranges to extract tables from specific pages of your PDF."
        },
        {
          question: "What output formats are supported?",
          answer: "We support Excel (.xlsx, .xls), CSV, and OpenDocument Spreadsheet (.ods) formats."
        }
      ]}
      relatedTools={[
        {
          name: "Excel to PDF",
          path: "/excel-to-pdf",
          description: "Convert Excel files back to PDF format"
        },
        {
          name: "PDF to CSV",
          path: "/pdf-to-csv",
          description: "Extract data to CSV format"
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

export default PDFToExcelPage