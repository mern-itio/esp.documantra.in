import { FileText } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const PDFToWordAdvancedPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing advanced PDF to Word conversion:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Conversion Engine
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="engine" value="standard" className="text-primary-600" />
            <span>Standard Engine</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="engine" value="enhanced" className="text-primary-600" defaultChecked />
            <span>Enhanced Engine (Recommended)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="engine" value="premium" className="text-primary-600" />
            <span>Premium Engine (Best Quality)</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Format
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="format" value="docx" className="text-primary-600" defaultChecked />
            <span>Word Document (.docx)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="format" value="doc" className="text-primary-600" />
            <span>Word 97-2003 (.doc)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="format" value="rtf" className="text-primary-600" />
            <span>Rich Text Format (.rtf)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="format" value="odt" className="text-primary-600" />
            <span>OpenDocument Text (.odt)</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Layout Preservation
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="layout" value="exact" className="text-primary-600" defaultChecked />
            <span>Exact Layout (Preserve positioning)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="layout" value="flowing" className="text-primary-600" />
            <span>Flowing Text (Better for editing)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="layout" value="balanced" className="text-primary-600" />
            <span>Balanced (Compromise between both)</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          OCR Settings (for scanned documents)
        </label>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">OCR Language</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option value="auto">Auto-detect language</option>
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
              <option value="ru">Russian</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">OCR Quality</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option value="fast">Fast (Good for clean scans)</option>
              <option value="balanced" selected>Balanced (Recommended)</option>
              <option value="accurate">Accurate (Best for poor quality scans)</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Element Handling
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Convert tables to Word tables</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Extract and include images</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Preserve hyperlinks</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Convert footnotes/endnotes</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Preserve headers and footers</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Range (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g., 1-5, 10, 15-20"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="PDF to Word Advanced"
      toolDescription="Convert PDF documents to editable Word files with enhanced accuracy and formatting options. Perfect for complex documents and professional needs."
      toolIcon={FileText}
      acceptedFormats={['.pdf']}
      outputFormats={['docx', 'doc', 'rtf', 'odt']}
      maxFileSize="200MB"
      processingTime="45-120 seconds"
      features={[
        "Multiple conversion engines",
        "Enhanced layout preservation",
        "Advanced OCR capabilities",
        "Table structure recognition",
        "Footnote and endnote conversion",
        "Header and footer preservation",
        "Multiple output formats",
        "Batch conversion support"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to convert to Word"
        },
        {
          title: "Choose Engine",
          description: "Select conversion engine and output format"
        },
        {
          title: "Configure Options",
          description: "Set layout preservation and element handling options"
        },
        {
          title: "Download",
          description: "Get your professionally converted Word document"
        }
      ]}
      faqs={[
        {
          question: "What's the difference between conversion engines?",
          answer: "Standard engine provides basic conversion for simple documents. Enhanced engine offers better formatting preservation for most documents. Premium engine delivers the highest accuracy for complex layouts and formatting."
        },
        {
          question: "How does layout preservation work?",
          answer: "Exact layout maintains the precise positioning of elements but may be harder to edit. Flowing text optimizes for editability but may alter positioning. Balanced mode tries to maintain layout while ensuring good editability."
        },
        {
          question: "Can I convert scanned PDFs to editable Word?",
          answer: "Yes, our advanced OCR technology can recognize text in scanned documents and convert them to fully editable Word files. The quality depends on the scan clarity and OCR settings."
        },
        {
          question: "How well are tables preserved?",
          answer: "Our enhanced engine can detect and convert tables to native Word tables, preserving structure, borders, and cell content. Complex tables with merged cells and nested tables are handled by the premium engine."
        },
        {
          question: "What about footnotes and endnotes?",
          answer: "Our advanced conversion can detect footnotes and endnotes in academic and professional documents and convert them to proper Word footnotes/endnotes rather than treating them as regular text."
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
        }
      ]}
      relatedTools={[
        {
          name: "PDF to Word",
          path: "/pdf-to-word",
          description: "Standard PDF to Word conversion"
        },
        {
          name: "OCR PDF",
          path: "/ocr-pdf",
          description: "Make scanned PDFs searchable"
        },
        {
          name: "Word to PDF",
          path: "/word-to-pdf",
          description: "Convert Word documents back to PDF"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default PDFToWordAdvancedPage