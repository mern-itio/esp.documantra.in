import { Presentation } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const PowerPointToPDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PowerPoint to PDF:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Conversion Quality
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="quality" value="high" className="text-primary-600" defaultChecked />
            <span>High Quality (Print-ready)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="quality" value="medium" className="text-primary-600" />
            <span>Medium Quality (Web-optimized)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="quality" value="compressed" className="text-primary-600" />
            <span>Compressed (Smaller file size)</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Slide Range (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g., 1-10, 15, 20-25"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Layout
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="slides">One slide per page</option>
          <option value="handouts-2">2 slides per page (handouts)</option>
          <option value="handouts-4">4 slides per page (handouts)</option>
          <option value="handouts-6">6 slides per page (handouts)</option>
          <option value="notes">Slides with notes</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-animations" className="text-primary-600" />
        <label htmlFor="preserve-animations" className="text-sm text-gray-700">
          Include slide transitions (as static frames)
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-hyperlinks" className="text-primary-600" defaultChecked />
        <label htmlFor="preserve-hyperlinks" className="text-sm text-gray-700">
          Preserve hyperlinks
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="PowerPoint to PDF Converter"
      toolDescription="Convert PowerPoint presentations to PDF format. Perfect for sharing presentations and ensuring consistent viewing across devices."
      toolIcon={Presentation}
      acceptedFormats={['.pptx', '.ppt', '.odp']}
      outputFormats={['pdf']}
      maxFileSize="2MB"
      processingTime="30-60 seconds"
      features={[
        "Perfect slide formatting preservation",
        "Multiple layout options",
        "Handout creation support",
        "Notes page inclusion",
        "Hyperlink preservation",
        "Batch conversion support",
        "Custom slide ranges",
        "High-quality output"
      ]}
      howToSteps={[
        {
          title: "Upload PowerPoint",
          description: "Select your PowerPoint presentation file"
        },
        {
          title: "Choose Layout",
          description: "Select slide layout and quality settings"
        },
        {
          title: "Convert",
          description: "Our system converts slides to PDF format"
        },
        {
          title: "Download",
          description: "Get your PDF presentation ready for sharing"
        }
      ]}
      faqs={[
        {
          question: "Will animations and transitions be preserved?",
          answer: "Animations and transitions cannot be preserved in PDF format, but we can include static frames of transition states if needed."
        },
        {
          question: "Can I create handout versions?",
          answer: "Yes, you can create handout layouts with 2, 4, or 6 slides per page, perfect for printing and distribution."
        },
        {
          question: "What about speaker notes?",
          answer: "You can choose to include speaker notes in the PDF, creating a notes page layout with slides and accompanying text."
        },
        {
          question: "Will embedded videos work in the PDF?",
          answer: "Videos will appear as static images in the PDF. For interactive presentations, consider keeping the original PowerPoint format."
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
          name: "PDF to PowerPoint",
          path: "/pdf-to-powerpoint",
          description: "Convert PDF files back to PowerPoint format"
        },
        {
          name: "Compress PDF",
          path: "/compress-pdf",
          description: "Reduce PDF file size after conversion"
        },
        {
          name: "Protect PDF",
          path: "/protect-pdf",
          description: "Add password protection to your PDF"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default PowerPointToPDFPage