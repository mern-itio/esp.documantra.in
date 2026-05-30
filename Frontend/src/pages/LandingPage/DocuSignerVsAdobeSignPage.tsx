import { Check, X, ArrowRight, Zap, DollarSign, Users, FileText, Clock, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

const DocuSignerVsAdobeSignPage = () => {
  const features = [
    { 
      category: "Core Features",
      items: [
        { name: "Electronic Signatures", docusigner: true, adobesign: true },
        { name: "Document Uploads", docusigner: "Unlimited", adobesign: "Limited by plan" },
        { name: "Mobile Signing", docusigner: true, adobesign: true },
        { name: "Audit Trails", docusigner: true, adobesign: true },
        { name: "Templates", docusigner: true, adobesign: true },
        { name: "Multiple Signers", docusigner: true, adobesign: true },
        { name: "Signing Order", docusigner: true, adobesign: true },
        { name: "Bulk Send", docusigner: true, adobesign: "Premium plans only" },
      ]
    },
    {
      category: "PDF Tools",
      items: [
        { name: "30+ Free PDF Tools", docusigner: true, adobesign: false },
        { name: "PDF to Word Conversion", docusigner: true, adobesign: "Requires Acrobat subscription" },
        { name: "PDF Editing", docusigner: true, adobesign: "Requires Acrobat subscription" },
        { name: "PDF Compression", docusigner: true, adobesign: "Requires Acrobat subscription" },
        { name: "Merge PDFs", docusigner: true, adobesign: "Requires Acrobat subscription" },
        { name: "Split PDFs", docusigner: true, adobesign: "Requires Acrobat subscription" },
        { name: "OCR Technology", docusigner: true, adobesign: "Requires Acrobat subscription" },
        { name: "Batch Processing", docusigner: true, adobesign: "Requires Acrobat subscription" },
      ]
    },
    {
      category: "Legal & Compliance",
      items: [
        { name: "ESIGN Act Compliance", docusigner: true, adobesign: true },
        { name: "UETA Compliance", docusigner: true, adobesign: true },
        { name: "eIDAS Compliance (EU)", docusigner: true, adobesign: true },
        { name: "Legal Templates Library", docusigner: "45+ templates", adobesign: "Limited selection" },
        { name: "Custom Legal Templates", docusigner: true, adobesign: "Premium plans only" },
        { name: "Court-Admissible Evidence", docusigner: true, adobesign: true },
        { name: "Global Compliance", docusigner: "40+ countries", adobesign: "40+ countries" },
        { name: "Compliance Documentation", docusigner: true, adobesign: "Premium plans only" },
      ]
    },
    {
      category: "Advanced Features",
      items: [
        { name: "AI-Powered Document Generation", docusigner: true, adobesign: "Limited" },
        { name: "API Access", docusigner: "Free tier available", adobesign: "Premium plans only" },
        { name: "White Labeling", docusigner: "Business plans", adobesign: "Premium plans only" },
        { name: "Advanced Authentication", docusigner: true, adobesign: true },
        { name: "Document Analytics", docusigner: true, adobesign: "Premium plans only" },
        { name: "Workflow Automation", docusigner: true, adobesign: true },
        { name: "Team Collaboration", docusigner: true, adobesign: true },
        { name: "Custom Branding", docusigner: true, adobesign: "Premium plans only" },
      ]
    },
    {
      category: "Security",
      items: [
        { name: "256-bit SSL Encryption", docusigner: true, adobesign: true },
        { name: "SOC 2 Type II Certified", docusigner: true, adobesign: true },
        { name: "GDPR Compliance", docusigner: true, adobesign: true },
        { name: "HIPAA Compliance", docusigner: true, adobesign: "Business plans only" },
        { name: "Multi-Factor Authentication", docusigner: true, adobesign: true },
        { name: "Data Backup & Recovery", docusigner: true, adobesign: true },
        { name: "Tamper-Evident Seals", docusigner: true, adobesign: true },
        { name: "Detailed Security Logs", docusigner: true, adobesign: "Premium plans only" },
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
      adobesign: {
        price: "No free plan",
        period: "",
        features: [
          "No permanent free plan",
          "Limited trial only",
          "PDF tools require Acrobat subscription",
          "No legal templates",
          "No API access",
          "Limited support"
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
      adobesign: {
        price: "$29.99",
        period: "per month",
        features: [
          "150 transactions per year",
          "PDF tools require Acrobat subscription",
          "No legal templates",
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
      adobesign: {
        price: "$49.99",
        period: "per month",
        features: [
          "Unlimited transactions",
          "PDF tools require Acrobat subscription",
          "No legal templates",
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
      adobesign: {
        price: "Custom",
        period: "pricing",
        features: [
          "Unlimited transactions",
          "PDF tools require Acrobat subscription",
          "Limited templates",
          "API access included",
          "Dedicated support",
          "Advanced security features"
        ]
      }
    }
  ];

  const testimonials = [
    {
      quote: "We were using Adobe Sign and paying separately for Acrobat Pro. Switching to {BRAND.name} gave us both e-signatures and PDF tools in one platform, saving us over 65% on our annual costs.",
      author: "Robert Anderson",
      position: "IT Director",
      company: "Meridian Enterprises"
    },
    {
      quote: "{BRAND.name}'s legal templates are a game-changer. With Adobe Sign, we had to create all our templates from scratch. {BRAND.name}'s template library has saved us thousands in legal fees and countless hours.",
      author: "Priya Sharma",
      position: "Legal Operations Manager",
      company: "Horizon Financial"
    },
    {
      quote: "The free plan from {BRAND.name} gives us everything Adobe Sign charged for, plus PDF tools we were paying Adobe separately to use. For a small business like ours, this makes a huge difference to our bottom line.",
      author: "Carlos Mendez",
      position: "Operations Manager",
      company: "Nexus Creative"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F2EE] mt-8 pt-24 pb-16">
      <div className="container-max">
        {/* Hero Section */}
        <div className="bg-[#F7F3EE] rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-[#260559]/100 to-[#260559]/90 p-8 text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{BRAND.name} vs Adobe Sign: The Complete Comparison</h1>
            <p className="text-xl text-primary-100 max-w-3xl">
              Discover why {BRAND.name} offers superior value with more features and lower prices than Adobe Sign.
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
                    <p className="text-gray-600">No need for multiple subscriptions</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-6">
                  Unlike Adobe Sign, which requires a separate Acrobat subscription for PDF tools, {BRAND.name} provides e-signatures, 30+ PDF tools, legal templates, and AI-powered document generation—all in one integrated platform at a single price point.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Complete document ecosystem in one subscription</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">No need for separate Acrobat Pro subscription</span>
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
                    <h2 className="text-xl font-semibold text-gray-900">Significant Cost Savings</h2>
                    <p className="text-gray-600">Lower prices, more features</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-6">
                  {BRAND.name} offers exceptional value compared to Adobe Sign with lower prices across all plan tiers. When you factor in the additional cost of Acrobat Pro that Adobe users typically need, the savings with {BRAND.name} are even more substantial—often 60-75% less.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Free forever plan with 10 envelopes/month</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">60-75% cost savings compared to Adobe Sign + Acrobat</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Transparent pricing with no hidden fees</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="bg-[#F7F3EE] rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Feature Comparison</h2>
          
          {features.map((category, index) => (
            <div key={index} className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">{category.category}</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F5F2EE]">
                      <th className="text-left p-3 w-1/2">Feature</th>
                      <th className="text-center p-3 w-1/4">
                        <div className="flex flex-col items-center">
                          <span className="text-primary-600 font-bold">{BRAND.name}</span>
                          <span className="text-xs text-gray-500">Our Platform</span>
                        </div>
                      </th>
                      <th className="text-center p-3 w-1/4">
                        <div className="flex flex-col items-center">
                          <span className="text-gray-600 font-bold">Adobe Sign</span>
                          <span className="text-xs text-gray-500">Competitor</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {category.items.map((feature, featureIndex) => (
                      <tr key={featureIndex} className={featureIndex % 2 === 0 ? 'bg-[#F7F3EE]' : 'bg-[#F5F2EE]'}>
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
                          {typeof feature.adobesign === 'boolean' ? (
                            feature.adobesign ? (
                              <Check className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-red-500 mx-auto" />
                            )
                          ) : (
                            <span className="text-gray-600">{feature.adobesign}</span>
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
        <div className="bg-[#F7F3EE] rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pricing Comparison</h2>
          <p className="text-gray-600 mb-6">See how much you can save by choosing {BRAND.name} over Adobe Sign</p>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F5F2EE]">
                  <th className="text-left p-4">Plan</th>
                  <th className="p-4">
                    <div className="flex flex-col items-center">
                      <span className="text-primary-600 font-bold">{BRAND.name}</span>
                      <span className="text-xs text-gray-500">Price</span>
                    </div>
                  </th>
                  <th className="p-4">
                    <div className="flex flex-col items-center">
                      <span className="text-gray-600 font-bold">Adobe Sign</span>
                      <span className="text-xs text-gray-500">Price</span>
                    </div>
                  </th>
                  <th className="p-4">
                    <div className="flex flex-col items-center">
                      <span className="text-green-600 font-bold">Your Savings</span>
                      <span className="text-xs text-gray-500">with {BRAND.name}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pricingPlans.map((plan, index) => {
                  // Calculate savings
                  let savings = "100%";
                  if (plan.adobesign.price !== "No free plan" && plan.adobesign.price !== "Custom" && plan.docusigner.price !== "Custom") {
                    const docusignerPrice = parseInt(plan.docusigner.price.replace('$', ''));
                    const adobesignPrice = parseFloat(plan.adobesign.price.replace('$', ''));
                    if (!isNaN(docusignerPrice) && !isNaN(adobesignPrice) && adobesignPrice > 0) {
                      const savingsPercent = Math.round(((adobesignPrice - docusignerPrice) / adobesignPrice) * 100);
                      savings = `${savingsPercent}%`;
                    }
                  } else if (plan.adobesign.price === "No free plan") {
                    savings = "100%";
                  } else if (plan.adobesign.price === "Custom" || plan.docusigner.price === "Custom") {
                    savings = "Varies";
                  }
                  
                  return (
                    <tr key={index} className={index % 2 === 0 ? 'bg-[#F7F3EE]' : 'bg-[#F5F2EE]'}>
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
                          <span className="text-xl font-bold text-gray-600">{plan.adobesign.price}</span>
                          {plan.adobesign.period && <span className="text-sm text-gray-500">{plan.adobesign.period}</span>}
                          <ul className="mt-2 text-xs text-left space-y-1">
                            {plan.adobesign.features.map((feature, i) => (
                              <li key={i} className="flex items-start gap-1">
                                {feature.startsWith("No ") || feature.includes("Limited") || feature.includes("require") ? (
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
                <h4 className="font-medium text-green-800">Total Cost Comparison</h4>
                <p className="text-sm text-green-700 mt-1">
                  When you factor in the additional cost of Acrobat Pro DC ($14.99-$19.99/month) that most Adobe Sign users need for PDF tools, the savings with {BRAND.name} are even more substantial. A typical business with 10 users could save $6,000-$8,400 annually by switching to {BRAND.name}'s all-in-one solution.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Advantages */}
        <div className="bg-[#F7F3EE] rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Advantages of {BRAND.name} over Adobe Sign</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#F5F2EE] rounded-xl p-6">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">All-in-One Solution</h3>
              <p className="text-gray-700">
                {BRAND.name} combines e-signature and PDF tools in one platform, while Adobe requires separate subscriptions for Adobe Sign and Acrobat Pro, resulting in higher costs and fragmented workflows.
              </p>
            </div>
            
            <div className="bg-[#F5F2EE] rounded-xl p-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Free Forever Plan</h3>
              <p className="text-gray-700">
                {BRAND.name} offers a genuinely useful free plan with 10 envelopes per month, full access to PDF tools, and legal templates. Adobe Sign has no permanent free plan, only a limited trial.
              </p>
            </div>
            
            <div className="bg-[#F5F2EE] rounded-xl p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Legal Template Library</h3>
              <p className="text-gray-700">
                {BRAND.name} provides 45+ professionally drafted legal templates that Adobe Sign doesn't offer, saving you thousands in potential legal fees and consultation costs.
              </p>
            </div>
            
            <div className="bg-[#F5F2EE] rounded-xl p-6">
              <div className="w-12 h-12 bg-[#DCFCE7] rounded-full flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-[#155E4B]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Features</h3>
              <p className="text-gray-700">
                {BRAND.name}'s advanced AI capabilities for document generation, field detection, and content analysis outpace Adobe Sign's more limited AI offerings, making document preparation faster and more intuitive.
              </p>
            </div>
            
            <div className="bg-[#F5F2EE] rounded-xl p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">More Affordable Team Features</h3>
              <p className="text-gray-700">
                {BRAND.name} offers team collaboration features at lower price points than Adobe Sign, making advanced workflow capabilities accessible to small and medium-sized businesses.
              </p>
            </div>
            
            <div className="bg-[#F5F2EE] rounded-xl p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Simpler Implementation</h3>
              <p className="text-gray-700">
                {BRAND.name}'s intuitive interface and streamlined onboarding process gets teams up and running in minutes, compared to Adobe Sign's more complex implementation that often requires training.
              </p>
            </div>
          </div>
        </div>

        {/* Customer Testimonials */}
        <div className="bg-[#F7F3EE] rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What Customers Say After Switching</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-[#F5F2EE] rounded-xl p-6">
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
        <div className="bg-[#F7F3EE] rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Easy Migration from Adobe Sign</h2>
          <p className="text-gray-600 mb-6">
            Switching from Adobe Sign to {BRAND.name} is simple with our migration tools and dedicated support.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#F5F2EE] rounded-xl p-6">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-primary-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Import Your Templates</h3>
              <p className="text-gray-700 text-sm">
                Our template converter automatically imports and adapts your existing Adobe Sign templates to work with {BRAND.name}.
              </p>
            </div>
            
            <div className="bg-[#F5F2EE] rounded-xl p-6">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-primary-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Transfer Your Contacts</h3>
              <p className="text-gray-700 text-sm">
                Easily import your contact lists and recipient information to maintain continuity in your document workflows.
              </p>
            </div>
            
            <div className="bg-[#F5F2EE] rounded-xl p-6">
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
        <div className="bg-[#F7F3EE] rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-[#F5F2EE]">
                <h3 className="font-semibold text-gray-900">Is {BRAND.name} as legally binding as Adobe Sign?</h3>
              </div>
              <div className="p-4">
                <p className="text-gray-700">
                  Yes, absolutely. {BRAND.name}'s electronic signatures are equally legally binding and compliant with all major e-signature laws including ESIGN Act, UETA, and eIDAS. Our signatures provide the same level of legal validity and court admissibility as Adobe Sign, with comprehensive audit trails and certificate of completion documentation.
                </p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-[#F5F2EE]">
                <h3 className="font-semibold text-gray-900">Do I need to keep my Adobe Acrobat subscription?</h3>
              </div>
              <div className="p-4">
                <p className="text-gray-700">
                  No, you can cancel your Adobe Acrobat subscription when switching to {BRAND.name}. Our platform includes all the PDF tools you need—editing, conversion, compression, merging, splitting, OCR, and more—as part of your {BRAND.name} subscription. This integration eliminates the need for separate software and results in significant cost savings.
                </p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-[#F5F2EE]">
                <h3 className="font-semibold text-gray-900">How difficult is it to switch from Adobe Sign to {BRAND.name}?</h3>
              </div>
              <div className="p-4">
                <p className="text-gray-700">
                  Switching is remarkably easy. {BRAND.name} provides migration tools to import your templates, contacts, and workflows. Most customers complete their migration in less than a day, and our dedicated migration specialists are available to assist with the transition. We also provide comprehensive training resources to help your team get up to speed quickly.
                </p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-[#F5F2EE]">
                <h3 className="font-semibold text-gray-900">Is {BRAND.name} as secure as Adobe Sign?</h3>
              </div>
              <div className="p-4">
                <p className="text-gray-700">
                  {BRAND.name} implements the same enterprise-grade security measures as Adobe Sign, including 256-bit SSL encryption, SOC 2 Type II certification, GDPR compliance, and tamper-evident seals. We also offer advanced security features like multi-factor authentication, detailed access controls, and comprehensive audit logs. Your documents and data are equally secure with {BRAND.name}.
                </p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-[#F5F2EE]">
                <h3 className="font-semibold text-gray-900">How much can I save by switching from Adobe Sign to {BRAND.name}?</h3>
              </div>
              <div className="p-4">
                <p className="text-gray-700">
                  Most organizations save 60-75% on their document management costs by switching to {BRAND.name}. For example, a business with 10 users on Adobe Sign's Business plan ($49.99/month per user) plus Acrobat Pro ($19.99/month per user) would pay approximately $700/month. The equivalent functionality with {BRAND.name} would cost around $200/month—a savings of $6,000 annually. Additionally, the included legal templates provide even more value and potential cost savings.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-[#260559]/100 to-[#260559]/90 rounded-2xl shadow-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Save Money and Get More Features?</h2>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto mb-8">
            Join thousands of businesses that have switched from Adobe Sign to {BRAND.name} for better features at lower prices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="bg-[#F7F3EE] text-[#260559] hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors shadow-lg hover:shadow-xl text-lg">
              Start Free Forever <ArrowRight className="ml-2 h-5 w-5 inline" />
            </Link>
            <Link to="/contact" className="border-2 border-white text-white hover:bg-[#F7F3EE] hover:text-[#260559] font-semibold py-3 px-8 rounded-lg transition-colors text-lg">
              Schedule Demo
            </Link>
          </div>
          <p className="mt-6 text-primary-100">No credit card required. Free plan includes 10 envelopes/month and all PDF tools.</p>
        </div>
      </div>
    </div>
  );
};

export default DocuSignerVsAdobeSignPage;