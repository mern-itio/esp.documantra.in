import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Shield, ArrowRight, CheckCircle,
  Scale, Home, UserCheck, DollarSign, Code, TrendingUp, Building, Award, BookOpen, Heart, Users, Briefcase, FileCheck
} from 'lucide-react';

const UseCasesPage = () => {
  const location = useLocation();

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

  useEffect(() => {
    const hash = (location.hash || '').replace('#', '');
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [location.hash]);

  // Scroll to top on initial load or when no hash is present
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname]);

  const industries = [
    {
      category: 'Business & Legal',
      items: [
        { title: 'Legal Firms', description: 'Contract management and client agreements', icon: Scale },
        { title: 'Real Estate', description: 'Property transactions and lease agreements', icon: Home },
        { title: 'Healthcare', description: 'Patient forms and compliance documents', icon: UserCheck },
        { title: 'Financial Services', description: 'Loan applications and financial agreements', icon: DollarSign },
      ]
    },
    {
      category: 'Technology & Enterprise',
      items: [
        { title: 'Software Companies', description: 'NDAs, employment contracts, and partnerships', icon: Code },
        { title: 'Startups', description: 'Investor agreements and employee onboarding', icon: TrendingUp },
        { title: 'Enterprise', description: 'Large-scale document workflows', icon: Building },
        { title: 'Government', description: 'Public sector document management', icon: Award },
      ]
    },
    {
      category: 'Education & Non-Profit',
      items: [
        { title: 'Educational Institutions', description: 'Student forms and administrative documents', icon: BookOpen },
        { title: 'Non-Profit Organizations', description: 'Volunteer agreements and donor forms', icon: Heart },
        { title: 'Consulting', description: 'Client contracts and project agreements', icon: Users },
        { title: 'Freelancers', description: 'Service agreements and invoicing', icon: Briefcase },
      ]
    }
  ];

  const useCases = [
    { title: 'Contract Management', description: 'End-to-end contract lifecycle', icon: FileCheck },
    { title: 'Employee Onboarding', description: 'HR documents and forms', icon: Users },
    { title: 'Client Agreements', description: 'Service and partnership agreements', icon: Briefcase },
    { title: 'Compliance Documentation', description: 'Regulatory and audit documents', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-white pt-24">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-primary-50 to-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Explore Use Cases
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Real-world ways teams use Draft&Sign to create, manage, and sign documents faster.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/signup" className="btn-primary inline-flex items-center justify-center gap-2" style={{backgroundColor: '#260559'}}>
                Start Free Forever
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/contact-sales" className="btn-secondary inline-flex items-center justify-center" style={{borderColor: '#260559', color: '#260559'}}>
                Talk to Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-16 bg-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Industries We Serve</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tailored solutions for your sector, with compliance and security built-in.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {industries.map((group) => (
              <div key={group.category} className="bg-white rounded-xl p-6 shadow-md border border-gray-100 card-hover hover:border-primary-500 hover:shadow-xl cursor-pointer">
                <h3 id={slugify(group.category)} className="text-xl font-semibold text-gray-900 mb-4">{group.category}</h3>
                <div className="space-y-4">
                  {group.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-[#E6E0F0] rounded-lg flex items-center justify-center flex-shrink-0">
                        <item.icon className="h-6 w-6 text-[#260559]" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{item.title}</div>
                        <div className="text-gray-600 text-sm">{item.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Use Cases</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Solve high-impact workflows with ready-to-use tools and templates.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((uc, index) => (
              <div id={slugify(uc.title)} key={index} className="border border-gray-100 card-hover hover:border-primary-500 hover:shadow-xl cursor-pointer bg-white rounded-xl p-6 shadow-md">
                <div className="w-12 h-12 bg-[#E6E0F0] rounded-lg flex items-center justify-center mb-4">
                  <uc.icon className="h-6 w-6 text-[#260559]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{uc.title}</h3>
                <p className="text-gray-600">{uc.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#260559] to-[#3a0a7e] text-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to streamline your workflows?</h2>
            <p className="text-xl text-[#CBB9FF] mb-8 leading-relaxed">
              Join thousands using Draft&Sign across industries to complete documents faster and more securely.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/signup" className="bg-white text-[#260559] hover:bg-gray-100 font-semibold py-4 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-lg">
                Start Free Forever <ArrowRight className="ml-2 h-5 w-5 inline" />
              </Link>
              <Link to="/contact-sales" className="border-2 border-white text-white hover:bg-white hover:text-[#260559] font-semibold py-4 px-8 rounded-lg transition-all duration-200 text-lg">
                Schedule Demo
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
    </div>
  );
};

export default UseCasesPage;


