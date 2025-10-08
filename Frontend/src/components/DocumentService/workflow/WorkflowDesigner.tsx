import { useState } from 'react';
import { X, Plus, Trash2, ArrowDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import type { DocumentWorkflow, WorkflowStep } from '../../common/types/collaboration';
import { useAuth } from '../../AuthService/AuthContext';

interface WorkflowDesignerProps {
  documentId: string;
  onClose: () => void;
  onSave: (workflow: Omit<DocumentWorkflow, 'id' | 'createdAt'>) => void;
}

interface ValidationErrors {
  workflowName?: string;
  steps: {
    name?: string;
    assignee?: string;
    assigneeName?: string;
    description?: string;
  }[];
}

export function WorkflowDesigner({ documentId, onClose, onSave }: WorkflowDesignerProps) {
  const { user } = useAuth();
  const [workflowName, setWorkflowName] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [deadline, setDeadline] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({ steps: [] });
  const [steps, setSteps] = useState<Omit<WorkflowStep, 'id'>[]>([
    {
      _id: '',
      name: '',
      description: '',
      assignee: '',
      assigneeName: '',
      status: 'pending',
      requiredApprovals: 1,
      currentApprovals: 0,
      timeTracking: {
        totalTimeSpent: 0,
        isTimerRunning: false,
        sessions: []
      }
    }
  ]);

  const addStep = () => {
    setSteps([
      ...steps,
      {
        _id:'',
        name: '',
        description: '',
        assignee: '',
        assigneeName: '',
        status: 'pending',
        requiredApprovals: 1,
        currentApprovals: 0,
        timeTracking: {
          totalTimeSpent: 0,
          isTimerRunning: false,
          sessions: []
        }
      }
    ]);
    setErrors(prev => ({
      ...prev,
      steps: [...prev.steps, {}]
    }));
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
      setErrors(prev => ({
        ...prev,
        steps: prev.steps.filter((_, i) => i !== index)
      }));
    }
  };

  const updateStep = (index: number, field: string, value: any) => {
    setSteps(prevSteps => {
      const updatedSteps = [...prevSteps];
      updatedSteps[index] = { ...updatedSteps[index], [field]: value };
      return updatedSteps;
    });
    
    // Clear error for this field when user starts typing
    if (value.trim()) {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (!newErrors.steps[index]) {
          newErrors.steps[index] = {};
        }
        delete newErrors.steps[index][field as keyof typeof newErrors.steps[number]];
        return newErrors;
      });
    }
  };

  const validateWorkflow = () => {
    const newErrors: ValidationErrors = { steps: [] };
    let isValid = true;

    // Validate workflow name
    if (!workflowName.trim()) {
      newErrors.workflowName = 'Workflow name is required';
      isValid = false;
    }

    // Validate each step
    steps.forEach((step, index) => {
      const stepErrors: ValidationErrors['steps'][number] = {};

      if (!step.name.trim()) {
        stepErrors.name = 'Step name is required';
        isValid = false;
      }

      if (!step.assignee.trim()) {
        stepErrors.assignee = 'Assignee email is required';
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(step.assignee)) {
        stepErrors.assignee = 'Please enter a valid email address';
        isValid = false;
      }

      if (!step.assigneeName.trim()) {
        stepErrors.assigneeName = 'Assignee display name is required';
        isValid = false;
      }

      if (!step.description.trim()) {
        stepErrors.description = 'Step description is required';
        isValid = false;
      }

      newErrors.steps[index] = stepErrors;
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (isSaving) {
      console.log('⚠️ WorkflowDesigner: Save already in progress, skipping...');
      return;
    }

    if (!validateWorkflow()) {
      return;
    }

    setIsSaving(true);

    const workflow: Omit<DocumentWorkflow, 'id' | 'createdAt'> = {
      name: workflowName,
      documentId,
      status: 'active',
      steps: steps.map((step, index) => ({
        ...step,
        id: `step-${index + 1}`
      })),
      createdBy: user?.email || 'unknown@example.com',
      priority,
      deadline: deadline || undefined
    };

    try {
      await onSave(workflow);
      onClose();
    } catch (error) {
      console.error('❌ WorkflowDesigner: Error during save:', error);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Workflow Designer</h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Workflow Settings */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Workflow Name *
              </label>
              <Input
                value={workflowName}
                onChange={(e) => {
                  setWorkflowName(e.target.value);
                  if (e.target.value.trim() && errors.workflowName) {
                    setErrors(prev => ({ ...prev, workflowName: undefined }));
                  }
                }}
                placeholder="Enter workflow name..."
                className={errors.workflowName ? 'border-red-500 focus:ring-red-500' : ''}
              />
              {errors.workflowName && (
                <p className="mt-1 text-sm text-red-600">{errors.workflowName}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline (Optional)
                </label>
                <Input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Workflow Steps */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Workflow Steps</h3>
              <Button onClick={addStep} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Step
              </Button>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={`step-${index}`} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        Step {index + 1}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {steps.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStep(index)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Step Name *
                      </label>
                      <Input
                        value={step.name}
                        onChange={(e) => updateStep(index, 'name', e.target.value)}
                        placeholder="Enter step name..."
                        className={errors.steps[index]?.name ? 'border-red-500 focus:ring-red-500' : ''}
                      />
                      {errors.steps[index]?.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.steps[index].name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assignee Email *
                      </label>
                      <Input
                        value={step.assignee}
                        onChange={(e) => {
                          const email = e.target.value;
                          const name = email.includes('@') ? email.split('@')[0] : email;
                          updateStep(index, 'assignee', email);
                          updateStep(index, 'assigneeName', name);
                        }}
                        placeholder="assignee@example.com"
                        type="email"
                        className={errors.steps[index]?.assignee ? 'border-red-500 focus:ring-red-500' : ''}
                      />
                      {errors.steps[index]?.assignee && (
                        <p className="mt-1 text-sm text-red-600">{errors.steps[index].assignee}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assignee Display Name *
                    </label>
                    <Input
                      value={step.assigneeName}
                      onChange={(e) => updateStep(index, 'assigneeName', e.target.value)}
                      placeholder="Enter display name"
                      className={errors.steps[index]?.assigneeName ? 'border-red-500 focus:ring-red-500' : ''}
                    />
                    {errors.steps[index]?.assigneeName && (
                      <p className="mt-1 text-sm text-red-600">{errors.steps[index].assigneeName}</p>
                    )}
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      value={step.description}
                      onChange={(e) => updateStep(index, 'description', e.target.value)}
                      placeholder="Describe what needs to be done in this step..."
                      className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 ${
                        errors.steps[index]?.description 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      rows={2}
                    />
                    {errors.steps[index]?.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.steps[index].description}</p>
                    )}
                  </div>

                  {/* Arrow to next step */}
                  {index < steps.length - 1 && (
                    <div className="flex justify-center mt-4">
                      <ArrowDown className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {steps.length} step{steps.length !== 1 ? 's' : ''} configured
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSaving ? 'Creating...' : 'Create Workflow'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}