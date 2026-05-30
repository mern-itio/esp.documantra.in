import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, FormInput, Store, Zap, Sparkles } from 'lucide-react';

export const QuickActions: React.FC = () => {
  const actions = [
    {
      title: 'Create Template', 
      description: 'Design a new document template',
      icon: Plus,
      path: '/template/designer',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'AI Template Studio',
      description: 'Generate templates with AI assistance',
      icon: Sparkles,
      path: '/template/ai-studio',
      color: 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600',
      isNew: true
    },
    {
      title: 'Build Form',
      description: 'Create interactive form template',
      icon: FormInput,
      path: '/template/form-builder',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Browse Templates',
      description: 'Explore template marketplace',
      icon: Store,
      path: '/template/marketplace',
      color: 'bg-[#F0FDF4]0 hover:bg-purple-600'
    },
    {
      title: 'Setup Automation',
      description: 'Configure workflow automation',
      icon: Zap,
      path: '/template/automation',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <Link
            key={index}
            to={action.path}
            className="group bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-1 relative"
          >
            {action.isNew && (
              <div className="absolute -top-2 -right-2 px-2 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold rounded-full">
                NEW
              </div>
            )}
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white mb-4 transition-colors ${action.color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-gray-700">
              {action.title}
            </h3>
            <p className="text-sm text-gray-600">{action.description}</p>
          </Link>
        );
      })}
    </div>
  );
};