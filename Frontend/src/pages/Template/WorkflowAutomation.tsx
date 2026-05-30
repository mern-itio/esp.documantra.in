import React from 'react';
import { 
  Zap, 
  Plus, 
  Play, 
  Pause, 
  Settings, 
  Trash2, 
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  FileText,
  Mail,
  Database
} from 'lucide-react';

export const WorkflowAutomation: React.FC = () => {

  const workflows = [
    {
      id: '1',
      name: 'Employee Onboarding Automation',
      description: 'Automatically generate and send employment contracts when new employees are added',
      status: 'active',
      trigger: 'New Employee Added',
      template: 'Employment Contract Template',
      recipients: 'HR Team, New Employee',
      lastRun: '2 hours ago',
      runs: 45,
      successRate: 98.2
    },
    {
      id: '2',
      name: 'Monthly Invoice Generation',
      description: 'Generate and send invoices to clients on the first day of each month',
      status: 'active',
      trigger: 'Monthly Schedule',
      template: 'Invoice Template',
      recipients: 'All Active Clients',
      lastRun: '1 day ago',
      runs: 234,
      successRate: 96.8
    },
    {
      id: '3',
      name: 'NDA Request Processing',
      description: 'Process NDA requests and send agreements to potential partners',
      status: 'paused',
      trigger: 'Form Submission',
      template: 'NDA Agreement',
      recipients: 'Legal Team, Requester',
      lastRun: '5 days ago',
      runs: 67,
      successRate: 94.1
    },
    {
      id: '4',
      name: 'Contract Renewal Reminders',
      description: 'Send contract renewal reminders 30 days before expiration',
      status: 'active',
      trigger: 'Contract Expiry Date',
      template: 'Renewal Notice Template',
      recipients: 'Account Managers, Clients',
      lastRun: '6 hours ago',
      runs: 123,
      successRate: 99.1
    }
  ];

  const workflowSteps = [
    {
      id: '1',
      type: 'trigger',
      title: 'Trigger Event',
      description: 'New employee added to HR system',
      icon: Zap,
      color: 'green'
    },
    {
      id: '2',
      type: 'template',
      title: 'Generate Document',
      description: 'Create employment contract from template',
      icon: FileText,
      color: 'blue'
    },
    {
      id: '3',
      type: 'email',
      title: 'Send Email',
      description: 'Email contract to HR and employee',
      icon: Mail,
      color: 'purple'
    },
    {
      id: '4',
      type: 'database',
      title: 'Update Records',
      description: 'Log contract generation in database',
      icon: Database,
      color: 'orange'
    }
  ];

  const recentRuns = [
    {
      id: '1',
      workflow: 'Employee Onboarding Automation',
      status: 'success',
      time: '2 hours ago',
      duration: '1.2s',
      trigger: 'New Employee: Sarah Johnson'
    },
    {
      id: '2',
      workflow: 'Monthly Invoice Generation',
      status: 'success',
      time: '1 day ago',
      duration: '15.3s',
      trigger: 'Monthly Schedule'
    },
    {
      id: '3',
      workflow: 'Contract Renewal Reminders',
      status: 'success',
      time: '6 hours ago',
      duration: '0.8s',
      trigger: 'Contract Expiry: ACME Corp'
    },
    {
      id: '4',
      workflow: 'Employee Onboarding Automation',
      status: 'failed',
      time: '1 day ago',
      duration: '2.1s',
      trigger: 'New Employee: Mike Chen'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Workflow Automation</h1>
          <p className="text-gray-600">Automate your document workflows and processes</p>
        </div>
        <button className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
          <Plus className="w-4 h-4 mr-2" />
          Create Workflow
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active Workflows</p>
              <p className="text-lg font-semibold text-gray-900">12</p>
            </div>
          </div>
        </div>
        <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Successful Runs</p>
              <p className="text-lg font-semibold text-gray-900">1,234</p>
            </div>
          </div>
        </div>
        <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-[#DCFCE7] rounded-lg">
              <Clock className="w-5 h-5 text-[#155E4B]" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Time Saved</p>
              <p className="text-lg font-semibold text-gray-900">145 hrs</p>
            </div>
          </div>
        </div>
        <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-lg font-semibold text-gray-900">97.2%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Workflows List */}
      <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Workflows</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="p-6 hover:bg-[#F5F2EE] transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{workflow.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      workflow.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {workflow.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{workflow.description}</p>
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <span><strong>Trigger:</strong> {workflow.trigger}</span>
                    <span><strong>Template:</strong> {workflow.template}</span>
                    <span><strong>Recipients:</strong> {workflow.recipients}</span>
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-gray-500 mt-2">
                    <span>Last run: {workflow.lastRun}</span>
                    <span>{workflow.runs} total runs</span>
                    <span>{workflow.successRate}% success rate</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button className="p-2 text-gray-400 hover:text-blue-600">
                    <Settings className="w-4 h-4" />
                  </button>
                  <button className={`p-2 ${
                    workflow.status === 'active' 
                      ? 'text-gray-400 hover:text-orange-600' 
                      : 'text-gray-400 hover:text-green-600'
                  }`}>
                    {workflow.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow Builder Preview and Recent Runs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workflow Builder Preview */}
        <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Workflow Builder Preview</h2>
          <div className="space-y-4">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              const colorClasses = {
                green: 'bg-green-100 text-green-600 border-green-200',
                blue: 'bg-blue-100 text-blue-600 border-blue-200',
                purple: 'bg-[#DCFCE7] text-[#155E4B] border-[#BBF7D0]',
                orange: 'bg-orange-100 text-orange-600 border-orange-200'
              };
              
              return (
                <div key={step.id}>
                  <div className={`flex items-center p-4 border-2 rounded-lg ${colorClasses[step.color as keyof typeof colorClasses]}`}>
                    <div className="flex-shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-medium text-gray-900">{step.title}</h3>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  </div>
                  {index < workflowSteps.length - 1 && (
                    <div className="flex justify-center py-2">
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button className="w-full flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
              <Plus className="w-5 h-5 mr-2 text-gray-400" />
              <span className="text-gray-600 font-medium">Add Step</span>
            </button>
          </div>
        </div>

        {/* Recent Runs */}
        <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Runs</h2>
          <div className="space-y-4">
            {recentRuns.map((run) => (
              <div key={run.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    run.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <h3 className="font-medium text-gray-900">{run.workflow}</h3>
                    <p className="text-sm text-gray-600">{run.trigger}</p>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div>{run.time}</div>
                  <div>{run.duration}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all runs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};