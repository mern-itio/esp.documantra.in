import { FileText } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'



const HighlightTextPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing text highlighting:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Highlight Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="text" className="text-primary-600" defaultChecked />
            <span>Highlight specific text</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="pattern" className="text-primary-600" />
            <span>Highlight text pattern (regex)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="auto" className="text-primary-600" />
            <span>Auto-highlight key information</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Text to Highlight
        </label>
        <textarea
          rows={3}
          placeholder="Enter words or phrases to highlight, one per line"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Highlight Color
        </label>
        <div className="grid grid-cols-3 gap-3">
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="color" value="yellow" className="text-primary-600" defaultChecked />
            <div className="w-4 h-4 bg-yellow-300 rounded"></div>
            <span>Yellow</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="color" value="green" className="text-primary-600" />
            <div className="w-4 h-4 bg-green-300 rounded"></div>
            <span>Green</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="color" value="blue" className="text-primary-600" />
            <div className="w-4 h-4 bg-blue-300 rounded"></div>
            <span>Blue</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="color" value="pink" className="text-primary-600" />
            <div className="w-4 h-4 bg-pink-300 rounded"></div>
            <span>Pink</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="color" value="orange" className="text-primary-600" />
            <div className="w-4 h-4 bg-orange-300 rounded"></div>
            <span>Orange</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="color" value="custom" className="text-primary-600" />
            <span>Custom</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="case-sensitive" className="text-primary-600" />
        <label htmlFor="case-sensitive" className="text-sm text-gray-700">
          Case sensitive matching
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="add-notes" className="text-primary-600" />
        <label htmlFor="add-notes" className="text-sm text-gray-700">
          Add notes to highlights
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Highlight Text in PDF"
      toolDescription="Automatically highlight specific words, phrases, or patterns in PDF documents. Perfect for research, study, and document review."
      toolIcon={FileText}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="2MB"
      processingTime="20-45 seconds"
      features={[
        "Highlight specific text",
        "Pattern matching with regex",
        "Auto-highlight key information",
        "Multiple color options",
        "Case sensitivity control",
        "Add notes to highlights",
        "Batch processing support",
        "OCR for scanned documents"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to highlight text in"
        },
        {
          title: "Enter Text",
          description: "Specify words or phrases to highlight"
        },
        {
          title: "Choose Options",
          description: "Select highlight color and settings"
        },
        {
          title: "Download",
          description: "Get your PDF with highlighted text"
        }
      ]}
      faqs={[
        {
          question: "How does automatic text highlighting work?",
          answer: "Our system searches for your specified words or phrases throughout the document and applies highlighting to all matching instances."
        },
        {
          question: "Can I highlight text in scanned PDFs?",
          answer: "Yes, we use OCR (Optical Character Recognition) to detect text in scanned documents, though accuracy depends on scan quality."
        },
        {
          question: "What is pattern matching with regex?",
          answer: "Regular expressions (regex) allow you to highlight text matching specific patterns, like email addresses, phone numbers, or custom formats."
        },
        {
          question: "Can I remove highlights later?",
          answer: "Highlights become part of the PDF content. While they can be removed with PDF editing tools, we recommend keeping a copy of your original file."
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
          answer: "Yes, our batch processing feature allows you to upload and highlight text in multiple files simultaneously, saving you time and effort."
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
          name: "Annotate PDF",
          path: "/annotate-pdf",
          description: "Add annotations and comments"
        },
        {
          name: "Add Comments",
          path: "/add-comments",
          description: "Add comments to documents"
        },
        {
          name: "OCR PDF",
          path: "/ocr-pdf",
          description: "Make scanned PDFs searchable"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default HighlightTextPage