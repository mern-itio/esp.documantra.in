import { Sparkles } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const EnhancePDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF enhancement:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enhancement Type
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="auto" className="text-primary-600" defaultChecked />
            <span>Auto-enhance (recommended)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="custom" className="text-primary-600" />
            <span>Custom enhancement</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="scanned" className="text-primary-600" />
            <span>Scanned document optimization</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image Quality
        </label>
        <input
          type="range"
          min="1"
          max="5"
          defaultValue="3"
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Lower</span>
          <span>Medium</span>
          <span>Higher</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Text Sharpening
        </label>
        <input
          type="range"
          min="0"
          max="5"
          defaultValue="3"
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>None</span>
          <span>Medium</span>
          <span>Maximum</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Color Adjustment
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600">Contrast</label>
            <input
              type="range"
              min="-50"
              max="50"
              defaultValue="0"
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Brightness</label>
            <input
              type="range"
              min="-50"
              max="50"
              defaultValue="0"
              className="w-full"
            />
          </div>
        </div>
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

      <div className="flex items-center gap-2">
        <input type="checkbox" id="ocr" className="text-primary-600" />
        <label htmlFor="ocr" className="text-sm text-gray-700">
          Apply OCR to make text searchable
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Enhance PDF"
      toolDescription="Improve PDF document quality with advanced enhancement tools. Sharpen text, optimize images, and fix scanned documents."
      toolIcon={Sparkles}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="200MB"
      processingTime="45-120 seconds"
      features={[
        "Auto-enhancement algorithms",
        "Text sharpening technology",
        "Image quality improvement",
        "Color and contrast adjustment",
        "Auto-deskew functionality",
        "Background noise removal",
        "OCR integration option",
        "Batch enhancement support"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to enhance"
        },
        {
          title: "Choose Enhancement",
          description: "Select auto-enhance or custom settings"
        },
        {
          title: "Adjust Settings",
          description: "Fine-tune enhancement parameters if needed"
        },
        {
          title: "Download",
          description: "Get your enhanced PDF document"
        }
      ]}
      faqs={[
        {
          question: "What types of documents benefit most from enhancement?",
          answer: "Scanned documents, low-quality PDFs, documents with faded text, and PDFs with poor image quality benefit most from our enhancement tools."
        },
        {
          question: "Will enhancement increase my file size?",
          answer: "In most cases, enhancement maintains or slightly increases file size due to quality improvements. You can use our Compress PDF tool afterward if needed."
        },
        {
          question: "Can enhancement recover severely damaged documents?",
          answer: "Enhancement can significantly improve many documents, but severely damaged or extremely low-quality documents may have limitations in recovery."
        },
        {
          question: "What's the difference between auto and custom enhancement?",
          answer: "Auto-enhancement applies our optimized algorithms automatically, while custom enhancement lets you control specific parameters like contrast, brightness, and sharpening."
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
          answer: "Yes, our batch processing feature allows you to upload and enhance multiple files simultaneously, saving you time and effort."
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
          name: "OCR PDF",
          path: "/ocr-pdf",
          description: "Make scanned PDFs searchable"
        },
        {
          name: "Deskew PDF",
          path: "/deskew-pdf",
          description: "Straighten skewed pages"
        },
        {
          name: "Optimize PDF",
          path: "/optimize-pdf",
          description: "Optimize PDF for better performance"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default EnhancePDFPage