import { FileText  } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'



const ScanToPDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing scan to PDF:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Input Format
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="format" value="image" className="text-primary-600" defaultChecked />
            <span>Image files (JPG, PNG, TIFF)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="format" value="camera" className="text-primary-600" />
            <span>Capture from camera</span>
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
          <option value="photo">Photo/Image</option>
          <option value="receipt">Receipt/Invoice</option>
          <option value="id">ID/Card</option>
        </select>
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
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="ocr" className="text-primary-600" defaultChecked />
        <label htmlFor="ocr" className="text-sm text-gray-700">
          Apply OCR (make text searchable)
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="multi-page" className="text-primary-600" defaultChecked />
        <label htmlFor="multi-page" className="text-sm text-gray-700">
          Create multi-page PDF from multiple images
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Scan to PDF"
      toolDescription="Convert scanned images or camera captures to professional PDF documents. Enhance quality, apply OCR, and create searchable PDFs."
      toolIcon={FileText}
      acceptedFormats={['.jpg', '.jpeg', '.png', '.tiff', '.bmp']}
      outputFormats={['pdf']}
      maxFileSize="50MB per image"
      processingTime="30-90 seconds"
      features={[
        "Image to PDF conversion",
        "Camera capture support",
        "Auto-crop and alignment",
        "Image enhancement",
        "OCR text recognition",
        "Multi-page PDF creation",
        "Document type optimization",
        "Professional output quality"
      ]}
      howToSteps={[
        {
          title: "Upload Images",
          description: "Select scanned images or capture from camera"
        },
        {
          title: "Choose Options",
          description: "Select document type and enhancement settings"
        },
        {
          title: "Process",
          description: "Our system enhances and converts your scans"
        },
        {
          title: "Download",
          description: "Get your professional PDF document"
        }
      ]}
      faqs={[
        {
          question: "What's the difference between image files and camera capture?",
          answer: "Image files are pre-existing scans or photos you upload. Camera capture uses your device's camera to take pictures in real-time for immediate conversion."
        },
        {
          question: "How does OCR make my PDF searchable?",
          answer: "OCR (Optical Character Recognition) identifies text in your images and adds an invisible text layer to your PDF, making it searchable and selectable."
        },
        {
          question: "What types of enhancements are applied?",
          answer: "We apply auto-cropping, alignment correction, contrast enhancement, shadow removal, and text sharpening to make your scanned documents look professional."
        },
        {
          question: "Can I combine multiple scans into one PDF?",
          answer: "Yes, you can upload multiple images and combine them into a single multi-page PDF document, maintaining the order of your uploads."
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
          answer: "Free users can convert images up to 50MB each. Premium users have higher limits and can process larger files without restrictions."
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

export default ScanToPDFPage