import { Type } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const TextToPDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing Text to PDF:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Font Settings
        </label>
        <div className="grid grid-cols-2 gap-3">
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option>Arial</option>
            <option>Times New Roman</option>
            <option>Helvetica</option>
            <option>Courier New</option>
            <option>Calibri</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option>10pt</option>
            <option>11pt</option>
            <option>12pt</option>
            <option>14pt</option>
            <option>16pt</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Layout
        </label>
        <div className="grid grid-cols-2 gap-3">
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option value="a4">A4</option>
            <option value="letter">Letter</option>
            <option value="legal">Legal</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Margins (inches)
        </label>
        <div className="grid grid-cols-4 gap-2">
          <input type="number" step="0.1" defaultValue="1" placeholder="Top" className="px-2 py-1 border border-gray-300 rounded text-sm" />
          <input type="number" step="0.1" defaultValue="1" placeholder="Right" className="px-2 py-1 border border-gray-300 rounded text-sm" />
          <input type="number" step="0.1" defaultValue="1" placeholder="Bottom" className="px-2 py-1 border border-gray-300 rounded text-sm" />
          <input type="number" step="0.1" defaultValue="1" placeholder="Left" className="px-2 py-1 border border-gray-300 rounded text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Line Spacing
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="1">Single</option>
          <option value="1.15">1.15</option>
          <option value="1.5">1.5</option>
          <option value="2">Double</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-formatting" className="text-primary-600" defaultChecked />
        <label htmlFor="preserve-formatting" className="text-sm text-gray-700">
          Preserve text formatting
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="add-page-numbers" className="text-primary-600" />
        <label htmlFor="add-page-numbers" className="text-sm text-gray-700">
          Add page numbers
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Text to PDF Converter"
      toolDescription="Convert plain text files to formatted PDF documents. Perfect for creating professional documents from simple text files."
      toolIcon={Type}
      acceptedFormats={['.txt', '.rtf']}
      outputFormats={['pdf']}
      maxFileSize="50MB"
      processingTime="10-20 seconds"
      features={[
        "Custom font and size selection",
        "Professional page layouts",
        "Adjustable margins and spacing",
        "Line spacing control",
        "Page numbering options",
        "Batch text conversion",
        "Preserve text formatting",
        "Multiple page sizes"
      ]}
      howToSteps={[
        {
          title: "Upload Text",
          description: "Select your text file (.txt, .rtf)"
        },
        {
          title: "Set Format",
          description: "Choose font, layout, and spacing options"
        },
        {
          title: "Convert",
          description: "Our system creates a formatted PDF"
        },
        {
          title: "Download",
          description: "Get your professional PDF document"
        }
      ]}
      faqs={[
        {
          question: "What text file formats are supported?",
          answer: "We support plain text (.txt) and Rich Text Format (.rtf) files for conversion to PDF."
        },
        {
          question: "Can I customize the appearance of the PDF?",
          answer: "Yes, you can customize fonts, sizes, margins, line spacing, and page layout to create professional-looking documents."
        },
        {
          question: "Will special characters be preserved?",
          answer: "Yes, we preserve special characters and Unicode text, ensuring your content appears correctly in the PDF."
        },
        {
          question: "Can I add headers and footers?",
          answer: "You can add page numbers, and for more advanced headers/footers, use our Header & Footer tool after conversion."
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
          answer: "Free users can convert files up to 50MB. Premium users have higher limits and can process larger files without restrictions."
        }
      ]}
      relatedTools={[
        {
          name: "PDF to Text",
          path: "/pdf-to-text",
          description: "Convert PDF files back to text format"
        },
        {
          name: "Word to PDF",
          path: "/word-to-pdf",
          description: "Convert Word documents to PDF"
        },
        {
          name: "Edit PDF",
          path: "/edit-pdf",
          description: "Edit PDF content after conversion"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default TextToPDFPage