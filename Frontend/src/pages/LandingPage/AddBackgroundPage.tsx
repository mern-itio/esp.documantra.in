import { Image } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const AddBackgroundPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing background addition:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Background Type
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="color" className="text-primary-600" defaultChecked />
            <span>Solid color</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="image" className="text-primary-600" />
            <span>Image background</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="gradient" className="text-primary-600" />
            <span>Gradient color</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Background Color
        </label>
        <div className="grid grid-cols-3 gap-3">
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="color" value="white" className="text-primary-600" defaultChecked />
            <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
            <span>White</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="color" value="light-gray" className="text-primary-600" />
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <span>Light Gray</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="color" value="blue" className="text-primary-600" />
            <div className="w-4 h-4 bg-blue-100 rounded"></div>
            <span>Light Blue</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="color" value="yellow" className="text-primary-600" />
            <div className="w-4 h-4 bg-yellow-100 rounded"></div>
            <span>Light Yellow</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="color" value="green" className="text-primary-600" />
            <div className="w-4 h-4 bg-green-100 rounded"></div>
            <span>Light Green</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="color" value="custom" className="text-primary-600" />
            <span>Custom</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image Background (if selected)
        </label>
        <input
          type="file"
          accept="image/*"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Opacity
        </label>
        <input
          type="range"
          min="10"
          max="100"
          defaultValue="100"
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Transparent</span>
          <span>Opaque</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Apply To
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="apply" value="all" className="text-primary-600" defaultChecked />
            <span>All pages</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="apply" value="range" className="text-primary-600" />
            <span>Page range</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="apply" value="even" className="text-primary-600" />
            <span>Even pages only</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="apply" value="odd" className="text-primary-600" />
            <span>Odd pages only</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Range (if selected)
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
      toolName="Add Background to PDF"
      toolDescription="Add color or image backgrounds to PDF documents. Enhance visual appeal and readability with custom backgrounds."
      toolIcon={Image}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="2MB"
      processingTime="20-40 seconds"
      features={[
        "Solid color backgrounds",
        "Image backgrounds",
        "Gradient backgrounds",
        "Adjustable opacity",
        "Page-specific application",
        "Batch processing support",
        "Professional design options",
        "High-quality output"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to add a background to"
        },
        {
          title: "Choose Type",
          description: "Select background type and color/image"
        },
        {
          title: "Set Options",
          description: "Adjust opacity and page application"
        },
        {
          title: "Download",
          description: "Get your PDF with background added"
        }
      ]}
      faqs={[
        {
          question: "Will the background affect text readability?",
          answer: "We apply backgrounds behind the content, so text remains readable. You can also adjust opacity to ensure optimal readability."
        },
        {
          question: "What image formats can I use for backgrounds?",
          answer: "You can upload JPG, PNG, and GIF images for backgrounds. For best results, use high-resolution images that match your document dimensions."
        },
        {
          question: "Can I add different backgrounds to different pages?",
          answer: "Currently, you can apply one background to all pages or a specific range. For different backgrounds per page, process the document multiple times with different page ranges."
        },
        {
          question: "Will the background print with the document?",
          answer: "Yes, backgrounds become part of the PDF content and will print with the document unless your printer settings specify otherwise."
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
          answer: "Yes, our batch processing feature allows you to upload and add backgrounds to multiple files simultaneously, saving you time and effort."
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
          name: "Add Watermark",
          path: "/watermark-pdf",
          description: "Add watermarks to PDF documents"
        },
        {
          name: "Add Header Footer",
          path: "/header-footer",
          description: "Add headers and footers to PDFs"
        },
        {
          name: "Edit PDF",
          path: "/edit-pdf",
          description: "Edit PDF content and formatting"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default AddBackgroundPage