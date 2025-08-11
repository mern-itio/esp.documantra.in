import { Type } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const PDFToTextPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF to Text:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Text Extraction Mode
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" value="plain" className="text-primary-600" defaultChecked />
            <span>Plain text (no formatting)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" value="formatted" className="text-primary-600" />
            <span>Preserve basic formatting</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" value="layout" className="text-primary-600" />
            <span>Maintain layout structure</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          OCR Language (for scanned PDFs)
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="auto">Auto-detect language</option>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
          <option value="pt">Portuguese</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Range (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g., 1-10, 15, 20-25"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="remove-headers" className="text-primary-600" />
        <label htmlFor="remove-headers" className="text-sm text-gray-700">
          Remove headers and footers
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="merge-lines" className="text-primary-600" defaultChecked />
        <label htmlFor="merge-lines" className="text-sm text-gray-700">
          Merge broken lines
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="PDF to Text Converter"
      toolDescription="Extract plain text from PDF documents. Perfect for content analysis, data processing, and text mining."
      toolIcon={Type}
      acceptedFormats={['.pdf']}
      outputFormats={['txt', 'rtf']}
      maxFileSize="100MB"
      processingTime="20-40 seconds"
      features={[
        "Extract plain text from any PDF",
        "OCR support for scanned documents",
        "Preserve or remove formatting",
        "Multiple output formats",
        "Batch text extraction",
        "Custom page range selection",
        "Multi-language OCR support",
        "Clean text output options"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to extract text from"
        },
        {
          title: "Choose Settings",
          description: "Select extraction mode and OCR language"
        },
        {
          title: "Extract Text",
          description: "Our system extracts all readable text"
        },
        {
          title: "Download",
          description: "Get your extracted text as a TXT file"
        }
      ]}
      faqs={[
        {
          question: "Can you extract text from scanned PDFs?",
          answer: "Yes, we use advanced OCR technology to extract text from scanned documents and images with high accuracy."
        },
        {
          question: "Will the text formatting be preserved?",
          answer: "You can choose to preserve basic formatting or extract plain text only, depending on your needs."
        },
        {
          question: "What languages are supported for OCR?",
          answer: "We support over 50 languages including English, Spanish, French, German, Chinese, Japanese, and many more."
        },
        {
          question: "Can I extract text from specific pages only?",
          answer: "Yes, you can specify page ranges to extract text from only the pages you need."
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
          name: "OCR PDF",
          path: "/ocr-pdf",
          description: "Make scanned PDFs searchable and editable"
        },
        {
          name: "PDF to Word",
          path: "/pdf-to-word",
          description: "Convert to editable Word documents"
        },
        {
          name: "Text to PDF",
          path: "/text-to-pdf",
          description: "Convert text files back to PDF"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default PDFToTextPage