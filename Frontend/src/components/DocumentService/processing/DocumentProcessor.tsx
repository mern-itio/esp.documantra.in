import { useState, useEffect } from 'react';
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
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { DocumentAnalysis } from '../../common/types/collaboration';
import { formatDate } from '../../common/lib/utils';
import { documentAnalysisAPI } from '../../../services/api';
// import { useAuth } from '../../AuthService/AuthContext';

interface DocumentProcessorProps {
  documentId: string;
  analysis?: DocumentAnalysis;
  onProcessDocument: (documentId: string) => void;
  onReprocessDocument: (documentId: string) => void;
}

export function DocumentProcessor({
  documentId,
  analysis: initialAnalysis,
  // onProcessDocument,
  // onReprocessDocument
}: DocumentProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | undefined>(initialAnalysis);
  const [processingStatus, setProcessingStatus] = useState<'not_started' | 'pending' | 'processing' | 'completed' | 'failed'>('not_started');
  const [error, setError] = useState<string | null>(null);
  // const { user } = useAuth();

  // Load analysis data when component mounts
  useEffect(() => {
    if (documentId) {
      loadAnalysis();
    }
  }, [documentId]);

  // Poll for status updates while processing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (processingStatus === 'processing' || processingStatus === 'pending') {
      interval = setInterval(() => {
        checkProcessingStatus();
      }, 2000); // Check every 2 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [processingStatus]);

  const loadAnalysis = async () => {
    try {
      setError(null);
      // First check the analysis status
      const statusResponse = await documentAnalysisAPI.getAnalysisStatus(documentId);
      if (statusResponse.success) {
        const status = statusResponse.data.processingStatus;
        setProcessingStatus(status);
        
        if (status === 'completed') {
          // If completed, get the full analysis
          const analysisResponse = await documentAnalysisAPI.getDocumentAnalysis(documentId);
          if (analysisResponse.success && analysisResponse.data) {
            setAnalysis(analysisResponse.data);
          }
        } else if (status === 'processing' || status === 'pending') {
          // If still processing, no analysis data yet
          setAnalysis(undefined);
        } else {
          // If not started or failed, no analysis exists
          setAnalysis(undefined);
        }
      }
    } catch (error: any) {
      console.error('Failed to load analysis:', error);
      setProcessingStatus('not_started');
    }
  };

  const checkProcessingStatus = async () => {
    try {
      const response = await documentAnalysisAPI.getAnalysisStatus(documentId);
      if (response.success) {
        const status = response.data.processingStatus;
        setProcessingStatus(status);
        
        // If processing is complete, reload the analysis
        if (status === 'completed') {
          await loadAnalysis();
        }
      }
    } catch (error: any) {
      console.error('Failed to check processing status:', error);
    }
  };

  const handleProcess = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setProcessingStatus('pending');
      
      const response = await documentAnalysisAPI.processDocument(documentId);
      if (response.success) {
        setProcessingStatus('processing');
        // The status will be updated by the polling effect
      } else {
        throw new Error(response.message || 'Failed to start processing');
      }
    } catch (error: any) {
      console.error('Failed to process document:', error);
      setError(error.message);
      setProcessingStatus('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReprocess = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setProcessingStatus('pending');
      
      const response = await documentAnalysisAPI.reprocessDocument(documentId);
      if (response.success) {
        setProcessingStatus('processing');
        // The status will be updated by the polling effect
      } else {
        throw new Error(response.message || 'Failed to start reprocessing');
      }
    } catch (error: any) {
      console.error('Failed to reprocess document:', error);
      setError(error.message);
      setProcessingStatus('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Show loading state while processing
  if (processingStatus === 'processing' || processingStatus === 'pending') {
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
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Processing Document
            </h3>
            <p className="text-gray-500 mb-6">
              Analyzing document content, extracting insights, and performing AI-powered analysis...
            </p>
            <div className="text-sm text-blue-600">
              This may take a few minutes for large documents
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span>Processing Error</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-red-900 mb-2">
              Processing Failed
            </h3>
            <p className="text-red-500 mb-6">
              {error}
            </p>
            <div className="flex space-x-3 justify-center">
              <Button
                onClick={handleReprocess}
                disabled={isProcessing}
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
              <Button
                onClick={() => setError(null)}
                variant="ghost"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis || processingStatus === 'not_started') {
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

  // Add null check to prevent rendering before analysis data is loaded
  if (!analysis || !analysis.analysis) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-gray-500">Loading analysis data...</div>
          </CardContent>
        </Card>
      </div>
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
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReprocess}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reprocess
                  </>
                )}
              </Button>
            </div>
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
                {analysis.analysis.topics && analysis.analysis.topics.length > 0 ? (
                  analysis.analysis.topics.map((topic, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {topic}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">No topics identified</span>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Key Phrases</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.analysis.keyPhrases && analysis.analysis.keyPhrases.length > 0 ? (
                  analysis.analysis.keyPhrases.map((phrase, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                    >
                      {phrase}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">No key phrases identified</span>
                )}
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
            {analysis.analysis.entities && analysis.analysis.entities.length > 0 ? (
              analysis.analysis.entities.map((entity, index) => (
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
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                No entities extracted from document
              </div>
            )}
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
                  {analysis.classification.suggestedTags && analysis.classification.suggestedTags.length > 0 ? (
                    analysis.classification.suggestedTags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No tags suggested</span>
                  )}
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

              {analysis.compliance.issues && analysis.compliance.issues.length > 0 ? (
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
              ) : (
                <div className="text-center py-2 text-green-600 text-sm">
                  No compliance issues found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* OCR Results */}
      {analysis.ocrResults && analysis.ocrResults.extractedText && (
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
                    {analysis.ocrResults.extractedText ? 
                      `${analysis.ocrResults.extractedText.substring(0, 500)}${analysis.ocrResults.extractedText.length > 500 ? '...' : ''}`
                      : 'No OCR text available'
                    }
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