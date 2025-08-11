import { List } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const TableOfContentsPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing table of contents creation:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Generation Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="bookmarks" className="text-primary-600" defaultChecked />
            <span>Generate from bookmarks</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="headings" className="text-primary-600" />
            <span>Detect headings automatically</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="manual" className="text-primary-600" />
            <span>Manual entry</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          TOC Placement
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="placement" value="beginning" className="text-primary-600" defaultChecked />
            <span>Beginning of document</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="placement" value="after" className="text-primary-600" />
            <span>After specific page</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="placement" value="separate" className="text-primary-600" />
            <span>Create separate TOC file</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Number (if placing after specific page)
        </label>
        <input
          type="number"
          min="1"
          defaultValue="1"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          TOC Depth
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="1">Level 1 only</option>
          <option value="2">Levels 1-2</option>
          <option value="3" selected>Levels 1-3</option>
          <option value="all">All levels</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          TOC Style
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="classic">Classic (dots)</option>
          <option value="modern">Modern (no dots)</option>
          <option value="hierarchical">Hierarchical (indented)</option>
          <option value="minimal">Minimal</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="clickable" className="text-primary-600" defaultChecked />
        <label htmlFor="clickable" className="text-sm text-gray-700">
          Make entries clickable (hyperlinked)
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="page-numbers" className="text-primary-600" defaultChecked />
        <label htmlFor="page-numbers" className="text-sm text-gray-700">
          Include page numbers
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Table of Contents Generator"
      toolDescription="Create and add a table of contents to PDF documents. Generate from bookmarks, headings, or manual entries with clickable navigation."
      toolIcon={List}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="200MB"
      processingTime="20-45 seconds"
      features={[
        "Generate from bookmarks",
        "Auto-detect headings",
        "Multiple placement options",
        "Customizable TOC depth",
        "Various style options",
        "Clickable navigation links",
        "Page number inclusion",
        "Professional formatting"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF document that needs a table of contents"
        },
        {
          title: "Choose Method",
          description: "Select generation method and placement"
        },
        {
          title: "Set Style",
          description: "Configure depth, style, and navigation options"
        },
        {
          title: "Download",
          description: "Get your PDF with a professional table of contents"
        }
      ]}
      faqs={[
        {
          question: "How does bookmark-based generation work?",
          answer: "Our system extracts the bookmark structure from your PDF and creates a table of contents that matches the hierarchy and page references of those bookmarks."
        },
        {
          question: "What if my PDF doesn't have bookmarks?",
          answer: "You can use our automatic heading detection, which analyzes text formatting to identify headings, or manually create the table of contents entries."
        },
        {
          question: "Will the table of contents be clickable?",
          answer: "Yes, when you enable the clickable option, each entry in the table of contents will be hyperlinked to the corresponding page in the document."
        },
        {
          question: "Can I customize the appearance of the table of contents?",
          answer: "Yes, you can choose from several style options including classic (with dot leaders), modern, hierarchical, and minimal styles."
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
          name: "Create Bookmarks",
          path: "/create-bookmarks",
          description: "Add bookmarks to PDF documents"
        },
        {
          name: "Page Numbers",
          path: "/page-numbers",
          description: "Add page numbers to documents"
        },
        {
          name: "Header & Footer",
          path: "/header-footer",
          description: "Add headers and footers to PDFs"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default TableOfContentsPage