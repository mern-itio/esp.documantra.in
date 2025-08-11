import { RotateCw } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const RotatePagesPDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF page rotation:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rotation Direction
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="direction" value="clockwise" className="text-primary-600" defaultChecked />
            <span>90° Clockwise</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="direction" value="counterclockwise" className="text-primary-600" />
            <span>90° Counter-clockwise</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="direction" value="180" className="text-primary-600" />
            <span>180° Flip</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="direction" value="custom" className="text-primary-600" />
            <span>Custom Angle</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom Angle (degrees)
        </label>
        <input
          type="number"
          min="-360"
          max="360"
          step="1"
          placeholder="Enter angle (e.g., 45, -30)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
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
            <input type="radio" name="pages" value="odd" className="text-primary-600" />
            <span>Odd pages only</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="pages" value="even" className="text-primary-600" />
            <span>Even pages only</span>
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
        <input type="checkbox" id="auto-orientation" className="text-primary-600" />
        <label htmlFor="auto-orientation" className="text-sm text-gray-700">
          Auto-detect orientation and correct
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-dimensions" className="text-primary-600" defaultChecked />
        <label htmlFor="preserve-dimensions" className="text-sm text-gray-700">
          Preserve page dimensions
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Rotate PDF Pages"
      toolDescription="Rotate pages in PDF documents to the correct orientation. Fix upside-down or sideways pages with precision rotation controls."
      toolIcon={RotateCw}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="100MB"
      processingTime="10-20 seconds"
      features={[
        "Rotate pages 90°, 180°, or custom angles",
        "Apply rotation to specific pages",
        "Auto-detect page orientation",
        "Batch rotation for multiple files",
        "Preview before applying changes",
        "Preserve original quality",
        "Maintain document structure",
        "Fast processing speed"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file with pages that need rotation"
        },
        {
          title: "Choose Rotation",
          description: "Select rotation direction and angle"
        },
        {
          title: "Select Pages",
          description: "Choose which pages to rotate"
        },
        {
          title: "Apply & Download",
          description: "Process and download your rotated PDF"
        }
      ]}
      faqs={[
        {
          question: "Can I rotate individual pages differently?",
          answer: "Currently, you can apply the same rotation to selected pages. For different rotations per page, process them separately or use our Edit PDF tool."
        },
        {
          question: "Will rotation affect the file size?",
          answer: "No, rotation only changes the page orientation metadata and doesn't affect the file size or quality."
        },
        {
          question: "Can I preview the rotation before applying?",
          answer: "Yes, our preview feature shows you how pages will look after rotation before processing."
        },
        {
          question: "What if I rotate the wrong direction?",
          answer: "You can easily fix this by rotating again in the opposite direction or using the 180° flip option."
        },
        {
          question: "Does rotation work with scanned PDFs?",
          answer: "Yes, rotation works with all types of PDFs including scanned documents and image-based PDFs."
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
          answer: "Yes, our batch processing feature allows you to upload and rotate multiple files simultaneously, saving you time and effort."
        },
        {
          question: "What happens if my internet connection is interrupted?",
          answer: "If your connection is interrupted during upload, you can resume the upload when reconnected. Processed files are temporarily stored for 1 hour."
        }
      ]}
      relatedTools={[
        {
          name: "Organize PDF",
          path: "/organize-pdf",
          description: "Reorder and organize PDF pages"
        },
        {
          name: "Crop PDF",
          path: "/crop-pdf",
          description: "Crop and resize PDF pages"
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

export default RotatePagesPDFPage