import { Minimize2 } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const CompressPDFAdvancedPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing advanced PDF compression:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Compression Profile
        </label>
        <div className="space-y-3">
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="profile" value="extreme" className="text-primary-600" />
            <div>
              <div className="font-medium">Extreme Compression</div>
              <div className="text-sm text-gray-600">Maximum size reduction, lower quality</div>
            </div>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="profile" value="balanced" className="text-primary-600" defaultChecked />
            <div>
              <div className="font-medium">Balanced (Recommended)</div>
              <div className="text-sm text-gray-600">Good balance of size and quality</div>
            </div>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="profile" value="minimal" className="text-primary-600" />
            <div>
              <div className="font-medium">Minimal Compression</div>
              <div className="text-sm text-gray-600">Slight size reduction, highest quality</div>
            </div>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="profile" value="custom" className="text-primary-600" />
            <div>
              <div className="font-medium">Custom Settings</div>
              <div className="text-sm text-gray-600">Configure individual compression options</div>
            </div>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image Compression
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Compress images</span>
          </label>
          <div className="pl-6">
            <label className="block text-xs text-gray-600 mb-1">Image Quality</label>
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
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Downsample images</span>
          </label>
          <div className="pl-6">
            <label className="block text-xs text-gray-600 mb-1">Resolution (DPI)</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option value="72">72 DPI (screen resolution)</option>
              <option value="150" selected>150 DPI (web quality)</option>
              <option value="300">300 DPI (print quality)</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Font Optimization
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Subset embedded fonts</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Remove unused fonts</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content Optimization
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Remove metadata</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Remove bookmarks</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Remove annotations</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Flatten form fields</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="linearize" className="text-primary-600" defaultChecked />
        <label htmlFor="linearize" className="text-sm text-gray-700">
          Linearize for fast web view
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Advanced PDF Compression"
      toolDescription="Compress PDF files with advanced options for maximum control. Fine-tune compression settings for optimal balance between size and quality."
      toolIcon={Minimize2}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="200MB"
      processingTime="30-90 seconds"
      features={[
        "Advanced compression profiles",
        "Custom image quality settings",
        "Font subsetting and optimization",
        "Content cleanup options",
        "Metadata removal",
        "Web optimization",
        "Batch compression support",
        "Size/quality control"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to compress"
        },
        {
          title: "Choose Profile",
          description: "Select compression profile or custom settings"
        },
        {
          title: "Configure Options",
          description: "Fine-tune compression parameters"
        },
        {
          title: "Download",
          description: "Get your compressed PDF file"
        }
      ]}
      faqs={[
        {
          question: "How much can file size be reduced?",
          answer: "Compression rates vary depending on content. With extreme compression, you can achieve 70-95% size reduction, while balanced compression typically achieves 40-70% reduction."
        },
        {
          question: "What's the difference between compression profiles?",
          answer: "Extreme compression maximizes size reduction but may affect quality. Balanced offers good size reduction while maintaining quality. Minimal makes minor reductions with minimal quality impact."
        },
        {
          question: "How does image downsampling work?",
          answer: "Downsampling reduces image resolution to a specified DPI (dots per inch). Lower DPI values create smaller files but reduce image quality, especially for printing."
        },
        {
          question: "What is font subsetting?",
          answer: "Font subsetting removes unused characters from embedded fonts, significantly reducing file size while maintaining text appearance."
        },
        {
          question: "What is linearization?",
          answer: "Linearization (fast web view) restructures the PDF for faster loading when viewed online, allowing pages to display before the entire file downloads."
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
          answer: "Yes, our batch processing feature allows you to upload and compress multiple files simultaneously, saving you time and effort."
        },
        {
          question: "What happens if my internet connection is interrupted?",
          answer: "If your connection is interrupted during upload, you can resume the upload when reconnected. Processed files are temporarily stored for 1 hour."
        }
      ]}
      relatedTools={[
        {
          name: "Compress PDF",
          path: "/compress-pdf",
          description: "Simple PDF compression"
        },
        {
          name: "Compress Images PDF",
          path: "/compress-images-pdf",
          description: "Focus on image compression"
        },
        {
          name: "Optimize PDF",
          path: "/optimize-pdf",
          description: "Overall PDF optimization"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default CompressPDFAdvancedPage