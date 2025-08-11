import { Image } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const PDFToJPGPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF to JPG:', files, settings)
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
          Output Format
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="format" value="jpg" className="text-primary-600" defaultChecked />
            <span className="font-medium">JPG</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="format" value="png" className="text-primary-600" />
            <span className="font-medium">PNG</span>
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

      <div className="flex items-center gap-2">
        <input type="checkbox" id="optimize-web" className="text-primary-600" />
        <label htmlFor="optimize-web" className="text-sm text-gray-700">
          Optimize for web (smaller file size)
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="transparent-bg" className="text-primary-600" />
        <label htmlFor="transparent-bg" className="text-sm text-gray-700">
          Transparent background (PNG only)
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="PDF to JPG Converter"
      toolDescription="Convert PDF pages to high-quality JPG or PNG images. Perfect for web use, presentations, and sharing."
      toolIcon={Image}
      acceptedFormats={['.pdf']}
      outputFormats={['jpg', 'png', 'webp']}
      maxFileSize="100MB"
      processingTime="20-40 seconds"
      features={[
        "High-quality image conversion",
        "Multiple output formats (JPG, PNG, WebP)",
        "Custom DPI settings",
        "Batch page conversion",
        "Selective page conversion",
        "Web optimization options",
        "Transparent background support",
        "ZIP download for multiple images"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to convert to images"
        },
        {
          title: "Choose Settings",
          description: "Select image quality, format, and page range"
        },
        {
          title: "Convert Pages",
          description: "Our system converts each page to a high-quality image"
        },
        {
          title: "Download Images",
          description: "Get your images as individual files or ZIP archive"
        }
      ]}
      faqs={[
        {
          question: "What image formats are supported?",
          answer: "We support JPG, PNG, and WebP formats. JPG is best for photos, PNG for graphics with transparency, and WebP for web optimization."
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
          question: "Can I convert password-protected PDFs?",
          answer: "Yes, you can convert password-protected PDFs by entering the password during upload."
        }
      ]}
      relatedTools={[
        {
          name: "JPG to PDF",
          path: "/jpg-to-pdf",
          description: "Convert images back to PDF format"
        },
        {
          name: "Compress Images",
          path: "/compress-images",
          description: "Reduce image file sizes"
        },
        {
          name: "PDF to PNG",
          path: "/pdf-to-png",
          description: "Convert to PNG with transparency"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default PDFToJPGPage