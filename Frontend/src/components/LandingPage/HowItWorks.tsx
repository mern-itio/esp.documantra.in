import { Upload, UserPlus, Send, ArrowRight } from 'lucide-react'

const HowItWorks = () => {
  const steps = [
    {
      icon: Upload,
      title: "Upload or Generate",
      description: "Upload your document or create one from our legal templates",
      color: "bg-blue-500"
    },
    {
      icon: UserPlus,
      title: "Add Fields & Signers",
      description: "Drag-and-drop signature fields and assign signers with custom order",
      color: "bg-[#F0FDF4]0"
    },
    {
      icon: Send,
      title: "Send & Track",
      description: "Send for signatures and track progress with full audit trail",
      color: "bg-green-500"
    }
  ]

  return (
    <section className="section-padding bg-[#F5F2EE]">
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Here's how DocuFie works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get your documents signed in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="bg-[#F7F3EE] rounded-xl p-8 shadow-lg card-hover text-center">
                <div className={`${step.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6`}>
                  <step.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
              
              {/* Arrow for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <ArrowRight className="h-8 w-8 text-gray-300" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <button className="btn-primary text-lg px-8 py-4">
            Explore the Full Process <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks