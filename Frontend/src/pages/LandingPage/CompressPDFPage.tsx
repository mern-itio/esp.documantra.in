import { Minimize2 } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const CompressPDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF compression:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Compression Level
        </label>
        <div className="space-y-3">
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="compression" value="low" className="text-primary-600" />
            <div>
              <div className="font-medium">Low Compression</div>
              <div className="text-sm text-gray-600">Minimal size reduction, highest quality</div>
            </div>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="compression" value="medium" className="text-primary-600" defaultChecked />
            <div>
              <div className="font-medium">Medium Compression (Recommended)</div>
              <div className="text-sm text-gray-600">Good balance of size and quality</div>
            </div>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="compression" value="high" className="text-primary-600" />
            <div>
              <div className="font-medium">High Compression</div>
              <div className="text-sm text-gray-600">Maximum size reduction, lower quality</div>
            </div>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image Quality
        </label>
        <input
          type="range"
          min="10"
          max="100"
          defaultValue="75"
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Lower quality</span>
          <span>Higher quality</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="remove-metadata" className="text-primary-600" defaultChecked />
        <label htmlFor="remove-metadata" className="text-sm text-gray-700">
          Remove metadata to reduce size
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="optimize-fonts" className="text-primary-600" defaultChecked />
        <label htmlFor="optimize-fonts" className="text-sm text-gray-700">
          Optimize embedded fonts
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Compress PDF"
      toolDescription="Reduce PDF file size while maintaining quality. Perfect for email attachments and web sharing."
      toolIcon={Minimize2}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="200MB"
      processingTime="20-45 seconds"
      features={[
        "Up to 90% size reduction",
        "Maintains visual quality",
        "Batch compression support",
        "Smart image optimization",
        "Font subsetting",
        "Metadata removal",
        "Multiple compression levels",
        "Preview before/after comparison"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to compress"
        },
        {
          title: "Choose Level",
          description: "Select compression level based on your needs"
        },
        {
          title: "Optimize",
          description: "Our AI optimizes images and removes unnecessary data"
        },
        {
          title: "Download",
          description: "Get your compressed PDF with reduced file size"
        }
      ]}
      faqs={[
        {
          question: "How much can I compress my PDF?",
          answer: "Compression rates vary depending on content. Typically, you can achieve 50-90% size reduction while maintaining good quality."
        },
        {
          question: "Will compression affect the quality?",
          answer: "Our smart compression algorithm maintains visual quality while reducing file size. You can choose the compression level that best fits your needs."
        },
        {
          question: "Can I compress password-protected PDFs?",
          answer: "Yes, you can compress password-protected PDFs. The password protection will be maintained in the compressed file."
        },
        {
          question: "What's the difference between compression levels?",
          answer: "Low compression maintains highest quality with minimal size reduction. High compression achieves maximum size reduction but may slightly reduce quality."
        },
        {
          question: "Can I compress multiple PDFs at once?",
          answer: "Yes, our batch compression feature allows you to compress multiple PDF files simultaneously."
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
          name: "Merge PDF",
          path: "/merge-pdf",
          description: "Combine PDFs before compressing"
        },
        {
          name: "PDF to JPG",
          path: "/pdf-to-jpg",
          description: "Convert to images for web use"
        },
        {
          name: "Optimize PDF",
          path: "/optimize-pdf",
          description: "Advanced PDF optimization tools"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default CompressPDFPage