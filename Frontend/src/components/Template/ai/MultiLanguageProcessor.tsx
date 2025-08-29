import React, { useState } from 'react';
import { Globe, Languages, CheckCircle, ArrowRight, Download } from 'lucide-react';

interface LanguageSupport {
  code: string;
  name: string;
  nativeName: string;
  supported: boolean;
  confidence: number;
  templateCount: number;
}

interface TranslationResult {
  originalLanguage: string;
  targetLanguage: string;
  originalText: string;
  translatedText: string;
  confidence: number;
  culturalAdaptations: string[];
}

interface MultiLanguageProcessorProps {
  templateContent: string;
  onTranslationComplete: (result: TranslationResult) => void;
}

export const MultiLanguageProcessor: React.FC<MultiLanguageProcessorProps> = ({
  templateContent,
  onTranslationComplete
}) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [selectedTargetLanguage, setSelectedTargetLanguage] = useState('es');
  const [detectedLanguage, setDetectedLanguage] = useState('en');
  const [translationResults, setTranslationResults] = useState<TranslationResult[]>([]);

  const supportedLanguages: LanguageSupport[] = [
    { code: 'en', name: 'English', nativeName: 'English', supported: true, confidence: 99.9, templateCount: 1247 },
    { code: 'es', name: 'Spanish', nativeName: 'Español', supported: true, confidence: 96.8, templateCount: 456 },
    { code: 'fr', name: 'French', nativeName: 'Français', supported: true, confidence: 94.2, templateCount: 234 },
    { code: 'de', name: 'German', nativeName: 'Deutsch', supported: true, confidence: 92.7, templateCount: 189 },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', supported: true, confidence: 91.3, templateCount: 156 },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', supported: true, confidence: 89.6, templateCount: 134 },
    { code: 'zh', name: 'Chinese', nativeName: '中文', supported: true, confidence: 87.4, templateCount: 98 },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', supported: true, confidence: 85.9, templateCount: 76 },
    { code: 'ko', name: 'Korean', nativeName: '한국어', supported: true, confidence: 84.2, templateCount: 54 },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', supported: true, confidence: 82.1, templateCount: 43 },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', supported: true, confidence: 88.7, templateCount: 67 },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', supported: true, confidence: 81.5, templateCount: 32 }
  ];

  const translateTemplate = async () => {
    setIsTranslating(true);
    
    // Simulate AI translation process
    await new Promise(resolve => setTimeout(resolve, 3000));

    const targetLang = supportedLanguages.find(lang => lang.code === selectedTargetLanguage);
    const sourceLang = supportedLanguages.find(lang => lang.code === detectedLanguage);

    const mockTranslation: TranslationResult = {
      originalLanguage: sourceLang?.name || 'English',
      targetLanguage: targetLang?.name || 'Spanish',
      originalText: templateContent || 'This employment agreement is entered into between the Company and the Employee.',
      translatedText: selectedTargetLanguage === 'es' 
        ? 'Este acuerdo de empleo se celebra entre la Empresa y el Empleado.'
        : selectedTargetLanguage === 'fr'
        ? 'Cet accord d\'emploi est conclu entre l\'Entreprise et l\'Employé.'
        : selectedTargetLanguage === 'de'
        ? 'Diese Arbeitsvereinbarung wird zwischen dem Unternehmen und dem Arbeitnehmer geschlossen.'
        : 'Translated content would appear here.',
      confidence: targetLang?.confidence || 90,
      culturalAdaptations: [
        'Adjusted date format for local conventions',
        'Modified currency symbols and formatting',
        'Adapted legal terminology for local jurisdiction',
        'Updated address format for regional standards'
      ]
    };

    setTranslationResults([...translationResults, mockTranslation]);
    onTranslationComplete(mockTranslation);
    setIsTranslating(false);
  };

  const detectLanguage = async () => {
    // Simulate language detection
    await new Promise(resolve => setTimeout(resolve, 500));
    setDetectedLanguage('en'); // Mock detection result
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 95) return 'text-green-600';
    if (confidence >= 85) return 'text-blue-600';
    if (confidence >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center mr-4">
          <Globe className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Multi-Language AI Processor</h2>
          <p className="text-sm text-gray-600">Translate and localize templates with AI-powered language processing</p>
        </div>
      </div>

      {/* Language Detection */}
      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-900 mb-3">Source Language Detection</h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Detected Language:</span>
                <span className="font-medium text-gray-900">
                  {supportedLanguages.find(lang => lang.code === detectedLanguage)?.name || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={detectLanguage}
            className="px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-md"
          >
            Auto-Detect
          </button>
        </div>
      </div>

      {/* Translation Configuration */}
      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-900 mb-3">Translation Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Language</label>
            <select
              value={selectedTargetLanguage}
              onChange={(e) => setSelectedTargetLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {supportedLanguages.filter(lang => lang.code !== detectedLanguage).map(language => (
                <option key={language.code} value={language.code}>
                  {language.name} ({language.nativeName})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Translation Quality</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="standard">Standard Translation</option>
              <option value="legal">Legal Document Focus</option>
              <option value="business">Business Context</option>
              <option value="technical">Technical Accuracy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Supported Languages Grid */}
      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-900 mb-3">Supported Languages</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {supportedLanguages.map((language) => (
            <div
              key={language.code}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedTargetLanguage === language.code
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedTargetLanguage(language.code)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900">{language.name}</span>
                {language.supported && <CheckCircle className="w-4 h-4 text-green-500" />}
              </div>
              <div className="text-sm text-gray-600 mb-1">{language.nativeName}</div>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${getConfidenceColor(language.confidence)}`}>
                  {language.confidence.toFixed(1)}%
                </span>
                <span className="text-gray-500">{language.templateCount} templates</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Translation Action */}
      <div className="mb-6">
        <button
          onClick={translateTemplate}
          disabled={isTranslating || !templateContent}
          className="w-full flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {isTranslating ? (
            <>
              <div className="w-5 h-5 mr-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Translating Template...
            </>
          ) : (
            <>
              <Languages className="w-5 h-5 mr-3" />
              Translate Template
            </>
          )}
        </button>
      </div>

      {/* Translation Results */}
      {translationResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900">Translation Results</h3>
          {translationResults.map((result, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{result.originalLanguage}</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{result.targetLanguage}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${getConfidenceColor(result.confidence)}`}>
                    {result.confidence.toFixed(1)}% confidence
                  </span>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Original Text</h4>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm">
                    {result.originalText}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Translated Text</h4>
                  <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                    {result.translatedText}
                  </div>
                </div>
              </div>

              {result.culturalAdaptations.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Cultural Adaptations Applied</h4>
                  <ul className="space-y-1">
                    {result.culturalAdaptations.map((adaptation, adaptIndex) => (
                      <li key={adaptIndex} className="text-sm text-gray-600 flex items-start">
                        <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        {adaptation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {translationResults.length === 0 && !isTranslating && (
        <div className="text-center text-gray-400 py-8">
          <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Ready to Translate</h3>
          <p className="text-sm">Select a target language and click "Translate Template" to begin</p>
        </div>
      )}
    </div>
  );
};