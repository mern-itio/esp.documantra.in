import { Merge } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const MergePDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF merge:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Merge Order
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="order" value="upload" className="text-primary-600" defaultChecked />
            <span>Upload order</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="order" value="alphabetical" className="text-primary-600" />
            <span>Alphabetical order</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="order" value="custom" className="text-primary-600" />
            <span>Custom order (drag to reorder)</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Range (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g., 1-3, 5, 7-10"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Leave empty to merge all pages</p>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="add-bookmarks" className="text-primary-600" />
        <label htmlFor="add-bookmarks" className="text-sm text-gray-700">
          Add bookmarks for each document
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="optimize-size" className="text-primary-600" defaultChecked />
        <label htmlFor="optimize-size" className="text-sm text-gray-700">
          Optimize file size after merging
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Merge PDF Files"
      toolDescription="Combine multiple PDF documents into a single file. Maintain quality and customize merge order."
      toolIcon={Merge}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="100MB per file"
      processingTime="15-30 seconds"
      features={[
        "Merge unlimited PDF files",
        "Drag and drop to reorder pages",
        "Preserve original quality",
        "Add bookmarks for navigation",
        "Batch processing support",
        "Custom page range selection",
        "Automatic file optimization",
        "Password protection option"
      ]}
      howToSteps={[
        {
          title: "Upload PDFs",
          description: "Select multiple PDF files you want to merge together"
        },
        {
          title: "Arrange Order",
          description: "Drag and drop files to set the merge order"
        },
        {
          title: "Configure Options",
          description: "Set page ranges and merge preferences"
        },
        {
          title: "Merge & Download",
          description: "Process and download your merged PDF file"
        }
      ]}
      faqs={[
        {
          question: "How many PDF files can I merge at once?",
          answer: "You can merge unlimited PDF files. However, the total combined size should not exceed 500MB for optimal performance."
        },
        {
          question: "Can I merge password-protected PDFs?",
          answer: "Yes, you can merge password-protected PDFs. You'll need to provide the password for each protected file."
        },
        {
          question: "Will the quality be affected after merging?",
          answer: "No, our merge process preserves the original quality of all documents. Images and text remain crisp and clear."
        },
        {
          question: "Can I select specific pages from each PDF?",
          answer: "Yes, you can specify page ranges for each document. For example, use '1-3, 5, 7-10' to select specific pages."
        },
        {
          question: "How do I change the order of merged files?",
          answer: "Simply drag and drop the files in the upload area to reorder them before merging."
        }
      ]}
      relatedTools={[
        {
          name: "Split PDF",
          path: "/split-pdf",
          description: "Split large PDF files into smaller documents"
        },
        {
          name: "Compress PDF",
          path: "/compress-pdf",
          description: "Reduce file size after merging"
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

export default MergePDFPage