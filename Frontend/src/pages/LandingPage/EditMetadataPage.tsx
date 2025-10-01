import { Info } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const EditMetadataPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing metadata edit:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document Title
        </label>
        <input
          type="text"
          placeholder="Enter document title"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Author
        </label>
        <input
          type="text"
          placeholder="Enter author name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subject
        </label>
        <input
          type="text"
          placeholder="Enter document subject"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Keywords
        </label>
        <input
          type="text"
          placeholder="Enter keywords (comma-separated)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Creator Application
        </label>
        <input
          type="text"
          placeholder="Enter creator application name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Producer
        </label>
        <input
          type="text"
          placeholder="Enter producer information"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="update-dates" className="text-primary-600" defaultChecked />
        <label htmlFor="update-dates" className="text-sm text-gray-700">
          Update creation and modification dates
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="remove-metadata" className="text-primary-600" />
        <label htmlFor="remove-metadata" className="text-sm text-gray-700">
          Remove all existing metadata
        </label>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">PDF Metadata</h4>
            <p className="text-sm text-blue-700 mt-1">
              Metadata provides information about the document such as title, author, creation date, and keywords. This information is searchable and helps with document organization.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Edit Metadata"
      toolDescription="Edit PDF document metadata including title, author, subject, keywords, and other properties. Improve document organization and searchability."
      toolIcon={Info}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="2MB"
      processingTime="10-20 seconds"
      features={[
        "Edit document title and author",
        "Set subject and keywords",
        "Update creation information",
        "Remove sensitive metadata",
        "Batch metadata editing",
        "Preserve document content",
        "Search optimization",
        "Professional document properties"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file whose metadata you want to edit"
        },
        {
          title: "Edit Fields",
          description: "Update title, author, subject, and other metadata fields"
        },
        {
          title: "Set Options",
          description: "Choose whether to update dates or remove existing metadata"
        },
        {
          title: "Download",
          description: "Get your PDF with updated metadata"
        }
      ]}
      faqs={[
        {
          question: "What metadata can I edit in a PDF?",
          answer: "You can edit title, author, subject, keywords, creator application, producer, and creation/modification dates."
        },
        {
          question: "Why would I want to edit PDF metadata?",
          answer: "Editing metadata improves document organization, searchability, and provides proper attribution. It's also useful for removing sensitive information."
        },
        {
          question: "Can I remove all metadata for privacy?",
          answer: "Yes, you can choose to remove all existing metadata to protect privacy and remove potentially sensitive information."
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
          answer: "Yes, our batch processing feature allows you to upload and convert multiple files simultaneously, saving you time and effort."
        },
        {
          question: "What happens if my internet connection is interrupted?",
          answer: "If your connection is interrupted during upload, you can resume the upload when reconnected. Processed files are temporarily stored for 1 hour."
        },
        {
          question: "What's the maximum file size I can convert?",
          answer: "Free users can convert files up to 2MB. Premium users have higher limits and can process larger files without restrictions."
        }
      ]}
      relatedTools={[
        {
          name: "Remove Metadata",
          path: "/remove-metadata",
          description: "Completely remove all metadata from PDFs"
        },
        {
          name: "PDF Properties",
          path: "/pdf-properties",
          description: "View detailed PDF properties and information"
        },
        {
          name: "Optimize PDF",
          path: "/optimize-pdf",
          description: "Optimize PDF files for better performance"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default EditMetadataPage