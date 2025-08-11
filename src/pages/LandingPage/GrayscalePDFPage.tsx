import { Circle } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const GrayscalePDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF grayscale:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Conversion Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="standard" className="text-primary-600" defaultChecked />
            <span>Standard grayscale conversion</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="luminance" className="text-primary-600" />
            <span>Luminance-based conversion</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="desaturate" className="text-primary-600" />
            <span>Desaturation method</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quality Settings
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="high">High Quality (no compression)</option>
          <option value="medium">Medium Quality (slight compression)</option>
          <option value="optimized">Optimized (smaller file size)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contrast Adjustment
        </label>
        <input
          type="range"
          min="-50"
          max="50"
          defaultValue="0"
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Lower</span>
          <span>Normal</span>
          <span>Higher</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Brightness Adjustment
        </label>
        <input
          type="range"
          min="-50"
          max="50"
          defaultValue="0"
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Darker</span>
          <span>Normal</span>
          <span>Brighter</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-text" className="text-primary-600" defaultChecked />
        <label htmlFor="preserve-text" className="text-sm text-gray-700">
          Preserve text sharpness
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="optimize-printing" className="text-primary-600" />
        <label htmlFor="optimize-printing" className="text-sm text-gray-700">
          Optimize for printing
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Grayscale PDF"
      toolDescription="Convert color PDF documents to grayscale. Reduce file size and prepare documents for black and white printing."
      toolIcon={Circle}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="200MB"
      processingTime="30-60 seconds"
      features={[
        "Multiple conversion methods",
        "Quality control options",
        "Contrast and brightness adjustment",
        "Text sharpness preservation",
        "Print optimization",
        "Batch conversion support",
        "File size reduction",
        "Professional results"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the color PDF file you want to convert"
        },
        {
          title: "Choose Method",
          description: "Select conversion method and quality settings"
        },
        {
          title: "Adjust Settings",
          description: "Fine-tune contrast and brightness if needed"
        },
        {
          title: "Download",
          description: "Get your grayscale PDF file"
        }
      ]}
      faqs={[
        {
          question: "Why convert a PDF to grayscale?",
          answer: "Grayscale conversion reduces file size, saves on color printing costs, and ensures consistent appearance on black and white printers."
        },
        {
          question: "Will text remain sharp after conversion?",
          answer: "Yes, our conversion process preserves text sharpness and readability while converting images and graphics to grayscale."
        },
        {
          question: "How much can file size be reduced?",
          answer: "File size reduction varies, but typically ranges from 20-60% depending on the amount of color content in the original PDF."
        },
        {
          question: "Can I adjust the appearance of the grayscale conversion?",
          answer: "Yes, you can adjust contrast and brightness to optimize the appearance of the converted document."
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
          name: "Compress PDF",
          path: "/compress-pdf",
          description: "Further reduce file size after conversion"
        },
        {
          name: "Enhance PDF",
          path: "/enhance-pdf",
          description: "Improve document quality and readability"
        },
        {
          name: "Optimize PDF",
          path: "/optimize-pdf",
          description: "Optimize PDF for web or print"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default GrayscalePDFPage