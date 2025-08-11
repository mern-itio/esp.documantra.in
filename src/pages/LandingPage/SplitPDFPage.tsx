import { Scissors } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const SplitPDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF split:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Split Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="method" value="pages" className="text-primary-600" defaultChecked />
            <div>
              <div className="font-medium">Split by Page Range</div>
              <div className="text-sm text-gray-600">Specify exact pages to extract</div>
            </div>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="method" value="interval" className="text-primary-600" />
            <div>
              <div className="font-medium">Split by Interval</div>
              <div className="text-sm text-gray-600">Split every N pages</div>
            </div>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="method" value="size" className="text-primary-600" />
            <div>
              <div className="font-medium">Split by File Size</div>
              <div className="text-sm text-gray-600">Create files under specific size</div>
            </div>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Range or Interval
        </label>
        <input
          type="text"
          placeholder="e.g., 1-5, 10-15 or every 5 pages"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Examples: "1-3", "5,7,9", "every 2 pages"</p>
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
          Auto-generate file names
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Split PDF"
      toolDescription="Split large PDF files into smaller documents. Extract specific pages or split by intervals."
      toolIcon={Scissors}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="200MB"
      processingTime="15-30 seconds"
      features={[
        "Split by page range or intervals",
        "Extract specific pages",
        "Split by file size limits",
        "Preserve bookmarks and links",
        "Batch processing support",
        "Custom naming options",
        "Preview before splitting",
        "Maintain original quality"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to split"
        },
        {
          title: "Choose Method",
          description: "Select how you want to split the document"
        },
        {
          title: "Set Parameters",
          description: "Specify page ranges or split intervals"
        },
        {
          title: "Download Files",
          description: "Get your split PDF files as a ZIP archive"
        }
      ]}
      faqs={[
        {
          question: "What's the maximum size PDF I can split?",
          answer: "You can split PDF files up to 200MB. For larger files, consider using our premium service with no size limits."
        },
        {
          question: "Can I split password-protected PDFs?",
          answer: "Yes, you can split password-protected PDFs. You'll need to enter the password during upload."
        },
        {
          question: "How do I extract specific pages?",
          answer: "Use the page range option and specify pages like '1-5, 10, 15-20' to extract exactly what you need."
        },
        {
          question: "Will bookmarks be preserved?",
          answer: "Yes, bookmarks and internal links are preserved in the split files when the option is enabled."
        },
        {
          question: "Can I split multiple PDFs at once?",
          answer: "Currently, you can split one PDF at a time, but you can queue multiple files for processing."
        }
      ]}
      relatedTools={[
        {
          name: "Merge PDF",
          path: "/merge-pdf",
          description: "Combine split files back together"
        },
        {
          name: "Extract Pages",
          path: "/extract-pages",
          description: "Extract specific pages from PDF"
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

export default SplitPDFPage