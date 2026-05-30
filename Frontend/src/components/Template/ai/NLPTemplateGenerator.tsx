import React, { useState } from 'react';
import { MessageSquare, Wand2, FileText, Loader, CheckCircle, AlertCircle } from 'lucide-react';

interface GeneratedTemplate {
  id: string;
  name: string;
  structure: {
    sections: Array<{
      name: string;
      fields: string[];
    }>;
  };
  aiConfidence: number;
  improvementSuggestions: string[];
}

interface NLPTemplateGeneratorProps {
  onTemplateGenerated: (template: GeneratedTemplate) => void;
}

export const NLPTemplateGenerator: React.FC<NLPTemplateGeneratorProps> = ({
  onTemplateGenerated
}) => {
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState<GeneratedTemplate | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedComplexity, setSelectedComplexity] = useState<'simple' | 'medium' | 'complex'>('medium');

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Legal', 'Education', 
    'Manufacturing', 'Retail', 'Real Estate', 'Consulting', 'Other'
  ];

  const examplePrompts = [
    "Create an employment contract template for software engineers with competitive salary, benefits, and remote work options",
    "Generate a non-disclosure agreement for technology companies working with external contractors",
    "Build a sales proposal template for consulting services with project timeline and pricing",
    "Create a vendor agreement template for e-commerce businesses with payment terms and deliverables"
  ];

  const generateTemplate = async () => {
    if (!userInput.trim()) return;

    setIsGenerating(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Mock AI-generated template based on input
    const mockTemplate: GeneratedTemplate = {
      id: `ai_template_${Date.now()}`,
      name: extractTemplateName(userInput),
      structure: {
        sections: generateSections(userInput)
      },
      aiConfidence: Math.random() * 20 + 80, // 80-100%
      improvementSuggestions: generateSuggestions(userInput)
    };

    setGeneratedTemplate(mockTemplate);
    setIsGenerating(false);
  };

  const extractTemplateName = (input: string): string => {
    if (input.toLowerCase().includes('employment') || input.toLowerCase().includes('contract')) {
      return 'AI-Generated Employment Contract';
    } else if (input.toLowerCase().includes('nda') || input.toLowerCase().includes('disclosure')) {
      return 'AI-Generated NDA Agreement';
    } else if (input.toLowerCase().includes('sales') || input.toLowerCase().includes('proposal')) {
      return 'AI-Generated Sales Proposal';
    } else if (input.toLowerCase().includes('vendor') || input.toLowerCase().includes('supplier')) {
      return 'AI-Generated Vendor Agreement';
    }
    return 'AI-Generated Template';
  };

  const generateSections = (input: string) => {
    const baseSection = [
      { name: 'Header Information', fields: ['company_name', 'date', 'document_title'] }
    ];

    if (input.toLowerCase().includes('employment') || input.toLowerCase().includes('contract')) {
      return [
        ...baseSection,
        { name: 'Employee Information', fields: ['employee_name', 'address', 'phone', 'email'] },
        { name: 'Position Details', fields: ['job_title', 'department', 'start_date', 'salary'] },
        { name: 'Benefits & Compensation', fields: ['health_insurance', 'vacation_days', 'retirement_plan'] },
        { name: 'Terms & Conditions', fields: ['employment_type', 'probation_period', 'termination_clause'] },
        { name: 'Signatures', fields: ['employee_signature', 'employer_signature', 'date_signed'] }
      ];
    } else if (input.toLowerCase().includes('nda')) {
      return [
        ...baseSection,
        { name: 'Parties Information', fields: ['disclosing_party', 'receiving_party', 'effective_date'] },
        { name: 'Confidential Information', fields: ['definition', 'scope', 'exclusions'] },
        { name: 'Obligations', fields: ['non_disclosure', 'non_use', 'return_of_materials'] },
        { name: 'Term & Termination', fields: ['duration', 'survival_clause', 'termination_conditions'] },
        { name: 'Signatures', fields: ['party1_signature', 'party2_signature', 'witness_signature'] }
      ];
    } else if (input.toLowerCase().includes('sales') || input.toLowerCase().includes('proposal')) {
      return [
        ...baseSection,
        { name: 'Client Information', fields: ['client_name', 'contact_person', 'client_address'] },
        { name: 'Project Overview', fields: ['project_description', 'objectives', 'deliverables'] },
        { name: 'Timeline & Milestones', fields: ['start_date', 'end_date', 'key_milestones'] },
        { name: 'Pricing & Payment', fields: ['total_cost', 'payment_schedule', 'payment_terms'] },
        { name: 'Acceptance', fields: ['client_signature', 'vendor_signature', 'acceptance_date'] }
      ];
    }

    return [
      ...baseSection,
      { name: 'Content Section', fields: ['main_content', 'additional_terms'] },
      { name: 'Signatures', fields: ['signature1', 'signature2', 'date'] }
    ];
  };

  const generateSuggestions = (input: string): string[] => {
    const suggestions = [
      'Consider adding a dispute resolution clause',
      'Include intellectual property protection terms',
      'Add compliance and regulatory requirements',
      'Consider multi-language support for international use'
    ];

    if (input.toLowerCase().includes('employment')) {
      return [
        'Add intellectual property assignment clause',
        'Include termination procedures and notice periods',
        'Consider adding equity compensation options',
        'Add remote work policy details'
      ];
    } else if (input.toLowerCase().includes('nda')) {
      return [
        'Specify jurisdiction for legal disputes',
        'Add digital signature compliance',
        'Include data protection and GDPR compliance',
        'Consider adding liquidated damages clause'
      ];
    }

    return suggestions;
  };

  const useTemplate = () => {
    if (generatedTemplate) {
      onTemplateGenerated(generatedTemplate);
      setGeneratedTemplate(null);
      setUserInput('');
    }
  };

  return (
    <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-4">
          <Wand2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">AI Template Generator</h2>
          <p className="text-sm text-gray-600">Describe your template needs in natural language</p>
        </div>
      </div>

      {/* Input Section */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Describe your template requirements
          </label>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
            placeholder="Example: Create an employment contract template for software engineers with competitive salary, benefits, and remote work options..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select industry...</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Complexity</label>
            <select
              value={selectedComplexity}
              onChange={(e) => setSelectedComplexity(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="simple">Simple</option>
              <option value="medium">Medium</option>
              <option value="complex">Complex</option>
            </select>
          </div>
        </div>

        <button
          onClick={generateTemplate}
          disabled={!userInput.trim() || isGenerating}
          className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Generating Template...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Generate Template
            </>
          )}
        </button>
      </div>

      {/* Example Prompts */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Example prompts:</h3>
        <div className="space-y-2">
          {examplePrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => setUserInput(prompt)}
              className="w-full text-left p-3 text-sm text-gray-600 bg-[#F5F2EE] hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Generated Template Preview */}
      {generatedTemplate && (
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-medium text-gray-900">Generated Template</h3>
            <div className="flex items-center space-x-2">
              <div className="flex items-center text-sm text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                {generatedTemplate.aiConfidence.toFixed(1)}% confidence
              </div>
            </div>
          </div>

          <div className="bg-[#F5F2EE] rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-2">{generatedTemplate.name}</h4>
            <div className="space-y-2">
              {generatedTemplate.structure.sections.map((section, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium text-gray-700">{section.name}:</span>
                  <span className="text-gray-600 ml-2">
                    {section.fields.join(', ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {generatedTemplate.improvementSuggestions.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1 text-amber-500" />
                AI Suggestions for Improvement:
              </h4>
              <ul className="space-y-1">
                {generatedTemplate.improvementSuggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <button
              onClick={useTemplate}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
            >
              <FileText className="w-4 h-4 mr-2" />
              Use This Template
            </button>
            <button
              onClick={() => setGeneratedTemplate(null)}
              className="px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-md"
            >
              Generate Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
};