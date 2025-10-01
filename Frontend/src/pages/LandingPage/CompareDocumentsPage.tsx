import { FileText  } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const CompareDocumentsPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing document comparison:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comparison Type
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="text" className="text-primary-600" defaultChecked />
            <span>Text comparison</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="visual" className="text-primary-600" />
            <span>Visual comparison</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="both" className="text-primary-600" />
            <span>Both text and visual</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Highlight Options
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Highlight insertions</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Highlight deletions</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Highlight formatting changes</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Highlight image changes</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sensitivity Level
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="high">High (detect minor changes)</option>
          <option value="medium" selected>Medium (recommended)</option>
          <option value="low">Low (ignore minor changes)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Format
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="output" value="pdf" className="text-primary-600" defaultChecked />
            <span>PDF with highlights</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="output" value="html" className="text-primary-600" />
            <span>HTML comparison report</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="output" value="both" className="text-primary-600" />
            <span>Both PDF and HTML</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="summary" className="text-primary-600" defaultChecked />
        <label htmlFor="summary" className="text-sm text-gray-700">
          Include summary of changes
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="ignore-spaces" className="text-primary-600" />
        <label htmlFor="ignore-spaces" className="text-sm text-gray-700">
          Ignore whitespace changes
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Compare Documents"
      toolDescription="Compare two versions of a document and highlight differences. Identify text changes, formatting differences, and content modifications."
      toolIcon={FileText}
      acceptedFormats={['.pdf', '.docx', '.doc']}
      outputFormats={['pdf', 'html']}
      maxFileSize="2MB"
      processingTime="30-90 seconds"
      features={[
        "Text and visual comparison",
        "Change highlighting",
        "Detailed comparison report",
        "Multiple sensitivity levels",
        "Format change detection",
        "Summary of changes",
        "Side-by-side view option",
        "Multiple output formats"
      ]}
      howToSteps={[
        {
          title: "Upload Documents",
          description: "Select two documents to compare"
        },
        {
          title: "Choose Options",
          description: "Select comparison type and highlight settings"
        },
        {
          title: "Compare",
          description: "Our system analyzes and identifies differences"
        },
        {
          title: "View Results",
          description: "Get your comparison report with highlighted changes"
        }
      ]}
      faqs={[
        {
          question: "What document formats can I compare?",
          answer: "You can compare PDF documents, as well as Word documents (.docx, .doc). When comparing different formats, we convert them to a common format first."
        },
        {
          question: "How accurate is the comparison?",
          answer: "Our comparison engine is highly accurate for text content. Visual comparison may have some limitations with complex layouts or heavily formatted documents."
        },
        {
          question: "Can I compare documents with images?",
          answer: "Yes, our visual comparison can detect changes in images, though the level of detail depends on the sensitivity setting you choose."
        },
        {
          question: "What types of changes are detected?",
          answer: "We detect text additions, deletions, modifications, formatting changes, and depending on settings, image changes and layout differences."
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
          answer: "Yes, our batch processing feature allows you to upload and compare multiple file pairs simultaneously, saving you time and effort."
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
          name: "PDF to Word",
          path: "/pdf-to-word",
          description: "Convert PDF to editable Word format"
        },
        {
          name: "Merge PDF",
          path: "/merge-pdf",
          description: "Combine multiple PDFs"
        },
        {
          name: "Track Changes",
          path: "/track-changes",
          description: "View document revision history"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default CompareDocumentsPage