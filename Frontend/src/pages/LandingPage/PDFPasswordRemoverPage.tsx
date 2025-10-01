import { Unlock, Shield } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const PDFPasswordRemoverPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing password removal:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current Password
        </label>
        <input
          type="password"
          placeholder="Enter the current PDF password"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Enter the password to unlock the PDF</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Restrictions to Remove
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Remove user password (open password)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Remove owner password (permissions)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Remove printing restrictions</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Remove copying restrictions</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Remove editing restrictions</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Password Type
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="auto" className="text-primary-600" defaultChecked />
            <span>Auto-detect password type</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="user" className="text-primary-600" />
            <span>User password (for opening)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="owner" className="text-primary-600" />
            <span>Owner password (for permissions)</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="create-backup" className="text-primary-600" defaultChecked />
        <label htmlFor="create-backup" className="text-sm text-gray-700">
          Create backup of protected file
        </label>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">Security Notice</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Only unlock PDFs that you own or have permission to modify. Removing security from copyrighted documents may violate terms of use.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="PDF Password Remover"
      toolDescription="Remove password protection and restrictions from PDF files. Unlock PDFs to enable printing, copying, and editing."
      toolIcon={Unlock}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="2MB"
      processingTime="5-15 seconds"
      features={[
        "Remove password protection",
        "Remove printing restrictions",
        "Remove copying restrictions",
        "Remove editing restrictions",
        "Batch unlock multiple PDFs",
        "Preserve original quality",
        "Support for all PDF versions",
        "Secure processing"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the password-protected PDF file"
        },
        {
          title: "Enter Password",
          description: "Provide the PDF password to unlock it"
        },
        {
          title: "Choose Options",
          description: "Select which restrictions to remove"
        },
        {
          title: "Download",
          description: "Get your unlocked PDF file"
        }
      ]}
      faqs={[
        {
          question: "Can you remove passwords without knowing them?",
          answer: "No, we can only remove passwords and restrictions if you provide the correct password. We cannot crack or break PDF passwords - you must know the password to unlock the file."
        },
        {
          question: "Is it legal to remove PDF passwords?",
          answer: "You should only remove passwords from PDFs that you own or have explicit permission to modify. Removing security from copyrighted documents may violate terms of use."
        },
        {
          question: "What's the difference between user and owner passwords?",
          answer: "User password is required to open the PDF. Owner password controls permissions like printing and editing. Some PDFs have both, others have only one type."
        },
        {
          question: "Will the PDF quality be affected?",
          answer: "No, removing passwords only removes security restrictions and doesn't affect the document content or quality."
        },
        {
          question: "Can I remove passwords from multiple PDFs at once?",
          answer: "Yes, our batch processing feature allows you to upload and unlock multiple PDFs simultaneously, as long as they use the same password."
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
          answer: "Yes, our batch processing feature allows you to upload and unlock multiple files simultaneously, saving you time and effort."
        },
        {
          question: "What happens if my internet connection is interrupted?",
          answer: "If your connection is interrupted during upload, you can resume the upload when reconnected. Processed files are temporarily stored for 1 hour."
        }
      ]}
      relatedTools={[
        {
          name: "Protect PDF",
          path: "/protect-pdf",
          description: "Add password protection to PDFs"
        },
        {
          name: "Encrypt PDF",
          path: "/encrypt-pdf",
          description: "Add strong encryption to PDFs"
        },
        {
          name: "Digital Signature",
          path: "/digital-signature",
          description: "Add digital signatures for security"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
      securityFeatures={[
        "Passwords are never stored on our servers",
        "256-bit SSL encryption during processing",
        "Files automatically deleted after 1 hour",
        "Secure HTTPS transmission",
        "No access to your document content"
      ]}
    />
  )
}

export default PDFPasswordRemoverPage