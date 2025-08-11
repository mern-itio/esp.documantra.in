import { Scissors } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const PDFPageExtractorPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing page extraction:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Extraction Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="range" className="text-primary-600" defaultChecked />
            <span>Extract page range</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="specific" className="text-primary-600" />
            <span>Extract specific pages</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="even" className="text-primary-600" />
            <span>Extract even pages only</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="odd" className="text-primary-600" />
            <span>Extract odd pages only</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pages to Extract
        </label>
        <input
          type="text"
          placeholder="e.g., 1-5, 10, 15-20"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Specify page numbers or ranges separated by commas</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Options
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="output" value="single" className="text-primary-600" defaultChecked />
            <span>Single PDF with extracted pages</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="output" value="separate" className="text-primary-600" />
            <span>Separate PDF for each page</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="output" value="ranges" className="text-primary-600" />
            <span>Separate PDF for each range</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Naming Convention (for multiple PDFs)
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="original-page">Original_Page_X</option>
          <option value="page-number">Page_X</option>
          <option value="extract">Extract_X</option>
          <option value="custom">Custom prefix</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom Prefix (if selected)
        </label>
        <input
          type="text"
          placeholder="Enter custom prefix"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-bookmarks" className="text-primary-600" defaultChecked />
        <label htmlFor="preserve-bookmarks" className="text-sm text-gray-700">
          Preserve bookmarks in extracted pages
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-links" className="text-primary-600" defaultChecked />
        <label htmlFor="preserve-links" className="text-sm text-gray-700">
          Preserve internal links
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="zip-output" className="text-primary-600" defaultChecked />
        <label htmlFor="zip-output" className="text-sm text-gray-700">
          Download as ZIP archive (for multiple PDFs)
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="PDF Page Extractor"
      toolDescription="Extract specific pages from PDF documents. Create new PDFs with only the pages you need, with options for single or multiple output files."
      toolIcon={Scissors}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="200MB"
      processingTime="15-30 seconds"
      features={[
        "Extract specific pages or ranges",
        "Multiple output options",
        "Preserve bookmarks and links",
        "Custom naming conventions",
        "Batch extraction support",
        "Preview before extraction",
        "Maintain original quality",
        "Fast processing speed"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to extract pages from"
        },
        {
          title: "Specify Pages",
          description: "Enter page numbers or ranges to extract"
        },
        {
          title: "Choose Output",
          description: "Select how you want the extracted pages delivered"
        },
        {
          title: "Download",
          description: "Get your extracted pages as new PDF files"
        }
      ]}
      faqs={[
        {
          question: "How do I specify which pages to extract?",
          answer: "Use page numbers and ranges separated by commas. For example: '1-5, 10, 15-20' will extract pages 1 through 5, page 10, and pages 15 through 20."
        },
        {
          question: "Can I extract pages into separate PDF files?",
          answer: "Yes, you can choose to create a single PDF with all extracted pages, or separate PDF files for each page or range."
        },
        {
          question: "Will bookmarks and links be preserved?",
          answer: "Yes, we can preserve bookmarks and internal links in the extracted pages when the option is enabled."
        },
        {
          question: "How are multiple output files delivered?",
          answer: "Multiple output files are packaged in a ZIP archive for easy download, with filenames following your selected naming convention."
        },
        {
          question: "What's the difference between extraction methods?",
          answer: "Page range extracts consecutive pages. Specific pages allows non-consecutive selection. Even/odd pages extract only even or odd page numbers automatically."
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
          answer: "Yes, our batch processing feature allows you to upload and extract pages from multiple files simultaneously, saving you time and effort."
        },
        {
          question: "What happens if my internet connection is interrupted?",
          answer: "If your connection is interrupted during upload, you can resume the upload when reconnected. Processed files are temporarily stored for 1 hour."
        }
      ]}
      relatedTools={[
        {
          name: "Split PDF",
          path: "/split-pdf",
          description: "Split PDF into multiple documents"
        },
        {
          name: "Merge PDF",
          path: "/merge-pdf",
          description: "Combine extracted pages with other PDFs"
        },
        {
          name: "Remove Pages",
          path: "/remove-pages",
          description: "Remove unwanted pages from PDFs"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default PDFPageExtractorPage