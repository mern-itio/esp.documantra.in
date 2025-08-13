import { useState } from 'react';
import { 
  Brain, 
  FileText, 
  Eye, 
  // Languages, 
  Search,
  Tag,
  // BarChart3,
  Shield,
  Zap,
  CheckCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { DocumentAnalysis } from '../../common/types/collaboration';
import { formatDate } from '../../common/lib/utils';

interface DocumentProcessorProps {
  documentId: string;
  analysis?: DocumentAnalysis;
  onProcessDocument: (documentId: string) => void;
  onReprocessDocument: (documentId: string) => void;
}

export function DocumentProcessor({
  documentId,
  analysis,
  onProcessDocument,
  onReprocessDocument
}: DocumentProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      await onProcessDocument(documentId);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReprocess = async () => {
    setIsProcessing(true);
    try {
      await onReprocessDocument(documentId);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>Document Intelligence</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Document Not Processed
            </h3>
            <p className="text-gray-500 mb-6">
              Process this document to extract insights, analyze content, and enable advanced features.
            </p>
            <Button
              onClick={handleProcess}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Process Document
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Processing Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5" />
              <span>Document Intelligence</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">Processed</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Last processed: {formatDate(analysis.processedAt)}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReprocess}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Reprocess'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Content Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {analysis.analysis.wordCount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Words</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {analysis.analysis.pageCount}
              </div>
              <div className="text-sm text-gray-600">Pages</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {analysis.analysis.readabilityScore}
              </div>
              <div className="text-sm text-gray-600">Readability</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold ${
                analysis.analysis.sentiment === 'positive' ? 'text-green-600' :
                analysis.analysis.sentiment === 'negative' ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {analysis.analysis.sentiment}
              </div>
              <div className="text-sm text-gray-600">Sentiment</div>
            </div>
          </div>

          {/* Document Summary */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">AI Summary</h4>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
              {analysis.analysis.summary}
            </p>
          </div>

          {/* Topics and Key Phrases */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Topics</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.analysis.topics.map((topic, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Key Phrases</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.analysis.keyPhrases.map((phrase, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                  >
                    {phrase}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Extracted Entities</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.analysis.entities.map((entity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    entity.type === 'person' ? 'bg-purple-100 text-purple-800' :
                    entity.type === 'organization' ? 'bg-blue-100 text-blue-800' :
                    entity.type === 'location' ? 'bg-green-100 text-green-800' :
                    entity.type === 'date' ? 'bg-orange-100 text-orange-800' :
                    entity.type === 'money' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {entity.type}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{entity.text}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {Math.round(entity.confidence * 100)}% confidence
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Classification and Compliance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Tag className="w-5 h-5" />
              <span>Classification</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Category</span>
                  <span className="text-sm text-gray-600">
                    {Math.round(analysis.classification.confidence * 100)}% confidence
                  </span>
                </div>
                <div className="text-lg font-medium text-blue-600">
                  {analysis.classification.category}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Suggested Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.classification.suggestedTags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Compliance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Compliance Score</span>
                  <span className={`text-sm font-medium ${
                    analysis.compliance.score >= 80 ? 'text-green-600' :
                    analysis.compliance.score >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {analysis.compliance.score}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      analysis.compliance.score >= 80 ? 'bg-green-600' :
                      analysis.compliance.score >= 60 ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}
                    style={{ width: `${analysis.compliance.score}%` }}
                  />
                </div>
              </div>

              {analysis.compliance.issues.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Issues Found</h4>
                  <div className="space-y-2">
                    {analysis.compliance.issues.map((issue, index) => (
                      <div key={index} className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-yellow-800">{issue.type}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            issue.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            issue.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-xs text-yellow-700 mt-1">{issue.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* OCR Results */}
      {analysis.ocrResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              <span>OCR Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">OCR Confidence</span>
                <span className="text-sm text-gray-600">
                  {Math.round(analysis.ocrResults.confidence * 100)}%
                </span>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Extracted Text Preview</h4>
                <div className="p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {analysis.ocrResults.extractedText.substring(0, 500)}
                    {analysis.ocrResults.extractedText.length > 500 && '...'}
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}