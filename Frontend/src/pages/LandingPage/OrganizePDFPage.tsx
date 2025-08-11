import { ArrowUpDown } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const OrganizePDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF organization:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Organization Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="manual" className="text-primary-600" defaultChecked />
            <span>Manual drag and drop reordering</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="reverse" className="text-primary-600" />
            <span>Reverse page order</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="sort" className="text-primary-600" />
            <span>Sort by page content</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Range to Organize
        </label>
        <input
          type="text"
          placeholder="e.g., 1-10, 15, 20-25 (leave empty for all pages)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom Page Order
        </label>
        <input
          type="text"
          placeholder="e.g., 3,1,4,2,5 (specify exact order)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Enter page numbers in desired order, separated by commas</p>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-bookmarks" className="text-primary-600" defaultChecked />
        <label htmlFor="preserve-bookmarks" className="text-sm text-gray-700">
          Update bookmarks to match new order
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-links" className="text-primary-600" defaultChecked />
        <label htmlFor="preserve-links" className="text-sm text-gray-700">
          Update internal links
        </label>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <ArrowUpDown className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">Page Organization</h4>
            <p className="text-sm text-blue-700 mt-1">
              Reorder PDF pages to improve document flow and organization. Perfect for fixing scanned documents or restructuring content.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Organize PDF"
      toolDescription="Reorder and organize PDF pages. Drag and drop pages, reverse order, or specify custom arrangements for better document flow."
      toolIcon={ArrowUpDown}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="200MB"
      processingTime="15-30 seconds"
      features={[
        "Drag and drop page reordering",
        "Reverse page order option",
        "Custom page arrangements",
        "Visual page preview",
        "Bookmark and link updates",
        "Batch page operations",
        "Preserve document quality",
        "Professional organization"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to reorganize"
        },
        {
          title: "Choose Method",
          description: "Select manual reordering or automatic options"
        },
        {
          title: "Arrange Pages",
          description: "Drag and drop or specify new page order"
        },
        {
          title: "Download",
          description: "Get your reorganized PDF file"
        }
      ]}
      faqs={[
        {
          question: "How do I reorder pages manually?",
          answer: "Use our visual interface to drag and drop pages into your desired order, or specify the exact order using page numbers."
        },
        {
          question: "Can I reverse the entire document?",
          answer: "Yes, you can quickly reverse the page order of the entire document with a single click."
        },
        {
          question: "What happens to bookmarks after reordering?",
          answer: "We can automatically update bookmarks to point to the correct pages after reordering, maintaining navigation functionality."
        },
        {
          question: "Can I organize only specific pages?",
          answer: "Yes, you can specify page ranges to organize only certain sections of your document while leaving others unchanged."
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
          description: "Split PDF into separate documents"
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

export default OrganizePDFPage