import { FileText } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const ConvertToPDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing file conversion to PDF:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Quality
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="quality" value="high" className="text-primary-600" defaultChecked />
            <span>High Quality (Print-ready)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="quality" value="medium" className="text-primary-600" />
            <span>Medium Quality (Web-optimized)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="quality" value="low" className="text-primary-600" />
            <span>Low Quality (Smaller file size)</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Size
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="auto">Auto-detect (Recommended)</option>
          <option value="a4">A4</option>
          <option value="letter">Letter</option>
          <option value="legal">Legal</option>
          <option value="a3">A3</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Orientation
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="orientation" value="auto" className="text-primary-600" defaultChecked />
            <span>Auto-detect</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="orientation" value="portrait" className="text-primary-600" />
            <span>Portrait</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="orientation" value="landscape" className="text-primary-600" />
            <span>Landscape</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="optimize" className="text-primary-600" defaultChecked />
        <label htmlFor="optimize" className="text-sm text-gray-700">
          Optimize for web viewing
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-links" className="text-primary-600" defaultChecked />
        <label htmlFor="preserve-links" className="text-sm text-gray-700">
          Preserve hyperlinks
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Convert to PDF"
      toolDescription="Convert various file formats to PDF. Support for documents, images, presentations, spreadsheets, and more."
      toolIcon={FileText}
      acceptedFormats={['.docx', '.doc', '.pptx', '.ppt', '.xlsx', '.xls', '.jpg', '.jpeg', '.png', '.txt', '.rtf', '.html', '.htm']}
      outputFormats={['pdf']}
      maxFileSize="100MB"
      processingTime="15-45 seconds"
      features={[
        "Multiple format support",
        "High-quality conversion",
        "Preserve formatting and layout",
        "Hyperlink preservation",
        "Batch conversion support",
        "Custom page settings",
        "Web optimization options",
        "Fast processing speed"
      ]}
      howToSteps={[
        {
          title: "Upload Files",
          description: "Select files you want to convert to PDF"
        },
        {
          title: "Choose Settings",
          description: "Select quality and page options"
        },
        {
          title: "Convert",
          description: "Our system converts your files to PDF format"
        },
        {
          title: "Download",
          description: "Get your converted PDF files"
        }
      ]}
      faqs={[
        {
          question: "What file formats can I convert to PDF?",
          answer: "We support a wide range of formats including Word documents (.docx, .doc), PowerPoint presentations (.pptx, .ppt), Excel spreadsheets (.xlsx, .xls), images (.jpg, .png), text files (.txt), and web pages (.html)."
        },
        {
          question: "Will my formatting be preserved?",
          answer: "Yes, our conversion engine preserves formatting, images, tables, fonts, and layout from the original document as accurately as possible."
        },
        {
          question: "Can I convert multiple files at once?",
          answer: "Yes, you can upload and convert multiple files simultaneously. Each file will be converted to a separate PDF."
        },
        {
          question: "What's the difference between quality settings?",
          answer: "High quality preserves all details for printing, medium balances quality and size for general use, and low quality creates smaller files suitable for email or web sharing."
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
          name: "PDF to Word",
          path: "/pdf-to-word",
          description: "Convert PDF back to Word format"
        },
        {
          name: "Compress PDF",
          path: "/compress-pdf",
          description: "Reduce PDF file size after conversion"
        },
        {
          name: "Merge PDF",
          path: "/merge-pdf",
          description: "Combine multiple PDFs into one"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default ConvertToPDFPage