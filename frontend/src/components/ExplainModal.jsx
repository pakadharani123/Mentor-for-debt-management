import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  X, 
  Award, 
  TrendingUp, 
  Wallet, 
  Landmark, 
  Calendar, 
  Clock, 
  Calculator, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  Edit
} from 'lucide-react';

const METRIC_CONFIGS = {
  RECOVERY_SCORE: {
    title: 'Financial Recovery Score',
    icon: Award,
    color: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
    formula: 'Sum of 7 weighted factors: DTI (20), Savings (15), Emergency Cushion (15), Loan Count (10), EMI Burden (10), Payment Compliance (15), Surplus Ratio (15)',
    source: 'Financial Profile, Active Loans, and Payment History Log',
    editLink: '/settings/profile',
    editText: 'Edit Financial Profile',
    assumptions: 'Reflects overall debt resilience. Higher points correspond to lower default risk and better leverage management.',
    affected: 'Debt Forecast, AI Coach Recommendations, Loan Priorities'
  },
  INCOME: {
    title: 'Monthly Income',
    icon: TrendingUp,
    color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
    formula: 'Declared take-home salary or business income (Direct Input)',
    source: 'Declared in Financial Profile settings',
    editLink: '/settings/profile',
    editText: 'Edit Income',
    assumptions: 'Assumed steady monthly take-home salary, excluding irregular bonuses.',
    affected: 'DTI Ratio, Monthly Surplus, Recovery Score, Budget Ratios'
  },
  EXPENSES: {
    title: 'Profile Estimated Expenses',
    icon: Wallet,
    color: 'text-slate-400 border-slate-700/30 bg-slate-800/50',
    formula: 'Estimated recurring monthly lifestyle outflow (Direct Input, excluding EMIs)',
    source: 'Declared in Financial Profile settings',
    editLink: '/settings/profile',
    editText: 'Edit Expenses Estimations',
    assumptions: 'Average monthly lifestyle commitments. Separate from actual transaction ledger tracking.',
    affected: 'Recovery Score, Potential Surplus, Emergency Cushion calculation'
  },
  EXPENSES_LEDGER: {
    title: 'Expense Ledger Outflow',
    icon: Landmark,
    color: 'text-rose-400 border-rose-500/20 bg-rose-500/10',
    formula: 'Sum of confirmed actual paid ledger transactions this month',
    source: 'Expense Ledger Transaction Records',
    editLink: '/expenses',
    editText: 'Open Expense Ledger',
    assumptions: 'Reflects actual paid cash outflows. Unpaid bills are excluded from cash outflow totals.',
    affected: 'Actual Monthly Surplus, Cash Flow Charts, Payment Tracker'
  },
  SAVINGS: {
    title: 'Liquid Savings Balance',
    icon: Wallet,
    color: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/10',
    formula: 'Available bank balance or liquid savings assets (Direct Input)',
    source: 'Declared in Financial Profile settings',
    editLink: '/settings/profile',
    editText: 'Edit Savings Balance',
    assumptions: 'Liquid assets immediately deployable without penalties.',
    affected: 'Recovery Score, Savings-to-Income ratio'
  },
  EMERGENCY_FUND: {
    title: 'Emergency Fund Cushion',
    icon: AlertCircle,
    color: 'text-orange-400 border-orange-500/20 bg-orange-500/10',
    formula: 'Emergency Fund Balance / Profile Monthly Expenses (in months)',
    source: 'Declared in Financial Profile settings',
    editLink: '/settings/profile',
    editText: 'Edit Emergency Buffers',
    assumptions: 'Buffer is strictly reserved for emergency expenses. Minimum target is 3 to 6 months of expenses.',
    affected: 'Recovery Score, Financial Audit Report'
  },
  DTI: {
    title: 'Debt-to-Income (DTI) Ratio',
    icon: Calculator,
    color: 'text-pink-400 border-pink-500/20 bg-pink-500/10',
    formula: '(Total Monthly EMIs / Monthly Income) * 100',
    source: 'Active Loans Ledger (EMIs) & Financial Profile (Income)',
    editLink: '/loans',
    editText: 'Modify Loan EMIs',
    assumptions: 'DTI below 35% is healthy; exceeding 50% represents high default risk and financial distress.',
    affected: 'Recovery Score, AI Coach advice, Forecast paydown timeline'
  },
  SURPLUS: {
    title: 'Actual Monthly Surplus',
    icon: Wallet,
    color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
    formula: 'Monthly Income - Confirmed Paid Ledger Expenses (this month) - Active Monthly EMIs',
    source: 'Financial Profile (Income), Expense Ledger (Paid), and Loans (EMIs)',
    editLink: '/expenses',
    editText: 'Manage Ledger Expenses',
    assumptions: 'Represents actual disposable cash flow available. Unpaid pending expenses do not subtract until marked Paid.',
    affected: 'Accelerated Repayment capability, Debt Forecast simulations'
  },
  FORECAST: {
    title: 'Repayment Payoff Forecast',
    icon: Calendar,
    color: 'text-purple-400 border-purple-500/20 bg-purple-500/10',
    formula: 'Compounded monthly amortization simulation applying 50% surplus to outstanding loans in Avalanche order',
    source: 'Loans registry (Principal, Rate, EMIs) & Financial Profile surplus',
    editLink: '/loans',
    editText: 'Open Loans Registry',
    assumptions: 'Assumed fixed interest rates, steady income, prompt EMI payments, and consistent 50% surplus acceleration.',
    affected: 'Estimated Debt-Free Date, Forecast Charting, AI recommendations'
  },
  LOAN_RECS: {
    title: 'Repayment Strategy Priorities',
    icon: Landmark,
    color: 'text-orange-400 border-orange-500/20 bg-orange-500/10',
    formula: 'Simulation of overall interest costs: Avalanche (high rate first) vs Snowball (smallest balance first)',
    source: 'Active Loans Register (interest rates & balances)',
    editLink: '/loans',
    editText: 'Update Loans Register',
    assumptions: 'Avalanche is mathematically optimal. Snowball is psychological, freeing up EMIs faster.',
    affected: 'Repayment Plans, recommended extra payment allocation'
  },
  AI_ADVICE: {
    title: 'AI Advisory Context',
    icon: CheckCircle2,
    color: 'text-brand-primary border-emerald-500/20 bg-emerald-500/10',
    formula: 'GenAI heuristic model based on comprehensive platform parameters',
    source: 'Full platform metrics database context',
    editLink: '/settings/profile',
    editText: 'Change Profile Parameters',
    assumptions: 'Heuristics assumes accurate ledger inputs and correct payment status declarations.',
    affected: 'AI Conversation threads'
  },
  SIMULATOR: {
    title: 'What-If Simulation Results',
    icon: Calculator,
    color: 'text-blue-400 border-blue-500/20 bg-blue-500/10',
    formula: 'Comparing amortization runs: (Balance, rate, current EMI) vs (Balance, rate, proposed EMI)',
    source: 'Debt Simulator inputs and targeted Loan details',
    editLink: '/simulator',
    editText: 'Run Simulator again',
    assumptions: 'Extra proposed payment is paid on-time every month directly to principal balance.',
    affected: 'What-If payoff comparison'
  }
};

const ExplainModal = ({ metricType, data = {}, onClose }) => {
  const config = METRIC_CONFIGS[metricType] || METRIC_CONFIGS.RECOVERY_SCORE;
  const Icon = config.icon;

  // Render metric-specific steps
  const renderSteps = () => {
    switch (metricType) {
      case 'RECOVERY_SCORE':
        if (!data.scoreData) return <p class="text-slate-400">Loading math breakdown...</p>;
        const f = data.scoreData.factors || {};
        return (
          <div class="space-y-2.5 font-mono text-[11px] bg-slate-900/60 p-4 border border-slate-800/80 rounded-xl leading-relaxed text-indigo-300">
            <div>DTI: {f.debtToIncomeRatio?.value}% &rarr; {f.debtToIncomeRatio?.score}/20 pts</div>
            <div>Savings Ratio: {f.savingsRatio?.value}% &rarr; {f.savingsRatio?.score}/15 pts</div>
            <div>Emergency buffer: {f.emergencyFundMonths?.value} mos &rarr; {f.emergencyFundMonths?.score}/15 pts</div>
            <div>Active loan count: {f.loanCount?.value} &rarr; {f.loanCount?.score}/10 pts</div>
            <div>EMI Burden: {f.emiBurdenRatio?.value}% &rarr; {f.emiBurdenRatio?.score}/10 pts</div>
            <div>Payment compliance: {f.paymentCompliance?.value}% &rarr; {f.paymentCompliance?.score}/15 pts</div>
            <div>Monthly surplus: {f.surplusRatio?.value}% &rarr; {f.surplusRatio?.score}/15 pts</div>
            <div class="pt-2 border-t border-slate-800 text-white font-extrabold text-xs">Total Score Math: {data.scoreData.score} / 100</div>
          </div>
        );

      case 'DTI':
        const emi = data.totalEMI || data.metrics?.totalEMI || 0;
        const inc = data.monthlyIncome || data.metrics?.monthlyIncome || 1;
        const dtiResult = ((emi / inc) * 100).toFixed(1);
        return (
          <div class="space-y-1.5 font-mono text-[11px] bg-slate-900/60 p-4 border border-slate-800/80 rounded-xl text-pink-300">
            <div>Formula: (Total Monthly EMIs &divide; Monthly Income) &times; 100</div>
            <div class="pt-1.5 border-t border-slate-800/50">Inputs:</div>
            <div>• Total EMIs: Rs. {emi.toLocaleString()}</div>
            <div>• Monthly Income: Rs. {inc.toLocaleString()}</div>
            <div class="pt-1 text-white font-bold">Math: ({emi} &divide; {inc}) &times; 100 = {dtiResult}%</div>
          </div>
        );

      case 'SURPLUS':
        const income = data.monthlyIncome || data.metrics?.monthlyIncome || 0;
        const paidExp = data.expenseStatus?.actualPaidTotal || data.metrics?.expenseStatus?.actualPaidTotal || 0;
        const emis = data.totalEMI || data.metrics?.totalEMI || 0;
        const surplusRes = income - paidExp - emis;
        return (
          <div class="space-y-1.5 font-mono text-[11px] bg-slate-900/60 p-4 border border-slate-800/80 rounded-xl text-emerald-300">
            <div>Formula: Income &minus; Confirmed Paid Expenses &minus; EMIs</div>
            <div class="pt-1.5 border-t border-slate-800/50">Inputs:</div>
            <div>• Monthly Income: Rs. {income.toLocaleString()}</div>
            <div>• Confirmed Paid: Rs. {paidExp.toLocaleString()}</div>
            <div>• Monthly EMIs: Rs. {emis.toLocaleString()}</div>
            <div class="pt-1 text-white font-bold">Math: {income} &minus; {paidExp} &minus; {emis} = Rs. {surplusRes.toLocaleString()}</div>
          </div>
        );

      case 'EMERGENCY_FUND':
        const ef = data.emergencyFund || data.metrics?.emergencyFund || 0;
        const exp = data.monthlyExpenses || data.metrics?.monthlyExpenses || 1;
        const cushion = (ef / exp).toFixed(1);
        return (
          <div class="space-y-1.5 font-mono text-[11px] bg-slate-900/60 p-4 border border-slate-800/80 rounded-xl text-orange-300">
            <div>Formula: Emergency Fund Buffer &divide; Profile Monthly Expenses</div>
            <div class="pt-1.5 border-t border-slate-800/50">Inputs:</div>
            <div>• Emergency Fund: Rs. {ef.toLocaleString()}</div>
            <div>• Profile Expenses: Rs. {exp.toLocaleString()}</div>
            <div class="pt-1 text-white font-bold">Math: {ef} &divide; {exp} = {cushion} months cushion</div>
          </div>
        );

      case 'FORECAST':
        if (!data.forecast) return <p class="text-slate-400">Simulation details not loaded...</p>;
        return (
          <div class="space-y-1.5 font-mono text-[11px] bg-slate-900/60 p-4 border border-slate-800/80 rounded-xl text-purple-300">
            <div>paydown sequence simulated: Avalanche Repayment</div>
            <div>• Remaining Principal: Rs. {data.forecast.remainingPrincipal?.toLocaleString()}</div>
            <div>• Recommended Accelerated Monthly Pay: Rs. {data.forecast.recommendedMonthlyPayment?.toLocaleString()}</div>
            <div>• Total Cumulative Interest to Pay: Rs. {data.forecast.totalInterestRemaining === -1 ? 'Infinite (deficit)' : `${data.forecast.totalInterestRemaining?.toLocaleString()}`}</div>
            <div>• Payoff Period: {data.forecast.payoffMonthsRemaining} Months</div>
          </div>
        );

      case 'SIMULATOR':
        if (!data.simulationResult) return <p class="text-slate-400">Simulate first on the simulator page.</p>;
        const sim = data.simulationResult;
        return (
          <div class="space-y-1.5 font-mono text-[11px] bg-slate-900/60 p-4 border border-slate-800/80 rounded-xl text-blue-300">
            <div>Comparative Amortization Run:</div>
            <div>• Current Payoff: {sim.currentPayoffMonths} months</div>
            <div>• Proposed Payoff: {sim.newPayoffMonths} months</div>
            <div>• Tenure Reduced: {sim.monthsReduced} months sooner</div>
            <div>• Interest saved: Rs. {sim.interestSaved?.toLocaleString()}</div>
          </div>
        );

      default:
        const rawVal = data.value || 'N/A';
        return (
          <div class="bg-slate-900/60 p-4 border border-slate-800/80 rounded-xl font-mono text-[11px] text-slate-300">
            Current Value: <span class="text-white font-bold">{rawVal}</span>
            <br />
            Calculation type: Parameter Sourced Directly.
          </div>
        );
    }
  };

  const lastUpdated = data.lastUpdated || new Date(data.profile?.updatedAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex justify-center items-center px-4 select-none animate-fade-in">
      <div class="max-w-lg w-full bg-brand-card border border-slate-800 rounded-3xl p-6 shadow-2xl relative space-y-5 animate-scale-up">
        {/* Header */}
        <div class="flex items-start justify-between border-b border-slate-800/60 pb-3">
          <div class="flex items-center gap-3">
            <div class={`p-2 rounded-xl border ${config.color}`}>
              <Icon size={18} />
            </div>
            <div>
              <h3 class="text-sm font-black text-white uppercase tracking-wider">{config.title}</h3>
              <p class="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Calculation Debugger</p>
            </div>
          </div>
          <button
            onClick={onClose}
            class="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded hover:bg-slate-800"
          >
            <X size={16} />
          </button>
        </div>

        {/* Explainability Content */}
        <div class="space-y-4 text-xs">
          {/* Formula */}
          <div>
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Formula Used</span>
            <p class="text-slate-300 leading-relaxed font-semibold">{config.formula}</p>
          </div>

          {/* Sourcing details */}
          <div class="flex justify-between items-center gap-4 bg-slate-900/40 p-3 rounded-xl border border-slate-800/50">
            <div>
              <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Data Origin</span>
              <p class="text-slate-300 font-bold mt-0.5">{config.source}</p>
            </div>
            <NavLink
              to={config.editLink}
              onClick={onClose}
              class="shrink-0 text-[10px] font-extrabold text-brand-primary hover:text-emerald-300 flex items-center gap-1 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 px-3 py-1.5 rounded-lg transition-all"
            >
              <Edit size={10} />
              <span>{config.editText}</span>
            </NavLink>
          </div>

          {/* Math steps */}
          <div>
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Arithmetic Audit Steps</span>
            {renderSteps()}
          </div>

          {/* Assumptions */}
          <div>
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Calculation Assumptions</span>
            <p class="text-slate-400 leading-relaxed font-medium">{config.assumptions}</p>
          </div>

          {/* Timeline details */}
          <div class="grid grid-cols-2 gap-4 border-t border-slate-800/60 pt-3 text-[10px]">
            <div>
              <span class="text-slate-500 font-bold block uppercase tracking-wider">Last Calculated</span>
              <span class="text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                <Clock size={11} /> {lastUpdated}
              </span>
            </div>
            <div>
              <span class="text-slate-500 font-bold block uppercase tracking-wider">Affected Modules</span>
              <span class="text-slate-400 font-bold block mt-0.5 truncate" title={config.affected}>
                {config.affected}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div class="flex justify-end gap-3 pt-3 border-t border-slate-800/60">
          <NavLink
            to="/audit"
            onClick={onClose}
            class="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
          >
            Open Debug Console
          </NavLink>
          <button
            onClick={onClose}
            class="bg-brand-primary text-black font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer hover:bg-emerald-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExplainModal;
