import { Image } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const CompressImagesPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing image compression:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Compression Level
        </label>
        <div className="space-y-3">
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="compression" value="low" className="text-primary-600" />
            <div>
              <div className="font-medium">Light Compression</div>
              <div className="text-sm text-gray-600">Minimal size reduction, highest quality</div>
            </div>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="compression" value="medium" className="text-primary-600" defaultChecked />
            <div>
              <div className="font-medium">Medium Compression (Recommended)</div>
              <div className="text-sm text-gray-600">Good balance of size and quality</div>
            </div>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="compression" value="high" className="text-primary-600" />
            <div>
              <div className="font-medium">High Compression</div>
              <div className="text-sm text-gray-600">Maximum size reduction, lower quality</div>
            </div>
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
            <span>Original</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="format" value="jpg" className="text-primary-600" />
            <span>JPG</span>
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
        <input
          type="range"
          min="10"
          max="100"
          defaultValue="80"
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Lower quality</span>
          <span>Higher quality</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Resize Options
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Resize while compressing</span>
          </label>
          <div className="grid grid-cols-2 gap-3 pl-6">
            <div>
              <label className="text-xs text-gray-600">Max width (px)</label>
              <input
                type="number"
                min="1"
                defaultValue="1920"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Max height (px)</label>
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
        <input type="checkbox" id="strip-metadata" className="text-primary-600" defaultChecked />
        <label htmlFor="strip-metadata" className="text-sm text-gray-700">
          Remove metadata to reduce size
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Compress Images"
      toolDescription="Reduce image file sizes while maintaining visual quality. Perfect for web uploads, email attachments, and storage optimization."
      toolIcon={Image}
      acceptedFormats={['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff']}
      outputFormats={['jpg', 'png', 'webp', 'original']}
      maxFileSize="50MB per image"
      processingTime="10-30 seconds"
      features={[
        "Smart compression algorithms",
        "Multiple compression levels",
        "Format conversion options",
        "Batch image compression",
        "Metadata removal",
        "Resize while compressing",
        "WebP conversion support",
        "Preview before/after comparison"
      ]}
      howToSteps={[
        {
          title: "Upload Images",
          description: "Select the image files you want to compress"
        },
        {
          title: "Choose Level",
          description: "Select compression level and output format"
        },
        {
          title: "Compress",
          description: "Our system optimizes your images"
        },
        {
          title: "Download",
          description: "Get your compressed image files"
        }
      ]}
      faqs={[
        {
          question: "How much can images be compressed?",
          answer: "Compression rates vary depending on image content and format. Typically, you can achieve 30-80% size reduction while maintaining good visual quality."
        },
        {
          question: "Will compression affect image quality?",
          answer: "Our smart compression algorithms balance size reduction and quality. Higher compression levels may show some quality loss, while lower levels maintain near-original quality."
        },
        {
          question: "What's the best format for compressed images?",
          answer: "WebP offers the best compression-to-quality ratio for most images. JPG is good for photos, while PNG is better for graphics with transparency."
        },
        {
          question: "Can I compress multiple images at once?",
          answer: "Yes, our batch compression feature allows you to compress multiple images simultaneously, saving you time and effort."
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
          answer: "Yes! Our image compression tools are completely free to use with no hidden costs. You can process unlimited files without any charges."
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
          answer: "Yes, our batch processing feature allows you to upload and compress multiple files simultaneously, saving you time and effort."
        },
        {
          question: "What happens if my internet connection is interrupted?",
          answer: "If your connection is interrupted during upload, you can resume the upload when reconnected. Processed files are temporarily stored for 1 hour."
        },
        {
          question: "What's the maximum file size I can convert?",
          answer: "Free users can convert files up to 50MB each. Premium users have higher limits and can process larger files without restrictions."
        }
      ]}
      relatedTools={[
        {
          name: "JPG to PDF",
          path: "/jpg-to-pdf",
          description: "Convert images to PDF format"
        },
        {
          name: "Image Converter",
          path: "/image-converter",
          description: "Convert between image formats"
        },
        {
          name: "Resize Images",
          path: "/resize-images",
          description: "Change image dimensions"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default CompressImagesPage