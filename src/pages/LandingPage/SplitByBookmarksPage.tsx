import { Bookmark  } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const SplitByBookmarksPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF split by bookmarks:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bookmark Level
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="level" value="1" className="text-primary-600" defaultChecked />
            <span>Level 1 bookmarks only</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="level" value="2" className="text-primary-600" />
            <span>Level 1 and 2 bookmarks</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="level" value="all" className="text-primary-600" />
            <span>All bookmark levels</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="level" value="custom" className="text-primary-600" />
            <span>Custom bookmark selection</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Options
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="output" value="separate" className="text-primary-600" defaultChecked />
            <span>Separate PDF for each bookmark</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="output" value="hierarchy" className="text-primary-600" />
            <span>Maintain bookmark hierarchy</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Naming Convention
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="bookmark">Use bookmark text as filename</option>
          <option value="number">Number sequence (doc_1, doc_2, etc.)</option>
          <option value="both">Both (bookmark_1, bookmark_2, etc.)</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-bookmarks" className="text-primary-600" defaultChecked />
        <label htmlFor="preserve-bookmarks" className="text-sm text-gray-700">
          Preserve bookmarks in split files
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="include-parent" className="text-primary-600" />
        <label htmlFor="include-parent" className="text-sm text-gray-700">
          Include parent bookmark pages in child documents
        </label>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Bookmark className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">Bookmark-Based Splitting</h4>
            <p className="text-sm text-blue-700 mt-1">
              This tool splits your PDF at bookmark locations, creating separate documents for each section. Ideal for dividing large manuals, reports, or books into chapters.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Split PDF by Bookmarks"
      toolDescription="Divide PDF documents at bookmark locations. Create separate PDFs for chapters, sections, or bookmarked content."
      toolIcon={Bookmark}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="200MB"
      processingTime="30-60 seconds"
      features={[
        "Split at bookmark locations",
        "Multiple bookmark level options",
        "Preserve bookmark hierarchy",
        "Custom bookmark selection",
        "Intelligent naming options",
        "Batch processing support",
        "Maintain document quality",
        "Professional document division"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the bookmarked PDF file you want to split"
        },
        {
          title: "Choose Level",
          description: "Select which bookmark levels to use for splitting"
        },
        {
          title: "Set Options",
          description: "Configure output and naming preferences"
        },
        {
          title: "Download",
          description: "Get your split PDF files as a ZIP archive"
        }
      ]}
      faqs={[
        {
          question: "What if my PDF doesn't have bookmarks?",
          answer: "This tool requires PDFs with existing bookmarks. If your PDF doesn't have bookmarks, consider using our 'Split PDF' or 'Extract Pages' tools instead."
        },
        {
          question: "How are the split files named?",
          answer: "By default, split files are named using the bookmark text. You can also choose to use sequential numbering or a combination of both."
        },
        {
          question: "Can I split at specific bookmark levels only?",
          answer: "Yes, you can choose to split at level 1 bookmarks only, levels 1-2, or all bookmark levels depending on your document structure."
        },
        {
          question: "Will the bookmarks be preserved in the split files?",
          answer: "Yes, you can choose to preserve the bookmark structure in each split file, maintaining navigation within each section."
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
          description: "Split PDF by pages or intervals"
        },
        {
          name: "Create Bookmarks",
          path: "/create-bookmarks",
          description: "Add bookmarks to PDF documents"
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

export default SplitByBookmarksPage