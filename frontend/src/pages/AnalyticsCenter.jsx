import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getTranslation } from '../services/localizer';
import apiService from '../services/apiService';
import SkeletonScreen from '../components/SkeletonScreen';
import { BarChart3, LineChart, Award, TrendingUp, HelpCircle } from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart as ReChartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  AreaChart, 
  Area 
} from 'recharts';

const AnalyticsCenter = () => {
  const { user } = useContext(AuthContext);
  const lang = user?.preferredLanguage || 'en';

  const [debtTrend, setDebtTrend] = useState([]);
  const [payoffForecast, setPayoffForecast] = useState([]);
  const [healthHistory, setHealthHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const trendRes = await apiService.analytics.getDebtTrend();
        setDebtTrend(trendRes.data);

        const foreRes = await apiService.analytics.getPayoffForecast();
        setPayoffForecast(foreRes.data);

        const healthRes = await apiService.analytics.getHealthHistory();
        setHealthHistory(healthRes.data);
      } catch (err) {
        console.error(err);
        setErrorMsg('To view analytics charts, please ensure your financial profile is initialized.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div class="space-y-8 select-none">
        <SkeletonScreen.Grid count={3} />
        <SkeletonScreen.Table rows={5} />
      </div>
    );
  }

  if (errorMsg || healthHistory.length === 0) {
    return (
      <div class="bg-brand-card border border-slate-800 p-8 rounded-3xl flex flex-col justify-center items-center text-center space-y-4 max-w-lg mx-auto mt-12 select-none">
        <HelpCircle size={48} class="text-slate-600" />
        <h2 class="text-lg font-bold text-white">Analytics Unavailable</h2>
        <p class="text-xs text-brand-muted leading-relaxed">
          {errorMsg || 'Create your financial profile and loans to calculate analytical reports.'}
        </p>
      </div>
    );
  }

  return (
    <div class="space-y-8 select-none font-sans">
      {/* Title */}
      <div>
        <h1 class="text-2xl font-black tracking-tight text-white">{getTranslation(lang, 'analytics')} Center</h1>
        <p class="text-xs text-brand-muted font-medium mt-1">Interactive visualizations showing historical balances, health progression, and payoff forecasting.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. Debt Trend Line Chart */}
        <div class="bg-brand-card border border-slate-800/80 p-6 rounded-2xl space-y-4">
          <div class="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">
            <LineChart size={16} class="text-brand-secondary" />
            <span>Debt Reduction History (Past 6 Months)</span>
          </div>
          <div class="h-60 mt-4 text-xs font-semibold">
            {debtTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ReChartsLineChart data={debtTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748B" />
                  <YAxis stroke="#64748B" tickFormatter={(v) => `Rs.${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#1E293B', borderRadius: '12px' }}
                    formatter={(val) => `Rs. ${val.toLocaleString()}`}
                  />
                  <Line type="monotone" dataKey="debt" name="Remaining Balance" stroke="#6366F1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </ReChartsLineChart>
              </ResponsiveContainer>
            ) : (
              <div class="h-full flex items-center justify-center text-slate-500 font-medium">No trend data logged.</div>
            )}
          </div>
        </div>

        {/* 2. Recovery Score Trend Chart */}
        <div class="bg-brand-card border border-slate-800/80 p-6 rounded-2xl space-y-4">
          <div class="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">
            <Award size={16} class="text-brand-primary" />
            <span>Recovery Score Progression (Past 6 Months)</span>
          </div>
          <div class="h-60 mt-4 text-xs font-semibold">
            {healthHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={healthHistory}>
                  <defs>
                    <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748B" />
                  <YAxis stroke="#64748B" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#1E293B', borderRadius: '12px' }}
                    formatter={(val) => `${val} points`}
                  />
                  <Area type="monotone" dataKey="score" name="Recovery Score" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHealth)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div class="h-full flex items-center justify-center text-slate-500 font-medium">No score history.</div>
            )}
          </div>
        </div>

        {/* 3. Payoff Projections curve */}
        <div class="bg-brand-card border border-slate-800/80 p-6 rounded-2xl lg:col-span-2 space-y-4">
          <div class="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">
            <TrendingUp size={16} class="text-cyan-400" />
            <span>Accelerated Payoff Projection Curve</span>
          </div>
          <div class="h-64 mt-4 text-xs font-semibold">
            {payoffForecast.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={payoffForecast}>
                  <defs>
                    <linearGradient id="colorForecastCurve" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748B" />
                  <YAxis stroke="#64748B" tickFormatter={(v) => `Rs.${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#1E293B', borderRadius: '12px' }}
                    formatter={(val) => `Rs. ${val.toLocaleString()}`}
                  />
                  <Area type="monotone" dataKey="remainingDebt" name="Remaining Debt" stroke="#06B6D4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorForecastCurve)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div class="h-full flex items-center justify-center text-slate-500 font-medium">No active debt coordinates.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCenter;
