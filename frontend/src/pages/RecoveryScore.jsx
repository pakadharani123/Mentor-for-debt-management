import React, { useContext, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getTranslation } from '../services/localizer';
import apiService from '../services/apiService';
import SkeletonScreen from '../components/SkeletonScreen';
import { motion } from 'framer-motion';
import InsightCard from '../components/InsightCard';
import { 
  Award, 
  CheckCircle, 
  CheckCircle2,
  XCircle, 
  Lightbulb, 
  Percent, 
  Briefcase, 
  Coins, 
  Calculator,
  Compass,
  Target
} from 'lucide-react';

const RecoveryScore = () => {
  const { user } = useContext(AuthContext);
  const lang = user?.preferredLanguage || 'en';

  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const res = await apiService.recoveryScore.get();
        setScoreData(res.data);
      } catch (err) {
        console.error(err);
        setErrorMsg('To view your Recovery Score, please make sure your financial profile is created.');
      } finally {
        setLoading(false);
      }
    };
    fetchScore();
  }, []);

  if (loading) {
    return <SkeletonScreen.Table rows={6} />;
  }

  if (errorMsg) {
    return (
      <div class="bg-brand-card border border-slate-800 p-8 rounded-3xl flex flex-col justify-center items-center text-center space-y-4 max-w-lg mx-auto mt-12">
        <XCircle size={48} class="text-rose-400" />
        <h2 class="text-lg font-bold text-white">Score Unavailable</h2>
        <p class="text-xs text-brand-muted leading-relaxed">{errorMsg}</p>
      </div>
    );
  }

  const score = scoreData?.score || 0;
  const category = scoreData?.category || 'Critical';

  // Circular gauge configs
  const radius = 80;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  // Animate from 0 to target score fraction
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreTheme = (cat) => {
    switch (cat) {
      case 'Excellent':
        return { text: 'text-emerald-400', stroke: '#10B981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' };
      case 'Stable':
        return { text: 'text-cyan-400', stroke: '#06B6D4', bg: 'bg-cyan-500/10', border: 'border-cyan-500/25' };
      case 'Recovering':
        return { text: 'text-blue-400', stroke: '#3B82F6', bg: 'bg-blue-500/10', border: 'border-blue-500/25' };
      case 'High Risk':
        return { text: 'text-orange-400', stroke: '#F97316', bg: 'bg-orange-500/10', border: 'border-orange-500/25' };
      case 'Critical':
      default:
        return { text: 'text-rose-400', stroke: '#EF4444', bg: 'bg-rose-500/10', border: 'border-rose-500/25' };
    }
  };

  const theme = getScoreTheme(category);

  return (
    <div class="space-y-8 select-none">
      {/* Title */}
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 class="text-2xl font-black tracking-tight text-white">{getTranslation(lang, 'recoveryScore')} Center</h1>
          <p class="text-xs text-brand-muted font-medium mt-1">Detailed assessment of your budgeting habits, liabilities, and liquid reserves.</p>
        </div>
        <NavLink
          to="/settings/profile"
          class="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all border border-slate-700 cursor-pointer flex items-center gap-2 animate-fade-in"
        >
          <span>Edit Financial Profile</span>
        </NavLink>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gauge Box */}
        <div class="bg-brand-card border border-slate-800 p-8 rounded-3xl flex flex-col items-center justify-center space-y-6">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest">Calculated Index</h3>
          
          {/* Animated SVG Gauge */}
          <div class="relative w-44 h-44 flex items-center justify-center">
            <svg class="w-full h-full transform -rotate-90">
              {/* Back Circle */}
              <circle
                cx="88"
                cy="88"
                r={radius}
                stroke="#1E293B"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Animated Progress Circle */}
              <motion.circle
                cx="88"
                cy="88"
                r={radius}
                stroke={theme.stroke}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: strokeDashoffset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>
            <div class="absolute text-center space-y-1">
              <span class="text-4xl font-extrabold text-white tracking-tighter">{score}</span>
              <p class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">out of 100</p>
            </div>
          </div>

          <div class="text-center space-y-1">
            <span class={`text-sm font-bold px-3 py-1 rounded-full ${theme.bg} ${theme.text} ${theme.border}`}>
              {category}
            </span>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div class="bg-brand-card border border-slate-800 p-8 rounded-3xl lg:col-span-2 space-y-6">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest">Diagnostic Details</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Strengths */}
            <div class="space-y-4">
              <div class="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle size={15} />
                <span>{getTranslation(lang, 'strengths')}</span>
              </div>
              {scoreData.strengths.length > 0 ? (
                <ul class="space-y-2.5">
                  {scoreData.strengths.map((s, idx) => (
                    <li key={idx} class="text-xs text-slate-300 leading-relaxed pl-1">
                      • {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p class="text-xs text-slate-500 font-medium">No major strengths recorded yet. Budget improvements needed.</p>
              )}
            </div>

            {/* Weaknesses */}
            <div class="space-y-4">
              <div class="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <XCircle size={15} />
                <span>{getTranslation(lang, 'weaknesses')}</span>
              </div>
              {scoreData.weaknesses.length > 0 ? (
                <ul class="space-y-2.5">
                  {scoreData.weaknesses.map((w, idx) => (
                    <li key={idx} class="text-xs text-slate-300 leading-relaxed pl-1">
                      • {w}
                    </li>
                  ))}
                </ul>
              ) : (
                <p class="text-xs text-slate-500 font-medium">Excellent work! No major vulnerabilities identified.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* How to Improve Score progression path */}
      {scoreData && (
        <div className="bg-brand-card border border-slate-800 p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-2 text-brand-primary font-bold text-xs uppercase tracking-wider">
            <Compass size={16} />
            <span>How To Improve Score (Progression Roadmap)</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-semibold leading-relaxed">
            {/* Step 1: Current Status */}
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <Target size={14} />
                <span className="uppercase tracking-wider text-[10px]">Step 1: Current Standing</span>
              </div>
              <div>
                <p className="text-slate-500 uppercase text-[9px] tracking-wider font-bold">Your Current Score</p>
                <span className="text-3xl font-black text-white">{score}</span>
                <span className="text-[10px] text-slate-500 ml-1">/ 100</span>
              </div>
              <p className="text-slate-400 font-medium font-sans">Your recovery index is classified as **{category}**.</p>
            </div>

            {/* Step 2: Milestone 50 */}
            <div className={`p-4 rounded-2xl border space-y-3 ${
              score >= 50 
                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-450 shadow-glow-primary' 
                : 'bg-slate-900/60 border-slate-800 text-slate-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className="uppercase tracking-wider text-[10px] text-indigo-400 font-bold">Step 2: Reach Score 50</span>
                {score >= 50 && <CheckCircle2 size={14} className="text-brand-primary" />}
              </div>
              <div className="space-y-2 font-medium">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={12} className={score >= 50 ? "text-brand-primary mt-0.5 shrink-0" : "text-slate-650 mt-0.5 shrink-0"} />
                  <span className={score >= 50 ? "line-through text-slate-500 font-medium" : "text-slate-350 font-medium"}>
                    Reduce EMI burden (Save ₹15,000 in monthly lifestyle EMIs)
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={12} className={score >= 50 ? "text-brand-primary mt-0.5 shrink-0" : "text-slate-650 mt-0.5 shrink-0"} />
                  <span className={score >= 50 ? "line-through text-slate-500 font-medium" : "text-slate-350 font-medium"}>
                    Increase emergency fund by ₹50,000
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={12} className={score >= 50 ? "text-brand-primary mt-0.5 shrink-0" : "text-slate-650 mt-0.5 shrink-0"} />
                  <span className={score >= 50 ? "line-through text-slate-500 font-medium" : "text-slate-350 font-medium"}>
                    Maintain payment compliance above 95%
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3: Milestone 70 */}
            <div className={`p-4 rounded-2xl border space-y-3 ${
              score >= 70 
                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-450 shadow-glow-primary' 
                : 'bg-slate-900/60 border-slate-800 text-slate-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className="uppercase tracking-wider text-[10px] text-indigo-400 font-bold">Step 3: Reach Score 70</span>
                {score >= 70 && <CheckCircle2 size={14} className="text-brand-primary" />}
              </div>
              <div className="space-y-2 font-medium">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={12} className={score >= 70 ? "text-brand-primary mt-0.5 shrink-0" : "text-slate-650 mt-0.5 shrink-0"} />
                  <span className={score >= 70 ? "line-through text-slate-500 font-medium" : "text-slate-350 font-medium"}>
                    Emergency fund = 3 months lifestyle expenses
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={12} className={score >= 70 ? "text-brand-primary mt-0.5 shrink-0" : "text-slate-650 mt-0.5 shrink-0"} />
                  <span className={score >= 70 ? "line-through text-slate-500 font-medium" : "text-slate-350 font-medium"}>
                    DTI below 35%
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={12} className={score >= 70 ? "text-brand-primary mt-0.5 shrink-0" : "text-slate-650 mt-0.5 shrink-0"} />
                  <span className={score >= 70 ? "line-through text-slate-500 font-medium" : "text-slate-350 font-medium"}>
                    Maintain 100% compliance rate
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coach InsightCard */}
      {scoreData && (
        <InsightCard 
          title="Recovery Score Coach Advice"
          problem={
            scoreData.weaknesses && scoreData.weaknesses.length > 0 
              ? scoreData.weaknesses[0].replace('• ', '')
              : "No major vulnerabilities identified."
          }
          whyItMatters="A lower Recovery Score restricts borrowing options and signals that high liabilities are choking your cash flow."
          recommendedAction={
            scoreData.improvementSuggestions && scoreData.improvementSuggestions.length > 0 
              ? scoreData.improvementSuggestions[0] 
              : "Continue maintaining budget discipline."
          }
          expectedBenefit="Improves resilience against sudden income disruptions and helps accelerate your debt-free timeline."
        />
      )}

      {/* Factor Transparency Table */}
      <div class="bg-brand-card border border-slate-800 p-6 rounded-2xl space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div class="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <Calculator size={16} />
            <span>Mathematical Factors Breakdown & Audit</span>
          </div>
          <span class="text-[10px] text-brand-muted font-medium">Click "Edit Source" to modify values in their master locations.</span>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-800 text-slate-400 font-bold">
                <th class="py-3 px-4">Factor</th>
                <th class="py-3 px-4">Formula</th>
                <th class="py-3 px-4">Your Value</th>
                <th class="py-3 px-4">Points Earned</th>
                <th class="py-3 px-4">Data Source</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/50">
              {[
                {
                  name: 'Debt-to-Income (DTI)',
                  value: `${scoreData.factors.debtToIncomeRatio.value}%`,
                  formula: '(Total EMIs / Income) * 100',
                  earned: scoreData.factors.debtToIncomeRatio.score,
                  max: 20,
                  source: 'Profile / Loans',
                  editUrl: '/settings/profile',
                  description: 'Percentage of monthly income spent on debt repayment EMIs.'
                },
                {
                  name: 'Savings Ratio',
                  value: `${scoreData.factors.savingsRatio.value}%`,
                  formula: '(Savings / Income) * 100',
                  earned: scoreData.factors.savingsRatio.score,
                  max: 15,
                  source: 'Profile',
                  editUrl: '/settings/profile',
                  description: 'Total cumulative savings relative to monthly income.'
                },
                {
                  name: 'Emergency Fund Coverage',
                  value: `${scoreData.factors.emergencyFundMonths.value} Mo`,
                  formula: 'Emergency Fund / Expenses',
                  earned: scoreData.factors.emergencyFundMonths.score,
                  max: 15,
                  source: 'Profile',
                  editUrl: '/settings/profile',
                  description: 'Months of monthly lifestyle expenses covered by emergency fund.'
                },
                {
                  name: 'Active Loan Accounts',
                  value: scoreData.factors.loanCount.value,
                  formula: 'Count of active loans',
                  earned: scoreData.factors.loanCount.score,
                  max: 10,
                  source: 'Loans Ledger',
                  editUrl: '/loans',
                  description: 'Number of active debt liabilities currently being paid down.'
                },
                {
                  name: 'EMI Burden Ratio',
                  value: `${scoreData.factors.emiBurdenRatio.value}%`,
                  formula: '(Total EMIs / Expenses) * 100',
                  earned: scoreData.factors.emiBurdenRatio.score,
                  max: 10,
                  source: 'Profile / Loans',
                  editUrl: '/settings/profile',
                  description: 'Ratio of loan EMIs to estimated lifestyle expenses.'
                },
                {
                  name: 'Payment Compliance',
                  value: `${scoreData.factors.paymentCompliance.value}%`,
                  formula: '(Paid Payments / Total Payments) * 100',
                  earned: scoreData.factors.paymentCompliance.score,
                  max: 15,
                  source: 'Expenses Ledger',
                  editUrl: '/expenses',
                  description: 'Ratio of confirmed paid expenses vs total scheduled occurrences.'
                },
                {
                  name: 'Monthly Surplus Ratio',
                  value: `${scoreData.factors.surplusRatio.value}%`,
                  formula: '((Income - Expenses - EMIs) / Income) * 100',
                  earned: scoreData.factors.surplusRatio.score,
                  max: 15,
                  source: 'Profile / Loans',
                  editUrl: '/settings/profile',
                  description: 'Remaining unallocated cash surplus relative to monthly income.'
                }
              ].map((factor, idx) => (
                <tr key={idx} class="hover:bg-slate-900/30 transition-colors">
                  <td class="py-3.5 px-4 font-medium text-white">
                    <div>{factor.name}</div>
                    <div class="text-[10px] text-slate-500 font-normal mt-0.5">{factor.description}</div>
                  </td>
                  <td class="py-3.5 px-4 font-mono text-[10px] text-slate-400">{factor.formula}</td>
                  <td class="py-3.5 px-4 font-bold text-indigo-300">{factor.value}</td>
                  <td class="py-3.5 px-4">
                    <span class="font-extrabold text-white">{factor.earned}</span>
                    <span class="text-slate-500 font-medium"> / {factor.max}</span>
                  </td>
                  <td class="py-3.5 px-4">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700/60">
                      {factor.source}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 text-right">
                    <NavLink
                      to={factor.editUrl}
                      class="text-indigo-400 hover:text-indigo-300 text-xs font-bold transition-all underline decoration-dotted"
                    >
                      Edit Source
                    </NavLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations card */}
      <div class="bg-brand-card border border-slate-800 p-6 rounded-2xl space-y-4">
        <div class="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
          <Lightbulb size={16} />
          <span>Recommended Actions & Strategic Roadmap</span>
        </div>
        <ul class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {scoreData.improvementSuggestions.map((sug, idx) => (
            <li key={idx} class="text-xs text-slate-300 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 leading-relaxed flex items-start gap-3">
              <span class="w-5 h-5 flex items-center justify-center bg-indigo-500/10 text-indigo-400 rounded-full font-bold text-[10px] mt-0.5 shrink-0">
                {idx + 1}
              </span>
              <span>{sug}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RecoveryScore;
