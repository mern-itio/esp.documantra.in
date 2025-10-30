import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, PieChart, Users, Shield, FileText, Settings, Layers, ArrowRight, CheckCircle } from 'lucide-react';

const WorkspacePage = () => {
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

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname]);

  const analyticsInsights = [
    { title: 'Document Analytics', description: 'Track document performance', icon: BarChart3 },
    { title: 'Signing Metrics', description: 'Monitor signing completion rates', icon: PieChart },
    { title: 'User Activity', description: 'Team usage and engagement', icon: Users },
    { title: 'Compliance Reports', description: 'Audit trails and compliance data', icon: Shield },
  ];

  const managementTools = [
    { title: 'Team Management', description: 'Manage users and permissions', icon: Users },
    { title: 'Template Library', description: 'Organize and share templates', icon: FileText },
    { title: 'Workflow Automation', description: 'Automate document processes', icon: Settings },
    { title: 'Integration Hub', description: 'Connect with your favorite tools', icon: Layers },
  ];

  return (
    <div className="min-h-screen bg-white pt-24">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-primary-50 to-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Workspace</h1>
            <p className="text-xl text-gray-600 mb-8">
              Powerful analytics and management tools to run your document operations at scale.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/signup" className="btn-primary inline-flex items-center justify-center gap-2">
                Start Free Forever
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/contact-sales" className="btn-secondary inline-flex items-center justify-center">
                Talk to Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics & Insights */}
      <section className="py-16 bg-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Analytics & Insights</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Make data-driven decisions with real-time analytics and visibility across your workflows.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {analyticsInsights.map((item, index) => (
              <div id={slugify(item.title)} key={index} className="border border-gray-100 card-hover hover:border-primary-500 hover:shadow-xl cursor-pointer bg-white rounded-xl p-6 shadow-md">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <item.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Management Tools */}
      <section className="py-16 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Management Tools</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Control access, automate processes, and integrate with your stack.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {managementTools.map((item, index) => (
              <div id={slugify(item.title)} key={index} className="border border-gray-100 card-hover hover:border-primary-500 hover:shadow-xl cursor-pointer bg-white rounded-xl p-6 shadow-md">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <item.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-700 text-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Bring your workspace to the next level</h2>
            <p className="text-xl text-primary-100 mb-8 leading-relaxed">
              Get full visibility and control over your documents, teams, and workflows.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/signup" className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-4 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-lg">
                Start Free Forever <ArrowRight className="ml-2 h-5 w-5 inline" />
              </Link>
              <Link to="/contact-sales" className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold py-4 px-8 rounded-lg transition-all duration-200 text-lg">
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

export default WorkspacePage;


