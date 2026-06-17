import React, { useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../context/AuthContext';
import { getTranslation } from '../services/localizer';
import apiService from '../services/apiService';
import SkeletonScreen from '../components/SkeletonScreen';
import { motion, AnimatePresence } from 'framer-motion';
import InsightCard from '../components/InsightCard';
import { 
  Calculator, 
  HelpCircle, 
  Sparkles, 
  AlertCircle,
  Calendar,
  Clock,
  CircleDollarSign,
  Compass,
  Target,
  CheckCircle2,
  XCircle
} from 'lucide-react';

const DebtSimulator = () => {
  const { user } = useContext(AuthContext);
  const lang = user?.preferredLanguage || 'en';

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulationResult, setSimulationResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      loanId: '',
      currentEmi: '',
      proposedEmi: ''
    }
  });

  const selectedLoanId = watch('loanId');

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const res = await apiService.loans.getAll();
        const active = res.data.filter(l => l.status === 'Active');
        setLoans(active);
        
        if (active.length > 0) {
          setValue('loanId', active[0]._id);
          setValue('currentEmi', active[0].emi);
          setValue('proposedEmi', active[0].emi + 2000);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLoans();
  }, [setValue]);

  // Adjust standard values when selected loan changes
  useEffect(() => {
    if (selectedLoanId && loans.length > 0) {
      const loan = loans.find(l => l._id.toString() === selectedLoanId.toString());
      if (loan) {
        setValue('currentEmi', loan.emi);
        setValue('proposedEmi', loan.emi + 3000);
      }
    }
  }, [selectedLoanId, loans, setValue]);

  const handleSimulate = async (data) => {
    setErrorMsg('');
    setSimulationResult(null);
    try {
      const payload = {
        loanId: data.loanId,
        currentEmi: parseFloat(data.currentEmi),
        proposedEmi: parseFloat(data.proposedEmi)
      };

      if (payload.proposedEmi <= payload.currentEmi) {
        setErrorMsg('Proposed EMI must be greater than current EMI to simulate acceleration.');
        return;
      }

      const res = await apiService.simulator.run(payload);
      if (res.success) {
        setSimulationResult(res.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Simulations failed. Interest accruals may exceed input EMIs.');
    }
  };

  if (loading) {
    return <SkeletonScreen.Card />;
  }

  return (
    <div class="space-y-8 select-none font-sans">
      {/* Title */}
      <div>
        <h1 class="text-2xl font-black tracking-tight text-white">What-If Simulation Center</h1>
        <p class="text-xs text-brand-muted font-medium mt-1">Simulate changes to individual loan EMIs to discover months saved and total interest reductions.</p>
      </div>

      {/* Forms & Selector split */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="bg-brand-card border border-slate-800 p-8 rounded-3xl space-y-6">
          <div class="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">
            <Calculator size={16} />
            <span>Simulation Parameters</span>
          </div>

          {errorMsg && (
            <div class="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-start gap-3 text-xs font-semibold leading-relaxed">
              <AlertCircle size={16} class="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {loans.length > 0 ? (
            <form onSubmit={handleSubmit(handleSimulate)} class="space-y-5">
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Target Loan Account</label>
                <select
                  {...register('loanId', { required: true })}
                  class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-medium cursor-pointer"
                >
                  {loans.map(l => (
                    <option key={l._id} value={l._id}>{l.loanName} (Bal: Rs. {l.remainingAmount.toLocaleString()})</option>
                  ))}
                </select>
              </div>

              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Current EMI payment (Rs.)</label>
                <input
                  type="number"
                  required
                  {...register('currentEmi', { required: true })}
                  class="w-full bg-slate-900/60 border border-slate-800 text-xs rounded-xl px-4 py-3 text-slate-400 font-bold cursor-not-allowed"
                  readonly
                />
              </div>

              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Proposed EMI payment (Rs.)</label>
                <input
                  type="number"
                  required
                  placeholder="Proposed EMI"
                  {...register('proposedEmi', { 
                    required: 'Proposed EMI is required',
                    validate: (val) => parseFloat(val) > parseFloat(watch('currentEmi')) || 'Proposed EMI must exceed current EMI'
                  })}
                  class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-medium"
                />
                {errors.proposedEmi && (
                  <p class="text-[10px] font-bold text-rose-400 mt-1.5 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.proposedEmi.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                class="w-full bg-brand-primary hover:bg-emerald-600 transition-colors text-black font-bold text-xs py-3.5 rounded-xl cursor-pointer shadow-glow-primary duration-200 active:scale-[0.98]"
              >
                Run Simulation
              </button>
            </form>
          ) : (
            <div class="py-12 text-center text-slate-500 flex flex-col justify-center items-center gap-3">
              <HelpCircle size={32} class="text-slate-600" />
              <p class="text-xs">No active loans found to run simulation. Please add a loan first.</p>
            </div>
          )}
        </div>

        {/* Right side: Simulation Results Display */}
        <div class="bg-brand-card border border-slate-800 p-8 rounded-3xl lg:col-span-2 flex flex-col justify-between relative overflow-hidden">
          <AnimatePresence mode="wait">
            {simulationResult ? (
              (() => {
                const activeLoan = loans.find(l => l._id.toString() === selectedLoanId.toString());
                const balance = activeLoan ? activeLoan.remainingAmount : 0;
                const rate = activeLoan ? activeLoan.interestRate : 0;
                const monthlyRate = (rate / 12) / 100;
                const month1Interest = balance * monthlyRate;
                const propEmi = parseFloat(watch('proposedEmi')) || 0;
                const currEmi = parseFloat(watch('currentEmi')) || 0;
                const currentPrincipalRepay = Math.max(0, currEmi - month1Interest);
                const proposedPrincipalRepay = Math.max(0, propEmi - month1Interest);
                const speedMultiplier = currentPrincipalRepay > 0 
                  ? (proposedPrincipalRepay / currentPrincipalRepay).toFixed(1) 
                  : 'N/A';

                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6 h-full flex flex-col justify-between"
                  >
                    {/* Savings highlight board */}
                    <div class="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                      <div class="flex items-center gap-4">
                        <div class="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
                          <Sparkles size={24} />
                        </div>
                        <div>
                          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Interest Money Saved</h3>
                          <p class="text-[11px] text-brand-muted font-medium mt-0.5">Total simulated lifetime savings.</p>
                        </div>
                      </div>
                      <div class="text-right">
                        <span class="text-2xl font-black text-brand-primary tracking-tight">
                          Rs. {simulationResult.interestSaved.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Tenure Results compare */}
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Current Payoff Card */}
                      <div class="bg-slate-900/30 border border-slate-800/60 p-4 rounded-xl space-y-1">
                        <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Current Amortization</span>
                        <div class="flex items-baseline gap-2">
                          <h4 class="text-lg font-bold text-slate-300">{simulationResult.currentPayoffMonths}</h4>
                          <span class="text-xs text-slate-500">{getTranslation(lang, 'months')}</span>
                        </div>
                      </div>

                      {/* New Payoff Card */}
                      <div class="bg-slate-900/30 border border-slate-800/60 p-4 rounded-xl space-y-1">
                        <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Accelerated Amortization</span>
                        <div class="flex items-baseline gap-2">
                          <h4 class="text-lg font-bold text-brand-primary">{simulationResult.newPayoffMonths}</h4>
                          <span class="text-xs text-brand-primary">{getTranslation(lang, 'months')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Step-by-Step Compound Math explanation */}
                    <div class="bg-slate-950/80 border border-slate-800 p-4.5 rounded-2xl space-y-3 font-sans">
                      <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Month 1 Compounding Math Audit</span>
                      
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div class="space-y-1 text-slate-400">
                          <div class="flex justify-between">
                            <span>Outstanding Balance:</span>
                            <span class="text-white font-bold">Rs. {balance.toLocaleString()}</span>
                          </div>
                          <div class="flex justify-between">
                            <span>Monthly Rate (r/12):</span>
                            <span class="text-white font-bold">{(rate / 12).toFixed(3)}%</span>
                          </div>
                          <div class="flex justify-between">
                            <span>Month 1 Interest:</span>
                            <span class="text-rose-400 font-extrabold">Rs. {Math.round(month1Interest).toLocaleString()}</span>
                          </div>
                        </div>

                        <div class="space-y-2.5 pl-0 md:pl-4 border-l-0 md:border-l border-slate-800 text-[11px]">
                          <div>
                            <span class="text-slate-500 font-bold block">Current EMI principal paydown:</span>
                            <span class="text-slate-300 font-bold">Rs. {currEmi.toLocaleString()} - Rs. {Math.round(month1Interest).toLocaleString()} = </span>
                            <span class="text-slate-300 font-extrabold">Rs. {Math.round(currentPrincipalRepay).toLocaleString()}</span>
                          </div>
                          <div>
                            <span class="text-brand-primary font-bold block">Proposed EMI principal paydown:</span>
                            <span class="text-brand-primary font-bold">Rs. {propEmi.toLocaleString()} - Rs. {Math.round(month1Interest).toLocaleString()} = </span>
                            <span class="text-emerald-400 font-black">Rs. {Math.round(proposedPrincipalRepay).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div class="border-t border-slate-800/60 pt-2.5 text-[10px] text-brand-muted leading-relaxed font-semibold">
                        💡 **Compounding Cascade:** Proposed plan puts Rs. {(propEmi - currEmi).toLocaleString()} extra *purely* into principal reduction. This reduces Month 2 principal by that amount, decreasing interest accrued next month. This accelerates principal payoff speed by <span class="text-emerald-400 font-bold">{speedMultiplier}x</span>!
                      </div>
                    </div>

                    {/* Final analysis details */}
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                      <div class="flex items-center gap-3">
                        <div class="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                          <Clock size={16} />
                        </div>
                        <div>
                          <h5 class="text-[10px] text-slate-400 font-bold uppercase">Payoff Time Reduced</h5>
                          <p class="text-xs text-white font-extrabold">{simulationResult.monthsReduced} Months sooner</p>
                        </div>
                      </div>
                      
                      <div class="flex items-center gap-3">
                        <div class="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
                          <Calendar size={16} />
                        </div>
                        <div>
                          <h5 class="text-[10px] text-slate-400 font-bold uppercase">New Debt-Free Date</h5>
                          <p class="text-xs text-white font-extrabold">{new Date(simulationResult.newPayoffDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Is It Worth It? Section */}
                    {(() => {
                      const isWorth = simulationResult.monthsReduced >= 3 || simulationResult.interestSaved >= 5000;
                      return (
                        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl space-y-3 mt-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <Compass size={12} />
                              Is It Worth It?
                            </span>
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                              isWorth 
                                ? 'text-emerald-450 bg-emerald-500/10 border-emerald-500/25' 
                                : 'text-amber-450 bg-amber-500/10 border-amber-500/25'
                            }`}>
                              Recommended: {isWorth ? 'YES' : 'NO'}
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 size={12} className={isWorth ? "text-brand-primary" : "text-amber-400"} />
                              <span>Saves {simulationResult.monthsReduced} month{simulationResult.monthsReduced !== 1 && 's'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 size={12} className={isWorth ? "text-brand-primary" : "text-amber-400"} />
                              <span>Saves ₹{simulationResult.interestSaved.toLocaleString()} interest</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium pt-1">
                              {isWorth 
                                ? "💡 Advisor Decision: YES, this acceleration is highly cost-effective. The principal decays fast enough to yield considerable compound interest savings."
                                : "💡 Advisor Decision: NO, interest reduction is negligible relative to the increased budget pressure. Consider allocating this extra cash to your emergency fund or saving cash."}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                );
              })()
            ) : (
              <div class="h-full flex flex-col justify-center items-center text-center text-slate-500 space-y-3 py-16">
                <HelpCircle size={40} class="text-slate-600" />
                <h4 class="text-sm font-bold text-slate-300">Run a simulation to view results</h4>
                <p class="text-xs text-brand-muted max-w-xs leading-relaxed">
                  Enter your proposed EMI on the left and see how many months and interest rupees you save.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Simulator Guide Box */}
      <div class="bg-brand-card border border-slate-800 p-6 rounded-3xl space-y-3">
        <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <HelpCircle size={14} class="text-brand-primary" />
          Simulator Guide & Compounding Math
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-[11px] text-slate-400 leading-relaxed font-medium">
          <div>
            <span class="font-bold text-slate-300 block mb-1">1. Acceleration Mechanism:</span>
            By increasing your monthly EMI, more of your payment is applied to the loan principal rather than interest charges.
          </div>
          <div>
            <span class="font-bold text-slate-300 block mb-1">2. Cumulative Interest Saved:</span>
            Compounding interest math: reducing principal earlier prevents interest from accrual in all future months, resulting in significant savings.
          </div>
          <div>
            <span class="font-bold text-slate-300 block mb-1">3. Months Reduced:</span>
            Shaving months off the tenure accelerates your overall debt-free date and increases your cash surplus sooner.
          </div>
        </div>
      </div>

      {/* Coach InsightCard */}
      <InsightCard 
        title="Debt Simulator Advisor Advice"
        problem={
          simulationResult 
            ? `Your proposed payment plan saves ₹${simulationResult.interestSaved.toLocaleString()} in interest, but locks extra surplus cash flow.`
            : "Running simulations is needed to optimize extra surplus allocation."
        }
        whyItMatters="Prepaying principal reduces compounding velocity, but committing too much cash flow risks your emergency fund cushion."
        recommendedAction="Prepay high-rate debt accounts first if you have at least 3 months of emergency expenses saved."
        expectedBenefit="Reduces total debt tenure and accelerates your score roadmap without creating cash crunches."
      />
    </div>
  );
};

export default DebtSimulator;
