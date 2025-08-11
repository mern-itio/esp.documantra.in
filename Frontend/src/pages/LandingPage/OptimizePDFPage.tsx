import { Zap } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const OptimizePDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF optimization:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Optimization Level
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="level" value="web" className="text-primary-600" defaultChecked />
            <span>Web optimization (fast loading)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="level" value="print" className="text-primary-600" />
            <span>Print optimization (high quality)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="level" value="mobile" className="text-primary-600" />
            <span>Mobile optimization (small size)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="level" value="custom" className="text-primary-600" />
            <span>Custom optimization</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image Optimization
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Compress images</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Remove duplicate images</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Convert to grayscale</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Reduce image resolution</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Font Optimization
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Subset fonts (remove unused characters)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Remove embedded fonts</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Convert to standard fonts</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content Optimization
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Remove metadata</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Remove unused objects</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Flatten transparency</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Remove annotations</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="linearize" className="text-primary-600" defaultChecked />
        <label htmlFor="linearize" className="text-sm text-gray-700">
          Linearize for fast web view
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Optimize PDF"
      toolDescription="Optimize PDF files for web, print, or mobile viewing. Reduce file size while maintaining quality through advanced optimization techniques."
      toolIcon={Zap}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="200MB"
      processingTime="45-90 seconds"
      features={[
        "Multiple optimization presets",
        "Advanced image compression",
        "Font subsetting and optimization",
        "Content cleanup and removal",
        "Web linearization",
        "Batch optimization support",
        "Quality preservation options",
        "Performance enhancement"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to optimize"
        },
        {
          title: "Choose Preset",
          description: "Select optimization level or customize settings"
        },
        {
          title: "Configure Options",
          description: "Fine-tune image, font, and content optimization"
        },
        {
          title: "Download",
          description: "Get your optimized PDF file"
        }
      ]}
      faqs={[
        {
          question: "What's the difference between optimization presets?",
          answer: "Web optimization prioritizes fast loading, print optimization maintains high quality, and mobile optimization creates the smallest file size."
        },
        {
          question: "How much can file size be reduced?",
          answer: "File size reduction varies but typically ranges from 30-80% depending on the original content and optimization settings chosen."
        },
        {
          question: "Will optimization affect document quality?",
          answer: "Our optimization algorithms are designed to maintain visual quality while reducing file size. You can control the balance between size and quality."
        },
        {
          question: "What is PDF linearization?",
          answer: "Linearization reorganizes PDF content for faster web viewing, allowing pages to display before the entire file is downloaded."
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
          description: "Simple PDF compression tool"
        },
        {
          name: "Reduce PDF Size",
          path: "/reduce-pdf-size",
          description: "Advanced size reduction techniques"
        },
        {
          name: "Clean PDF",
          path: "/clean-pdf",
          description: "Remove unnecessary elements"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default OptimizePDFPage