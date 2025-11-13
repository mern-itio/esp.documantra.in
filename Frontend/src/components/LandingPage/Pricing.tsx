import { Check, Star, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { subscriptionApi } from '../../services/apiHelper'

interface PlanTemplate {
  _id: string;
  name: string;
  type: 'free' | 'paid';
  monthlyCredits?: number;
  pricePerPeriod: number;
  period: 'monthly' | 'yearly';
  services?: string[];
  description?: string;
}

interface PricingPlan {
  _id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
  color: string;
}

const Pricing = () => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // Use public endpoint that doesn't require authentication
        const res = await subscriptionApi.get('/user-plan/public/all');
        const apiPlans = (res as any).data?.data?.plans || [];
        
        if (!mounted) return;

        if (Array.isArray(apiPlans) && apiPlans.length > 0) {
          // Map API plans to pricing component format
          const mappedPlans: PricingPlan[] = apiPlans.map((plan: PlanTemplate) => {
            const isFree = plan.type === 'free';
            const price = isFree ? '$0' : `$${plan.pricePerPeriod}`;
            const period = isFree ? 'forever' : plan.period === 'yearly' ? 'per year' : 'per month';
            
            // Build features array from plan data
            const features: string[] = [];
            if (plan.monthlyCredits) {
              features.push(`${plan.monthlyCredits === Infinity ? 'Unlimited' : plan.monthlyCredits} credits per month`);
            }
            if (plan.services && plan.services.length > 0) {
              features.push(`Access to: ${plan.services.map((s: string) => s.toUpperCase()).join(', ')}`);
            }
            if (plan.type === 'paid') {
              features.push('Everything in Free plan');
              features.push('Priority support');
              features.push('Advanced features');
            } else {
              features.push('Basic features included');
              features.push('Email support');
            }

            // Determine popular plan (lowest priced paid plan)
            const paidPlans = apiPlans.filter((p: PlanTemplate) => p.type === 'paid');
            const recommendedId = paidPlans.length
              ? paidPlans.reduce((min: PlanTemplate, p: PlanTemplate) => 
                  (p.pricePerPeriod < min.pricePerPeriod ? p : min), paidPlans[0])._id
              : null;
            const popular = plan._id === recommendedId;

            return {
              _id: plan._id,
              name: plan.name,
              price,
              period,
              description: plan.description || (isFree 
                ? 'Perfect for individuals and small teams' 
                : 'Great for growing businesses'),
              features,
              cta: isFree ? 'Start Free' : 'Start 14-day Trial',
              popular,
              color: popular ? 'border-primary-500' : 'border-gray-200'
            };
          });

          setPlans(mappedPlans);
        } else {
          // Fallback to default plans if API returns empty
          setPlans([
            {
              _id: 'free',
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
              _id: 'starter',
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
              _id: 'custom',
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
          ]);
        }
      } catch (error) {
        console.error('Error fetching pricing plans:', error);
        // Fallback to default plans on error
        if (!mounted) return;
        setPlans([
          {
            _id: 'free',
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
            _id: 'starter',
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
            _id: 'custom',
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
        ]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

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

        {loading ? (
          <div className="text-center py-16 text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4">Loading pricing plans...</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {plans.map((plan) => (
              <div
                key={plan._id}
                className={`relative bg-white rounded-2xl shadow-lg border-2 border- p-8 ${plan.popular ? 'transform scale-105' : ''
                  }`} style={{ borderColor: plan.popular ? '#260559' : '#E5E7EB' }}
              >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-[#260559] text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
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
              <Link to={plan.cta === 'Contact Sales' ? '/contact-sales' : '/signup'}>
                <button
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${plan.popular
                    ? 'bg-[#260559] hover:bg-[#1f0448] text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                >
                  {plan.cta}
                </button>
              </Link>
            </div>
            ))}
          </div>
        )}

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
              <Link to="/contact-sales">
                <button className="flex items-center justify-center gap-2 border border-[#260559] text-[#260559] hover:bg-[#f3e8ff] font-semibold text-base px-6 py-3 rounded-md transition-all duration-200">
                  Schedule a Demo
                  <ArrowRight className="h-4 w-4 align-middle" />
                </button>
              </Link>

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

        {/* <div className="text-center mt-12">
          <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base px-6 py-3 rounded-md shadow-md transition duration-200 mx-auto">
            Compare All Plans
            <ArrowRight className="h-4 w-4 align-middle" />
          </button>

        </div> */}
      </div>
    </section>
  )
}

export default Pricing