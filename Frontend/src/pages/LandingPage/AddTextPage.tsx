import { Type } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const AddTextPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing text addition:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Text Content
        </label>
        <textarea
          rows={4}
          placeholder="Enter the text you want to add to the PDF..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Text Position
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
            <input type="radio" name="position" value="middle-left" className="text-primary-600" />
            <span className="text-sm">Middle Left</span>
          </label>
          <label className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="position" value="middle-center" className="text-primary-600" defaultChecked />
            <span className="text-sm">Center</span>
          </label>
          <label className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="position" value="middle-right" className="text-primary-600" />
            <span className="text-sm">Middle Right</span>
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
            <input type="radio" name="position" value="bottom-right" className="text-primary-600" />
            <span className="text-sm">Bottom Right</span>
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
            <option>18pt</option>
            <option>24pt</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Text Color
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="black">Black</option>
          <option value="blue">Blue</option>
          <option value="red">Red</option>
          <option value="green">Green</option>
          <option value="gray">Gray</option>
          <option value="custom">Custom color</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Apply To
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="apply" value="all" className="text-primary-600" defaultChecked />
            <span>All pages</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="apply" value="first" className="text-primary-600" />
            <span>First page only</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="apply" value="last" className="text-primary-600" />
            <span>Last page only</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="apply" value="custom" className="text-primary-600" />
            <span>Custom page range</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Range (if custom selected)
        </label>
        <input
          type="text"
          placeholder="e.g., 1-5, 10, 15-20"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Add Text to PDF"
      toolDescription="Insert text content into PDF documents. Add titles, captions, page numbers, or custom text with precise positioning."
      toolIcon={Type}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="2MB"
      processingTime="15-30 seconds"
      features={[
        "Add text anywhere on PDF pages",
        "Multiple positioning options",
        "Font and size selection",
        "Color customization",
        "Page-specific text addition",
        "Batch processing support",
        "Preview before applying",
        "Professional formatting"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to add text to"
        },
        {
          title: "Enter Text",
          description: "Type the text you want to add"
        },
        {
          title: "Set Position",
          description: "Choose where to place the text and formatting options"
        },
        {
          title: "Download",
          description: "Get your PDF with added text"
        }
      ]}
      faqs={[
        {
          question: "Can I add different text to different pages?",
          answer: "Currently, the same text is applied to all selected pages. For different text per page, process the document multiple times with different page selections."
        },
        {
          question: "Can I position text precisely?",
          answer: "Yes, you can choose from 9 standard positions on the page. For pixel-perfect positioning, consider using our Edit PDF tool."
        },
        {
          question: "Will added text be editable later?",
          answer: "The text becomes part of the PDF content and isn't directly editable. However, you can use our Edit PDF tool to modify it later."
        },
        {
          question: "Can I add formatted text with different styles?",
          answer: "This tool supports basic formatting with font, size, and color options. For advanced formatting, use our Edit PDF tool."
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
          answer: "Yes, our batch processing feature allows you to upload and add text to multiple files simultaneously, saving you time and effort."
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
          name: "Edit PDF",
          path: "/edit-pdf",
          description: "Advanced PDF editing capabilities"
        },
        {
          name: "Add Watermark",
          path: "/add-watermark",
          description: "Add watermarks to PDF documents"
        },
        {
          name: "Add Header Footer",
          path: "/header-footer",
          description: "Add headers and footers to PDFs"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default AddTextPage