import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getTranslation } from '../services/localizer';
import apiService from '../services/apiService';
import StatCard from '../components/StatCard';
import SkeletonScreen from '../components/SkeletonScreen';
import { 
  ShieldAlert, 
  Users, 
  Coins, 
  Award, 
  HeartHandshake, 
  Languages, 
  FileCheck2 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell 
} from 'recharts';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const lang = user?.preferredLanguage || 'en';

  const [dashboardStats, setDashboardStats] = useState(null);
  const [userRoster, setUserRoster] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const dashRes = await apiService.admin.getDashboard();
        setDashboardStats(dashRes.data);

        const rosterRes = await apiService.admin.getUsers();
        setUserRoster(rosterRes.data);

        const financeRes = await apiService.admin.getFinancialSummary();
        setFinancialSummary(financeRes.data);
      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to fetch admin stats. Ensure you are authorized as an Admin role.');
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const handleResetLocks = async () => {
    if (!window.confirm('Reset login locks for all users? This will clear all locked-out accounts and set attempts count back to 0.')) return;
    setResetLoading(true);
    setResetMessage('');
    try {
      const res = await apiService.admin.resetLoginLocks();
      if (res.success) {
        setResetMessage(res.message || 'Successfully reset all temporary login locks.');
        setTimeout(() => setResetMessage(''), 6000);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to reset login locks.');
    } finally {
      setResetLoading(false);
    }
  };

  if (loading) {
    return <SkeletonScreen.Table rows={6} />;
  }

  if (errorMsg || !dashboardStats) {
    return (
      <div class="bg-brand-card border border-slate-800 p-8 rounded-3xl flex flex-col justify-center items-center text-center space-y-4 max-w-lg mx-auto mt-12 select-none">
        <ShieldAlert size={48} class="text-rose-400" />
        <h2 class="text-lg font-bold text-white">Access Denied</h2>
        <p class="text-xs text-brand-muted leading-relaxed">{errorMsg || 'Admin credentials required.'}</p>
      </div>
    );
  }

  // Map language usage for Recharts
  const languageData = [
    { name: 'English', count: dashboardStats.regionalLanguageUsage.en || 0 },
    { name: 'Telugu', count: dashboardStats.regionalLanguageUsage.te || 0 },
    { name: 'Hindi', count: dashboardStats.regionalLanguageUsage.hi || 0 },
    { name: 'Tamil', count: dashboardStats.regionalLanguageUsage.ta || 0 }
  ];

  const BAR_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899'];

  return (
    <div class="space-y-8 select-none font-sans">
      {/* Reset Confirmation Banner */}
      {resetMessage && (
        <div class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center justify-between text-xs font-semibold leading-relaxed animate-fade-in">
          <span>{resetMessage}</span>
          <button onClick={() => setResetMessage('')} class="text-slate-400 hover:text-white font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* Title */}
      <div class="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 class="text-2xl font-black tracking-tight text-white">{getTranslation(lang, 'adminDashboard')}</h1>
          <p class="text-xs text-brand-muted font-medium mt-1">Consolidated overview of total users, outstanding liabilities, and language distributions.</p>
        </div>
        <button
          onClick={handleResetLocks}
          disabled={resetLoading}
          class="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resetLoading ? (
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <span>Clear Login Locks</span>
          )}
        </button>
      </div>

      {/* Admin metrics StatCards */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Registered Users"
          value={dashboardStats.totalUsers}
          icon={Users}
          colorClass="text-brand-secondary bg-indigo-500/10"
        />
        <StatCard
          title="Total Debt Managed"
          value={`Rs. ${dashboardStats.totalDebtManaged.toLocaleString()}`}
          icon={Coins}
          colorClass="text-emerald-400 bg-emerald-500/10"
        />
        <StatCard
          title="System Average Recovery Score"
          value={`${dashboardStats.averageRecoveryScore} / 100`}
          icon={Award}
          colorClass="text-brand-primary bg-emerald-500/10"
        />
        <StatCard
          title="Common Loan Category"
          value={dashboardStats.mostCommonLoanType}
          icon={HeartHandshake}
          colorClass="text-cyan-400 bg-cyan-500/10"
        />
      </div>

      {/* Grid: charts and financial overview */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Language Usage distribution chart */}
        <div class="bg-brand-card border border-slate-800/80 p-6 rounded-2xl lg:col-span-2 space-y-4">
          <div class="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">
            <Languages size={16} class="text-brand-primary" />
            <span>Regional Language Preferences</span>
          </div>
          <div class="h-60 mt-4 text-xs font-semibold">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={languageData}>
                <XAxis dataKey="name" stroke="#64748B" />
                <YAxis stroke="#64748B" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1E293B', borderRadius: '12px' }}
                />
                <Bar dataKey="count" fill="#10B981" radius={[8, 8, 0, 0]}>
                  {languageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Financial aggregates */}
        {financialSummary && (
          <div class="bg-brand-card border border-slate-800/80 p-6 rounded-2xl flex flex-col justify-between">
            <div class="space-y-4">
              <h3 class="text-sm font-bold text-white uppercase tracking-wider">Financial Aggregates</h3>
              <p class="text-[10px] text-brand-muted font-medium mb-4">Total platform volume totals.</p>

              <div class="space-y-3 pt-2">
                <div class="flex justify-between text-xs py-1 border-b border-slate-800/60">
                  <span class="text-slate-400 font-medium font-sans">Total Member Income</span>
                  <span class="text-white font-bold">Rs. {financialSummary.totalIncome.toLocaleString()}</span>
                </div>
                <div class="flex justify-between text-xs py-1 border-b border-slate-800/60">
                  <span class="text-slate-400 font-medium font-sans">Total Member Expenses</span>
                  <span class="text-white font-bold">Rs. {financialSummary.totalExpenses.toLocaleString()}</span>
                </div>
                <div class="flex justify-between text-xs py-1 border-b border-slate-800/60">
                  <span class="text-slate-400 font-medium font-sans">Total Savings Volume</span>
                  <span class="text-white font-bold">Rs. {financialSummary.totalSavings.toLocaleString()}</span>
                </div>
                <div class="flex justify-between text-xs py-1 border-b border-slate-800/60">
                  <span class="text-slate-400 font-medium font-sans">Total EMIs Commitment</span>
                  <span class="text-white font-bold">Rs. {financialSummary.totalEMI.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 text-[10px] leading-relaxed text-slate-500 font-medium">
              Average Emergency coverage in system: <span class="text-white font-bold">{financialSummary.averageEmergencyCoverageMonths} months</span>.
            </div>
          </div>
        )}
      </div>

      {/* User Profiles Roster List */}
      <div class="bg-brand-card border border-slate-800/80 p-6 rounded-2xl space-y-4">
        <div class="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">
          <FileCheck2 size={16} />
          <span>User Profiles Roster</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs font-semibold">
            <thead>
              <tr class="border-b border-slate-800 text-slate-500 uppercase text-[9px] font-bold tracking-wider">
                <th class="py-3 px-4">Name</th>
                <th class="py-3 px-4">Email</th>
                <th class="py-3 px-4 text-center">Language</th>
                <th class="py-3 px-4 text-center">Role</th>
                <th class="py-3 px-4 text-right">Registration Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 text-slate-300">
              {userRoster.map((usr) => (
                <tr key={usr._id} class="hover:bg-slate-900/40 transition-colors">
                  <td class="py-3.5 px-4 text-white font-bold">{usr.name}</td>
                  <td class="py-3.5 px-4 font-mono text-[11px] text-slate-400">{usr.email}</td>
                  <td class="py-3.5 px-4 text-center">
                    <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] uppercase font-bold">
                      {usr.preferredLanguage}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 text-center">
                    <span class={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      usr.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {usr.role.toUpperCase()}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 text-right font-mono text-[10px] text-slate-500">
                    {new Date(usr.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
