import { Hash } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const NumberPagesPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing page numbering:', files, settings)
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
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="format" value="simple" className="text-primary-600" defaultChecked />
            <span>Simple numbers (1, 2, 3...)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="format" value="page" className="text-primary-600" />
            <span>Page numbers (Page 1, Page 2...)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="format" value="custom" className="text-primary-600" />
            <span>Custom format</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom Format (if selected)
        </label>
        <input
          type="text"
          placeholder="e.g., Page {n} of {total}"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Use 10 for page number and 20 for total pages</p>
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

      <div className="flex items-center gap-2">
        <input type="checkbox" id="skip-first" className="text-primary-600" defaultChecked />
        <label htmlFor="skip-first" className="text-sm text-gray-700">
          Skip first page
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="bates" className="text-primary-600" />
        <label htmlFor="bates" className="text-sm text-gray-700">
          Use Bates numbering (prefix + number)
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Number PDF Pages"
      toolDescription="Add page numbers to PDF documents with customizable position, format, and styling. Create professional pagination for your documents."
      toolIcon={Hash}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="2MB"
      processingTime="15-30 seconds"
      features={[
        "Multiple position options",
        "Various numbering formats",
        "Custom format templates",
        "Font and size selection",
        "Bates numbering support",
        "Skip first page option",
        "Batch processing support",
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
          question: "What is Bates numbering?",
          answer: "Bates numbering is a method of indexing legal documents, adding a unique identifier to each page that typically includes a prefix and sequential number."
        },
        {
          question: "Can I create custom page number formats?",
          answer: "Yes, you can create custom formats like 'Page X of Y' using our template system with {n} for current page and {total} for total pages."
        },
        {
          question: "Will page numbers overwrite existing content?",
          answer: "Page numbers are placed in the margins where possible, but may overlap with content if the document has narrow margins or content extends to the edges."
        },
        {
          question: "Can I number specific pages only?",
          answer: "Yes, you can skip the first page (often a cover page) or specify custom page ranges to number."
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
          answer: "Yes, our batch processing feature allows you to upload and number multiple files simultaneously, saving you time and effort."
        },
        {
          question: "What happens if my internet connection is interrupted?",
          answer: "If your connection is interrupted during upload, you can resume the upload when reconnected. Processed files are temporarily stored for 1 hour."
        },
        {
          question: "What's the maximum file size I can convert?",
          answer: "Free users can convert files up to 2MB. Premium users have higher limits and can process larger files without restrictions."
        }
      ]}
      relatedTools={[
        {
          name: "Bates Numbering",
          path: "/bates-numbering",
          description: "Add legal Bates numbers to documents"
        },
        {
          name: "Header & Footer",
          path: "/header-footer",
          description: "Add headers and footers to PDFs"
        },
        {
          name: "Watermark PDF",
          path: "/watermark-pdf",
          description: "Add watermarks to PDF documents"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default NumberPagesPage