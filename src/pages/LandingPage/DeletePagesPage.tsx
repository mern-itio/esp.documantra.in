import { Trash2 } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const DeletePagesPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing page deletion:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pages to Delete
        </label>
        <input
          type="text"
          placeholder="e.g., 2, 5-8, 12"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Specify page numbers or ranges to delete</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Delete Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="specific" className="text-primary-600" defaultChecked />
            <span>Delete specific pages</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="blank" className="text-primary-600" />
            <span>Delete blank pages automatically</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="range" className="text-primary-600" />
            <span>Delete page ranges</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="update-bookmarks" className="text-primary-600" defaultChecked />
        <label htmlFor="update-bookmarks" className="text-sm text-gray-700">
          Update bookmarks after deletion
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
              Deleted pages cannot be recovered. Make sure to keep a backup of your original file.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Delete Pages"
      toolDescription="Remove unwanted pages from PDF documents. Delete specific pages, ranges, or blank pages automatically."
      toolIcon={Trash2}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="200MB"
      processingTime="10-20 seconds"
      features={[
        "Delete specific pages or ranges",
        "Automatic blank page detection",
        "Update bookmarks and links",
        "Batch page deletion",
        "Preview before deletion",
        "Preserve document structure",
        "Fast processing speed",
        "Maintain original quality"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to remove pages from"
        },
        {
          title: "Specify Pages",
          description: "Enter page numbers or ranges to delete"
        },
        {
          title: "Choose Options",
          description: "Select deletion method and update preferences"
        },
        {
          title: "Download",
          description: "Get your PDF with unwanted pages removed"
        }
      ]}
      faqs={[
        {
          question: "How do I specify which pages to delete?",
          answer: "Enter page numbers separated by commas, or use ranges with hyphens. For example: '2, 5-8, 12' will delete pages 2, 5 through 8, and page 12."
        },
        {
          question: "Can I automatically delete blank pages?",
          answer: "Yes, we can automatically detect and remove blank or nearly blank pages from your PDF document."
        },
        {
          question: "What happens to bookmarks after deleting pages?",
          answer: "We can automatically update bookmarks to point to the correct pages after deletion, or remove bookmarks that pointed to deleted pages."
        },
        {
          question: "Can I undo page deletion?",
          answer: "No, page deletion is permanent. We recommend keeping a backup of your original file before deleting pages."
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

export default DeletePagesPage