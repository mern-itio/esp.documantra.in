import { FileText } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const ConvertToWordPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF to Word conversion:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Conversion Mode
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" value="accurate" className="text-primary-600" defaultChecked />
            <span>Accurate (Preserves formatting)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" value="editable" className="text-primary-600" />
            <span>Editable (Optimized for editing)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" value="simple" className="text-primary-600" />
            <span>Simple (Plain text)</span>
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
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          OCR Language (for scanned PDFs)
        </label>
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
        </select>
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

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-images" className="text-primary-600" defaultChecked />
        <label htmlFor="preserve-images" className="text-sm text-gray-700">
          Preserve images and graphics
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-layout" className="text-primary-600" defaultChecked />
        <label htmlFor="preserve-layout" className="text-sm text-gray-700">
          Maintain original layout
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Convert PDF to Word"
      toolDescription="Transform PDF documents into editable Word files with high accuracy. Preserve formatting, images, and layout for seamless editing."
      toolIcon={FileText}
      acceptedFormats={['.pdf']}
      outputFormats={['docx', 'doc', 'rtf']}
      maxFileSize="100MB"
      processingTime="30-60 seconds"
      features={[
        "High-accuracy conversion",
        "OCR for scanned documents",
        "Preserves original formatting",
        "Maintains images and tables",
        "Multiple output formats",
        "Batch conversion support",
        "Custom page range selection",
        "Fast processing speed"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to convert to Word"
        },
        {
          title: "Choose Settings",
          description: "Select conversion mode and output format"
        },
        {
          title: "Convert",
          description: "Our system transforms PDF to Word format"
        },
        {
          title: "Download",
          description: "Get your editable Word document"
        }
      ]}
      faqs={[
        {
          question: "How accurate is the PDF to Word conversion?",
          answer: "Our conversion accuracy is over 99% for text-based PDFs and 95% for scanned documents using advanced OCR technology."
        },
        {
          question: "Will formatting be preserved?",
          answer: "Yes, our advanced conversion engine preserves fonts, colors, images, tables, and layout as much as possible, especially in Accurate mode."
        },
        {
          question: "Can I convert scanned PDFs?",
          answer: "Yes, we use OCR (Optical Character Recognition) to convert scanned documents into editable text. The accuracy depends on the scan quality."
        },
        {
          question: "What's the difference between conversion modes?",
          answer: "Accurate mode preserves formatting and layout precisely. Editable mode optimizes for easy editing. Simple mode extracts text only with minimal formatting."
        },
        {
          question: "Can I convert password-protected PDFs?",
          answer: "Yes, you can convert password-protected PDFs. You'll need to enter the password during the upload process."
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
          name: "Word to PDF",
          path: "/word-to-pdf",
          description: "Convert Word documents back to PDF"
        },
        {
          name: "PDF to Excel",
          path: "/pdf-to-excel",
          description: "Extract tables and data to Excel"
        },
        {
          name: "OCR PDF",
          path: "/ocr-pdf",
          description: "Make scanned PDFs searchable"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default ConvertToWordPage