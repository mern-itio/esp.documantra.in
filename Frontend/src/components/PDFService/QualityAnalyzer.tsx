import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  BarChart3,
  FileText,
  Shield,
  Zap,
  Target,
  TrendingUp,
  Award
} from 'lucide-react';

interface QualityReport {
  id: string;
  filename: string;
  overallScore: number;
  categories: {
    structure: { score: number; issues: string[] };
    content: { score: number; issues: string[] };
    accessibility: { score: number; issues: string[] };
    security: { score: number; issues: string[] };
    optimization: { score: number; issues: string[] };
  };
  recommendations: string[];
  processingTime: string;
}

interface QualityAnalyzerProps {
  onBack: () => void;
}

export const QualityAnalyzer: React.FC<QualityAnalyzerProps> = ({ onBack }) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reports, setReports] = useState<QualityReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<QualityReport | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const analyzeFiles = async () => {
    if (uploadedFiles.length === 0) return;

    setIsAnalyzing(true);
    
    // Simulate analysis
    await new Promise(resolve => setTimeout(resolve, 3000));

    const mockReports: QualityReport[] = uploadedFiles.map((file, index) => ({
      id: `report_${index}`,
      filename: file.name,
      overallScore: Math.floor(Math.random() * 30) + 70, // 70-100
      categories: {
        structure: {
          score: Math.floor(Math.random() * 20) + 80,
          issues: Math.random() > 0.5 ? [] : ['Missing document outline', 'Inconsistent page structure']
        },
        content: {
          score: Math.floor(Math.random() * 25) + 75,
          issues: Math.random() > 0.5 ? [] : ['Low resolution images', 'Embedded fonts missing']
        },
        accessibility: {
          score: Math.floor(Math.random() * 40) + 60,
          issues: ['Missing alt text for images', 'No reading order defined', 'Color contrast issues']
        },
        security: {
          score: Math.floor(Math.random() * 15) + 85,
          issues: Math.random() > 0.7 ? [] : ['Metadata contains sensitive information']
        },
        optimization: {
          score: Math.floor(Math.random() * 30) + 70,
          issues: Math.random() > 0.6 ? [] : ['Large file size', 'Uncompressed images', 'Unused objects present']
        }
      },
      recommendations: [
        'Compress images to reduce file size',
        'Add alternative text for accessibility',
        'Optimize document structure for better navigation',
        'Remove sensitive metadata before sharing'
      ],
      processingTime: `${Math.floor(Math.random() * 5) + 2} seconds`
    }));

    setReports(mockReports);
    setSelectedReport(mockReports[0]);
    setIsAnalyzing(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 75) return 'text-yellow-600 bg-yellow-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return CheckCircle;
    if (score >= 75) return AlertTriangle;
    return XCircle;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PDF Quality Analyzer</h1>
            <p className="text-gray-600">Analyze document quality and get optimization recommendations</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload and Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload */}
          <div className="bg-[#F7F3EE] rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Documents</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop PDF files here or click to upload
              </p>
              <p className="text-gray-600 mb-4">
                Analyze document quality, accessibility, and optimization
              </p>
              <label className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                Choose Files
                <input
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">
                    Files to Analyze ({uploadedFiles.length})
                  </h4>
                  <button
                    onClick={analyzeFiles}
                    disabled={isAnalyzing}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>{isAnalyzing ? 'Analyzing...' : 'Start Analysis'}</span>
                  </button>
                </div>
                
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-[#F5F2EE] rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <span className="font-medium text-gray-900">{file.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Analysis Results */}
          {reports.length > 0 && (
            <div className="bg-[#F7F3EE] rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h3>
              
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedReport?.id === report.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <div>
                          <h4 className="font-medium text-gray-900">{report.filename}</h4>
                          <p className="text-sm text-gray-600">Processed in {report.processingTime}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getScoreColor(report.overallScore)}`}>
                          {report.overallScore}/100
                        </span>
                        {React.createElement(getScoreIcon(report.overallScore), {
                          className: `w-5 h-5 ${report.overallScore >= 90 ? 'text-green-500' : 
                            report.overallScore >= 75 ? 'text-yellow-500' : 'text-red-500'}`
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Detailed Report */}
        <div className="space-y-6">
          {selectedReport ? (
            <>
              {/* Overall Score */}
              <div className="bg-[#F7F3EE] rounded-xl border border-gray-200 p-6">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 relative">
                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={selectedReport.overallScore >= 90 ? '#10b981' : 
                               selectedReport.overallScore >= 75 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${selectedReport.overallScore * 2.51} 251`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900">{selectedReport.overallScore}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Overall Quality Score</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedReport.overallScore >= 90 ? 'Excellent' :
                     selectedReport.overallScore >= 75 ? 'Good' :
                     selectedReport.overallScore >= 60 ? 'Fair' : 'Poor'}
                  </p>
                </div>
              </div>

              {/* Category Scores */}
              <div className="bg-[#F7F3EE] rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
                
                <div className="space-y-4">
                  {Object.entries(selectedReport.categories).map(([category, data]) => {
                    const icons = {
                      structure: BarChart3,
                      content: FileText,
                      accessibility: Target,
                      security: Shield,
                      optimization: Zap
                    };
                    const Icon = icons[category as keyof typeof icons];
                    
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Icon className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-900 capitalize">{category}</span>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getScoreColor(data.score)}`}>
                            {data.score}/100
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              data.score >= 90 ? 'bg-green-500' :
                              data.score >= 75 ? 'bg-yellow-500' :
                              data.score >= 60 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${data.score}%` }}
                          />
                        </div>
                        {data.issues.length > 0 && (
                          <div className="ml-6 space-y-1">
                            {data.issues.map((issue, index) => (
                              <div key={index} className="text-xs text-red-600 flex items-center space-x-1">
                                <XCircle className="w-3 h-3" />
                                <span>{issue}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-[#F7F3EE] rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  <span>Recommendations</span>
                </h3>
                
                <div className="space-y-3">
                  {selectedReport.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
                      <span className="text-sm text-gray-700">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-[#F7F3EE] rounded-xl border border-gray-200 p-6">
              <div className="text-center py-8">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Yet</h3>
                <p className="text-gray-600">Upload and analyze documents to see quality reports</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};