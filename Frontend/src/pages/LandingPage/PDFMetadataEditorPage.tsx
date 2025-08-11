import { Info } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const PDFMetadataEditorPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing metadata editing:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document Properties
        </label>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Title</label>
            <input
              type="text"
              placeholder="Enter document title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Author</label>
            <input
              type="text"
              placeholder="Enter author name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Subject</label>
            <input
              type="text"
              placeholder="Enter document subject"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Keywords</label>
            <input
              type="text"
              placeholder="Enter keywords (comma-separated)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Metadata
        </label>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Creator</label>
            <input
              type="text"
              placeholder="Enter creator application"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Producer</label>
            <input
              type="text"
              placeholder="Enter producer information"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Creation Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Modification Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom Metadata
        </label>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Property name"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Property value"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button className="text-sm text-primary-600 hover:text-primary-700">
            + Add another custom property
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          XMP Metadata
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Preserve existing XMP metadata</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Remove all XMP metadata</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Edit XMP metadata (advanced)</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="remove-sensitive" className="text-primary-600" defaultChecked />
        <label htmlFor="remove-sensitive" className="text-sm text-gray-700">
          Remove potentially sensitive metadata
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="backup" className="text-primary-600" defaultChecked />
        <label htmlFor="backup" className="text-sm text-gray-700">
          Create backup of original metadata
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="PDF Metadata Editor"
      toolDescription="View and edit PDF document metadata. Update document properties, add custom metadata, and manage XMP data for better organization and searchability."
      toolIcon={Info}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="100MB"
      processingTime="10-20 seconds"
      features={[
        "Edit document properties",
        "Update author and title",
        "Modify creation dates",
        "Add custom metadata",
        "Manage XMP metadata",
        "Remove sensitive information",
        "Batch metadata editing",
        "Metadata backup options"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file whose metadata you want to edit"
        },
        {
          title: "View Current Metadata",
          description: "See existing metadata in the document"
        },
        {
          title: "Edit Properties",
          description: "Update document properties and metadata fields"
        },
        {
          title: "Download",
          description: "Get your PDF with updated metadata"
        }
      ]}
      faqs={[
        {
          question: "What is PDF metadata?",
          answer: "PDF metadata includes information about the document such as title, author, creation date, keywords, and other properties that help with document identification, organization, and searchability."
        },
        {
          question: "Why would I want to edit metadata?",
          answer: "Editing metadata improves document organization, searchability, and attribution. It's also useful for removing sensitive information, updating incorrect details, or adding keywords for better findability."
        },
        {
          question: "What is XMP metadata?",
          answer: "XMP (Extensible Metadata Platform) is an advanced metadata format that stores detailed information about the document in XML format. It can include copyright information, version history, and other specialized data."
        },
        {
          question: "What sensitive information might be in metadata?",
          answer: "Metadata can contain author names, email addresses, company information, software details, editing history, and sometimes even location data or comments that were intended to be private."
        },
        {
          question: "Will editing metadata affect the document content?",
          answer: "No, editing metadata only changes the document properties and does not affect the actual content, layout, or appearance of the PDF."
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
          answer: "Yes, our batch processing feature allows you to upload and edit metadata for multiple files simultaneously, saving you time and effort."
        },
        {
          question: "What happens if my internet connection is interrupted?",
          answer: "If your connection is interrupted during upload, you can resume the upload when reconnected. Processed files are temporarily stored for 1 hour."
        }
      ]}
      relatedTools={[
        {
          name: "Remove Metadata",
          path: "/remove-metadata",
          description: "Completely remove all metadata"
        },
        {
          name: "Edit PDF",
          path: "/edit-pdf",
          description: "Edit PDF content and properties"
        },
        {
          name: "PDF Security Audit",
          path: "/pdf-security-audit",
          description: "Check document for security issues"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default PDFMetadataEditorPage