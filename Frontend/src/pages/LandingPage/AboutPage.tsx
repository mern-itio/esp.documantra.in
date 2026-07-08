import React from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  Heart,
  Shield,
  Zap,
  Globe,
  Award,
  Rocket,
  CheckCircle2,
  FileText,
  Code,
  Sparkles,
  Building,
  Star,
  Mail,
  Calendar,
  Lightbulb,
  Handshake,
  Eye,
  Server,
  Database,
} from 'lucide-react';

const AboutPage: React.FC = () => {
  const stats = [
    { number: '500,000+', label: 'Documents Created', icon: FileText },
    { number: '50,000+', label: 'Businesses Trust Us', icon: Building },
    { number: '40+', label: 'Countries Supported', icon: Globe },
    { number: '4.9/5', label: 'Customer Rating', icon: Star },
  ];

  const values = [
    {
      icon: Shield,
      title: 'Security First',
      description: 'We prioritize the security and privacy of your documents above all else, implementing bank-level encryption and compliance standards.',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'We continuously innovate to bring you cutting-edge AI-powered features that simplify document management and accelerate workflows.',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Heart,
      title: 'User-Centric',
      description: 'Every feature we build is designed with our users in mind, ensuring an intuitive and seamless experience for everyone.',
      color: 'from-pink-500 to-pink-600',
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'We believe in making document management accessible worldwide, with compliance across 40+ countries and multilingual support.',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: Handshake,
      title: 'Transparency',
      description: 'We maintain complete transparency in our operations, pricing, and data handling practices to build trust with our users.',
      color: 'from-orange-500 to-orange-600',
    },
    {
      icon: Lightbulb,
      title: 'Excellence',
      description: 'We strive for excellence in every aspect of our platform, from user experience to technical performance and customer support.',
      color: 'from-emerald-500 to-emerald-600',
    },
  ];

  const milestones = [
    {
      year: '2020',
      title: 'The Beginning',
      description: 'DocuMantra was founded with a vision to revolutionize document management and e-signatures.',
      icon: Rocket,
    },
    {
      year: '2021',
      title: 'Platform Launch',
      description: 'Launched our comprehensive platform with e-signature capabilities and basic PDF tools.',
      icon: Zap,
    },
    {
      year: '2022',
      title: 'Global Expansion',
      description: 'Expanded compliance to 40+ countries and reached 10,000+ active users.',
      icon: Globe,
    },
    {
      year: '2023',
      title: 'AI Integration',
      description: 'Introduced AI-powered document generation and smart field detection features.',
      icon: Sparkles,
    },
    {
      year: '2024',
      title: 'Major Milestone',
      description: 'Reached 50,000+ businesses and 500,000+ documents processed, becoming a trusted platform worldwide.',
      icon: Award,
    },
  ];

  const technologies = [
    { name: 'React 18', description: 'Modern frontend framework', icon: Code },
    { name: 'Node.js', description: 'Scalable backend infrastructure', icon: Server },
    { name: 'MongoDB', description: 'Flexible database solutions', icon: Database },
    { name: 'Docker', description: 'Containerized deployments', icon: Server },
    { name: 'TypeScript', description: 'Type-safe development', icon: Code },
    { name: 'Microservices', description: 'Modular architecture', icon: Server },
  ];

  return (
    <div className="min-h-screen mt-12 bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <style>{`
        .prose ul > li::before {
          content: none !important;
          display: none !important;
        }
        .prose ul {
          list-style: none !important;
          padding-left: 0 !important;
        }
        .prose ol > li::before {
          content: none !important;
          display: none !important;
        }
      `}</style>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#260559] to-blue-700 text-white py-20">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#F7F3EE]/20 rounded-full mb-6">
              <Building className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About DocuMantra</h1>
            <p className="text-xl text-blue-100 mb-8">
              Empowering businesses worldwide with secure, intelligent document management and e-signature solutions
            </p>
          </div>
        </div>
      </section>

      <div className="container-max px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto space-y-16">
          {/* Mission & Vision */}
          <section className="grid md:grid-cols-2 gap-8">
            <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <Target className="w-6 h-6 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                To democratize document management and e-signatures by providing a comprehensive, secure, and accessible platform that empowers businesses and individuals to create, manage, and sign documents effortlessly. We believe that document workflows should be simple, secure, and accessible to everyone, regardless of their technical expertise or budget.
              </p>
            </div>

            <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Our Vision</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                To become the world's most trusted and comprehensive document management platform, recognized for innovation, security, and user-centric design. We envision a future where businesses can handle all their document needs in one place, with AI-powered assistance that makes complex workflows simple and intuitive.
              </p>
            </div>
          </section>

          {/* Statistics */}
          <section>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Impact</h2>
              <p className="text-lg text-gray-600">Trusted by businesses worldwide</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6 text-center cursor-pointer hover:border-blue-500">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-lg mb-4">
                      <Icon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Our Story */}
          <section className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[#DCFCE7] rounded-lg">
                <FileText className="w-6 h-6 text-[#155E4B]" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Our Story</h2>
            </div>
            <div className="w-full">
              <p className="text-gray-600 leading-relaxed mb-4 text-base">
                DocuMantra was born from a simple observation: businesses were struggling with fragmented document workflows, juggling multiple tools for PDF editing, document creation, and e-signatures. This complexity was costing them time, money, and efficiency.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4 text-base">
                We set out to create an all-in-one platform that would eliminate these pain points. Our journey began with a focus on making e-signatures accessible and legally compliant across multiple jurisdictions. As we grew, we recognized that signing documents was just one part of the document lifecycle.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4 text-base">
                Today, DocuMantra offers a comprehensive suite of tools including 30+ PDF manipulation tools, 45+ legal document templates, AI-powered document generation, and enterprise-grade security—all in one integrated platform. We've helped over 50,000 businesses streamline their document workflows and process over 500,000 documents.
              </p>
              <p className="text-gray-600 leading-relaxed text-base">
                Our commitment to innovation, security, and user experience continues to drive us forward as we build the future of document management.
              </p>
            </div>
          </section>

          {/* Values */}
          <section>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Core Values</h2>
              <p className="text-lg text-gray-600">The principles that guide everything we do</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {values.map((value, idx) => {
                const Icon = value.icon;
                return (
                  <div key={idx} className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:border-blue-500">
                    <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${value.color} rounded-lg mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Timeline */}
          <section className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Our Journey</h2>
            </div>
            <div className="space-y-8">
              {milestones.map((milestone, idx) => {
                const Icon = milestone.icon;
                return (
                  <div key={idx} className="flex gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Icon className="w-8 h-8 text-emerald-600" />
                      </div>
                      {idx < milestones.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mx-auto mt-2" style={{ height: 'calc(100% + 2rem)' }}></div>
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <div className="text-sm font-semibold text-emerald-600 mb-1">{milestone.year}</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{milestone.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{milestone.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Technology */}
          <section>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Built on Modern Technology</h2>
              <p className="text-lg text-gray-600">Leveraging cutting-edge technologies for reliability and performance</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {technologies.map((tech, idx) => {
                const Icon = tech.icon;
                return (
                  <div key={idx} className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:border-blue-500">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <Icon className="w-6 h-6 text-gray-700" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{tech.name}</h3>
                        <p className="text-sm text-gray-600">{tech.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Why Choose Us */}
          <section className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-8 border border-emerald-200">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose DocuMantra?</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#F7F3EE] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Comprehensive Solution</h3>
                <ul className="space-y-2 !list-none">
                  <li className="flex items-start gap-2 text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>All-in-one platform eliminates the need for multiple tools</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>30+ free PDF tools included at no extra cost</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>45+ legal document templates to save time and money</span>
                  </li>
                </ul>
              </div>
              <div className="bg-[#F7F3EE] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Enterprise-Grade Security</h3>
                <ul className="space-y-2 !list-none">
                  <li className="flex items-start gap-2 text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Bank-level encryption and security standards</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Compliant with GDPR, CCPA, and SOC 2 Type II</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Legally binding in 40+ countries worldwide</span>
                  </li>
                </ul>
              </div>
              <div className="bg-[#F7F3EE] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Innovation & AI</h3>
                <ul className="space-y-2 !list-none">
                  <li className="flex items-start gap-2 text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>AI-powered document generation from simple prompts</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Smart field detection and auto-fill capabilities</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Continuous innovation and feature updates</span>
                  </li>
                </ul>
              </div>
              <div className="bg-[#F7F3EE] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Value & Affordability</h3>
                <ul className="space-y-2 !list-none">
                  <li className="flex items-start gap-2 text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Free forever plan with 10 envelopes monthly</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>50-70% cost savings compared to competitors</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>No hidden fees or credit card required to start</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Call to Action */}
          <section className="bg-gradient-to-r from-[#260559] to-blue-700 rounded-xl p-8 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Join Us on Our Journey</h2>
            <p className="text-xl text-blue-100 mb-6">
              Experience the future of document management with DocuMantra
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#F7F3EE] text-[#260559] rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <Rocket className="w-5 h-5" />
                Get Started Free
              </Link>
              <Link
                to="/contact-sales"
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-[#F7F3EE]/10 transition-colors"
              >
                <Mail className="w-5 h-5" />
                Contact Sales
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;

