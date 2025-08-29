const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');

const execAsync = promisify(exec);

const qualityAnalysisController = {
  // Main quality analysis endpoint
  async analyzeQuality(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // console.log('Quality analysis request received:', {
      //   originalname: req.file.originalname,
      //   filename: req.file.filename,
      //   path: req.file.path,
      //   size: req.file.size,
      //   mimetype: req.file.mimetype
      // });

      // Perform comprehensive quality analysis
      const analysis = await qualityAnalysisController.performQualityAnalysis(req.file.path);
      
      const result = {
        success: true,
        message: 'Quality analysis completed successfully',
        filename: req.file.originalname,
        analysis
      };

      // console.log('Quality analysis completed successfully');
      res.json(result);

    } catch (error) {
      console.error('Quality analysis error:', error);
      res.status(500).json({ 
        error: 'Quality analysis failed', 
        details: error.message 
      });
    }
  },

  // Internal quality analysis function
  async performQualityAnalysis(filePath) {
    try {
      // Basic PDF validation
      const { stdout: checkOutput } = await execAsync(`qpdf --check "${filePath}"`);
      
      // Get page count and basic info
      const { stdout: pagesOutput } = await execAsync(`qpdf --show-pages "${filePath}"`);
      const totalPages = pagesOutput.trim().split('\n').length;

      // Get file size
      const fileSize = await fs.stat(filePath).then(stats => stats.size);

      // Analyze PDF structure and content
      const structureAnalysis = await qualityAnalysisController.analyzeStructure(filePath);
      const contentAnalysis = await qualityAnalysisController.analyzeContent(filePath);
      const performanceAnalysis = await qualityAnalysisController.analyzePerformance(filePath);

      // Calculate overall quality score
      const qualityScore = qualityAnalysisController.calculateQualityScore({
        structureAnalysis,
        contentAnalysis,
        performanceAnalysis,
        fileSize,
        totalPages
      });

      // Generate optimization suggestions
      const optimizationSuggestions = qualityAnalysisController.generateOptimizationSuggestions({
        structureAnalysis,
        contentAnalysis,
        performanceAnalysis,
        qualityScore
      });

      return {
        qualityScore,
        totalPages,
        fileSize,
        structureAnalysis,
        contentAnalysis,
        performanceAnalysis,
        optimizationSuggestions,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Internal quality analysis error:', error);
      // Return fallback analysis
      return {
        qualityScore: 50,
        totalPages: 1,
        fileSize: 100000,
        structureAnalysis: {
          isValid: false,
          hasErrors: true,
          errorDetails: error.message,
          structureScore: 0
        },
        contentAnalysis: {
          textQuality: 0,
          imageQuality: 0,
          fontQuality: 0,
          contentScore: 0
        },
        performanceAnalysis: {
          loadTime: 'unknown',
          compressionRatio: 0,
          performanceScore: 0
        },
        optimizationSuggestions: [
          {
            type: 'error_fix',
            priority: 'high',
            title: 'Fix PDF Structure',
            description: 'The PDF has structural issues that need to be resolved',
            estimatedImprovement: '20-40%'
          }
        ],
        timestamp: new Date().toISOString()
      };
    }
  },

  // Analyze PDF structure
  async analyzeStructure(filePath) {
    try {
      // Check PDF structure integrity
      const { stdout: structureOutput } = await execAsync(`qpdf --check "${filePath}"`);
      
      let structureScore = 100;
      let hasErrors = false;
      let errorDetails = [];

      // Analyze structure output for common issues
      if (structureOutput.includes('error') || structureOutput.includes('corrupt')) {
        hasErrors = true;
        structureScore -= 40;
        errorDetails.push('PDF structure corruption detected');
      }

      if (structureOutput.includes('warning')) {
        structureScore -= 20;
        errorDetails.push('PDF structure warnings found');
      }

      // Check for missing resources
      if (structureOutput.includes('missing')) {
        structureScore -= 15;
        errorDetails.push('Missing resources detected');
      }

      return {
        isValid: structureScore >= 70,
        hasErrors,
        errorDetails,
        structureScore: Math.max(0, structureScore),
        details: structureOutput
      };

    } catch (error) {
      return {
        isValid: false,
        hasErrors: true,
        errorDetails: [error.message],
        structureScore: 0,
        details: 'Structure analysis failed'
      };
    }
  },

  // Analyze PDF content quality
  async analyzeContent(filePath) {
    try {
      let textQuality = 100;
      let imageQuality = 100;
      let fontQuality = 100;

      // Analyze text content
      try {
        const { stdout: textOutput } = await execAsync(`qpdf --show-pages "${filePath}"`);
        const pageCount = textOutput.trim().split('\n').length;
        
        // Estimate text quality based on page count and file size
        if (pageCount > 0) {
          const avgPageSize = await fs.stat(filePath).then(stats => stats.size / pageCount);
          if (avgPageSize < 1000) {
            textQuality -= 30; // Very small pages might indicate poor text quality
          } else if (avgPageSize < 5000) {
            textQuality -= 15; // Small pages might indicate moderate text quality
          }
        }
      } catch (error) {
        textQuality -= 50;
      }

      // Analyze image quality (simplified - would need more sophisticated tools)
      try {
        // Check if PDF has images by looking for image objects
        const { stdout: imageOutput } = await execAsync(`qpdf --show-objects "${filePath}" | findstr -i "image"`);
        if (imageOutput) {
          const imageCount = imageOutput.split('\n').filter(line => line.trim()).length;
          if (imageCount > 10) {
            imageQuality -= 20; // Many images might indicate compression needed
          }
        }
      } catch (error) {
        // Image analysis not critical, don't penalize heavily
        imageQuality -= 10;
      }

      // Analyze font quality
      try {
        const { stdout: fontOutput } = await execAsync(`qpdf --show-objects "${filePath}" | findstr -i "font"`);
        if (fontOutput) {
          const fontCount = fontOutput.split('\n').filter(line => line.trim()).length;
          if (fontCount > 20) {
            fontQuality -= 25; // Many fonts might indicate optimization needed
          }
        }
      } catch (error) {
        fontQuality -= 15;
      }

      const contentScore = Math.round((textQuality + imageQuality + fontQuality) / 3);

      return {
        textQuality: Math.max(0, textQuality),
        imageQuality: Math.max(0, imageQuality),
        fontQuality: Math.max(0, fontQuality),
        contentScore: Math.max(0, contentScore)
      };

    } catch (error) {
      return {
        textQuality: 50,
        imageQuality: 50,
        fontQuality: 50,
        contentScore: 50
      };
    }
  },

  // Analyze PDF performance
  async analyzePerformance(filePath) {
    try {
      const fileSize = await fs.stat(filePath).then(stats => stats.size);
      
      // Estimate load time based on file size
      let loadTime = 'fast';
      if (fileSize > 10 * 1024 * 1024) { // > 10MB
        loadTime = 'slow';
      } else if (fileSize > 5 * 1024 * 1024) { // > 5MB
        loadTime = 'moderate';
      }

      // Calculate compression ratio (simplified)
      const compressionRatio = Math.min(100, Math.max(0, Math.round((1 - (fileSize / (fileSize + 100000))) * 100)));

      // Calculate performance score
      let performanceScore = 100;
      
      if (loadTime === 'slow') {
        performanceScore -= 40;
      } else if (loadTime === 'moderate') {
        performanceScore -= 20;
      }

      if (compressionRatio < 20) {
        performanceScore -= 30;
      } else if (compressionRatio < 50) {
        performanceScore -= 15;
      }

      return {
        loadTime,
        compressionRatio,
        performanceScore: Math.max(0, performanceScore),
        estimatedLoadTime: this.estimateLoadTime(fileSize)
      };

    } catch (error) {
      return {
        loadTime: 'unknown',
        compressionRatio: 0,
        performanceScore: 50,
        estimatedLoadTime: 'unknown'
      };
    }
  },

  // Estimate load time based on file size
  estimateLoadTime(fileSize) {
    const sizeInMB = fileSize / (1024 * 1024);
    
    if (sizeInMB < 1) return '< 1 second';
    if (sizeInMB < 5) return '1-3 seconds';
    if (sizeInMB < 10) return '3-5 seconds';
    if (sizeInMB < 20) return '5-10 seconds';
    return '> 10 seconds';
  },

  // Calculate overall quality score
  calculateQualityScore(analysis) {
    const {
      structureAnalysis,
      contentAnalysis,
      performanceAnalysis,
      fileSize,
      totalPages
    } = analysis;

    let score = 0;
    let totalWeight = 0;

    // Structure weight: 30%
    const structureWeight = 30;
    score += (structureAnalysis.structureScore / 100) * structureWeight;
    totalWeight += structureWeight;

    // Content weight: 35%
    const contentWeight = 35;
    score += (contentAnalysis.contentScore / 100) * contentWeight;
    totalWeight += contentWeight;

    // Performance weight: 25%
    const performanceWeight = 25;
    score += (performanceAnalysis.performanceScore / 100) * performanceWeight;
    totalWeight += performanceWeight;

    // File size bonus/penalty: 10%
    const sizeWeight = 10;
    let sizeScore = 100;
    
    if (fileSize > 50 * 1024 * 1024) { // > 50MB
      sizeScore -= 40;
    } else if (fileSize > 20 * 1024 * 1024) { // > 20MB
      sizeScore -= 20;
    } else if (fileSize < 100 * 1024) { // < 100KB
      sizeScore += 10; // Bonus for small files
    }

    score += (sizeScore / 100) * sizeWeight;
    totalWeight += sizeWeight;

    const finalScore = Math.round(score);
    
    // Determine quality level
    let qualityLevel = 'poor';
    if (finalScore >= 90) qualityLevel = 'excellent';
    else if (finalScore >= 80) qualityLevel = 'good';
    else if (finalScore >= 70) qualityLevel = 'fair';
    else if (finalScore >= 60) qualityLevel = 'below_average';

    return {
      score: finalScore,
      qualityLevel,
      breakdown: {
        structure: Math.round((structureAnalysis.structureScore / 100) * structureWeight),
        content: Math.round((contentAnalysis.contentScore / 100) * contentWeight),
        performance: Math.round((performanceAnalysis.performanceScore / 100) * performanceWeight),
        size: Math.round((sizeScore / 100) * sizeWeight)
      }
    };
  },

  // Generate optimization suggestions
  generateOptimizationSuggestions(analysis) {
    const suggestions = [];
    const { structureAnalysis, contentAnalysis, performanceAnalysis, qualityScore } = analysis;

    // Structure-based suggestions
    if (structureAnalysis.structureScore < 80) {
      suggestions.push({
        type: 'structure_optimization',
        priority: 'high',
        title: 'Fix PDF Structure',
        description: 'Resolve structural issues to improve PDF reliability and compatibility',
        estimatedImprovement: '15-30%',
        action: 'Use PDF repair tools or regenerate the document'
      });
    }

    // Content-based suggestions
    if (contentAnalysis.textQuality < 80) {
      suggestions.push({
        type: 'text_optimization',
        priority: 'medium',
        title: 'Improve Text Quality',
        description: 'Enhance text rendering and readability',
        estimatedImprovement: '10-20%',
        action: 'Check font embedding and text encoding'
      });
    }

    if (contentAnalysis.imageQuality < 80) {
      suggestions.push({
        type: 'image_optimization',
        priority: 'medium',
        title: 'Optimize Images',
        description: 'Compress and optimize embedded images for better performance',
        estimatedImprovement: '20-40%',
        action: 'Use image compression tools or reduce image resolution'
      });
    }

    if (contentAnalysis.fontQuality < 80) {
      suggestions.push({
        type: 'font_optimization',
        priority: 'low',
        title: 'Optimize Fonts',
        description: 'Reduce font variety and embed only necessary fonts',
        estimatedImprovement: '5-15%',
        action: 'Subset fonts and remove unused font variants'
      });
    }

    // Performance-based suggestions
    if (performanceAnalysis.performanceScore < 70) {
      suggestions.push({
        type: 'performance_optimization',
        priority: 'high',
        title: 'Improve Performance',
        description: 'Optimize file size and loading speed',
        estimatedImprovement: '25-50%',
        action: 'Apply compression and remove unnecessary objects'
      });
    }

    if (performanceAnalysis.loadTime === 'slow') {
      suggestions.push({
        type: 'size_reduction',
        priority: 'high',
        title: 'Reduce File Size',
        description: 'Significantly reduce file size for faster loading',
        estimatedImprovement: '30-60%',
        action: 'Use aggressive compression and remove redundant content'
      });
    }

    // Quality score based suggestions
    if (qualityScore.score < 60) {
      suggestions.push({
        type: 'comprehensive_optimization',
        priority: 'critical',
        title: 'Comprehensive Optimization Required',
        description: 'Multiple issues detected requiring comprehensive optimization',
        estimatedImprovement: '40-70%',
        action: 'Use professional PDF optimization tools or regenerate document'
      });
    }

    // Sort suggestions by priority
    const priorityOrder = { critical: 1, high: 2, medium: 3, low: 4 };
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return suggestions;
  },

  // Get quality analysis presets
  async getQualityAnalysisPresets(req, res) {
    try {
      const presets = await qualityAnalysisController.getQualityAnalysisPresetsInternal();
      
      res.json({
        success: true,
        presets
      });

    } catch (error) {
      console.error('Failed to get quality analysis presets:', error);
      res.status(500).json({ error: 'Failed to get presets' });
    }
  },

  // Internal function to get quality analysis presets
  async getQualityAnalysisPresetsInternal() {
    return [
      {
        id: 'comprehensive',
        name: 'Comprehensive Analysis',
        description: 'Full quality analysis with detailed scoring and recommendations',
        includesStructure: true,
        includesContent: true,
        includesPerformance: true,
        priority: 'high'
      },
      {
        id: 'performance_focused',
        name: 'Performance Focused',
        description: 'Focus on performance metrics and optimization suggestions',
        includesStructure: false,
        includesContent: false,
        includesPerformance: true,
        priority: 'medium'
      },
      {
        id: 'content_focused',
        name: 'Content Focused',
        description: 'Focus on content quality and text/image analysis',
        includesStructure: false,
        includesContent: true,
        includesPerformance: false,
        priority: 'medium'
      },
      {
        id: 'quick_assessment',
        name: 'Quick Assessment',
        description: 'Basic quality check with essential metrics',
        includesStructure: true,
        includesContent: false,
        includesPerformance: false,
        priority: 'low'
      }
    ];
  },

  // Batch quality analysis
  async batchQualityAnalysis(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const { preset } = req.body;

      // console.log('Batch quality analysis request received:', {
      //   fileCount: req.files.length,
      //   preset
      // });

      const results = [];
      const errors = [];

      for (const file of req.files) {
        try {
          const analysis = await qualityAnalysisController.performQualityAnalysis(file.path);
          
          results.push({
            filename: file.originalname,
            analysis,
            success: true
          });

        } catch (error) {
          console.error(`Batch analysis error for ${file.originalname}:`, error);
          errors.push({
            filename: file.originalname,
            error: error.message,
            success: false
          });
        }
      }

      const successfulFiles = results.length;
      const failedFiles = errors.length;
      const totalFiles = req.files.length;
      const successRate = ((successfulFiles / totalFiles) * 100).toFixed(1);

      // Calculate batch statistics
      const qualityScores = results.map(r => r.analysis.qualityScore.score);
      const avgQualityScore = qualityScores.length > 0 ? 
        Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length) : 0;

      res.json({
        success: true,
        message: `Batch quality analysis completed. ${successfulFiles} successful, ${failedFiles} failed.`,
        results,
        errors,
        summary: {
          totalFiles,
          successfulFiles,
          failedFiles,
          successRate: `${successRate}%`,
          averageQualityScore: avgQualityScore
        },
        preset
      });

    } catch (error) {
      console.error('Batch quality analysis error:', error);
      res.status(500).json({ 
        error: 'Batch quality analysis failed', 
        details: error.message 
      });
    }
  }
};

module.exports = qualityAnalysisController;
