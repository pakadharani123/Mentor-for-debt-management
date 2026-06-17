import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getTranslation } from '../services/localizer';
import apiService from '../services/apiService';
import SkeletonScreen from '../components/SkeletonScreen';
import { 
  User, 
  TrendingUp, 
  Wallet, 
  AlertCircle, 
  CheckCircle2, 
  Globe, 
  Clock, 
  Calendar,
  History,
  Info,
  Award,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  Target
} from 'lucide-react';

const FinancialProfile = () => {
  const { user, updatePreferredLanguage } = useContext(AuthContext);
  const lang = user?.preferredLanguage || 'en';
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sourced active loan variables for local preview math
  const [totalEMI, setTotalEMI] = useState(0);
  const [loanCount, setLoanCount] = useState(0);
  const [compliancePct, setCompliancePct] = useState(100);

  // Form states
  const [incomeInput, setIncomeInput] = useState('');
  const [expensesInput, setExpensesInput] = useState('');
  const [savingsInput, setSavingsInput] = useState('');
  const [emergencyInput, setEmergencyInput] = useState('');
  const [dependentsInput, setDependentsInput] = useState('');
  const [riskPreference, setRiskPreference] = useState('Medium');
  const [employmentType, setEmploymentType] = useState('Salaried');
  const [salaryDate, setSalaryDate] = useState(1);
  const [financialGoals, setFinancialGoals] = useState('');
  const [updateReason, setUpdateReason] = useState('Profile update');
  const [languageInput, setLanguageInput] = useState('en');

  const fetchProfileAndLoans = async () => {
    setLoading(true);
    try {
      // 1. Fetch profile
      let loadedProfile = null;
      try {
        const res = await apiService.profile.get();
        if (res.success && res.data) {
          loadedProfile = res.data;
          setProfile(res.data);
          setIncomeInput(res.data.monthlyIncome.toString());
          setExpensesInput(res.data.monthlyExpenses.toString());
          setSavingsInput(res.data.savings.toString());
          setEmergencyInput(res.data.emergencyFund.toString());
          setDependentsInput((res.data.dependents || 0).toString());
          setRiskPreference(res.data.riskPreference || 'Medium');
          setEmploymentType(res.data.employmentType || 'Salaried');
          setSalaryDate(res.data.salaryDate || 1);
          setFinancialGoals(res.data.financialGoals || '');
          setLanguageInput(res.data.preferredLanguage || 'en');
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setProfile(null);
        } else {
          setErrorMsg('Failed to retrieve financial profile details.');
        }
      }

      // 2. Fetch loans metrics for preview math
      try {
        const loansRes = await apiService.loans.getAll();
        const active = loansRes.data.filter(l => l.status === 'Active');
        setLoanCount(active.length);
        setTotalEMI(active.reduce((sum, l) => sum + l.emi, 0));
      } catch (_e) {
        console.warn('Failed to load loans details for preview calculator.');
      }

      // 3. Fetch recovery score compliance percentage
      try {
        const scoreRes = await apiService.recoveryScore.get();
        if (scoreRes.success && scoreRes.data) {
          setCompliancePct(scoreRes.data.factors?.paymentCompliance?.value || 100);
        }
      } catch (_e) {
        console.warn('Failed to load compliance details for preview calculator.');
      }

    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to sync metrics from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndLoans();
  }, []);

  // ── Client-side Preview Calculator ─────────────────────────────────────────
  const calculatePreviewMetrics = () => {
    const inc = parseFloat(incomeInput) || 0;
    const exp = parseFloat(expensesInput) || 0;
    const sav = parseFloat(savingsInput) || 0;
    const ef = parseFloat(emergencyInput) || 0;

    // A. DTI Ratio
    const dti = inc > 0 ? (totalEMI / inc) * 100 : 0;

    // B. Profile Surplus
    const surplus = inc - exp - totalEMI;

    // C. Score computation (replicating recoveryScoreService.js math)
    const activeIncome = Math.max(1, inc);
    const activeExpenses = Math.max(1, exp);

    // Factor 1: DTI (Max 20 pts)
    let dtiPoints = 0;
    if (dti <= 20) dtiPoints = 20;
    else if (dti <= 35) dtiPoints = 15;
    else if (dti <= 50) dtiPoints = 8;
    else dtiPoints = 2;

    // Factor 2: Savings Ratio (Max 15 pts)
    const savingsRatio = (sav / activeIncome) * 100;
    let savingsPoints = 0;
    if (savingsRatio >= 20) savingsPoints = 15;
    else if (savingsRatio >= 10) savingsPoints = 10;
    else if (savingsRatio >= 5) savingsPoints = 5;
    else savingsPoints = 1;

    // Factor 3: Emergency Fund (Max 15 pts)
    const efMonths = ef / activeExpenses;
    let efPoints = 0;
    if (efMonths >= 6) efPoints = 15;
    else if (efMonths >= 3) efPoints = 10;
    else if (efMonths >= 1) efPoints = 5;
    else efPoints = 0;

    // Factor 4: Loan Count (Max 10 pts)
    let loanPoints = 0;
    if (loanCount <= 1) loanPoints = 10;
    else if (loanCount === 2) loanPoints = 7;
    else if (loanCount <= 4) loanPoints = 4;
    else loanPoints = 1;

    // Factor 5: EMI Burden (Max 10 pts)
    const emiBurden = (totalEMI / activeExpenses) * 100;
    let emiBurdenPoints = 0;
    if (emiBurden <= 20) emiBurdenPoints = 10;
    else if (emiBurden <= 50) emiBurdenPoints = 7;
    else if (emiBurden <= 80) emiBurdenPoints = 4;
    else emiBurdenPoints = 1;

    // Factor 6: Payment Compliance (Max 15 pts)
    let compliancePoints = 15;
    if (compliancePct >= 95) compliancePoints = 15;
    else if (compliancePct >= 80) compliancePoints = 10;
    else if (compliancePct >= 60) compliancePoints = 5;
    else compliancePoints = 0;

    // Factor 7: Surplus Ratio (Max 15 pts)
    const surplusRatio = (surplus / activeIncome) * 100;
    let surplusPoints = 0;
    if (surplusRatio >= 20) surplusPoints = 15;
    else if (surplusRatio >= 10) surplusPoints = 10;
    else if (surplusRatio >= 0) surplusPoints = 5;
    else surplusPoints = 0;

    const previewScore = dtiPoints + savingsPoints + efPoints + loanPoints + emiBurdenPoints + compliancePoints + surplusPoints;

    return {
      dti: Math.round(dti * 10) / 10,
      surplus: Math.round(surplus),
      score: previewScore
    };
  };

  const currentMetrics = () => {
    if (!profile) return { dti: 0, surplus: 0, score: 0 };
    const inc = profile.monthlyIncome || 0;
    const exp = profile.monthlyExpenses || 0;
    const sav = profile.savings || 0;
    const ef = profile.emergencyFund || 0;

    const dti = inc > 0 ? (totalEMI / inc) * 100 : 0;
    const surplus = inc - exp - totalEMI;

    // Calculation logic matching exactly
    const activeIncome = Math.max(1, inc);
    const activeExpenses = Math.max(1, exp);

    let dtiPoints = 0;
    if (dti <= 20) dtiPoints = 20;
    else if (dti <= 35) dtiPoints = 15;
    else if (dti <= 50) dtiPoints = 8;
    else dtiPoints = 2;

    const savingsRatio = (sav / activeIncome) * 100;
    let savingsPoints = 0;
    if (savingsRatio >= 20) savingsPoints = 15;
    else if (savingsRatio >= 10) savingsPoints = 10;
    else if (savingsRatio >= 5) savingsPoints = 5;
    else savingsPoints = 1;

    const efMonths = ef / activeExpenses;
    let efPoints = 0;
    if (efMonths >= 6) efPoints = 15;
    else if (efMonths >= 3) efPoints = 10;
    else if (efMonths >= 1) efPoints = 5;
    else efPoints = 0;

    let loanPoints = 0;
    if (loanCount <= 1) loanPoints = 10;
    else if (loanCount === 2) loanPoints = 7;
    else if (loanCount <= 4) loanPoints = 4;
    else loanPoints = 1;

    const emiBurden = (totalEMI / activeExpenses) * 100;
    let emiBurdenPoints = 0;
    if (emiBurden <= 20) emiBurdenPoints = 10;
    else if (emiBurden <= 50) emiBurdenPoints = 7;
    else if (emiBurden <= 80) emiBurdenPoints = 4;
    else emiBurdenPoints = 1;

    let compliancePoints = 15;
    if (compliancePct >= 95) compliancePoints = 15;
    else if (compliancePct >= 80) compliancePoints = 10;
    else if (compliancePct >= 60) compliancePoints = 5;
    else compliancePoints = 0;

    const surplusRatio = (surplus / activeIncome) * 100;
    let surplusPoints = 0;
    if (surplusRatio >= 20) surplusPoints = 15;
    else if (surplusRatio >= 10) surplusPoints = 10;
    else if (surplusRatio >= 0) surplusPoints = 5;
    else surplusPoints = 0;

    const score = dtiPoints + savingsPoints + efPoints + loanPoints + emiBurdenPoints + compliancePoints + surplusPoints;

    return {
      dti: Math.round(dti * 10) / 10,
      surplus: Math.round(surplus),
      score
    };
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const inc = parseFloat(incomeInput);
    const exp = parseFloat(expensesInput);
    const sav = parseFloat(savingsInput) || 0;
    const ef = parseFloat(emergencyInput) || 0;
    const deps = parseInt(dependentsInput) || 0;

    // Extended validation checks
    if (inc < 0 || exp < 0 || sav < 0 || ef < 0 || deps < 0) {
      setErrorMsg('Negative values are not permitted for financial inputs.');
      return;
    }
    if (exp > 1000000) {
      setErrorMsg('Monthly expenses cannot exceed ₹1,000,000.');
      return;
    }
    if (exp > inc * 3) {
      setErrorMsg('Monthly expenses cannot exceed 3 times your Monthly Income.');
      return;
    }

    try {
      const payload = {
        monthlyIncome: inc,
        monthlyExpenses: exp,
        savings: sav,
        emergencyFund: ef,
        dependents: deps,
        riskPreference,
        employmentType,
        salaryDate: parseInt(salaryDate) || 1,
        financialGoals,
        preferredLanguage: languageInput,
        reason: updateReason
      };

      let res;
      if (profile) {
        res = await apiService.profile.update(payload);
      } else {
        res = await apiService.profile.create(payload);
      }

      if (res.success) {
        updatePreferredLanguage(languageInput);
        navigate('/dashboard', { state: { showSuccessBanner: true } });
      }
    } catch (err) {
      // Obscure database / technical errors behind a secure notice
      setErrorMsg(err.response?.data?.error || "We couldn't save your profile. Please try again.");
    }
  };

  if (loading) {
    return <SkeletonScreen.Table rows={6} />;
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : lang === 'ta' ? 'ta-IN' : 'en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const preview = calculatePreviewMetrics();
  const current = currentMetrics();

  const formatDirection = (cur, prev) => {
    if (prev > cur) return 'text-emerald-400 font-bold';
    if (prev < cur) return 'text-rose-400 font-bold';
    return 'text-slate-400';
  };

  const formatDirectionScore = (cur, prev) => {
    if (prev > cur) return 'text-emerald-400 font-bold';
    if (prev < cur) return 'text-rose-400 font-bold';
    return 'text-brand-primary font-bold';
  };

  return (
    <div class="space-y-8 select-none font-sans leading-relaxed text-slate-300 pb-12">
      {/* Title Header */}
      <div>
        <h1 class="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
          <User class="text-brand-primary" size={24} />
          {profile ? 'Edit Financial Profile' : 'Create Financial Profile'}
        </h1>
        <p class="text-xs text-brand-muted font-medium mt-0.5">
          This page serves as the Master Data Center. All calculations, forecasting algorithms, and AI tools synchronize immediately with these inputs.
        </p>
      </div>

      {errorMsg && (
        <div class="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-start gap-3 text-xs font-semibold">
          <AlertCircle size={16} class="shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Edit Form */}
        <div class="lg:col-span-2 space-y-8">
          <div class="bg-brand-card border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
            <h2 class="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
              Master Financial Parameters
            </h2>

            <form onSubmit={handleProfileSubmit} class="space-y-6">
              
              {/* Financial Inputs */}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Monthly Income
                  </label>
                  <span class="block text-[9px] text-slate-500 font-medium mb-1.5">
                    This value originates from Financial Profile (Take-home income)
                  </span>
                  <div class="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="80000"
                      value={incomeInput}
                      onChange={(e) => setIncomeInput(e.target.value)}
                      class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-medium"
                    />
                    <span class="absolute right-4 top-3 text-[10px] text-slate-500 font-bold">INR</span>
                  </div>
                </div>

                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Profile Monthly Expenses
                  </label>
                  <span class="block text-[9px] text-slate-500 font-medium mb-1.5">
                    This value originates from Financial Profile (Estimated recurring lifestyle cost)
                  </span>
                  <div class="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="30000"
                      value={expensesInput}
                      onChange={(e) => setExpensesInput(e.target.value)}
                      class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-medium"
                    />
                    <span class="absolute right-4 top-3 text-[10px] text-slate-500 font-bold">INR</span>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Savings Balance
                  </label>
                  <span class="block text-[9px] text-slate-500 font-medium mb-1.5">
                    This value originates from Financial Profile (Liquid assets)
                  </span>
                  <div class="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="25000"
                      value={savingsInput}
                      onChange={(e) => setSavingsInput(e.target.value)}
                      class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-medium"
                    />
                    <span class="absolute right-4 top-3 text-[10px] text-slate-500 font-bold">INR</span>
                  </div>
                </div>

                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Emergency Fund Cushion
                  </label>
                  <span class="block text-[9px] text-slate-500 font-medium mb-1.5">
                    This value originates from Financial Profile (Emergency cash reserves)
                  </span>
                  <div class="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="120000"
                      value={emergencyInput}
                      onChange={(e) => setEmergencyInput(e.target.value)}
                      class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-medium"
                    />
                    <span class="absolute right-4 top-3 text-[10px] text-slate-500 font-bold">INR</span>
                  </div>
                </div>
              </div>

              {/* Extra Parameters */}
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Dependents Count
                  </label>
                  <span class="block text-[9px] text-slate-500 font-medium mb-1.5">
                    Originates from Financial Profile
                  </span>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="2"
                    value={dependentsInput}
                    onChange={(e) => setDependentsInput(e.target.value)}
                    class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-medium"
                  />
                </div>

                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Risk Preference
                  </label>
                  <span class="block text-[9px] text-slate-500 font-medium mb-1.5">
                    Originates from Financial Profile
                  </span>
                  <select
                    value={riskPreference}
                    onChange={(e) => setRiskPreference(e.target.value)}
                    class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-medium cursor-pointer"
                  >
                    <option value="Low">Low Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="High">High Risk</option>
                  </select>
                </div>

                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Employment Type
                  </label>
                  <span class="block text-[9px] text-slate-500 font-medium mb-1.5">
                    Originates from Financial Profile
                  </span>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-medium cursor-pointer"
                  >
                    <option value="Salaried">Salaried</option>
                    <option value="Self-Employed">Self-Employed</option>
                    <option value="Unemployed">Unemployed</option>
                    <option value="Retired">Retired</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Monthly Salary Date
                  </label>
                  <span class="block text-[9px] text-slate-500 font-medium mb-1.5">
                    Originates from Financial Profile
                  </span>
                  <select
                    value={salaryDate}
                    onChange={(e) => setSalaryDate(e.target.value)}
                    class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-medium cursor-pointer"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>Day {day} of the Month</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Preferred Language
                  </label>
                  <span class="block text-[9px] text-slate-500 font-medium mb-1.5">
                    Originates from User Settings
                  </span>
                  <div class="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
                    <Globe size={15} class="text-brand-primary shrink-0" />
                    <select
                      value={languageInput}
                      onChange={(e) => setLanguageInput(e.target.value)}
                      class="bg-transparent border-none text-xs text-slate-200 focus:outline-none cursor-pointer font-medium w-full"
                    >
                      <option value="en" class="bg-brand-card">English</option>
                      <option value="te" class="bg-brand-card">తెలుగు (Telugu)</option>
                      <option value="hi" class="bg-brand-card">हिन्दी (Hindi)</option>
                      <option value="ta" class="bg-brand-card">தமிழ் (Tamil)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Financial Goals
                </label>
                <span class="block text-[9px] text-slate-500 font-medium mb-1.5">
                  Originates from Financial Profile
                </span>
                <textarea
                  placeholder="E.g., Clear vehicle loan by December, build 6-month emergency cushion..."
                  value={financialGoals}
                  onChange={(e) => setFinancialGoals(e.target.value)}
                  rows="3"
                  class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-medium resize-none"
                />
              </div>

              {/* Reason for Audit update */}
              <div class="bg-slate-900/60 border border-indigo-500/25 p-4 rounded-xl space-y-3">
                <div class="flex items-center gap-2 text-indigo-400">
                  <ShieldCheck size={16} />
                  <span class="text-[10px] font-bold uppercase tracking-wider">Required Audit Logging</span>
                </div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase">Reason for modifying profile data</label>
                <select
                  value={updateReason}
                  onChange={(e) => setUpdateReason(e.target.value)}
                  class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500/50 transition-all cursor-pointer font-medium"
                >
                  <option value="Salary hike">Salary hike / Income increase</option>
                  <option value="Budget adjustments">Budget adjustments / Cut non-essentials</option>
                  <option value="Emergency fund setup">Emergency fund allocation</option>
                  <option value="Debt paydown milestone">Debt repayment progress</option>
                  <option value="Career transition">Career transition / Employment update</option>
                  <option value="Profile correction">Profile details correction</option>
                </select>
              </div>

              <div class="pt-2">
                <button
                  type="submit"
                  class="w-full bg-brand-primary hover:bg-emerald-600 transition-colors text-black font-extrabold text-sm py-3.5 rounded-xl cursor-pointer shadow-glow-primary active:scale-[0.99] duration-150"
                >
                  {profile ? 'Update Master Profile' : 'Save Master Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* Audit History Log */}
          <div class="bg-brand-card border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
            <div class="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <History size={16} class="text-brand-secondary" />
              <h2 class="text-sm font-bold text-white uppercase tracking-wider">
                Profile Change Log (Audited Trail)
              </h2>
            </div>

            {profile?.auditTrail && profile.auditTrail.length > 0 ? (
              <div class="relative border-l border-slate-800 ml-3.5 pl-6 space-y-6 py-2">
                {profile.auditTrail.slice().reverse().map((entry, idx) => (
                  <div key={idx} class="relative group">
                    <span class="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-dark border border-slate-800">
                      <span class="h-1.5 w-1.5 rounded-full bg-brand-primary"></span>
                    </span>
                    
                    <div class="space-y-2">
                      <div class="flex items-center justify-between flex-wrap gap-2 text-xs">
                        <span class="font-extrabold text-white uppercase tracking-wide">
                          {entry.field} Updated
                        </span>
                        <span class="text-[10px] text-slate-500 font-bold flex items-center gap-1 font-mono">
                          <Clock size={11} /> {formatDate(entry.updatedAt)}
                        </span>
                      </div>
                      
                      <div class="text-[11px] text-slate-400 bg-slate-900/40 border border-slate-800/50 p-3 rounded-xl max-w-lg font-mono space-y-2">
                        <div class="flex items-center gap-4">
                          <div>
                            <span class="text-slate-500 font-bold block text-[9px] uppercase">Old Value</span>
                            <span class="text-rose-400 font-semibold">{entry.previousValue?.toLocaleString()}</span>
                          </div>
                          <span class="text-slate-600 font-bold text-sm">&rarr;</span>
                          <div>
                            <span class="text-slate-500 font-bold block text-[9px] uppercase">New Value</span>
                            <span class="text-emerald-400 font-extrabold">{entry.newValue?.toLocaleString()}</span>
                          </div>
                        </div>
                        <div class="border-t border-slate-800/60 pt-1.5 text-[9px] text-slate-500 flex justify-between gap-4">
                          <span>Updated By: <strong class="text-slate-400">{entry.changedBy || 'User'}</strong></span>
                          <span>Reason: <strong class="text-slate-400">{entry.reason || 'Profile update'}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div class="bg-slate-900/30 border border-slate-800 p-4 rounded-xl text-center">
                <p class="text-xs text-slate-500 font-medium">
                  No profile audits recorded yet. Modifying any fields will log historical audits.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Impact Preview */}
        <div class="space-y-6">
          <div class="bg-brand-card border border-indigo-500/25 p-5 rounded-2xl space-y-5 shadow-xl sticky top-6">
            <div class="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-3">
              <Sparkles size={16} class="text-indigo-400" />
              <span>Live Profile Impact Preview</span>
            </div>

            <div className="space-y-4">
              {/* Score impact */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recovery Score Preview</h4>
                    <p className="text-[9px] text-slate-500 mt-0.5">Weighted risk variables</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 mr-1.5">{current.score}</span>
                    <span className="text-xs text-slate-600 font-bold mr-1.5">&rarr;</span>
                    <span className={`text-base font-black ${formatDirectionScore(current.score, preview.score)}`}>
                      {preview.score}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-455 font-medium">
                  {preview.score > current.score 
                    ? "🎉 Expected Benefit: Your score will improve, unlocking a safer financial status."
                    : preview.score < current.score 
                      ? "⚠️ Caution: These adjustments drag down your Recovery Score."
                      : "No change to score."}
                </p>
              </div>

              {/* DTI impact */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Debt-To-Income (DTI)</h4>
                    <p className="text-[9px] text-slate-500 mt-0.5">Formula: EMI &divide; Income</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 mr-1.5">{current.dti}%</span>
                    <span className="text-xs text-slate-600 font-bold mr-1.5">&rarr;</span>
                    <span className={`text-base font-extrabold ${formatDirection(preview.dti, current.dti)}`}>
                      {preview.dti}%
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-455 font-medium">
                  {preview.dti < current.dti 
                    ? "✓ Improvement: Lower portion of income committed to debt payments."
                    : preview.dti > current.dti
                      ? "⚠️ Alert: More of your monthly income is now tied up in debt obligations."
                      : "DTI remains steady."}
                </p>
              </div>

              {/* Surplus impact */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Surplus</h4>
                    <p className="text-[9px] text-slate-500 mt-0.5">Formula: Income - Exp - EMI</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 mr-1.5">₹{current.surplus.toLocaleString()}</span>
                    <span className="text-xs text-slate-600 font-bold mr-1.5">&rarr;</span>
                    <span className={`text-base font-extrabold ${formatDirection(current.surplus, preview.surplus)}`}>
                      ₹{preview.surplus.toLocaleString()}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-455 font-medium">
                  {preview.surplus > current.surplus 
                    ? "✓ Improvement: Free cash flow increased, allowing faster savings growth."
                    : preview.surplus < current.surplus 
                      ? "⚠️ Alert: Less cash leftover at month-end to fund emergency buffer."
                      : "Surplus remains steady."}
                </p>
              </div>
            </div>

            <div class="bg-slate-900/40 p-4 border border-slate-800/50 rounded-xl text-[10px] text-slate-500 space-y-1 font-mono">
              <span class="block text-slate-400 font-bold uppercase tracking-wider mb-1">Active Ledger Math Inputs:</span>
              <div>• Total Monthly EMIs: Rs. {totalEMI.toLocaleString()}</div>
              <div>• Active Loans Count: {loanCount} accounts</div>
              <div>• Payment Compliance: {compliancePct}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialProfile;
