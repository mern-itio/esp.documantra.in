import { Check, X, ArrowRight, Zap, DollarSign, Users, FileText, Clock, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

const DocuSignerVsPandaDocPage = () => {
  const features = [
    { 
      category: "Core Features",
      items: [
        { name: "Electronic Signatures", docusigner: true, pandadoc: true },
        { name: "Document Uploads", docusigner: "Unlimited", pandadoc: "Limited by plan" },
        { name: "Mobile Signing", docusigner: true, pandadoc: true },
        { name: "Audit Trails", docusigner: true, pandadoc: true },
        { name: "Templates", docusigner: true, pandadoc: true },
        { name: "Multiple Signers", docusigner: true, pandadoc: true },
        { name: "Signing Order", docusigner: true, pandadoc: true },
        { name: "Bulk Send", docusigner: true, pandadoc: "Business plans only" },
      ]
    },
    {
      category: "PDF Tools",
      items: [
        { name: "30+ Free PDF Tools", docusigner: true, pandadoc: false },
        { name: "PDF to Word Conversion", docusigner: true, pandadoc: false },
        { name: "PDF Editing", docusigner: true, pandadoc: "Limited" },
        { name: "PDF Compression", docusigner: true, pandadoc: false },
        { name: "Merge PDFs", docusigner: true, pandadoc: false },
        { name: "Split PDFs", docusigner: true, pandadoc: false },
        { name: "OCR Technology", docusigner: true, pandadoc: false },
        { name: "Batch Processing", docusigner: true, pandadoc: "Limited" },
      ]
    },
    {
      category: "Legal & Compliance",
      items: [
        { name: "ESIGN Act Compliance", docusigner: true, pandadoc: true },
        { name: "UETA Compliance", docusigner: true, pandadoc: true },
        { name: "eIDAS Compliance (EU)", docusigner: true, pandadoc: true },
        { name: "Legal Templates Library", docusigner: "45+ templates", pandadoc: "Limited selection" },
        { name: "Custom Legal Templates", docusigner: true, pandadoc: "Premium plans only" },
        { name: "Court-Admissible Evidence", docusigner: true, pandadoc: true },
        { name: "Global Compliance", docusigner: "40+ countries", pandadoc: "Limited countries" },
        { name: "Compliance Documentation", docusigner: true, pandadoc: "Premium plans only" },
      ]
    },
    {
      category: "Advanced Features",
      items: [
        { name: "AI-Powered Document Generation", docusigner: true, pandadoc: "Limited" },
        { name: "API Access", docusigner: "Free tier available", pandadoc: "Business plans only" },
        { name: "White Labeling", docusigner: "Business plans", pandadoc: "Enterprise only" },
        { name: "Advanced Authentication", docusigner: true, pandadoc: "Limited options" },
        { name: "Document Analytics", docusigner: true, pandadoc: true },
        { name: "Workflow Automation", docusigner: true, pandadoc: true },
        { name: "Team Collaboration", docusigner: true, pandadoc: true },
        { name: "Custom Branding", docusigner: true, pandadoc: "Premium plans only" },
      ]
    },
    {
      category: "Security",
      items: [
        { name: "256-bit SSL Encryption", docusigner: true, pandadoc: true },
        { name: "SOC 2 Type II Certified", docusigner: true, pandadoc: true },
        { name: "GDPR Compliance", docusigner: true, pandadoc: true },
        { name: "HIPAA Compliance", docusigner: true, pandadoc: "Business plans only" },
        { name: "Multi-Factor Authentication", docusigner: true, pandadoc: true },
        { name: "Data Backup & Recovery", docusigner: true, pandadoc: true },
        { name: "Tamper-Evident Seals", docusigner: true, pandadoc: true },
        { name: "Detailed Security Logs", docusigner: true, pandadoc: "Limited" },
      ]
    }
  ];

  const pricingPlans = [
    {
      name: "Free Plan",
      docusigner: {
        price: "$0",
        period: "forever",
        features: [
          "10 envelopes per month",
          "Full access to PDF tools",
          "Up to 10 legal templates per month",
          "Basic API access (10 calls/month)",
          "Email support",
          "Mobile app access"
        ]
      },
      pandadoc: {
        price: "$0",
        period: "limited features",
        features: [
          "Only document uploads",
          "No PDF tools",
          "No templates",
          "No API access",
          "Limited support",
          "Limited features"
        ]
      }
    },
    {
      name: "Personal/Starter",
      docusigner: {
        price: "$10",
        period: "per month",
        features: [
          "50 envelopes per month",
          "Unlimited PDF tools usage",
          "20 legal templates per month",
          "100 API calls per month",
          "Priority support",
          "Custom branding"
        ]
      },
      pandadoc: {
        price: "$19",
        period: "per month",
        features: [
          "Unlimited documents",
          "No PDF tools",
          "Limited templates",
          "No API access",
          "Basic support",
          "Limited features"
        ]
      }
    },
    {
      name: "Business/Professional",
      docusigner: {
        price: "$30",
        period: "per month",
        features: [
          "150 envelopes per month",
          "Unlimited PDF tools usage",
          "Unlimited legal templates",
          "1,000 API calls per month",
          "Priority support",
          "Advanced team features"
        ]
      },
      pandadoc: {
        price: "$49",
        period: "per month",
        features: [
          "Unlimited documents",
          "No PDF tools",
          "Basic templates",
          "Limited API access",
          "Phone support",
          "Basic team features"
        ]
      }
    },
    {
      name: "Enterprise",
      docusigner: {
        price: "Custom",
        period: "pricing",
        features: [
          "Unlimited envelopes",
          "Unlimited PDF tools usage",
          "Unlimited legal templates",
          "Unlimited API access",
          "Dedicated support",
          "Advanced security features"
        ]
      },
      pandadoc: {
        price: "Custom",
        period: "pricing",
        features: [
          "Unlimited documents",
          "No PDF tools",
          "Advanced templates",
          "API access included",
          "Dedicated support",
          "Advanced security features"
        ]
      }
    }
  ];

  const testimonials = [
    {
      quote: "We switched from PandaDoc to Draft&Sign and immediately gained access to dozens of PDF tools we were paying for separately. The cost savings are significant, and having everything in one platform has streamlined our workflow.",
      author: "Jessica Reynolds",
      position: "Operations Director",
      company: "Quantum Enterprises"
    },
    {
      quote: "Draft&Sign's legal templates are a game-changer. With PandaDoc, we had to create all our templates from scratch or pay lawyers to draft them. Draft&Sign's template library has saved us thousands in legal fees.",
      author: "Marcus Johnson",
      position: "Legal Counsel",
      company: "Pinnacle Solutions"
    },
    {
      quote: "The free plan from Draft&Sign gives us everything PandaDoc charged for, plus PDF tools we were paying another vendor to use. For a small business like ours, this makes a huge difference to our bottom line.",
      author: "Sophia Chen",
      position: "CEO",
      company: "Horizon Digital"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 mt-8 pt-24 pb-16">
      <div className="container-max">
        {/* Hero Section */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-[#260559]/100 to-[#260559]/90 p-8 text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Draft&Sign vs PandaDoc: The Complete Comparison</h1>
            <p className="text-xl text-primary-100 max-w-3xl">
              Discover why Draft&Sign offers superior value with more features and lower prices than PandaDoc.
            </p>
          </div>
          
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">All-in-One Document Platform</h2>
                    <p className="text-gray-600">More than just e-signatures</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-6">
                  Unlike PandaDoc, which focuses primarily on proposals and e-signatures, Draft&Sign provides a complete document ecosystem including e-signatures, 30+ PDF tools, legal templates, and AI-powered document generation—all in one integrated platform.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Complete document lifecycle management</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Integrated PDF tools save on additional software costs</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Legal templates reduce legal consulting fees</span>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Superior Value</h2>
                    <p className="text-gray-600">More features at lower prices</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-6">
                  Draft&Sign offers significantly more value than PandaDoc with lower prices across all plan tiers. Our free forever plan includes features that PandaDoc only offers in their premium plans, and our paid plans cost 40-60% less than comparable PandaDoc plans.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Robust free forever plan with 10 envelopes/month</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">40-60% cost savings compared to PandaDoc</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">No hidden fees or surprise charges</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Feature Comparison</h2>
          
          {features.map((category, index) => (
            <div key={index} className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">{category.category}</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 w-1/2">Feature</th>
                      <th className="text-center p-3 w-1/4">
                        <div className="flex flex-col items-center">
                          <span className="text-primary-600 font-bold">Draft&Sign</span>
                          <span className="text-xs text-gray-500">Our Platform</span>
                        </div>
                      </th>
                      <th className="text-center p-3 w-1/4">
                        <div className="flex flex-col items-center">
                          <span className="text-gray-600 font-bold">PandaDoc</span>
                          <span className="text-xs text-gray-500">Competitor</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {category.items.map((feature, featureIndex) => (
                      <tr key={featureIndex} className={featureIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="p-3 font-medium text-gray-900">{feature.name}</td>
                        <td className="p-3 text-center">
                          {typeof feature.docusigner === 'boolean' ? (
                            feature.docusigner ? (
                              <Check className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-red-500 mx-auto" />
                            )
                          ) : (
                            <span className="text-green-600 font-medium">{feature.docusigner}</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {typeof feature.pandadoc === 'boolean' ? (
                            feature.pandadoc ? (
                              <Check className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-red-500 mx-auto" />
                            )
                          ) : (
                            <span className="text-gray-600">{feature.pandadoc}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Comparison */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pricing Comparison</h2>
          <p className="text-gray-600 mb-6">See how much you can save by choosing Draft&Sign over PandaDoc</p>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-4">Plan</th>
                  <th className="p-4">
                    <div className="flex flex-col items-center">
                      <span className="text-primary-600 font-bold">Draft&Sign</span>
                      <span className="text-xs text-gray-500">Price</span>
                    </div>
                  </th>
                  <th className="p-4">
                    <div className="flex flex-col items-center">
                      <span className="text-gray-600 font-bold">PandaDoc</span>
                      <span className="text-xs text-gray-500">Price</span>
                    </div>
                  </th>
                  <th className="p-4">
                    <div className="flex flex-col items-center">
                      <span className="text-green-600 font-bold">Your Savings</span>
                      <span className="text-xs text-gray-500">with Draft&Sign</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pricingPlans.map((plan, index) => {
                  // Calculate savings
                  let savings = "100%";
                  if (plan.pandadoc.price !== "$0" && plan.pandadoc.price !== "Custom" && plan.docusigner.price !== "Custom") {
                    const docusignerPrice = parseInt(plan.docusigner.price.replace('$', ''));
                    const pandadocPrice = parseInt(plan.pandadoc.price.replace('$', ''));
                    if (!isNaN(docusignerPrice) && !isNaN(pandadocPrice) && pandadocPrice > 0) {
                      const savingsPercent = Math.round(((pandadocPrice - docusignerPrice) / pandadocPrice) * 100);
                      savings = `${savingsPercent}%`;
                    }
                  } else if (plan.pandadoc.price === "$0") {
                    if (plan.name === "Free Plan") {
                      savings = "More value";
                    } else {
                      savings = "N/A";
                    }
                  } else if (plan.pandadoc.price === "Custom" || plan.docusigner.price === "Custom") {
                    savings = "Varies";
                  }
                  
                  return (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-4 font-semibold text-gray-900">{plan.name}</td>
                      <td className="p-4">
                        <div className="flex flex-col items-center">
                          <span className="text-xl font-bold text-primary-600">{plan.docusigner.price}</span>
                          {plan.docusigner.period && <span className="text-sm text-gray-500">{plan.docusigner.period}</span>}
                          <ul className="mt-2 text-xs text-left space-y-1">
                            {plan.docusigner.features.map((feature, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <Check className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-center">
                          <span className="text-xl font-bold text-gray-600">{plan.pandadoc.price}</span>
                          {plan.pandadoc.period && <span className="text-sm text-gray-500">{plan.pandadoc.period}</span>}
                          <ul className="mt-2 text-xs text-left space-y-1">
                            {plan.pandadoc.features.map((feature, i) => (
                              <li key={i} className="flex items-start gap-1">
                                {feature.startsWith("No ") || feature.includes("Limited") ? (
                                  <X className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <Check className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                )}
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-center">
                          <span className="text-xl font-bold text-green-600">{savings}</span>
                          <span className="text-sm text-gray-500">savings</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800">Annual Savings Potential</h4>
                <p className="text-sm text-green-700 mt-1">
                  Organizations typically save 40-60% on their document management costs by switching from PandaDoc to Draft&Sign. For a team of 10 users, this can translate to $2,400-$3,600 in annual savings, plus additional savings from the included PDF tools and legal templates.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Advantages */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Advantages of Draft&Sign over PandaDoc</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Comprehensive PDF Tools</h3>
              <p className="text-gray-700">
                Draft&Sign includes 30+ PDF tools that PandaDoc doesn't offer, eliminating the need for separate PDF software subscriptions and saving you hundreds of dollars annually.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Better Free Plan</h3>
              <p className="text-gray-700">
                Draft&Sign's free plan offers 10 envelopes per month, full access to PDF tools, and legal templates. PandaDoc's free plan is extremely limited with just document uploads and no e-signature capabilities.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Legal Template Library</h3>
              <p className="text-gray-700">
                Draft&Sign provides 45+ professionally drafted legal templates that PandaDoc doesn't offer, saving you thousands in potential legal fees and consultation costs.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Features</h3>
              <p className="text-gray-700">
                Draft&Sign's advanced AI capabilities for document generation, field detection, and content analysis outpace PandaDoc's more limited AI offerings, making document preparation faster and more accurate.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">More Affordable Team Features</h3>
              <p className="text-gray-700">
                Draft&Sign offers team collaboration features at lower price points than PandaDoc, making advanced workflow capabilities accessible to small and medium-sized businesses.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Faster Implementation</h3>
              <p className="text-gray-700">
                Draft&Sign's intuitive interface and streamlined onboarding process gets teams up and running in minutes, compared to PandaDoc's more complex implementation that often requires training.
              </p>
            </div>
          </div>
        </div>

        {/* Customer Testimonials */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What Customers Say After Switching</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 italic mb-4">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.author}</p>
                  <p className="text-sm text-gray-600">{testimonial.position}, {testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Migration Guide */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Easy Migration from PandaDoc</h2>
          <p className="text-gray-600 mb-6">
            Switching from PandaDoc to Draft&Sign is simple with our migration tools and dedicated support.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-primary-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Import Your Templates</h3>
              <p className="text-gray-700 text-sm">
                Our template converter automatically imports and adapts your existing PandaDoc templates to work with Draft&Sign.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-primary-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Transfer Your Contacts</h3>
              <p className="text-gray-700 text-sm">
                Easily import your contact lists and recipient information to maintain continuity in your document workflows.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-primary-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Dedicated Migration Support</h3>
              <p className="text-gray-700 text-sm">
                Our migration specialists provide personalized assistance to ensure a smooth transition with minimal disruption.
              </p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <Link to="/contact" className="inline-flex items-center gap-2 bg-[#260559] hover:bg-[#260559] text-white font-semibold py-3 px-6 rounded-lg transition-colors">
              Schedule Migration Consultation
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900">Is Draft&Sign as legally binding as PandaDoc?</h3>
              </div>
              <div className="p-4">
                <p className="text-gray-700">
                  Yes, absolutely. Draft&Sign's electronic signatures are equally legally binding and compliant with all major e-signature laws including ESIGN Act, UETA, and eIDAS. Our signatures provide the same level of legal validity and court admissibility as PandaDoc, with comprehensive audit trails and certificate of completion documentation.
                </p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900">How does Draft&Sign's proposal functionality compare to PandaDoc?</h3>
              </div>
              <div className="p-4">
                <p className="text-gray-700">
                  While PandaDoc specializes in proposal creation, Draft&Sign offers a more comprehensive document solution. Draft&Sign includes proposal templates in our legal template library, plus the ability to create custom proposals with our document editor. The key difference is that Draft&Sign also includes 30+ PDF tools, e-signatures, and document management in one platform, while PandaDoc focuses primarily on proposals and e-signatures.
                </p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900">How difficult is it to switch from PandaDoc to Draft&Sign?</h3>
              </div>
              <div className="p-4">
                <p className="text-gray-700">
                  Switching is remarkably easy. Draft&Sign provides migration tools to import your templates, contacts, and workflows. Most customers complete their migration in less than a day, and our dedicated migration specialists are available to assist with the transition. We also provide comprehensive training resources to help your team get up to speed quickly.
                </p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900">Is Draft&Sign as secure as PandaDoc?</h3>
              </div>
              <div className="p-4">
                <p className="text-gray-700">
                  Draft&Sign implements the same enterprise-grade security measures as PandaDoc, including 256-bit SSL encryption, SOC 2 Type II certification, GDPR compliance, and tamper-evident seals. We also offer advanced security features like multi-factor authentication, detailed access controls, and comprehensive audit logs. Your documents and data are equally secure with Draft&Sign.
                </p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900">How much can I save by switching from PandaDoc to Draft&Sign?</h3>
              </div>
              <div className="p-4">
                <p className="text-gray-700">
                  Most organizations save 40-60% on their document management costs by switching to Draft&Sign. For example, a business with 10 users on PandaDoc's Business plan paying approximately $490/month could switch to Draft&Sign's equivalent plan for around $300/month—a savings of $2,280 annually. Additionally, the included PDF tools and legal templates eliminate the need for separate subscriptions to those services, potentially saving thousands more.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-[#260559]/100 to-[#260559]/90 rounded-2xl shadow-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Save Money and Get More Features?</h2>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto mb-8">
            Join thousands of businesses that have switched from PandaDoc to Draft&Sign for better features at lower prices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="bg-white text-[#260559] hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors shadow-lg hover:shadow-xl text-lg">
              Start Free Forever <ArrowRight className="ml-2 h-5 w-5 inline" />
            </Link>
            <Link to="/contact" className="border-2 border-white text-white hover:bg-white hover:text-[#260559] font-semibold py-3 px-8 rounded-lg transition-colors text-lg">
              Schedule Demo
            </Link>
          </div>
          <p className="mt-6 text-primary-100">No credit card required. Free plan includes 10 envelopes/month and all PDF tools.</p>
        </div>
      </div>
    </div>
  );
};

export default DocuSignerVsPandaDocPage;