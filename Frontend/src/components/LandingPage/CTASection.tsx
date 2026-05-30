import { ArrowRight, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const CTASection = () => {
  return (
    <section className="p-8 text-white rounded-sm bg-gradient-to-r from-[#260559] via-[#4b0ea0] to-[#260559]">
      <div className="container-max">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Document Workflow?
          </h2>
          <p className="text-xl text-primary-100 mb-8 leading-relaxed">
            Join thousands of organizations who trust DocuSigner for their document management,
            e-signature, and legal template needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/signup">
            <button className="flex items-center justify-center gap-2 bg-[#F7F3EE] text-[#260559] hover:bg-gray-100 font-semibold text-base px-6 py-3 rounded-md shadow-md hover:shadow-lg transition duration-200">
              Start Free Forever
              <ArrowRight className="h-4 w-4 align-middle" />
            </button>
            </Link>
            <Link to="/contact-sales">
            <button className="flex items-center justify-center gap-2 border-2 border-white text-white hover:bg-[#F7F3EE] hover:text-blue-600 font-semibold text-base px-6 py-3 rounded-md transition duration-200">
              Schedule Demo
            </button>
            </Link>
          </div>


          <div className="grid sm:grid-cols-3 gap-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-300" />
              <span className="text-primary-100">No credit card required</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-300" />
              <span className="text-primary-100">Free forever plan</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-300" />
              <span className="text-primary-100">Setup in 2 minutes</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTASection