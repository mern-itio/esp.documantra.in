import { AlignCenter } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const AddHeaderFooterPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing header/footer addition:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Header Text
        </label>
        <input
          type="text"
          placeholder="Enter header text (optional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Footer Text
        </label>
        <input
          type="text"
          placeholder="Enter footer text (optional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Text Alignment
        </label>
        <div className="grid grid-cols-3 gap-3">
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="alignment" value="left" className="text-primary-600" />
            <span>Left</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="alignment" value="center" className="text-primary-600" defaultChecked />
            <span>Center</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="alignment" value="right" className="text-primary-600" />
            <span>Right</span>
          </label>
        </div>
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
          Include Variables
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Page numbers</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Date</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Document title</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Filename</span>
          </label>
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
      toolName="Add Header & Footer"
      toolDescription="Add custom headers and footers to PDF documents. Include text, page numbers, dates, and more for professional document presentation."
      toolIcon={AlignCenter}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="100MB"
      processingTime="15-30 seconds"
      features={[
        "Custom header and footer text",
        "Multiple alignment options",
        "Font and size selection",
        "Page number insertion",
        "Date and time stamps",
        "Custom page ranges",
        "Skip first page option",
        "Professional formatting"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to add headers/footers to"
        },
        {
          title: "Enter Text",
          description: "Add your custom header and footer text"
        },
        {
          title: "Set Format",
          description: "Choose alignment, font, and other options"
        },
        {
          title: "Download",
          description: "Get your PDF with headers and footers added"
        }
      ]}
      faqs={[
        {
          question: "Can I add different headers/footers to different pages?",
          answer: "Currently, the same header/footer is applied to all selected pages. For different content per page, you would need to process sections separately."
        },
        {
          question: "Can I include page numbers automatically?",
          answer: "Yes, you can enable automatic page numbering in the header or footer, which will be added along with your custom text."
        },
        {
          question: "What if my PDF already has headers or footers?",
          answer: "New headers and footers will be added to the existing content. If you want to replace existing ones, consider using our Edit PDF tool first."
        },
        {
          question: "Can I add images to headers or footers?",
          answer: "Currently, we support text-based headers and footers. For image headers/footers, consider using our Watermark tool."
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
          name: "Page Numbers",
          path: "/page-numbers",
          description: "Add page numbers to PDF documents"
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

export default AddHeaderFooterPage