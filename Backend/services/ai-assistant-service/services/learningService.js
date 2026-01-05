const LearningPattern = require('../models/LearningPattern');
const UserAction = require('../models/UserAction');
const embeddingService = require('./embeddingService');

class LearningService {
  /**
   * Record a failed AI attempt
   */
  async recordFailedAttempt(userId, failedAttempt) {
    try {
      const pattern = new LearningPattern({
        userId,
        failedAttempt: {
          userCommand: failedAttempt.userCommand,
          aiAction: failedAttempt.aiAction,
          aiParameters: failedAttempt.aiParameters || {},
          errorMessage: failedAttempt.errorMessage,
          errorType: failedAttempt.errorType || 'execution_error'
        },
        metadata: {
          conversationId: failedAttempt.conversationId,
          messageId: failedAttempt.messageId,
          learnedAt: new Date()
        }
      });

      // Generate embedding for the command for similarity matching
      try {
        const embedding = await embeddingService.generateEmbedding(failedAttempt.userCommand);
        pattern.pattern.commandEmbedding = embedding;
      } catch (embedError) {
        console.warn('Failed to generate embedding for learning pattern:', embedError.message);
      }

      // Extract keywords from command
      pattern.pattern.keywords = this.extractKeywords(failedAttempt.userCommand);

      await pattern.save();
      return pattern;
    } catch (error) {
      console.error('Error recording failed attempt:', error);
      throw error;
    }
  }

  /**
   * Record user correction after a failed attempt
   */
  async recordUserCorrection(userId, patternId, userCorrection) {
    try {
      const pattern = await LearningPattern.findOne({ _id: patternId, userId });
      if (!pattern) {
        throw new Error('Learning pattern not found');
      }

      pattern.userCorrection = {
        action: userCorrection.action,
        parameters: userCorrection.parameters || {},
        description: userCorrection.description,
        success: userCorrection.success !== false
      };

      // Extract intent from the correction
      pattern.pattern.intent = this.extractIntent(userCorrection);

      await pattern.save();
      return pattern;
    } catch (error) {
      console.error('Error recording user correction:', error);
      throw error;
    }
  }

  /**
   * Find similar learned patterns for a given command
   */
  async findSimilarPatterns(userId, userCommand, limit = 5) {
    try {
      // Get user's learned patterns
      const userPatterns = await LearningPattern.find({
        userId,
        'userCorrection.action': { $exists: true }, // Only patterns with corrections
        'metadata.confidence': { $gte: 0.5 } // Only confident patterns
      }).sort({ 'metadata.confidence': -1, 'metadata.usageCount': -1 }).limit(50);

      if (userPatterns.length === 0) {
        return [];
      }

      // Generate embedding for current command
      let commandEmbedding;
      try {
        commandEmbedding = await embeddingService.generateEmbedding(userCommand);
      } catch (embedError) {
        console.warn('Failed to generate embedding for command:', embedError.message);
        // Fallback to keyword matching
        return this.findSimilarByKeywords(userCommand, userPatterns, limit);
      }

      // Calculate similarity scores
      const patternsWithSimilarity = userPatterns
        .filter(p => p.pattern.commandEmbedding && p.pattern.commandEmbedding.length > 0)
        .map(pattern => {
          const similarity = embeddingService.cosineSimilarity(
            commandEmbedding,
            pattern.pattern.commandEmbedding
          );
          return {
            pattern,
            similarity,
            score: similarity * pattern.metadata.confidence // Weight by confidence
          };
        })
        .filter(item => item.similarity > 0.7) // Minimum similarity threshold
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return patternsWithSimilarity.map(item => item.pattern);
    } catch (error) {
      console.error('Error finding similar patterns:', error);
      return [];
    }
  }

  /**
   * Fallback: Find similar patterns by keywords
   */
  findSimilarByKeywords(userCommand, patterns, limit) {
    const commandKeywords = this.extractKeywords(userCommand.toLowerCase());
    
    const patternsWithScore = patterns.map(pattern => {
      const patternKeywords = pattern.pattern.keywords || [];
      const commonKeywords = commandKeywords.filter(kw => 
        patternKeywords.some(pk => pk.toLowerCase().includes(kw) || kw.includes(pk.toLowerCase()))
      );
      const score = commonKeywords.length / Math.max(commandKeywords.length, patternKeywords.length);
      return { pattern, score };
    })
    .filter(item => item.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

    return patternsWithScore.map(item => item.pattern);
  }

  /**
   * Get learned patterns as few-shot examples for prompt enhancement
   */
  async getFewShotExamples(userId, userCommand, maxExamples = 3) {
    try {
      const similarPatterns = await this.findSimilarPatterns(userId, userCommand, maxExamples);
      
      return similarPatterns.map(pattern => ({
        userCommand: pattern.failedAttempt.userCommand,
        aiAction: pattern.failedAttempt.aiAction,
        aiParameters: pattern.failedAttempt.aiParameters,
        error: pattern.failedAttempt.errorMessage,
        correctAction: pattern.userCorrection.action,
        correctParameters: pattern.userCorrection.parameters,
        description: pattern.userCorrection.description
      }));
    } catch (error) {
      console.error('Error getting few-shot examples:', error);
      return [];
    }
  }

  /**
   * Record successful use of a learned pattern
   */
  async recordPatternUsage(patternId) {
    try {
      const pattern = await LearningPattern.findById(patternId);
      if (pattern) {
        await pattern.recordUsage();
      }
    } catch (error) {
      console.error('Error recording pattern usage:', error);
    }
  }

  /**
   * Record failure of a learned pattern
   */
  async recordPatternFailure(patternId) {
    try {
      const pattern = await LearningPattern.findById(patternId);
      if (pattern) {
        await pattern.recordFailure();
      }
    } catch (error) {
      console.error('Error recording pattern failure:', error);
    }
  }

  /**
   * Extract keywords from command
   */
  extractKeywords(command) {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'];
    const words = command.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
    return [...new Set(words)]; // Remove duplicates
  }

  /**
   * Extract intent from user correction
   */
  extractIntent(userCorrection) {
    const action = userCorrection.action;
    const params = userCorrection.parameters || {};
    
    // Build intent string
    let intent = action;
    if (params.recipients && params.recipients.length > 0) {
      intent += '_with_recipients';
    }
    if (params.signatureFields && params.signatureFields.length > 0) {
      intent += '_with_signatures';
    }
    if (params.authMethods && params.authMethods.length > 0) {
      intent += '_with_auth';
    }
    if (params.isScheduled) {
      intent += '_scheduled';
    }
    
    return intent;
  }

  /**
   * Record user action for automatic detection
   */
  async recordUserAction(userId, action, parameters, source = 'manual', metadata = {}) {
    try {
      const userAction = new UserAction({
        userId,
        action,
        parameters,
        source,
        metadata
      });
      await userAction.save();

      // Try to match with recent failed attempts
      await this.tryMatchWithFailedAttempts(userId, userAction);
      
      return userAction;
    } catch (error) {
      console.error('Error recording user action:', error);
      throw error;
    }
  }

  /**
   * Try to match user action with recent failed attempts
   */
  async tryMatchWithFailedAttempts(userId, userAction) {
    try {
      // Find failed attempts from last 5 minutes without corrections
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const failedPatterns = await LearningPattern.find({
        userId,
        'metadata.learnedAt': { $gte: fiveMinutesAgo },
        'userCorrection.action': { $exists: false } // No correction yet
      }).sort({ 'metadata.learnedAt': -1 }).limit(5);

      for (const pattern of failedPatterns) {
        // Check if action type matches
        if (pattern.failedAttempt.aiAction === userAction.action) {
          // Check if parameters are similar (basic check)
          const paramsMatch = this.checkParameterSimilarity(
            pattern.failedAttempt.aiParameters,
            userAction.parameters
          );

          if (paramsMatch) {
            // Auto-record correction
            await this.recordUserCorrection(userId, pattern._id.toString(), {
              action: userAction.action,
              parameters: userAction.parameters,
              description: 'Automatically detected from user action',
              success: true
            });

            // Mark action as matched
            userAction.matchedPatternId = pattern._id;
            await userAction.save();

            console.log(`✅ Auto-matched user action with failed pattern ${pattern._id}`);
            break; // Only match with most recent failure
          }
        }
      }
    } catch (error) {
      console.error('Error matching user action with failed attempts:', error);
    }
  }

  /**
   * Check if parameters are similar (basic similarity check)
   */
  checkParameterSimilarity(params1, params2) {
    if (!params1 || !params2) return false;

    // Check key fields that matter
    const keyFields = ['recipients', 'documentId', 'signatureFields', 'category'];
    let matches = 0;
    let total = 0;

    for (const field of keyFields) {
      if (params1[field] !== undefined || params2[field] !== undefined) {
        total++;
        if (JSON.stringify(params1[field]) === JSON.stringify(params2[field])) {
          matches++;
        } else if (field === 'recipients' && Array.isArray(params1[field]) && Array.isArray(params2[field])) {
          // Check if recipient emails match
          const emails1 = params1[field].map((r) => r.email).sort();
          const emails2 = params2[field].map((r) => r.email).sort();
          if (JSON.stringify(emails1) === JSON.stringify(emails2)) {
            matches++;
          }
        }
      }
    }

    // If at least 50% of key fields match, consider it similar
    return total > 0 && matches / total >= 0.5;
  }

  /**
   * Get user's learning statistics
   */
  async getUserLearningStats(userId) {
    try {
      const totalPatterns = await LearningPattern.countDocuments({ userId });
      const patternsWithCorrections = await LearningPattern.countDocuments({
        userId,
        'userCorrection.action': { $exists: true }
      });
      const highConfidencePatterns = await LearningPattern.countDocuments({
        userId,
        'metadata.confidence': { $gte: 0.8 }
      });
      const mostUsedPattern = await LearningPattern.findOne({ userId })
        .sort({ 'metadata.usageCount': -1 })
        .select('pattern.intent metadata.usageCount');

      return {
        totalPatterns,
        patternsWithCorrections,
        highConfidencePatterns,
        mostUsedPattern: mostUsedPattern ? {
          intent: mostUsedPattern.pattern.intent,
          usageCount: mostUsedPattern.metadata.usageCount
        } : null
      };
    } catch (error) {
      console.error('Error getting learning stats:', error);
      return null;
    }
  }
}

module.exports = new LearningService();

