import { 
  Building, 
  Scale, 
  GraduationCap, 
  Heart, 
  Briefcase, 
  Building2,
  ShieldCheck,
  Car,
  ArrowRight
} from 'lucide-react';
import { Button } from '../DocumentService/ui/button';

const IndustriesSection = () => {
  const industries = [
    {
      icon: Building,
      title: 'Real Estate',
      description: 'Simplify property documentation workflows with secure digital signing and document management. Enable faster agreement execution, smoother approvals, and organized record handling accessible anytime, anywhere.',
      useCases: ['Lease Agreements', 'Purchase Contracts', 'Property Disclosures'],
    },
    {
      icon: Scale,
      title: 'Legal Services',
      description: 'Digitally prepare, send, and manage legal documents with secure signing workflows and detailed activity logs. Improve turnaround time while maintaining process transparency and document integrity.',
      useCases: ['Client Retainers', 'Affidavits', 'Settlement Agreements'],
    },
    {
      icon: GraduationCap,
      title: 'Education',
      description: 'Digitize academic documentation and approval processes with easy-to-use digital signing and form management. Enable institutions, students, and parents to complete documentation remotely and efficiently.',
      useCases: ['Enrollment Forms', 'Permission Slips', 'Transcript Requests'],
    },
    {
      icon: Heart,
      title: 'Healthcare',
      description: 'Manage patient documentation digitally with secure access controls and streamlined approval flows. Improve operational efficiency while maintaining privacy-focused document handling.',
      useCases: ['Consent Forms', 'Insurance Claims', 'Medical Records'],
    },
    {
      icon: Briefcase,
      title: 'Human Resources',
      description: 'Automate employee documentation workflows from onboarding to exit processes. Digitally issue, sign, and manage HR documents with structured record keeping and process tracking.',
      useCases: ['Offer Letters', 'Employment Contracts', 'Policy Documents'],
    },
    {
      icon: Building2,
      title: 'Financial Services',
      description: 'Streamline documentation for financial processes with secure identity-based workflows and digital signing. Reduce paperwork, improve turnaround time, and simplify customer onboarding.',
      useCases: ['Loan Agreements', 'Account Forms', 'Investment Documents'],
    },
    {
      icon: ShieldCheck,
      title: 'Insurance',
      description: 'Digitally manage policy documentation, claims, and renewals with structured workflows. Enhance customer experience through faster processing and simplified approvals.',
      useCases: ['Policy Applications', 'Claims Forms', 'Renewal Documents'],
    },
    {
      icon: Car,
      title: 'Automotive',
      description: 'Enable faster documentation workflows for sales, servicing, and warranty processes. Allow customers to complete paperwork digitally from showroom or remote locations.',
      useCases: ['Sales Contracts', 'Service Agreements', 'Warranty Forms'],
    },
  ];

  return (
    <section id="industries" className="py-10 bg-card relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          
          <h2 className="heading">
            Tailored for Your
            <span className="text-primary"> Industry</span>
          </h2>

          <p className="text-lg text-muted-foreground leading-relaxed details-text">
            Every industry has unique document requirements. Our platform adapts to your specific 
            workflows, compliance needs, and business processes whether you're closing real estate 
            deals or processing healthcare consent forms.
          </p>
        </div>

        {/* Industries Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {industries.map((industry, index) => (
            <div 
              key={index}
              className="paper-card  p-4 hover-lift group cursor-pointer"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <industry.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>

              <h3 className="font-display font-semibold text-lg text-foreground mb-3">
                {industry.title}
              </h3>

              <p className="text-[12px] details-text mb-4">
                {industry.description}
              </p>

              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">Common Use Cases:</p>
                <div className="flex flex-wrap gap-2">
                  {industry.useCases.map((useCase, ucIndex) => (
                    <span 
                      key={ucIndex}
                      className="text-xs bg-secondary px-2 py-1 rounded-full text-muted-foreground"
                    >
                      {useCase}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Don't see your industry? We customize solutions for any sector.
          </p>
          <Button variant="new" className="group">
            Contact Us for Custom Solutions
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default IndustriesSection;
