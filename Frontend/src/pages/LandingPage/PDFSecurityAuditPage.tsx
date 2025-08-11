import { ShieldCheck } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const PDFSecurityAuditPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF security audit:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Security Checks
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Password protection status</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Encryption level</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Permission restrictions</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Digital signatures</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Metadata analysis</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Privacy Checks
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Personal information detection</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Hidden text detection</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Embedded file detection</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">JavaScript detection</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">External links analysis</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Compliance Checks
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">PDF/A compliance</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">PDF/X compliance</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">PDF/UA accessibility</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Section 508 compliance</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Report Format
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="report" value="summary" className="text-primary-600" defaultChecked />
            <span>Summary report</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="report" value="detailed" className="text-primary-600" />
            <span>Detailed report</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="report" value="technical" className="text-primary-600" />
            <span>Technical report</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="recommendations" className="text-primary-600" defaultChecked />
        <label htmlFor="recommendations" className="text-sm text-gray-700">
          Include security recommendations
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="risk-score" className="text-primary-600" defaultChecked />
        <label htmlFor="risk-score" className="text-sm text-gray-700">
          Calculate security risk score
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="PDF Security Audit"
      toolDescription="Analyze PDF documents for security vulnerabilities, privacy issues, and compliance. Get detailed reports on protection status and potential risks."
      toolIcon={ShieldCheck}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf', 'html']}
      maxFileSize="100MB"
      processingTime="30-60 seconds"
      features={[
        "Comprehensive security analysis",
        "Privacy risk detection",
        "Encryption level verification",
        "Permission restriction checks",
        "Digital signature validation",
        "Hidden content detection",
        "Compliance verification",
        "Security recommendations"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to audit"
        },
        {
          title: "Choose Checks",
          description: "Select which security checks to perform"
        },
        {
          title: "Analyze",
          description: "Our system performs a thorough security analysis"
        },
        {
          title: "View Report",
          description: "Get detailed security audit report"
        }
      ]}
      faqs={[
        {
          question: "What security issues can this tool detect?",
          answer: "Our audit can detect weak or missing password protection, outdated encryption, permission vulnerabilities, unsigned or invalid digital signatures, hidden text or metadata containing sensitive information, embedded malicious files, and more."
        },
        {
          question: "What personal information can be detected?",
          answer: "The tool can identify potentially sensitive information like email addresses, phone numbers, social security numbers, credit card numbers, addresses, and names that might be present in the document or metadata."
        },
        {
          question: "What is PDF/A compliance?",
          answer: "PDF/A is an ISO-standardized version of PDF designed for long-term archiving. Our tool checks if your document meets these standards, ensuring it will remain accessible and readable in the future."
        },
        {
          question: "Can this tool fix security issues it finds?",
          answer: "The audit tool itself only identifies issues. However, the report includes recommendations and links to our other tools that can address specific security concerns, such as encryption, metadata removal, or redaction."
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
          answer: "Yes, our batch processing feature allows you to upload and audit multiple files simultaneously, saving you time and effort."
        },
        {
          question: "What happens if my internet connection is interrupted?",
          answer: "If your connection is interrupted during upload, you can resume the upload when reconnected. Processed files are temporarily stored for 1 hour."
        },
        {
          question: "What's the maximum file size I can audit?",
          answer: "Free users can audit files up to 100MB. Premium users have higher limits and can process larger files without restrictions."
        }
      ]}
      relatedTools={[
        {
          name: "Protect PDF",
          path: "/protect-pdf",
          description: "Add password protection to PDFs"
        },
        {
          name: "Remove Metadata",
          path: "/remove-metadata",
          description: "Remove hidden document metadata"
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
        "Audit results are never stored on our servers",
        "256-bit SSL encryption during processing",
        "Files automatically deleted after 1 hour",
        "Secure HTTPS transmission",
        "No access to your document content"
      ]}
    />
  )
}

export default PDFSecurityAuditPage