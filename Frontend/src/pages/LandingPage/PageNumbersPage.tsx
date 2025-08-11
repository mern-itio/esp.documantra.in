import { Hash } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const PageNumbersPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing page numbers:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number Position
        </label>
        <div className="grid grid-cols-3 gap-2">
          <label className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="position" value="top-left" className="text-primary-600" />
            <span className="text-sm">Top Left</span>
          </label>
          <label className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="position" value="top-center" className="text-primary-600" />
            <span className="text-sm">Top Center</span>
          </label>
          <label className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="position" value="top-right" className="text-primary-600" />
            <span className="text-sm">Top Right</span>
          </label>
          <label className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="position" value="bottom-left" className="text-primary-600" />
            <span className="text-sm">Bottom Left</span>
          </label>
          <label className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="position" value="bottom-center" className="text-primary-600" defaultChecked />
            <span className="text-sm">Bottom Center</span>
          </label>
          <label className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="position" value="bottom-right" className="text-primary-600" />
            <span className="text-sm">Bottom Right</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number Format
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="1">1, 2, 3...</option>
          <option value="i">i, ii, iii...</option>
          <option value="I">I, II, III...</option>
          <option value="a">a, b, c...</option>
          <option value="A">A, B, C...</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Starting Number
        </label>
        <input
          type="number"
          min="1"
          defaultValue="1"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Font Settings
        </label>
        <div className="grid grid-cols-2 gap-3">
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option>Arial</option>
            <option>Times New Roman</option>
            <option>Helvetica</option>
            <option>Calibri</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option>10pt</option>
            <option>12pt</option>
            <option>14pt</option>
            <option>16pt</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Range (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g., 2-10 (skip first page)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="skip-first" className="text-primary-600" defaultChecked />
        <label htmlFor="skip-first" className="text-sm text-gray-700">
          Skip first page (title page)
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Add Page Numbers"
      toolDescription="Add page numbers to PDF documents with customizable position, format, and styling options."
      toolIcon={Hash}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="100MB"
      processingTime="15-25 seconds"
      features={[
        "Multiple position options",
        "Various numbering formats",
        "Custom starting numbers",
        "Font and size selection",
        "Skip specific pages",
        "Batch processing support",
        "Preview before applying",
        "Professional formatting"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to add page numbers to"
        },
        {
          title: "Choose Position",
          description: "Select where you want the page numbers to appear"
        },
        {
          title: "Set Format",
          description: "Choose numbering format and font settings"
        },
        {
          title: "Download",
          description: "Get your PDF with page numbers added"
        }
      ]}
      faqs={[
        {
          question: "Can I skip the first page when adding page numbers?",
          answer: "Yes, you can skip the first page (title page) or any specific pages by using the page range option."
        },
        {
          question: "What numbering formats are available?",
          answer: "We support Arabic numerals (1,2,3), Roman numerals (i,ii,iii or I,II,III), and alphabetical (a,b,c or A,B,C) formats."
        },
        {
          question: "Can I start numbering from a specific number?",
          answer: "Yes, you can set any starting number for your page numbering sequence."
        },
        {
          question: "Will page numbers overwrite existing content?",
          answer: "Page numbers are placed in margins or specified positions. If there's existing content in that area, it may be overlapped."
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
          name: "Header & Footer",
          path: "/header-footer",
          description: "Add headers and footers to PDF pages"
        },
        {
          name: "Watermark PDF",
          path: "/watermark-pdf",
          description: "Add watermarks to PDF documents"
        },
        {
          name: "Edit PDF",
          path: "/edit-pdf",
          description: "Edit PDF content and formatting"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default PageNumbersPage