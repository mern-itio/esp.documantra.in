import { Hash } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const BatesNumberingPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing Bates numbering:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bates Number Format
        </label>
        <input
          type="text"
          placeholder="e.g., CASE001-{####} or DOC-{######}"
          defaultValue="BATES{######}"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Use &#123;####&#125; for number placeholders. Each # represents a digit.</p>
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
          Position
        </label>
        <div className="grid grid-cols-3 gap-2">
          <label className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="position" value="top-left" className="text-primary-600" />
            <span className="text-sm">Top Left</span>
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
            <input type="radio" name="position" value="bottom-center" className="text-primary-600" />
            <span className="text-sm">Bottom Center</span>
          </label>
          <label className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="position" value="bottom-right" className="text-primary-600" defaultChecked />
            <span className="text-sm">Bottom Right</span>
          </label>
          <label className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="position" value="custom" className="text-primary-600" />
            <span className="text-sm">Custom</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Font Settings
        </label>
        <div className="grid grid-cols-3 gap-3">
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option>Arial</option>
            <option>Times New Roman</option>
            <option>Helvetica</option>
            <option>Courier New</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option>8pt</option>
            <option>10pt</option>
            <option>12pt</option>
            <option>14pt</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option value="black">Black</option>
            <option value="red">Red</option>
            <option value="blue">Blue</option>
            <option value="gray">Gray</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="include-filename" className="text-primary-600" />
        <label htmlFor="include-filename" className="text-sm text-gray-700">
          Include filename in Bates number
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="add-background" className="text-primary-600" />
        <label htmlFor="add-background" className="text-sm text-gray-700">
          Add background box for better visibility
        </label>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Hash className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">Bates Numbering</h4>
            <p className="text-sm text-blue-700 mt-1">
              Bates numbering is a legal indexing method used to uniquely identify and track documents in legal proceedings and document production.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Bates Numbering"
      toolDescription="Add Bates numbers to PDF documents for legal indexing and document tracking. Essential for legal proceedings and document production."
      toolIcon={Hash}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="200MB"
      processingTime="30-60 seconds"
      features={[
        "Custom Bates number formats",
        "Sequential numbering across files",
        "Multiple position options",
        "Font and color customization",
        "Batch processing support",
        "Legal compliance standards",
        "Background box options",
        "Professional formatting"
      ]}
      howToSteps={[
        {
          title: "Upload PDFs",
          description: "Select PDF files that need Bates numbering"
        },
        {
          title: "Set Format",
          description: "Configure Bates number format and starting number"
        },
        {
          title: "Choose Position",
          description: "Select where to place the Bates numbers"
        },
        {
          title: "Download",
          description: "Get your Bates numbered PDF files"
        }
      ]}
      faqs={[
        {
          question: "What is Bates numbering used for?",
          answer: "Bates numbering is used in legal proceedings to uniquely identify and track documents. It ensures each page has a unique identifier for reference during litigation."
        },
        {
          question: "Can I use custom prefixes in Bates numbers?",
          answer: "Yes, you can customize the format with prefixes, suffixes, and number patterns. For example: 'CASE001-{####}' or 'DOC-{######}'."
        },
        {
          question: "Will numbering continue across multiple files?",
          answer: "Yes, when processing multiple files, the Bates numbering will continue sequentially across all files to maintain unique identification."
        },
        {
          question: "Can I start numbering from a specific number?",
          answer: "Yes, you can set any starting number for your Bates numbering sequence to continue from previous document sets."
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
          answer: "Free users can convert files up to 200MB. Premium users have higher limits and can process larger files without restrictions."
        }
      ]}
      relatedTools={[
        {
          name: "Page Numbers",
          path: "/page-numbers",
          description: "Add standard page numbers to documents"
        },
        {
          name: "Watermark PDF",
          path: "/watermark-pdf",
          description: "Add watermarks for document identification"
        },
        {
          name: "Header & Footer",
          path: "/header-footer",
          description: "Add headers and footers to documents"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default BatesNumberingPage