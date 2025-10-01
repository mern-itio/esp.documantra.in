import { EyeOff, Shield } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const RedactPDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF redaction:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Redaction Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="text" className="text-primary-600" defaultChecked />
            <span>Text search and redact</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="pattern" className="text-primary-600" />
            <span>Pattern matching (emails, phone numbers, etc.)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="manual" className="text-primary-600" />
            <span>Manual area selection</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Text to Redact
        </label>
        <textarea
          rows={3}
          placeholder="Enter words or phrases to redact, one per line"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pattern Matching
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Email addresses</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Phone numbers</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Social Security Numbers</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Credit card numbers</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Dates</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Redaction Appearance
        </label>
        <div className="grid grid-cols-2 gap-3">
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option value="black">Black boxes</option>
            <option value="white">White boxes</option>
            <option value="custom">Custom color</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option value="none">No text</option>
            <option value="redacted">REDACTED</option>
            <option value="custom">Custom text</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="remove-metadata" className="text-primary-600" defaultChecked />
        <label htmlFor="remove-metadata" className="text-sm text-gray-700">
          Remove document metadata
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preview" className="text-primary-600" defaultChecked />
        <label htmlFor="preview" className="text-sm text-gray-700">
          Preview redactions before applying
        </label>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-800">Important Security Notice</h4>
            <p className="text-sm text-red-700 mt-1">
              Redaction permanently removes information from the document. This process cannot be undone. Always keep a backup of your original document.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Redact PDF"
      toolDescription="Permanently remove sensitive information from PDF documents. Securely redact text, patterns, and areas for privacy and compliance."
      toolIcon={EyeOff}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="2MB"
      processingTime="30-60 seconds"
      features={[
        "Text search and redaction",
        "Pattern matching (emails, SSNs, etc.)",
        "Manual area redaction",
        "Permanent information removal",
        "Metadata cleaning",
        "Batch redaction support",
        "Redaction appearance options",
        "Preview before applying"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file containing sensitive information"
        },
        {
          title: "Choose Method",
          description: "Select text search, pattern matching, or manual selection"
        },
        {
          title: "Set Parameters",
          description: "Specify what to redact and appearance options"
        },
        {
          title: "Download",
          description: "Get your securely redacted PDF document"
        }
      ]}
      faqs={[
        {
          question: "What is PDF redaction?",
          answer: "Redaction is the process of permanently removing sensitive information from documents. Unlike simple black boxes that cover text, true redaction completely removes the underlying data."
        },
        {
          question: "Is redacted information recoverable?",
          answer: "No, properly redacted information is permanently removed from the document and cannot be recovered by any means."
        },
        {
          question: "How does pattern matching work?",
          answer: "Our system uses advanced algorithms to identify common patterns like email addresses, phone numbers, and social security numbers, then redacts all matching instances."
        },
        {
          question: "Can I redact images or graphics?",
          answer: "Yes, you can use the manual area selection method to redact portions of images or graphics in your PDF."
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
          answer: "Yes, our batch processing feature allows you to upload and redact multiple files simultaneously, saving you time and effort."
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
          description: "Remove hidden document metadata"
        },
        {
          name: "Protect PDF",
          path: "/protect-pdf",
          description: "Add password protection to PDFs"
        },
        {
          name: "Sanitize PDF",
          path: "/sanitize-pdf",
          description: "Remove all sensitive content"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
      securityFeatures={[
        "Permanent information removal",
        "256-bit SSL encryption during processing",
        "Files automatically deleted after 1 hour",
        "Secure HTTPS transmission",
        "Complete metadata cleaning"
      ]}
    />
  )
}

export default RedactPDFPage