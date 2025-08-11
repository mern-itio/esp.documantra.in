import { Eye } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const OCRPDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing OCR PDF:', files, settings)
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
    </div>
  )

  return (
    <PDFToolLayout
      toolName="OCR PDF"
      toolDescription="Make scanned PDFs searchable and editable. Extract text from images and scanned documents with high accuracy."
      toolIcon={Eye}
      acceptedFormats={['.pdf', '.jpg', '.png', '.tiff']}
      outputFormats={['pdf', 'txt', 'docx']}
      maxFileSize="200MB"
      processingTime="60-180 seconds"
      features={[
        "Advanced OCR technology",
        "99%+ text recognition accuracy",
        "Support for 50+ languages",
        "Preserve original layout and formatting",
        "Searchable PDF output",
        "Batch processing support",
        "Image enhancement options",
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
          title: "Extract Text",
          description: "Download your searchable PDF or extracted text"
        }
      ]}
      faqs={[
        {
          question: "How accurate is the OCR text recognition?",
          answer: "Our OCR technology achieves 99%+ accuracy for clear, well-scanned documents and 95%+ for lower quality scans."
        },
        {
          question: "What languages are supported?",
          answer: "We support over 50 languages including English, Spanish, French, German, Chinese, Japanese, Arabic, and many more."
        },
        {
          question: "Can I OCR handwritten text?",
          answer: "Our OCR works best with printed text. Handwritten text recognition is limited and depends on handwriting clarity."
        },
        {
          question: "Will the original formatting be preserved?",
          answer: "Yes, we preserve the original layout, fonts, and formatting while making the text searchable and selectable."
        },
        {
          question: "What file formats can I upload for OCR?",
          answer: "You can upload PDF files, as well as image formats like JPG, PNG, and TIFF for OCR processing."
        }
      ]}
      relatedTools={[
        {
          name: "PDF to Word",
          path: "/pdf-to-word",
          description: "Convert OCR results to editable Word documents"
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

export default OCRPDFPage