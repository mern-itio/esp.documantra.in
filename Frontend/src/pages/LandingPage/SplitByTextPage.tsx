import { Type } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const SplitByTextPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF split by text:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Split Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="text" className="text-primary-600" defaultChecked />
            <span>Split when text is found</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="pattern" className="text-primary-600" />
            <span>Split by text pattern (regex)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="heading" className="text-primary-600" />
            <span>Split at headings</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Text to Search For
        </label>
        <input
          type="text"
          placeholder="e.g., Chapter, Section, Appendix"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Enter text that indicates where to split the document</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Case Sensitivity
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="case" value="sensitive" className="text-primary-600" />
            <span>Case sensitive</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="case" value="insensitive" className="text-primary-600" defaultChecked />
            <span>Case insensitive</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Split Behavior
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="behavior" value="before" className="text-primary-600" />
            <span>Split before matching text</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="behavior" value="after" className="text-primary-600" defaultChecked />
            <span>Split after matching text</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="behavior" value="on" className="text-primary-600" />
            <span>Split on matching text (exclude from output)</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="include-text" className="text-primary-600" defaultChecked />
        <label htmlFor="include-text" className="text-sm text-gray-700">
          Include matching text in filename
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="zip-output" className="text-primary-600" defaultChecked />
        <label htmlFor="zip-output" className="text-sm text-gray-700">
          Combine output in ZIP archive
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Split PDF by Text"
      toolDescription="Divide PDF documents at specific text occurrences. Perfect for splitting at chapters, sections, or custom text patterns."
      toolIcon={Type}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="200MB"
      processingTime="30-90 seconds"
      features={[
        "Split at text occurrences",
        "Regular expression support",
        "Heading detection",
        "Case sensitivity options",
        "Custom split behavior",
        "Intelligent naming",
        "OCR for scanned documents",
        "Batch processing support"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to split by text"
        },
        {
          title: "Enter Text",
          description: "Specify the text to search for as split points"
        },
        {
          title: "Set Options",
          description: "Configure case sensitivity and split behavior"
        },
        {
          title: "Download",
          description: "Get your split PDF files"
        }
      ]}
      faqs={[
        {
          question: "How does splitting by text work?",
          answer: "Our system searches for your specified text throughout the document and creates split points wherever that text is found, dividing the PDF into multiple files."
        },
        {
          question: "Can I split a scanned PDF by text?",
          answer: "Yes, we use OCR (Optical Character Recognition) to detect text in scanned documents, though accuracy depends on scan quality."
        },
        {
          question: "What's the difference between split behaviors?",
          answer: "Splitting before text puts the matching text at the start of the new file. Splitting after puts it at the end of the current file. Splitting on excludes the text entirely."
        },
        {
          question: "Can I use regular expressions for complex patterns?",
          answer: "Yes, our pattern mode supports regular expressions for advanced text matching, allowing you to split on complex patterns."
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
          answer: "Free users can convert files up to 200MB. Premium users have higher limits and can process larger files without restrictions."
        }
      ]}
      relatedTools={[
        {
          name: "Split PDF",
          path: "/split-pdf",
          description: "Split PDF by pages or intervals"
        },
        {
          name: "OCR PDF",
          path: "/ocr-pdf",
          description: "Make scanned PDFs searchable"
        },
        {
          name: "Extract Pages",
          path: "/extract-pages",
          description: "Extract specific pages from PDF"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default SplitByTextPage