import { FileX, Shield } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const RemoveMetadataPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing metadata removal:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Metadata to Remove
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Document properties (title, author, subject)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Creation and modification dates</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Software and producer information</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">XMP metadata</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Hidden text and layers</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Privacy Options
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Remove personal information</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Remove file attachments</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Remove JavaScript</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Remove embedded thumbnails</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Replacement Metadata (Optional)
        </label>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="New document title (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="New author (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="sanitize" className="text-primary-600" defaultChecked />
        <label htmlFor="sanitize" className="text-sm text-gray-700">
          Sanitize document (deep cleaning)
        </label>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">Privacy Protection</h4>
            <p className="text-sm text-blue-700 mt-1">
              Removing metadata helps protect your privacy by eliminating personal information, editing history, and other sensitive data that might be embedded in your PDF.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Remove Metadata"
      toolDescription="Remove hidden metadata and personal information from PDF documents. Protect your privacy and eliminate sensitive data."
      toolIcon={FileX}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="100MB"
      processingTime="15-30 seconds"
      features={[
        "Complete metadata removal",
        "Personal information scrubbing",
        "Hidden data elimination",
        "Document sanitization",
        "Privacy protection",
        "Batch processing support",
        "Optional metadata replacement",
        "Comprehensive cleaning"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to clean"
        },
        {
          title: "Choose Options",
          description: "Select which metadata to remove"
        },
        {
          title: "Process",
          description: "Our system removes all selected metadata"
        },
        {
          title: "Download",
          description: "Get your clean, metadata-free PDF"
        }
      ]}
      faqs={[
        {
          question: "What metadata can be hidden in PDFs?",
          answer: "PDFs can contain author names, creation dates, editing history, software information, comments, hidden text, and various other metadata that might reveal sensitive information."
        },
        {
          question: "Why should I remove metadata?",
          answer: "Removing metadata protects your privacy, prevents leaking sensitive information, reduces file size, and eliminates potentially embarrassing or confidential details before sharing documents."
        },
        {
          question: "Will removing metadata affect the document content?",
          answer: "No, removing metadata only eliminates hidden information and does not affect the visible content, layout, or functionality of the PDF."
        },
        {
          question: "What's the difference between basic removal and sanitization?",
          answer: "Basic removal targets standard metadata fields, while sanitization performs a deeper cleaning that includes hidden layers, scripts, and other potentially sensitive elements."
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
          answer: "Yes, our batch processing feature allows you to upload and clean multiple files simultaneously, saving you time and effort."
        },
        {
          question: "What happens if my internet connection is interrupted?",
          answer: "If your connection is interrupted during upload, you can resume the upload when reconnected. Processed files are temporarily stored for 1 hour."
        },
        {
          question: "What's the maximum file size I can convert?",
          answer: "Free users can convert files up to 100MB. Premium users have higher limits and can process larger files without restrictions."
        }
      ]}
      relatedTools={[
        {
          name: "Edit Metadata",
          path: "/edit-metadata",
          description: "Edit PDF metadata information"
        },
        {
          name: "Protect PDF",
          path: "/protect-pdf",
          description: "Add password protection to PDFs"
        },
        {
          name: "Redact PDF",
          path: "/redact-pdf",
          description: "Permanently remove sensitive content"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
      securityFeatures={[
        "Complete metadata removal",
        "256-bit SSL encryption during processing",
        "Files automatically deleted after 1 hour",
        "Secure HTTPS transmission",
        "No access to your document content"
      ]}
    />
  )
}

export default RemoveMetadataPage