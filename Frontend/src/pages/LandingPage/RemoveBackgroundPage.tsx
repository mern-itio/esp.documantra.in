import { FileText } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'



const RemoveBackgroundPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing background removal:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Background Detection
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="detection" value="auto" className="text-primary-600" defaultChecked />
            <span>Auto-detect background</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="detection" value="color" className="text-primary-600" />
            <span>Remove specific color</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="detection" value="pattern" className="text-primary-600" />
            <span>Remove pattern/texture</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Background Color (if color selected)
        </label>
        <div className="grid grid-cols-3 gap-3">
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="color" value="white" className="text-primary-600" defaultChecked />
            <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
            <span>White</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="color" value="light-gray" className="text-primary-600" />
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <span>Light Gray</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="color" value="yellow" className="text-primary-600" />
            <div className="w-4 h-4 bg-yellow-100 rounded"></div>
            <span>Light Yellow</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="color" value="blue" className="text-primary-600" />
            <div className="w-4 h-4 bg-blue-100 rounded"></div>
            <span>Light Blue</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="color" value="custom" className="text-primary-600" />
            <span>Custom</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Replacement Background
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="replacement" value="white" className="text-primary-600" defaultChecked />
            <span>White background</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="replacement" value="transparent" className="text-primary-600" />
            <span>Transparent background</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="replacement" value="color" className="text-primary-600" />
            <span>Custom color background</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sensitivity
        </label>
        <input
          type="range"
          min="1"
          max="10"
          defaultValue="5"
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-text" className="text-primary-600" defaultChecked />
        <label htmlFor="preserve-text" className="text-sm text-gray-700">
          Preserve text quality
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="all-pages" className="text-primary-600" defaultChecked />
        <label htmlFor="all-pages" className="text-sm text-gray-700">
          Apply to all pages
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Remove Background from PDF"
      toolDescription="Remove backgrounds, colors, or patterns from PDF documents. Clean up scanned documents and improve readability."
      toolIcon={FileText}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="2MB"
      processingTime="30-90 seconds"
      features={[
        "Auto-detect background removal",
        "Color-based background removal",
        "Pattern/texture removal",
        "Adjustable sensitivity",
        "Text quality preservation",
        "Custom replacement backgrounds",
        "Batch processing support",
        "High-quality output"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file with background to remove"
        },
        {
          title: "Choose Method",
          description: "Select background detection method"
        },
        {
          title: "Set Options",
          description: "Configure sensitivity and replacement"
        },
        {
          title: "Download",
          description: "Get your PDF with background removed"
        }
      ]}
      faqs={[
        {
          question: "How does automatic background detection work?",
          answer: "Our algorithm analyzes the document to identify consistent background elements like colors, patterns, or watermarks, then removes them while preserving foreground content."
        },
        {
          question: "Can I remove watermarks with this tool?",
          answer: "Yes, many watermarks can be removed using the pattern removal option, though results vary depending on how the watermark was applied."
        },
        {
          question: "Will removing background affect text quality?",
          answer: "Our default settings preserve text quality. The 'Preserve text quality' option ensures text remains sharp and readable after background removal."
        },
        {
          question: "What's the difference between sensitivity levels?",
          answer: "Higher sensitivity removes more background elements but may affect some content. Lower sensitivity is more conservative but may leave some background elements."
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
          answer: "Yes, our batch processing feature allows you to upload and process multiple files simultaneously, saving you time and effort."
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
          name: "Add Background",
          path: "/add-background",
          description: "Add backgrounds to PDF documents"
        },
        {
          name: "Enhance PDF",
          path: "/enhance-pdf",
          description: "Improve document quality"
        },
        {
          name: "Clean PDF",
          path: "/clean-pdf",
          description: "Remove unwanted elements"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default RemoveBackgroundPage