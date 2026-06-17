/**
 * AI Intent Detection Service
 * Classifies user questions into discrete financial intents so the
 * Gemini/OpenAI prompt can focus on the exact part of the context that
 * is relevant to the question.
 */
class AIIntentService {
  /**
   * Classify user questions into discrete financial intents
   * @param {String} question - The user's input query
   * @returns {String} intent - Detected intent
   */
  static detectIntent(question) {
    if (!question || typeof question !== 'string') {
      return 'GENERAL';
    }

    const q = question.toLowerCase().trim();

    // 0. EXPLAIN_DASHBOARD - Explain my dashboard calculations
    if (
      q.includes('explain my dashboard') ||
      q.includes('explain dashboard') ||
      q.includes('dashboard explanation') ||
      q.includes('dashboard audit') ||
      q.includes('explain this dashboard')
    ) {
      return 'EXPLAIN_DASHBOARD';
    }

    // 1. RECOVERY_SCORE - Why is my score low / how is score calculated
    if (
      q.includes('score') ||
      q.includes('rating') ||
      q.includes('recovery score') ||
      q.includes('health score') ||
      q.includes('how is my score') ||
      q.includes('why is my score') ||
      q.includes('improve my score') ||
      q.includes('score calculated') ||
      q.includes('score formula')
    ) {
      return 'RECOVERY_SCORE';
    }

    // 2. SIMULATOR - What-If EMI scenarios
    if (
      q.includes('simulator') ||
      q.includes('simulation') ||
      q.includes('increase emi') ||
      q.includes('proposed emi') ||
      q.includes('emi increase') ||
      q.includes('change emi') ||
      q.includes('accelerate emi') ||
      q.includes('extra emi') ||
      q.includes('higher emi') ||
      q.includes('what if i pay') ||
      q.includes('if i increase') ||
      q.includes('months reduced') ||
      q.includes('interest saved') ||
      q.includes('save interest') ||
      q.includes('pay extra')
    ) {
      return 'SIMULATOR';
    }

    // 3. FORECAST - Debt-free timeline
    if (
      q.includes('forecast') ||
      q.includes('debt free') ||
      q.includes('debt-free') ||
      q.includes('when will i') ||
      q.includes('when can i') ||
      q.includes('timeline') ||
      q.includes('payoff date') ||
      q.includes('clear debt') ||
      q.includes('finish paying') ||
      q.includes('months remaining') ||
      q.includes('how long')
    ) {
      return 'FORECAST';
    }

    // 4. LOAN_PRIORITY - Which loan to pay first / order of payoff
    if (
      q.includes('which loan') ||
      q.includes('pay first') ||
      q.includes('priority') ||
      q.includes('prioritize') ||
      q.includes('avalanche') ||
      q.includes('snowball') ||
      q.includes('pay off') ||
      q.includes('payoff order') ||
      q.includes('loan order') ||
      q.includes('highest interest') ||
      q.includes('smallest debt') ||
      q.includes('loan priority')
    ) {
      return 'LOAN_PRIORITY';
    }

    // 5. DEBT_REDUCTION - General debt reduction strategy
    if (
      q.includes('reduce debt') ||
      q.includes('reduce my debt') ||
      q.includes('lower debt') ||
      q.includes('debt reduction') ||
      q.includes('debt strategy') ||
      q.includes('consolidate') ||
      q.includes('debt consolidation') ||
      q.includes('get out of debt') ||
      q.includes('manage debt') ||
      q.includes('pay down')
    ) {
      return 'DEBT_REDUCTION';
    }

    // 6. EMERGENCY_FUND - Emergency fund questions
    if (
      q.includes('emergency fund') ||
      q.includes('emergency savings') ||
      q.includes('rainy day') ||
      q.includes('emergency reserve') ||
      q.includes('emergency corpus') ||
      q.includes('how much should i keep') ||
      q.includes('financial safety net')
    ) {
      return 'EMERGENCY_FUND';
    }

    // 7. BUDGETING - Budget and expense management
    if (
      q.includes('budget') ||
      q.includes('budgeting') ||
      q.includes('save more') ||
      q.includes('save money') ||
      q.includes('reduce expense') ||
      q.includes('cut spending') ||
      q.includes('spending habits') ||
      q.includes('cash flow') ||
      q.includes('monthly expense') ||
      q.includes('50/30/20') ||
      q.includes('where is my money') ||
      q.includes('track expense')
    ) {
      return 'BUDGETING';
    }

    // 8. DTI - Debt-to-income questions
    if (
      q.includes('dti') ||
      q.includes('debt to income') ||
      q.includes('debt-to-income') ||
      q.includes('income ratio') ||
      q.includes('loan burden') ||
      q.includes('affordable') ||
      q.includes('can i afford')
    ) {
      return 'DTI';
    }

    // 9. PAYMENT_HISTORY - Questions about missed payments
    if (
      q.includes('payment history') ||
      q.includes('missed payment') ||
      q.includes('late payment') ||
      q.includes('overdue') ||
      q.includes('compliance') ||
      q.includes('on-time') ||
      q.includes('emi compliance') ||
      q.includes('defaulted')
    ) {
      return 'PAYMENT_HISTORY';
    }

    return 'GENERAL';
  }
}

module.exports = AIIntentService;
