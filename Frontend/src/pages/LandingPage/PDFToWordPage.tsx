import { FileText } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const PDFToWordPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    // Mock processing logic
    console.log('Processing PDF to Word:', files, settings)
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
          OCR Language (for scanned PDFs)
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option>English</option>
          <option>Spanish</option>
          <option>French</option>
          <option>German</option>
          <option>Auto-detect</option>
        </select>
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
      toolName="PDF to Word Converter"
      toolDescription="Convert PDF documents to editable Word files with high accuracy. Preserve formatting, images, and layout."
      toolIcon={FileText}
      acceptedFormats={['.pdf']}
      outputFormats={['docx', 'doc', 'rtf']}
      maxFileSize="2MB"
      processingTime="30-60 seconds"
      features={[
        "High-accuracy OCR for scanned PDFs",
        "Preserves original formatting and layout",
        "Maintains images, tables, and graphics",
        "Supports multiple output formats",
        "Batch conversion support",
        "Password-protected PDF support",
        "Multi-language OCR recognition",
        "Cloud storage integration"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select your PDF file or drag and drop it into the upload area"
        },
        {
          title: "Choose Settings",
          description: "Select conversion mode and OCR language if needed"
        },
        {
          title: "Convert",
          description: "Click convert and wait for the processing to complete"
        },
        {
          title: "Download",
          description: "Download your converted Word document"
        }
      ]}
      faqs={[
        {
          question: "How accurate is the PDF to Word conversion?",
          answer: "Our conversion accuracy is over 99% for text-based PDFs and 95% for scanned documents using advanced OCR technology."
        },
        {
          question: "Can I convert password-protected PDFs?",
          answer: "Yes, you can convert password-protected PDFs. You'll need to enter the password during the upload process."
        },
        {
          question: "What's the maximum file size I can convert?",
          answer: "Free users can convert files up to 2MB. Premium users have no file size limits."
        },
        {
          question: "Do you support batch conversion?",
          answer: "Yes, you can upload multiple PDF files and convert them all at once to save time."
        },
        {
          question: "Will the formatting be preserved?",
          answer: "Yes, our advanced conversion engine preserves fonts, colors, images, tables, and layout as much as possible."
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
          description: "Convert Word documents back to PDF format"
        },
        {
          name: "PDF to Excel",
          path: "/pdf-to-excel",
          description: "Extract tables and data to Excel spreadsheets"
        },
        {
          name: "OCR PDF",
          path: "/ocr-pdf",
          description: "Make scanned PDFs searchable and editable"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    >
      {/* Additional tool-specific content can go here */}
    </PDFToolLayout>
  )
}

export default PDFToWordPage