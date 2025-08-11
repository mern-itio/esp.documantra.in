import { Image } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const CompressImagesPDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF image compression:', files, settings)
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
          Image Resizing
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Resize large images</span>
          </label>
          <div className="pl-6 space-y-2">
            <label className="block text-xs text-gray-600">Maximum resolution (DPI)</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option value="72">72 DPI (screen resolution)</option>
              <option value="150">150 DPI (web quality)</option>
              <option value="300" selected>300 DPI (print quality)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="convert-images" className="text-primary-600" defaultChecked />
        <label htmlFor="convert-images" className="text-sm text-gray-700">
          Convert images to optimized formats
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="remove-metadata" className="text-primary-600" defaultChecked />
        <label htmlFor="remove-metadata" className="text-sm text-gray-700">
          Remove image metadata
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Compress PDF Images"
      toolDescription="Reduce PDF file size by compressing embedded images while preserving text quality. Ideal for PDFs with many photos or graphics."
      toolIcon={Image}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="200MB"
      processingTime="30-90 seconds"
      features={[
        "Smart image compression",
        "Multiple compression levels",
        "Image resolution reduction",
        "Format optimization",
        "Metadata removal",
        "Text quality preservation",
        "Batch processing support",
        "Before/after size comparison"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file with images to compress"
        },
        {
          title: "Choose Level",
          description: "Select compression level and image settings"
        },
        {
          title: "Compress",
          description: "Our system optimizes images in your PDF"
        },
        {
          title: "Download",
          description: "Get your PDF with reduced file size"
        }
      ]}
      faqs={[
        {
          question: "How much can file size be reduced?",
          answer: "Reduction varies based on content, but PDFs with many images typically see 30-80% size reduction while maintaining good visual quality."
        },
        {
          question: "Will text quality be affected?",
          answer: "No, our compression focuses only on images. Text, fonts, and vector elements remain crisp and clear with no quality loss."
        },
        {
          question: "What's the difference between compression levels?",
          answer: "Light compression maintains highest image quality with minimal size reduction. High compression achieves maximum size reduction but may show some visual differences in images."
        },
        {
          question: "How does image resizing work?",
          answer: "We can reduce the resolution of overly large images to a specified DPI (dots per inch), which significantly reduces file size while maintaining appropriate quality for your needs."
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
          answer: "Yes, our batch processing feature allows you to upload and compress multiple files simultaneously, saving you time and effort."
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
          name: "Compress PDF",
          path: "/compress-pdf",
          description: "General PDF compression"
        },
        {
          name: "Optimize PDF",
          path: "/optimize-pdf",
          description: "Advanced PDF optimization"
        },
        {
          name: "Reduce PDF Size",
          path: "/reduce-pdf-size",
          description: "Specialized size reduction"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default CompressImagesPDFPage