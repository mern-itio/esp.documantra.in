
import { RotateCcw } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const DeskewPDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF deskew:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Deskew Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="auto" className="text-primary-600" defaultChecked />
            <span>Auto-detect skew angle</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="manual" className="text-primary-600" />
            <span>Manual angle correction</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Manual Angle (degrees)
        </label>
        <input
          type="number"
          min="-45"
          max="45"
          step="0.1"
          defaultValue="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Positive values rotate clockwise, negative counter-clockwise</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Detection Sensitivity
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="low">Low (for slight skews)</option>
          <option value="medium">Medium (recommended)</option>
          <option value="high">High (for severe skews)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Background Fill
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="white">White</option>
          <option value="transparent">Transparent</option>
          <option value="auto">Auto-detect</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="crop-to-content" className="text-primary-600" />
        <label htmlFor="crop-to-content" className="text-sm text-gray-700">
          Crop to content after deskewing
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="enhance-quality" className="text-primary-600" defaultChecked />
        <label htmlFor="enhance-quality" className="text-sm text-gray-700">
          Enhance image quality
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Deskew PDF"
      toolDescription="Straighten skewed or tilted PDF pages. Perfect for correcting scanned documents and improving readability."
      toolIcon={RotateCcw}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="200MB"
      processingTime="30-90 seconds"
      features={[
        "Auto-detect skew angles",
        "Manual angle correction",
        "Batch deskewing support",
        "Multiple sensitivity levels",
        "Background fill options",
        "Content cropping option",
        "Image quality enhancement",
        "Preserve original resolution"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the skewed PDF file you want to straighten"
        },
        {
          title: "Choose Method",
          description: "Select auto-detection or manual angle correction"
        },
        {
          title: "Set Options",
          description: "Configure sensitivity and background settings"
        },
        {
          title: "Download",
          description: "Get your straightened PDF file"
        }
      ]}
      faqs={[
        {
          question: "How accurate is the auto-skew detection?",
          answer: "Our auto-detection algorithm can accurately identify skew angles up to ±45 degrees with 95%+ accuracy for most scanned documents."
        },
        {
          question: "What causes PDF pages to be skewed?",
          answer: "Skewing typically occurs during scanning when documents are not perfectly aligned on the scanner bed or when photographing documents."
        },
        {
          question: "Can I deskew multiple pages at once?",
          answer: "Yes, our tool processes all pages in the PDF and applies deskewing to each page that needs correction."
        },
        {
          question: "Will deskewing affect text recognition (OCR)?",
          answer: "Yes, deskewing significantly improves OCR accuracy by ensuring text lines are properly aligned for text recognition algorithms."
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
          name: "OCR PDF",
          path: "/ocr-pdf",
          description: "Extract text from deskewed documents"
        },
        {
          name: "Enhance PDF",
          path: "/enhance-pdf",
          description: "Improve overall document quality"
        },
        {
          name: "Rotate PDF",
          path: "/rotate-pdf",
          description: "Rotate PDF pages to correct orientation"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default DeskewPDFPage