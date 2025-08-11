import { ArrowRight, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const CTASection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
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
            <button className="flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-gray-100 font-semibold text-base px-6 py-3 rounded-md shadow-md hover:shadow-lg transition duration-200">
              Start Free Forever
              <ArrowRight className="h-4 w-4 align-middle" />
            </button>
            </Link>
            
            <button className="flex items-center justify-center gap-2 border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold text-base px-6 py-3 rounded-md transition duration-200">
              Schedule Demo
            </button>
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