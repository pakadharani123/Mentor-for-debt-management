const OpenAI = require('openai');
const AIProvider = require('./AIProvider');
const GeminiProvider = require('./GeminiProvider'); // reuse intent instructions
const config = require('../../config/config');

class OpenAIProvider extends AIProvider {
  constructor() {
    super();
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Financial Recovery Platform'
      }
    });
    // Reuse intent instruction builder from GeminiProvider
    this._buildIntentInstructions = GeminiProvider.prototype._buildIntentInstructions.bind(this);
  }

  async generateFinancialAdvice(payload) {
    if (!config.openaiApiKey) {
      throw new Error('OpenAI API Key is missing. Check your .env file.');
    }

    const {
      userQuestion,
      intent,
      conversationHistory = [],
      language,
      profile,
      recoveryScore,
      loans,
      loanCount,
      totalEMI,
      remainingDebt,
      paidOffLoansCount,
      paymentHistory,
      expenseBreakdown,
      debtForecast,
      strategyComparison,
      simulatorResults,
      averageInterestRate
    } = payload;

    const langName = { en: 'English', te: 'Telugu', hi: 'Hindi', ta: 'Tamil' }[language] || 'English';

    const historyContext = conversationHistory.length > 0
      ? `\nPREVIOUS CONVERSATION (for context only):\n` +
        conversationHistory.slice(-4).map(h => {
          const sender = h.role === 'user' ? 'User' : 'Coach';
          return `${sender}: "${h.content}"`;
        }).join('\n') + '\n'
      : '';

    const intentInstructions = this._buildIntentInstructions(intent, payload);

    const loansContext = loanCount > 0
      ? loans.map((l, i) =>
          `  Loan ${i + 1}: ${l.name} (${l.type}) - Principal Rs. ${l.principalAmount}, Remaining Rs. ${l.remainingAmount} (${l.percentagePaid}% paid), Rate ${l.interestRate}%, EMI Rs. ${l.emi}`
        ).join('\n')
      : '  No active loans.';

    const expenseContext = expenseBreakdown.length > 0
      ? expenseBreakdown.map(e => `  ${e.category}: Rs. ${e.amount}`).join('\n')
      : '  No expense data.';

    const systemMessage = `You are a professional financial advisor. You have complete access to the user's financial profile, including its update history (audit trail).
If asked why metrics (like Recovery Score, DTI, surplus, etc.) increased or decreased, check the PROFILE UPDATE HISTORY (AUDIT TRAIL) to explain that these changes reflect updates made to their financial profile (e.g. updating income, expenses, savings, or emergency fund).
Always explain: what, why, how, source data, calculation formula, impact, and recommended actions.
Never provide generic advice. Always reference the user's actual data.
If a calculation exists, show the exact formula. If a score exists, show the score breakdown. If a forecast exists, explain how it was generated.
Never invent values. Never assume expenses or loans are paid. Use only backend-provided values.
Respond in ${langName} and return ONLY valid JSON.`;

    const userMessage = `${historyContext}
USER'S QUESTION: "${userQuestion}"
DETECTED INTENT: ${intent}

COMPLETE ACCOUNT CONTEXT (Calculated by secure backend algorithms):
- Monthly Income: Rs. ${profile.monthlyIncome}
- Monthly Expenses (excluding EMIs): Rs. ${profile.monthlyExpenses}
- Total Monthly EMIs: Rs. ${totalEMI}
- Monthly Surplus: Rs. ${profile.surplus}
- Debt-to-Income (DTI) Ratio: ${profile.dti}%
- Total Savings: Rs. ${profile.savings}
- Emergency Fund: Rs. ${profile.emergencyFund} (covers ${profile.emergencyFundMonths} months of expenses)

PROFILE UPDATE HISTORY (AUDIT TRAIL):
${profile.auditTrail && profile.auditTrail.length > 0 ? profile.auditTrail.map(t => `- Updated ${t.field} from Rs. ${t.previousValue} to Rs. ${t.newValue} on ${new Date(t.updatedAt).toISOString().split('T')[0]}`).join('\n') : '- No profile updates recorded yet.'}

🏦 ACTIVE LOANS (${loanCount} active):
${loansContext}
Total Outstanding Debt: Rs. ${remainingDebt}
Average Interest Rate: ${averageInterestRate}%

💳 PAYMENT HISTORY:
- Compliance Rate: ${paymentHistory.compliancePercent}%
- On-Time: ${paymentHistory.paidOnTime} / ${paymentHistory.totalPayments}
- Missed: ${paymentHistory.missedPayments} | Late: ${paymentHistory.latePayments}

🧮 RECOVERY SCORE: ${recoveryScore.score}/100 — Category: ${recoveryScore.category}
Factors Breakdown:
- DTI Ratio: ${recoveryScore.factors?.debtToIncomeRatio?.value}% → ${recoveryScore.factors?.debtToIncomeRatio?.score}/20 pts
- Savings Ratio: ${recoveryScore.factors?.savingsRatio?.value}% → ${recoveryScore.factors?.savingsRatio?.score}/15 pts
- Emergency Fund: ${recoveryScore.factors?.emergencyFundMonths?.value} months → ${recoveryScore.factors?.emergencyFundMonths?.score}/15 pts
- Loan Count: ${loanCount} → ${recoveryScore.factors?.loanCount?.score}/10 pts
- EMI Burden: ${recoveryScore.factors?.emiBurdenRatio?.value}% → ${recoveryScore.factors?.emiBurdenRatio?.score}/10 pts
- Payment Compliance: ${paymentHistory.compliancePercent}% → ${recoveryScore.factors?.paymentCompliance?.score}/15 pts
- Surplus Ratio: ${recoveryScore.factors?.surplusRatio?.value}% → ${recoveryScore.factors?.surplusRatio?.score}/15 pts

📅 DEBT FORECAST:
- Estimated Debt-Free Date: ${debtForecast.estimatedDebtFreeDate}
- Months Remaining: ${debtForecast.payoffMonthsRemaining}
- Recommended Monthly Payment: Rs. ${debtForecast.recommendedMonthlyPayment}
- Total Remaining Interest: Rs. ${debtForecast.totalInterestRemaining}

⚡ WHAT-IF SIMULATOR RESULT:
- Target Loan: ${simulatorResults.targetLoan || 'N/A'}
- Proposed EMI: Rs. ${simulatorResults.proposedEmi}
- Months Saved: ${simulatorResults.monthsReduced}
- Interest Saved: Rs. ${simulatorResults.interestSaved}

11. For any expense in the provided expenses ledger where paymentStatus is NOT 'Paid' (i.e. 'Pending', 'Upcoming', 'Overdue', or 'Partially Paid'), you MUST explicitly state: "I see this expense [Category/Description] exists but payment has not been confirmed." in your response. Never assume it was paid.

Return exactly this JSON schema (all values translated to ${langName}):
{
  "directAnswer": "1-3 sentence direct answer to the user's specific question, referencing actual data. If there are unpaid expenses, include the required 'I see this expense exists but payment has not been confirmed.' disclaimers here.",
  "summary": "Friendly overview paragraph explaining the what, why, and how of their situation.",
  "calculationExplanation": "Detailed step-by-step formula and arithmetic breakdown of the metric in question (e.g. DTI, surplus, score factors, etc.). Show source data and inputs clearly.",
  "recommendations": ["Action item 1", "Action item 2", "Action item 3"],
  "warnings": ["Critical warning if any risk detected (e.g. high DTI, overdue bills)"],
  "budgetingTips": ["Specific budgeting tip referencing their actual expenses or surplus"],
  "nextActions": ["Immediate step 1", "Immediate step 2", "Immediate step 3"],
  "dataUsed": {
    "income": "INR amount",
    "savings": "INR amount",
    "loans": "Brief summary text or INR outstanding amount",
    "expenses": "Brief summary text or INR estimated/actual amount"
  },
  "calculation": "Clear formula and step-by-step arithmetic (e.g., Surplus = Income - Paid Expenses - EMI = Rs. X - Rs. Y - Rs. Z = Rs. W)",
  "whyRecommendation": "Detailed rationale for why these recommendations were suggested (e.g. Building emergency fund because your current cushion covers only 2 months of expenses, which is below the safe threshold of 3 months).",
  "confidenceLevel": "High, Medium, or Low (choose one based on payment history compliance - e.g. High if compliance > 90%, Medium if > 70%, otherwise Low)"
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ],
        response_format: { type: 'json_object' }
      });

      const textResponse = response.choices[0].message.content;
      let cleanResponse = textResponse.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const parsedAdvice = JSON.parse(cleanResponse);
      return {
        provider: 'openai',
        intent,
        ...parsedAdvice
      };
    } catch (error) {
      console.error('OpenAI Provider Error:', error);
      throw new Error(`OpenAI explanation failed: ${error.message}`);
    }
  }
}

module.exports = OpenAIProvider;
