import { Scissors } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const SplitBySizePage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF split by size:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Maximum File Size
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="1"
            defaultValue="10"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option value="MB">MB</option>
            <option value="KB">KB</option>
          </select>
        </div>
        <p className="text-xs text-gray-500 mt-1">Each output file will be smaller than this size</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Split Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="adaptive" className="text-primary-600" defaultChecked />
            <span>Adaptive (optimize for content)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="equal" className="text-primary-600" />
            <span>Equal size parts</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="page" className="text-primary-600" />
            <span>Split at page boundaries only</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Options
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="output" value="separate" className="text-primary-600" />
            <span>Separate PDF files</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="output" value="zip" className="text-primary-600" defaultChecked />
            <span>ZIP archive with all parts</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Naming Convention
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="part">Part numbers (Part_1, Part_2, etc.)</option>
          <option value="original">Original name with numbers</option>
          <option value="custom">Custom prefix with numbers</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-bookmarks" className="text-primary-600" defaultChecked />
        <label htmlFor="preserve-bookmarks" className="text-sm text-gray-700">
          Preserve bookmarks in split files
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="optimize-parts" className="text-primary-600" />
        <label htmlFor="optimize-parts" className="text-sm text-gray-700">
          Optimize each part for smaller size
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Split PDF by Size"
      toolDescription="Divide large PDF files into smaller parts based on file size. Perfect for email attachments and file size limitations."
      toolIcon={Scissors}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="500MB"
      processingTime="30-90 seconds"
      features={[
        "Split by maximum file size",
        "Multiple splitting methods",
        "Adaptive content optimization",
        "Preserve document structure",
        "Batch processing support",
        "Custom naming options",
        "ZIP archive output",
        "Maintain original quality"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the large PDF file you want to split"
        },
        {
          title: "Set Size Limit",
          description: "Specify maximum size for each part"
        },
        {
          title: "Choose Method",
          description: "Select splitting method and output options"
        },
        {
          title: "Download",
          description: "Get your split PDF files"
        }
      ]}
      faqs={[
        {
          question: "Why would I need to split a PDF by size?",
          answer: "Splitting by size is useful for email attachments with size limits, cloud storage restrictions, or when you need to distribute large documents in smaller chunks."
        },
        {
          question: "How accurate is the size splitting?",
          answer: "Our algorithm aims to keep each part under your specified size limit while maintaining page integrity. Actual sizes may vary slightly due to content complexity."
        },
        {
          question: "What's the difference between splitting methods?",
          answer: "Adaptive method optimizes for content, equal size creates parts of similar size, and page boundary method only splits at complete pages."
        },
        {
          question: "Will the quality be affected?",
          answer: "No, splitting by size maintains the original quality of all content. If you enable optimization, there may be slight quality reduction to achieve smaller sizes."
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
          answer: "Free users can convert files up to 500MB. Premium users have higher limits and can process larger files without restrictions."
        }
      ]}
      relatedTools={[
        {
          name: "Split PDF",
          path: "/split-pdf",
          description: "Split PDF by pages or intervals"
        },
        {
          name: "Compress PDF",
          path: "/compress-pdf",
          description: "Reduce PDF file size"
        },
        {
          name: "Merge PDF",
          path: "/merge-pdf",
          description: "Combine multiple PDFs"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default SplitBySizePage