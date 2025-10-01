import { RotateCw, RotateCcw, RefreshCw } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const RotatePDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF rotation:', files, settings)
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
            <RotateCw className="h-5 w-5 text-blue-500" />
            <span>90° Clockwise</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="direction" value="counterclockwise" className="text-primary-600" />
            <RotateCcw className="h-5 w-5 text-green-500" />
            <span>90° Counter-clockwise</span>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="direction" value="180" className="text-primary-600" />
            <RefreshCw className="h-5 w-5 text-purple-500" />
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
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Rotate PDF"
      toolDescription="Rotate PDF pages to the correct orientation. Fix upside-down or sideways pages with precision."
      toolIcon={RotateCw}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="2MB"
      processingTime="10-20 seconds"
      features={[
        "Rotate pages 90°, 180°, or custom angles",
        "Apply rotation to specific pages",
        "Batch rotation for multiple files",
        "Preview before applying changes",
        "Preserve original quality",
        "Undo/redo functionality",
        "Auto-detect orientation",
        "Maintain document structure"
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
          answer: "Currently, you can apply the same rotation to selected pages. For different rotations per page, process them separately."
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
          name: "Split PDF",
          path: "/split-pdf",
          description: "Split PDF into separate files"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default RotatePDFPage