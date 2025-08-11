import { FileText } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const PDFDocumentScannerPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing document scanning:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Input Source
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="source" value="camera" className="text-primary-600" defaultChecked />
            <span>Capture from camera</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="source" value="image" className="text-primary-600" />
            <span>Upload image files</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document Type
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="auto">Auto-detect</option>
          <option value="document">Document/Text</option>
          <option value="id">ID Card/License</option>
          <option value="receipt">Receipt/Invoice</option>
          <option value="business-card">Business Card</option>
          <option value="photo">Photo</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enhancement Options
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Auto-crop and align</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Enhance contrast</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Remove shadows</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Sharpen text</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Correct perspective</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Remove background</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Quality
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="quality" value="high" className="text-primary-600" defaultChecked />
            <span>High quality (larger file)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="quality" value="balanced" className="text-primary-600" />
            <span>Balanced (recommended)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="quality" value="compressed" className="text-primary-600" />
            <span>Compressed (smaller file)</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Format
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="format" value="pdf" className="text-primary-600" defaultChecked />
            <span>PDF document</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="format" value="pdf-ocr" className="text-primary-600" />
            <span>PDF with OCR (searchable)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="format" value="jpg" className="text-primary-600" />
            <span>JPG image</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="format" value="png" className="text-primary-600" />
            <span>PNG image</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="multi-page" className="text-primary-600" defaultChecked />
        <label htmlFor="multi-page" className="text-sm text-gray-700">
          Create multi-page document from multiple images
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="auto-rotate" className="text-primary-600" defaultChecked />
        <label htmlFor="auto-rotate" className="text-sm text-gray-700">
          Auto-rotate pages to correct orientation
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="PDF Document Scanner"
      toolDescription="Turn your device into a document scanner. Capture documents with your camera or from image files and convert them to professional PDF documents."
      toolIcon={FileText}
      acceptedFormats={['.jpg', '.jpeg', '.png', '.bmp', '.tiff']}
      outputFormats={['pdf', 'jpg', 'png']}
      maxFileSize="50MB per image"
      processingTime="30-60 seconds"
      features={[
        "Camera capture support",
        "Image enhancement",
        "Auto-crop and alignment",
        "Perspective correction",
        "Shadow removal",
        "OCR text recognition",
        "Multi-page document creation",
        "Multiple output formats"
      ]}
      howToSteps={[
        {
          title: "Capture/Upload",
          description: "Capture with camera or upload image files"
        },
        {
          title: "Enhance",
          description: "Apply automatic enhancements for better quality"
        },
        {
          title: "Configure",
          description: "Set output options and format preferences"
        },
        {
          title: "Download",
          description: "Get your professional PDF document"
        }
      ]}
      faqs={[
        {
          question: "How does the camera capture work?",
          answer: "Our tool accesses your device's camera (with your permission) to let you take pictures of documents directly. It provides guidance for optimal positioning and lighting."
        },
        {
          question: "What types of documents work best?",
          answer: "The scanner works well with all types of documents including printed text, forms, receipts, ID cards, and business cards. For best results, ensure good lighting and a contrasting background."
        },
        {
          question: "How does auto-crop and alignment work?",
          answer: "Our intelligent algorithms detect document edges and automatically crop to remove backgrounds. It also corrects skew and perspective distortion to create a perfectly aligned document."
        },
        {
          question: "What is OCR and why would I need it?",
          answer: "OCR (Optical Character Recognition) converts the text in your scanned images to actual, selectable text. This makes your PDF searchable and allows you to copy text from it."
        },
        {
          question: "Can I scan multiple pages into one document?",
          answer: "Yes, you can capture or upload multiple images and combine them into a single multi-page PDF document, maintaining the order of your uploads."
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
        }
      ]}
      relatedTools={[
        {
          name: "OCR PDF",
          path: "/ocr-pdf",
          description: "Make scanned PDFs searchable"
        },
        {
          name: "Enhance PDF",
          path: "/enhance-pdf",
          description: "Improve document quality"
        },
        {
          name: "JPG to PDF",
          path: "/jpg-to-pdf",
          description: "Convert images to PDF"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default PDFDocumentScannerPage