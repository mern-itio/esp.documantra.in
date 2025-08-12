import { X, GitCompare, Plus, Minus, Edit } from 'lucide-react';
import { Button } from '../ui/button';
import type { DocumentVersion, VersionChange } from '../../common/types/collaboration';
import { formatDate } from '../../common/lib/utils';

interface VersionComparisonProps {
  fromVersionId: string;
  toVersionId: string;
  versions: DocumentVersion[];
  onClose: () => void;
}

// Mock comparison data - in real app this would come from API
const mockChanges: VersionChange[] = [
  {
    id: 'change-1',
    type: 'addition',
    content: 'Added new financial projections for Q4 2024 showing 15% growth',
    position: 1245,
    author: 'john.doe@example.com',
    timestamp: '2024-07-01T14:00:00Z'
  },
  {
    id: 'change-2',
    type: 'deletion',
    content: 'Removed outdated market analysis from Q2',
    position: 856,
    author: 'jane.smith@example.com',
    timestamp: '2024-07-01T13:30:00Z'
  },
  {
    id: 'change-3',
    type: 'modification',
    content: 'Updated revenue targets from $2.3M to $2.5M',
    position: 1567,
    author: 'john.doe@example.com',
    timestamp: '2024-07-01T14:15:00Z'
  }
];

export function VersionComparison({
  fromVersionId,
  toVersionId,
  versions,
  onClose
}: VersionComparisonProps) {
  const fromVersion = versions.find(v => v.id === fromVersionId);
  const toVersion = versions.find(v => v.id === toVersionId);

  if (!fromVersion || !toVersion) {
    return null;
  }

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'addition':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'deletion':
        return <Minus className="w-4 h-4 text-red-600" />;
      case 'modification':
        return <Edit className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'addition':
        return 'bg-green-50 border-green-200';
      case 'deletion':
        return 'bg-red-50 border-red-200';
      case 'modification':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GitCompare className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Version Comparison</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Version Info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">From Version</h3>
              <div className="bg-white p-3 rounded border">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">v{fromVersion.version}</span>
                  <span className="text-xs text-gray-500">
                    {formatDate(fromVersion.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{fromVersion.description}</p>
                <p className="text-xs text-gray-500 mt-1">by {fromVersion.authorName}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">To Version</h3>
              <div className="bg-white p-3 rounded border">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">v{toVersion.version}</span>
                  <span className="text-xs text-gray-500">
                    {formatDate(toVersion.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{toVersion.description}</p>
                <p className="text-xs text-gray-500 mt-1">by {toVersion.authorName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Change Summary */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Change Summary</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {mockChanges.filter(c => c.type === 'addition').length}
              </div>
              <div className="text-sm text-green-700">Additions</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {mockChanges.filter(c => c.type === 'deletion').length}
              </div>
              <div className="text-sm text-red-700">Deletions</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {mockChanges.filter(c => c.type === 'modification').length}
              </div>
              <div className="text-sm text-blue-700">Modifications</div>
            </div>
          </div>
        </div>

        {/* Changes List */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Detailed Changes</h3>
          <div className="space-y-3">
            {mockChanges.map((change) => (
              <div
                key={change.id}
                className={`p-4 rounded-lg border ${getChangeColor(change.type)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getChangeIcon(change.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium capitalize">
                        {change.type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(change.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{change.content}</p>
                    <p className="text-xs text-gray-500">by {change.author}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Comparing {mockChanges.length} changes between versions
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Export Comparison
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}