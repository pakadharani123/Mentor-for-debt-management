const { GoogleGenerativeAI } = require('@google/generative-ai');
const AIProvider = require('./AIProvider');
const config = require('../../config/config');

class GeminiProvider extends AIProvider {
  constructor() {
    super();
    if (config.geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    }
  }

  /**
   * Build intent-specific instructions for the prompt
   */
  _buildIntentInstructions(intent, payload) {
    const {
      profile, recoveryScore, loans, loanCount, totalEMI, remainingDebt,
      debtForecast, simulatorResults, strategyComparison, paymentHistory,
      expenseStatus
    } = payload;

    switch (intent) {
      case 'EXPLAIN_DASHBOARD':
        return `The user is requesting a complete financial audit explanation of their entire dashboard.
Your response MUST explain the following 4 key sections step-by-step:
1. Current Financial Status: Clear summary of their monthly income (Rs. ${profile.monthlyIncome}), active loans count (${loanCount}), total outstanding debt (Rs. ${remainingDebt}), savings (Rs. ${profile.savings}), and emergency fund (Rs. ${profile.emergencyFund}) covering ${profile.emergencyFundMonths} months.
2. Recovery Score Explanation: State their score (${recoveryScore.score}/100) and why it's categorized as "${recoveryScore.category}". List which factors raised or lowered it, referencing active DTI (${profile.dti}%), savings ratio (${profile.savingsRatio}%), emergency fund months (${profile.emergencyFundMonths}), active loans count (${loanCount}), payment compliance (${paymentHistory.compliancePercent}%), and monthly surplus ratio (${recoveryScore.factors?.surplusRatio?.value}%).
3. DTI Calculation Breakdown: Show the exact math formula used: DTI = (Total Monthly EMI / Monthly Income) * 100. Show actual values: (Rs. ${totalEMI} / Rs. ${profile.monthlyIncome}) * 100 = ${profile.dti}%.
4. Surplus Breakdown: Show the exact subtraction math: Income (Rs. ${profile.monthlyIncome}) - Paid Expenses (Rs. ${expenseStatus?.paidTotal || 0}) - Monthly EMIs (Rs. ${totalEMI}) = Surplus (Rs. ${profile.surplus}).
TRUST REQUIREMENT: For every single number displayed, clearly state its source data inputs so the user knows exactly where it came from. Speak like a professional financial advisor.`;

      case 'RECOVERY_SCORE':
        return `The user is asking about their Financial Recovery Score.
Your response MUST:
- State their score (${recoveryScore.score}/100) and category (${recoveryScore.category}) clearly upfront.
- Explain HOW the backend calculated this score using these 7 weighted factors:
  1. DTI Ratio (20 pts) — Current: ${recoveryScore.factors?.debtToIncomeRatio?.value}%, Score: ${recoveryScore.factors?.debtToIncomeRatio?.score}/20
  2. Savings Ratio (15 pts) — Current: ${recoveryScore.factors?.savingsRatio?.value}%, Score: ${recoveryScore.factors?.savingsRatio?.score}/15
  3. Emergency Fund Months (15 pts) — Current: ${recoveryScore.factors?.emergencyFundMonths?.value} months, Score: ${recoveryScore.factors?.emergencyFundMonths?.score}/15
  4. Number of Active Loans (10 pts) — Current: ${loanCount} loans, Score: ${recoveryScore.factors?.loanCount?.score}/10
  5. EMI Burden Ratio (10 pts) — Score: ${recoveryScore.factors?.emiBurdenRatio?.score}/10
  6. Payment Compliance (15 pts) — Current: ${paymentHistory.compliancePercent}%, Score: ${recoveryScore.factors?.paymentCompliance?.score}/15
  7. Monthly Surplus Ratio (15 pts) — Score: ${recoveryScore.factors?.surplusRatio?.score}/15
- Mention identified strengths: ${(recoveryScore.strengths || []).join(', ') || 'None'}
- Mention identified weaknesses: ${(recoveryScore.weaknesses || []).join(', ') || 'None'}
- Explain what improvements would raise the score the most.`;

      case 'SIMULATOR':
        return `The user is asking about What-If EMI simulation results.
Your response MUST:
- Directly state the simulation result: increasing EMI on "${simulatorResults.targetLoan}" to Rs. ${simulatorResults.proposedEmi} will reduce the payoff period by ${simulatorResults.monthsReduced} months and save Rs. ${simulatorResults.interestSaved} in interest.
- Explain HOW the simulator works: it uses amortization — each month, interest is calculated on the remaining balance, and a higher EMI means more principal is paid down, compounding the benefit.
- Help the user decide if the proposed EMI is affordable given their monthly surplus of Rs. ${profile.surplus}.`;

      case 'FORECAST':
        return `The user is asking about their debt payoff forecast / timeline.
Your response MUST:
- State their estimated debt-free date: ${debtForecast.estimatedDebtFreeDate} (${debtForecast.payoffMonthsRemaining} months from now).
- Explain that this date uses the Avalanche strategy with the recommended monthly payment of Rs. ${debtForecast.recommendedMonthlyPayment}.
- Mention total remaining interest to be paid: Rs. ${debtForecast.totalInterestRemaining}.
- Explain what would happen if they fall behind — missing the recommended payment would push the date further out.`;

      case 'LOAN_PRIORITY':
        const avalancheOrder = strategyComparison?.avalanche?.order?.join(' → ') || 'N/A';
        const snowballOrder = strategyComparison?.snowball?.order?.join(' → ') || 'N/A';
        return `The user is asking which loan to pay off first / loan priority order.
Your response MUST:
- Explain the Avalanche strategy (highest interest rate first): Order: ${avalancheOrder}. Total interest paid: Rs. ${strategyComparison?.avalanche?.totalInterestPaid}, Time: ${strategyComparison?.avalanche?.totalMonths} months.
- Explain the Snowball strategy (smallest balance first): Order: ${snowballOrder}. Total interest paid: Rs. ${strategyComparison?.snowball?.totalInterestPaid}, Time: ${strategyComparison?.snowball?.totalMonths} months.
- Recommend which strategy fits better for this user based on their loan types and amounts.
- List their active loans: ${loans.map(l => `${l.name} (${l.type}, ${l.interestRate}% interest, Rs. ${l.remainingAmount} remaining)`).join(' | ')}`;

      case 'DEBT_REDUCTION':
        return `The user wants a debt reduction strategy.
Your response MUST:
- Acknowledge their current debt situation: Rs. ${remainingDebt} remaining across ${loanCount} active loans, total EMI of Rs. ${totalEMI}.
- Recommend specific strategies: EMI acceleration, avoiding new credit, using surplus (Rs. ${profile.surplus}/month) productively.
- Mention the current DTI of ${profile.dti}% and what is healthy (below 35%).`;

      case 'EMERGENCY_FUND':
        return `The user is asking about their emergency fund.
Your response MUST:
- State their current emergency fund: Rs. ${profile.emergencyFund} which covers ${profile.emergencyFundMonths} months of expenses.
- Explain the ideal target is 3-6 months of monthly expenses (Rs. ${profile.monthlyExpenses * 3} to Rs. ${profile.monthlyExpenses * 6}).
- Give a practical plan to build/top-up the fund using their monthly surplus of Rs. ${profile.surplus}.`;

      case 'BUDGETING':
        return `The user is asking about budgeting, savings, or expense management.
Your response MUST:
- Explain the 50/30/20 rule applied to their income of Rs. ${profile.monthlyIncome}: Needs (50%) = Rs. ${Math.round(profile.monthlyIncome * 0.5)}, Wants (30%) = Rs. ${Math.round(profile.monthlyIncome * 0.3)}, Savings+Debt (20%) = Rs. ${Math.round(profile.monthlyIncome * 0.2)}.
- Evaluate if their current expenses (Rs. ${profile.monthlyExpenses}) and EMIs (Rs. ${totalEMI}) are within a healthy range.
- Provide 3 actionable budgeting tips tailored to their surplus of Rs. ${profile.surplus}.`;

      case 'DTI':
        return `The user is asking about their Debt-to-Income (DTI) ratio.
Your response MUST:
- State their DTI clearly: ${profile.dti}%. This is calculated as (Total Monthly EMI ÷ Monthly Income) × 100 = (Rs. ${totalEMI} ÷ Rs. ${profile.monthlyIncome}) × 100.
- Interpret this ratio: DTI below 20% = Excellent, 20-35% = Good, 35-50% = Caution, above 50% = Danger.
- Explain the impact of high DTI on their ability to get future loans and their recovery score.`;

      case 'PAYMENT_HISTORY':
        return `The user is asking about their payment history or missed payments.
Your response MUST:
- State their compliance: ${paymentHistory.paidOnTime} on-time payments out of ${paymentHistory.totalPayments} total. Missed: ${paymentHistory.missedPayments}, Late: ${paymentHistory.latePayments}.
- Explain how payment compliance affects their recovery score (the compliance factor contributes up to 15 points).
- Provide advice on preventing future missed payments (auto-debit, calendar reminders, maintaining a buffer fund).`;

      case 'GENERAL':
      default:
        return `Provide a comprehensive financial health overview.
Your response MUST:
- Summarize their key financial position: Income Rs. ${profile.monthlyIncome}, Expenses Rs. ${profile.monthlyExpenses}, EMIs Rs. ${totalEMI}, Surplus Rs. ${profile.surplus}.
- Highlight their Recovery Score of ${recoveryScore.score}/100 (${recoveryScore.category}) and the top 2 actions to improve it.
- Give 3 specific, actionable next steps tailored to their situation.`;
    }
  }

  async generateFinancialAdvice(payload) {
    if (!config.geminiApiKey) {
      throw new Error('Gemini API Key is missing. Check your .env file.');
    }

    const {
      userQuestion, intent, conversationHistory = [], language,
      profile, recoveryScore, loans, loanCount, totalEMI, remainingDebt,
      totalPrincipal, averageInterestRate, paidOffLoansCount, paymentHistory,
      expenseBreakdown, expenseStatus, debtForecast, strategyComparison, simulatorResults
    } = payload;

    const langName = { en: 'English', te: 'Telugu', hi: 'Hindi', ta: 'Tamil' }[language] || 'English';

    const historyContext = conversationHistory.length > 0
      ? `\nPREVIOUS CONVERSATION (for context only — do not repeat these answers):\n` +
        conversationHistory.slice(-4).map(h => {
          const sender = h.role === 'user' ? 'User' : 'Coach';
          return `${sender}: "${h.content}"`;
        }).join('\n') + '\n'
      : '';

    const intentInstructions = this._buildIntentInstructions(intent, payload);

    const loansContext = loanCount > 0
      ? loans.map((l, i) =>
          `  Loan ${i + 1}: ${l.name} (${l.type})\n    - Principal: Rs. ${l.principalAmount} | Remaining: Rs. ${l.remainingAmount} (${l.percentagePaid}% paid)\n    - Interest Rate: ${l.interestRate}% per annum | Monthly EMI: Rs. ${l.emi}`
        ).join('\n')
      : '  No active loans.';

    const paidBreakdown    = expenseBreakdown.filter(e => e.status === 'Paid');
    const pendingBreakdown = expenseBreakdown.filter(e => e.status === 'Pending');
    const overdueBreakdown = expenseBreakdown.filter(e => e.status === 'Overdue');

    const expenseContext = `
  • ACTUAL PAID OUTFLOW: Rs. ${expenseStatus?.paidTotal || 0} (${expenseStatus?.paidCount || 0} expenses confirmed paid)
${paidBreakdown.length > 0 ? paidBreakdown.map(e => `    - ${e.category}: Rs. ${e.amount} [Paid]`).join('\n') : '    - No paid expenses recorded.'}
  • UPCOMING OBLIGATIONS: Rs. ${expenseStatus?.pendingTotal || 0} (${expenseStatus?.pendingCount || 0} pending)
${pendingBreakdown.length > 0 ? pendingBreakdown.map(e => `    - ${e.category}: Rs. ${e.amount} [Pending, due ${e.dueDate}]`).join('\n') : '    - No pending expenses.'}
  • OVERDUE UNPAID: Rs. ${expenseStatus?.overdueTotal || 0} (${expenseStatus?.overdueCount || 0} overdue)
${overdueBreakdown.length > 0 ? overdueBreakdown.map(e => `    - ${e.category}: Rs. ${e.amount} [OVERDUE since ${e.dueDate}]`).join('\n') : '    - No overdue expenses.'}
  IMPORTANT: Do NOT say the user "spent" any amount unless it is marked Paid.`;

    const prompt = `You are a professional financial advisor.
You have complete access to the user's financial profile, including its update history (audit trail).

Your response MUST adhere to the following rules:
1. ALWAYS explain: What the metric is, Why it is at its current value, How it was calculated, Source data, Calculation formula, Impact, Recommended actions.
2. NEVER provide generic advice. Always reference the user's actual data.
3. If a calculation exists: Show the exact formula and numbers used.
4. If a score exists: Show the score breakdown and factors.
5. NEVER invent, estimate, modify, or project any numbers or dates.
6. NEVER assume expenses are paid unless explicitly marked as "Paid".
7. Use ONLY backend-provided values.

USER'S QUESTION: "${userQuestion}"
DETECTED INTENT: ${intent}

${historyContext}

COMPLETE ACCOUNT CONTEXT:
- Monthly Income: Rs. ${profile.monthlyIncome}
- Monthly Expenses (excluding EMIs): Rs. ${profile.monthlyExpenses}
- Total Monthly EMIs: Rs. ${totalEMI}
- Monthly Surplus: Rs. ${profile.surplus}
- DTI Ratio: ${profile.dti}%
- Total Savings: Rs. ${profile.savings}
- Emergency Fund: Rs. ${profile.emergencyFund} (covers ${profile.emergencyFundMonths} months)

PROFILE AUDIT TRAIL:
${profile.auditTrail && profile.auditTrail.length > 0 ? profile.auditTrail.map(t => `- Updated ${t.field} from Rs. ${t.previousValue} to Rs. ${t.newValue} on ${new Date(t.updatedAt).toISOString().split('T')[0]}`).join('\n') : '- No profile updates recorded yet.'}

ACTIVE LOANS (${loanCount} active):
${loansContext}
Total Outstanding Debt: Rs. ${remainingDebt}
Average Interest Rate: ${averageInterestRate}%

PAYMENT HISTORY:
- Compliance Rate: ${paymentHistory.compliancePercent}%
- On-Time: ${paymentHistory.paidOnTime} / ${paymentHistory.totalPayments}
- Missed: ${paymentHistory.missedPayments} | Late: ${paymentHistory.latePayments}

RECOVERY SCORE: ${recoveryScore.score}/100 — Category: ${recoveryScore.category}
- DTI Ratio: ${recoveryScore.factors?.debtToIncomeRatio?.value}% → ${recoveryScore.factors?.debtToIncomeRatio?.score}/20 pts
- Savings Ratio: ${recoveryScore.factors?.savingsRatio?.value}% → ${recoveryScore.factors?.savingsRatio?.score}/15 pts
- Emergency Fund: ${recoveryScore.factors?.emergencyFundMonths?.value} months → ${recoveryScore.factors?.emergencyFundMonths?.score}/15 pts
- Loan Count: ${loanCount} → ${recoveryScore.factors?.loanCount?.score}/10 pts
- EMI Burden: ${recoveryScore.factors?.emiBurdenRatio?.value}% → ${recoveryScore.factors?.emiBurdenRatio?.score}/10 pts
- Payment Compliance: ${paymentHistory.compliancePercent}% → ${recoveryScore.factors?.paymentCompliance?.score}/15 pts
- Surplus Ratio: ${recoveryScore.factors?.surplusRatio?.value}% → ${recoveryScore.factors?.surplusRatio?.score}/15 pts

DEBT FORECAST:
- Estimated Debt-Free Date: ${debtForecast.estimatedDebtFreeDate}
- Months Remaining: ${debtForecast.payoffMonthsRemaining}
- Recommended Monthly Payment: Rs. ${debtForecast.recommendedMonthlyPayment}
- Total Remaining Interest: Rs. ${debtForecast.totalInterestRemaining}

WHAT-IF SIMULATOR:
- Target Loan: ${simulatorResults.targetLoan || 'N/A'}
- Proposed EMI: Rs. ${simulatorResults.proposedEmi}
- Months Saved: ${simulatorResults.monthsReduced}
- Interest Saved: Rs. ${simulatorResults.interestSaved}

EXPENSE OBLIGATIONS:
${expenseContext}

INTENT-SPECIFIC INSTRUCTIONS:
${intentInstructions}

Return exactly this JSON schema (all values in ${langName}):
{
  "directAnswer": "1-3 sentence direct answer referencing actual data.",
  "summary": "Friendly overview paragraph explaining the what, why, and how.",
  "calculationExplanation": "Detailed step-by-step formula and arithmetic breakdown.",
  "recommendations": ["Action item 1", "Action item 2", "Action item 3"],
  "warnings": ["Critical warning if any risk detected"],
  "budgetingTips": ["Specific budgeting tip referencing their actual data"],
  "nextActions": ["Immediate step 1", "Immediate step 2", "Immediate step 3"],
  "dataUsed": {
    "income": "INR amount",
    "savings": "INR amount",
    "loans": "Brief summary or INR outstanding",
    "expenses": "Brief summary or INR amount"
  },
  "calculation": "Clear formula and step-by-step arithmetic",
  "whyRecommendation": "Detailed rationale for why these recommendations were suggested.",
  "confidenceLevel": "High, Medium, or Low"
}`;

    // ── Retry with exponential backoff + model fallback ─────────────────
    // gemini-flash-latest (Gemini 1.5 Flash) first (3 attempts), then fall back to gemini-2.5-flash
    const MODELS      = ['gemini-flash-latest', 'gemini-2.5-flash'];
    const MAX_RETRIES = 3;
    const BASE_DELAY  = 1500; // ms

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const isRetryable = (err) => {
      const msg = err.message || '';
      return (
        msg.includes('503') || msg.includes('Service Unavailable') ||
        msg.includes('overloaded') || msg.includes('high demand') ||
        msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429') ||
        msg.includes('rate limit')
      );
    };

    let lastError;

    for (const modelName of MODELS) {
      const model = this.genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: 'application/json' }
      });

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`[Gemini] Trying ${modelName} (attempt ${attempt}/${MAX_RETRIES})...`);
          const result       = await model.generateContent(prompt);
          const textResponse = result.response.text();

          let cleanResponse = textResponse.trim();
          if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.replace(/^```json/, '').replace(/```$/, '').trim();
          } else if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/^```/, '').replace(/```$/, '').trim();
          }

          const parsedAdvice = JSON.parse(cleanResponse);
          console.log(`[Gemini] Success with ${modelName} on attempt ${attempt}.`);
          return { provider: 'gemini', model: modelName, intent, ...parsedAdvice };

        } catch (error) {
          lastError = error;

          if (!isRetryable(error)) {
            // Non-retryable (auth failure, bad key, bad request) — stop this model
            console.error(`[Gemini] Non-retryable error on ${modelName}: ${error.message}`);
            break;
          }

          const delay = BASE_DELAY * Math.pow(2, attempt - 1); // 1.5s → 3s → 6s
          console.warn(`[Gemini] ${modelName} overloaded (attempt ${attempt}/${MAX_RETRIES}). Retrying in ${delay}ms...`);
          if (attempt < MAX_RETRIES) await sleep(delay);
        }
      }

      // If we're here, this model failed all retries — try next model
      console.warn(`[Gemini] All ${MAX_RETRIES} attempts failed for ${modelName}. Trying next model...`);
    }

    // All models exhausted
    console.warn(`Gemini Provider Warning: ${lastError.message}`);
    throw new Error(`Gemini explanation failed: ${lastError.message}`);
  }
}

module.exports = GeminiProvider;
