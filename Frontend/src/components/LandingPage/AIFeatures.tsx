import { 
  Sparkles, 
  Send, 
  FormInput,
  CheckCircle2,
  ArrowRight,
  Wand2,
  FileSearch
} from 'lucide-react';
import { Button } from '../DocumentService/ui/button';

const AIFeatures = () => {
  const aiFeatures = [
    {
      icon: FileSearch,
      title: 'Document Summarization',
      description: 'Transform lengthy documents into concise summaries. Our AI extracts key points, important clauses, and critical information so you can understand any document in seconds.',
      benefits: ['Save hours of reading time', 'Never miss important details', 'Multi-language support'],
    },
    {
      icon: Sparkles,
      title: 'Content Generation',
      description: 'Generate professional document content, clauses, and templates with AI assistance. From legal agreements to business proposals, create polished content effortlessly.',
      benefits: ['Industry-specific templates', 'Customizable tone & style', 'Grammar-perfect output'],
    },
    {
      icon: Send,
      title: 'Smart Document Sending',
      description: 'AI optimizes your document delivery with intelligent recipient suggestions, optimal send times, and automated follow-ups to ensure documents reach the right people.',
      benefits: ['Auto-detect recipients', 'Schedule optimal delivery', 'Track engagement'],
    },
    {
      icon: FormInput,
      title: 'Smart Form Filling',
      description: 'Automatically populate form fields by extracting information from existing documents or databases. Reduce manual entry errors and accelerate your workflows.',
      benefits: ['Auto-extract data', 'Validate entries instantly', 'Learn from patterns'],
    },
  ];

  return (
    <section id="ai-solutions" className="py-10 bg-card relative overflow-hidden">
      {/* <div
        className="pointer-events-none absolute inset-0 bg-[url('/auto4.jpg')] bg-cover bg-center opacity-100 md:opacity-10"
        aria-hidden="true"
      /> */}
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-0 w-96 h-96 backdropColor rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 backdropColor rounded-full blur-3xl" />
      </div>

      <div className="container-max mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mx-auto mb-16">
         

          <h2 className="heading">
            Work Smarter with
            <span className="max-w-4xl primary"> AI Automation</span>
          </h2>

          <p className="text-lg text-muted-foreground leading-relaxed details-text">
            Harness the power of artificial intelligence to automate tedious tasks, extract insights 
            from documents, and streamline your entire document workflow. Our AI understands context, 
            learns from patterns, and delivers results that match human intelligence.
          </p>
        </div>

        {/* AI Features */}
        <div className="space-y-8 max-w-7xl mx-auto">
          {aiFeatures.map((feature, index) => (
            <div 
              key={index}
              className={`grid lg:grid-cols-2 gap-8 items-start ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
            >
              {/* Content */}
              <div className={`${index % 2 === 1 ? 'lg:order-2' : ''} animate-fade-in-up ` }>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 primary rounded-xl flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-2xl text-foreground">
                    {feature.title}
                  </h3>
                </div>
                
                <p className="details-text mb-6 ">
                  {feature.description}
                </p>

                <div className="space-y-3">
                  {feature.benefits.map((benefit, bIndex) => (
                    <div key={bIndex} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-success rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-success" />
                      </div>
                      <span className="text-foreground font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual Card */}
              <div
                className={ 
                  index % 2 === 1
                    ? 'ai-feature-visual-wrapper ai-feature-visual-wrapper-reverse'
                    : 'ai-feature-visual-wrapper'
                }
              >
                <div className="ai-feature-card">
                  {/* Top header skeleton */}
                  <div className="ai-feature-card-header">
                    <div className="ai-feature-card-header-icon">
                      <Wand2 className="ai-feature-card-header-icon-svg" />
                    </div>
                    <div className="ai-feature-card-header-lines">
                      <div className="ai-feature-card-header-line ai-feature-card-header-line-primary" />
                      <div className="ai-feature-card-header-line ai-feature-card-header-line-secondary" />
                    </div>
                  </div>

                  {/* Processing block */}
                  <div className="ai-feature-processing-block">
                    <div className="ai-feature-processing-header">
                      <div className="ai-feature-processing-dot" />
                      <span className="ai-feature-processing-label">AI Processing</span>
                    </div>
                    <div className="ai-feature-processing-bars">
                      <div className="ai-feature-processing-bar ai-feature-processing-bar-1" />
                      <div className="ai-feature-processing-bar ai-feature-processing-bar-2" />
                      <div className="ai-feature-processing-bar ai-feature-processing-bar-3" />
                    </div>
                  </div>

                  {/* Status footer */}
                  <div className="ai-feature-status-row">
                    <div className="ai-feature-status-left">
                      <CheckCircle2 className="ai-feature-status-icon" />
                      <span className="ai-feature-status-text">Analysis Complete</span>
                    </div>
                    <span className="ai-feature-status-time">1.2s</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Button className="btn-hero bgColor group">
            Explore AI Features
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default AIFeatures;
