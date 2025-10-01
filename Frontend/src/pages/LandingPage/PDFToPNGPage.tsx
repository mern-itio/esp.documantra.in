import { Image } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const PDFToPNGPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF to PNG:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image Quality
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="quality" value="high" className="text-primary-600" defaultChecked />
            <span>High Quality (300 DPI)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="quality" value="medium" className="text-primary-600" />
            <span>Medium Quality (150 DPI)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="quality" value="low" className="text-primary-600" />
            <span>Low Quality (72 DPI)</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Transparency Options
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="transparency" value="transparent" className="text-primary-600" defaultChecked />
            <span>Preserve transparency</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="transparency" value="white" className="text-primary-600" />
            <span>White background</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="transparency" value="custom" className="text-primary-600" />
            <span>Custom background color</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Range (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g., 1-5, 10, 15-20"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Leave empty to convert all pages</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image Size
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="size" value="original" className="text-primary-600" defaultChecked />
            <span>Original size</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="size" value="custom" className="text-primary-600" />
            <span>Custom size</span>
          </label>
          <div className="grid grid-cols-2 gap-3 pl-6">
            <div>
              <label className="text-xs text-gray-600">Width (px)</label>
              <input
                type="number"
                min="1"
                defaultValue="1920"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Height (px)</label>
              <input
                type="number"
                min="1"
                defaultValue="1080"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="zip-output" className="text-primary-600" defaultChecked />
        <label htmlFor="zip-output" className="text-sm text-gray-700">
          Download as ZIP archive
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="PDF to PNG Converter"
      toolDescription="Convert PDF pages to high-quality PNG images with transparency support. Ideal for web graphics, presentations, and design work."
      toolIcon={Image}
      acceptedFormats={['.pdf']}
      outputFormats={['png']}
      maxFileSize="2MB"
      processingTime="20-45 seconds"
      features={[
        "High-quality PNG conversion",
        "Transparency support",
        "Multiple DPI options",
        "Custom background colors",
        "Batch page conversion",
        "Selective page conversion",
        "Custom size options",
        "ZIP download for multiple images"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to convert to PNG"
        },
        {
          title: "Choose Settings",
          description: "Select quality, transparency, and page range"
        },
        {
          title: "Convert Pages",
          description: "Our system converts each page to a PNG image"
        },
        {
          title: "Download Images",
          description: "Get your PNG images as individual files or ZIP archive"
        }
      ]}
      faqs={[
        {
          question: "Why choose PNG over JPG for PDF conversion?",
          answer: "PNG supports transparency and is better for graphics, text, and illustrations. It provides lossless compression, maintaining higher quality than JPG for these types of content."
        },
        {
          question: "What's the maximum resolution I can get?",
          answer: "You can convert at up to 300 DPI for print-quality images. Higher DPI settings produce larger file sizes but better quality."
        },
        {
          question: "Can I convert specific pages only?",
          answer: "Yes, you can specify page ranges like '1-5, 10, 15-20' to convert only the pages you need."
        },
        {
          question: "How are multiple pages delivered?",
          answer: "Multiple pages are automatically packaged in a ZIP file for easy download and organization."
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
          name: "PNG to PDF",
          path: "/png-to-pdf",
          description: "Convert PNG images back to PDF format"
        },
        {
          name: "PDF to JPG",
          path: "/pdf-to-jpg",
          description: "Convert PDF pages to JPG format"
        },
        {
          name: "Compress Images",
          path: "/compress-images",
          description: "Reduce image file sizes"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default PDFToPNGPage