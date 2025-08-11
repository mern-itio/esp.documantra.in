import { Image } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const PDFToImageAdvancedPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing advanced PDF to image conversion:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Format
        </label>
        <div className="grid grid-cols-3 gap-3">
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="format" value="jpg" className="text-primary-600" defaultChecked />
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
            <input type="radio" name="format" value="bmp" className="text-primary-600" />
            <span>BMP</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="format" value="gif" className="text-primary-600" />
            <span>GIF</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Resolution (DPI)
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="72">72 DPI (screen resolution)</option>
          <option value="150">150 DPI (web quality)</option>
          <option value="300" selected>300 DPI (print quality)</option>
          <option value="600">600 DPI (high quality)</option>
          <option value="1200">1200 DPI (ultra high quality)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Color Mode
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="color" value="color" className="text-primary-600" defaultChecked />
            <span>Full color</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="color" value="grayscale" className="text-primary-600" />
            <span>Grayscale</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="color" value="bw" className="text-primary-600" />
            <span>Black and white</span>
          </label>
        </div>
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Range (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g., 1-5, 10, 15-20"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image Quality (for JPG/WebP)
        </label>
        <input
          type="range"
          min="10"
          max="100"
          defaultValue="90"
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Lower quality</span>
          <span>Higher quality</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="transparent-bg" className="text-primary-600" />
        <label htmlFor="transparent-bg" className="text-sm text-gray-700">
          Transparent background (PNG only)
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="enhance" className="text-primary-600" defaultChecked />
        <label htmlFor="enhance" className="text-sm text-gray-700">
          Enhance image quality
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="PDF to Image Advanced"
      toolDescription="Convert PDF pages to high-quality images with advanced options. Control resolution, format, color mode, and more for perfect image output."
      toolIcon={Image}
      acceptedFormats={['.pdf']}
      outputFormats={['jpg', 'png', 'webp', 'tiff', 'bmp', 'gif']}
      maxFileSize="200MB"
      processingTime="30-90 seconds"
      features={[
        "Multiple output formats",
        "High-resolution conversion",
        "Color mode options",
        "Custom size settings",
        "Quality control",
        "Transparency support",
        "Image enhancement",
        "Batch conversion"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to convert to images"
        },
        {
          title: "Choose Format",
          description: "Select image format and quality settings"
        },
        {
          title: "Configure Options",
          description: "Set resolution, color mode, and size options"
        },
        {
          title: "Download",
          description: "Get your high-quality images"
        }
      ]}
      faqs={[
        {
          question: "What image format should I choose?",
          answer: "JPG is best for photos and complex graphics with smaller file sizes. PNG is ideal for graphics with transparency. WebP offers the best compression-to-quality ratio. TIFF is perfect for archiving and printing. BMP provides uncompressed quality, and GIF works well for simple graphics."
        },
        {
          question: "What resolution (DPI) should I use?",
          answer: "72 DPI is sufficient for screen viewing. 150 DPI works well for web quality images. 300 DPI is standard for printing. 600 DPI or higher is recommended for professional printing or when fine details are important."
        },
        {
          question: "How does color mode affect the output?",
          answer: "Full color preserves all color information. Grayscale converts to shades of gray, reducing file size. Black and white creates binary images (just black and white pixels), dramatically reducing file size but losing gradients."
        },
        {
          question: "What's the difference between JPG and PNG?",
          answer: "JPG uses lossy compression, making it ideal for photographs but less suitable for text and graphics. PNG uses lossless compression and supports transparency, making it better for graphics, screenshots, and text."
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
          name: "PDF to JPG",
          path: "/pdf-to-jpg",
          description: "Convert PDF to JPG images"
        },
        {
          name: "PDF to PNG",
          path: "/pdf-to-png",
          description: "Convert PDF to PNG with transparency"
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

export default PDFToImageAdvancedPage