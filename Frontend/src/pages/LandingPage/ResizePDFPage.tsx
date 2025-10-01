import { Maximize } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const ResizePDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF resize:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Resize Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="standard" className="text-primary-600" defaultChecked />
            <span>Standard paper size</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="percentage" className="text-primary-600" />
            <span>Scale by percentage</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="custom" className="text-primary-600" />
            <span>Custom dimensions</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Standard Size
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="a4">A4 (210 × 297 mm)</option>
          <option value="letter">Letter (8.5 × 11 in)</option>
          <option value="legal">Legal (8.5 × 14 in)</option>
          <option value="a3">A3 (297 × 420 mm)</option>
          <option value="a5">A5 (148 × 210 mm)</option>
          <option value="tabloid">Tabloid (11 × 17 in)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Scale Percentage
        </label>
        <input
          type="range"
          min="10"
          max="200"
          defaultValue="100"
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>10%</span>
          <span>100%</span>
          <span>200%</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom Dimensions
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600">Width (mm)</label>
            <input
              type="number"
              min="1"
              defaultValue="210"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Height (mm)</label>
            <input
              type="number"
              min="1"
              defaultValue="297"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-aspect" className="text-primary-600" defaultChecked />
        <label htmlFor="preserve-aspect" className="text-sm text-gray-700">
          Preserve aspect ratio
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="fit-content" className="text-primary-600" defaultChecked />
        <label htmlFor="fit-content" className="text-sm text-gray-700">
          Fit content to page
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Resize PDF"
      toolDescription="Change PDF page dimensions to standard sizes or custom dimensions. Scale pages up or down while maintaining quality."
      toolIcon={Maximize}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="2MB"
      processingTime="20-40 seconds"
      features={[
        "Standard paper size conversion",
        "Percentage scaling options",
        "Custom dimension settings",
        "Aspect ratio preservation",
        "Content fitting options",
        "Batch resizing support",
        "High-quality output",
        "Professional formatting"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to resize"
        },
        {
          title: "Choose Method",
          description: "Select standard size, scaling, or custom dimensions"
        },
        {
          title: "Set Options",
          description: "Configure aspect ratio and content fitting"
        },
        {
          title: "Download",
          description: "Get your resized PDF file"
        }
      ]}
      faqs={[
        {
          question: "What's the difference between resizing and scaling?",
          answer: "Resizing changes the page dimensions to specific measurements, while scaling increases or decreases the size by a percentage while maintaining proportions."
        },
        {
          question: "Will resizing affect the quality of my PDF?",
          answer: "Our resizing algorithm maintains the quality of text and vector elements. Images may be resampled but we use high-quality algorithms to preserve clarity."
        },
        {
          question: "What does 'preserve aspect ratio' mean?",
          answer: "This option maintains the proportional relationship between width and height, preventing distortion when resizing."
        },
        {
          question: "Can I resize only specific pages?",
          answer: "Currently, all pages in the document will be resized to the same dimensions. For page-specific resizing, consider processing those pages separately."
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
          answer: "Free users can convert files up to 2MB. Premium users have higher limits and can process larger files without restrictions."
        }
      ]}
      relatedTools={[
        {
          name: "Crop PDF",
          path: "/crop-pdf",
          description: "Crop PDF pages to remove margins"
        },
        {
          name: "Rotate PDF",
          path: "/rotate-pdf",
          description: "Rotate PDF pages to correct orientation"
        },
        {
          name: "Compress PDF",
          path: "/compress-pdf",
          description: "Reduce PDF file size"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default ResizePDFPage