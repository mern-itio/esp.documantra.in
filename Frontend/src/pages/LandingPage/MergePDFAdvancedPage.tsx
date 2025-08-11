import { FilePlus } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const MergePDFAdvancedPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing advanced PDF merge:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Merge Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="standard" className="text-primary-600" defaultChecked />
            <span>Standard merge (sequential)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="interleave" className="text-primary-600" />
            <span>Interleave pages (1-1, 2-2, etc.)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="alternate" className="text-primary-600" />
            <span>Alternate pages (1, 1, 2, 2, etc.)</span>
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
        <textarea
          rows={3}
          placeholder="Example: A1-5, B1-3, A6-10, B4-6&#10;Use letters to denote files and numbers for pages"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Specify exact page order from multiple documents</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document Structure
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Add bookmarks for each document</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Preserve original bookmarks</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Update internal links</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Add table of contents</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Handling
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Normalize page sizes</span>
          </label>
          <div className="pl-6">
            <label className="block text-xs text-gray-600 mb-1">Target Page Size</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option value="auto">Auto (use largest page)</option>
              <option value="a4">A4</option>
              <option value="letter">Letter</option>
              <option value="legal">Legal</option>
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Add page transitions</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Add page numbers</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Optimization
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Optimize file size</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Linearize for fast web view</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Remove duplicate resources</span>
          </label>
        </div>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Advanced PDF Merge"
      toolDescription="Combine PDF files with advanced options for page ordering, document structure, and output optimization. Create custom document flows with precise control."
      toolIcon={FilePlus}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="200MB per file"
      processingTime="30-90 seconds"
      features={[
        "Advanced merging methods",
        "Custom page sequencing",
        "Bookmark management",
        "Page size normalization",
        "Table of contents generation",
        "Page transition effects",
        "Output optimization",
        "Professional document assembly"
      ]}
      howToSteps={[
        {
          title: "Upload PDFs",
          description: "Select multiple PDF files to merge"
        },
        {
          title: "Choose Method",
          description: "Select merging method and page sequence"
        },
        {
          title: "Configure Options",
          description: "Set document structure and page handling options"
        },
        {
          title: "Download",
          description: "Get your professionally merged PDF document"
        }
      ]}
      faqs={[
        {
          question: "What's the difference between merging methods?",
          answer: "Standard merge combines documents sequentially. Interleave alternates pages from each document (1-1, 2-2). Alternate takes one page from each document in sequence (1, 1, 2, 2). Custom allows precise control over page order."
        },
        {
          question: "How does custom page sequencing work?",
          answer: "You can specify exactly which pages from which documents to include and in what order. For example, 'A1-5, B1-3, A6-10' would take pages 1-5 from document A, then pages 1-3 from document B, then pages 6-10 from document A."
        },
        {
          question: "What happens when merging documents with different page sizes?",
          answer: "By default, each page maintains its original size. With 'Normalize page sizes' enabled, all pages are adjusted to the selected target size while preserving content proportions."
        },
        {
          question: "Can I create a table of contents for the merged document?",
          answer: "Yes, enabling the table of contents option creates a navigable TOC at the beginning of the document, with entries for each original document."
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
          answer: "Yes, our batch processing feature allows you to upload and merge multiple files simultaneously, saving you time and effort."
        },
        {
          question: "What happens if my internet connection is interrupted?",
          answer: "If your connection is interrupted during upload, you can resume the upload when reconnected. Processed files are temporarily stored for 1 hour."
        },
        {
          question: "What's the maximum file size I can convert?",
          answer: "Free users can convert files up to 200MB each. Premium users have higher limits and can process larger files without restrictions."
        }
      ]}
      relatedTools={[
        {
          name: "Merge PDF",
          path: "/merge-pdf",
          description: "Simple PDF merging"
        },
        {
          name: "Split PDF",
          path: "/split-pdf",
          description: "Divide PDFs into smaller documents"
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

export default MergePDFAdvancedPage