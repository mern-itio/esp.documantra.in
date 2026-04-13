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
      console.log('Loading analysis for document:', documentId);
      
      // First check the analysis status
      const statusResponse = await documentAnalysisAPI.getAnalysisStatus(documentId);
      console.log('Status response:', statusResponse);
      
      if (statusResponse.success) {
        const status = statusResponse.data.processingStatus;
        setProcessingStatus(status);
        
        if (status === 'completed') {
          // If completed, get the full analysis
          const analysisResponse = await documentAnalysisAPI.getDocumentAnalysis(documentId);
          // console.log('Analysis response:', analysisResponse);
          
          if (analysisResponse.success && analysisResponse.data) {
            setAnalysis(analysisResponse.data);
          } else {
            setError('Failed to load analysis data');
          }
        } else if (status === 'processing' || status === 'pending') {
          // If still processing, no analysis data yet
          setAnalysis(undefined);
        } else if (status === 'failed') {
          // If failed, show error
          setError(statusResponse.data.processingError || 'Analysis failed');
          setAnalysis(undefined);
        } else {
          // If not started, no analysis exists
          setAnalysis(undefined);
        }
      } else {
        setError(statusResponse.message || 'Failed to check analysis status');
        setProcessingStatus('not_started');
      }
    } catch (error: any) {
      console.error('Failed to load analysis:', error);
      setError(error.message || 'Failed to load analysis');
      setProcessingStatus('not_started');
    }
  };

  const checkProcessingStatus = async () => {
    try {
      // console.log('Checking processing status for document:', documentId);
      const response = await documentAnalysisAPI.getAnalysisStatus(documentId);
      // console.log('Processing status response:', response);
      
      if (response.success) {
        const status = response.data.processingStatus;
        setProcessingStatus(status);
        
        // If processing is complete, reload the analysis
        if (status === 'completed') {
          await loadAnalysis();
        }
      } else {
        console.error('Failed to get processing status:', response.message);
        setError(response.message || 'Failed to check processing status');
      }
    } catch (error: any) {
      console.error('Failed to check processing status:', error);
      setError(error.message || 'Failed to check processing status');
    }
  };

  const handleProcess = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setProcessingStatus('pending');
      
      // console.log('Starting document processing for:', documentId);
      const response = await documentAnalysisAPI.processDocument(documentId);
      // console.log('Process document response:', response);
      
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
            <div className="w-16 h-16 border-4 border-primary border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-900 mb-2">
              Processing Document
            </h3>
            <p className="text-muted-foreground mb-6">
              Analyzing document content, extracting insights, and performing AI-powered analysis...
            </p>
            <div className="text-sm text-muted-foreground">
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
            <AlertCircle className="w-5 h-5 text-muted-foreground" />
            <span>Analysis Error</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Analysis Failed
            </h3>
            <p className="text-muted-foreground mb-4">
              {error}
            </p>
            <div className="text-sm text-muted-foreground mb-6">
              This could be due to network issues, server problems, or document format issues.
            </div>
            <div className="flex space-x-3 justify-center">
              <Button
                onClick={handleReprocess}
                disabled={isProcessing}
                variant="outline"
                className="border-border text-muted-foreground hover:bg-muted/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Analysis
              </Button>
              <Button
                onClick={() => {
                  setError(null);
                  loadAnalysis();
                }}
                variant="ghost"
              >
                Refresh
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
            <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Document Not Processed
            </h3>
            <p className="text-muted-foreground mb-6">
              Process this document to extract insights, analyze content, and enable advanced features.
            </p>
            <Button
              onClick={handleProcess}
              disabled={isProcessing}
              className="bg-primary hover:bg-primary/90"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mr-2" />
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
            <div className="text-muted-foreground">Loading analysis data...</div>
            <div className="text-xs text-muted-foreground mt-2">
              Analysis data: {analysis ? 'Present but incomplete' : 'Not loaded'}
            </div>
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
            <div className="text-sm text-muted-foreground">
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
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground">
                {analysis.analysis.wordCount.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Words</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground">
                {analysis.analysis.pageCount}
              </div>
              <div className="text-sm text-muted-foreground">Pages</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground">
                {analysis.analysis.readabilityScore}
              </div>
              <div className="text-sm text-muted-foreground">Readability</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className={`text-2xl font-bold ${
                analysis.analysis.sentiment === 'positive' ? 'text-success' :
                analysis.analysis.sentiment === 'negative' ? 'text-destructive' :
                'text-muted-foreground'
              }`}>
                {analysis.analysis.sentiment}
              </div>
              <div className="text-sm text-muted-foreground">Sentiment</div>
            </div>
          </div>

          {/* Document Summary */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-foreground mb-2">AI Summary</h4>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              {analysis.analysis.summary}
            </p>
          </div>

          {/* Topics and Key Phrases */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Topics</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.analysis.topics && analysis.analysis.topics.length > 0 ? (
                  analysis.analysis.topics.map((topic, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-full"
                    >
                      {topic}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">No topics identified</span>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Key Phrases</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.analysis.keyPhrases && analysis.analysis.keyPhrases.length > 0 ? (
                  analysis.analysis.keyPhrases.map((phrase, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-full"
                    >
                      {phrase}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">No key phrases identified</span>
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
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      entity.type === 'person' ? 'bg-primary text-primary-foreground' :
                      entity.type === 'organization' ? 'bg-primary text-primary-foreground' :
                      entity.type === 'location' ? 'bg-primary text-primary-foreground' :
                      entity.type === 'date' ? 'bg-primary text-primary-foreground' :
                      entity.type === 'money' ? 'bg-primary text-primary-foreground' :
                      'bg-primary text-primary-foreground'
                    }`}>
                      {entity.type}
                    </span>
                      <span className="text-sm font-medium text-foreground">{entity.text}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {Math.round(entity.confidence * 100)}% confidence
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
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
                  <span className="text-sm font-medium text-foreground">Category</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(analysis.classification.confidence * 100)}% confidence
                  </span>
                </div>
                <div className="text-lg font-medium text-primary">
                  {analysis.classification.category}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Suggested Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.classification.suggestedTags && analysis.classification.suggestedTags.length > 0 ? (
                    analysis.classification.suggestedTags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">No tags suggested</span>
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
                  <span className="text-sm font-medium text-foreground">Compliance Score</span>
                  <span className={`text-sm font-medium ${
                    analysis.compliance.score >= 80 ? 'text-success' :
                    analysis.compliance.score >= 60 ? 'text-warning' :
                    'text-destructive'
                  }`}>
                    {analysis.compliance.score}/100
                  </span>
                </div>
                  <div className="w-full bg-primary text-primary-foreground rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      analysis.compliance.score >= 80 ? 'bg-success' :
                      analysis.compliance.score >= 60 ? 'bg-warning' :
                      'bg-destructive'
                    }`}
                    style={{ width: `${analysis.compliance.score}%` }}
                  />
                </div>
              </div>

              {analysis.compliance.issues && analysis.compliance.issues.length > 0 ? (
                <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Issues Found</h4>
                  <div className="space-y-2">
                    {analysis.compliance.issues.map((issue, index) => (
                        <div key={index} className="p-2 bg-muted text-muted-foreground border border-border rounded">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{issue.type}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            issue.severity === 'critical' ? 'bg-destructive text-destructive-foreground' :
                            issue.severity === 'high' ? 'bg-warning text-warning-foreground' :
                            issue.severity === 'medium' ? 'bg-warning text-warning-foreground' :
                            'bg-primary text-primary-foreground'
                          }`}>
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{issue.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 text-muted-foreground text-sm">
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
                <span className="text-sm font-medium text-foreground">OCR Confidence</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(analysis.ocrResults.confidence * 100)}%
                </span>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Extracted Text Preview</h4>
                    <div className="p-3 bg-primary text-primary-foreground rounded-lg max-h-32 overflow-y-auto">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
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