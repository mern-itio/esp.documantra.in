import { PenTool, Shield } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const AddSignaturePage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing signature addition:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Signature Type
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="draw" className="text-primary-600" defaultChecked />
            <span>Draw signature</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="type" className="text-primary-600" />
            <span>Type signature</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="image" className="text-primary-600" />
            <span>Upload signature image</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Signature Position
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="position" value="auto" className="text-primary-600" defaultChecked />
            <span>Auto-detect signature fields</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="position" value="manual" className="text-primary-600" />
            <span>Manual positioning</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Signature Information
        </label>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Your name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Reason for signing (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Location (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Signature Appearance
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="standard">Standard (name and date)</option>
          <option value="detailed">Detailed (name, date, reason)</option>
          <option value="minimal">Minimal (signature only)</option>
          <option value="custom">Custom appearance</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="timestamp" className="text-primary-600" defaultChecked />
        <label htmlFor="timestamp" className="text-sm text-gray-700">
          Add timestamp to signature
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="save-signature" className="text-primary-600" />
        <label htmlFor="save-signature" className="text-sm text-gray-700">
          Save signature for future use
        </label>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">Legal Validity</h4>
            <p className="text-sm text-blue-700 mt-1">
              Electronic signatures created with this tool are legally binding in most jurisdictions under laws like ESIGN Act (US), eIDAS (EU), and similar regulations worldwide.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Add Signature to PDF"
      toolDescription="Sign PDF documents electronically with handwritten, typed, or uploaded signatures. Add legally binding electronic signatures to your documents."
      toolIcon={PenTool}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="100MB"
      processingTime="10-20 seconds"
      features={[
        "Draw, type, or upload signatures",
        "Auto-detect signature fields",
        "Add timestamp verification",
        "Multiple signature styles",
        "Batch signing support",
        "Save signatures for reuse",
        "Legal compliance features",
        "Professional appearance options"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF document you want to sign"
        },
        {
          title: "Create Signature",
          description: "Draw, type, or upload your signature"
        },
        {
          title: "Position Signature",
          description: "Place your signature in the document"
        },
        {
          title: "Download",
          description: "Get your signed PDF document"
        }
      ]}
      faqs={[
        {
          question: "Are signatures created with this tool legally binding?",
          answer: "Yes, electronic signatures created with our tool are legally binding in most jurisdictions under laws like the ESIGN Act (US), eIDAS (EU), and similar regulations worldwide."
        },
        {
          question: "What's the difference between electronic and digital signatures?",
          answer: "Electronic signatures are any electronic marks indicating intent to sign. Digital signatures are cryptographically secured signatures that provide additional verification and security."
        },
        {
          question: "Can I sign multiple documents at once?",
          answer: "Yes, our batch processing feature allows you to apply the same signature to multiple documents simultaneously."
        },
        {
          question: "Will the signature be visible on the document?",
          answer: "Yes, your signature will be visible on the document. You can customize its appearance and position."
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
          answer: "No account is required for basic usage. However, creating a free account gives you access to additional features like signature storage and batch processing."
        },
        {
          question: "Can I process multiple files at once?",
          answer: "Yes, our batch processing feature allows you to upload and sign multiple files simultaneously, saving you time and effort."
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
          name: "Digital Signature",
          path: "/digital-signature",
          description: "Add cryptographic digital signatures"
        },
        {
          name: "Fill PDF Forms",
          path: "/fill-pdf-forms",
          description: "Fill out forms before signing"
        },
        {
          name: "Protect PDF",
          path: "/protect-pdf",
          description: "Add password protection after signing"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
      securityFeatures={[
        "Signatures are never stored on our servers",
        "256-bit SSL encryption during processing",
        "Files automatically deleted after 1 hour",
        "Secure HTTPS transmission",
        "Compliant with e-signature regulations"
      ]}
    />
  )
}

export default AddSignaturePage