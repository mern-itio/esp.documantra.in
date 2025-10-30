import { Users, MousePointer, Shield, FileCheck, Repeat, Award } from 'lucide-react'
import { Link } from 'react-router-dom'

const ESignature = () => {
  const features = [
    {
      icon: Users,
      title: "Multiple Signers",
      description: "Add unlimited signers to your documents"
    },
    {
      icon: MousePointer,
      title: "Drag-and-Drop Editor",
      description: "Easily place signature fields anywhere"
    },
    {
      icon: Shield,
      title: "Signing Order & Priority",
      description: "Control the sequence of signatures"
    },
    {
      icon: FileCheck,
      title: "Reviewer Roles",
      description: "Add reviewers before final signing"
    },
    {
      icon: Award,
      title: "Signing Certificate",
      description: "Full audit trail with legal certificates"
    },
    {
      icon: Repeat,
      title: "Reusable Templates",
      description: "Create templates for recurring documents"
    }
  ]

  return (
    <section id="esignature" className="section-padding bg-gradient-to-br from-primary-50 to-white">
      <div className="container-max">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Professional eSignature – <span className="gradient-text">Secure & Compliant</span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Send documents for signature with enterprise-grade security and legal compliance.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/login" className="inline-block mt-4">
              <button className="btn-primary text-lg px-8 py-4">
                Send Your First Envelope Free
              </button>
            </Link>
          </div>

          {/* Right Visual - Mock Signature Interface */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b">
                <h3 className="font-semibold text-gray-900">Document Signing</h3>
                <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
                  Ready to Sign
                </span>
              </div>

              {/* Document Preview */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <FileCheck className="h-5 w-5 text-primary-600" />
                  <span className="font-medium text-gray-900">Employment Contract.pdf</span>
                </div>

                {/* Signature Fields */}
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-primary-300 rounded-lg p-3 bg-primary-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-primary-700">Signature Required</span>
                      <span className="text-xs text-primary-600">Page 1</span>
                    </div>
                    <div className="mt-2 text-xs text-primary-600">Click to sign</div>
                  </div>

                  <div className="border-2 border-dashed border-orange-300 rounded-lg p-3 bg-orange-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-orange-700">Date Field</span>
                      <span className="text-xs text-orange-600">Page 2</span>
                    </div>
                    <div className="mt-2 text-xs text-orange-600">Auto-filled: {new Date().toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              {/* Signers List */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Signing Order</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">John Doe (Employee)</div>
                      <div className="text-xs text-green-600">✓ Signed</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">HR Manager</div>
                      <div className="text-xs text-blue-600">⏳ Pending</div>
                    </div>
                  </div>
                </div>
              </div>

             <Link to="/login">
              <button className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors">
                Continue Signing Process
              </button>
              </Link>
            </div>

            {/* Floating Security Badge */}
            <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
              256-bit SSL
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ESignature