import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import apiService from '../services/apiService';
import SkeletonScreen from '../components/SkeletonScreen';
import {
  Lightbulb, TrendingUp, TrendingDown, AlertCircle, CheckCircle,
  Target, Zap, Shield, PiggyBank, Calendar, ArrowRight, ChevronRight,
  Star, Flame, Clock, DollarSign, Activity, BarChart2, Lock, Unlock,
  AlertTriangle, Heart, Award, RefreshCw, Brain, Map, Crosshair,
  Trophy, Sparkles, Info, ThumbsUp, Timer, BarChart, HelpCircle,
  TrendingUp as Invest, CheckSquare, ChevronDown, ChevronUp, X
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
const fmt = (n) => typeof n === 'number' ? `₹${Math.round(n).toLocaleString('en-IN')}` : '₹0';
const pct = (value, total) => total > 0 ? Math.min(100, (value / total) * 100).toFixed(1) : '0.0';
const clamp = (val, min, max) => Math.min(max, Math.max(min, val));
const addMonths = (months) => {
  if (!months || months <= 0 || months === Infinity || isNaN(months)) return 'N/A';
  const d = new Date();
  d.setMonth(d.getMonth() + Math.round(months));
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH CONFIG
// ═══════════════════════════════════════════════════════════════════════════════
const getHealthConfig = (score) => {
  if (score >= 80) return { label: 'Excellent', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25', icon: Star, gradient: 'from-emerald-500/20 to-emerald-500/5' };
  if (score >= 60) return { label: 'Good', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/25', icon: CheckCircle, gradient: 'from-blue-500/20 to-blue-500/5' };
  if (score >= 40) return { label: 'Recovering', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/25', icon: Activity, gradient: 'from-amber-500/20 to-amber-500/5' };
  return { label: 'High Risk', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/25', icon: AlertTriangle, gradient: 'from-rose-500/20 to-rose-500/5' };
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRIORITY COLORS
// ═══════════════════════════════════════════════════════════════════════════════
const PRIORITY_COLORS = [
  { border: 'border-rose-500/40', bg: 'bg-rose-500/5', num: 'bg-rose-500 text-white', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/25', icon: 'text-rose-400' },
  { border: 'border-amber-500/40', bg: 'bg-amber-500/5', num: 'bg-amber-500 text-white', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/25', icon: 'text-amber-400' },
  { border: 'border-blue-500/40', bg: 'bg-blue-500/5', num: 'bg-blue-500 text-white', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/25', icon: 'text-blue-400' }
];

const IMPACT_BADGE = {
  'Very High': 'bg-rose-500/10 text-rose-400 border-rose-500/25',
  'High':      'bg-amber-500/10 text-amber-400 border-amber-500/25',
  'Medium':    'bg-blue-500/10 text-blue-400 border-blue-500/25',
  'Low':       'bg-slate-700 text-slate-400 border-slate-600'
};
const DIFF_BADGE = {
  'Easy':   'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  'Medium': 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  'Hard':   'bg-rose-500/10 text-rose-400 border-rose-500/25'
};

// ═══════════════════════════════════════════════════════════════════════════════
// FINANCIAL DIAGNOSIS ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
const buildDiagnosis = ({ income, expenses, totalEMI, savings, emergencyFund, surplus, dti, score, loans }) => {
  const emergencyTarget = expenses * 6;
  const emergencyMonths = expenses > 0 ? emergencyFund / expenses : 0;

  if (surplus < 0) return {
    problem: 'Spending Exceeds Income',
    icon: AlertTriangle, iconColor: 'text-rose-400', severity: 'CRITICAL',
    why: `Your expenses and EMIs (${fmt(expenses + totalEMI)}) are more than your income (${fmt(income)}). Every month you are going deeper into financial stress.`,
    impact: `You cannot save, invest, or build an emergency buffer. Without correcting this, debts may grow.`,
    firstAction: 'Review your Expense Tracker and cut at least one recurring non-essential cost this week.',
    expectedBenefit: 'Even ₹5,000/month savings creates a ₹60,000 annual buffer and can improve your recovery score by 5–10 points.'
  };
  if (dti > 50) return {
    problem: 'Very High Debt-to-Income Ratio',
    icon: BarChart2, iconColor: 'text-rose-400', severity: 'CRITICAL',
    why: `${dti.toFixed(0)}% of your income goes directly to loan EMIs. This is nearly 2× the safe threshold of 35%.`,
    impact: `You have almost no room to handle unexpected costs, additional credit, or emergencies without borrowing more.`,
    firstAction: 'Run the Debt Simulator and target your highest-interest loan with any surplus you can find.',
    expectedBenefit: 'Reducing DTI below 40% could improve your Recovery Score by 8–15 points within 6 months.'
  };
  if (emergencyMonths < 2) return {
    problem: 'Critically Low Emergency Fund',
    icon: Shield, iconColor: 'text-amber-400', severity: 'HIGH',
    why: `You have only ${emergencyMonths.toFixed(1)} months of expenses covered. A single unexpected event — job loss, medical bill — could trigger a debt spiral.`,
    impact: `Without a safety net, any emergency forces you to take on new debt, worsening your financial position.`,
    firstAction: `Open a dedicated savings account and transfer ${fmt(Math.min(surplus * 0.5, 5000))} this month.`,
    expectedBenefit: 'Reaching 3 months of emergency cover can improve your Recovery Score by 10–20 points.'
  };
  if (dti > 35) return {
    problem: 'Elevated Debt Burden',
    icon: TrendingDown, iconColor: 'text-amber-400', severity: 'MEDIUM',
    why: `${dti.toFixed(0)}% of income goes to EMIs — above the 35% safety threshold. This restricts your ability to grow savings.`,
    impact: `Financial flexibility is limited. One missed payment could damage your credit and increase costs.`,
    firstAction: 'Prepay the highest-interest loan with at least 20% of your monthly surplus.',
    expectedBenefit: 'Getting DTI below 35% can unlock 5–12 point improvement in Recovery Score.'
  };
  if (savings < income) return {
    problem: 'Low Liquid Savings',
    icon: PiggyBank, iconColor: 'text-blue-400', severity: 'MEDIUM',
    why: `Your savings (${fmt(savings)}) are below 1× monthly income — a very thin buffer for any short-term need.`,
    impact: `Minor unexpected costs could force you to use credit, increasing future debt.`,
    firstAction: 'Automate ₹2,000–₹5,000/month into a dedicated savings account on salary day.',
    expectedBenefit: 'Building savings to 3× income can improve financial resilience and Recovery Score by 5–8 points.'
  };
  return {
    problem: 'Strong Position — Focus on Growth',
    icon: Star, iconColor: 'text-emerald-400', severity: 'POSITIVE',
    why: `Your income, expenses, and EMIs are well-balanced. Your financial health is ${score >= 70 ? 'good to excellent' : 'improving'}.`,
    impact: `You are in a great position to accelerate wealth-building through investments and strategic prepayment.`,
    firstAction: 'Start a monthly SIP of at least ₹2,000 in a diversified equity mutual fund.',
    expectedBenefit: 'Investing 20% of surplus monthly can compound to significant wealth over 5–10 years.'
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// IMPACT RANKING ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
const buildImpactRanking = ({ income, expenses, totalEMI, savings, emergencyFund, surplus, dti, score, loans }) => {
  const emergencyTarget = expenses * 6;
  const items = [];

  if (dti > 40) items.push({
    title: 'Reduce EMI Burden',
    why: 'High DTI is the single biggest constraint on your financial freedom.',
    impact: dti > 50 ? 'Very High' : 'High',
    scoreGain: '+8 to +15 pts',
    time: '6–18 months',
    difficulty: 'Hard',
    link: '/simulator'
  });
  if (emergencyFund < emergencyTarget) items.push({
    title: 'Build Emergency Fund',
    why: 'A 6-month buffer protects you from going deeper into debt during crises.',
    impact: emergencyFund < expenses * 2 ? 'Very High' : 'High',
    scoreGain: '+10 to +20 pts',
    time: '6–24 months',
    difficulty: 'Medium',
    link: '/settings/profile'
  });
  if (surplus < income * 0.15) items.push({
    title: 'Increase Monthly Surplus',
    why: 'More surplus means faster debt payoff, more savings, and less financial stress.',
    impact: surplus <= 0 ? 'Very High' : 'High',
    scoreGain: '+5 to +12 pts',
    time: '1–3 months',
    difficulty: 'Medium',
    link: '/expenses'
  });
  if (savings < income * 3) items.push({
    title: 'Build Savings Buffer',
    why: 'Liquid savings reduce reliance on credit for short-term needs.',
    impact: savings < income ? 'High' : 'Medium',
    scoreGain: '+5 to +8 pts',
    time: '6–12 months',
    difficulty: 'Easy',
    link: '/settings/profile'
  });
  items.push({
    title: 'Reduce Discretionary Spending',
    why: 'Cutting unnecessary expenses directly converts to surplus and savings.',
    impact: 'Medium',
    scoreGain: '+3 to +7 pts',
    time: '1 month',
    difficulty: 'Easy',
    link: '/expenses'
  });
  if (loans.length >= 2) items.push({
    title: 'Prepay Highest-Interest Loan',
    why: 'Every early rupee paid reduces total interest cost significantly.',
    impact: 'High',
    scoreGain: '+5 to +10 pts',
    time: '3–12 months',
    difficulty: 'Medium',
    link: '/simulator'
  });

  const IMPACT_ORDER = { 'Very High': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
  return items.sort((a, b) => (IMPACT_ORDER[b.impact] || 0) - (IMPACT_ORDER[a.impact] || 0)).slice(0, 5);
};

// ═══════════════════════════════════════════════════════════════════════════════
// WHAT HAPPENS IF SCENARIOS
// ═══════════════════════════════════════════════════════════════════════════════
const buildScenarios = ({ income, expenses, totalEMI, savings, emergencyFund, surplus, dti, score, loans }) => {
  const emergencyTarget = expenses * 6;
  const emergencyGap = Math.max(0, emergencyTarget - emergencyFund);
  const estimateScore = (dtiNew, efMonths, surplusNew) => {
    let s = score;
    if (dtiNew < dti) s += clamp((dti - dtiNew) * 0.4, 0, 20);
    if (efMonths > (emergencyFund / Math.max(expenses, 1))) s += clamp(efMonths * 3, 0, 15);
    if (surplusNew > surplus) s += clamp((surplusNew - surplus) / income * 20, 0, 10);
    return Math.min(100, Math.round(s));
  };

  const scenarios = [];

  // Scenario A: Cut expenses 10%
  const expensesCut = expenses * 0.1;
  const newSurplusA = surplus + expensesCut;
  const newDTI_A = income > 0 ? (totalEMI / income) * 100 : dti;
  const newEFMonthsA = emergencyGap > 0 && newSurplusA > 0 ? emergencyGap / (newSurplusA * 0.5) : 0;
  scenarios.push({
    title: `If you reduce expenses by ${fmt(expensesCut)}`,
    subtitle: 'Cut 10% from monthly spending',
    color: 'border-amber-500/30 bg-amber-500/5',
    iconColor: 'text-amber-400',
    icon: TrendingDown,
    changes: [
      { label: 'Monthly Surplus', before: fmt(surplus), after: fmt(newSurplusA), positive: true },
      { label: 'Recovery Score', before: `${score}`, after: `~${estimateScore(newDTI_A, emergencyMonthsLocal(emergencyFund, expenses), newSurplusA)}`, positive: true },
      { label: 'Emergency Fund ETA', before: emergencyGap > 0 ? addMonths(emergencyGap / Math.max(surplus * 0.5, 1)) : 'Done', after: emergencyGap > 0 && newSurplusA > 0 ? addMonths(newEFMonthsA) : 'Done', positive: true }
    ],
    howTo: 'Review subscriptions, dining, and shopping in your Expense Tracker.',
    link: '/expenses'
  });

  // Scenario B: Pay ₹5,000 extra on loan
  const extra = Math.min(5000, Math.max(1000, surplus * 0.3));
  const topLoan = [...loans].sort((a, b) => b.interestRate - a.interestRate)[0];
  const monthsPayoffBefore = topLoan ? Math.ceil(topLoan.remainingAmount / topLoan.emi) : 0;
  const monthsPayoffAfter = topLoan ? Math.ceil(topLoan.remainingAmount / (topLoan.emi + extra)) : 0;
  const interestSaved = topLoan ? Math.round((monthsPayoffBefore - monthsPayoffAfter) * topLoan.emi * (topLoan.interestRate / 1200)) : 0;
  if (loans.length > 0) scenarios.push({
    title: `If you pay ${fmt(extra)} extra on your loan`,
    subtitle: 'Extra monthly prepayment on highest-interest loan',
    color: 'border-blue-500/30 bg-blue-500/5',
    iconColor: 'text-blue-400',
    icon: Target,
    changes: [
      { label: 'Debt-Free Date', before: topLoan ? addMonths(monthsPayoffBefore) : 'N/A', after: topLoan ? addMonths(monthsPayoffAfter) : 'N/A', positive: true },
      { label: 'Interest Saved', before: '₹0', after: fmt(interestSaved), positive: true },
      { label: 'Recovery Score', before: `${score}`, after: `~${Math.min(100, score + Math.round((monthsPayoffBefore - monthsPayoffAfter) * 0.5))}`, positive: true }
    ],
    howTo: 'Make an additional payment via your bank app on any day of the month.',
    link: '/simulator'
  });

  // Scenario C: Income increases 15%
  const incomeBoost = income * 0.15;
  const newIncome = income + incomeBoost;
  const newSurplusC = newIncome - expenses - totalEMI;
  const newDTI_C = newIncome > 0 ? (totalEMI / newIncome) * 100 : dti;
  scenarios.push({
    title: `If your income increases by ${fmt(incomeBoost)}`,
    subtitle: 'Freelancing, raise, or a side project (15% boost)',
    color: 'border-emerald-500/30 bg-emerald-500/5',
    iconColor: 'text-emerald-400',
    icon: TrendingUp,
    changes: [
      { label: 'Monthly Surplus', before: fmt(surplus), after: fmt(newSurplusC), positive: true },
      { label: 'Debt-to-Income', before: `${dti.toFixed(1)}%`, after: `${newDTI_C.toFixed(1)}%`, positive: true },
      { label: 'Recovery Score', before: `${score}`, after: `~${estimateScore(newDTI_C, emergencyMonthsLocal(emergencyFund, expenses), newSurplusC)}`, positive: true }
    ],
    howTo: 'Even a part-time freelance project adding 15% income dramatically changes your trajectory.',
    link: '/forecast'
  });

  return scenarios;
};

const emergencyMonthsLocal = (ef, exp) => exp > 0 ? ef / exp : 0;

// ═══════════════════════════════════════════════════════════════════════════════
// RECOVERY ROADMAP
// ═══════════════════════════════════════════════════════════════════════════════
const buildRoadmap = ({ score, dti, emergencyFund, expenses, savings, income, surplus, loans }) => {
  const emergencyMonths = expenses > 0 ? emergencyFund / expenses : 0;
  const savingsRate = income > 0 ? (surplus / income) * 100 : 0;

  const milestones = [
    {
      target: 50, label: 'Getting Started',
      color: 'border-rose-500/30', barColor: 'bg-rose-500', textColor: 'text-rose-400',
      steps: [
        { done: dti < 55, text: `Reduce DTI below 55% (current: ${dti.toFixed(0)}%)` },
        { done: emergencyMonths >= 1, text: `Build 1 month emergency fund (${emergencyMonths.toFixed(1)}/1)` },
        { done: surplus >= 0, text: 'Eliminate monthly deficit — reach ₹0 surplus or better' }
      ]
    },
    {
      target: 70, label: 'Recovering',
      color: 'border-amber-500/30', barColor: 'bg-amber-500', textColor: 'text-amber-400',
      steps: [
        { done: dti < 45, text: `Reduce DTI below 45% (current: ${dti.toFixed(0)}%)` },
        { done: emergencyMonths >= 3, text: `Build 3-month emergency fund (${emergencyMonths.toFixed(1)}/3)` },
        { done: savings >= income, text: `Liquid savings above 1× income (${fmt(savings)} / ${fmt(income)})` }
      ]
    },
    {
      target: 85, label: 'Financially Stable',
      color: 'border-blue-500/30', barColor: 'bg-blue-500', textColor: 'text-blue-400',
      steps: [
        { done: dti < 30, text: `Reduce DTI below 30% (current: ${dti.toFixed(0)}%)` },
        { done: savingsRate >= 20, text: `Save 20%+ of income monthly (current: ${savingsRate.toFixed(0)}%)` },
        { done: emergencyMonths >= 4, text: `4+ months emergency coverage (${emergencyMonths.toFixed(1)}/4)` }
      ]
    },
    {
      target: 95, label: 'Financial Freedom',
      color: 'border-emerald-500/30', barColor: 'bg-emerald-500', textColor: 'text-emerald-400',
      steps: [
        { done: emergencyMonths >= 6, text: `Full 6-month emergency fund (${emergencyMonths.toFixed(1)}/6)` },
        { done: dti < 25, text: `DTI below 25% — minimal debt burden (current: ${dti.toFixed(0)}%)` },
        { done: savings >= income * 6, text: `Savings exceed 6× monthly income` }
      ]
    }
  ];

  return milestones;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ACHIEVEMENTS ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
const buildAchievements = ({ score, dti, emergencyFund, expenses, savings, income, loans, surplus }) => {
  const emergencyMonths = expenses > 0 ? emergencyFund / expenses : 0;
  return [
    { id: 'first_save', label: 'First Savings', desc: 'Save your first ₹50,000', icon: PiggyBank, unlocked: savings >= 50000 },
    { id: 'ef1', label: '1-Month Safety Net', desc: 'Emergency fund covers 1 month', icon: Shield, unlocked: emergencyMonths >= 1 },
    { id: 'ef3', label: '3-Month Buffer', desc: 'Emergency fund covers 3 months', icon: Shield, unlocked: emergencyMonths >= 3 },
    { id: 'ef6', label: 'Full Emergency Fund', desc: '6-month emergency fund complete', icon: Award, unlocked: emergencyMonths >= 6 },
    { id: 'dti40', label: 'DTI Under 40%', desc: 'Debt burden in safe territory', icon: TrendingDown, unlocked: dti < 40 },
    { id: 'score50', label: 'Score Milestone 50', desc: 'Recovery score reached 50', icon: Star, unlocked: score >= 50 },
    { id: 'score70', label: 'Score Milestone 70', desc: 'Recovery score reached 70', icon: Trophy, unlocked: score >= 70 },
    { id: 'debt_free', label: 'Debt Free!', desc: 'All active loans cleared', icon: Unlock, unlocked: loans.length === 0 }
  ];
};

// ═══════════════════════════════════════════════════════════════════════════════
// THIS WEEK ACTION CENTER
// ═══════════════════════════════════════════════════════════════════════════════
const buildWeeklyActions = ({ income, expenses, totalEMI, savings, emergencyFund, surplus, dti, score, loans }) => {
  const tasks = [];
  tasks.push({ text: 'Open Audit Report and verify your latest financial numbers', link: '/audit', urgency: 'ALWAYS', icon: CheckSquare });
  if (surplus < 0) tasks.push({ text: `Identify one expense over ₹2,000 to cut or pause this month`, link: '/expenses', urgency: 'URGENT', icon: Flame });
  else if (emergencyFund < expenses * 2) tasks.push({ text: `Transfer ${fmt(Math.min(surplus * 0.4, 5000))} into your emergency savings account`, link: '/settings/profile', urgency: 'HIGH', icon: Shield });
  if (loans.length > 0) tasks.push({ text: 'Make one extra loan payment — even ₹1,000 reduces total interest', link: '/loans', urgency: 'HIGH', icon: Target });
  tasks.push({ text: 'Run the Debt Simulator to see your estimated payoff date', link: '/simulator', urgency: 'LEARN', icon: BarChart });
  if (score < 70) tasks.push({ text: `Review your Recovery Score breakdown — understand what to improve`, link: '/recovery-score', urgency: 'LEARN', icon: Award });
  tasks.push({ text: 'Ask the AI Coach a specific financial question about your situation', link: '/ai-coach', urgency: 'ALWAYS', icon: Brain });
  return tasks.slice(0, 5);
};

// ═══════════════════════════════════════════════════════════════════════════════
// BUILD PRIORITY ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════
const buildPriorityActions = (metrics, scoreData, loans) => {
  const income = metrics?.monthlyIncome || 0;
  const expenses = metrics?.monthlyExpenses || 0;
  const totalEMI = metrics?.totalEMI || 0;
  const savings = metrics?.savings || 0;
  const emergencyFund = metrics?.emergencyFund || 0;
  const surplus = income - expenses - totalEMI;
  const dti = income > 0 ? (totalEMI / income) * 100 : 0;
  const emergencyTarget = expenses * 6;
  const emergencyGap = Math.max(0, emergencyTarget - emergencyFund);
  const score = scoreData?.score || 0;
  const actions = [];

  if (emergencyFund < emergencyTarget) {
    const monthsToGoal = surplus > 0 ? Math.ceil(emergencyGap / (surplus * 0.5)) : null;
    actions.push({
      title: 'Build Emergency Fund',
      urgency: emergencyFund < expenses * 2 ? 'CRITICAL' : 'HIGH',
      icon: Shield, difficulty: 'Medium', impact: emergencyFund < expenses * 2 ? 'Very High' : 'High',
      timeRequired: monthsToGoal ? `~${monthsToGoal} months` : '12–24 months',
      current: fmt(emergencyFund), target: fmt(emergencyTarget), gap: fmt(emergencyGap),
      whyMatters: 'Without 6 months of expenses saved, one crisis can derail years of progress.',
      description: `Your emergency fund covers only ${(emergencyFund / Math.max(expenses, 1)).toFixed(1)} months. Allocate 50% of your surplus toward this first.`,
      benefit: 'Reaching 6 months coverage can improve Recovery Score by 10–20 points and reduce financial anxiety significantly.',
      action: monthsToGoal ? `At ${fmt(surplus * 0.5)}/month, you can reach your target by ${addMonths(monthsToGoal)}.` : 'Start with any amount — even ₹500/month builds the habit.',
      link: '/settings/profile'
    });
  }
  if (dti > 40) {
    actions.push({
      title: 'Reduce Debt Burden',
      urgency: dti > 60 ? 'CRITICAL' : 'HIGH',
      icon: TrendingDown, difficulty: 'Hard', impact: dti > 50 ? 'Very High' : 'High',
      timeRequired: '6–18 months',
      current: `${dti.toFixed(1)}% DTI`, target: '< 40% DTI', gap: `${(dti - 40).toFixed(1)}% over limit`,
      whyMatters: 'High DTI limits your ability to save, invest, and handle emergencies.',
      description: `${dti.toFixed(0)}% of your income goes to EMIs — above the 40% safety threshold.`,
      benefit: 'Getting DTI below 40% can improve Recovery Score by 8–15 points and free up monthly cash.',
      action: 'Target your highest-interest loan with extra payments. Even ₹1,000 extra/month makes a measurable difference.',
      link: '/simulator'
    });
  }
  if (savings < income * 3) {
    actions.push({
      title: 'Boost Monthly Savings',
      urgency: savings < income ? 'HIGH' : 'MEDIUM',
      icon: PiggyBank, difficulty: 'Easy', impact: savings < income ? 'High' : 'Medium',
      timeRequired: '6–12 months',
      current: fmt(savings), target: fmt(income * 3), gap: fmt(Math.max(0, income * 3 - savings)),
      whyMatters: 'Liquid savings reduce dependence on credit and give you options during emergencies.',
      description: `Your savings (${fmt(savings)}) are below the recommended 3× monthly income buffer.`,
      benefit: 'Building savings to 3× income can improve Recovery Score by 5–8 points.',
      action: `Automate ${fmt(income * 0.1)} transfer on salary day to a separate savings account.`,
      link: '/settings/profile'
    });
  }
  if (surplus < income * 0.1 && surplus >= 0) {
    actions.push({
      title: 'Increase Monthly Surplus',
      urgency: surplus <= 0 ? 'CRITICAL' : 'MEDIUM',
      icon: Zap, difficulty: 'Medium', impact: surplus <= 0 ? 'Very High' : 'High',
      timeRequired: '1–3 months',
      current: fmt(surplus), target: fmt(income * 0.2), gap: fmt(Math.max(0, income * 0.2 - surplus)),
      whyMatters: 'Monthly surplus is the fuel for every financial improvement.',
      description: `Only ${fmt(surplus)} left after expenses and EMIs — just ${pct(surplus, income)}% of income.`,
      benefit: 'Increasing surplus by ₹5,000/month creates ₹60,000/year for debt payoff or savings.',
      action: 'Audit your Expense Tracker for recurring charges. Cutting 5–10% from spending unlocks significant surplus.',
      link: '/expenses'
    });
  }
  if (loans.length >= 3) {
    actions.push({
      title: 'Consolidate Loans',
      urgency: 'MEDIUM',
      icon: Target, difficulty: 'Hard', impact: 'Medium',
      timeRequired: '1–3 months',
      current: `${loans.length} active loans`, target: '1–2 loans', gap: `${loans.length - 2} extra`,
      whyMatters: 'Managing too many loans increases missed payment risk and mental load.',
      description: `${loans.length} simultaneous loans complicate tracking and may include high-rate ones.`,
      benefit: 'Consolidation simplifies repayment and may reduce your effective interest rate.',
      action: 'Ask your bank about a debt consolidation loan at a lower rate to combine high-interest debts.',
      link: '/loans'
    });
  }
  if (actions.length < 2 && score >= 70) {
    actions.push({
      title: 'Invest Your Surplus',
      urgency: 'OPPORTUNITY',
      icon: TrendingUp, difficulty: 'Easy', impact: 'High',
      timeRequired: 'Ongoing',
      current: fmt(surplus), target: 'Build wealth', gap: 'Untapped potential',
      whyMatters: "You've built a solid financial base — now it's time to grow it.",
      description: `Recovery score ${score}/100 puts you in a great position to start investing.`,
      benefit: 'Regular SIP investments can compound significantly over 5–10 years.',
      action: 'Start a ₹2,000/month SIP in a diversified equity mutual fund or PPF contribution.',
      link: '/forecast'
    });
  }
  return actions.slice(0, 3);
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════════════════════════════════════
const SectionHeader = ({ number, title, subtitle, icon: Icon, color = 'text-brand-primary' }) => (
  <div className="flex items-start gap-4 mb-6">
    <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 shrink-0 ${color}`}>
      <Icon size={20} />
    </div>
    <div>
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Section {number}</span>
      <h2 className="text-lg font-black text-white tracking-tight">{title}</h2>
      {subtitle && <p className="text-xs text-brand-muted mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// JARGON EXPLAINER TOOLTIP
// ═══════════════════════════════════════════════════════════════════════════════
const JargonCard = ({ term, meaning, good, current, status }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors font-bold cursor-pointer">
        <HelpCircle size={11} /> What is this?
      </button>
      {open && (
        <div className="absolute bottom-7 left-0 z-50 w-64 bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white font-black text-xs">{term}</span>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white cursor-pointer"><X size={12} /></button>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">{meaning}</p>
          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between"><span className="text-slate-500">Good range:</span><span className="text-emerald-400 font-bold">{good}</span></div>
            {current && <div className="flex justify-between"><span className="text-slate-500">Your value:</span><span className="text-white font-bold">{current}</span></div>}
            {status && <div className="flex justify-between"><span className="text-slate-500">Status:</span><span className={`font-bold ${status.ok ? 'text-emerald-400' : 'text-amber-400'}`}>{status.label}</span></div>}
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ENHANCED PRIORITY CARD
// ═══════════════════════════════════════════════════════════════════════════════
const PriorityCard = ({ action, index }) => {
  const colors = PRIORITY_COLORS[index] || PRIORITY_COLORS[2];
  const Icon = action.icon;
  return (
    <div className={`relative border ${colors.border} ${colors.bg} rounded-2xl p-6 space-y-4 transition-all hover:scale-[1.01] duration-200`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 ${colors.num} rounded-xl flex items-center justify-center text-sm font-black shrink-0`}>{index + 1}</div>
          <div>
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${colors.badge}`}>
              <Flame size={10} /> {action.urgency}
            </div>
            <h3 className="text-base font-bold text-white mt-1">{action.title}</h3>
          </div>
        </div>
        <Icon size={22} className={`${colors.icon} shrink-0 mt-1`} />
      </div>

      {/* Badges: Impact / Difficulty / Time */}
      <div className="flex flex-wrap gap-1.5">
        {action.impact && <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold ${IMPACT_BADGE[action.impact]}`}><Zap size={9} /> Impact: {action.impact}</span>}
        {action.difficulty && <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold ${DIFF_BADGE[action.difficulty]}`}><Activity size={9} /> {action.difficulty}</span>}
        {action.timeRequired && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold bg-slate-800 text-slate-400 border-slate-700"><Timer size={9} /> {action.timeRequired}</span>}
      </div>

      {/* Current / Target / Gap */}
      <div className="grid grid-cols-3 gap-2">
        {[{ label: 'Current', val: action.current, color: 'text-white' }, { label: 'Target', val: action.target, color: 'text-emerald-400' }, { label: 'Gap', val: action.gap, color: 'text-rose-400' }].map(({ label, val, color }) => (
          <div key={label} className="bg-slate-900/60 rounded-xl p-2.5 text-center">
            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">{label}</p>
            <p className={`text-xs font-black ${color}`}>{val}</p>
          </div>
        ))}
      </div>

      {/* Why it matters */}
      {action.whyMatters && (
        <div className="flex items-start gap-2 p-3 bg-slate-900/40 rounded-xl border border-slate-700/40">
          <Info size={13} className="text-slate-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Why This Matters</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">{action.whyMatters}</p>
          </div>
        </div>
      )}

      {/* Benefit */}
      {action.benefit && (
        <div className="flex items-start gap-2 p-3 bg-slate-900/60 rounded-xl border border-slate-700/50">
          <ThumbsUp size={13} className="text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[9px] text-emerald-400 uppercase font-bold tracking-wider mb-0.5">Expected Benefit</p>
            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">{action.benefit}</p>
          </div>
        </div>
      )}

      {/* Action tip */}
      <div className="flex items-start gap-2 p-3 bg-slate-900/60 rounded-xl border border-slate-700/50">
        <Lightbulb size={13} className="text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-300 leading-relaxed font-medium">{action.action}</p>
      </div>

      {action.link && (
        <Link to={action.link} className={`inline-flex items-center gap-1.5 text-xs font-bold ${colors.icon} hover:opacity-80 transition-opacity`}>
          Take Action <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MILESTONE PROGRESS BAR (avoids showing huge raw gaps)
// ═══════════════════════════════════════════════════════════════════════════════
const MilestoneBar = ({ current, milestones, label, color = 'bg-brand-primary' }) => {
  const total = milestones[milestones.length - 1];
  const progressPct = Math.min(100, (current / total) * 100);
  const nextMilestone = milestones.find(m => m > current) || total;
  const prevMilestone = [...milestones].reverse().find(m => m <= current) || 0;
  const segPct = total > 0 ? (prevMilestone / total) * 100 : 0;
  const nextPct = total > 0 ? (nextMilestone / total) * 100 : 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 font-bold">{label}</span>
        <span className="text-white font-black">{fmt(current)} <span className="text-slate-500 font-normal">of {fmt(total)}</span></span>
      </div>
      <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${progressPct}%` }} />
        {milestones.slice(0, -1).map(m => (
          <div key={m} className="absolute top-0 bottom-0 w-0.5 bg-slate-600" style={{ left: `${(m / total) * 100}%` }} />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>{fmt(prevMilestone)}</span>
        <span className="text-amber-400 font-bold">Next: {fmt(nextMilestone)}</span>
        <span>{fmt(total)}</span>
      </div>
      <div className="text-[10px] text-slate-500">
        {progressPct.toFixed(0)}% complete · {fmt(nextMilestone - current)} to next milestone
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const SmartFinancialAdvisor = () => {
  const { user } = useContext(AuthContext);
  const [metrics, setMetrics] = useState(null);
  const [scoreData, setScoreData] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async () => {
    try {
      const [metricRes, scoreRes, loanRes] = await Promise.all([
        apiService.dashboard.getMetrics(),
        apiService.recoveryScore.get().catch(() => ({ data: null })),
        apiService.loans.getAll().catch(() => ({ data: [] }))
      ]);
      setMetrics(metricRes.data);
      setScoreData(scoreRes.data);
      setLoans(Array.isArray(loanRes.data) ? loanRes.data.filter(l => l.status === 'Active') : []);
    } catch (err) {
      console.error(err);
      setError('Unable to load financial data. Please ensure your financial profile is set up.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleRefresh = () => { setRefreshing(true); fetchAll(); };

  if (loading) return <SkeletonScreen.Table rows={8} />;

  if (error || !metrics) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center space-y-5">
        <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle size={32} className="text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Profile Setup Required</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          {error || 'Complete your financial profile to receive personalized recommendations.'}
        </p>
        <div className="text-left p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-400">
          <p className="font-bold text-white mb-1">What this page does:</p>
          <p>• Diagnoses your biggest financial problem</p>
          <p>• Shows your path to score improvement</p>
          <p>• Generates "What Happens If" simulations</p>
          <p>• Gives you a personalized weekly action plan</p>
        </div>
        <Link to="/settings/profile" className="inline-flex items-center gap-2 bg-brand-primary text-black font-bold text-sm px-5 py-3 rounded-xl hover:bg-emerald-600 transition-all">
          Set Up Profile <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  // ─── Derived values ───────────────────────────────────────────────────────
  const income = metrics.monthlyIncome || 0;
  const expenses = metrics.monthlyExpenses || 0;
  const totalEMI = metrics.totalEMI || 0;
  const savings = metrics.savings || 0;
  const emergencyFund = metrics.emergencyFund || 0;
  const surplus = income - expenses - totalEMI;
  const dti = income > 0 ? (totalEMI / income) * 100 : 0;
  const score = scoreData?.score || 0;
  const emergencyTarget = expenses * 6;
  const emergencyMonths = expenses > 0 ? emergencyFund / expenses : 0;
  const totalDebt = loans.reduce((s, l) => s + l.remainingAmount, 0);
  const savingsRate = income > 0 ? (surplus / income) * 100 : 0;

  const healthConfig = getHealthConfig(score);
  const HealthIcon = healthConfig.icon;
  const derived = { income, expenses, totalEMI, savings, emergencyFund, surplus, dti, score, loans };
  const topLoan = [...loans].sort((a, b) => b.interestRate - a.interestRate)[0];
  const baseDebtMonths = topLoan && topLoan.emi > 0 ? Math.ceil(topLoan.remainingAmount / topLoan.emi) : 12;

  const primaryProblem = (() => {
    if (surplus < 0) return {
      type: "Excessive Spending",
      why: `Your monthly expenses and loan payments (${fmt(expenses + totalEMI)}) exceed your income (${fmt(income)}). You are spending more than you earn.`,
      effect: "This drains your savings every month, prevents you from building a safety net, and risks trapping you in a debt spiral.",
      ifNothing: {
        debtYear: topLoan ? addMonths(baseDebtMonths) : "Indefinite",
        score: `below ${score}`,
        emergency: "depleted or non-existent",
        stress: "very high",
      },
      ifPlan: {
        debtMonthsSooner: topLoan ? `${Math.max(3, baseDebtMonths - Math.ceil(topLoan.remainingAmount / (topLoan.emi + Math.max(1000, surplus * 0.35))))} months sooner` : "N/A",
        score: "70+",
        emergency: "3 months coverage",
        stress: "significantly reduced",
      },
      fix: "Cut at least one major non-essential recurring cost this week to stop the deficit.",
      fixExpected: "Regain budget surplus and improve recovery score by 5–10 points within 30 days."
    };

    if (dti > 50) return {
      type: "High Debt Burden",
      why: `${dti.toFixed(0)}% of your monthly income goes directly toward paying loan EMIs. This is nearly double the safe limit of 35%.`,
      effect: "Most of your earnings are locked up. A single emergency could force you to borrow more, compounding your problems.",
      ifNothing: {
        debtYear: topLoan ? addMonths(baseDebtMonths) : "Indefinite",
        score: `below ${score}`,
        emergency: "remains weak",
        stress: "remains high",
      },
      ifPlan: {
        debtMonthsSooner: topLoan ? `${Math.max(6, baseDebtMonths - Math.ceil(topLoan.remainingAmount / (topLoan.emi + Math.max(1500, surplus * 0.4))))} months sooner` : "12 months sooner",
        score: "70+",
        emergency: "3+ months coverage",
        stress: "significantly reduced",
      },
      fix: "Prepay your highest-interest loan using at least 40% of your monthly surplus.",
      fixExpected: "Lower your DTI ratio and unlock a 10–15 point boost in your recovery score."
    };

    if (emergencyMonths < 2) return {
      type: "No Emergency Savings",
      why: `You have only ${emergencyMonths.toFixed(1)} months of expenses saved. One minor emergency could wipe out your savings.`,
      effect: "Without a safety net, you are highly vulnerable to unexpected events and forced high-interest credit card borrowing.",
      ifNothing: {
        debtYear: topLoan ? addMonths(baseDebtMonths) : "Indefinite",
        score: `below ${score}`,
        emergency: "critically low",
        stress: "remains high due to fragility",
      },
      ifPlan: {
        debtMonthsSooner: topLoan ? `${Math.max(3, baseDebtMonths - Math.ceil(topLoan.remainingAmount / (topLoan.emi + Math.max(1000, surplus * 0.3))))} months sooner` : "6 months sooner",
        score: "70+",
        emergency: "3 to 6 months coverage",
        stress: "significantly reduced",
      },
      fix: "Automate a monthly transfer of ₹3,000 into a separate untouchable emergency savings account on salary day.",
      fixExpected: "Build a solid cash buffer and raise your recovery score by 15–20 points."
    };

    if (scoreData?.factors?.paymentCompliance?.value < 85) return {
      type: "Poor Payment Compliance",
      why: `Your loan payment history compliance is only ${scoreData?.factors?.paymentCompliance?.value || 0}%. You are missing EMI deadlines.`,
      effect: "This severely damages your credit health, triggers late fees, and drags down your financial recovery score.",
      ifNothing: {
        debtYear: topLoan ? addMonths(baseDebtMonths) : "Indefinite",
        score: `below ${score}`,
        emergency: "remains weak",
        stress: "remains high due to penalties",
      },
      ifPlan: {
        debtMonthsSooner: topLoan ? `${Math.max(3, baseDebtMonths - Math.ceil(topLoan.remainingAmount / (topLoan.emi + Math.max(1000, surplus * 0.3))))} months sooner` : "6 months sooner",
        score: "75+",
        emergency: "3+ months coverage",
        stress: "penalties eliminated and stress reduced",
      },
      fix: "Set up auto-debit or calendar alerts for all your loan payments to guarantee zero missed dates.",
      fixExpected: "Reclaim 10–15 recovery score points by achieving 100% on-time payments."
    };

    return {
      type: "Low Liquid Savings",
      why: `Your savings of ${fmt(savings)} are below 3× your monthly income. You have thin breathing room.`,
      effect: "You have very little flexibility for short-term opportunities or minor changes in monthly expense cycles.",
      ifNothing: {
        debtYear: topLoan ? addMonths(baseDebtMonths) : "Indefinite",
        score: `below ${score}`,
        emergency: "remains low",
        stress: "moderate",
      },
      ifPlan: {
        debtMonthsSooner: topLoan ? `${Math.max(3, baseDebtMonths - Math.ceil(topLoan.remainingAmount / (topLoan.emi + Math.max(1000, surplus * 0.35))))} months sooner` : "6 months sooner",
        score: "85+",
        emergency: "6 months coverage",
        stress: "minimal stress",
      },
      fix: "Direct 20% of your monthly surplus to an automated recurring deposit or short-term mutual fund.",
      fixExpected: "Sustainably build liquid buffer and increase recovery score by 5–8 points."
    };
  })();

  const singleImportantAction = (() => {
    if (surplus < 0) return {
      action: "Cut ₹3,000 from monthly discretionary spending.",
      reason: "Your budget is in deficit. You must stop the cash drain immediately.",
      benefit: "Eliminate deficit, create breathing room, and prevent additional debt."
    };
    if (emergencyMonths < 2) return {
      action: "Save ₹5,000 / month towards your Emergency Fund.",
      reason: "Your cash reserve is critically low. Building a safety net is your highest security priority.",
      benefit: "Protected against unexpected emergencies without borrowing more."
    };
    if (loans.length > 0) return {
      action: `Pay ₹3,000 extra toward your ${topLoan?.loanName || 'highest-interest loan'}.`,
      reason: `This loan carries your highest interest rate of ${topLoan?.interestRate || 12}%, costing you the most money over time.`,
      benefit: `Debt-free ${topLoan ? Math.max(3, baseDebtMonths - Math.ceil(topLoan.remainingAmount / (topLoan.emi + Math.max(1000, surplus * 0.35)))) : 12} months earlier, lower total interest paid, and improved Recovery Score.`
    };
    return {
      action: "Set up a monthly mutual fund SIP of ₹3,000.",
      reason: "You have no active loans and a solid savings buffer. Now is the time to build long-term wealth.",
      benefit: "Compounded wealth growth, higher savings ratio score, and financial freedom."
    };
  })();

  const weeklyActions = buildWeeklyActions(derived);
  const priorities = buildPriorityActions(metrics, scoreData, loans);
  const roadmap = buildRoadmap(derived);
  const achievements = buildAchievements(derived);
  const scenarios = buildScenarios(derived);

  const impactRanking = (() => {
    const items = [];
    if (loans.length > 0) {
      items.push({
        title: 'Prepay High-Interest Debt',
        impact: 'Very High',
        difficulty: 'Hard',
        why: 'Reduces your Debt-to-Income (DTI) ratio directly. Lowering DTI is the fastest way to save money and boost your credit profile.',
        scoreGain: '+10–15 pts',
        time: '6–18 months',
        link: '/loans'
      });
    }
    items.push({
      title: 'Establish 6-Month Emergency Buffer',
      impact: 'Very High',
      difficulty: 'Medium',
      why: 'Protects you from high-interest emergency borrowing. Safe cash coverage prevents future debt spirals.',
      scoreGain: '+12–20 pts',
      time: '3–6 months',
      link: '/settings/profile'
    });
    items.push({
      title: 'Automate Monthly Savings SIP',
      impact: 'High',
      difficulty: 'Easy',
      why: 'Consistently builds your liquid net worth. Automation ensures the savings habit is maintained effortlessly.',
      scoreGain: '+5–10 pts',
      time: 'Ongoing',
      link: '/forecast'
    });
    items.push({
      title: 'Cut Discretionary Spending',
      impact: 'High',
      difficulty: 'Medium',
      why: 'Auditing and cutting non-essential spending directly unlocks cash to fund prepayments and emergency savings.',
      scoreGain: '+5–8 pts',
      time: '1–2 months',
      link: '/expenses'
    });
    if (loans.length >= 2) {
      items.push({
        title: 'Consolidate Multiple Loans',
        impact: 'Medium',
        difficulty: 'Hard',
        why: 'Simplifies repayments into a single loan and can lower your effective interest rate if refinanced correctly.',
        scoreGain: '+3–6 pts',
        time: '2–3 months',
        link: '/loans'
      });
    }
    const impVal = { 'Very High': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    return items.sort((a, b) => impVal[b.impact] - impVal[a.impact]);
  })();

  const URGENCY_BADGE = {
    URGENT: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
    HIGH: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    LEARN: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
    ALWAYS: 'bg-slate-700 text-slate-300 border-slate-600'
  };

  const todayStatusText = (() => {
    if (score >= 80) return "Your financial health is in excellent shape! You are highly secure, but we can help you optimize your investments to build long-term wealth.";
    if (score >= 60) return "You are on a solid path to recovery. Most of your basics are covered, but we can still optimize your savings and prepayments to achieve full peace of mind.";
    if (score >= 40) return "You are currently recovering, but some areas of your budget or debt remain fragile. Let's work on stabilization to build a secure cushion.";
    return "You are not in danger today, but your current debt or spending patterns pose a high risk to your long-term security. We need to stabilize your situation immediately.";
  })();

  const keyMetricLine = (() => {
    if (surplus < 0) return {
      text: `Your monthly spending exceeds your income by ${fmt(Math.abs(surplus))}.`,
      safe: "Safe level: Positive cash surplus"
    };
    if (dti > 45) return {
      text: `${dti.toFixed(0)}% of your monthly income is going to loan payments.`,
      safe: "Safe level: Below 35%"
    };
    if (emergencyMonths < 2) return {
      text: `Your emergency savings cover only ${emergencyMonths.toFixed(1)} months of expenses.`,
      safe: "Safe level: 6 months of expenses"
    };
    return {
      text: `Your liquid savings buffer is at ${fmt(savings)}.`,
      safe: "Safe level: 3× monthly income"
    };
  })();

  return (
    <div className="space-y-10 select-none font-sans max-w-5xl mx-auto">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-brand-primary/10 rounded-xl flex items-center justify-center">
              <Lightbulb size={18} className="text-brand-primary" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Financial Coach Mode</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Your Personal Financial Coach</h1>
          <p className="text-sm text-slate-400 mt-1">A direct diagnosis and step-by-step roadmap to get you back on track.</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh Data
        </button>
      </div>

      {/* SECTION 1: MY FINANCIAL STATUS TODAY */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-b ${healthConfig.gradient} rounded-full blur-3xl opacity-20 -mr-20 -mt-20 pointer-events-none`} />
        
        <div className="flex items-center justify-between gap-4 flex-wrap border-b border-slate-800 pb-4 mb-4">
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Current Status</span>
            <div className="flex items-center gap-2 mt-1">
              <HealthIcon className={`w-5 h-5 ${healthConfig.color}`} />
              <span className={`text-xl font-black ${healthConfig.color}`}>{healthConfig.label}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Recovery Score</span>
            <p className="text-2xl font-black text-white">{score}/100</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed font-medium">
          {todayStatusText}
        </p>

        <div className="mt-4 p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">{keyMetricLine.text}</span>
            <span className="text-emerald-400 font-bold">{keyMetricLine.safe}</span>
          </div>
          <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-xs">
            <span className="text-slate-400">Your Biggest Challenge:</span>
            <span className="text-rose-400 font-black tracking-tight">{primaryProblem.type}</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: WHAT IS HURTING YOU THE MOST? */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">What is Hurting You the Most?</h3>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Biggest Problem</p>
          <p className="text-lg font-black text-rose-400 mt-0.5">{primaryProblem.type}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Why?</p>
          <p className="text-sm text-slate-300 leading-relaxed font-medium">{primaryProblem.why}</p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{primaryProblem.effect}</p>
        </div>
      </div>

      {/* SECTION 3: WHAT SHOULD I DO FIRST? */}
      <div className="bg-emerald-950/10 border border-emerald-500/25 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">What Should I Do First?</h3>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Your First Action</p>
          <p className="text-lg font-black text-emerald-400 mt-0.5">{singleImportantAction.action}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Reason</p>
          <p className="text-sm text-slate-300 leading-relaxed font-medium mt-0.5">{singleImportantAction.reason}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Expected Benefit</p>
          <p className="text-sm text-slate-300 leading-relaxed font-medium mt-0.5">{singleImportantAction.benefit}</p>
        </div>
      </div>

      {/* SECTIONS 4 & 5: OUTCOME CONTRAST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SECTION 4: WHAT HAPPENS IF I DO NOTHING? */}
        <div className="bg-rose-950/10 border border-rose-500/15 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-black text-rose-400 tracking-tight flex items-center gap-2 uppercase">
            <TrendingDown className="w-4 h-4" /> If Nothing Changes
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold shrink-0">•</span>
              <span>Debt payments continue until <strong className="text-white font-black">{primaryProblem.ifNothing.debtYear}</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold shrink-0">•</span>
              <span>Recovery Score stays <strong className="text-white font-black">{primaryProblem.ifNothing.score}</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold shrink-0">•</span>
              <span>Emergency protection remains <strong className="text-white font-black">{primaryProblem.ifNothing.emergency}</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold shrink-0">•</span>
              <span>Financial stress remains <strong className="text-white font-black">{primaryProblem.ifNothing.stress}</strong></span>
            </li>
          </ul>
        </div>

        {/* SECTION 5: WHAT HAPPENS IF I FOLLOW THE PLAN? */}
        <div className="bg-emerald-950/10 border border-emerald-500/15 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-black text-emerald-400 tracking-tight flex items-center gap-2 uppercase">
            <TrendingUp className="w-4 h-4" /> If You Follow the Plan
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <span>Become debt-free <strong className="text-white font-black">{primaryProblem.ifPlan.debtMonthsSooner}</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <span>Recovery Score climbs above <strong className="text-white font-black">{primaryProblem.ifPlan.score}</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <span>Build emergency fund of <strong className="text-white font-black">{primaryProblem.ifPlan.emergency}</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <span>Financial stress <strong className="text-white font-black">{primaryProblem.ifPlan.stress}</strong></span>
            </li>
          </ul>
        </div>
      </div>

      {/* SECTION 6: MY ROADMAP */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h3 className="text-sm font-black text-white flex items-center gap-2 tracking-tight uppercase">
          <Map className="w-4 h-4 text-brand-primary" /> My Recovery Roadmap
        </h3>
        
        <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          
          {/* This Month */}
          <div className="relative pl-8 space-y-1">
            <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-brand-primary border-4 border-slate-950" />
            <h4 className="text-xs font-black text-white uppercase tracking-wider">This Month</h4>
            <ul className="space-y-1 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-brand-primary font-bold">✓</span>
                <span>Commit to the first action: {singleImportantAction.action}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand-primary font-bold">✓</span>
                <span>Avoid taking on any new loans or credit card debt</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand-primary font-bold">✓</span>
                <span>Ensure all active loan EMIs are paid strictly on time</span>
              </li>
            </ul>
          </div>

          {/* Next 3 Months */}
          <div className="relative pl-8 space-y-1">
            <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-amber-500 border-4 border-slate-950" />
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Next 3 Months</h4>
            <ul className="space-y-1 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-amber-500 font-bold">✓</span>
                <span>Build initial emergency savings buffer (aim for 2 months of expenses)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-500 font-bold">✓</span>
                <span>Cut non-essential discretionary spending by 10%</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-500 font-bold">✓</span>
                <span>Maintain 100% on-time payment consistency</span>
              </li>
            </ul>
          </div>

          {/* Next 12 Months */}
          <div className="relative pl-8 space-y-1">
            <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-blue-500 border-4 border-slate-950" />
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Next 12 Months</h4>
            <ul className="space-y-1 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-blue-500 font-bold">✓</span>
                <span>Bring debt payments to a safe level (DTI ratio below 35%)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500 font-bold">✓</span>
                <span>Build a strong savings shield covering 3+ months of expenses</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500 font-bold">✓</span>
                <span>Establish long-term financial stability and reduce money stress</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* SECTION 7: WHY IS THE SYSTEM RECOMMENDING THIS? */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xs text-slate-400 uppercase tracking-wider font-bold">Why is the System Recommending This?</h3>
          <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">Confidence: High</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          These customized recommendations are dynamically generated to match your current financial profile. We analyze:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            "Income Information",
            "Expense Records",
            "Active Loans",
            "Payment History",
            "Recovery Score"
          ].map((source) => (
            <div key={source} className="flex items-center gap-2 bg-slate-950/40 border border-slate-800/60 rounded-xl p-3">
              <CheckCircle className="w-4 h-4 text-brand-primary shrink-0" />
              <span className="text-xs text-slate-300 font-medium">{source}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 8: ADVANCED ANALYSIS */}
      <details className="group border border-slate-800 bg-slate-900/15 rounded-2xl overflow-hidden transition-all duration-300">
        <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-900/30 transition-colors select-none">
          <div className="flex items-center gap-3">
            <BarChart2 className="w-5 h-5 text-slate-400 group-open:text-brand-primary" />
            <div>
              <h3 className="text-sm font-black text-white group-open:text-brand-primary transition-colors">Show Advanced Analysis</h3>
              <p className="text-xs text-slate-500 mt-0.5">Diagnostic charts, factor details, simulator calculations, and achievements</p>
            </div>
          </div>
          <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform duration-300" />
        </summary>
        
        <div className="p-6 border-t border-slate-800 space-y-10 bg-slate-950/20">
          
          {/* Recovery Metrics Factor Breakdown */}
          {scoreData?.factors && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Recovery Metrics Factor Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(scoreData.factors).map(([key, factor]) => (
                  <div key={key} className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white uppercase">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-brand-primary font-black">{factor.value}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-primary" style={{ width: `${factor.value}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400">{factor.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technical Calculations / Diagnostic Evidence */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Diagnostic Evidence & Technical Calculations</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Monthly Income', val: fmt(income), desc: 'Total salary or business revenue' },
                { label: 'Fixed Expenses', val: fmt(expenses), desc: 'Rent, groceries, utilities, etc.' },
                { label: 'Total EMIs', val: fmt(totalEMI), desc: 'Active monthly loan payouts' },
                { label: 'Net Surplus', val: fmt(surplus), desc: 'Leftover cache or deficit', color: surplus < 0 ? 'text-rose-400' : 'text-emerald-400' },
                { label: 'Debt to Income', val: `${dti.toFixed(1)}%`, desc: 'EMI burden as % of income' },
                { label: 'Emergency Fund', val: fmt(emergencyFund), desc: `Target: ${fmt(emergencyTarget)}` },
                { label: 'Cushion Months', val: `${emergencyMonths.toFixed(1)} mos`, desc: 'Number of months expenses covered' },
                { label: 'Total Debt Payout', val: fmt(totalDebt), desc: 'Remaining principal on active loans' }
              ].map((m) => (
                <div key={m.label} className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">{m.label}</p>
                  <p className={`text-base font-black ${m.color || 'text-white'} mt-0.5`}>{m.val}</p>
                  <p className="text-[9px] text-slate-500 mt-1 leading-snug">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Impact Ranking */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Priority Impact Actions</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {priorities.map((act, idx) => (
                <PriorityCard key={act.title} action={act} index={idx} />
              ))}
            </div>
          </div>

          {/* Simplified Jargon Cards */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Financial Jargon Simplified</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl space-y-2">
                <span className="text-xs font-bold text-white">DTI (Debt-to-Income)</span>
                <JargonCard 
                  term="Debt-to-Income (DTI)" 
                  meaning="The percentage of your monthly income that goes toward paying loan EMIs. A lower percentage is safer." 
                  good="Below 35%" 
                  current={`${dti.toFixed(1)}%`}
                  status={{ ok: dti <= 35, label: dti <= 35 ? 'Safe' : 'Elevated' }}
                />
              </div>
              <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl space-y-2">
                <span className="text-xs font-bold text-white">Recovery Score</span>
                <JargonCard 
                  term="Recovery Score" 
                  meaning="A rating from 0 to 100 representing your financial resilience and loan payoff pace. Higher is better." 
                  good="Above 70" 
                  current={`${score}`}
                  status={{ ok: score >= 70, label: score >= 70 ? 'Good' : 'Needs Work' }}
                />
              </div>
              <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl space-y-2">
                <span className="text-xs font-bold text-white">Emergency Buffer</span>
                <JargonCard 
                  term="Emergency Buffer" 
                  meaning="Cash reserves saved to cover fixed expenses if you lose your income. Recommended is 6 months." 
                  good="6 months" 
                  current={`${emergencyMonths.toFixed(1)} months`}
                  status={{ ok: emergencyMonths >= 3, label: emergencyMonths >= 3 ? 'Safe' : 'Critical' }}
                />
              </div>
              <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl space-y-2">
                <span className="text-xs font-bold text-white">Monthly Surplus</span>
                <JargonCard 
                  term="Monthly Surplus" 
                  meaning="The leftover cash after subtracting all expenses and EMIs from your monthly income." 
                  good="Positive" 
                  current={fmt(surplus)}
                  status={{ ok: surplus > 0, label: surplus > 0 ? 'Surplus' : 'Deficit' }}
                />
              </div>
            </div>
          </div>

          {/* Unlocked Achievements */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Unlocked Achievements</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {achievements.map((ach) => {
                const Icon = ach.icon;
                return (
                  <div key={ach.id} className={`p-4 rounded-xl border ${ach.unlocked ? 'border-emerald-500/30 bg-emerald-500/5 text-white' : 'border-slate-800 bg-slate-900/10 text-slate-500 opacity-55'}`}>
                    <Icon className={`w-8 h-8 ${ach.unlocked ? 'text-emerald-400' : 'text-slate-600'} mb-2`} />
                    <p className="text-xs font-bold">{ach.label}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{ach.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scenario Simulator */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">What Happens If... (Scenarios)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {scenarios.map((sc, i) => {
                const Icon = sc.icon;
                return (
                  <div key={i} className={`border ${sc.color} rounded-2xl p-5 space-y-4`}>
                    <div>
                      <h5 className="text-sm font-black text-white">{sc.title}</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">{sc.subtitle}</p>
                    </div>
                    <div className="space-y-2">
                      {sc.changes.map((ch, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">{ch.label}:</span>
                          <span className={`font-bold ${ch.positive ? 'text-emerald-400' : 'text-white'}`}>{ch.before} → {ch.after}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-medium">{sc.howTo}</p>
                    {sc.link && (
                      <Link to={sc.link} className="inline-flex items-center gap-1 text-xs font-bold text-brand-primary hover:opacity-80">
                        Try this tool <ArrowRight size={12} />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 30-Day Action Roadmap */}
          <section className="space-y-5">
            <SectionHeader number="30" title="Timeline Roadmap: Steps for the next 30 days" subtitle="Week-by-week tasks — items already completed are pre-checked based on your data." icon={Calendar} color="text-indigo-400" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                {
                  week: 'Week 1', title: 'Review & Audit', color: 'border-indigo-500/40 bg-indigo-500/5', iconColor: 'text-indigo-400',
                  tasks: [
                    { done: false, text: 'Log into Audit Report and download your PDF summary', link: '/audit' },
                    { done: false, text: 'Verify all loan details are accurate', link: '/loans' },
                    { done: false, text: `Review last month's expenses`, link: '/expenses' },
                    { done: score > 50, text: `Recovery score is ${score}/100 — understand what drives it`, link: '/recovery-score' }
                  ]
                },
                {
                  week: 'Week 2', title: 'Emergency Fund Setup', color: 'border-emerald-500/40 bg-emerald-500/5', iconColor: 'text-emerald-400',
                  tasks: [
                    { done: emergencyFund >= expenses * 2, text: `Transfer ${fmt(Math.min(surplus * 0.4, 5000))} to an emergency savings account`, link: '/settings/profile' },
                    { done: emergencyFund >= expenses * 6, text: 'Open a high-yield FD or liquid fund for emergency corpus', link: '/settings/profile' },
                    { done: false, text: 'Set up automatic monthly transfer on salary day', link: '/settings/profile' },
                    { done: emergencyFund >= expenses, text: 'Label account "UNTOUCHABLE — Emergency Only"', link: null }
                  ]
                },
                {
                  week: 'Week 3', title: 'Debt Acceleration', color: 'border-amber-500/40 bg-amber-500/5', iconColor: 'text-amber-400',
                  tasks: [
                    { done: false, text: 'Identify highest-interest loan for extra payment', link: '/loans' },
                    { done: loans.length === 0, text: surplus > 0 ? `Send ${fmt(Math.min(surplus * 0.3, 3000))} extra to primary loan` : 'Fix surplus first, then add extra payments', link: '/loans' },
                    { done: false, text: 'Run the Debt Simulator to see payoff timeline', link: '/simulator' },
                    { done: false, text: 'Contact bank about interest rate negotiation', link: null }
                  ]
                },
                {
                  week: 'Week 4', title: 'Savings & Growth', color: 'border-purple-500/40 bg-purple-500/5', iconColor: 'text-purple-400',
                  tasks: [
                    { done: false, text: 'Set up a SIP for minimum ₹500/month in a mutual fund', link: '/forecast' },
                    { done: savings >= income, text: `Build liquid savings to cover 1× income (${fmt(income)})`, link: '/settings/profile' },
                    { done: false, text: 'Ask the AI Coach for personalized investment advice', link: '/ai-coach' },
                    { done: score >= 70, text: 'Track Recovery Score improvement at month end', link: '/recovery-score' }
                  ]
                }
              ].map((week) => (
                <div key={week.week} className={`border ${week.color} rounded-2xl p-5 space-y-4`}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{week.week}</span>
                    <span className={`text-sm font-black ${week.iconColor}`}>{week.title}</span>
                    <span className="ml-auto text-[10px] text-slate-500">{week.tasks.filter(t => t.done).length}/{week.tasks.length} done</span>
                  </div>
                  <div className="space-y-2.5">
                    {week.tasks.map((task, i) => (
                      <div key={i} className="flex items-start gap-3 text-xs">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${task.done ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'border-slate-700 text-slate-500'}`}>
                          {task.done ? <CheckCircle size={12} /> : <Clock size={12} />}
                        </div>
                        <span className={`leading-relaxed flex-1 ${task.done ? 'line-through text-slate-500' : 'text-slate-300'}`}>{task.text}</span>
                        {task.link && !task.done && <Link to={task.link} className="text-brand-primary shrink-0 hover:opacity-70"><ChevronRight size={14} /></Link>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              {[
                { to: '/recovery-score', label: 'Check Recovery Score', color: 'text-brand-primary bg-emerald-500/10 border-emerald-500/20' },
                { to: '/audit', label: 'Download Audit PDF', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                { to: '/ai-coach', label: 'Ask AI Coach', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
                { to: '/forecast', label: 'View Debt Forecast', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }
              ].map((link) => (
                <Link key={link.to} to={link.to} className={`inline-flex items-center gap-2 border text-xs font-bold px-4 py-2.5 rounded-xl hover:opacity-80 transition-opacity ${link.color}`}>
                  {link.label} <ChevronRight size={13} />
                </Link>
              ))}
            </div>
          </section>

        </div>
      </details>

      {/* Footer */}
      <div className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-xl text-[10px] text-slate-500 leading-relaxed text-center">
        <Heart size={11} className="inline mr-1 text-rose-400" />
        All recommendations are generated from your live profile data — no external data is used.
        For major financial decisions, consult a certified financial advisor.
        Last updated: {new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}.
      </div>
    </div>
  );
};

export default SmartFinancialAdvisor;
