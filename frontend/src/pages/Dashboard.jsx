import React, { useContext, useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getTranslation } from '../services/localizer';
import apiService from '../services/apiService';
import StatCard from '../components/StatCard';
import ExplainModal from '../components/ExplainModal';
import SkeletonScreen from '../components/SkeletonScreen';
import InsightCard from '../components/InsightCard';
import { 
  Award, 
  Landmark, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  BadgeAlert, 
  FileCheck2, 
  AlertCircle,
  Bot,
  MessageSquare,
  HelpCircle,
  X,
  Plus,
  CheckCircle,
  CheckCircle2,
  Calculator,
  Target,
  Compass
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

const getFinancialDiagnosis = (metrics, scoreData) => {
  if (!metrics) return null;
  const dti = metrics.debtToIncomeRatio || 0;
  const ef = metrics.emergencyFund || 0;
  const expenses = metrics.monthlyExpenses || 1;
  const efMonths = ef / expenses;
  const savings = metrics.savings || 0;
  const income = metrics.monthlyIncome || 1;
  const savingsRatio = (savings / income) * 100;
  const compliance = scoreData?.factors?.paymentCompliance?.value ?? 100;
  const overdueTotal = metrics?.expenseStatus?.overdueObligations || 0;

  if (overdueTotal > 0) {
    return {
      biggestIssue: "Active Overdue Obligations",
      why: `You have ₹${overdueTotal.toLocaleString()} in overdue unpaid bills in your ledger.`,
      risk: "Late fees, penalty interest charges, and a drop in your Recovery Score.",
      action: "Settle the overdue bills in your Expense Ledger immediately.",
      benefit: "Your Recovery Score could improve by 10–15 points instantly."
    };
  }

  if (dti > 45) {
    return {
      biggestIssue: "High Debt Burden",
      why: `${dti.toFixed(0)}% of your monthly income is used for loan payments (EMI).`,
      risk: "Low savings growth, higher default risk, and extreme financial stress.",
      action: "Prepay an extra ₹5,000 towards your highest-interest loan to accelerate payoff.",
      benefit: "Your Recovery Score could improve by 5–10 points."
    };
  }

  if (efMonths < 3) {
    return {
      biggestIssue: "Insufficient Emergency Shield",
      why: `Your emergency fund only covers ${efMonths.toFixed(1)} months of lifestyle expenses.`,
      risk: "Vulnerability to unforeseen crises, forcing you to borrow more high-interest debt.",
      action: "Automate a monthly transfer of ₹3,000 into your emergency reserve.",
      benefit: "Strengthens financial resilience and adds up to 10 points to your Score."
    };
  }

  if (savingsRatio < 10) {
    return {
      biggestIssue: "Low Savings Velocity",
      why: `You are saving less than 10% of your take-home monthly income.`,
      risk: "Slow wealth accumulation and delay in achieving long-term financial freedom.",
      action: "Reduce discretionary spending (e.g. food/shopping) by 10% and allocate to savings.",
      benefit: "Saves interest, boosts cash reserve, and increases Score by 5 points."
    };
  }

  if (compliance < 95) {
    return {
      biggestIssue: "Irregular Bill Compliance",
      why: `Your payment compliance rate is at ${compliance}%.`,
      risk: "Late fees, credit degradation, and delayed debt-free timelines.",
      action: "Set up auto-debits for your upcoming bills or pay on time to avoid slips.",
      benefit: "Restores good payment standing and raises Recovery Score by 8 points."
    };
  }

  return {
    biggestIssue: "Healthy Financial Standing",
    why: "All key financial metrics meet or exceed standard safety thresholds.",
    risk: "Complacency; not maximizing the growth potential of your monthly surplus.",
    action: "Consider investing your surplus in diversified assets or paying down remaining principal.",
    benefit: "Locks in long-term compounding growth and keeps your Recovery Score near 100."
  };
};

const getTodayActions = (metrics, scoreData) => {
  const actions = [];
  if (!metrics) return [];
  const overdueTotal = metrics.expenseStatus?.overdueObligations || 0;
  const pendingCount = metrics.expenseStatus?.pendingCount || 0;
  const dti = metrics.debtToIncomeRatio || 0;
  const ef = metrics.emergencyFund || 0;
  const expenses = metrics.monthlyExpenses || 1;
  const efMonths = ef / expenses;

  if (overdueTotal > 0) {
    actions.push({ text: `Settle overdue balance of ₹${overdueTotal.toLocaleString()} immediately`, done: false, link: '/expenses' });
  } else {
    actions.push({ text: "Avoid new borrowing and high-interest credit card debt", done: true });
  }

  if (pendingCount > 0) {
    actions.push({ text: `Pay upcoming EMI or bill (${pendingCount} due in next few days)`, done: false, link: '/expenses' });
  } else {
    actions.push({ text: "Save ₹2,000 this month by cutting non-essential expenses", done: false, link: '/settings/profile' });
  }

  if (efMonths < 3) {
    actions.push({ text: "Review pending expenses in the tracker for extra savings", done: false, link: '/expenses' });
  } else {
    actions.push({ text: "Maintain payment compliance above 95% on all obligations", done: true });
  }

  if (dti > 45) {
    actions.push({ text: "Run debt simulation to see accelerated payoff advantages", done: false, link: '/simulator' });
  } else {
    actions.push({ text: "Optimize surplus allocation using simulator settings", done: true });
  }

  return actions.slice(0, 5);
};

const getMostImportantMetric = (metrics, scoreData) => {
  if (!metrics) return null;
  const dti = metrics.debtToIncomeRatio || 0;
  const score = scoreData?.score || 0;
  const category = scoreData?.category || 'High Risk';

  if (score < 50) {
    return {
      title: "Current Recovery Score",
      value: score,
      status: category,
      nextTarget: 50,
      requiredAction: "Reduce DTI below 45% and clear overdue obligations"
    };
  }

  if (dti > 45) {
    return {
      title: "Debt-to-Income (DTI) Ratio",
      value: `${dti.toFixed(1)}%`,
      status: "High Debt Burden",
      nextTarget: "Under 45%",
      requiredAction: "Reduce total monthly EMI burden below ₹15,000"
    };
  }

  return {
    title: "Current Recovery Score",
    value: score,
    status: category,
    nextTarget: 80,
    requiredAction: "Maintain monthly compliance and keep surplus positive"
  };
};

const getMilestones = (metrics, scoreData) => {
  if (!metrics) return [];
  const score = scoreData?.score || 0;
  const savings = metrics.savings || 0;
  const dti = metrics.debtToIncomeRatio || 0;
  const ef = metrics.emergencyFund || 0;
  const expenses = metrics.monthlyExpenses || 1;
  const efMonths = ef / expenses;
  const activeLoans = metrics.totalLoans || 0;

  return [
    { name: "First ₹10,000 saved", achieved: (savings + ef) >= 10000, value: `₹${(savings + ef).toLocaleString()}` },
    { name: "Recovery Score above 50", achieved: score >= 50, value: `${score} / 100` },
    { name: "Emergency fund reaches 1 month", achieved: efMonths >= 1, value: `${efMonths.toFixed(1)} months` },
    { name: "DTI below 40%", achieved: dti < 40 && dti > 0, value: `${dti.toFixed(1)}%` },
    { name: "Debt-Free (No loans)", achieved: activeLoans === 0, value: `${activeLoans} Active Loans` }
  ];
};


const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const lang = user?.preferredLanguage || 'en';
  const location = useLocation();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState(null);
  const [successBanner, setSuccessBanner] = useState(false);

  useEffect(() => {
    if (location.state?.showSuccessBanner) {
      setSuccessBanner(true);
      // Clear state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);
  const [scoreData, setScoreData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileModal, setProfileModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [aiSummary, setAiSummary] = useState({ count: 0, lastDate: null, topIntent: null });

  // Explainability states
  const [explainType, setExplainType] = useState(null);
  const [explainDashboard, setExplainDashboard] = useState(false);
  const [showChartInfo, setShowChartInfo] = useState(false);

  // Profile Form state
  const [incomeInput, setIncomeInput] = useState('');
  const [expensesInput, setExpensesInput] = useState('');
  const [savingsInput, setSavingsInput] = useState('');
  const [emergencyInput, setEmergencyInput] = useState('');
  const [dependentsInput, setDependentsInput] = useState(0);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const metricRes = await apiService.dashboard.getMetrics();
      setMetrics(metricRes.data);

      if (metricRes.data.hasFinancialProfile) {
        const scoreRes = await apiService.recoveryScore.get();
        setScoreData(scoreRes.data);

        const trendRes = await apiService.analytics.getDebtTrend();
        setTrendData(trendRes.data);

        try {
          const historyRes = await apiService.ai.getHistory({ limit: 50 });
          if (historyRes.success && historyRes.data.length > 0) {
            const entries = historyRes.data;
            const intentCounts = {};
            entries.forEach(e => { intentCounts[e.intent] = (intentCounts[e.intent] || 0) + 1; });
            const topIntent = Object.entries(intentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'GENERAL';
            setAiSummary({
              count: historyRes.pagination?.total || entries.length,
              lastDate: entries[0]?.createdAt || null,
              topIntent
            });
          }
        } catch (_e) { /* AI history is optional */ }

      } else {
        setProfileModal(true);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to sync metrics from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const payload = {
        monthlyIncome: parseFloat(incomeInput),
        monthlyExpenses: parseFloat(expensesInput),
        savings: parseFloat(savingsInput) || 0,
        emergencyFund: parseFloat(emergencyInput) || 0,
        dependents: parseInt(dependentsInput) || 0
      };

      const res = await apiService.profile.create(payload);
      if (res.success) {
        setProfileModal(false);
        fetchDashboardData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to construct profile.');
    }
  };

  if (loading) {
    return (
      <div class="space-y-8 select-none">
        <SkeletonScreen.Grid count={4} />
        <SkeletonScreen.Table rows={4} />
      </div>
    );
  }

  const getBadgeColor = (category) => {
    switch (category) {
      case 'Excellent': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Stable': return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
      case 'Recovering': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'High Risk': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      case 'Critical':
      default: return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    }
  };

  const getScoreColorClass = (category) => {
    switch (category) {
      case 'Excellent': return 'text-risk-excellent bg-emerald-500/10';
      case 'Stable': return 'text-risk-stable bg-cyan-500/10';
      case 'Recovering': return 'text-risk-recovering bg-blue-500/10';
      case 'High Risk': return 'text-risk-high bg-orange-500/10';
      case 'Critical':
      default: return 'text-risk-critical bg-rose-500/10';
    }
  };

  return (
    <div class="space-y-8 select-none font-sans leading-relaxed">
      
      {/* Financial Diagnosis */}
      {metrics && (() => {
        const diag = getFinancialDiagnosis(metrics, scoreData);
        if (!diag) return null;
        return (
          <div className="bg-brand-card border border-indigo-500/20 rounded-2xl p-6 shadow-glow-secondary space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Compass size={16} />
              <span>Financial Diagnosis</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold leading-relaxed">
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Biggest Issue</span>
                  <span className="text-sm font-black text-rose-450">{diag.biggestIssue}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Why</span>
                  <p className="text-slate-300 font-medium">{diag.why}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Risk</span>
                  <p className="text-slate-400 font-medium">{diag.risk}</p>
                </div>
              </div>
              <div className="space-y-3 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Recommended Action</span>
                  <p className="text-slate-200 font-bold">{diag.action}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Expected Benefit</span>
                  <p className="text-brand-primary font-black">{diag.benefit}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      
      {/* Success Banner */}
      {successBanner && (
        <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between gap-4 animate-fade-in">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle size={20} />
            </div>
            <div>
              <h4 class="text-sm font-bold text-white">Financial profile updated successfully.</h4>
              <p class="text-[11px] text-emerald-300">All forecasts and scores have been recalculated.</p>
            </div>
          </div>
          <button 
            onClick={() => setSuccessBanner(false)}
            class="text-slate-400 hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      {/* Financial Audit Banner */}
      <div class="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
            <FileCheck2 size={20} />
          </div>
          <div>
            <h4 class="text-sm font-bold text-white">Need a complete calculation audit?</h4>
            <p class="text-[11px] text-indigo-300">View formulas, point weights, and repayment assumptions used in our scoring algorithms.</p>
          </div>
        </div>
        <NavLink
          to="/audit"
          class="bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
        >
          Open Audit Report &rarr;
        </NavLink>
      </div>

      {/* Page Title */}
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 class="text-2xl font-black tracking-tight text-white">{getTranslation(lang, 'dashboard')}</h1>
          <p class="text-xs text-brand-muted font-medium mt-1">Real-time financial status tracking & debt evaluation.</p>
        </div>
        
        <div class="flex items-center gap-3">
          <button
            onClick={() => setExplainDashboard(!explainDashboard)}
            class={`font-bold text-xs px-4 py-2.5 rounded-xl transition-all border cursor-pointer flex items-center gap-2 ${
              explainDashboard 
                ? 'bg-brand-primary text-black border-brand-primary shadow-glow-primary font-extrabold' 
                : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
            }`}
          >
            <span>Explain Dashboard</span>
          </button>
          <NavLink
            to="/settings/profile"
            class="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all border border-slate-700 cursor-pointer flex items-center gap-2"
          >
            <span>Edit Financial Profile</span>
          </NavLink>
          {scoreData && (
            <div class={`px-3 py-1.5 rounded-full text-xs font-bold ${getBadgeColor(scoreData.category)}`}>
              {scoreData.category} Status
            </div>
          )}
        </div>
      </div>

      {/* Highlighted Advisor Cards */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Most Important Metric */}
          {(() => {
            const mim = getMostImportantMetric(metrics, scoreData);
            if (!mim) return null;
            return (
              <div className="bg-brand-card border border-emerald-500/20 p-6 rounded-2xl shadow-glow-primary flex flex-col justify-between space-y-4">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-xs uppercase tracking-wider">
                  <Target size={16} />
                  <span>Most Important Metric</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">{mim.title}</span>
                    <span className="text-3xl font-black text-white tracking-tight">{mim.value}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Status:</span>
                    <span className="text-xs font-bold text-rose-450 bg-rose-500/10 px-2 py-0.5 rounded-full">{mim.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Next Target:</span>
                    <span className="text-xs font-bold text-brand-primary bg-emerald-500/10 px-2 py-0.5 rounded-full">Score {mim.nextTarget}</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-800 text-xs">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Required Action</span>
                  <p className="text-slate-200 font-bold mt-1">{mim.requiredAction}</p>
                </div>
              </div>
            );
          })()}

          {/* Today's Actions */}
          <div className="bg-brand-card border border-indigo-500/20 p-6 rounded-2xl shadow-glow-secondary flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 size={16} />
                <span>Today's Actions</span>
              </div>
              <span className="text-[9px] text-slate-500 font-bold">Based on actual user data</span>
            </div>
            <div className="space-y-3 flex-1">
              {getTodayActions(metrics, scoreData).map((act, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2.5">
                    {act.done ? (
                      <CheckCircle2 className="text-brand-primary shrink-0" size={14} />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-650 shrink-0" />
                    )}
                    <span className={act.done ? "text-slate-500 line-through font-medium" : "text-slate-200 font-medium"}>
                      {act.text}
                    </span>
                  </div>
                  {act.link && !act.done && (
                    <NavLink to={act.link} className="text-indigo-400 hover:text-indigo-300 text-[10px] font-bold">
                      Go &rarr;
                    </NavLink>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={getTranslation(lang, 'recoveryScore')}
          value={scoreData ? `${scoreData.score} / 100` : 'N/A'}
          icon={Award}
          colorClass={scoreData ? getScoreColorClass(scoreData.category) : "text-brand-primary bg-emerald-500/10"}
          trend={scoreData?.category}
          onExplain={() => setExplainType('RECOVERY_SCORE')}
          sourceText="Declared in Profile & Loans"
          sourceLink="/settings/profile"
        />
        <StatCard
          title={getTranslation(lang, 'totalDebt')}
          value={metrics ? `Rs. ${metrics.totalDebt.toLocaleString()}` : 'Rs. 0'}
          icon={Landmark}
          colorClass="text-brand-secondary bg-indigo-500/10"
          trend={metrics?.totalLoans > 0 ? `${metrics.totalLoans} Active Accounts` : 'Debt-Free'}
          trendType={metrics?.totalDebt > 0 ? "down" : "up"}
          onExplain={() => setExplainType('TOTAL_DEBT')}
          sourceText="Originated in Loans Ledger"
          sourceLink="/loans"
        />
        <StatCard
          title={getTranslation(lang, 'income')}
          value={metrics ? `Rs. ${metrics.monthlyIncome.toLocaleString()}` : 'Rs. 0'}
          icon={TrendingUp}
          colorClass="text-emerald-400 bg-emerald-500/10"
          onExplain={() => setExplainType('INCOME')}
          sourceText="Originated in Financial Profile"
          sourceLink="/settings/profile"
        />
        <StatCard
          title="Actual Surplus"
          value={metrics ? `Rs. ${(metrics.actualSurplus ?? metrics.availableMonthlySurplus).toLocaleString()}` : 'Rs. 0'}
          icon={Wallet}
          colorClass={(metrics?.actualSurplus ?? metrics?.availableMonthlySurplus) >= 0 ? "text-cyan-400 bg-cyan-500/10" : "text-rose-400 bg-rose-500/10"}
          trend={(metrics?.actualSurplus ?? metrics?.availableMonthlySurplus) >= 0 ? 'Based on Paid Expenses' : 'Cash Deficit'}
          trendType={(metrics?.actualSurplus ?? metrics?.availableMonthlySurplus) >= 0 ? "up" : "down"}
          onExplain={() => setExplainType('SURPLUS')}
          sourceText="Originated in Profile & Ledger"
          sourceLink="/expenses"
        />
      </div>

      {/* Explain Dashboard Panel */}
      {explainDashboard && metrics && (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl animate-fade-in text-[11px] font-semibold leading-relaxed text-indigo-300">
          <div class="space-y-2">
            <h5 class="font-extrabold text-white uppercase tracking-wider text-[10px]">Recovery Score Explanation</h5>
            <div><strong>Source:</strong> Profile parameters, active loan EMIs, and payment logs</div>
            <div><strong>Formula:</strong> Points sum across DTI, Savings, Emergency buffer, Loan counts, EMI burden, Compliance, Surplus ratio</div>
            <div><strong>Math Calculation:</strong> {scoreData ? `${scoreData.factors.debtToIncomeRatio.score} + ${scoreData.factors.savingsRatio.score} + ${scoreData.factors.emergencyFundMonths.score} + ${scoreData.factors.loanCount.score} + ${scoreData.factors.emiBurdenRatio.score} + ${scoreData.factors.paymentCompliance.score} + ${scoreData.factors.surplusRatio.score} = ${scoreData.score} / 100` : 'N/A'}</div>
          </div>
          <div class="space-y-2">
            <h5 class="font-extrabold text-white uppercase tracking-wider text-[10px]">Total Debt Explanation</h5>
            <div><strong>Source:</strong> Active Loans Ledger</div>
            <div><strong>Formula:</strong> Sum of active loan outstanding balances</div>
            <div><strong>Math Calculation:</strong> Sum of remaining amounts = Rs. {metrics.totalDebt.toLocaleString()}</div>
          </div>
          <div class="space-y-2">
            <h5 class="font-extrabold text-white uppercase tracking-wider text-[10px]">Income Explanation</h5>
            <div><strong>Source:</strong> Financial Profile setting</div>
            <div><strong>Formula:</strong> Direct Profile Parameter</div>
            <div><strong>Math Calculation:</strong> Declared Income = Rs. {metrics.monthlyIncome.toLocaleString()}</div>
          </div>
          <div class="space-y-2">
            <h5 class="font-extrabold text-white uppercase tracking-wider text-[10px]">Actual Surplus Explanation</h5>
            <div><strong>Source:</strong> Income, Paid Expenses (This Month) & EMIs</div>
            <div><strong>Formula:</strong> Income - Paid Expenses (This Month) - EMIs</div>
            <div><strong>Math Calculation:</strong> {metrics.monthlyIncome} - {metrics.expenseStatus.actualPaidTotal} - {metrics.totalEMI} = Rs. {metrics.actualSurplus.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Expense Status Summary Strip */}
      {metrics?.expenseStatus && (
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-brand-card border border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">✅ Paid Expenses</p>
              <p class="text-sm font-black text-emerald-400 mt-0.5">Rs. {metrics.expenseStatus.actualPaidTotal?.toLocaleString()}</p>
            </div>
            <span class="text-[10px] font-bold text-slate-500">{metrics.expenseStatus.paidCount} paid</span>
          </div>
          <div class="bg-brand-card border border-amber-500/20 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">⏳ Pending</p>
              <p class="text-sm font-black text-amber-400 mt-0.5">Rs. {metrics.expenseStatus.pendingObligations?.toLocaleString()}</p>
            </div>
            <span class="text-[10px] font-bold text-slate-500">{metrics.expenseStatus.pendingCount} upcoming</span>
          </div>
          <div class="bg-brand-card border border-rose-500/20 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">🔴 Overdue</p>
              <p class="text-sm font-black text-rose-400 mt-0.5">Rs. {metrics.expenseStatus.overdueObligations?.toLocaleString()}</p>
            </div>
            <span class="text-[10px] font-bold text-slate-500">{metrics.expenseStatus.overdueCount} unpaid</span>
          </div>
        </div>
      )}

      {/* Main Charts & History section */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Debt Trend Chart */}
        <div class="bg-brand-card border border-slate-800/80 p-6 rounded-2xl lg:col-span-2 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-white uppercase tracking-wider">{getTranslation(lang, 'totalDebt')} Reduction Trend</h3>
              <p class="text-[11px] text-brand-muted font-medium">Monthly historical outstanding balance progress.</p>
            </div>
            <button
              onClick={() => setShowChartInfo(!showChartInfo)}
              class="text-xs text-brand-primary hover:text-emerald-400 flex items-center gap-1 font-bold cursor-pointer"
            >
              <HelpCircle size={13} />
              <span>What does this graph mean?</span>
            </button>
          </div>

          {showChartInfo && (
            <div class="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-xs space-y-2 leading-relaxed text-slate-300 animate-fade-in">
              <p><strong>📊 Data Source:</strong> Reconstructed historical loan registers and payment history archives.</p>
              <p><strong>🧮 Calculation Method:</strong> Outstanding balance is computed at each month's end by taking the original loan principal and subtracting the cumulative payments paid on or before that month's date.</p>
              <p><strong>💡 Interpretation:</strong> A downward slope indicates steady principal depletion. Accelerated payments (Avalanche/Snowball strategy extra amounts) bend this curve downward much faster, reducing interest compounding.</p>
            </div>
          )}

          <div class="h-64 mt-4 text-xs font-semibold">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748B" />
                  <YAxis stroke="#64748B" tickFormatter={(v) => `Rs.${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#1E293B', borderRadius: '12px' }} 
                    labelStyle={{ color: '#94A3B8', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="debt" name="Total Balance" stroke="#6366F1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDebt)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div class="h-full flex items-center justify-center text-slate-500 font-medium">
                No historical payment entries found. Start paying off loans to see trends.
              </div>
            )}
          </div>
        </div>

        {/* Profile Stats Summary Panel */}
        <div class="bg-brand-card border border-slate-800/80 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">Financial Context</h3>
            <p class="text-[11px] text-brand-muted font-medium mb-6">Profile metrics details & ratios.</p>

            <div class="space-y-4">
              <div class="flex items-center justify-between py-2.5 border-b border-slate-800/60 text-xs">
                <span class="text-slate-400 font-medium">{getTranslation(lang, 'outflow')} (Excl. EMIs)</span>
                <span class="text-white font-bold">Rs. {metrics?.monthlyExpenses.toLocaleString() || '0'}</span>
              </div>
              <div class="flex items-center justify-between py-2.5 border-b border-slate-800/60 text-xs">
                <span class="text-slate-400 font-medium">Savings Balance</span>
                <span class="text-white font-bold">Rs. {metrics?.savings.toLocaleString() || '0'}</span>
              </div>
              <div class="flex items-center justify-between py-2.5 border-b border-slate-800/60 text-xs">
                <span class="text-slate-400 font-medium flex items-center gap-1">
                  Emergency Fund Cushion
                  <button onClick={() => setExplainType('EMERGENCY_FUND')} class="text-brand-primary hover:text-emerald-400 bg-transparent border-none p-0 cursor-pointer">
                    <AlertCircle size={12} />
                  </button>
                </span>
                <span class="text-white font-bold">Rs. {metrics?.emergencyFund.toLocaleString() || '0'}</span>
              </div>
              <div class="flex items-center justify-between py-2.5 border-b border-slate-800/60 text-xs">
                <span class="text-slate-400 font-medium flex items-center gap-1">
                  Debt-to-Income (DTI) Ratio
                  <button onClick={() => setExplainType('DTI')} class="text-brand-primary hover:text-emerald-400 bg-transparent border-none p-0 cursor-pointer">
                    <AlertCircle size={12} />
                  </button>
                </span>
                <span class="text-brand-primary font-extrabold">{metrics?.debtToIncomeRatio.toFixed(1) || '0'}%</span>
              </div>
            </div>
          </div>

          {scoreData && (
            <div class="mt-6 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3 text-xs leading-relaxed text-slate-300 animate-fade-in">
              <FileCheck2 size={16} class="text-brand-primary shrink-0 mt-0.5" />
              <div>
                <span class="font-bold text-white">Suggestions: </span>
                {scoreData.improvementSuggestions[0] || 'Maintain your current budget.'}
              </div>
            </div>
          )}
        </div>

        {/* AI Coaching Summary Widget */}
        {aiSummary.count > 0 && (
          <div class="bg-brand-card border border-slate-800/80 p-6 rounded-2xl flex flex-col justify-between space-y-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div>
                <h3 class="text-sm font-bold text-white uppercase tracking-wider">AI Coaching</h3>
                <p class="text-[10px] text-brand-muted">Your advisory summary</p>
              </div>
            </div>
            <div class="space-y-3">
              <div class="flex items-center justify-between py-2 border-b border-slate-800/60 text-xs">
                <span class="text-slate-400 font-medium flex items-center gap-1.5"><MessageSquare size={11} /> Questions Asked</span>
                <span class="text-white font-bold">{aiSummary.count}</span>
              </div>
              <div class="flex items-center justify-between py-2 border-b border-slate-800/60 text-xs">
                <span class="text-slate-400 font-medium">Last Consultation</span>
                <span class="text-brand-primary font-bold">
                  {aiSummary.lastDate
                    ? (() => {
                        const diff = Math.floor((Date.now() - new Date(aiSummary.lastDate)) / 1000);
                        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
                        return `${Math.floor(diff / 86400)}d ago`;
                      })()
                    : 'Never'}
                </span>
              </div>
              <div class="flex items-center justify-between py-2 text-xs">
                <span class="text-slate-400 font-medium">Top Topic</span>
                <span class="text-indigo-400 font-bold text-[10px]">
                  {(aiSummary.topIntent || 'GENERAL').replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Visual Milestones */}
      {metrics && (
        <div className="bg-brand-card border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <Award size={16} />
            <span>Financial Milestones Progress</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {getMilestones(metrics, scoreData).map((ms, idx) => (
              <div key={idx} className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 transition-all ${
                ms.achieved 
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400 shadow-glow-primary" 
                  : "bg-slate-900/30 border-slate-800/80 text-slate-500"
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Milestone {idx + 1}</span>
                  {ms.achieved ? (
                    <CheckCircle2 size={12} className="text-brand-primary" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full border border-slate-700" />
                  )}
                </div>
                <div>
                  <p className={`text-xs font-bold ${ms.achieved ? "text-slate-200" : "text-slate-500"}`}>{ms.name}</p>
                  <p className="text-[10px] font-mono mt-0.5">{ms.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Coach InsightCard */}
      {metrics && (
        <InsightCard 
          title="Dashboard Insights & Summary"
          problem={
            metrics.debtToIncomeRatio > 45 
              ? `Your DTI is at ${metrics.debtToIncomeRatio.toFixed(1)}% which is above the high-risk limit of 45%.`
              : metrics.expenseStatus?.overdueObligations > 0
                ? `You have active overdue bills of ₹${metrics.expenseStatus.overdueObligations.toLocaleString()} in your ledger.`
                : null
          }
          whyItMatters="Unmanaged variables drag down your Recovery Score and increase compound interest burden, slowing down your wealth progression."
          recommendedAction="Focus on Today's Actions, keep your payment compliance above 95%, and review your Audit Report to trace exact scoring algorithms."
          expectedBenefit="Maximizes compound savings, prevents late penalties, and elevates your overall score status."
        />
      )}


      {/* Onboarding Dialog Modal */}
      {profileModal && (
        <div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-center items-center px-4 select-none animate-fade-in">
          <div class="max-w-md w-full bg-brand-card border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl relative">
            <div class="text-center space-y-2">
              <div class="mx-auto w-12 h-12 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center mb-2">
                <BadgeAlert size={24} />
              </div>
              <h2 class="text-xl font-black text-white">Initialize Financial Profile</h2>
              <p class="text-xs text-brand-muted font-medium">
                To start tracking loans, budgets, and scoring risk, please enter your current monthly financials.
              </p>
            </div>

            {errorMsg && (
              <div class="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-start gap-3 text-xs font-semibold leading-relaxed">
                <AlertCircle size={16} class="shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Monthly Income</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="80000"
                    value={incomeInput}
                    onChange={(e) => setIncomeInput(e.target.value)}
                    class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-medium"
                  />
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Monthly Expenses</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="30000"
                    value={expensesInput}
                    onChange={(e) => setExpensesInput(e.target.value)}
                    class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-medium"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Savings Balance</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="25000"
                    value={savingsInput}
                    onChange={(e) => setSavingsInput(e.target.value)}
                    class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-medium"
                  />
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Emergency Fund</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="120000"
                    value={emergencyInput}
                    onChange={(e) => setEmergencyInput(e.target.value)}
                    class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Dependents count</label>
                <input
                  type="number"
                  min="0"
                  placeholder="2"
                  value={dependentsInput}
                  onChange={(e) => setDependentsInput(e.target.value)}
                  class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-medium"
                />
              </div>

              <button
                type="submit"
                class="w-full bg-brand-primary hover:bg-emerald-600 transition-colors text-black font-bold text-sm py-3 rounded-xl cursor-pointer"
              >
                Submit Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Calculation Explain Modal ────────────────────────────────────── */}
      {explainType && (
        <ExplainModal
          metricType={explainType}
          data={{
            metrics,
            scoreData,
            totalEMI: metrics?.totalEMI || 0,
            monthlyIncome: metrics?.monthlyIncome || 0,
            emergencyFund: metrics?.emergencyFund || 0,
            monthlyExpenses: metrics?.monthlyExpenses || 0,
            expenseStatus: metrics?.expenseStatus || {}
          }}
          onClose={() => setExplainType(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
