import { Check, Star, ArrowRight } from 'lucide-react'

const Pricing = () => {
  const plans = [
    {
      name: 'Free Forever',
      price: '$0',
      period: 'forever',
      description: 'Perfect for individuals and small teams',
      features: [
        '10 envelopes per month',
        'Full access to PDF tools',
        'Up to 10 legal documents per month',
        'Basic templates',
        'Email support',
        'Mobile app access'
      ],
      cta: 'Start Free',
      popular: false,
      color: 'border-gray-200'
    },
    {
      name: 'Starter',
      price: '$10',
      period: 'per month',
      description: 'Great for growing businesses',
      features: [
        '50 envelopes per month',
        '100 API calls per month',
        'Priority support',
        'Advanced templates',
        'Custom branding',
        'Bulk sending',
        'Advanced reporting',
        'Team management'
      ],
      cta: 'Start 14-day Trial',
      popular: true,
      color: 'border-primary-500'
    },
    {
      name: 'Custom',
      price: 'Contact Us',
      period: 'custom pricing',
      description: 'For enterprises with specific needs',
      features: [
        'Unlimited envelopes',
        'Unlimited API calls',
        'White-label solution',
        'Custom workflows',
        'Dedicated support',
        'SLA guarantee',
        'Advanced integrations',
        'Custom compliance'
      ],
      cta: 'Contact Sales',
      popular: false,
      color: 'border-gray-200'
    }
  ]

  return (
    <section id="pricing" className="section-padding bg-white">
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that fits your needs. Start free, upgrade anytime.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl shadow-lg border-2 ${plan.color} p-8 ${plan.popular ? 'transform scale-105' : ''
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period !== 'custom pricing' && (
                    <span className="text-gray-600 ml-2">/{plan.period}</span>
                  )}
                </div>
                <p className="text-gray-600">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${plan.popular
                  ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="bg-gray-50 rounded-2xl p-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Need help choosing?
              </h3>
              <p className="text-gray-600 mb-6">
                Our team can help you find the perfect plan for your organization's needs.
              </p>
              <button className="flex items-center justify-center gap-2 border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold text-base px-6 py-3 rounded-md transition-all duration-200">
                Schedule a Demo
                <ArrowRight className="h-4 w-4 align-middle" />
              </button>

            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">14-day free trial on all paid plans</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">No setup fees or hidden costs</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Cancel anytime, no questions asked</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">24/7 customer support</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base px-6 py-3 rounded-md shadow-md transition duration-200 mx-auto">
            Compare All Plans
            <ArrowRight className="h-4 w-4 align-middle" />
          </button>

        </div>
      </div>
    </section>
  )
}

export default Pricing