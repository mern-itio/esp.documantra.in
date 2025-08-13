import { X, GitCompare } from 'lucide-react';
import { Button } from '../ui/button';
import type { DocumentVersion } from '../../common/types/collaboration';
import { formatDate } from '../../common/lib/utils';

interface VersionComparisonProps {
  fromVersionId: string;
  toVersionId: string;
  versions: DocumentVersion[];
  onClose: () => void;
  comparisonData?: {
    fromVersion: string;
    toVersion: string;
    fromVersionId: string;
    toVersionId: string;
    changes: {
      additions: number;
      deletions: number;
      modifications: number;
      total: number;
    };
    fromContent: string;
    toContent: string;
  };
}


export function VersionComparison({
  fromVersionId,
  toVersionId,
  versions,
  onClose,
  comparisonData
}: VersionComparisonProps) {
  // Helper function to get version ID safely
  const getVersionId = (version: DocumentVersion): string => {
    return version._id || version.id || '';
  };
  
  const fromVersion = versions.find(v => getVersionId(v) === fromVersionId);
  const toVersion = versions.find(v => getVersionId(v) === toVersionId);

  if (!fromVersion || !toVersion) {
    console.log('❌ Versions not found:', { fromVersionId, toVersionId, versions });
    return null;
  }

  console.log('🔍 Found versions:', { fromVersion, toVersion });
  console.log('🔍 Comparison data:', comparisonData);
  console.log('🔍 From version timestamp:', fromVersion.timestamp);
  console.log('🔍 To version timestamp:', toVersion.timestamp);

 
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-auto">
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
                    {formatDate(fromVersion.timestamp || fromVersion.createdAt || fromVersion.updatedAt)}
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
                    {formatDate(toVersion.timestamp || toVersion.createdAt || toVersion.updatedAt)}
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
                {comparisonData?.changes.additions || 0}
              </div>
              <div className="text-sm text-green-700">Additions</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {comparisonData?.changes.deletions || 0}
              </div>
              <div className="text-sm text-red-700">Deletions</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {comparisonData?.changes.modifications || 0}
              </div>
              <div className="text-sm text-blue-700">Modifications</div>
            </div>
          </div>
        </div>

        {/* Content Comparison */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Content Comparison</h3>
          
          {comparisonData ? (
            <div className="grid grid-cols-2 gap-6">
              {/* From Version Content */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">From Version {comparisonData.fromVersion}</h4>
                <div className="bg-gray-50 p-4 rounded-lg border max-h-64 overflow-y-auto">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                    {comparisonData.fromContent || 'No content available'}
                  </pre>
                </div>
              </div>
              
              {/* To Version Content */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">To Version {comparisonData.toVersion}</h4>
                <div className="bg-gray-50 p-4 rounded-lg border max-h-64 overflow-y-auto">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                    {comparisonData.toContent || 'No content available'}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>No comparison data available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {comparisonData ? (
              <>
                Comparing versions {comparisonData.fromVersion} and {comparisonData.toVersion}
                {comparisonData.changes.total > 0 && (
                  <span className="ml-2">
                    • {comparisonData.changes.total} total changes
                  </span>
                )}
              </>
            ) : (
              'Comparing versions'
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {/* <Button className="bg-blue-600 hover:bg-blue-700">
              Export Comparison
            </Button> */}
          </div>
        </div>
      </div>
    </div>
  );
}