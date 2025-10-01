import { FileText } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const ConvertFromPDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF conversion:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Format
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="format" value="docx" className="text-primary-600" defaultChecked />
            <span>Word (.docx)</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="format" value="xlsx" className="text-primary-600" />
            <span>Excel (.xlsx)</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="format" value="pptx" className="text-primary-600" />
            <span>PowerPoint (.pptx)</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="format" value="jpg" className="text-primary-600" />
            <span>Images (.jpg)</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="format" value="txt" className="text-primary-600" />
            <span>Text (.txt)</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="format" value="html" className="text-primary-600" />
            <span>HTML (.html)</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Conversion Quality
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="quality" value="high" className="text-primary-600" defaultChecked />
            <span>High Quality (Best formatting)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="quality" value="balanced" className="text-primary-600" />
            <span>Balanced (Good formatting, smaller size)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="quality" value="basic" className="text-primary-600" />
            <span>Basic (Content only, minimal formatting)</span>
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

      <div className="flex items-center gap-2">
        <input type="checkbox" id="ocr" className="text-primary-600" defaultChecked />
        <label htmlFor="ocr" className="text-sm text-gray-700">
          Use OCR for scanned documents
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="extract-images" className="text-primary-600" defaultChecked />
        <label htmlFor="extract-images" className="text-sm text-gray-700">
          Extract and include images
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Convert from PDF"
      toolDescription="Convert PDF documents to other formats including Word, Excel, PowerPoint, images, text, and HTML. Preserve formatting and content."
      toolIcon={FileText}
      acceptedFormats={['.pdf']}
      outputFormats={['docx', 'xlsx', 'pptx', 'jpg', 'txt', 'html']}
      maxFileSize="2MB"
      processingTime="30-90 seconds"
      features={[
        "Multiple output formats",
        "High-quality conversion",
        "OCR for scanned documents",
        "Image extraction",
        "Formatting preservation",
        "Batch conversion support",
        "Custom page range selection",
        "Fast processing speed"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to convert"
        },
        {
          title: "Choose Format",
          description: "Select the desired output format"
        },
        {
          title: "Set Options",
          description: "Configure quality and page settings"
        },
        {
          title: "Download",
          description: "Get your converted file"
        }
      ]}
      faqs={[
        {
          question: "How accurate is the conversion?",
          answer: "Conversion accuracy depends on the original PDF and chosen format. Native PDFs convert with high accuracy, while scanned documents may vary based on quality and OCR processing."
        },
        {
          question: "Will formatting be preserved?",
          answer: "We strive to preserve formatting, but complex layouts may not convert perfectly to all formats. Word and HTML typically maintain better formatting than plain text."
        },
        {
          question: "Can I convert password-protected PDFs?",
          answer: "Yes, you can convert password-protected PDFs by providing the password during upload."
        },
        {
          question: "What's the difference between quality settings?",
          answer: "High quality preserves maximum formatting and elements but may create larger files. Basic focuses on content extraction with minimal formatting for smaller files."
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
          answer: "Free users can convert files up to 2MB. Premium users have higher limits and can process larger files without restrictions."
        }
      ]}
      relatedTools={[
        {
          name: "PDF to Word",
          path: "/pdf-to-word",
          description: "Convert PDF to editable Word documents"
        },
        {
          name: "PDF to Excel",
          path: "/pdf-to-excel",
          description: "Extract tables to Excel spreadsheets"
        },
        {
          name: "PDF to JPG",
          path: "/pdf-to-jpg",
          description: "Convert PDF pages to images"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default ConvertFromPDFPage