import { Image } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const ExtractImagesPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing image extraction:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image Format
        </label>
        <div className="grid grid-cols-2 gap-3">
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
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Extract Images"
      toolDescription="Extract all images from PDF documents. Save images in various formats with quality control options."
      toolIcon={Image}
      acceptedFormats={['.pdf']}
      outputFormats={['jpg', 'png', 'webp', 'original']}
      maxFileSize="200MB"
      processingTime="30-60 seconds"
      features={[
        "Extract all images from PDF",
        "Multiple output formats",
        "Quality control options",
        "Size filtering",
        "Batch image extraction",
        "Auto-enhancement options",
        "ZIP download for multiple images",
        "Preserve original quality"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file containing images to extract"
        },
        {
          title: "Set Options",
          description: "Choose format, quality, and size filters"
        },
        {
          title: "Extract",
          description: "Our system finds and extracts all images"
        },
        {
          title: "Download",
          description: "Get your images as individual files or ZIP"
        }
      ]}
      faqs={[
        {
          question: "What image formats can be extracted?",
          answer: "We can extract images in their original format (JPG, PNG, GIF, etc.) or convert them to JPG, PNG, or WebP formats."
        },
        {
          question: "How many images can be extracted from one PDF?",
          answer: "There's no limit to the number of images that can be extracted. All images meeting your size criteria will be extracted."
        },
        {
          question: "Will the image quality be preserved?",
          answer: "Yes, by default we preserve the original image quality. You can also choose to compress images to reduce file size if needed."
        },
        {
          question: "Can I filter out small or low-quality images?",
          answer: "Yes, you can set minimum width and height requirements to only extract images above a certain size threshold."
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
          name: "JPG to PDF",
          path: "/jpg-to-pdf",
          description: "Convert extracted images back to PDF"
        },
        {
          name: "Compress Images",
          path: "/compress-images",
          description: "Reduce extracted image file sizes"
        },
        {
          name: "PDF to JPG",
          path: "/pdf-to-jpg",
          description: "Convert PDF pages to images"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default ExtractImagesPage