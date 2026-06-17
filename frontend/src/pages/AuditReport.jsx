import React, { useContext, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getTranslation } from '../services/localizer';
import apiService from '../services/apiService';
import SkeletonScreen from '../components/SkeletonScreen';
import { 
  FileCheck2, 
  HelpCircle, 
  Info, 
  TrendingUp, 
  Wallet, 
  Award, 
  Landmark, 
  AlertCircle, 
  ArrowDownCircle, 
  BookOpen, 
  Calculator, 
  Download,
  Database,
  History,
  Activity,
  ArrowRight
} from 'lucide-react';

const AuditReport = () => {
  const { user } = useContext(AuthContext);
  const lang = user?.preferredLanguage || 'en';

  const [metrics, setMetrics] = useState(null);
  const [scoreData, setScoreData] = useState(null);
  const [loans, setLoans] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [beginnerMode, setBeginnerMode] = useState(false);

  useEffect(() => {
    const fetchAuditData = async () => {
      setLoading(true);
      try {
        const metricRes = await apiService.dashboard.getMetrics();
        setMetrics(metricRes.data);

        if (metricRes.data.hasFinancialProfile) {
          const scoreRes = await apiService.recoveryScore.get();
          setScoreData(scoreRes.data);
        }

        const loansRes = await apiService.loans.getAll();
        setLoans(loansRes.data.filter(l => l.status === 'Active'));

        const expensesRes = await apiService.expenses.getAll();
        setExpenses(expensesRes.data);

        try {
          const profileRes = await apiService.profile.get();
          if (profileRes.success) {
            setProfile(profileRes.data);
          }
        } catch (e) {
          console.warn('Failed to fetch profile for audit logging.', e);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to load audit calculations.');
      } finally {
        setLoading(false);
      }
    };
    fetchAuditData();
  }, []);

  const handleDownloadPdf = () => {
    const token = localStorage.getItem('token');
    window.open(`/api/bonus/report/pdf?token=${token}`, '_blank');
  };

  if (loading) return <SkeletonScreen.Table rows={8} />;

  if (errorMsg) {
    return (
      <div class="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex gap-3 text-xs font-semibold select-none">
        <AlertCircle size={16} class="shrink-0" />
        <span>{errorMsg}</span>
      </div>
    );
  }

  // Calculations
  const income = metrics?.monthlyIncome || 0;
  const totalEMIs = metrics?.totalEMI || 0;
  const profileExpenses = metrics?.monthlyExpenses || 0;
  const totalDebt = metrics?.totalDebt || 0;
  
  // Paid expenses in current month
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  
  const currentMonthPaidExpensesList = expenses.filter(e => {
    if (e.paymentStatus !== 'Paid') return false;
    const d = e.paidDate ? new Date(e.paidDate) : new Date(e.date);
    return d >= currentMonthStart && d <= currentMonthEnd;
  });
  
  const currentMonthPaidTotal = currentMonthPaidExpensesList.reduce((s, e) => s + e.amount, 0);
  const actualSurplus = income - currentMonthPaidTotal - totalEMIs;
  const potentialSurplus = actualSurplus - expenses.filter(e => e.paymentStatus === 'Pending').reduce((s, e) => s + e.amount, 0) - expenses.filter(e => e.paymentStatus === 'Overdue').reduce((s, e) => s + e.amount, 0);
  const dtiVal = income > 0 ? (totalEMIs / income) * 100 : 0;

  // Timestamps for collection details
  const profileUpdatedAt = profile?.updatedAt ? new Date(profile.updatedAt).toLocaleString('en-IN') : 'N/A';
  const lastLoanUpdatedAt = loans.length > 0 
    ? new Date(Math.max(...loans.map(l => new Date(l.updatedAt || l.createdAt)))).toLocaleString('en-IN')
    : 'N/A';
  const lastExpenseUpdatedAt = expenses.length > 0
    ? new Date(Math.max(...expenses.map(e => new Date(e.updatedAt || e.createdAt)))).toLocaleString('en-IN')
    : 'N/A';

  return (
    <div class="space-y-8 select-none font-sans leading-relaxed text-slate-300 pb-12">
      {/* Title Header */}
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 class="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <FileCheck2 class="text-indigo-400" size={24} />
            Financial Debug Console
          </h1>
          <p class="text-xs text-brand-muted font-medium mt-0.5">
            Transparent workspace for compiling data structures, verifying audit flows, mapping dependencies, and math compliance.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button
            onClick={() => setBeginnerMode(!beginnerMode)}
            className={`font-bold text-xs px-4 py-3 rounded-xl transition-all border cursor-pointer flex items-center gap-2 ${
              beginnerMode 
                ? 'bg-brand-primary text-black border-brand-primary shadow-glow-primary' 
                : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
            }`}
          >
            <span>{beginnerMode ? "Expert Debug Mode" : "Explain Like I'm Not a Finance Expert"}</span>
          </button>
          <NavLink
            to="/settings/profile"
            class="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all border border-slate-700 cursor-pointer flex items-center gap-2"
          >
            <span>Edit Financial Profile</span>
          </NavLink>
          <button
            onClick={handleDownloadPdf}
            class="bg-brand-primary text-black font-bold text-xs px-4 py-3 rounded-xl flex items-center gap-2 hover:bg-emerald-600 cursor-pointer shadow-glow-primary transition-all active:scale-[0.98]"
          >
            <Download size={14} /> Download PDF Audit
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Dependencies, Math & Registers */}
        <div class="lg:col-span-2 space-y-6">
          
          {/* Visual Module Dependency Map */}
          <div class="bg-brand-card border border-slate-800/80 p-6 rounded-2xl space-y-4 shadow-xl">
            <div class="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-3">
              <Activity size={16} class="text-indigo-400" />
              <span>Platform Module Dependencies & Data Flows</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs relative">
              {/* Inputs register */}
              <div class="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl space-y-3">
                <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">1. Declared Registers</span>
                <div class="space-y-2 text-slate-300 font-semibold">
                  <div class="bg-slate-950/40 p-2 rounded border border-slate-900 flex justify-between items-center">
                    <span>Income Profile</span>
                    <span class="text-[10px] text-indigo-400 font-mono">Sourced</span>
                  </div>
                  <div class="bg-slate-950/40 p-2 rounded border border-slate-900 flex justify-between items-center">
                    <span>Active Loan EMIs</span>
                    <span class="text-[10px] text-indigo-400 font-mono">Sourced</span>
                  </div>
                  <div class="bg-slate-950/40 p-2 rounded border border-slate-900 flex justify-between items-center">
                    <span>Payment Statuses</span>
                    <span class="text-[10px] text-indigo-400 font-mono">Sourced</span>
                  </div>
                </div>
              </div>

              {/* Engine compilation */}
              <div class="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl space-y-3 flex flex-col justify-between">
                <div>
                  <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-3">2. Processing Engines</span>
                  <div class="space-y-2 text-slate-300 font-semibold">
                    <div class="bg-slate-950/40 p-2 rounded border border-slate-900 flex items-center justify-between">
                      <span>DTI Engine</span>
                      <ArrowRight size={10} class="text-slate-600" />
                    </div>
                    <div class="bg-slate-950/40 p-2 rounded border border-slate-900 flex items-center justify-between">
                      <span>Surplus Engine</span>
                      <ArrowRight size={10} class="text-slate-600" />
                    </div>
                    <div class="bg-slate-950/40 p-2 rounded border border-slate-900 flex items-center justify-between">
                      <span>Scoring Processor</span>
                      <ArrowRight size={10} class="text-slate-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Outputs */}
              <div class="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl space-y-3">
                <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">3. Platform Outputs</span>
                <div class="space-y-2 text-slate-300 font-semibold">
                  <div class="bg-slate-950/40 p-2 rounded border border-emerald-950/50 text-brand-primary flex justify-between items-center">
                    <span>Recovery Score</span>
                    <span class="text-[9px] bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono font-extrabold">{scoreData?.score || 'N/A'}</span>
                  </div>
                  <div class="bg-slate-950/40 p-2 rounded border border-purple-950/50 text-purple-300 flex justify-between items-center">
                    <span>Payoff Forecast</span>
                    <span class="text-[10px] text-slate-500 font-mono">Simulated</span>
                  </div>
                  <div class="bg-slate-950/40 p-2 rounded border border-cyan-950/50 text-cyan-300 flex justify-between items-center">
                    <span>AI Coach context</span>
                    <span class="text-[10px] text-slate-500 font-mono">Injected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Inputs Audit */}
          <div class="bg-brand-card border border-slate-800/80 p-6 rounded-2xl space-y-4 shadow-xl">
            <div class="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-3">
              <BookOpen size={16} class="text-indigo-400" />
              <span>Raw Register Sourcing & Account Parameters</span>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div class="space-y-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
                <h3 class="font-extrabold text-white text-[10px] uppercase tracking-wider text-brand-primary">Financial Profile Declarations</h3>
                <div class="space-y-2 font-medium">
                  <div class="flex justify-between border-b border-slate-800 pb-1.5">
                    <span class="text-slate-400">Monthly Income</span>
                    <span class="text-white font-bold">Rs. {income.toLocaleString()}</span>
                  </div>
                  <div class="flex justify-between border-b border-slate-800 pb-1.5">
                    <span class="text-slate-400">Lifestyle Expenses</span>
                    <span class="text-white font-bold">Rs. {profileExpenses.toLocaleString()}</span>
                  </div>
                  <div class="flex justify-between border-b border-slate-800 pb-1.5">
                    <span class="text-slate-400">Savings Cushion</span>
                    <span class="text-white font-bold">Rs. {metrics?.savings?.toLocaleString() || 0}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Emergency Balance</span>
                    <span class="text-white font-bold">Rs. {metrics?.emergencyFund?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>

              <div class="space-y-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
                <h3 class="font-extrabold text-white text-[10px] uppercase tracking-wider text-indigo-400">Ledger aggregations</h3>
                <div class="space-y-2 font-medium">
                  <div class="flex justify-between border-b border-slate-800 pb-1.5">
                    <span class="text-slate-400">Active Debt Accounts</span>
                    <span class="text-white font-bold">{loans.length} Accounts</span>
                  </div>
                  <div class="flex justify-between border-b border-slate-800 pb-1.5">
                    <span class="text-slate-400">Total EMIs Commitment</span>
                    <span class="text-white font-bold">Rs. {totalEMIs.toLocaleString()}/month</span>
                  </div>
                  <div class="flex justify-between border-b border-slate-800 pb-1.5">
                    <span class="text-slate-400">Confirmed Paid Transactions</span>
                    <span class="text-emerald-400 font-bold">Rs. {currentMonthPaidTotal.toLocaleString()}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Ledger Debt Outstanding</span>
                    <span class="text-white font-bold">Rs. {totalDebt.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* List of active loans */}
            <div class="space-y-2.5 pt-2">
              <h4 class="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Active Debt Registry</h4>
              <div class="overflow-x-auto border border-slate-800/60 rounded-xl">
                <table class="w-full text-left text-xs font-semibold">
                  <thead class="bg-slate-900/60 text-[9px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                    <tr>
                      <th class="py-2.5 px-3">Loan Name</th>
                      <th class="py-2.5 px-3">Type</th>
                      <th class="py-2.5 px-3 text-right">Principal</th>
                      <th class="py-2.5 px-3 text-right">Outstanding</th>
                      <th class="py-2.5 px-3 text-center">Interest</th>
                      <th class="py-2.5 px-3 text-right">EMI</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800/40 text-slate-300">
                    {loans.map(l => (
                      <tr key={l._id} class="hover:bg-slate-900/20">
                        <td class="py-2.5 px-3 text-white font-bold">{l.loanName}</td>
                        <td class="py-2.5 px-3 text-slate-400 text-[10px]">{l.loanType}</td>
                        <td class="py-2.5 px-3 text-right">Rs. {l.principalAmount.toLocaleString()}</td>
                        <td class="py-2.5 px-3 text-right text-indigo-300">Rs. {l.remainingAmount.toLocaleString()}</td>
                        <td class="py-2.5 px-3 text-center text-amber-400">{l.interestRate}%</td>
                        <td class="py-2.5 px-3 text-right font-extrabold">Rs. {l.emi.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 2: Math and Formulas Calculations */}
          <div class="bg-brand-card border border-slate-800/80 p-6 rounded-2xl space-y-6 shadow-xl">
            <div class="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-3">
              <Calculator size={16} class="text-indigo-400" />
              <span>Mathematical Calculations & Equation Audits</span>
            </div>

            {beginnerMode ? (
              <div className="space-y-6 animate-fade-in text-xs font-semibold leading-relaxed">
                {/* DTI Calculation */}
                <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                    <h3 className="font-black text-xs text-white">Debt-To-Income (DTI)</h3>
                    <span className="text-xs text-rose-400 font-bold">{dtiVal.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Formula</span>
                    <span className="font-mono text-slate-300">Total EMIs &divide; Income</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Meaning</span>
                    <p className="text-slate-400 font-medium">How much of your take-home monthly income is already committed to loan payments.</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Your Value</span>
                    <p className="text-slate-200">You spend ₹{totalEMIs.toLocaleString()} out of ₹{income.toLocaleString()} take-home income on EMIs.</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Recommendation</span>
                    <p className="text-brand-primary">Below 35% is ideal. Try reducing EMI burden by paying down high-interest liabilities.</p>
                  </div>
                </div>

                {/* Surplus Calculation */}
                <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                    <h3 className="font-black text-xs text-white">Monthly Cash Surplus</h3>
                    <span className="text-xs text-emerald-400 font-bold">₹{actualSurplus.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Formula</span>
                    <span className="font-mono text-slate-300">Income &minus; Lifestyle Expenses (This Month) &minus; Total EMIs</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Meaning</span>
                    <p className="text-slate-400 font-medium">The leftover cash you have at month-end to save, build cushions, or invest.</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Your Value</span>
                    <p className="text-slate-200">You have ₹{actualSurplus.toLocaleString()} surplus leftover in your wallet.</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Recommendation</span>
                    <p className="text-brand-primary">Always keep surplus positive. funnel at least 50% to your emergency shield.</p>
                  </div>
                </div>

                {/* Recovery Score Factor Weights */}
                {scoreData && (
                  <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                      <h3 className="font-black text-xs text-white">Recovery Score Factors</h3>
                      <span className="text-xs text-brand-primary font-bold">{scoreData.score} / 100</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Formula</span>
                      <p className="text-slate-350 font-medium font-mono">DTI Ratio + Savings Ratio + Emergency Cushion + Loan Count + EMI Burden + Compliance + Surplus Ratio</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Meaning</span>
                      <p className="text-slate-400 font-medium">How safe/resilient your budgeting and debt situation is from crises.</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Your Value</span>
                      <p className="text-slate-200">Your current Score is {scoreData.score} ({scoreData.category}).</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Recommendation</span>
                      <p className="text-brand-primary">Target a score above 70 by increasing emergency reserves and maintaining high bill compliance.</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* DTI Calculation */}
                <div class="space-y-3 p-4 bg-slate-900/40 rounded-xl border border-slate-800/50">
                  <div class="flex justify-between items-center">
                    <h3 class="font-black text-xs text-white">A. Debt-To-Income (DTI) Logic</h3>
                    <span class="text-xs text-brand-primary font-bold">{dtiVal.toFixed(1)}% Ratio</span>
                  </div>
                  <div class="text-xs space-y-2">
                    <p class="text-slate-400">The DTI ratio represents the portion of monthly gross income consumed by minimum loan payments.</p>
                    <div class="bg-slate-950/40 border border-slate-800/80 p-3 rounded-lg font-mono text-[10px] leading-relaxed text-indigo-300">
                      <div class="text-slate-500">// Mathematical Formula</div>
                      DTI = (Total Monthly EMIs &divide; Monthly Income) &times; 100
                      <br />
                      <br />
                      <div class="text-slate-500">// Numerical Audit</div>
                      Total Monthly EMIs = Rs. {totalEMIs.toLocaleString()}
                      <br />
                      Monthly Income = Rs. {income.toLocaleString()}
                      <br />
                      Math = ({totalEMIs} &divide; {income}) &times; 100
                      <br />
                      Result = {dtiVal.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Surplus Calculation */}
                <div class="space-y-3 p-4 bg-slate-900/40 rounded-xl border border-slate-800/50">
                  <div class="flex justify-between items-center">
                    <h3 class="font-black text-xs text-white">B. Monthly Actual Surplus Equation</h3>
                    <span class="text-xs text-emerald-400 font-bold">Rs. {actualSurplus.toLocaleString()} Surplus</span>
                  </div>
                  <div class="text-xs space-y-2">
                    <p class="text-slate-400">Actual Surplus evaluates liquid disposable cash after subtracting confirmed Paid expenses (ledger) and EMIs from income.</p>
                    <div class="bg-slate-950/40 border border-slate-800/80 p-3 rounded-lg font-mono text-[10px] leading-relaxed text-emerald-300">
                      <div class="text-slate-500">// Mathematical Formula</div>
                      Actual Surplus = Income &minus; Paid Expenses (This Month) &minus; Total EMIs
                      <br />
                      <br />
                      <div class="text-slate-500">// Numerical Audit</div>
                      Income = Rs. {income.toLocaleString()}
                      <br />
                      Paid Expenses = Rs. {currentMonthPaidTotal.toLocaleString()}
                      <br />
                      Total EMIs = Rs. {totalEMIs.toLocaleString()}
                      <br />
                      Math = {income} &minus; {currentMonthPaidTotal} &minus; {totalEMIs}
                      <br />
                      Result = Rs. {actualSurplus.toLocaleString()}
                    </div>
                    <div class="space-y-1.5 text-[10px] font-bold mt-1 text-slate-400">
                      <p class="font-sans">• <span class="text-white">Traditional Surplus:</span> Rs. {metrics?.availableMonthlySurplus?.toLocaleString()} (assumes standard profile expense of Rs. {profileExpenses.toLocaleString()})</p>
                      <p class="font-sans">• <span class="text-white">Potential Surplus:</span> Rs. {potentialSurplus.toLocaleString()} (residual if you clear all Pending & Overdue bills)</p>
                    </div>
                  </div>
                </div>

                {/* Recovery Score Factor Weights */}
                {scoreData && (
                  <div class="space-y-3 p-4 bg-slate-900/40 rounded-xl border border-slate-800/50">
                    <h3 class="font-black text-xs text-white">C. Recovery Score Weights & Audit (Score: {scoreData.score}/100)</h3>
                    <div class="text-xs space-y-2">
                      <p class="text-slate-400">Calculated as the sum of 7 distinct risk variables. Total potential points = 100.</p>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] leading-relaxed">
                        <div class="space-y-1 bg-slate-950/30 p-2.5 rounded border border-slate-800/40 font-mono">
                          <p class="text-white font-bold font-sans">1. DTI Ratio Factor (Max 20 pts)</p>
                          <p class="text-slate-500">Value: {scoreData.factors.debtToIncomeRatio.value}% &rarr; Score: <span class="text-brand-primary font-bold">{scoreData.factors.debtToIncomeRatio.score} / 20</span></p>
                          
                          <p class="text-white font-bold mt-2 font-sans">2. Savings Ratio Factor (Max 15 pts)</p>
                          <p class="text-slate-500">Value: {scoreData.factors.savingsRatio.value}% &rarr; Score: <span class="text-brand-primary font-bold">{scoreData.factors.savingsRatio.score} / 15</span></p>

                          <p class="text-white font-bold mt-2 font-sans">3. Emergency Cushion Factor (Max 15 pts)</p>
                          <p class="text-slate-500">Value: {scoreData.factors.emergencyFundMonths.value} mos &rarr; Score: <span class="text-brand-primary font-bold">{scoreData.factors.emergencyFundMonths.score} / 15</span></p>
                          
                          <p class="text-white font-bold mt-2 font-sans">4. Active Loans Count Factor (Max 10 pts)</p>
                          <p class="text-slate-500">Value: {scoreData.factors.loanCount.value} loans &rarr; Score: <span class="text-brand-primary font-bold">{scoreData.factors.loanCount.score} / 10</span></p>
                        </div>
                        <div class="space-y-1 bg-slate-950/30 p-2.5 rounded border border-slate-800/40 font-mono">
                          <p class="text-white font-bold font-sans">5. EMI Burden Factor (Max 10 pts)</p>
                          <p class="text-slate-500">Value: {scoreData.factors.emiBurdenRatio.value}% &rarr; Score: <span class="text-brand-primary font-bold">{scoreData.factors.emiBurdenRatio.score} / 10</span></p>

                          <p class="text-white font-bold mt-2 font-sans">6. Payment Compliance Factor (Max 15 pts)</p>
                          <p class="text-slate-500">Value: {scoreData.factors.paymentCompliance.value}% &rarr; Score: <span class="text-brand-primary font-bold">{scoreData.factors.paymentCompliance.score} / 15</span></p>

                          <p class="text-white font-bold mt-2 font-sans">7. Cash Surplus Ratio Factor (Max 15 pts)</p>
                          <p class="text-slate-500">Value: {scoreData.factors.surplusRatio.value}% &rarr; Score: <span class="text-brand-primary font-bold">{scoreData.factors.surplusRatio.score} / 15</span></p>

                          <div class="pt-2 mt-2 border-t border-slate-800 font-bold text-slate-300">
                            Total Audit Math: {scoreData.factors.debtToIncomeRatio.score} + {scoreData.factors.savingsRatio.score} + {scoreData.factors.emergencyFundMonths.score} + {scoreData.factors.loanCount.score} + {scoreData.factors.emiBurdenRatio.score} + {scoreData.factors.paymentCompliance.score} + {scoreData.factors.surplusRatio.score} = <span class="text-emerald-400">{scoreData.score}/100</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right 1 Column: Database State & Profile Modifications Log */}
        <div class="space-y-6">
          
          {/* Database Sourced Timestamps */}
          <div class="bg-brand-card border border-slate-800/80 p-5 rounded-2xl space-y-4 shadow-xl">
            <div class="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-3">
              <Database size={16} class="text-brand-primary" />
              <span>Database Collection State</span>
            </div>
            
            <div class="space-y-3.5 text-xs font-semibold">
              <div class="p-2 rounded bg-slate-900/60 border border-slate-800/60 space-y-1">
                <span class="text-[9px] text-slate-500 uppercase tracking-widest font-extrabold block">FinancialProfile Collection</span>
                <div class="flex justify-between text-slate-300">
                  <span>Last Updated:</span>
                  <span class="text-white font-mono">{profileUpdatedAt}</span>
                </div>
              </div>

              <div class="p-2 rounded bg-slate-900/60 border border-slate-800/60 space-y-1">
                <span class="text-[9px] text-slate-500 uppercase tracking-widest font-extrabold block">Loan Collection</span>
                <div class="flex justify-between text-slate-300">
                  <span>Last Updated:</span>
                  <span class="text-white font-mono">{lastLoanUpdatedAt}</span>
                </div>
              </div>

              <div class="p-2 rounded bg-slate-900/60 border border-slate-800/60 space-y-1">
                <span class="text-[9px] text-slate-500 uppercase tracking-widest font-extrabold block">Expense Collection</span>
                <div class="flex justify-between text-slate-300">
                  <span>Last Updated:</span>
                  <span class="text-white font-mono">{lastExpenseUpdatedAt}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Audit Log Trail */}
          <div class="bg-brand-card border border-slate-800/80 p-5 rounded-2xl space-y-4 shadow-xl">
            <div class="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-3">
              <History size={16} class="text-indigo-400" />
              <span>Profile Update Log Trail</span>
            </div>

            <div class="max-h-72 overflow-y-auto space-y-3 pr-1">
              {profile?.auditTrail && profile.auditTrail.length > 0 ? (
                profile.auditTrail.slice().reverse().map((log, idx) => (
                  <div key={idx} class="p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-[11px] space-y-1.5 leading-relaxed">
                    <div class="flex justify-between text-[9px] text-slate-500 font-extrabold uppercase tracking-wide">
                      <span>{log.field} changed</span>
                      <span>{new Date(log.updatedAt || log.date).toLocaleDateString()}</span>
                    </div>
                    <div class="text-slate-300">
                      Changed from <span class="text-slate-400 font-bold">{log.previousValue}</span> to <span class="text-indigo-300 font-bold">{log.newValue}</span>
                    </div>
                    <div class="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60 mt-1">
                      <span>By: <span class="text-slate-300 font-semibold">{log.changedBy}</span></span>
                      <span class="italic">"{log.reason}"</span>
                    </div>
                  </div>
                ))
              ) : (
                <div class="py-8 text-center text-slate-500 text-xs font-semibold">
                  No profile modification logs recorded.
                </div>
              )}
            </div>
          </div>

          {/* Calculation Assumptions */}
          <div class="bg-brand-card border border-slate-800/80 p-5 rounded-2xl space-y-4 shadow-xl">
            <div class="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-3">
              <Info size={16} class="text-amber-400" />
              <span>Assumptions Guide</span>
            </div>
            <div class="text-[11px] text-slate-400 space-y-3 leading-relaxed font-semibold">
              <div>
                <p class="font-extrabold text-white">Separate Ledger vs Lifestyle Math</p>
                <p class="mt-0.5">Surplus calculations use manual confirmation of transaction statuses, not automated date decay.</p>
              </div>
              <div>
                <p class="font-extrabold text-white">Avalanche Repay Order</p>
                <p class="mt-0.5">Simulations assume extra capital goes to high-interest loans first, minimizing compounding multipliers.</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AuditReport;
