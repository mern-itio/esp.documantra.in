import { MessageSquare as MessageSquareOff } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const RemoveAnnotationsPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing annotation removal:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Annotation Types to Remove
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Comments and notes</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Highlights and markup</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Stamps and signatures</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Drawing and shapes</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Sticky notes</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Removal Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="all" className="text-primary-600" defaultChecked />
            <span>Remove all selected annotation types</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="author" className="text-primary-600" />
            <span>Remove annotations by specific author</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="date" className="text-primary-600" />
            <span>Remove annotations by date range</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Author Name (if filtering by author)
        </label>
        <input
          type="text"
          placeholder="Enter author name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date Range (if filtering by date)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-content" className="text-primary-600" defaultChecked />
        <label htmlFor="preserve-content" className="text-sm text-gray-700">
          Preserve underlying content
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Remove Annotations"
      toolDescription="Remove comments, highlights, and other annotations from PDF documents. Clean up documents for professional presentation."
      toolIcon={MessageSquareOff}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="2MB"
      processingTime="15-25 seconds"
      features={[
        "Remove all annotation types",
        "Selective annotation removal",
        "Filter by author or date",
        "Preserve document content",
        "Batch annotation removal",
        "Professional document cleanup",
        "Maintain document structure",
        "Privacy protection"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file with annotations to remove"
        },
        {
          title: "Choose Types",
          description: "Select which annotation types to remove"
        },
        {
          title: "Set Filters",
          description: "Optionally filter by author or date range"
        },
        {
          title: "Download",
          description: "Get your clean PDF without annotations"
        }
      ]}
      faqs={[
        {
          question: "What types of annotations can be removed?",
          answer: "We can remove comments, highlights, stamps, drawings, sticky notes, markup, and other annotation types commonly found in PDFs."
        },
        {
          question: "Can I remove annotations from specific authors only?",
          answer: "Yes, you can filter annotations by author name to remove only those created by specific people."
        },
        {
          question: "Will removing annotations affect the document content?",
          answer: "No, removing annotations only removes the overlay elements and preserves the original document content underneath."
        },
        {
          question: "Can I undo annotation removal?",
          answer: "No, annotation removal is permanent. We recommend keeping a backup of your original file before processing."
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
          answer: "Free users can convert files up to 2MB. Premium users have higher limits and can process larger files without restrictions."
        }
      ]}
      relatedTools={[
        {
          name: "Flatten PDF",
          path: "/flatten-pdf",
          description: "Convert annotations to static content"
        },
        {
          name: "Clean PDF",
          path: "/clean-pdf",
          description: "Remove all markup and annotations"
        },
        {
          name: "Edit PDF",
          path: "/edit-pdf",
          description: "Edit PDF content and annotations"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default RemoveAnnotationsPage