import { Bookmark } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const CreateBookmarksPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing bookmark creation:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bookmark Creation Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="headings" className="text-primary-600" defaultChecked />
            <span>Auto-detect from headings</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="pages" className="text-primary-600" />
            <span>Create bookmark for each page</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="manual" className="text-primary-600" />
            <span>Manual bookmark list</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Heading Detection Level
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="1">Level 1 headings only</option>
          <option value="2">Levels 1-2 headings</option>
          <option value="3">Levels 1-3 headings</option>
          <option value="all">All heading levels</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Bookmark Format
        </label>
        <input
          type="text"
          placeholder="e.g., Page {#} or Chapter {#}"
          defaultValue="Page {#}"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Use &#123;#&#125; as placeholder for page number</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Manual Bookmark List (one per line)
        </label>
        <textarea
          rows={6}
          placeholder="Introduction - Page 1&#10;Chapter 1 - Page 5&#10;Chapter 2 - Page 15&#10;Conclusion - Page 25"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Format: Bookmark Name - Page Number</p>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="hierarchical" className="text-primary-600" defaultChecked />
        <label htmlFor="hierarchical" className="text-sm text-gray-700">
          Create hierarchical bookmark structure
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="expand-bookmarks" className="text-primary-600" defaultChecked />
        <label htmlFor="expand-bookmarks" className="text-sm text-gray-700">
          Expand bookmarks by default
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Create Bookmarks"
      toolDescription="Add navigation bookmarks to PDF documents. Auto-detect headings or create custom bookmark structures for easy navigation."
      toolIcon={Bookmark}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="2MB"
      processingTime="20-40 seconds"
      features={[
        "Auto-detect headings for bookmarks",
        "Create page-based bookmarks",
        "Manual bookmark creation",
        "Hierarchical bookmark structure",
        "Custom bookmark naming",
        "Multiple detection levels",
        "Batch processing support",
        "Professional navigation"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to add bookmarks to"
        },
        {
          title: "Choose Method",
          description: "Select auto-detection, page-based, or manual bookmarks"
        },
        {
          title: "Configure Options",
          description: "Set detection levels and bookmark formatting"
        },
        {
          title: "Download",
          description: "Get your PDF with navigation bookmarks added"
        }
      ]}
      faqs={[
        {
          question: "How does heading auto-detection work?",
          answer: "Our system analyzes text formatting (font size, weight, style) to identify headings and automatically creates bookmarks pointing to those sections."
        },
        {
          question: "Can I create nested bookmark structures?",
          answer: "Yes, when using heading detection, we can create hierarchical bookmarks based on heading levels (H1, H2, H3, etc.)."
        },
        {
          question: "What if my PDF doesn't have clear headings?",
          answer: "You can use page-based bookmarks or manually specify bookmark names and page numbers for complete control over the structure."
        },
        {
          question: "Will existing bookmarks be preserved?",
          answer: "New bookmarks will be added to any existing bookmark structure. If you want to replace existing bookmarks, let us know in the settings."
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
          name: "Table of Contents",
          path: "/table-of-contents",
          description: "Generate table of contents from bookmarks"
        },
        {
          name: "PDF Navigation",
          path: "/pdf-navigation",
          description: "Enhance PDF navigation features"
        },
        {
          name: "Organize PDF",
          path: "/organize-pdf",
          description: "Reorder pages and structure"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default CreateBookmarksPage