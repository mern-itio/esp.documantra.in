import { useState } from 'react';
import { 
  GitBranch, 
  Clock, 
  User, 
  FileText, 
  Eye, 
  Download,
  GitCompare,
  Tag,
  Plus
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { VersionComparison } from './VersionComparison';
import type { DocumentVersion } from '../../common/types/collaboration';
import { formatDate, formatFileSize } from '../../common/lib/utils';
import { versionAPI } from '../../../services/api';
import { useAuth } from '../../AuthService/AuthContext';

interface VersionManagerProps {
  documentId: string;
  versions: DocumentVersion[];
  currentVersion: string;
  documentOwnerId?: string; // Add document owner ID
  onVersionSelect: (versionId: string) => void;
  onVersionCompare: (fromVersion: string, toVersion: string) => void;
  onVersionRestore: (versionId: string) => void;
  onVersionTag: (versionId: string, tag: string) => void;
  onVersionReload: () => Promise<void>;
}

export function VersionManager({
  documentId,
  versions,
  currentVersion,
  documentOwnerId,
  onVersionSelect,
  // onVersionCompare,
  onVersionTag,
  onVersionReload,
}: VersionManagerProps) {
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [taggingVersion, setTaggingVersion] = useState<string | null>(null);
  const [tagName, setTagName] = useState('');
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { user } = useAuth();

  // Helper function to get version ID safely
  const getVersionId = (version: DocumentVersion): string => {
    return version._id || version.id || '';
  };

  // Helper function to check if current user is document owner
  const isDocumentOwner = (): boolean => {
    const isOwner = documentOwnerId === user?.id || documentOwnerId === user?.email;
    // console.log('🔍 Owner check:', {
    //   documentOwnerId,
    //   userId: user?.id,
    //   userEmail: user?.email,
    //   isOwner
    // });
    return isOwner;
  };

  const handleVersionSelect = (versionId: string) => {
    console.log('🔍 Version selection clicked:', versionId);
    console.log('🔍 Current selected versions:', selectedVersions);
    
    if (selectedVersions.includes(versionId)) {
      // Remove version if already selected
      const newSelection = selectedVersions.filter(id => id !== versionId);
      console.log('🔍 Removing version, new selection:', newSelection);
      setSelectedVersions(newSelection);
    } else if (selectedVersions.length < 2) {
      // Add version if less than 2 selected
      const newSelection = [...selectedVersions, versionId];
      console.log('🔍 Adding version, new selection:', newSelection);
      setSelectedVersions(newSelection);
    } else {
      // Replace the first selected version with the new one
      const newSelection = [selectedVersions[1], versionId];
      console.log('🔍 Replacing first version, new selection:', newSelection);
      setSelectedVersions(newSelection);
    }
  };

  const handleCompareVersions = async () => {
    if (selectedVersions.length === 2) {
      try {
        console.log('🔍 Comparing versions:', selectedVersions[0], selectedVersions[1]);
        const response = await versionAPI.compareVersions(selectedVersions[0], selectedVersions[1]);
        if (response.success) {
          console.log('Version comparison data:', response.data);
          setComparisonData(response.data);
          setShowComparison(true);
        } else {
          console.error('Failed to compare versions:', response.message);
        }
      } catch (error) {
        console.error('Error comparing versions:', error);
      }
    }
  };

  const handleAddTag = (versionId: string) => {
    if (tagName.trim()) {
      onVersionTag(versionId, tagName.trim());
      setTagName('');
      setTaggingVersion(null);
    }
  };

  const sortedVersions = [...versions].sort((a, b) => {
    const dateA = a.timestamp || a.createdAt || a.updatedAt;
    const dateB = b.timestamp || b.createdAt || b.updatedAt;
    
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="p-4 bg-green-50 border-b border-green-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                New version created successfully!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">
                {errorMessage}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setErrorMessage(null)}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GitBranch className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Version History</h3>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              {versions.length} versions
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={async () => {
                try {
                  setIsCreatingVersion(true);
                  // Create a new version manually
                  const response = await versionAPI.createVersion(documentId, {
                    description: `Manual version created by ${user?.fullname || user?.email || 'User'}`,
                    changes: { additions: 0, deletions: 0, modifications: 0 }
                  });
                  
                  if (response.success) {
                    console.log('Manual version created successfully');
                    // Show success message
                    setShowSuccessMessage(true);
                    setTimeout(() => setShowSuccessMessage(false), 3000);
                    // Reload versions without page refresh
                    await onVersionReload();
                  } else {
                    console.error('Failed to create manual version:', response.message);
                    setErrorMessage(response.message || 'Failed to create version');
                    setTimeout(() => setErrorMessage(null), 5000);
                  }
                } catch (error) {
                  console.error('Error creating manual version:', error);
                  setErrorMessage('An error occurred while creating the version');
                  setTimeout(() => setErrorMessage(null), 5000);
                } finally {
                  setIsCreatingVersion(false);
                }
              }}
              disabled={isCreatingVersion}
              size="sm"
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingVersion ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  New Version
                </>
              )}
            </Button>
            
          
          </div>
        </div>

        {selectedVersions.length > 0 && (
          <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-800">
                {selectedVersions.length === 1 ? (
                  <span>1 version selected</span>
                ) : (
                  <span>
                    <strong>2 versions selected for comparison:</strong>
                    <br />
                    <span className="text-xs">
                      {versions.find(v => v.id === selectedVersions[0])?.version} vs {versions.find(v => v.id === selectedVersions[1])?.version}
                    </span>
                  </span>
                )}
              </div>
              {selectedVersions.length === 2 && (
                <Button
                  onClick={() => {
                    console.log('🔍 Compare button clicked!');
                    console.log('🔍 Selected versions:', selectedVersions);
                    console.log('🔍 Current showComparison state:', showComparison);
                    handleCompareVersions();
                  }}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <GitCompare className="w-4 h-4 mr-2" />
                  Compare Versions
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Version List */}
      <div className="max-h-96 overflow-y-auto">
                {versions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <GitBranch className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No versions yet</p>
            <p className="text-sm">Create your first version by editing the document</p>
          </div>
        ) : (
          sortedVersions.map((version) => (
            <div
              key={getVersionId(version)}
              className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                selectedVersions.includes(getVersionId(version)) ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-300' : ''
              } ${getVersionId(version) === currentVersion ? 'bg-green-50' : ''}`}
            >
                          <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center space-x-2">
                      {/* Selection Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedVersions.includes(getVersionId(version))}
                        onChange={(e) => {
                          e.stopPropagation(); // Prevent row click
                          handleVersionSelect(getVersionId(version));
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-900">
                        v{version.version}
                      </span>
                      {version.id === currentVersion && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Current
                        </span>
                      )}
                      {version.approved && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Approved
                        </span>
                        )}
                    </div>
                  
                  {version.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {version.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          <Tag className="w-3 h-3 inline mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-700 mb-2">{version.description}</p>

                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>{version.authorName}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(version.timestamp || version.createdAt || version.updatedAt)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FileText className="w-3 h-3" />
                    <span>{formatFileSize(version.size)}</span>
                  </div>
                </div>

                {/* Change Summary */}
                <div className="mt-2 flex items-center space-x-4 text-xs">
                  <span className="text-green-600">
                    +{version.changes.additions} additions
                  </span>
                  <span className="text-red-600">
                    -{version.changes.deletions} deletions
                  </span>
                  <span className="text-blue-600">
                    ~{version.changes.modifications} modifications
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-1 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onVersionSelect(version._id || version.id || '');
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Download className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTaggingVersion(version._id || version.id || '');
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Tag className="w-4 h-4" />
                </Button>

                {/* Approval Button - Only visible to document owner */}
                {isDocumentOwner() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const response = await versionAPI.updateVersion(getVersionId(version), {
                          approved: !version.approved
                        });
                        
                        if (response.success) {
                          console.log('Version approval updated');
                          // Reload versions to get updated approval status
                          await onVersionReload();
                        } else {
                          console.error('Failed to update version approval:', response.message);
                        }
                      } catch (error) {
                        console.error('Error updating version approval:', error);
                      }
                    }}
                    className="h-8 w-8 p-0"
                    title={version.approved ? 'Unapprove version' : 'Approve version'}
                  >
                    {version.approved ? (
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Tag Input */}
            {taggingVersion === version.id && (
              <div className="mt-3 flex items-center space-x-2">
                <Input
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="Enter tag name..."
                  className="text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddTag(version._id || version.id || '');
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => handleAddTag(version._id || version.id || '')}
                  disabled={!tagName.trim()}
                >
                  Add
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTaggingVersion(null)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        ))
        )}
      </div>

      {/* Version Comparison Modal */}
      {showComparison && selectedVersions.length === 2 && (
        <VersionComparison
          fromVersionId={selectedVersions[0]}
          toVersionId={selectedVersions[1]}
          versions={versions}
          onClose={() => setShowComparison(false)}
          comparisonData={comparisonData}
        />
      )}
    </div>
  );
}