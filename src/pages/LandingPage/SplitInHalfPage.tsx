import { Scissors } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const SplitInHalfPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF split in half:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Split Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="middle" className="text-primary-600" defaultChecked />
            <span>Split in the middle (equal halves)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="custom" className="text-primary-600" />
            <span>Split at specific page</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="percentage" className="text-primary-600" />
            <span>Split by percentage</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Split at Page Number (if custom selected)
        </label>
        <input
          type="number"
          min="1"
          placeholder="Enter page number"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Split Percentage (if percentage selected)
        </label>
        <input
          type="range"
          min="10"
          max="90"
          defaultValue="50"
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>10%</span>
          <span>50%</span>
          <span>90%</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Options
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="output" value="separate" className="text-primary-600" defaultChecked />
            <span>Create two separate PDF files</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="output" value="zip" className="text-primary-600" />
            <span>Combine output in ZIP archive</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-bookmarks" className="text-primary-600" defaultChecked />
        <label htmlFor="preserve-bookmarks" className="text-sm text-gray-700">
          Preserve bookmarks in split files
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="auto-name" className="text-primary-600" defaultChecked />
        <label htmlFor="auto-name" className="text-sm text-gray-700">
          Auto-generate file names (Part 1, Part 2)
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Split PDF in Half"
      toolDescription="Divide PDF documents into two equal parts or at a specific page. Perfect for separating large documents into manageable sections."
      toolIcon={Scissors}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="200MB"
      processingTime="10-20 seconds"
      features={[
        "Split into equal halves",
        "Split at specific page",
        "Split by percentage",
        "Preserve bookmarks",
        "Batch processing support",
        "Custom naming options",
        "ZIP archive option",
        "Maintain original quality"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to split in half"
        },
        {
          title: "Choose Method",
          description: "Select equal halves or custom split point"
        },
        {
          title: "Set Options",
          description: "Configure output and bookmark preferences"
        },
        {
          title: "Download",
          description: "Get your split PDF files"
        }
      ]}
      faqs={[
        {
          question: "How does splitting in half work?",
          answer: "For a PDF with an even number of pages, we split it exactly in half. For odd page counts, you can choose which half gets the extra page."
        },
        {
          question: "Can I split at a specific page instead of the middle?",
          answer: "Yes, you can specify an exact page number where you want to split the document, creating two parts before and after that page."
        },
        {
          question: "What happens to bookmarks when splitting?",
          answer: "Bookmarks are preserved in each half, with only the relevant bookmarks included in each part based on page ranges."
        },
        {
          question: "Can I split multiple PDFs at once?",
          answer: "Yes, our batch processing feature allows you to split multiple PDF files simultaneously, saving you time and effort."
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
          name: "Split PDF",
          path: "/split-pdf",
          description: "Split PDF into multiple parts"
        },
        {
          name: "Merge PDF",
          path: "/merge-pdf",
          description: "Combine multiple PDFs"
        },
        {
          name: "Extract Pages",
          path: "/extract-pages",
          description: "Extract specific pages from PDF"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default SplitInHalfPage