import React, { useState } from 'react';
import { Plus, Edit, Trash2, Type, Hash, Calendar, CheckSquare, List } from 'lucide-react';

interface Variable {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  label: string;
  required: boolean;
  defaultValue?: string;
  options?: string[];
  validation?: string;
  placeholder?: string;
}

interface VariableManagerProps {
  variables: Variable[];
  onVariablesChange: (variables: Variable[]) => void;
}

export const VariableManager: React.FC<VariableManagerProps> = ({
  variables,
  onVariablesChange
}) => {
  const [isAddingVariable, setIsAddingVariable] = useState(false);
  // const [editingVariable, setEditingVariable] = useState<Variable | null>(null);
  const [newVariable, setNewVariable] = useState<Partial<Variable>>({
    type: 'text',
    required: false
  });

  const variableTypes = [
    { type: 'text', label: 'Text', icon: Type },
    { type: 'number', label: 'Number', icon: Hash },
    { type: 'date', label: 'Date', icon: Calendar },
    { type: 'boolean', label: 'Checkbox', icon: CheckSquare },
    { type: 'select', label: 'Dropdown', icon: List }
  ];

  const addVariable = () => {
    if (newVariable.name && newVariable.label) {
      const variable: Variable = {
        id: `var_${Date.now()}`,
        name: newVariable.name,
        type: newVariable.type as Variable['type'],
        label: newVariable.label,
        required: newVariable.required || false,
        defaultValue: newVariable.defaultValue,
        options: newVariable.options,
        validation: newVariable.validation,
        placeholder: newVariable.placeholder
      };
      onVariablesChange([...variables, variable]);
      setNewVariable({ type: 'text', required: false });
      setIsAddingVariable(false);
    }
  };

  // const updateVariable = (id: string, updates: Partial<Variable>) => {
  //   onVariablesChange(variables.map(v => v.id === id ? { ...v, ...updates } : v));
  // };

  const deleteVariable = (id: string) => {
    onVariablesChange(variables.filter(v => v.id !== id));
  };

  return (
    <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Template Variables</h2>
        <button
          onClick={() => setIsAddingVariable(true)}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Variable
        </button>
      </div>

      {/* Variables List */}
      <div className="space-y-3 mb-6">
        {variables.map((variable) => {
          const TypeIcon = variableTypes.find(t => t.type === variable.type)?.icon || Type;
          return (
            <div key={variable.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TypeIcon className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {variable.label}
                    {variable.required && <span className="text-red-500 ml-1">*</span>}
                  </div>
                  <div className="text-sm text-gray-500">
                    {variable.name} ({variable.type})
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  // onClick={() => setEditingVariable(variable)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteVariable(variable.id)}
                  className="p-2 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Variable Form */}
      {isAddingVariable && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-md font-medium text-gray-900 mb-4">Add New Variable</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Variable Name</label>
              <input
                type="text"
                value={newVariable.name || ''}
                onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="employee_name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Label</label>
              <input
                type="text"
                value={newVariable.label || ''}
                onChange={(e) => setNewVariable({ ...newVariable, label: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Employee Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={newVariable.type}
                onChange={(e) => setNewVariable({ ...newVariable, type: e.target.value as Variable['type'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {variableTypes.map(type => (
                  <option key={type.type} value={type.type}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
              <input
                type="text"
                value={newVariable.placeholder || ''}
                onChange={(e) => setNewVariable({ ...newVariable, placeholder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter employee name..."
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newVariable.required || false}
                onChange={(e) => setNewVariable({ ...newVariable, required: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Required field</span>
            </label>
          </div>
          <div className="flex items-center space-x-3 mt-6">
            <button
              onClick={addVariable}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
            >
              Add Variable
            </button>
            <button
              onClick={() => setIsAddingVariable(false)}
              className="px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-md"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};