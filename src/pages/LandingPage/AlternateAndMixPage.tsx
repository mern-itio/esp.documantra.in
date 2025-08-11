import { Shuffle } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const AlternateAndMixPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF alternate and mix:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mix Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="alternate" className="text-primary-600" defaultChecked />
            <span>Alternate pages (1-1, 2-2, etc.)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="interleave" className="text-primary-600" />
            <span>Interleave documents (1, 1, 2, 2, etc.)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="custom" className="text-primary-600" />
            <span>Custom mixing pattern</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom Pattern (if selected)
        </label>
        <input
          type="text"
          placeholder="e.g., 1A,2B,3A,4B or A1-5,B1-5,A6-10,B6-10"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Use A/B to denote documents and numbers for pages</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Range for First Document (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g., 1-5, 10, 15-20"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Range for Second Document (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g., 1-5, 10, 15-20"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-bookmarks" className="text-primary-600" defaultChecked />
        <label htmlFor="preserve-bookmarks" className="text-sm text-gray-700">
          Preserve bookmarks
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="auto-rename" className="text-primary-600" defaultChecked />
        <label htmlFor="auto-rename" className="text-sm text-gray-700">
          Auto-rename bookmarks to avoid conflicts
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Alternate & Mix PDF"
      toolDescription="Combine pages from multiple PDF documents in alternating or custom patterns. Perfect for scanning double-sided documents or creating custom document flows."
      toolIcon={Shuffle}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="200MB"
      processingTime="20-40 seconds"
      features={[
        "Alternate pages between documents",
        "Interleave multiple PDFs",
        "Custom mixing patterns",
        "Page range selection",
        "Bookmark preservation",
        "Batch processing support",
        "Maintain original quality",
        "Professional document assembly"
      ]}
      howToSteps={[
        {
          title: "Upload PDFs",
          description: "Select two or more PDF files to mix"
        },
        {
          title: "Choose Method",
          description: "Select alternating, interleaving, or custom pattern"
        },
        {
          title: "Set Options",
          description: "Configure page ranges and bookmark options"
        },
        {
          title: "Download",
          description: "Get your mixed PDF document"
        }
      ]}
      faqs={[
        {
          question: "What's the difference between alternating and interleaving?",
          answer: "Alternating takes one page from each document in sequence (A1, B1, A2, B2). Interleaving takes all pages from one document, then all from another (A1, A2, B1, B2)."
        },
        {
          question: "When would I use the alternate & mix feature?",
          answer: "This is perfect for combining front and back pages when scanning double-sided documents separately, or for creating custom document flows from multiple sources."
        },
        {
          question: "Can I mix more than two documents?",
          answer: "Yes, you can upload and mix multiple PDF documents in custom patterns to create exactly the document flow you need."
        },
        {
          question: "What happens to bookmarks when mixing documents?",
          answer: "Bookmarks from all documents can be preserved and automatically renamed to avoid conflicts, ensuring proper navigation in the mixed document."
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
          name: "Merge PDF",
          path: "/merge-pdf",
          description: "Combine PDFs sequentially"
        },
        {
          name: "Split PDF",
          path: "/split-pdf",
          description: "Split PDF into separate files"
        },
        {
          name: "Organize PDF",
          path: "/organize-pdf",
          description: "Reorder and organize PDF pages"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default AlternateAndMixPage