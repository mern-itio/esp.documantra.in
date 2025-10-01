import { Type } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const ExtractTextPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing text extraction:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Extraction Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="all" className="text-primary-600" defaultChecked />
            <span>Extract all text</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="pages" className="text-primary-600" />
            <span>Extract from specific pages</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="area" className="text-primary-600" />
            <span>Extract from selected area</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Range (if applicable)
        </label>
        <input
          type="text"
          placeholder="e.g., 1-5, 10, 15-20"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Format
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="format" value="txt" className="text-primary-600" defaultChecked />
            <span>Plain Text (.txt)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="format" value="docx" className="text-primary-600" />
            <span>Word Document (.docx)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="format" value="rtf" className="text-primary-600" />
            <span>Rich Text Format (.rtf)</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Text Layout
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="layout" value="flowing" className="text-primary-600" defaultChecked />
            <span>Flowing text (paragraphs)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="layout" value="original" className="text-primary-600" />
            <span>Maintain original layout</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="ocr" className="text-primary-600" defaultChecked />
        <label htmlFor="ocr" className="text-sm text-gray-700">
          Use OCR for scanned documents
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="include-images" className="text-primary-600" />
        <label htmlFor="include-images" className="text-sm text-gray-700">
          Include image descriptions (for Word/RTF)
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Extract Text"
      toolDescription="Extract text content from PDF documents. Convert PDF text to editable formats with layout preservation options."
      toolIcon={Type}
      acceptedFormats={['.pdf']}
      outputFormats={['txt', 'docx', 'rtf']}
      maxFileSize="2MB"
      processingTime="20-45 seconds"
      features={[
        "Full text extraction",
        "Page-specific extraction",
        "Area-specific extraction",
        "OCR for scanned documents",
        "Multiple output formats",
        "Layout preservation options",
        "Batch processing support",
        "High accuracy extraction"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file to extract text from"
        },
        {
          title: "Choose Method",
          description: "Select extraction method and pages"
        },
        {
          title: "Set Options",
          description: "Choose output format and layout preferences"
        },
        {
          title: "Download",
          description: "Get your extracted text in your preferred format"
        }
      ]}
      faqs={[
        {
          question: "How accurate is the text extraction?",
          answer: "For native PDFs with embedded text, extraction is highly accurate. For scanned documents, accuracy depends on scan quality and OCR processing."
        },
        {
          question: "Can I extract text from scanned PDFs?",
          answer: "Yes, we use OCR (Optical Character Recognition) technology to extract text from scanned documents and images."
        },
        {
          question: "What's the difference between flowing text and original layout?",
          answer: "Flowing text reorganizes content into continuous paragraphs for easy editing. Original layout attempts to preserve the positioning and formatting of text as it appears in the PDF."
        },
        {
          question: "Can I extract text from password-protected PDFs?",
          answer: "Yes, if you provide the password during upload, we can extract text from password-protected PDFs."
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
          answer: "Yes, our batch processing feature allows you to upload and extract text from multiple files simultaneously, saving you time and effort."
        },
        {
          question: "What happens if my internet connection is interrupted?",
          answer: "If your connection is interrupted during upload, you can resume the upload when reconnected. Processed files are temporarily stored for 1 hour."
        },
        {
          question: "What's the maximum file size I can process?",
          answer: "Free users can process files up to 2MB. Premium users have higher limits and can process larger files without restrictions."
        }
      ]}
      relatedTools={[
        {
          name: "OCR PDF",
          path: "/ocr-pdf",
          description: "Make scanned PDFs searchable"
        },
        {
          name: "PDF to Word",
          path: "/pdf-to-word",
          description: "Convert PDF to editable Word format"
        },
        {
          name: "PDF to Text",
          path: "/pdf-to-text",
          description: "Simple text extraction"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default ExtractTextPage