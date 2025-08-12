import React, { useState } from 'react';
import { 
  GitBranch, 
  Clock, 
  User, 
  FileText, 
  Eye, 
  Download,
  GitCompare,
  Tag,
  MoreVertical,
  Plus
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { VersionComparison } from './VersionComparison';
import type { DocumentVersion } from '../../common/types/collaboration';
import { formatDate, formatFileSize } from '../../common/lib/utils';

interface VersionManagerProps {
  documentId: string;
  versions: DocumentVersion[];
  currentVersion: string;
  onVersionSelect: (versionId: string) => void;
  onVersionCompare: (fromVersion: string, toVersion: string) => void;
  onVersionRestore: (versionId: string) => void;
  onVersionTag: (versionId: string, tag: string) => void;
}

export function VersionManager({
  documentId,
  versions,
  currentVersion,
  onVersionSelect,
  onVersionCompare,
  onVersionRestore,
  onVersionTag
}: VersionManagerProps) {
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [taggingVersion, setTaggingVersion] = useState<string | null>(null);
  const [tagName, setTagName] = useState('');

  const handleVersionSelect = (versionId: string) => {
    if (selectedVersions.includes(versionId)) {
      setSelectedVersions(selectedVersions.filter(id => id !== versionId));
    } else if (selectedVersions.length < 2) {
      setSelectedVersions([...selectedVersions, versionId]);
    } else {
      setSelectedVersions([selectedVersions[1], versionId]);
    }
  };

  const handleCompareVersions = () => {
    if (selectedVersions.length === 2) {
      onVersionCompare(selectedVersions[0], selectedVersions[1]);
      setShowComparison(true);
    }
  };

  const handleAddTag = (versionId: string) => {
    if (tagName.trim()) {
      onVersionTag(versionId, tagName.trim());
      setTagName('');
      setTaggingVersion(null);
    }
  };

  const sortedVersions = [...versions].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200">
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
            {selectedVersions.length === 2 && (
              <Button
                onClick={handleCompareVersions}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <GitCompare className="w-4 h-4 mr-2" />
                Compare
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Version
            </Button>
          </div>
        </div>

        {selectedVersions.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            {selectedVersions.length === 1 
              ? '1 version selected' 
              : `${selectedVersions.length} versions selected for comparison`
            }
          </div>
        )}
      </div>

      {/* Version List */}
      <div className="max-h-96 overflow-y-auto">
        {sortedVersions.map((version, index) => (
          <div
            key={version.id}
            className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
              selectedVersions.includes(version.id) ? 'bg-blue-50 border-blue-200' : ''
            } ${version.id === currentVersion ? 'bg-green-50' : ''}`}
            onClick={() => handleVersionSelect(version.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex items-center space-x-2">
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
                    <span>{formatDate(version.timestamp)}</span>
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
                    onVersionSelect(version.id);
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
                    setTaggingVersion(version.id);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Tag className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
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
                      handleAddTag(version.id);
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => handleAddTag(version.id)}
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
        ))}
      </div>

      {/* Version Comparison Modal */}
      {showComparison && selectedVersions.length === 2 && (
        <VersionComparison
          fromVersionId={selectedVersions[0]}
          toVersionId={selectedVersions[1]}
          versions={versions}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
}