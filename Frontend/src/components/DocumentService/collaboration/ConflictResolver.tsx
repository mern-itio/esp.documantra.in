import { useState } from 'react';
import { AlertTriangle, Check, X, GitMerge, Users } from 'lucide-react';
import { Button } from '../ui/button';

interface ConflictData {
  id: string;
  type: 'text' | 'formatting' | 'structure';
  position: {
    line: number;
    column: number;
  };
  conflictingUsers: {
    id: string;
    name: string;
    change: string;
    timestamp: string;
  }[];
  originalContent: string;
  suggestedResolution?: string;
}

interface ConflictResolverProps {
  conflicts: ConflictData[];
  onResolveConflict: (conflictId: string, resolution: 'accept_mine' | 'accept_theirs' | 'merge' | 'custom', customContent?: string) => void;
  onResolveAll: () => void;
  isVisible: boolean;
  onClose: () => void;
}

export function ConflictResolver({
  conflicts,
  onResolveConflict,
  onResolveAll,
  isVisible,
  onClose
}: ConflictResolverProps) {
  const [selectedConflict, setSelectedConflict] = useState<string | null>(null);
  const [customResolution, setCustomResolution] = useState<string>('');

  if (!isVisible || conflicts.length === 0) return null;

  const handleCustomResolution = (conflictId: string) => {
    onResolveConflict(conflictId, 'custom', customResolution);
    setCustomResolution('');
    setSelectedConflict(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-card text-card-foreground border border-border rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg font-semibold text-foreground">
              Resolve Editing Conflicts ({conflicts.length})
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={onResolveAll}
              size="sm"
            >
              <GitMerge className="w-4 h-4 mr-2" />
              Auto-Resolve All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Conflicts List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {conflicts.map((conflict) => (
              <div
                key={conflict.id}
                className="border border-amber-200 dark:border-amber-900/60 rounded-lg p-4 bg-amber-50/80 dark:bg-amber-950/30"
              >
                {/* Conflict Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-medium text-amber-900 dark:text-amber-200">
                      {conflict.type.charAt(0).toUpperCase() + conflict.type.slice(1)} Conflict
                    </span>
                    <span className="text-xs text-amber-700 dark:text-amber-400">
                      Line {conflict.position.line}, Column {conflict.position.column}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs text-amber-700 dark:text-amber-400">
                      {conflict.conflictingUsers.length} users
                    </span>
                  </div>
                </div>

                {/* Original Content */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Original Content:
                  </label>
                  <div className="p-2 bg-muted rounded-md text-sm font-mono text-foreground">
                    {conflict.originalContent}
                  </div>
                </div>

                {/* Conflicting Changes */}
                <div className="space-y-2 mb-4">
                  <label className="block text-xs font-medium text-foreground">
                    Conflicting Changes:
                  </label>
                  {conflict.conflictingUsers.map((user) => (
                    <div key={user.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-foreground">
                            {user.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(user.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="p-2 bg-background border border-border rounded-md text-sm font-mono text-foreground">
                          {user.change}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onResolveConflict(conflict.id, 'accept_theirs')}
                          className="h-6 px-2 text-xs"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Accept
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resolution Options */}
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onResolveConflict(conflict.id, 'accept_mine')}
                  >
                    Keep Original
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onResolveConflict(conflict.id, 'merge')}
                  >
                    <GitMerge className="w-3 h-3 mr-1" />
                    Auto-Merge
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedConflict(
                      selectedConflict === conflict.id ? null : conflict.id
                    )}
                  >
                    Custom Resolution
                  </Button>
                </div>

                {/* Custom Resolution Input */}
                {selectedConflict === conflict.id && (
                  <div className="mt-3 space-y-2">
                    <label className="block text-xs font-medium text-foreground">
                      Custom Resolution:
                    </label>
                    <textarea
                      value={customResolution}
                      onChange={(e) => setCustomResolution(e.target.value)}
                      placeholder="Enter your custom resolution..."
                      className="w-full p-2 border border-input rounded-md text-sm font-mono bg-background text-foreground"
                      rows={3}
                    />
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleCustomResolution(conflict.id)}
                        disabled={!customResolution.trim()}
                      >
                        Apply Resolution
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedConflict(null);
                          setCustomResolution('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/20">
          <div className="text-sm text-muted-foreground">
            {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} need{conflicts.length === 1 ? 's' : ''} resolution
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onClose}>
              Resolve Later
            </Button>
            <Button 
              onClick={onResolveAll}
            >
              Auto-Resolve All Conflicts
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}