import { Eye } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const RecognizeTextPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing text recognition:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          OCR Language
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="auto">Auto-detect language</option>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
          <option value="pt">Portuguese</option>
          <option value="ru">Russian</option>
          <option value="zh">Chinese</option>
          <option value="ja">Japanese</option>
          <option value="ko">Korean</option>
          <option value="ar">Arabic</option>
          <option value="hi">Hindi</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          OCR Accuracy
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="accuracy" value="fast" className="text-primary-600" />
            <span>Fast (Good for simple documents)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="accuracy" value="balanced" className="text-primary-600" defaultChecked />
            <span>Balanced (Recommended)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="accuracy" value="accurate" className="text-primary-600" />
            <span>High Accuracy (Best for complex layouts)</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document Type
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="auto">Auto-detect</option>
          <option value="text">Text document</option>
          <option value="table">Document with tables</option>
          <option value="form">Form document</option>
          <option value="mixed">Mixed content</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Options
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Make text searchable</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Preserve original formatting</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Create separate text layer</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Enhance image quality</span>
          </label>
        </div>
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
        <p className="text-xs text-gray-500 mt-1">Leave empty to process all pages</p>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="deskew" className="text-primary-600" defaultChecked />
        <label htmlFor="deskew" className="text-sm text-gray-700">
          Auto-deskew pages
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="remove-noise" className="text-primary-600" defaultChecked />
        <label htmlFor="remove-noise" className="text-sm text-gray-700">
          Remove background noise
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Recognize Text (OCR)"
      toolDescription="Convert scanned documents and images to searchable PDFs. Extract text from images with advanced OCR technology."
      toolIcon={Eye}
      acceptedFormats={['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.bmp']}
      outputFormats={['pdf', 'txt', 'docx']}
      maxFileSize="200MB"
      processingTime="60-180 seconds"
      features={[
        "Advanced OCR technology",
        "Support for 25+ languages",
        "Multiple accuracy levels",
        "Document type optimization",
        "Image enhancement",
        "Searchable PDF creation",
        "Batch processing support",
        "Multiple output formats"
      ]}
      howToSteps={[
        {
          title: "Upload Document",
          description: "Select scanned PDF or image files for OCR processing"
        },
        {
          title: "Choose Language",
          description: "Select the language of your document or use auto-detect"
        },
        {
          title: "Set Options",
          description: "Configure OCR accuracy and output preferences"
        },
        {
          title: "Process",
          description: "Our system recognizes text in your document"
        }
      ]}
      faqs={[
        {
          question: "How accurate is the OCR text recognition?",
          answer: "Our OCR technology achieves 99%+ accuracy for clear, well-scanned documents and 95%+ for lower quality scans. Accuracy varies based on document quality, font clarity, and layout complexity."
        },
        {
          question: "What languages are supported?",
          answer: "We support over 25 languages including English, Spanish, French, German, Chinese, Japanese, Arabic, Russian, and many more. Our auto-detection can identify the primary language in your document."
        },
        {
          question: "Can I OCR handwritten text?",
          answer: "Our OCR works best with printed text. Handwritten text recognition is limited and depends on handwriting clarity, consistency, and style."
        },
        {
          question: "What's the difference between accuracy levels?",
          answer: "Fast mode prioritizes speed for simple documents, balanced mode offers good accuracy for most documents, and high accuracy mode provides the best results for complex layouts but takes longer."
        },
        {
          question: "How does auto-deskew work?",
          answer: "Auto-deskew detects and corrects page rotation or skew, ensuring text lines are properly aligned for optimal OCR accuracy."
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
          answer: "Yes, our batch processing feature allows you to upload and process multiple files simultaneously, saving you time and effort."
        },
        {
          question: "What happens if my internet connection is interrupted?",
          answer: "If your connection is interrupted during upload, you can resume the upload when reconnected. Processed files are temporarily stored for 1 hour."
        }
      ]}
      relatedTools={[
        {
          name: "PDF to Word",
          path: "/pdf-to-word",
          description: "Convert OCR results to editable Word"
        },
        {
          name: "PDF to Text",
          path: "/pdf-to-text",
          description: "Extract plain text from PDFs"
        },
        {
          name: "Enhance PDF",
          path: "/enhance-pdf",
          description: "Improve scan quality before OCR"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default RecognizeTextPage