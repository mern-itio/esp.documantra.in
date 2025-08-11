import { ArrowUpDown } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const ReorderPagesPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing page reordering:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reordering Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="drag" className="text-primary-600" defaultChecked />
            <span>Drag and drop reordering</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="reverse" className="text-primary-600" />
            <span>Reverse page order</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="custom" className="text-primary-600" />
            <span>Custom page sequence</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom Page Sequence
        </label>
        <input
          type="text"
          placeholder="e.g., 3,1,4,2,5 (specify exact order)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Enter page numbers in desired order, separated by commas</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Range to Reorder
        </label>
        <input
          type="text"
          placeholder="e.g., 1-10 (leave empty for all pages)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="update-bookmarks" className="text-primary-600" defaultChecked />
        <label htmlFor="update-bookmarks" className="text-sm text-gray-700">
          Update bookmarks to match new order
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="update-links" className="text-primary-600" defaultChecked />
        <label htmlFor="update-links" className="text-sm text-gray-700">
          Update internal links
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Reorder PDF Pages"
      toolDescription="Change the order of pages in your PDF documents. Rearrange, reverse, or customize page sequence with visual drag-and-drop interface."
      toolIcon={ArrowUpDown}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="200MB"
      processingTime="15-30 seconds"
      features={[
        "Visual drag-and-drop reordering",
        "Reverse page order option",
        "Custom page sequence",
        "Bookmark and link updates",
        "Batch processing support",
        "Preview before saving",
        "Maintain original quality",
        "Professional organization"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to reorder"
        },
        {
          title: "Choose Method",
          description: "Select reordering method or drag pages manually"
        },
        {
          title: "Arrange Pages",
          description: "Set your desired page order"
        },
        {
          title: "Download",
          description: "Get your reordered PDF file"
        }
      ]}
      faqs={[
        {
          question: "How does the drag-and-drop reordering work?",
          answer: "Our visual interface shows thumbnails of all pages that you can drag and drop to rearrange. Simply click and hold a page, then move it to the desired position."
        },
        {
          question: "Can I reverse the order of all pages?",
          answer: "Yes, our 'Reverse page order' option instantly flips the sequence of all pages, making the last page first and the first page last."
        },
        {
          question: "What is custom page sequence?",
          answer: "Custom sequence allows you to specify the exact order of pages using page numbers. For example, '3,1,4,2,5' would reorder a 5-page document to that specific sequence."
        },
        {
          question: "What happens to bookmarks after reordering?",
          answer: "When enabled, our system updates bookmarks to point to the correct pages after reordering, maintaining proper navigation functionality."
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
          name: "Organize PDF",
          path: "/organize-pdf",
          description: "Comprehensive PDF organization"
        },
        {
          name: "Split PDF",
          path: "/split-pdf",
          description: "Split PDF into separate documents"
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

export default ReorderPagesPage