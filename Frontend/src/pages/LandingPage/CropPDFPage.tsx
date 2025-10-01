import { Crop } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const CropPDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF crop:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Crop Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="auto" className="text-primary-600" defaultChecked />
            <span>Auto-detect content area</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="manual" className="text-primary-600" />
            <span>Manual crop area selection</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="margins" className="text-primary-600" />
            <span>Remove margins</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Margin Size (if removing margins)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600">Top/Bottom (inches)</label>
            <input
              type="number"
              step="0.1"
              defaultValue="1.0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Left/Right (inches)</label>
            <input
              type="number"
              step="0.1"
              defaultValue="1.0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Apply to Pages
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="pages" value="all" className="text-primary-600" defaultChecked />
            <span>All pages</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="pages" value="first" className="text-primary-600" />
            <span>First page only</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="pages" value="custom" className="text-primary-600" />
            <span>Custom page range</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Range (if custom selected)
        </label>
        <input
          type="text"
          placeholder="e.g., 1-5, 10, 15-20"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-aspect" className="text-primary-600" defaultChecked />
        <label htmlFor="preserve-aspect" className="text-sm text-gray-700">
          Preserve aspect ratio
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Crop PDF"
      toolDescription="Crop PDF pages to remove unwanted margins and focus on content. Auto-detect content areas or manually set crop regions."
      toolIcon={Crop}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="2MB"
      processingTime="15-30 seconds"
      features={[
        "Auto-detect content areas",
        "Manual crop area selection",
        "Remove margins automatically",
        "Custom page range cropping",
        "Preserve aspect ratio",
        "Batch cropping support",
        "Preview before cropping",
        "Maintain original quality"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to crop"
        },
        {
          title: "Choose Method",
          description: "Select auto-detect, manual, or margin removal"
        },
        {
          title: "Set Parameters",
          description: "Configure crop settings and page range"
        },
        {
          title: "Download",
          description: "Get your cropped PDF file"
        }
      ]}
      faqs={[
        {
          question: "What's the difference between auto-detect and manual cropping?",
          answer: "Auto-detect automatically finds the content area and removes white space. Manual cropping lets you specify exact crop dimensions."
        },
        {
          question: "Can I crop different areas on different pages?",
          answer: "Currently, the same crop settings are applied to all selected pages. For different crop areas per page, process them separately."
        },
        {
          question: "Will cropping affect the PDF file size?",
          answer: "Yes, cropping typically reduces file size by removing unnecessary white space and content outside the crop area."
        },
        {
          question: "Can I preview the crop area before applying?",
          answer: "Yes, our preview feature shows you how the pages will look after cropping before you download the final file."
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
          name: "Resize PDF",
          path: "/resize-pdf",
          description: "Resize PDF pages to different dimensions"
        },
        {
          name: "Rotate PDF",
          path: "/rotate-pdf",
          description: "Rotate PDF pages to correct orientation"
        },
        {
          name: "Organize PDF",
          path: "/organize-pdf",
          description: "Reorder and organize PDF pages"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default CropPDFPage