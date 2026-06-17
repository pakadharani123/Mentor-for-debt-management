import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getTranslation } from '../services/localizer';
import apiService from '../services/apiService';
import SkeletonScreen from '../components/SkeletonScreen';
import ExplainModal from '../components/ExplainModal';
import InsightCard from '../components/InsightCard';
import { 
  TrendingUp, 
  Calendar, 
  CircleDollarSign, 
  HelpCircle, 
  HeartHandshake,
  Info,
  ShieldAlert,
  ShieldCheck,
  Settings,
  Compass,
  Target
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

const DebtForecast = () => {
  const { user } = useContext(AuthContext);
  const lang = user?.preferredLanguage || 'en';

  const [forecast, setForecast] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [compliancePct, setCompliancePct] = useState(100);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [explainMetric, setExplainMetric] = useState(null);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const foreRes = await apiService.forecast.get();
        setForecast(foreRes.data);

        const chartRes = await apiService.analytics.getPayoffForecast();
        setChartData(chartRes.data);

        try {
          const scoreRes = await apiService.recoveryScore.get();
          if (scoreRes.success && scoreRes.data) {
            setCompliancePct(scoreRes.data.factors?.paymentCompliance?.value ?? 100);
          }
        } catch (e) {
          console.warn('Failed to load compliance details for forecast.', e);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('To view your forecast, please ensure you have active loans and a financial profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, []);

  if (loading) {
    return <SkeletonScreen.Table rows={6} />;
  }

  if (errorMsg || !forecast || forecast.payoffMonthsRemaining === 0) {
    return (
      <div class="bg-brand-card border border-slate-800 p-8 rounded-3xl flex flex-col justify-center items-center text-center space-y-4 max-w-lg mx-auto mt-12 select-none">
        <HelpCircle size={48} class="text-slate-600" />
        <h2 class="text-lg font-bold text-white">Forecast Unavailable</h2>
        <p class="text-xs text-brand-muted leading-relaxed">
          {errorMsg || 'You do not have any active loans to forecast repayment timelines.'}
        </p>
      </div>
    );
  }

  const payoffDate = forecast.estimatedDebtFreeDate 
    ? new Date(forecast.estimatedDebtFreeDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  // Confidence assessment based on compliance rate
  let confidenceLevel = 'High';
  let confidenceColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
  let confidenceDesc = 'High probability of hitting targets based on consistent monthly payment ledger compliance.';
  
  if (compliancePct < 70) {
    confidenceLevel = 'Low';
    confidenceColor = 'text-rose-400 bg-rose-500/10 border-rose-500/25';
    confidenceDesc = 'Low probability of hitting dates. Inconsistent payment ledger entries risk compound interest delay.';
  } else if (compliancePct < 90) {
    confidenceLevel = 'Medium';
    confidenceColor = 'text-amber-400 bg-amber-500/10 border-amber-500/25';
    confidenceDesc = 'Moderate probability of meeting projections. Review and confirm unpaid bills to increase confidence.';
  }

  return (
    <div class="space-y-8 select-none font-sans">
      {/* Title */}
      <div class="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 class="text-2xl font-black tracking-tight text-white">{getTranslation(lang, 'forecast')} Analysis</h1>
          <p class="text-xs text-brand-muted font-medium mt-1">Simulated total remaining interest, repayment speeds, and accelerated recommendations.</p>
        </div>
        <button
          onClick={() => setExplainMetric('FORECAST')}
          class="bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 cursor-pointer flex items-center gap-1.5 transition-all"
        >
          <Info size={14} />
          <span>Explain Forecast Math</span>
        </button>
      </div>

      {/* Cards list */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-brand-card border border-slate-800/80 p-5 rounded-2xl space-y-3 relative group">
          <button 
            onClick={() => setExplainMetric('FORECAST')}
            class="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
          >
            <Info size={14} />
          </button>
          <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{getTranslation(lang, 'debtFreeDate')}</span>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-emerald-500/10 text-brand-primary rounded-xl">
              <Calendar size={18} />
            </div>
            <h4 class="text-base font-extrabold text-white">{payoffDate}</h4>
          </div>
          <p class="text-[9px] text-brand-muted">Assuming Avalanche paydown</p>
        </div>

        <div class="bg-brand-card border border-slate-800/80 p-5 rounded-2xl space-y-3 relative group">
          <button 
            onClick={() => setExplainMetric('FORECAST')}
            class="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
          >
            <Info size={14} />
          </button>
          <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{getTranslation(lang, 'remainingInterest')}</span>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-indigo-500/10 text-brand-secondary rounded-xl">
              <CircleDollarSign size={18} />
            </div>
            <h4 class="text-base font-extrabold text-white">
              {forecast.totalInterestRemaining === -1 ? 'Deficit (Infinite)' : `Rs. ${forecast.totalInterestRemaining.toLocaleString()}`}
            </h4>
          </div>
          <p class="text-[9px] text-brand-muted">Compounded interest charges</p>
        </div>

        <div class="bg-brand-card border border-slate-800/80 p-5 rounded-2xl space-y-3 relative group">
          <button 
            onClick={() => setExplainMetric('FORECAST')}
            class="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
          >
            <Info size={14} />
          </button>
          <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{getTranslation(lang, 'recommendedPayment')}</span>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
              <TrendingUp size={18} />
            </div>
            <h4 class="text-base font-extrabold text-white">Rs. {forecast.recommendedMonthlyPayment.toLocaleString()}</h4>
          </div>
          <p class="text-[9px] text-brand-muted">Includes 50% monthly surplus</p>
        </div>

        <div class="bg-brand-card border border-slate-800/80 p-5 rounded-2xl space-y-3 relative group">
          <button 
            onClick={() => setExplainMetric('FORECAST')}
            class="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
          >
            <Info size={14} />
          </button>
          <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Remaining Tenure</span>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-rose-500/10 text-rose-400 rounded-xl">
              <Calendar size={18} />
            </div>
            <h4 class="text-base font-extrabold text-white">
              {forecast.payoffMonthsRemaining === -1 ? 'Infinite' : `${forecast.payoffMonthsRemaining} Months`}
            </h4>
          </div>
          <p class="text-[9px] text-brand-muted">Accelerated payoff timeline</p>
        </div>
      </div>

      {/* What This Means For You */}
      <div className="bg-brand-card border border-indigo-500/20 p-6 rounded-2xl shadow-glow-secondary space-y-4">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
          <Compass size={16} />
          <span>What This Means For You</span>
        </div>
        <p className="text-xs text-slate-300 font-sans leading-relaxed">
          At your current payment rate, you are scheduled to resolve your outstanding debt accounts on <strong className="text-white">{payoffDate}</strong>. 
          However, carrying this liability carries an interest charge of <strong className="text-rose-455">Rs. {forecast.totalInterestRemaining === -1 ? 'Infinite' : forecast.totalInterestRemaining.toLocaleString()}</strong>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-300 mt-2">
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Estimated Debt-Free Date</span>
            <span className="text-white font-black">{payoffDate}</span>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Total Interest Remaining</span>
            <span className="text-rose-450 font-black">Rs. {forecast.totalInterestRemaining === -1 ? 'Deficit' : forecast.totalInterestRemaining.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Timeline Risk</span>
            <span className={`font-black ${confidenceLevel === 'High' ? 'text-emerald-400' : confidenceLevel === 'Medium' ? 'text-amber-400' : 'text-rose-400'}`}>{confidenceLevel} Risk</span>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Recommendation</span>
            <span className="text-brand-primary font-black">Increase EMI by ₹5,000</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 font-medium">
          💡 **Advisory Notice:** Adding ₹5,000 to your monthly payments allows you to clear the balance significantly faster, saving months of amortization and retaining interest in your savings accounts instead of paying it to lenders.
        </p>
      </div>

      {/* InsightCard Integration */}
      <InsightCard 
        title="Debt Forecast Insight"
        problem={
          forecast.totalInterestRemaining > 50000 
            ? `Your projected interest cost is ₹${forecast.totalInterestRemaining.toLocaleString()}, indicating long-term interest leak.`
            : null
        }
        whyItMatters="High outstanding interest drains your surplus cash flow and delays your ability to build compound wealth."
        recommendedAction={`Allocate ₹5,000 extra monthly to high-interest loans (Avalanche repayment method).`}
        expectedBenefit="Reduces total remaining tenure, saves substantial interest, and improves your Recovery Score."
      />

      {/* Projections timeline Chart & Sidebar */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="bg-brand-card border border-slate-800/80 p-6 rounded-2xl lg:col-span-2 space-y-4">
          <div>
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">Debt Paydown Projections</h3>
            <p class="text-[11px] text-brand-muted font-medium">Accelerated amortization curve using recommended payments.</p>
          </div>
          <div class="h-72 mt-4 text-xs font-semibold">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748B" />
                  <YAxis stroke="#64748B" tickFormatter={(v) => `Rs.${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#1E293B', borderRadius: '12px' }}
                    formatter={(val) => `Rs. ${val.toLocaleString()}`}
                  />
                  <Area type="monotone" dataKey="remainingDebt" name="Projected Balance" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorForecast)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div class="h-full flex items-center justify-center text-slate-500 font-medium">
                Simulation has no active loan coordinates.
              </div>
            )}
          </div>
          
          {/* What does this graph mean? guide */}
          <div class="pt-4 border-t border-slate-800/60 space-y-2">
            <h4 class="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle size={12} class="text-brand-primary" />
              What does this graph mean?
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-[10px] text-slate-400 leading-relaxed font-medium">
              <div>
                <span class="font-bold text-slate-300 block mb-0.5">1. Debt Decay Curve:</span>
                The area chart displays your total outstanding debt balance reducing over time as you make monthly payments.
              </div>
              <div>
                <span class="font-bold text-slate-300 block mb-0.5">2. Amortization variables:</span>
                Calculates remaining principal and compounding interest monthly based on individual loan interest rates.
              </div>
              <div>
                <span class="font-bold text-slate-300 block mb-0.5">3. Recommended payoff:</span>
                Assumes you pay the recommended Rs. {forecast.recommendedMonthlyPayment.toLocaleString()} monthly, applying extra cash using the Avalanche order.
              </div>
            </div>
          </div>
        </div>

        {/* Assumptions & Advice Sidebar */}
        <div class="space-y-6">
          {/* Assumptions & Confidence Card */}
          <div class="bg-brand-card border border-slate-800/80 p-6 rounded-2xl space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Settings size={14} class="text-indigo-400" />
                Assumptions & Confidence
              </span>
              <span class={`text-[9px] font-extrabold px-2.5 py-1 rounded-full border ${confidenceColor}`}>
                {confidenceLevel} Confidence
              </span>
            </div>
            
            <p class="text-xs text-slate-300 leading-relaxed font-medium">
              {confidenceDesc}
            </p>

            <div class="border-t border-slate-800/80 pt-3 space-y-2.5">
              <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Repayment Presumptions</span>
              
              <div class="flex justify-between items-center text-[11px]">
                <span class="text-slate-400 font-medium">Payoff Strategy Order</span>
                <span class="text-white font-extrabold">Avalanche (Rate-prioritized)</span>
              </div>
              <div class="flex justify-between items-center text-[11px]">
                <span class="text-slate-400 font-medium">Ledger Compliance Rate</span>
                <span class="text-indigo-300 font-extrabold">{compliancePct}%</span>
              </div>
              <div class="flex justify-between items-center text-[11px]">
                <span class="text-slate-400 font-medium">Surplus Accel Alloc</span>
                <span class="text-white font-extrabold">50% of monthly surplus</span>
              </div>
              <div class="flex justify-between items-center text-[11px]">
                <span class="text-slate-400 font-medium">Interest Compounding</span>
                <span class="text-white font-extrabold">Monthly Amortized</span>
              </div>
            </div>
          </div>

          {/* Guidance recommendations card */}
          <div class="bg-brand-card border border-slate-800/80 p-6 rounded-2xl flex flex-col justify-between">
            <div class="space-y-4">
              <div class="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <HeartHandshake size={16} />
                <span>Forecast Advice</span>
              </div>
              
              <p class="text-xs text-slate-300 leading-relaxed pt-2">
                Our forecast engine projects a debt-free date of <span class="text-brand-primary font-bold">{payoffDate}</span>. 
                To achieve this, we recommend adjusting your total monthly payment allocation to <span class="text-brand-primary font-bold">Rs. {forecast.recommendedMonthlyPayment.toLocaleString()}</span>.
              </p>
              <p class="text-xs text-brand-muted leading-relaxed">
                This accelerated amount takes advantage of the **Debt Avalanche** strategy, which prioritizes your highest interest accounts and helps you save on remaining interest costs.
              </p>
            </div>
            
            <div class="mt-6 p-4 rounded-xl bg-slate-900 border border-slate-800/80 text-[10px] text-slate-500 font-mono">
              Outstanding Principal: Rs. {forecast.remainingPrincipal.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Reusable Explainability Modal */}
      {explainMetric && (
        <ExplainModal 
          metricType={explainMetric}
          data={{ forecast, scoreData: { factors: { paymentCompliance: { value: compliancePct } } } }}
          onClose={() => setExplainMetric(null)}
        />
      )}
    </div>
  );
};

export default DebtForecast;
