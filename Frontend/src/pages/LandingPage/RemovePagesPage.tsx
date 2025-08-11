import { Trash2 } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const RemovePagesPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing page removal:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pages to Remove
        </label>
        <input
          type="text"
          placeholder="e.g., 2, 5-8, 12"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Specify page numbers or ranges to remove</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Removal Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="specific" className="text-primary-600" defaultChecked />
            <span>Remove specific pages</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="blank" className="text-primary-600" />
            <span>Remove blank pages automatically</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="even" className="text-primary-600" />
            <span>Remove even pages</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="odd" className="text-primary-600" />
            <span>Remove odd pages</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Blank Page Sensitivity (if removing blank pages)
        </label>
        <input
          type="range"
          min="1"
          max="10"
          defaultValue="5"
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Strict (only completely blank)</span>
          <span>Lenient (mostly blank)</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="update-bookmarks" className="text-primary-600" defaultChecked />
        <label htmlFor="update-bookmarks" className="text-sm text-gray-700">
          Update bookmarks after removal
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="update-links" className="text-primary-600" defaultChecked />
        <label htmlFor="update-links" className="text-sm text-gray-700">
          Update internal links
        </label>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-800">Warning</h4>
            <p className="text-sm text-red-700 mt-1">
              Removed pages cannot be recovered. Make sure to keep a backup of your original file.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Remove Pages from PDF"
      toolDescription="Delete unwanted pages from PDF documents. Remove specific pages, blank pages, or odd/even pages to clean up your documents."
      toolIcon={Trash2}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="200MB"
      processingTime="10-20 seconds"
      features={[
        "Remove specific pages or ranges",
        "Automatic blank page detection",
        "Remove odd or even pages",
        "Update bookmarks and links",
        "Batch page removal",
        "Preview before deletion",
        "Preserve document structure",
        "Fast processing speed"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to remove pages from"
        },
        {
          title: "Specify Pages",
          description: "Enter page numbers or select removal method"
        },
        {
          title: "Choose Options",
          description: "Configure update preferences for bookmarks and links"
        },
        {
          title: "Download",
          description: "Get your PDF with unwanted pages removed"
        }
      ]}
      faqs={[
        {
          question: "How do I specify which pages to remove?",
          answer: "Enter page numbers separated by commas, or use ranges with hyphens. For example: '2, 5-8, 12' will remove pages 2, 5 through 8, and page 12."
        },
        {
          question: "Can I automatically remove blank pages?",
          answer: "Yes, our blank page detection can automatically identify and remove pages with little or no content. You can adjust the sensitivity to determine what qualifies as 'blank'."
        },
        {
          question: "What happens to bookmarks after removing pages?",
          answer: "When enabled, our system updates bookmarks to point to the correct pages after removal, or removes bookmarks that pointed to deleted pages."
        },
        {
          question: "Can I undo page removal?",
          answer: "No, page removal is permanent. We recommend keeping a backup of your original file before removing pages."
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
          answer: "Free users can convert files up to 200MB. Premium users have higher limits and can process larger files without restrictions."
        }
      ]}
      relatedTools={[
        {
          name: "Extract Pages",
          path: "/extract-pages",
          description: "Extract specific pages to new PDF"
        },
        {
          name: "Split PDF",
          path: "/split-pdf",
          description: "Split PDF into multiple documents"
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

export default RemovePagesPage