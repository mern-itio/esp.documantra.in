const fs = require('fs').promises;
const path = require('path');
const natural = require('natural');
const nlp = require('compromise');
const Sentiment = require('sentiment');
const fleschKincaid = require('flesch-kincaid');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const textract = require('textract');
// Initialize sentiment analyzer
const sentimentAnalyzer = new Sentiment();

class DocumentAnalysisService {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
  }

  /**
   * Main method to analyze a document
   */
  async analyzeDocument(documentId, filePath, mimeType) {
    try {
      console.log(`🔍 Starting analysis for document: ${documentId}`);
      
      // Extract text content based on file type
      const extractedText = await this.extractText(filePath, mimeType);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text content could be extracted from the document');
      }

      // Perform various analyses
      const analysis = await this.performTextAnalysis(extractedText);
      const ocrResults = await this.performOCR(filePath, mimeType);
      const classification = await this.classifyDocument(extractedText);
      const compliance = await this.analyzeCompliance(extractedText);

      const result = {
        documentId,
        analysis,
        ocrResults,
        classification,
        compliance,
        processedAt: new Date(),
        processingStatus: 'completed'
      };

      console.log(`✅ Document analysis completed for: ${documentId}`);
      return result;

    } catch (error) {
      console.error(`❌ Document analysis failed for ${documentId}:`, error);
      return {
        documentId,
        analysis: {
          wordCount: 0,
          pageCount: 1,
          readabilityScore: 50,
          sentiment: 'neutral',
          language: 'en',
          topics: [],
          entities: [],
          keyPhrases: [],
          summary: 'Analysis failed: ' + error.message
        },
        ocrResults: {
          confidence: 0,
          extractedText: '',
          regions: []
        },
        classification: {
          category: 'general',
          confidence: 0,
          suggestedTags: []
        },
        compliance: {
          issues: [],
          score: 0,
          recommendations: ['Analysis failed due to an error']
        },
        processedAt: new Date(),
        processingStatus: 'failed',
        processingError: error.message
      };
    }
  }

  /**
   * Extract text from different file types
   */
  async extractText(filePath, mimeType) {
    const extractionMethods = [
      // Primary method based on MIME type
      async () => {
        if (mimeType === 'application/pdf') {
          return await this.extractTextFromPDF(filePath);
        } else if (mimeType.includes('word') || mimeType.includes('document')) {
          return await this.extractTextFromWord(filePath);
        } else if (mimeType.includes('text') || mimeType.includes('plain')) {
          return await this.extractTextFromText(filePath);
        } else if (mimeType.includes('image')) {
          return await this.extractTextFromImage(filePath);
        } else {
          return await this.extractTextGeneric(filePath);
        }
      },
      // Fallback: Try generic extraction regardless of MIME type
      async () => {
        console.log(`🔄 Trying generic text extraction as fallback for ${mimeType}`);
        return await this.extractTextGeneric(filePath);
      },
      // Last resort: Try reading as plain text
      async () => {
        console.log(`🔄 Trying plain text reading as last resort for ${mimeType}`);
        const fs = require('fs');
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content && content.trim().length > 0) {
          return content;
        }
        throw new Error('File appears to be empty or unreadable');
      }
    ];

    for (let i = 0; i < extractionMethods.length; i++) {
      try {
        const text = await extractionMethods[i]();
        if (text && text.trim().length > 0) {
          console.log(`✅ Text extraction succeeded using method ${i + 1}: ${text.length} characters`);
          return text;
        }
      } catch (error) {
        console.log(`⚠️ Text extraction method ${i + 1} failed: ${error.message}`);
        if (i === extractionMethods.length - 1) {
          // This was the last method, throw the error
          throw new Error(`All text extraction methods failed. Last error: ${error.message}`);
        }
      }
    }

    throw new Error('No text content could be extracted from the document');
  }

  /**
   * Extract text from PDF files
   */
  async extractTextFromPDF(filePath) {
    try {
      // Try pdf-parse first (more reliable, no external dependencies)
      try {
        const pdfParse = require('pdf-parse');
        const fs = require('fs');
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        if (data && data.text && data.text.trim().length > 0) {
          console.log(`✅ PDF text extracted successfully using pdf-parse: ${data.text.length} characters`);
          return data.text;
        }
      } catch (pdfParseError) {
        console.log(`⚠️ pdf-parse failed, trying textract: ${pdfParseError.message}`);
      }

      // Fallback to textract if pdf-parse fails
      try {
        const textract = require('textract');
        return new Promise((resolve, reject) => {
          textract.fromFileWithPath(filePath, { preserveLineBreaks: true }, (error, text) => {
            if (error) {
              reject(error);
            } else {
              resolve(text || '');
            }
          });
        });
      } catch (textractError) {
        console.log(`⚠️ textract failed: ${textractError.message}`);
        throw new Error('Both pdf-parse and textract failed to extract PDF text');
      }
    } catch (error) {
      console.error('PDF text extraction failed:', error);
      throw error;
    }
  }

  /**
   * Extract text from Word documents
   */
  async extractTextFromWord(filePath) {
    try {
      // Try mammoth for .docx files (more reliable for modern Word documents)
      if (filePath.toLowerCase().endsWith('.docx')) {
        try {
          const mammoth = require('mammoth');
          const fs = require('fs');
          const buffer = fs.readFileSync(filePath);
          const result = await mammoth.extractRawText({ buffer });
          if (result && result.value && result.value.trim().length > 0) {
            console.log(`✅ Word document text extracted successfully using mammoth: ${result.value.length} characters`);
            return result.value;
          }
        } catch (mammothError) {
          console.log(`⚠️ mammoth failed, trying textract: ${mammothError.message}`);
        }
      }

      // Fallback to textract
      try {
        const textract = require('textract');
        return new Promise((resolve, reject) => {
          textract.fromFileWithPath(filePath, { preserveLineBreaks: true }, (error, text) => {
            if (error) {
              reject(error);
            } else {
              resolve(text || '');
            }
          });
        });
      } catch (textractError) {
        console.log(`⚠️ textract failed: ${textractError.message}`);
        throw new Error('Both mammoth and textract failed to extract Word document text');
      }
    } catch (error) {
      console.error('Word document text extraction failed:', error);
      throw error;
    }
  }

  /**
   * Extract text from plain text files
   */
  async extractTextFromText(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      console.error('Text file reading failed:', error);
      return '';
    }
  }

  /**
   * Extract text from image files using OCR
   */
  async extractTextFromImage(filePath) {
    try {
      const { data: { text } } = await Tesseract.recognize(filePath, 'eng', {
        logger: m => console.log(m)
      });
      return text;
    } catch (error) {
      console.error('Image OCR failed:', error);
      return '';
    }
  }

  /**
   * Generic text extraction fallback
   */
  async extractTextGeneric(filePath) {
    try {
      // Try textract as the main fallback
      try {
        const textract = require('textract');
        return new Promise((resolve, reject) => {
          textract.fromFileWithPath(filePath, { preserveLineBreaks: true }, (error, text) => {
            if (error) {
              reject(error);
            } else {
              resolve(text || '');
            }
          });
        });
      } catch (textractError) {
        console.log(`⚠️ textract failed: ${textractError.message}`);
      }

      // Try reading as plain text as last resort
      try {
        const fs = require('fs');
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content && content.trim().length > 0) {
          console.log(`✅ Generic text extraction succeeded using fs.readFile: ${content.length} characters`);
          return content;
        }
      } catch (fsError) {
        console.log(`⚠️ fs.readFile failed: ${fsError.message}`);
      }

      throw new Error('All text extraction methods failed');
    } catch (error) {
      console.error('Generic text extraction failed:', error);
      throw error;
    }
  }

  /**
   * Perform comprehensive text analysis
   */
  async performTextAnalysis(text) {
    try {
      // Basic text statistics
      const words = this.tokenizer.tokenize(text);
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

      // Word count
      const wordCount = words ? words.length : 0;

      // Page count estimation (assuming ~250 words per page)
      const pageCount = Math.max(1, Math.ceil(wordCount / 250));

      // Readability score using Flesch-Kincaid
      const readabilityScore = this.calculateReadability(text);

      // Sentiment analysis
      const sentimentResult = sentimentAnalyzer.analyze(text);
      const sentimentScore = sentimentResult.score;
      let sentiment = 'neutral';
      if (sentimentScore > 0.1) sentiment = 'positive';
      else if (sentimentScore < -0.1) sentiment = 'negative';

      // Language detection (simplified - assume English for now)
      const language = 'en';

      // Topic extraction using TF-IDF
      const topics = this.extractTopics(text);

      // Entity extraction
      const entities = this.extractEntities(text);

      // Key phrases extraction
      const keyPhrases = this.extractKeyPhrases(text);

      // Generate summary
      const summary = this.generateSummary(text);

      return {
        wordCount,
        pageCount,
        readabilityScore,
        sentiment,
        language,
        topics,
        entities,
        keyPhrases,
        summary
      };

    } catch (error) {
      console.error('Text analysis failed:', error);
      throw error;
    }
  }

  /**
   * Calculate Flesch-Kincaid readability score
   */
  calculateReadability(text) {
    try {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const words = this.tokenizer.tokenize(text);
      const syllables = this.countSyllables(text);

      if (sentences.length === 0 || words.length === 0) {
        return 50; // Default middle score
      }

      const avgSentenceLength = words.length / sentences.length;
      const avgSyllablesPerWord = syllables / words.length;

      // Flesch-Kincaid formula
      const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
      
      // Clamp score between 0 and 100
      return Math.max(0, Math.min(100, Math.round(score)));
    } catch (error) {
      console.error('Readability calculation failed:', error);
      return 50;
    }
  }

  /**
   * Count syllables in text (simplified approach)
   */
  countSyllables(text) {
    try {
      const words = this.tokenizer.tokenize(text);
      let syllableCount = 0;
      
      words.forEach(word => {
        const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
        if (cleanWord.length <= 3) {
          syllableCount += 1;
        } else {
          // Simple syllable counting heuristic
          const vowels = cleanWord.match(/[aeiouy]+/g);
          syllableCount += vowels ? vowels.length : 1;
        }
      });
      
      return syllableCount;
    } catch (error) {
      console.error('Syllable counting failed:', error);
      return text.length / 5; // Rough estimate
    }
  }

  /**
   * Extract topics using TF-IDF
   */
  extractTopics(text) {
    try {
      const words = this.tokenizer.tokenize(text);
      const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);
      
      // Filter out stop words and short words
      const filteredWords = words.filter(word => 
        word.length > 3 && !stopWords.has(word.toLowerCase())
      );

      // Count word frequencies
      const wordFreq = {};
      filteredWords.forEach(word => {
        const cleanWord = word.toLowerCase();
        wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
      });

      // Sort by frequency and take top topics
      const sortedTopics = Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([word]) => word);

      return sortedTopics;
    } catch (error) {
      console.error('Topic extraction failed:', error);
      return [];
    }
  }

  /**
   * Extract named entities using compromise
   */
  extractEntities(text) {
    try {
      const doc = nlp(text);
      const entities = [];

      // Extract people
      const people = doc.people().out('array');
      people.forEach(person => {
        entities.push({
          text: person,
          type: 'person',
          confidence: 0.9,
          position: { start: text.indexOf(person), end: text.indexOf(person) + person.length }
        });
      });

      // Extract organizations
      const orgs = doc.organizations().out('array');
      orgs.forEach(org => {
        entities.push({
          text: org,
          type: 'organization',
          confidence: 0.85,
          position: { start: text.indexOf(org), end: text.indexOf(org) + org.length }
        });
      });

      // Extract places
      const places = doc.places().out('array');
      places.forEach(place => {
        entities.push({
          text: place,
          type: 'location',
          confidence: 0.8,
          position: { start: text.indexOf(place), end: text.indexOf(place) + place.length }
        });
      });

      // Extract dates
      const dates = doc.dates().out('array');
      dates.forEach(date => {
        entities.push({
          text: date,
          type: 'date',
          confidence: 0.95,
          position: { start: text.indexOf(date), end: text.indexOf(date) + date.length }
        });
      });

      // Extract money amounts
      const money = doc.values().filter('#Money').out('array');
      money.forEach(amount => {
        entities.push({
          text: amount,
          type: 'money',
          confidence: 0.9,
          position: { start: text.indexOf(amount), end: text.indexOf(amount) + amount.length }
        });
      });

      return entities;
    } catch (error) {
      console.error('Entity extraction failed:', error);
      return [];
    }
  }

  /**
   * Extract key phrases
   */
  extractKeyPhrases(text) {
    try {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const phrases = [];

      sentences.forEach(sentence => {
        const words = this.tokenizer.tokenize(sentence);
        if (words && words.length >= 3 && words.length <= 8) {
          phrases.push(sentence.trim());
        }
      });

      // Return top phrases
      return phrases.slice(0, 15);
    } catch (error) {
      console.error('Key phrase extraction failed:', error);
      return [];
    }
  }

  /**
   * Generate document summary
   */
  generateSummary(text) {
    try {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      if (sentences.length <= 3) {
        return text;
      }

      // Simple extractive summarization - take first few sentences
      const summarySentences = sentences.slice(0, Math.min(3, Math.ceil(sentences.length * 0.2)));
      return summarySentences.join('. ') + '.';
    } catch (error) {
      console.error('Summary generation failed:', error);
      return text.substring(0, 200) + '...';
    }
  }

  /**
   * Perform OCR on images
   */
  async performOCR(filePath, mimeType) {
    try {
      if (!mimeType.includes('image')) {
        return null;
      }

      const { data: { text, confidence } } = await Tesseract.recognize(filePath, 'eng', {
        logger: m => console.log(m)
      });

      if (!text || text.trim().length === 0) {
        return null;
      }

      return {
        confidence: confidence / 100, // Normalize to 0-1 range
        extractedText: text,
        regions: [] // Could be enhanced to extract bounding boxes
      };

    } catch (error) {
      console.error('OCR processing failed:', error);
      return null;
    }
  }

  /**
   * Classify document content
   */
  async classifyDocument(text) {
    try {
      // Simple rule-based classification
      const lowerText = text.toLowerCase();
      let category = 'general';
      let confidence = 0.5;

      // Legal documents
      if (lowerText.includes('contract') || lowerText.includes('agreement') || 
          lowerText.includes('legal') || lowerText.includes('terms') ||
          lowerText.includes('clause') || lowerText.includes('party')) {
        category = 'legal';
        confidence = 0.8;
      }
      // Financial documents
      else if (lowerText.includes('invoice') || lowerText.includes('receipt') ||
               lowerText.includes('financial') || lowerText.includes('payment') ||
               lowerText.includes('amount') || lowerText.includes('dollar')) {
        category = 'financial';
        confidence = 0.8;
      }
      // Technical documents
      else if (lowerText.includes('technical') || lowerText.includes('specification') ||
               lowerText.includes('api') || lowerText.includes('code') ||
               lowerText.includes('function') || lowerText.includes('system')) {
        category = 'technical';
        confidence = 0.8;
      }
      // Medical documents
      else if (lowerText.includes('medical') || lowerText.includes('patient') ||
               lowerText.includes('diagnosis') || lowerText.includes('treatment') ||
               lowerText.includes('symptoms') || lowerText.includes('medication')) {
        category = 'medical';
        confidence = 0.8;
      }

      // Generate suggested tags based on content
      const suggestedTags = this.generateTags(text);

      return {
        category,
        confidence,
        suggestedTags
      };

    } catch (error) {
      console.error('Document classification failed:', error);
      return {
        category: 'general',
        confidence: 0.5,
        suggestedTags: []
      };
    }
  }

  /**
   * Generate tags for document
   */
  generateTags(text) {
    try {
      const words = this.tokenizer.tokenize(text);
      const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
      
      const filteredWords = words.filter(word => 
        word.length > 3 && !stopWords.has(word.toLowerCase())
      );

      const wordFreq = {};
      filteredWords.forEach(word => {
        const cleanWord = word.toLowerCase();
        wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
      });

      const tags = Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8)
        .map(([word]) => word);

      return tags;
    } catch (error) {
      console.error('Tag generation failed:', error);
      return [];
    }
  }

  /**
   * Analyze compliance and identify issues
   */
  async analyzeCompliance(text) {
    try {
      const issues = [];
      let score = 100;

      // Check for sensitive information
      const sensitivePatterns = [
        { pattern: /\b\d{3}-\d{2}-\d{4}\b/, type: 'SSN', severity: 'critical' },
        { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, type: 'Credit Card', severity: 'critical' },
        { pattern: /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/, type: 'Phone Number', severity: 'medium' },
        { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, type: 'Email Address', severity: 'low' }
      ];

      sensitivePatterns.forEach(({ pattern, type, severity }) => {
        const matches = text.match(pattern);
        if (matches) {
          issues.push({
            type: `${type} Found`,
            severity,
            description: `Document contains ${matches.length} ${type.toLowerCase()}${matches.length > 1 ? 's' : ''}`,
            recommendation: `Consider redacting or encrypting sensitive ${type.toLowerCase()} information`
          });

          // Reduce compliance score based on severity
          if (severity === 'critical') score -= 20;
          else if (severity === 'high') score -= 15;
          else if (severity === 'medium') score -= 10;
          else score -= 5;
        }
      });

      // Check for legal compliance keywords
      const legalKeywords = ['confidential', 'proprietary', 'copyright', 'trademark', 'patent'];
      const missingLegal = legalKeywords.filter(keyword => 
        !text.toLowerCase().includes(keyword.toLowerCase())
      );

      if (missingLegal.length > 0) {
        issues.push({
          type: 'Missing Legal Notices',
          severity: 'medium',
          description: `Document may be missing important legal notices: ${missingLegal.join(', ')}`,
          recommendation: 'Consider adding appropriate legal disclaimers and notices'
        });
        score -= 10;
      }

      // Generate recommendations
      const recommendations = [
        'Review document for sensitive information before sharing',
        'Ensure appropriate access controls are in place',
        'Consider adding document classification labels'
      ];

      return {
        issues,
        score: Math.max(0, score),
        recommendations
      };

    } catch (error) {
      console.error('Compliance analysis failed:', error);
      return {
        issues: [],
        score: 50,
        recommendations: ['Unable to analyze compliance - manual review recommended']
      };
    }
  }
}

module.exports = new DocumentAnalysisService();
