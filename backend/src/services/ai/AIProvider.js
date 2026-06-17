/**
 * AI Provider Interface
 * All concrete providers must implement generateFinancialAdvice() and
 * return an object matching the standard AI response schema:
 * {
 *   provider: String,
 *   directAnswer: String,        // Specific answer to the user question
 *   summary: String,             // Friendly overall summary
 *   calculationExplanation: String|null, // Explains how the backend calculated a number (if relevant)
 *   recommendations: String[],
 *   warnings: String[],
 *   budgetingTips: String[],
 *   nextActions: String[]        // Concrete, numbered action items
 * }
 */
class AIProvider {
  /**
   * Generate financial advice for a user
   * @param {Object} data - Complete financial context payload from aiController
   * @returns {Promise<Object>} advice - Structured advice response
   */
  async generateFinancialAdvice(data) {
    throw new Error('Method generateFinancialAdvice() must be implemented.');
  }
}

module.exports = AIProvider;
