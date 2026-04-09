import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, X, Send } from 'lucide-react';
const TEMPLATE_SERVICE_URL = import.meta.env.VITE_TEMPLATE_SERVICE_URL || 'http://165.22.215.73:2106';

interface FeedbackCategory {
  id: number;
  name: string;
  description: string;
}

interface FeedbackButtonsProps {
  messageId: string;
  sessionId: string;
  messageContent: string;
  userMessage?: string;
  templateType?: string;
  onFeedbackSubmit?: (type: 'like' | 'dislike') => void;
}

const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({
  messageId,
  sessionId,
  messageContent,
  userMessage,
  templateType,
  onFeedbackSubmit
}) => {
  const [feedbackType, setFeedbackType] = useState<'like' | 'dislike' | null>(null);
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
  const [comment, setComment] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [categories, setCategories] = useState<FeedbackCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Load categories and existing feedback on mount
  useEffect(() => {
    loadCategories();
    loadExistingFeedback();
  }, [messageId]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/ai-feedback/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadExistingFeedback = async () => {
    try {
      const response = await fetch(
        `/api/ai-feedback/message/${messageId}?sessionId=${sessionId}`
      );
      const data = await response.json();
      if (data.success && data.data) {
        setFeedbackType(data.data.feedbackType);
        setComment(data.data.feedbackComment || '');
        setSelectedCategories(data.data.categories || []);
        setHasSubmitted(true);
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
    }
  };

  const handleQuickFeedback = async (type: 'like' | 'dislike') => {
    if (hasSubmitted && feedbackType === type) {
      // If clicking the same button again, show detailed feedback
      setShowDetailedFeedback(true);
      return;
    }

    setFeedbackType(type);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${TEMPLATE_SERVICE_URL}/public/ai-content/ai-feedback/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          })
        },
        body: JSON.stringify({
          messageId,
          sessionId,
          feedbackType: type,
          templateType,
          userMessage,
          aiResponse: messageContent
        })
      });

      const data = await response.json();
      if (data.success) {
        setHasSubmitted(true);
        onFeedbackSubmit?.(type);
        
        // Show detailed feedback for dislikes
        if (type === 'dislike') {
          setShowDetailedFeedback(true);
        }
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDetailedFeedback = async () => {
    if (!feedbackType) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`${TEMPLATE_SERVICE_URL}/public/ai-content/ai-feedback/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          })
        },
        body: JSON.stringify({
          messageId,
          sessionId,
          feedbackType,
          feedbackComment: comment,
          categories: selectedCategories,
          templateType,
          userMessage,
          aiResponse: messageContent
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowDetailedFeedback(false);
        setHasSubmitted(true);
           setComment('');
      }
    } catch (error) {
      console.error('Error submitting detailed feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const relevantCategories = categories.filter(cat => {
    if (feedbackType === 'like') {
      return ['Helpful', 'Well Formatted', 'Other'].includes(cat.name);
    } else {
      return ![' Helpful', 'Well Formatted'].includes(cat.name);
    }
  });

  return (
    <div className="mt-2">
      {/* Quick Feedback Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleQuickFeedback('like')}
          disabled={isSubmitting}
          className={`p-2 rounded-lg transition-all duration-200 ${
            feedbackType === 'like'
              ? 'bg-accent-green/15 text-accent-green'
              : 'hover:bg-muted text-muted-foreground'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title="This response was helpful"
        >
          <ThumbsUp className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => handleQuickFeedback('dislike')}
          disabled={isSubmitting}
          className={`p-2 rounded-lg transition-all duration-200 ${
            feedbackType === 'dislike'
              ? 'bg-destructive/15 text-destructive'
              : 'hover:bg-muted text-muted-foreground'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title="This response needs improvement"
        >
          <ThumbsDown className="w-4 h-4" />
        </button>

        {hasSubmitted && (
          <span className="text-xs text-muted-foreground ml-2">
            Thanks for your feedback!
          </span>
        )}
      </div>

      {/* Detailed Feedback Modal */}
      {showDetailedFeedback && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto text-foreground">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Provide Additional Feedback
                </h3>
                <button
                  type="button"
                  onClick={() => setShowDetailedFeedback(false)}
                  className="p-1 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categories */}
              {relevantCategories.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground/90 mb-2">
                    What could be improved? (Optional)
                  </label>
                  <div className="space-y-2">
                    {relevantCategories.map(category => (
                      <label
                        key={category.id}
                        className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category.id)}
                          onChange={() => toggleCategory(category.id)}
                          className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/30"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground">
                            {category.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {category.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Comment */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground/90 mb-2">
                  Additional comments (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us more about your experience..."
                  rows={4}
                  className="w-full px-3 py-2 border border-border bg-background text-foreground placeholder:text-muted-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDetailedFeedback(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDetailedFeedback}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Feedback</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackButtons;