import { FolderInput } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const BatchProcessPDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing batch PDF operations:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Batch Operation
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="operation" value="compress" className="text-primary-600" defaultChecked />
            <span>Compress PDFs</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="operation" value="convert" className="text-primary-600" />
            <span>Convert to other format</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="operation" value="protect" className="text-primary-600" />
            <span>Add password protection</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="operation" value="watermark" className="text-primary-600" />
            <span>Add watermark</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="operation" value="ocr" className="text-primary-600" />
            <span>Apply OCR</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Format (if converting)
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="docx">Word (.docx)</option>
          <option value="jpg">Images (.jpg)</option>
          <option value="txt">Text (.txt)</option>
          <option value="html">HTML (.html)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Compression Level (if compressing)
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="low">Low Compression (High Quality)</option>
          <option value="medium" selected>Medium Compression (Recommended)</option>
          <option value="high">High Compression (Smaller Size)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Password (if protecting)
        </label>
        <input
          type="password"
          placeholder="Enter password for protection"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Watermark Text (if watermarking)
        </label>
        <input
          type="text"
          placeholder="Enter watermark text"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          OCR Language (if applying OCR)
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="auto">Auto-detect language</option>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="zip-output" className="text-primary-600" defaultChecked />
        <label htmlFor="zip-output" className="text-sm text-gray-700">
          Download as ZIP archive
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-names" className="text-primary-600" defaultChecked />
        <label htmlFor="preserve-names" className="text-sm text-gray-700">
          Preserve original filenames
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Batch Process PDF"
      toolDescription="Process multiple PDF files at once with various operations. Save time by applying the same operation to many documents simultaneously."
      toolIcon={FolderInput}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf', 'docx', 'jpg', 'txt', 'html']}
      maxFileSize="2MB per file"
      processingTime="Varies by operation and file count"
      features={[
        "Multiple file processing",
        "Various operations available",
        "Consistent settings across files",
        "Bulk compression",
        "Batch format conversion",
        "Mass protection",
        "Watermark multiple files",
        "OCR in bulk"
      ]}
      howToSteps={[
        {
          title: "Upload PDFs",
          description: "Select multiple PDF files to process"
        },
        {
          title: "Choose Operation",
          description: "Select the operation to apply to all files"
        },
        {
          title: "Set Options",
          description: "Configure settings for the selected operation"
        },
        {
          title: "Download",
          description: "Get your processed files as a ZIP archive"
        }
      ]}
      faqs={[
        {
          question: "How many files can I process at once?",
          answer: "You can process up to 20 files simultaneously in the free version. Premium users can process unlimited files in a single batch."
        },
        {
          question: "Will all files use the same settings?",
          answer: "Yes, the selected operation and settings will be applied consistently to all files in the batch."
        },
        {
          question: "Can I apply different operations to different files?",
          answer: "Currently, all files in a batch receive the same operation. For different operations, you'll need to process files in separate batches."
        },
        {
          question: "How are the processed files delivered?",
          answer: "All processed files are packaged in a ZIP archive for convenient download, with original filenames preserved if that option is selected."
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
          answer: "No account is required for basic usage. However, creating a free account gives you access to additional features like file history and increased batch limits."
        },
        {
          question: "What happens if my internet connection is interrupted?",
          answer: "If your connection is interrupted during upload, you can resume the upload when reconnected. Processed files are temporarily stored for 1 hour."
        },
        {
          question: "What's the maximum file size I can process?",
          answer: "Free users can process files up to 2MB each. Premium users have higher limits and can process larger files without restrictions."
        },
        {
          question: "Can I automate batch processing?",
          answer: "For automated batch processing, consider our API integration options which allow you to programmatically process files in your applications."
        }
      ]}
      relatedTools={[
        {
          name: "Compress PDF",
          path: "/compress-pdf",
          description: "Reduce PDF file size"
        },
        {
          name: "Convert from PDF",
          path: "/convert-from-pdf",
          description: "Convert PDFs to other formats"
        },
        {
          name: "Protect PDF",
          path: "/protect-pdf",
          description: "Add password protection to PDFs"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default BatchProcessPDFPage