import { Lock } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const ProtectPDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF protection:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Password Protection
        </label>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">User Password (for opening)</label>
            <input
              type="password"
              placeholder="Enter password to open PDF"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Owner Password (for editing)</label>
            <input
              type="password"
              placeholder="Enter password for editing permissions"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Permissions
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Allow printing</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Allow copying text and images</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Allow document modification</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Allow form filling</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Allow commenting and annotations</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Encryption Level
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="128">128-bit RC4 (Standard)</option>
          <option value="256" selected>256-bit AES (Recommended)</option>
        </select>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Protect PDF"
      toolDescription="Add password protection and set permissions for your PDF documents. Secure sensitive information with encryption."
      toolIcon={Lock}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="100MB"
      processingTime="10-20 seconds"
      features={[
        "Password protection for opening",
        "Owner password for editing permissions",
        "256-bit AES encryption",
        "Granular permission controls",
        "Prevent copying and printing",
        "Batch protection support",
        "Digital rights management",
        "Compliance with security standards"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to protect"
        },
        {
          title: "Set Passwords",
          description: "Create user and owner passwords"
        },
        {
          title: "Configure Permissions",
          description: "Set what users can and cannot do"
        },
        {
          title: "Apply Protection",
          description: "Download your secured PDF file"
        }
      ]}
      faqs={[
        {
          question: "What's the difference between user and owner passwords?",
          answer: "User password is required to open the PDF. Owner password allows changing permissions and security settings."
        },
        {
          question: "How secure is the encryption?",
          answer: "We use 256-bit AES encryption, which is the same standard used by banks and government agencies."
        },
        {
          question: "Can I remove password protection later?",
          answer: "Yes, you can use our 'Unlock PDF' tool to remove password protection if you have the owner password."
        },
        {
          question: "What permissions can I control?",
          answer: "You can control printing, copying, editing, form filling, and commenting permissions."
        },
        {
          question: "Will protection work on all PDF viewers?",
          answer: "Yes, PDF password protection is a standard feature supported by all major PDF viewers and browsers."
        }
      ]}
      relatedTools={[
        {
          name: "Unlock PDF",
          path: "/unlock-pdf",
          description: "Remove password protection from PDFs"
        },
        {
          name: "Digital Signature",
          path: "/digital-signature",
          description: "Add digital signatures for authenticity"
        },
        {
          name: "Watermark PDF",
          path: "/watermark-pdf",
          description: "Add watermarks for document protection"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
      securityFeatures={[
        "256-bit AES encryption during processing",
        "Passwords are never stored on our servers",
        "Files automatically deleted after 1 hour",
        "Secure HTTPS transmission",
        "No access to your protected content"
      ]}
    />
  )
}

export default ProtectPDFPage