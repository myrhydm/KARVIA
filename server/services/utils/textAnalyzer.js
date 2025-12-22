/**
 * Text analysis utilities extracted from scoring engine
 */
class TextAnalyzer {
    static analyzeTextQuality(text) {
      if (!text) return { 
        wordCount: 0, 
        specificityScore: 0, 
        emotionalIntensity: 0, 
        hasNumbers: false, 
        hasExamples: false, 
        hasPersonalStory: false, 
        hasScheduleDetails: false, 
        complexity: 0 
      };
  
      const words = text.split(/\s+/).filter(w => w.length > 0);
      const wordCount = words.length;
  
      // Specificity indicators
      const specificWords = ['specific', 'exactly', 'precisely', 'particular', 'detailed'];
      const specificityScore = specificWords.filter(w => text.toLowerCase().includes(w)).length / specificWords.length;
  
      // Emotional intensity
      const emotionalWords = ['passionate', 'excited', 'frustrated', 'angry', 'love', 'hate', 'dream', 'fear', 'hope', 'desperate', 'determined'];
      const emotionalIntensity = emotionalWords.filter(w => text.toLowerCase().includes(w)).length / emotionalWords.length;
  
      // Numbers present
      const hasNumbers = /\d/.test(text);
  
      // Examples present
      const hasExamples = text.toLowerCase().includes('example') || text.toLowerCase().includes('instance') || text.toLowerCase().includes('like when');
  
      // Personal story indicators
      const hasPersonalStory = text.toLowerCase().includes('my') || text.toLowerCase().includes('i ') || text.toLowerCase().includes('when i');
  
      // Schedule details
      const hasScheduleDetails = text.toLowerCase().includes('am') || text.toLowerCase().includes('pm') || 
                                text.toLowerCase().includes('morning') || text.toLowerCase().includes('evening') ||
                                text.toLowerCase().includes('monday') || text.toLowerCase().includes('tuesday');
  
      // Complexity (sentence length variance)
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / Math.max(sentences.length, 1);
      const complexity = Math.min(avgSentenceLength / 20, 1); // Normalize to 0-1
  
      return {
        wordCount,
        specificityScore,
        emotionalIntensity,
        hasNumbers,
        hasExamples,
        hasPersonalStory,
        hasScheduleDetails,
        complexity
      };
    }
  
    static calculateTextSimilarity(text1, text2) {
      if (!text1 || !text2) return 0;
      
      const words1 = new Set(text1.toLowerCase().split(/\s+/));
      const words2 = new Set(text2.toLowerCase().split(/\s+/));
      
      const intersection = new Set([...words1].filter(w => words2.has(w)));
      const union = new Set([...words1, ...words2]);
      
      return intersection.size / union.size;
    }
  
    static findRelevantKeywords(dream, resumeKeywords) {
      const dreamWords = dream.split(/\s+/).map(w => w.toLowerCase());
      return resumeKeywords.filter(keyword => 
        dreamWords.some(word => word.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(word))
      );
    }
  }
  
  module.exports = { TextAnalyzer };
  
