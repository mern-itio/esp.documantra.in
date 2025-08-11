import { Image } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const ExtractImagesAdvancedPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing advanced image extraction:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Extraction Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="all" className="text-primary-600" defaultChecked />
            <span>Extract all images</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="embedded" className="text-primary-600" />
            <span>Extract embedded images only</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="vector" className="text-primary-600" />
            <span>Extract vector graphics</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="raster" className="text-primary-600" />
            <span>Extract raster images only</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Format
        </label>
        <div className="grid grid-cols-3 gap-3">
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="format" value="original" className="text-primary-600" defaultChecked />
            <span>Original Format</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="format" value="jpg" className="text-primary-600" />
            <span>JPG</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="format" value="png" className="text-primary-600" />
            <span>PNG</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="format" value="webp" className="text-primary-600" />
            <span>WebP</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="format" value="tiff" className="text-primary-600" />
            <span>TIFF</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="format" value="svg" className="text-primary-600" />
            <span>SVG (vectors)</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image Quality
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="original">Original Quality</option>
          <option value="high">High Quality (90%)</option>
          <option value="medium">Medium Quality (75%)</option>
          <option value="low">Low Quality (60%)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Minimum Image Size
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600">Width (pixels)</label>
            <input
              type="number"
              min="1"
              defaultValue="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Height (pixels)</label>
            <input
              type="number"
              min="1"
              defaultValue="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">Only extract images larger than these dimensions</p>
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
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="include-backgrounds" className="text-primary-600" />
        <label htmlFor="include-backgrounds" className="text-sm text-gray-700">
          Include background images
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="auto-enhance" className="text-primary-600" defaultChecked />
        <label htmlFor="auto-enhance" className="text-sm text-gray-700">
          Auto-enhance extracted images
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="extract-metadata" className="text-primary-600" />
        <label htmlFor="extract-metadata" className="text-sm text-gray-700">
          Extract image metadata
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Advanced Image Extraction"
      toolDescription="Extract images from PDF documents with advanced options. Control format, quality, and filtering with professional-grade extraction tools."
      toolIcon={Image}
      acceptedFormats={['.pdf']}
      outputFormats={['jpg', 'png', 'webp', 'tiff', 'svg', 'original']}
      maxFileSize="200MB"
      processingTime="30-90 seconds"
      features={[
        "Advanced extraction methods",
        "Multiple output formats",
        "Vector graphics support",
        "Quality control options",
        "Size filtering",
        "Metadata extraction",
        "Batch processing support",
        "Image enhancement options"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file containing images to extract"
        },
        {
          title: "Choose Method",
          description: "Select extraction method and output format"
        },
        {
          title: "Set Options",
          description: "Configure quality, filtering, and enhancement settings"
        },
        {
          title: "Download",
          description: "Get your extracted images as individual files or ZIP"
        }
      ]}
      faqs={[
        {
          question: "What's the difference between extraction methods?",
          answer: "All images extracts everything, embedded extracts only inserted images, vector extracts graphics like logos and illustrations, and raster extracts only pixel-based images."
        },
        {
          question: "Can I extract vector graphics as SVG?",
          answer: "Yes, our advanced extraction can convert vector elements in the PDF to SVG format, preserving their scalability and quality."
        },
        {
          question: "How does image enhancement work?",
          answer: "Our enhancement algorithms automatically adjust contrast, sharpness, and color balance to improve image quality and clarity."
        },
        {
          question: "What image metadata can be extracted?",
          answer: "We can extract EXIF, XMP, and other metadata including creation date, camera information, GPS data (if available), and image properties."
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
          answer: "Yes, our batch processing feature allows you to upload and extract images from multiple files simultaneously, saving you time and effort."
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
          name: "Extract Images",
          path: "/extract-images",
          description: "Basic image extraction"
        },
        {
          name: "JPG to PDF",
          path: "/jpg-to-pdf",
          description: "Convert images back to PDF"
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

export default ExtractImagesAdvancedPage