import { Image } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const PNGToPDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PNG to PDF:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Layout
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="layout" value="single" className="text-primary-600" defaultChecked />
            <span>One image per page</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="layout" value="multiple" className="text-primary-600" />
            <span>Multiple images per page</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Size
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="auto">Auto-fit to image size</option>
          <option value="a4">A4</option>
          <option value="letter">Letter</option>
          <option value="legal">Legal</option>
          <option value="a3">A3</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image Quality
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="original">Original quality</option>
          <option value="high">High quality</option>
          <option value="medium">Medium quality</option>
          <option value="compressed">Compressed</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Margin Size
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="none">No margins</option>
          <option value="small">Small margins</option>
          <option value="medium">Medium margins</option>
          <option value="large">Large margins</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-transparency" className="text-primary-600" defaultChecked />
        <label htmlFor="preserve-transparency" className="text-sm text-gray-700">
          Preserve PNG transparency
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="auto-rotate" className="text-primary-600" defaultChecked />
        <label htmlFor="auto-rotate" className="text-sm text-gray-700">
          Auto-rotate images to fit page
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="PNG to PDF Converter"
      toolDescription="Convert PNG images to PDF documents. Preserve transparency and combine multiple PNG files into a single PDF."
      toolIcon={Image}
      acceptedFormats={['.png']}
      outputFormats={['pdf']}
      maxFileSize="50MB per image"
      processingTime="10-20 seconds"
      features={[
        "Preserve PNG transparency",
        "Combine multiple PNGs into one PDF",
        "Custom page sizes and layouts",
        "Quality control options",
        "Auto-rotation and fitting",
        "Batch image processing",
        "Custom margins and spacing",
        "Drag and drop reordering"
      ]}
      howToSteps={[
        {
          title: "Upload PNGs",
          description: "Select PNG image files to convert"
        },
        {
          title: "Arrange Order",
          description: "Drag and drop to reorder images"
        },
        {
          title: "Set Layout",
          description: "Choose page size and layout options"
        },
        {
          title: "Create PDF",
          description: "Download your PDF with all PNG images"
        }
      ]}
      faqs={[
        {
          question: "Will PNG transparency be preserved?",
          answer: "Yes, we can preserve PNG transparency in the PDF. Transparent areas will remain transparent in the final document."
        },
        {
          question: "Can I combine multiple PNG files?",
          answer: "Yes, you can upload multiple PNG images and they will be combined into a single PDF document with each image on its own page."
        },
        {
          question: "What's the difference between PNG and JPG conversion?",
          answer: "PNG conversion preserves transparency and is better for images with text or graphics, while JPG is better for photographs."
        },
        {
          question: "Can I change the order of images?",
          answer: "Yes, you can drag and drop images to reorder them before creating the PDF."
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
          answer: "Free users can convert images up to 50MB each. Premium users have higher limits and can process larger files without restrictions."
        }
      ]}
      relatedTools={[
        {
          name: "PDF to PNG",
          path: "/pdf-to-png",
          description: "Convert PDF pages back to PNG format"
        },
        {
          name: "JPG to PDF",
          path: "/jpg-to-pdf",
          description: "Convert JPG images to PDF"
        },
        {
          name: "Compress Images",
          path: "/compress-images",
          description: "Reduce image file sizes"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default PNGToPDFPage