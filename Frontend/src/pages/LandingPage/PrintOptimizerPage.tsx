import { Printer } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const PrintOptimizerPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing print optimization:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Optimization Target
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="target" value="office" className="text-primary-600" defaultChecked />
            <span>Office printing (standard)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="target" value="professional" className="text-primary-600" />
            <span>Professional printing (high quality)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="target" value="draft" className="text-primary-600" />
            <span>Draft printing (ink/toner saving)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="target" value="custom" className="text-primary-600" />
            <span>Custom optimization</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Size
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="original">Original size</option>
          <option value="a4">A4</option>
          <option value="letter">Letter</option>
          <option value="legal">Legal</option>
          <option value="a3">A3</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Scaling
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="none">None (actual size)</option>
          <option value="fit">Fit to printable area</option>
          <option value="shrink">Shrink oversized pages</option>
          <option value="custom">Custom scaling</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Print Options
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Auto-rotate pages</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Center content</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Print on both sides</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Add printer marks</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Color Management
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="color" value="preserve" className="text-primary-600" defaultChecked />
            <span>Preserve original colors</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="color" value="cmyk" className="text-primary-600" />
            <span>Convert to CMYK (for professional printing)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="color" value="grayscale" className="text-primary-600" />
            <span>Convert to grayscale</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="optimize-images" className="text-primary-600" defaultChecked />
        <label htmlFor="optimize-images" className="text-sm text-gray-700">
          Optimize images for printing
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Print Optimizer"
      toolDescription="Optimize PDF documents for printing. Adjust page scaling, color management, and print settings for perfect printed output."
      toolIcon={Printer}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="200MB"
      processingTime="30-60 seconds"
      features={[
        "Multiple optimization targets",
        "Page scaling options",
        "Color management",
        "Auto-rotation for printing",
        "Printer marks addition",
        "Double-sided printing setup",
        "Image optimization",
        "Professional print preparation"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF document to optimize for printing"
        },
        {
          title: "Choose Target",
          description: "Select optimization target and page settings"
        },
        {
          title: "Set Options",
          description: "Configure print and color management options"
        },
        {
          title: "Download",
          description: "Get your print-optimized PDF document"
        }
      ]}
      faqs={[
        {
          question: "What does print optimization do?",
          answer: "Print optimization adjusts your PDF for optimal printing results, including proper scaling, color management, image optimization, and print marks to ensure the best possible printed output."
        },
        {
          question: "When should I use professional printing optimization?",
          answer: "Use professional printing optimization when sending documents to commercial printing services, print shops, or when using high-end printers for important documents."
        },
        {
          question: "What's the difference between RGB and CMYK?",
          answer: "RGB (Red, Green, Blue) is for digital display, while CMYK (Cyan, Magenta, Yellow, Black) is for printing. Converting to CMYK ensures more accurate color reproduction in printed materials."
        },
        {
          question: "Will optimization affect my document's appearance?",
          answer: "Optimization aims to improve print quality while maintaining the document's appearance. Some slight color variations may occur when converting between color spaces."
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
          answer: "Yes, our batch processing feature allows you to upload and optimize multiple files simultaneously, saving you time and effort."
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
          name: "N-up PDF",
          path: "/n-up",
          description: "Arrange multiple pages on one sheet"
        },
        {
          name: "Booklet Creator",
          path: "/booklet-creator",
          description: "Create printable booklets"
        },
        {
          name: "Grayscale PDF",
          path: "/grayscale-pdf",
          description: "Convert to grayscale for printing"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default PrintOptimizerPage