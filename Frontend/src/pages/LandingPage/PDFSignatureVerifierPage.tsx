import { CheckCircle, Shield } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const PDFSignatureVerifierPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing signature verification:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Verification Type
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="all" className="text-primary-600" defaultChecked />
            <span>Verify all signatures</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="digital" className="text-primary-600" />
            <span>Verify digital signatures only</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="electronic" className="text-primary-600" />
            <span>Verify electronic signatures only</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Verification Checks
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Signature validity</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Certificate trust</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Document integrity</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Timestamp verification</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Revocation status</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Trust Settings
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="trust" value="standard" className="text-primary-600" defaultChecked />
            <span>Standard trust (common CAs)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="trust" value="strict" className="text-primary-600" />
            <span>Strict trust (enhanced verification)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="trust" value="custom" className="text-primary-600" />
            <span>Custom trust settings</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Report Format
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="report" value="summary" className="text-primary-600" />
            <span>Summary report</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="report" value="detailed" className="text-primary-600" defaultChecked />
            <span>Detailed report</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="report" value="technical" className="text-primary-600" />
            <span>Technical report</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="visual-indicators" className="text-primary-600" defaultChecked />
        <label htmlFor="visual-indicators" className="text-sm text-gray-700">
          Add visual verification indicators to document
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="certificate-details" className="text-primary-600" defaultChecked />
        <label htmlFor="certificate-details" className="text-sm text-gray-700">
          Include certificate details in report
        </label>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">Signature Verification</h4>
            <p className="text-sm text-blue-700 mt-1">
              This tool verifies the authenticity and integrity of signatures in your PDF document. It checks if signatures are valid, if the document has been modified since signing, and if the signing certificates are trusted.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="PDF Signature Verifier"
      toolDescription="Verify the authenticity and integrity of digital signatures in PDF documents. Ensure documents haven't been tampered with since signing."
      toolIcon={CheckCircle}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf', 'html']}
      maxFileSize="100MB"
      processingTime="15-30 seconds"
      features={[
        "Digital signature verification",
        "Certificate validation",
        "Document integrity checking",
        "Timestamp verification",
        "Revocation status checking",
        "Multiple trust levels",
        "Detailed verification reports",
        "Visual verification indicators"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the signed PDF document to verify"
        },
        {
          title: "Choose Options",
          description: "Select verification type and trust settings"
        },
        {
          title: "Verify",
          description: "Our system checks signature validity and integrity"
        },
        {
          title: "View Report",
          description: "Get detailed verification results"
        }
      ]}
      faqs={[
        {
          question: "What's the difference between digital and electronic signatures?",
          answer: "Digital signatures use cryptographic technology with certificate-based identification and are more secure. Electronic signatures are simpler representations of intent to sign, like a scanned signature image."
        },
        {
          question: "What does signature verification check?",
          answer: "Verification checks if the signature is mathematically valid, if the signing certificate is trusted, if the document has been modified since signing, and if the certificate was valid at signing time."
        },
        {
          question: "What does 'document integrity' mean?",
          answer: "Document integrity verification ensures the document hasn't been altered since it was signed. Any changes to the document content after signing will be detected and flagged."
        },
        {
          question: "What are trust settings?",
          answer: "Trust settings determine which certificate authorities (CAs) are considered trusted. Standard trust includes common commercial CAs, while strict trust adds additional verification requirements."
        },
        {
          question: "What is certificate revocation checking?",
          answer: "This verifies that the certificate used to sign the document hasn't been revoked by the issuing authority, which might happen if the certificate was compromised."
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
          answer: "Yes, our batch processing feature allows you to upload and verify multiple files simultaneously, saving you time and effort."
        },
        {
          question: "What happens if my internet connection is interrupted?",
          answer: "If your connection is interrupted during upload, you can resume the upload when reconnected. Processed files are temporarily stored for 1 hour."
        }
      ]}
      relatedTools={[
        {
          name: "Digital Signature",
          path: "/digital-signature",
          description: "Add digital signatures to PDFs"
        },
        {
          name: "Add Signature",
          path: "/add-signature",
          description: "Add electronic signatures to PDFs"
        },
        {
          name: "PDF Security Audit",
          path: "/pdf-security-audit",
          description: "Comprehensive security analysis"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
      securityFeatures={[
        "Verification results are never stored on our servers",
        "256-bit SSL encryption during processing",
        "Files automatically deleted after 1 hour",
        "Secure HTTPS transmission",
        "No access to your document content"
      ]}
    />
  )
}

export default PDFSignatureVerifierPage