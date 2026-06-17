import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import apiService from '../services/apiService';
import SkeletonScreen from '../components/SkeletonScreen';
import {
  TrendingUp, TrendingDown, Clock, Zap, Shield,
  PiggyBank, ArrowRight, ChevronRight, AlertTriangle, CheckCircle,
  Award, Flame, Target, BarChart2, Calendar, Heart,
  RefreshCw, Crosshair, ThumbsUp, Lightbulb, AlertCircle,
  Layers, GitMerge, Trophy, Compass, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const fmt = (n) => typeof n === 'number' ? `₹${Math.round(n).toLocaleString('en-IN')}` : '₹0';
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const addMonths = (n) => {
  if (!n || n <= 0 || n === Infinity || isNaN(n)) return 'N/A';
  const d = new Date();
  d.setMonth(d.getMonth() + Math.round(n));
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};
const scoreLabel = (s) => {
  if (s >= 80) return { text: 'Excellent',   c: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25' };
  if (s >= 60) return { text: 'Good',        c: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/25' };
  if (s >= 40) return { text: 'Recovering',  c: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/25' };
  return             { text: 'High Risk',   c: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/25' };
};
const IMPACT = {
  'Very High': 'text-rose-400 bg-rose-500/10 border-rose-500/25',
  'High':      'text-amber-400 bg-amber-500/10 border-amber-500/25',
  'Medium':    'text-blue-400 bg-blue-500/10 border-blue-500/25',
};

// ═══════════════════════════════════════════════════════════════
// PROJECTION ENGINE  (pure JS — no backend changes)
// ═══════════════════════════════════════════════════════════════
const project = ({ score, income, expenses, totalEMI, emergencyFund, loans, extraSave, extraEMI, expenseCut }) => {
  const efTarget     = expenses * 6;
  const topLoan      = [...loans].sort((a, b) => b.interestRate - a.interestRate)[0];
  const totalDebt    = loans.reduce((s, l) => s + l.remainingAmount, 0);
  const surplus      = income - expenses - totalEMI;

  // score delta (capped, realistic)
  let dScore = 0;
  if (extraSave > 0)  dScore += clamp((extraSave  / Math.max(income, 1)) * 60, 0, 18);
  if (expenseCut > 0) dScore += clamp((expenseCut / Math.max(income, 1)) * 40, 0, 10);
  if (extraEMI > 0)   dScore += clamp((extraEMI   / Math.max(totalDebt, 1)) * 400, 0, 15);
  const projScore = Math.min(100, Math.round(score + dScore));

  // emergency fund growth per month
  const efMonthly = Math.max(0, extraSave * 0.55 + expenseCut * 0.35);

  // debt payoff
  const topEMI         = topLoan?.emi || 0;
  const extraPay       = (extraEMI || 0) + Math.max(0, surplus * 0.25);
  const baseMonths     = topLoan && topEMI > 0 ? Math.ceil(topLoan.remainingAmount / topEMI) : 0;
  const accelMonths    = topLoan && (topEMI + extraPay) > 0 ? Math.ceil(topLoan.remainingAmount / (topEMI + extraPay)) : baseMonths;
  const interestSaved  = topLoan ? Math.max(0, Math.round((baseMonths - accelMonths) * topEMI * (topLoan.interestRate / 1200))) : 0;

  return { projScore, efMonthly, efTarget, accelMonths, baseMonths, interestSaved, totalDebt, dScore };
};

// timeline snapshots  [0, 3, 6, 12, 24 months]
const buildTimeline = ({ score, income, expenses, totalEMI, emergencyFund, loans, surplus }) => {
  const totalDebt  = loans.reduce((s, l) => s + l.remainingAmount, 0);
  const topLoan    = [...loans].sort((a, b) => b.interestRate - a.interestRate)[0];
  const saveMonthly = Math.max(surplus * 0.45, 1500);
  const debtMonthly = totalEMI + Math.max(surplus * 0.25, 0);

  return [0, 3, 6, 12, 24].map((m) => {
    const scoreGain  = m === 0 ? 0 : clamp(Math.sqrt(m) * 4.8 + (surplus > 0 ? 2 : 0), 0, 42);
    const projScore  = Math.min(100, Math.round(score + scoreGain));
    const ef         = Math.min(expenses * 6, emergencyFund + saveMonthly * m * 0.55);
    const debt       = Math.max(0, totalDebt - debtMonthly * m);
    const projSurplus= surplus + (m >= 6 ? Math.min(surplus * 0.12, 4000) : 0);
    return { m, projScore, ef, debt, projSurplus, cfg: scoreLabel(projScore) };
  });
};

// "What-If" single-variable analysis
const whatIf = ({ score, income, expenses, totalEMI, emergencyFund, loans }) => {
  const base = { score, income, expenses, totalEMI, emergencyFund, loans };
  const run  = (extraSave, extraEMI, expenseCut) => project({ ...base, extraSave, extraEMI, expenseCut });

  return [
    {
      label: `Save ${fmt(Math.min(10000, income * 0.06))}/month`,
      sub:   'Small consistent saving',
      icon:  PiggyBank, color: 'text-emerald-400', border: 'border-emerald-500/30 bg-emerald-500/5',
      r: run(Math.min(10000, income * 0.06), 0, 0)
    },
    {
      label: `Save ${fmt(Math.min(20000, income * 0.12))}/month`,
      sub:   'Moderate saving target',
      icon:  TrendingUp, color: 'text-blue-400', border: 'border-blue-500/30 bg-blue-500/5',
      r: run(Math.min(20000, income * 0.12), 0, 0)
    },
    {
      label: `Pay ${fmt(Math.min(10000, income * 0.06))} extra EMI`,
      sub:   'Accelerate loan repayment',
      icon:  Target, color: 'text-amber-400', border: 'border-amber-500/30 bg-amber-500/5',
      r: run(0, Math.min(10000, income * 0.06), 0)
    },
    {
      label: `Reduce expenses by ${fmt(Math.min(8000, expenses * 0.08))}`,
      sub:   'Cut discretionary spending',
      icon:  TrendingDown, color: 'text-purple-400', border: 'border-purple-500/30 bg-purple-500/5',
      r: run(0, 0, Math.min(8000, expenses * 0.08))
    }
  ];
};

// ═══════════════════════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════════════════════
const SectionHeader = ({ n, number, title, sub, subtitle, icon: Icon, color = 'text-brand-primary' }) => {
  const displayN = n || number;
  const displaySub = sub || subtitle;
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 shrink-0 ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Section {displayN}</span>
        <h2 className="text-lg font-black text-white tracking-tight">{title}</h2>
        {displaySub && <p className="text-xs text-slate-500 mt-0.5">{displaySub}</p>}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// DELTA CHIP  (+12 pts / faster / etc.)
// ═══════════════════════════════════════════════════════════════
const Delta = ({ val, positive = true, suffix = '' }) => (
  <span className={`inline-flex items-center gap-0.5 text-[11px] font-black ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
    {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
    {val}{suffix}
  </span>
);

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
const RecoveryJourney = () => {
  const { user } = useContext(AuthContext);
  const [metrics,   setMetrics]   = useState(null);
  const [scoreData, setScoreData] = useState(null);
  const [loans,     setLoans]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [refreshing,setRefreshing]= useState(false);

  const fetchAll = async () => {
    try {
      const [mRes, sRes, lRes] = await Promise.all([
        apiService.dashboard.getMetrics(),
        apiService.recoveryScore.get().catch(() => ({ data: null })),
        apiService.loans.getAll().catch(()  => ({ data: [] }))
      ]);
      setMetrics(mRes.data);
      setScoreData(sRes.data);
      setLoans(Array.isArray(lRes.data) ? lRes.data.filter(l => l.status === 'Active') : []);
    } catch { setError('Could not load financial data. Ensure your profile is configured.'); }
    finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { fetchAll(); }, []);

  if (loading) return <SkeletonScreen.Table rows={8} />;

  if (error || !metrics) return (
    <div className="max-w-lg mx-auto mt-20 text-center space-y-5">
      <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto">
        <AlertCircle size={32} className="text-amber-400" />
      </div>
      <h2 className="text-xl font-bold text-white">Profile Required</h2>
      <p className="text-sm text-slate-400 leading-relaxed">{error || 'Set up your financial profile to generate your Recovery Roadmap.'}</p>
      <Link to="/settings/profile" className="inline-flex items-center gap-2 bg-brand-primary text-black font-bold text-sm px-5 py-3 rounded-xl hover:bg-emerald-600 transition-all">
        Set Up Profile <ArrowRight size={16} />
      </Link>
    </div>
  );

  // ── derived (used for projections only — NOT displayed as current metrics) ──
  const income       = metrics.monthlyIncome  || 0;
  const expenses     = metrics.monthlyExpenses|| 0;
  const totalEMI     = metrics.totalEMI       || 0;
  const savings      = metrics.savings        || 0;
  const emergencyFund= metrics.emergencyFund  || 0;
  const surplus      = income - expenses - totalEMI;
  const dti          = income > 0 ? (totalEMI / income) * 100 : 0;
  const score        = scoreData?.score       || 0;
  const totalDebt    = loans.reduce((s, l)   => s + l.remainingAmount, 0);
  const efTarget     = expenses * 6;
  const efMonths     = expenses > 0 ? emergencyFund / expenses : 0;
  const emergencyMonths = efMonths;
  const topLoan      = [...loans].sort((a, b) => b.interestRate - a.interestRate)[0];
  const baseDebtMonths = topLoan && topLoan.emi > 0 ? Math.ceil(topLoan.remainingAmount / topLoan.emi) : 0;
  console.log("DEBUG REACHED BASE", { score, income, expenses, totalEMI, emergencyFund, loans, surplus });
  const base = { score, income, expenses, totalEMI, emergencyFund, loans, surplus };

  const defaultProj = { projScore: score, efMonthly: 0, efTarget: efTarget, accelMonths: 0, baseMonths: 0, interestSaved: 0, totalDebt: totalDebt, dScore: 0 };
  let scenA = defaultProj, scenB = defaultProj, scenC = defaultProj;
  try {
    scenA = project({ ...base, extraSave: Math.min(10000, Math.max(2000, income * 0.05)), extraEMI: 0,  expenseCut: 0 });
    scenB = project({ ...base, extraSave: Math.min(20000, Math.max(5000, income * 0.10)), extraEMI: 0,  expenseCut: Math.min(8000, expenses * 0.08) });
    scenC = project({ ...base, extraSave: Math.min(30000, Math.max(8000, income * 0.15)), extraEMI: Math.min(15000, Math.max(2000, surplus * 0.3)), expenseCut: Math.min(12000, expenses * 0.10) });
  } catch (err) {
    console.error("DIAGNOSTIC ERROR CAUGHT:", err.message, err.stack);
  }

  const scenarios = [
    {
      label: 'Scenario A', title: 'Small Improvement', tag: 'EASY', tagBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
      desc: `Save ${fmt(Math.min(10000, Math.max(2000, income * 0.05)))}/month — minimal lifestyle change.`,
      border: 'border-blue-500/30 bg-blue-500/5', iconColor: 'text-blue-400', icon: TrendingUp, timeline: '6 months', s: scenA,
      rows: [
        { label: 'Recovery Score',   from: `${score}`, to: `~${scenA.projScore}`,   delta: `+${scenA.projScore - score}` },
        { label: 'Emergency Fund',   from: fmt(emergencyFund), to: fmt(Math.min(efTarget, emergencyFund + scenA.efMonthly * 6)), delta: `+${fmt(Math.min(efTarget - emergencyFund, scenA.efMonthly * 6))}` },
        { label: 'Debt Balance',     from: fmt(totalDebt), to: fmt(Math.max(0, totalDebt - totalEMI * 6)), delta: `-${fmt(Math.min(totalDebt, totalEMI * 6))}` },
        { label: 'Debt-Free Date',   from: addMonths(baseDebtMonths), to: addMonths(scenA.accelMonths), delta: null }
      ]
    },
    {
      label: 'Scenario B', title: 'Moderate Improvement', tag: 'MEDIUM', tagBg: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
      desc: `Save ${fmt(Math.min(20000, Math.max(5000, income * 0.10)))}/month + cut ${fmt(Math.min(8000, expenses * 0.08))} spending.`,
      border: 'border-amber-500/30 bg-amber-500/5', iconColor: 'text-amber-400', icon: Target, timeline: '12 months', s: scenB,
      rows: [
        { label: 'Recovery Score',   from: `${score}`, to: `~${scenB.projScore}`,   delta: `+${scenB.projScore - score}` },
        { label: 'Emergency Fund',   from: fmt(emergencyFund), to: fmt(Math.min(efTarget, emergencyFund + scenB.efMonthly * 12)), delta: `+${fmt(Math.min(efTarget - emergencyFund, scenB.efMonthly * 12))}` },
        { label: 'Debt Balance',     from: fmt(totalDebt), to: fmt(Math.max(0, totalDebt - (totalEMI + scenB.dScore * 100) * 12)), delta: null },
        { label: 'Debt-Free Date',   from: addMonths(baseDebtMonths), to: addMonths(scenB.accelMonths), delta: null }
      ]
    },
    {
      label: 'Scenario C', title: 'Aggressive Recovery', tag: 'HARD', tagBg: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
      desc: `Save ${fmt(Math.min(30000, Math.max(8000, income * 0.15)))}/month + extra loan payments + cut spending.`,
      border: 'border-rose-500/30 bg-rose-500/5', iconColor: 'text-rose-400', icon: Flame, timeline: '18–24 months', s: scenC,
      rows: [
        { label: 'Recovery Score',   from: `${score}`, to: `~${scenC.projScore}`,   delta: `+${scenC.projScore - score}` },
        { label: 'Emergency Fund',   from: fmt(emergencyFund), to: fmt(Math.min(efTarget, emergencyFund + scenC.efMonthly * 20)), delta: null },
        { label: 'Interest Saved',   from: '₹0', to: fmt(scenC.interestSaved), delta: `+${fmt(scenC.interestSaved)}` },
        { label: 'Debt-Free Date',   from: addMonths(baseDebtMonths), to: addMonths(scenC.accelMonths), delta: topLoan ? `${baseDebtMonths - scenC.accelMonths} mo earlier` : null }
      ]
    }
  ];

  // what-if analysis
  const whatIfData = whatIf(base);

  // future timeline
  const tl = buildTimeline(base);
  const TL_DOT  = ['bg-slate-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-emerald-500'];
  const TL_RING = ['border-slate-700', 'border-blue-500/40', 'border-amber-500/40', 'border-purple-500/40', 'border-emerald-500/40'];
  const TL_LABEL= ['Today', '3 Months', '6 Months', '12 Months', '24 Months'];
  const TL_DESC = [
    'Current baseline — all improvements stem from here.',
    'Early momentum — emergency fund seeds, debt ticking down.',
    'Visible progress — habits locked in, score climbing.',
    'Significant recovery — clear financial trajectory established.',
    'Transformed position — strong buffer, substantially less debt.'
  ];

  // best return on effort
  const roeItems = [
    { r: 1, title: 'Extra Loan Payment',         impact: 'Very High', gain: '+8–15 pts', why: 'Reduces DTI ratio directly — the biggest driver of recovery score.',              link: '/simulator' },
    { r: 2, title: 'Build Emergency Fund',        impact: 'Very High', gain: '+10–20 pts',why: 'Eliminates forced borrowing risk — massive resilience improvement.',              link: '/settings/profile' },
    { r: 3, title: 'Increase Monthly Savings',   impact: 'High',      gain: '+5–10 pts', why: 'Builds liquidity and reduces financial fragility score.',                          link: '/settings/profile' },
    { r: 4, title: 'Reduce Lifestyle Spending',  impact: 'High',      gain: '+3–8 pts',  why: 'Frees surplus for both debt repayment and savings simultaneously.',               link: '/expenses' },
    { r: 5, title: 'Consolidate High-Rate Loans',impact: 'Medium',    gain: '+3–6 pts',  why: 'Simplifies tracking and may lower effective interest rate significantly.',        link: '/loans' }
  ];

  const todaySummary = (() => {
    if (surplus < 0) {
      return "You currently spend more than you earn each month. Because your basic living costs and loan payments exceed your total monthly income, your savings are likely shrinking, and you do not have any room to handle unexpected emergencies without going deeper into debt.";
    }
    if (emergencyMonths < 1) {
      return "You are making ends meet, but you have almost no emergency savings cushion set aside. Because most of your monthly income is immediately committed to living expenses and loan payments, any unexpected bill or medical cost will force you to borrow more, creating immediate financial pressure.";
    }
    if (dti > 45) {
      return "You have a stable monthly budget, but a very heavy portion of your income is locked up in loan payments. Having such high debt obligations means you have very little cash left over to grow your savings or establish true financial security, keeping your stress levels high.";
    }
    return "You have built a solid baseline with positive cash flow and some initial savings. While you are safe from immediate financial emergencies, your primary focus should now be on accelerating your path to becoming completely debt-free and establishing long-term wealth.";
  })();

  const twelveMonthOutcome = (() => {
    if (surplus < 0) {
      return [
        "Your monthly deficit is eliminated, achieving a balanced budget.",
        "A starter emergency fund of 1–2 months of expenses is successfully built.",
        "Your highest interest rate loan is targeted and begins shrinking.",
        "Your overall daily financial anxiety is noticeably lower."
      ];
    }
    if (emergencyMonths < 3) {
      return [
        "A secure 3-month emergency fund is fully established.",
        "Your total debt balance is reduced by over 30% using surplus acceleration.",
        "More monthly breathing room is created as your first loan is paid off.",
        "You feel confident that you can handle unexpected life events without credit cards."
      ];
    }
    return [
      "Your emergency reserve is fully funded to cover 4–6 months.",
      "Your high-interest debts are entirely paid off.",
      "A healthy portion of your income is being redirected into investments.",
      "You have complete control over your cash flow and financial peace of mind."
    ];
  })();

  const recoveryPathSteps = (() => {
    const steps = [];

    // Step 1: This Month
    if (surplus < 0) {
      steps.push({
        num: 1,
        time: "Step 1: This Month",
        action: "Identify and pause ₹3,000 of optional subscriptions or non-essential spending.",
        reason: "Your budget has a monthly deficit. Stopping the cash bleed is the absolute first step.",
        result: "You will prevent your debt from growing and start saving cash immediately."
      });
    } else if (emergencyMonths < 1) {
      steps.push({
        num: 1,
        time: "Step 1: This Month",
        action: `Set aside ₹${Math.round(Math.min(5000, surplus * 0.5)).toLocaleString('en-IN')} from this month's surplus into a separate account.`,
        reason: "You have virtually no cash shield. Creating a small buffer prevents borrowing during small crises.",
        result: "Initial emergency protection is established."
      });
    } else {
      steps.push({
        num: 1,
        time: "Step 1: This Month",
        action: topLoan ? `Pay an extra ₹3,000 toward your ${topLoan.loanName}.` : "Automate a ₹3,000 savings transfer.",
        reason: topLoan ? "Targeting high interest debt is the fastest way to save money." : "Build your wealth engine.",
        result: topLoan ? "High interest debt principal is reduced." : "Savings buffer begins growing."
      });
    }

    // Step 2: Next 3 Months
    if (emergencyMonths < 2) {
      steps.push({
        num: 2,
        time: "Step 2: Next 3 Months",
        action: "Grow your emergency savings until it covers a full 2 months of basic living expenses.",
        reason: "A 2-month cushion absorbs normal shocks (car repairs, dental issues) without borrowing.",
        result: "You break the debt dependency cycle entirely."
      });
    } else {
      steps.push({
        num: 2,
        time: "Step 2: Next 3 Months",
        action: topLoan ? `Direct 30% of surplus to prepay the remaining principal on your ${topLoan.loanName}.` : "Automate mutual fund investments.",
        reason: topLoan ? "Accelerating debt paydown compounds interest savings rapidly." : "Redirecting surplus to wealth assets.",
        result: topLoan ? "Loan term is shortened by several months." : "Compound interest starts working for you."
      });
    }

    // Step 3: Next 6 Months
    steps.push({
      num: 3,
      time: "Step 3: Next 6 Months",
      action: topLoan ? "Target your second highest interest loan or expand emergency savings to 4 months." : "Scale up your long-term mutual fund SIP.",
      reason: "Creating a stronger defensive shield allows you to invest aggressively.",
      result: "You achieve robust stability and notice score improvements."
    });

    // Step 4: Next 12 Months
    steps.push({
      num: 4,
      time: "Step 4: Next 12 Months",
      action: "Maintain a full 6-month emergency reserve and aim to reduce total outstanding debt by 50% or more.",
      reason: "Complete financial resilience unlocks long-term wealth options and eliminates monetary stress.",
      result: "You transition from recovering to building long-term financial freedom."
    });

    return steps;
  })();

  const whyPlanChosen = (() => {
    const reasons = [];
    reasons.push(`Monthly Income of ${fmt(income)} establishes your capacity to make regular repayments.`);
    reasons.push(`Monthly Expenses of ${fmt(expenses)} define your minimum monthly living cost.`);
    if (loans.length > 0) {
      reasons.push(`Your ${loans.length} active loans (totaling ${fmt(totalDebt)}) create a DTI burden that must be optimized.`);
    } else {
      reasons.push("You have no active loans, which drastically improves your financial safety index.");
    }
    reasons.push(`Your Emergency Fund (${fmt(emergencyFund)}) covers ${emergencyMonths.toFixed(1)} months of expenses, directing whether we prioritize defense or acceleration.`);
    return reasons;
  })();

  const score24   = Math.min(100, Math.round(score + clamp(Math.sqrt(24) * 5 + (surplus > 0 ? 3 : 0), 0, 48)));
  const debt24    = Math.max(0, totalDebt - (totalEMI + Math.max(surplus * 0.25, 0)) * 24);
  const ef24      = Math.min(efTarget, emergencyFund + Math.max(surplus * 0.45, 1500) * 24 * 0.5);
  const cfg0      = scoreLabel(score);
  const cfg24     = scoreLabel(score24);

  const roadmapMilestones = [
    {
      target: 50, label: 'Getting Stable',
      bc: 'border-rose-500/30', bar: 'bg-rose-500', tc: 'text-rose-400',
      actions: [
        { done: dti < 55,             text: `Bring DTI below 55% — currently ${dti.toFixed(0)}%` },
        { done: efMonths >= 1,        text: `Reach 1-month emergency fund — currently ${efMonths.toFixed(1)} months` },
        { done: surplus >= 0,         text: 'Stop monthly deficit — ensure income covers all outflows' }
      ]
    },
    {
      target: 70, label: 'Recovering',
      bc: 'border-amber-500/30', bar: 'bg-amber-500', tc: 'text-amber-400',
      actions: [
        { done: dti < 45,             text: `DTI below 45% — prepay highest-interest loan (currently ${dti.toFixed(0)}%)` },
        { done: efMonths >= 3,        text: `3-month emergency fund (currently ${efMonths.toFixed(1)} months)` },
        { done: savings >= income,    text: `Liquid savings above 1× monthly income (${fmt(savings)} / ${fmt(income)})` }
      ]
    },
    {
      target: 85, label: 'Financially Stable',
      bc: 'border-blue-500/30', bar: 'bg-blue-500', tc: 'text-blue-400',
      actions: [
        { done: dti < 30,             text: `DTI below 30% — significant debt reduction needed (currently ${dti.toFixed(0)}%)` },
        { done: (surplus / Math.max(income, 1)) * 100 >= 20, text: `Save 20%+ of income each month` },
        { done: efMonths >= 4,        text: `4+ months emergency coverage (currently ${efMonths.toFixed(1)})` }
      ]
    },
    {
      target: 95, label: 'Financial Freedom',
      bc: 'border-emerald-500/30', bar: 'bg-emerald-500', tc: 'text-emerald-400',
      actions: [
        { done: efMonths >= 6,        text: `Full 6-month emergency fund (currently ${efMonths.toFixed(1)} months)` },
        { done: dti < 25,             text: `DTI below 25% — debt nearly eliminated (currently ${dti.toFixed(0)}%)` },
        { done: savings >= income * 6,text: `Savings exceed 6× monthly income` }
      ]
    }
  ];

  return (
    <div className="space-y-10 select-none font-sans max-w-5xl mx-auto">

      {/* ── PAGE HEADER ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-brand-primary/10 rounded-xl flex items-center justify-center">
              <Compass size={18} className="text-brand-primary" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Life Coach Mode</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Your Financial Recovery Journey</h1>
          <p className="text-sm text-slate-400 mt-1">A direct path to financial peace of mind and building real buffer safety.</p>
        </div>
        <button onClick={() => { setRefreshing(true); fetchAll(); }} disabled={refreshing}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer disabled:opacity-50 transition-all">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          WHERE YOU ARE TODAY & WHERE YOU COULD BE IN 12 MONTHS
      ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-rose-400">
              <AlertCircle size={18} />
            </div>
            <h3 className="text-base font-black text-white">Where You Are Today</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            {todaySummary}
          </p>
        </div>

        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
              <CheckCircle size={18} />
            </div>
            <h3 className="text-base font-black text-white">Where You Could Be In 12 Months</h3>
          </div>
          <ul className="space-y-2.5">
            {twelveMonthOutcome.map((outcome, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                <span className="leading-relaxed font-medium">{outcome}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          YOUR RECOVERY PATH (Sequential Steps)
      ═══════════════════════════════════════════════════════════ */}
      <section className="space-y-5">
        <SectionHeader number="1" title="Your Recovery Path" subtitle="A month-by-month walkthrough of the physical actions you must execute." icon={Layers} color="text-brand-primary" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {recoveryPathSteps.map((step) => (
            <div key={step.num} className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5 space-y-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{step.time}</span>
                <div className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-xs">
                  {step.num}
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Action</span>
                  <p className="text-xs font-bold text-white mt-0.5">{step.action}</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Reason</span>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{step.reason}</p>
                </div>
                <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/80">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase">Expected Result</span>
                  <p className="text-[11px] text-slate-300 mt-0.5 font-medium leading-relaxed">{step.result}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          WHAT WILL IMPROVE FIRST & WHAT HAPPENS IF YOU QUIT
      ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-brand-primary">
              <Clock size={18} />
            </div>
            <h3 className="text-base font-black text-white">What Will Improve First?</h3>
          </div>
          <div className="space-y-4">
            {[
              { time: "Within 30 days", text: "Better spending awareness — tracking where leaks happen." },
              { time: "Within 90 days", text: "Emergency fund begins growing — providing immediate breathing room." },
              { time: "Within 6 months", text: "Recovery score noticeably improves — opening up better credit terms." },
              { time: "Within 12 months", text: "Financial stress decreases — money stops controlling your emotions." }
            ].map((win, idx) => (
              <div key={idx} className="flex gap-4 items-start text-xs border-l-2 border-brand-primary/20 pl-4 ml-2">
                <div className="font-bold text-brand-primary min-w-[100px] shrink-0">{win.time}</div>
                <div className="text-slate-300 font-medium">{win.text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-rose-500/30 bg-rose-500/5 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-rose-400">
              <AlertTriangle size={18} />
            </div>
            <h3 className="text-base font-black text-white">What Happens If You Quit?</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-xs text-rose-400 font-black shrink-0">☠</span>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Debt lasts longer: Without prepayments, interest calculations will stretch your timelines by years.
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-xs text-rose-400 font-black shrink-0">☠</span>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                More interest paid: Continuing minimal EMI payments means you keep paying massive cumulative financing charges to banks.
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-xs text-rose-400 font-black shrink-0">☠</span>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Lower financial flexibility: Zero safety net leaves you one step away from a critical emergency debt spiral.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          WHY THIS PLAN WAS CHOSEN FOR YOU
      ═══════════════════════════════════════════════════════════ */}
      <section className="space-y-5">
        <SectionHeader number="2" title="Why This Plan Was Chosen For You" subtitle="A transparent breakdown of how your specific numbers drove these recommendations." icon={Trophy} color="text-amber-400" />
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Our recommendations are never generic. We review your budget variables to formulate your path:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {whyPlanChosen.map((reason, idx) => (
              <div key={idx} className="flex gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
                <span className="text-brand-primary font-bold">●</span>
                <span className="text-slate-300 leading-relaxed font-medium">{reason}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          COLLAPSIBLE TECHNICAL CHARTS & SCENARIO PLANNERS
      ═══════════════════════════════════════════════════════════ */}
      <details className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 group transition-all">
        <summary className="text-xs font-black text-slate-400 group-hover:text-white cursor-pointer select-none outline-none list-none flex items-center gap-2">
          <span>▶</span> View Technical Projections & Simulation Data
        </summary>
        <div className="mt-8 space-y-12">
          
          {/* Timeline Projections */}
          <section className="space-y-5">
            <SectionHeader number="3" title="Future Possibilities" sub="Three realistic improvement paths — pick the one that fits your life." icon={Layers} color="text-amber-400" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {scenarios.map((s) => {
                const SIcon = s.icon;
                return (
                  <div key={s.label} className={`border ${s.border} rounded-2xl p-5 space-y-5 hover:scale-[1.01] transition-all duration-200`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center ${s.iconColor}`}>
                          <SIcon size={18} />
                        </div>
                        <div>
                          <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold ${s.tagBg}`}>{s.tag}</span>
                          <p className="text-sm font-black text-white mt-0.5">{s.title}</p>
                        </div>
                      </div>
                      <span className={`text-lg font-black ${s.iconColor}`}>+{s.s.projScore - score}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{s.desc}</p>
                    <div className="space-y-2">
                      {s.rows.map((row) => (
                        <div key={row.label} className="bg-slate-900/50 rounded-xl px-3 py-2.5 flex items-center justify-between text-xs">
                          <span className="text-slate-400">{row.label}</span>
                          <div className="flex items-center gap-2 font-bold">
                            <span className="text-slate-500 text-[11px]">{row.from}</span>
                            <span className="text-slate-600">→</span>
                            <span className="text-white">{row.to}</span>
                            {row.delta && (
                              <span className={`text-[10px] font-black ${row.delta.startsWith('-') ? 'text-rose-400' : 'text-emerald-400'}`}>
                                ({row.delta})
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1 text-slate-400"><Clock size={11} /> {s.timeline}</span>
                      <Link to="/simulator" className={`flex items-center gap-1 font-bold ${s.iconColor} hover:opacity-70`}>Simulate <ChevronRight size={12} /></Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Milestones Path */}
          <section className="space-y-5">
            <SectionHeader number="4" title="Score Growth Timeline" sub={`Current score: ${score}/100 — here is what you must do to reach each milestone.`} icon={Award} color="text-indigo-400" />
            <div className="space-y-4">
              {roadmapMilestones.map((band) => {
                const reached   = score >= band.target;
                const isCurrent = !reached && (
                  band.target === 50 ||
                  (band.target === 70 && score >= 50) ||
                  (band.target === 85 && score >= 70) ||
                  (band.target === 95 && score >= 85)
                );
                const done     = band.actions.filter(a => a.done).length;
                const pct      = Math.round((done / band.actions.length) * 100);

                return (
                  <div key={band.target} className={`border ${band.bc} rounded-2xl p-5 space-y-4 ${reached ? 'opacity-55' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-base shrink-0 ${reached ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300'}`}>
                        {reached ? '✓' : band.target}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-black ${band.tc}`}>Score {band.target} — {band.label}</p>
                          <div className="flex gap-2">
                            {reached    && <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[9px] font-bold">✓ ACHIEVED</span>}
                            {isCurrent  && <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border-amber-500/25 text-[9px] font-bold">YOUR NEXT TARGET</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${band.bar} rounded-full`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-500 shrink-0">{done}/{band.actions.length}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {band.actions.map((a, i) => (
                        <div key={i} className={`flex items-start gap-2 p-3 rounded-xl text-[11px] ${a.done ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-slate-900/50 border border-slate-800'}`}>
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${a.done ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                            {a.done ? <CheckCircle size={10} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />}
                          </div>
                          <span className={a.done ? 'text-slate-400 line-through' : 'text-slate-300'}>{a.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* What If logic */}
          <section className="space-y-5">
            <SectionHeader number="5" title="What If Analysis" sub="See the projected outcome of each individual action — before committing to it." icon={GitMerge} color="text-purple-400" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {whatIfData.map((w) => {
                const WIcon = w.icon;
                const dScore = w.r.projScore - score;
                const efGain = w.r.efMonthly * 12;
                return (
                  <div key={w.label} className={`border ${w.border} rounded-2xl p-5 space-y-4`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center ${w.color}`}>
                        <WIcon size={18} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-white">{w.label}</p>
                        <p className="text-[10px] text-slate-500">{w.sub}</p>
                      </div>
                      <span className={`text-xl font-black ${w.color}`}>+{dScore}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-slate-900/50 rounded-xl p-3">
                        <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-1">Score</p>
                        <p className="text-white font-black">{score} → {w.r.projScore}</p>
                      </div>
                      <div className="bg-slate-900/50 rounded-xl p-3">
                        <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-1">EF Growth / yr</p>
                        <p className="text-amber-400 font-black">{fmt(Math.min(efTarget - emergencyFund, efGain))}</p>
                      </div>
                      <div className="bg-slate-900/50 rounded-xl p-3">
                        <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-1">Debt-Free</p>
                        <p className="text-blue-400 font-black text-[10px]">{addMonths(w.r.accelMonths)}</p>
                      </div>
                    </div>
                    {dScore > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
                        <ThumbsUp size={11} /> Expected score gain: +{dScore} points
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Timeline snap checks */}
          <section className="space-y-5">
            <SectionHeader number="6" title="Financial Future Timeline" sub="Projected milestones at 3, 6, 12, and 24 months following the recommended plan." icon={Calendar} color="text-blue-400" />
            <div className="relative">
              <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-800 hidden md:block" />
              <div className="space-y-4">
                {tl.map((snap, idx) => (
                  <div key={snap.m} className="flex items-start gap-4 md:gap-6">
                    <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-xs ${TL_DOT[idx]} text-white shadow-lg z-10`}>
                      {snap.m === 0 ? 'Now' : `${snap.m}m`}
                    </div>
                    <div className={`flex-1 border ${TL_RING[idx]} rounded-2xl p-5 space-y-3`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{TL_LABEL[idx]}</p>
                          <p className="text-sm font-black text-white">{snap.m === 0 ? 'Starting Point' : `Projected — ${TL_LABEL[idx]}`}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-xl border text-xs font-bold ${snap.cfg.bg} ${snap.cfg.c}`}>
                          {snap.cfg.text}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'Recovery Score',    val: `${snap.projScore}/100`, c: snap.cfg.c },
                          { label: 'Emergency Fund',    val: snap.m === 0 ? fmt(emergencyFund) : fmt(snap.ef), c: 'text-amber-400' },
                          { label: 'Remaining Debt',    val: snap.m === 0 ? fmt(totalDebt) : fmt(snap.debt), c: 'text-rose-400' },
                          { label: 'Projected Surplus', val: snap.m === 0 ? fmt(surplus) : fmt(Math.max(surplus, snap.projSurplus)), c: 'text-emerald-400' }
                        ].map(m => (
                          <div key={m.label} className="bg-slate-900/50 rounded-xl p-3 text-center">
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{m.label}</p>
                            <p className={`text-sm font-black mt-1 ${m.c}`}>{m.val}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500">{TL_DESC[idx]}</p>
                      {snap.m > 0 && (
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span className="shrink-0">{score}</span>
                          <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${snap.projScore >= 70 ? 'bg-emerald-500' : snap.projScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'} rounded-full`}
                              style={{ width: `${snap.projScore}%` }} />
                          </div>
                          <span className="shrink-0">{snap.projScore}</span>
                          <span className="text-emerald-400 font-bold">(+{snap.projScore - score} pts)</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Two Paths compare */}
          <section className="space-y-5">
            <SectionHeader number="7" title="Two Paths Forward" sub="What the next 24 months look like with no action vs. following the plan." icon={Crosshair} color="text-rose-400" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="border border-rose-500/30 bg-rose-500/5 rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center">
                    <AlertTriangle size={20} className="text-rose-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-rose-400 uppercase font-bold tracking-widest">No Changes Made</p>
                    <p className="text-base font-black text-white">Current Path (24 months)</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: 'Recovery Score',    val: `~${Math.min(100, score + 5)}/100`,            note: 'Minimal organic change',             c: cfg0.c },
                    { label: 'Emergency Fund',    val: fmt(emergencyFund),                             note: 'Unchanged — no surplus allocated',    c: 'text-amber-400' },
                    { label: 'Remaining Debt',    val: fmt(Math.max(0, totalDebt - totalEMI * 24)),   note: 'Reduced only by regular EMIs',        c: 'text-rose-400' },
                    { label: 'Debt-Free Date',    val: addMonths(baseDebtMonths),                      note: 'At current pace, no acceleration',    c: 'text-slate-400' },
                    { label: 'Financial Status',  val: cfg0.text,                                      note: 'No meaningful improvement',           c: cfg0.c }
                  ].map(m => (
                    <div key={m.label} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl text-xs">
                      <div>
                        <p className="text-slate-400 font-medium">{m.label}</p>
                        <p className="text-[10px] text-slate-600">{m.note}</p>
                      </div>
                      <p className={`font-black ${m.c}`}>{m.val}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <CheckCircle size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest">Following the Plan</p>
                    <p className="text-base font-black text-white">Recommended Path (24 months)</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: 'Recovery Score',    val: `~${score24}/100`,                              note: `+${score24 - score} point improvement`,      c: cfg24.c },
                    { label: 'Emergency Fund',    val: fmt(Math.min(efTarget, ef24)),                  note: `${Math.min(6, ef24 / Math.max(expenses, 1)).toFixed(1)} months of coverage`, c: 'text-emerald-400' },
                    { label: 'Remaining Debt',    val: fmt(Math.max(0, debt24)),                       note: `${Math.round(((totalDebt - debt24) / Math.max(totalDebt, 1)) * 100)}% of debt eliminated`, c: 'text-amber-400' },
                    { label: 'Debt-Free Date',    val: addMonths(scenB.accelMonths),                   note: `${Math.max(0, baseDebtMonths - scenB.accelMonths)} months earlier`,          c: 'text-emerald-400' },
                    { label: 'Financial Status',  val: cfg24.text,                                     note: 'Significant recovery trajectory',             c: cfg24.c }
                  ].map(m => (
                    <div key={m.label} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl text-xs">
                      <div>
                        <p className="text-slate-400 font-medium">{m.label}</p>
                        <p className="text-[10px] text-slate-600">{m.note}</p>
                      </div>
                      <p className={`font-black ${m.c}`}>{m.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Effort rankings */}
          <section className="space-y-5">
            <SectionHeader number="8" title="Best Return on Effort" sub="Ranked by expected score improvement — focus here first." icon={Zap} color="text-amber-400" />
            <div className="bg-brand-card border border-slate-800 rounded-2xl p-6 space-y-3">
              {roeItems.map((a) => (
                <div key={a.r} className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800/50 hover:border-slate-700 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${a.r <= 2 ? 'bg-rose-500 text-white' : a.r === 3 ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                    {a.r}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-white">{a.title}</p>
                      <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold ${IMPACT[a.impact]}`}>{a.impact}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{a.why}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-emerald-400 font-bold">{a.gain}</p>
                    <Link to={a.link} className="text-[10px] text-brand-primary font-bold hover:opacity-70 flex items-center gap-0.5 justify-end mt-0.5">Start <ChevronRight size={11} /></Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Motivational progress bar */}
          <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold">Journey Progress</span>
                <span className="text-slate-500">Today → 24 months</span>
              </div>
              <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 rounded-full" style={{ width: '100%', opacity: 0.3 }} />
                <div className="absolute inset-y-0 left-0 h-full bg-brand-primary rounded-full transition-all" style={{ width: `${score}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span className={`font-bold ${cfg0.c}`}>{cfg0.text} ({score})</span>
                <span className="text-slate-600">Your journey →</span>
                <span className={`font-bold ${cfg24.c}`}>{cfg24.text} (~{score24})</span>
              </div>
            </div>
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-xs text-slate-400 leading-relaxed text-center">
              <Lightbulb size={11} className="inline mr-1 text-amber-400" />
              Projections use realistic estimation from your live financial data. Consistency is the most important variable.
            </div>
          </section>
        </div>
      </details>

      {/* CTA Row */}
      <div className="flex flex-wrap gap-3">
        {[
          { to: '/smart-advisor',  label: 'Full Action Plan',     c: 'text-brand-primary bg-emerald-500/10 border-emerald-500/20' },
          { to: '/simulator',      label: 'Payoff Simulator',     c: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
          { to: '/recovery-score', label: 'Check Score Now',      c: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
          { to: '/ai-coach',       label: 'Ask AI Coach',         c: 'text-purple-400 bg-purple-500/10 border-purple-500/20' }
        ].map(l => (
          <Link key={l.to} to={l.to} className={`inline-flex items-center gap-2 border text-xs font-bold px-4 py-2.5 rounded-xl hover:opacity-80 transition-opacity ${l.c}`}>
            {l.label} <ChevronRight size={13} />
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-xl text-[10px] text-slate-500 text-center">
        <Heart size={11} className="inline mr-1 text-rose-400" />
        All projections are forward-looking estimates based on your live profile. Actual outcomes depend on consistent execution.
        Generated: {new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}.
      </div>
    </div>
  );
};

export default RecoveryJourney;
