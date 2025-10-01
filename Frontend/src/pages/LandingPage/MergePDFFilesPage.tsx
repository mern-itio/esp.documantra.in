import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const CustomCombineIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12H3"/>
    <path d="M16 7l5 5-5 5"/>
    <path d="M3 7l5 5-5 5"/>
  </svg>
)

const MergePDFFilesPage = () => {
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
          Page Range Options
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="range" value="all" className="text-primary-600" defaultChecked />
            <span>Include all pages</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="range" value="custom" className="text-primary-600" />
            <span>Custom page ranges for each file</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Ranges (if custom selected)
        </label>
        <textarea
          rows={3}
          placeholder="File 1: 1-3, 5, 7-10&#10;File 2: 2-5&#10;File 3: all"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Specify page ranges for each file, one per line</p>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="add-bookmarks" className="text-primary-600" defaultChecked />
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
      toolIcon={CustomCombineIcon}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="2MB per file"
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

export default MergePDFFilesPage