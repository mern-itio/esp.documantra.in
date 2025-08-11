import { Presentation } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const PDFToPowerPointPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF to PowerPoint:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Conversion Mode
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" value="slides" className="text-primary-600" defaultChecked />
            <span>Convert pages to slides</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" value="images" className="text-primary-600" />
            <span>Convert as images in slides</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" value="editable" className="text-primary-600" />
            <span>Editable text and objects</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Format
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="pptx">PowerPoint (.pptx)</option>
          <option value="ppt">PowerPoint 97-2003 (.ppt)</option>
          <option value="odp">OpenDocument (.odp)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Range (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g., 1-10, 15, 20-25"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-layout" className="text-primary-600" defaultChecked />
        <label htmlFor="preserve-layout" className="text-sm text-gray-700">
          Preserve original layout
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="extract-images" className="text-primary-600" defaultChecked />
        <label htmlFor="extract-images" className="text-sm text-gray-700">
          Extract and optimize images
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="PDF to PowerPoint Converter"
      toolDescription="Convert PDF documents to editable PowerPoint presentations. Perfect for creating slides from reports and documents."
      toolIcon={Presentation}
      acceptedFormats={['.pdf']}
      outputFormats={['pptx', 'ppt', 'odp']}
      maxFileSize="100MB"
      processingTime="45-90 seconds"
      features={[
        "Convert PDF pages to PowerPoint slides",
        "Preserve formatting and layout",
        "Extract images and graphics",
        "Editable text and objects",
        "Multiple output formats",
        "Batch conversion support",
        "Custom page range selection",
        "OCR for scanned documents"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to convert to PowerPoint"
        },
        {
          title: "Choose Mode",
          description: "Select conversion mode and output format"
        },
        {
          title: "Convert",
          description: "Our system converts each page to a slide"
        },
        {
          title: "Download",
          description: "Get your PowerPoint presentation ready for editing"
        }
      ]}
      faqs={[
        {
          question: "How accurate is the PDF to PowerPoint conversion?",
          answer: "Our conversion maintains 95%+ layout accuracy for most documents, preserving text, images, and formatting as much as possible."
        },
        {
          question: "Can I edit the converted PowerPoint slides?",
          answer: "Yes, the converted slides are fully editable. You can modify text, images, and formatting just like any PowerPoint presentation."
        },
        {
          question: "What happens to images in the PDF?",
          answer: "Images are extracted and embedded in the PowerPoint slides, maintaining their quality and positioning."
        },
        {
          question: "Can I convert specific pages only?",
          answer: "Yes, you can specify page ranges to convert only the pages you need into slides."
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
          answer: "Free users can convert files up to 100MB. Premium users have higher limits and can process larger files without restrictions."
        }
      ]}
      relatedTools={[
        {
          name: "PowerPoint to PDF",
          path: "/powerpoint-to-pdf",
          description: "Convert PowerPoint presentations back to PDF"
        },
        {
          name: "PDF to Word",
          path: "/pdf-to-word",
          description: "Convert PDF to editable Word documents"
        },
        {
          name: "PDF to Images",
          path: "/pdf-to-jpg",
          description: "Extract images from PDF files"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default PDFToPowerPointPage