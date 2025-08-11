import { FileSpreadsheet } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const ExcelToPDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing Excel to PDF:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Worksheet Selection
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="sheets" value="all" className="text-primary-600" defaultChecked />
            <span>All worksheets</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="sheets" value="active" className="text-primary-600" />
            <span>Active worksheet only</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="sheets" value="custom" className="text-primary-600" />
            <span>Custom worksheet selection</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Orientation
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="orientation" value="portrait" className="text-primary-600" defaultChecked />
            <span>Portrait</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="orientation" value="landscape" className="text-primary-600" />
            <span>Landscape</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Scaling Options
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="fit-to-page">Fit to page width</option>
          <option value="fit-all">Fit all columns on one page</option>
          <option value="actual-size">Actual size</option>
          <option value="custom">Custom scaling</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Size
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="a4">A4</option>
          <option value="letter">Letter</option>
          <option value="legal">Legal</option>
          <option value="a3">A3</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="include-gridlines" className="text-primary-600" />
        <label htmlFor="include-gridlines" className="text-sm text-gray-700">
          Include gridlines
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="include-headers" className="text-primary-600" defaultChecked />
        <label htmlFor="include-headers" className="text-sm text-gray-700">
          Include row and column headers
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Excel to PDF Converter"
      toolDescription="Convert Excel spreadsheets to PDF format. Perfect for sharing data, reports, and maintaining formatting across platforms."
      toolIcon={FileSpreadsheet}
      acceptedFormats={['.xlsx', '.xls', '.csv', '.ods']}
      outputFormats={['pdf']}
      maxFileSize="100MB"
      processingTime="20-45 seconds"
      features={[
        "Convert all or selected worksheets",
        "Preserve formatting and formulas",
        "Multiple scaling options",
        "Custom page layouts",
        "Gridline and header options",
        "Batch conversion support",
        "High-quality output",
        "Professional formatting"
      ]}
      howToSteps={[
        {
          title: "Upload Excel",
          description: "Select your Excel spreadsheet file"
        },
        {
          title: "Choose Sheets",
          description: "Select which worksheets to convert"
        },
        {
          title: "Set Layout",
          description: "Configure page orientation and scaling"
        },
        {
          title: "Download",
          description: "Get your PDF with preserved formatting"
        }
      ]}
      faqs={[
        {
          question: "Will formulas be preserved in the PDF?",
          answer: "Formulas will be converted to their calculated values in the PDF. The PDF will show the results, not the formulas themselves."
        },
        {
          question: "Can I convert multiple worksheets?",
          answer: "Yes, you can convert all worksheets or select specific ones. Each worksheet will appear as separate pages in the PDF."
        },
        {
          question: "How are large spreadsheets handled?",
          answer: "Large spreadsheets are automatically split across multiple pages. You can control scaling to fit more content per page."
        },
        {
          question: "Will charts and graphs be included?",
          answer: "Yes, charts, graphs, and other visual elements will be preserved and included in the PDF conversion."
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
        },
        {
          question: "What's the maximum file size I can convert?",
          answer: "Free users can convert files up to 100MB. Premium users have higher limits and can process larger files without restrictions."
        }
      ]}
      relatedTools={[
        {
          name: "PDF to Excel",
          path: "/pdf-to-excel",
          description: "Convert PDF files back to Excel format"
        },
        {
          name: "CSV to PDF",
          path: "/csv-to-pdf",
          description: "Convert CSV files to PDF"
        },
        {
          name: "Compress PDF",
          path: "/compress-pdf",
          description: "Reduce PDF file size after conversion"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default ExcelToPDFPage