import React, { useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../context/AuthContext';
import { getTranslation } from '../services/localizer';
import apiService from '../services/apiService';
import SkeletonScreen from '../components/SkeletonScreen';
import ExplainModal from '../components/ExplainModal';
import InsightCard from '../components/InsightCard';
import {
  Plus,
  Trash2,
  Receipt,
  PieChart as PieIcon,
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  Filter,
  TrendingDown,
  TrendingUp,
  Wallet,
  HelpCircle,
  Coins,
  Scale,
  Compass,
  Target
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

const EXPENSE_CATEGORIES = [
  'Food', 'Rent', 'Education', 'Healthcare',
  'Transport', 'Entertainment', 'Shopping', 'Utilities', 'Other'
];

const PAYMENT_METHODS = [
  'Cash', 'UPI', 'Net Banking', 'Credit Card', 'Debit Card', 'Cheque', 'Auto-Debit', 'Other'
];

const STATUS_CONFIG = {
  Paid:             { label: 'Paid',           icon: CheckCircle2,   color: 'text-emerald-400',  bg: 'bg-emerald-500/10 border-emerald-500/25', dot: 'bg-emerald-400' },
  Pending:          { label: 'Pending',        icon: Clock,          color: 'text-amber-400',    bg: 'bg-amber-500/10 border-amber-500/25',   dot: 'bg-amber-400' },
  Overdue:          { label: 'Overdue',        icon: AlertTriangle,  color: 'text-rose-400',     bg: 'bg-rose-500/10 border-rose-500/25',     dot: 'bg-rose-500' },
  'Partially Paid': { label: 'Partially Paid', icon: Coins,          color: 'text-cyan-400',     bg: 'bg-cyan-500/10 border-cyan-500/25',     dot: 'bg-cyan-400' },
  Upcoming:         { label: 'Upcoming',       icon: Clock,          color: 'text-purple-400',   bg: 'bg-purple-500/10 border-purple-500/25', dot: 'bg-purple-400' }
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
  const Icon = cfg.icon;
  return (
    <span class={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
      <Icon size={9} />
      {cfg.label}
    </span>
  );
};

const getSpendingInsight = (breakdown) => {
  if (!breakdown || breakdown.length === 0) return null;
  const sorted = [...breakdown].sort((a, b) => b.amount - a.amount);
  const highest = sorted[0];
  const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
  const pct = highest.percentage || (total > 0 ? Math.round((highest.amount / total) * 100) : 0);
  const savings10 = Math.round(highest.amount * 0.1);

  return {
    category: highest.category,
    percentage: pct,
    totalSpent: highest.amount,
    savings10: savings10
  };
};

const ExpenseTracker = () => {
  const { user } = useContext(AuthContext);
  const lang = user?.preferredLanguage || 'en';

  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ paidTotal: 0, pendingTotal: 0, overdueTotal: 0 });
  const [breakdown, setBreakdown] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [markPaidModal, setMarkPaidModal] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [explainType, setExplainType] = useState(null);

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm({
    defaultValues: { paymentStatus: 'Pending', category: 'Food', amountPaid: '0' }
  });
  const watchedStatus = watch('paymentStatus');
  const watchedAmount = watch('amount');

  const { register: paidReg, handleSubmit: paidSubmit, reset: paidReset } = useForm();

  const fetchExpenseData = async () => {
    setLoading(true);
    try {
      const expRes = await apiService.expenses.getAll();
      setExpenses(expRes.data);
      if (expRes.summary) setSummary(expRes.summary);

      const breakRes = await apiService.analytics.getExpenseBreakdown();
      setBreakdown(breakRes.data);

      try {
        const profRes = await apiService.profile.get();
        if (profRes.success) setProfile(profRes.data);
      } catch (_e) {}
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenseData(); }, []);

  const handleAddExpense = async (data) => {
    setErrorMsg('');
    try {
      const isPaid = data.paymentStatus === 'Paid';
      const isPartial = data.paymentStatus === 'Partially Paid';
      
      const amt = parseFloat(data.amount);
      const amtPaid = isPaid ? amt : (isPartial ? parseFloat(data.amountPaid) || 0 : 0);

      if (isPartial && amtPaid >= amt) {
        setErrorMsg('Amount Paid cannot exceed or match total amount for a Partial status. Select Paid instead.');
        return;
      }

      const payload = {
        amount: amt,
        category: data.category,
        description: data.description,
        dueDate: data.dueDate || null,
        paymentStatus: data.paymentStatus || 'Pending',
        amountPaid: amtPaid,
        paidDate: (isPaid || isPartial) ? (data.paidDate || new Date().toISOString().split('T')[0]) : null,
        paymentMethod: (isPaid || isPartial) ? (data.paymentMethod || null) : null,
        notes: data.notes || null
      };

      await apiService.expenses.create(payload);
      setAddModalOpen(false);
      reset();
      fetchExpenseData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to record expense.');
    }
  };

  const handleMarkAsPaid = async (data) => {
    if (!markPaidModal) return;
    try {
      await apiService.expenses.markAsPaid(markPaidModal._id, {
        paidDate: data.paidDate || new Date().toISOString().split('T')[0],
        paymentMethod: data.paymentMethod || null
      });
      setMarkPaidModal(null);
      paidReset();
      fetchExpenseData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('Delete this expense entry?')) {
      try {
        await apiService.expenses.delete(id);
        fetchExpenseData();
      } catch (err) { console.error(err); }
    }
  };

  if (loading) return <SkeletonScreen.Table rows={6} />;

  const filtered = filterStatus === 'All' ? expenses : expenses.filter(e => e.paymentStatus === filterStatus);
  const totalLedgerOutflow = summary.paidTotal + summary.pendingTotal + summary.overdueTotal;

  const barData = [
    { name: 'Paid Portions', amount: summary.paidTotal, fill: '#10B981' },
    { name: 'Pending/Upcoming', amount: summary.pendingTotal, fill: '#F59E0B' },
    { name: 'Overdue Outflow', amount: summary.overdueTotal, fill: '#EF4444' }
  ];

  const COLORS = ['#10B981', '#6366F1', '#EC4899', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444', '#06B6D4', '#64748B'];

  return (
    <div class="space-y-6 select-none font-sans text-slate-300">
      {/* Title Row */}
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 class="text-2xl font-black tracking-tight text-white">{getTranslation(lang, 'expenses')} Ledger</h1>
          <p class="text-xs text-brand-muted font-medium mt-0.5">
            Manage your actual cash outflows. Sourced directly from the Expense Ledger.
          </p>
        </div>
        <button
          onClick={() => { setErrorMsg(''); reset({ paymentStatus: 'Pending', category: 'Food', amountPaid: '0' }); setAddModalOpen(true); }}
          class="bg-brand-primary text-black font-bold text-xs px-4 py-3 rounded-xl flex items-center gap-2 hover:bg-emerald-600 cursor-pointer shadow-glow-primary transition-all active:scale-[0.98]"
        >
          <Plus size={15} /> Add Ledger Expense
        </button>
      </div>

      {/* Split Comparison Banner */}
      {profile && (
        <div class="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
              <Scale size={20} />
            </div>
            <div class="text-xs">
              <h4 class="font-bold text-white">Estimated Profile Expenses vs Expense Ledger</h4>
              <p class="text-indigo-300 mt-0.5">
                Your profile holds an estimated lifestyle expense of <strong class="text-white">Rs. {profile.monthlyExpenses.toLocaleString()}</strong> (used for Recovery Score). Your actual ledger contains <strong class="text-white">Rs. {totalLedgerOutflow.toLocaleString()}</strong> in recorded expenses this month.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Logged Ledger', value: `Rs. ${totalLedgerOutflow.toLocaleString()}`, icon: Receipt, color: 'text-slate-300 bg-slate-800/50', border: 'border-slate-700/50', key: 'EXPENSES_LEDGER' },
          { label: '✅ Confirm Paid Portions', value: `Rs. ${summary.paidTotal.toLocaleString()}`, sub: `${summary.paidCount} paid fully`, icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10', border: 'border-emerald-500/20', key: 'SURPLUS' },
          { label: '⏳ Pending/Upcoming', value: `Rs. ${summary.pendingTotal.toLocaleString()}`, sub: `${summary.pendingCount} unpaid / ${summary.partialCount || 0} partial`, icon: Clock, color: 'text-amber-400 bg-amber-500/10', border: 'border-amber-500/20' },
          { label: '🔴 Overdue Balance', value: `Rs. ${summary.overdueTotal.toLocaleString()}`, sub: `${summary.overdueCount} past due`, icon: AlertTriangle, color: 'text-rose-400 bg-rose-500/10', border: 'border-rose-500/20' }
        ].map(card => (
          <div key={card.label} class={`bg-brand-card border ${card.border} p-4 rounded-2xl flex items-start justify-between gap-3`}>
            <div class="flex items-start gap-3">
              <div class={`p-2 rounded-xl ${card.color}`}>
                <card.icon size={16} />
              </div>
              <div>
                <p class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{card.label}</p>
                <p class="text-base font-black text-white mt-0.5">{card.value}</p>
                {card.sub && <p class="text-[9px] text-slate-500 mt-0.5">{card.sub}</p>}
                <p class="text-[8px] text-slate-600 font-medium mt-1">This value originates from Expense Ledger</p>
              </div>
            </div>
            {card.key && (
              <button 
                onClick={() => setExplainType(card.key)}
                class="text-slate-600 hover:text-white transition-colors cursor-pointer"
                title="Explain calculation details"
              >
                <HelpCircle size={13} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Warning for overdue */}
      {summary.overdueTotal > 0 && (
        <div class="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle size={18} class="text-rose-400 shrink-0" />
          <div class="text-xs">
            <span class="font-bold text-rose-300">Overdue Alert: </span>
            <span class="text-rose-400">You have Rs. {summary.overdueTotal.toLocaleString()} in overdue unpaid ledger bills. Please settle them to prevent negative recovery score impacts.</span>
          </div>
        </div>
      )}

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Ledger Table */}
        <div class="bg-brand-card border border-slate-800/80 p-6 rounded-2xl lg:col-span-2 space-y-4">
          <div class="flex items-center justify-between flex-wrap gap-3">
            <div class="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider">
              <Receipt size={14} />
              <span>Transaction Ledger</span>
            </div>
            <div class="flex items-center gap-1.5">
              <Filter size={12} class="text-slate-500" />
              {['All', 'Paid', 'Pending', 'Overdue', 'Partially Paid', 'Upcoming'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  class={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer border ${filterStatus === s
                    ? s === 'Paid' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : s === 'Pending' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : s === 'Overdue' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          : s === 'Partially Paid' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                            : s === 'Upcoming' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                              : 'bg-brand-primary/20 text-brand-primary border-brand-primary/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs font-semibold">
              <thead>
                <tr class="border-b border-slate-800 text-slate-500 uppercase text-[9px] font-bold tracking-wider">
                  <th class="py-3 px-3">Category</th>
                  <th class="py-3 px-3">Description</th>
                  <th class="py-3 px-3">Due Date</th>
                  <th class="py-3 px-3 text-right">Total Amount</th>
                  <th class="py-3 px-3 text-right">Paid Portion</th>
                  <th class="py-3 px-3 text-center">Status</th>
                  <th class="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 text-slate-300">
                {filtered.length > 0 ? (
                  filtered.map(exp => {
                    return (
                      <tr key={exp._id} class="hover:bg-slate-900/40 transition-colors">
                        <td class="py-3 px-3">
                          <span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[9px] font-bold">
                            {exp.category}
                          </span>
                        </td>
                        <td class="py-3 px-3 truncate max-w-[120px] text-[11px]" title={exp.description}>
                          {exp.description || '-'}
                        </td>
                        <td class="py-3 px-3 font-mono text-[10px] text-slate-500">
                          {exp.dueDate ? new Date(exp.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-'}
                        </td>
                        <td class="py-3 px-3 text-right text-white font-extrabold">
                          Rs. {exp.amount.toLocaleString()}
                        </td>
                        <td class="py-3 px-3 text-right text-emerald-400 font-extrabold">
                          Rs. {(exp.amountPaid || 0).toLocaleString()}
                        </td>
                        <td class="py-3 px-3 text-center">
                          <StatusBadge status={exp.paymentStatus} />
                        </td>
                        <td class="py-3 px-3 text-center">
                          <div class="flex items-center justify-center gap-1.5">
                            {exp.paymentStatus !== 'Paid' && (
                              <button
                                onClick={() => { paidReset({ paidDate: new Date().toISOString().split('T')[0] }); setMarkPaidModal(exp); }}
                                class="text-emerald-400 hover:text-emerald-300 p-1 rounded hover:bg-emerald-500/10 transition-colors text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                                title="Mark as Paid"
                              >
                                <CheckCircle2 size={12} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteExpense(exp._id)}
                              class="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" class="py-12 text-center text-slate-500 text-xs">
                      No expenses logged. Add your first expense.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Columns: Charts */}
        <div class="space-y-6">
          {/* Spending Insights Card */}
          {breakdown && breakdown.length > 0 && (() => {
            const insight = getSpendingInsight(breakdown);
            if (!insight) return null;
            return (
              <div className="bg-brand-card border border-indigo-500/20 p-5 rounded-2xl shadow-glow-secondary space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <Compass size={14} />
                  <span>Spending Insights</span>
                </div>
                <div className="space-y-3 text-xs leading-relaxed text-slate-350">
                  <p>
                    <strong className="text-white">{insight.category}</strong> spending is <strong className="text-rose-450">{insight.percentage}%</strong> of total expenses.
                  </p>
                  <p>
                    <strong className="text-white">{insight.category}</strong> is your highest spending category this month, totaling <strong className="text-white">Rs. {insight.totalSpent.toLocaleString()}</strong>.
                  </p>
                  <p className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-brand-primary font-bold">
                    Reducing {insight.category.toLowerCase()} spending by 10% could save <span className="text-emerald-400">Rs. {insight.savings10.toLocaleString()}</span> monthly!
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Payment Status Bar Chart */}
          <div class="bg-brand-card border border-slate-800/80 p-5 rounded-2xl">
            <div class="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider mb-4">
              <Wallet size={14} />
              <span>Payment Status Ledger</span>
            </div>
            <div class="h-40 text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748B" tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#1E293B', borderRadius: '10px' }}
                    formatter={v => [`Rs. ${v.toLocaleString()}`, 'Amount']}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Paid Expenses Pie */}
          <div class="bg-brand-card border border-slate-800/80 p-5 rounded-2xl flex flex-col items-center">
            <div class="w-full flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider mb-4">
              <PieIcon size={14} />
              <span>Paid Outflow by Category</span>
            </div>
            <div class="w-full h-52 text-xs font-semibold">
              {breakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={breakdown} cx="50%" cy="45%" innerRadius={42} outerRadius={68}
                      paddingAngle={3} dataKey="amount" nameKey="category">
                      {breakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#1E293B', borderRadius: '12px' }}
                      formatter={val => `Rs. ${val.toLocaleString()}`}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={7}
                      formatter={(value, entry) => {
                        const item = breakdown.find(b => b.category === value);
                        return `${value} (${item ? item.percentage : 0}%)`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div class="h-full flex items-center justify-center text-slate-500 text-center text-xs leading-relaxed">
                  Mark expenses as Paid to see outflow breakdown.
                </div>
              )}
            </div>
          </div>

          {/* Chart Explanation Guide */}
          <div class="bg-brand-card border border-slate-800/80 p-5 rounded-2xl space-y-3">
            <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle size={14} class="text-brand-primary" />
              Chart Guide & Math
            </h4>
            <div class="space-y-2.5 text-[11px] text-slate-400 leading-relaxed font-medium">
              <div>
                <span class="font-bold text-slate-300">Data Source:</span> Sourced from current month transaction ledger entries.
              </div>
              <div>
                <span class="font-bold text-slate-300">Calculation Method:</span> 
                <ul class="list-disc pl-4 mt-1 space-y-1">
                  <li>Payment Status: sum of amountPaid values vs outstanding balances grouped by category.</li>
                  <li>Outflow Breakdown: actual paid cash portions summed by categories.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Coach InsightCard */}
          {(() => {
            const insight = getSpendingInsight(breakdown);
            return (
              <InsightCard 
                title="Expense Coach Advice"
                problem={
                  insight 
                    ? `Your discretionary spending in ${insight.category} represents ${insight.percentage}% of your outflow.`
                    : "No categories recorded yet."
                }
                whyItMatters="Discretionary cash leaks directly compete with your ability to make extra payments on high-interest loans."
                recommendedAction={
                  insight 
                    ? `Establish a strict budget ceiling for ${insight.category} and funnel the savings to debt.`
                    : "Track all monthly cash outflows in the ledger."
                }
                expectedBenefit={
                  insight 
                    ? `Frees up to ₹${insight.savings10.toLocaleString()}/month to prepay principal and raise Recovery Score.`
                    : "Provides transparent cash flow analysis."
                }
              />
            );
          })()}
        </div>
      </div>

      {/* ── Add Expense Modal ─────────────────────────────────────────────── */}
      {addModalOpen && (
        <div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-center items-center px-4 animate-fade-in select-none">
          <div class="max-w-lg w-full bg-brand-card border border-slate-800 rounded-3xl p-8 space-y-5 shadow-2xl">
            <h2 class="text-lg font-black text-white">Record Expense</h2>

            {errorMsg && (
              <div class="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl flex gap-3 text-xs font-semibold">
                <AlertCircle size={15} class="shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(handleAddExpense)} class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[9px] font-bold text-slate-400 uppercase mb-1">Amount (Rs.)</label>
                  <span class="block text-[8px] text-slate-500 mb-1">Originates from Expense Ledger</span>
                  <input type="number" step="0.01" required placeholder="5000"
                    {...register('amount', { required: true })}
                    class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-medium" />
                </div>
                <div>
                  <label class="block text-[9px] font-bold text-slate-400 uppercase mb-1">Category</label>
                  <span class="block text-[8px] text-slate-500 mb-1">Originates from Expense Ledger</span>
                  <select {...register('category')}
                    class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-medium cursor-pointer font-semibold">
                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-[9px] font-bold text-slate-400 uppercase mb-1">Due Date</label>
                <span class="block text-[8px] text-slate-500 mb-1">Originates from Expense Ledger</span>
                <input type="date" {...register('dueDate')}
                  class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-medium cursor-pointer" />
              </div>

              <div>
                <label class="block text-[9px] font-bold text-slate-400 uppercase mb-1">Description / Vendor</label>
                <span class="block text-[8px] text-slate-500 mb-1">Originates from Expense Ledger</span>
                <input type="text" placeholder="Grocery store, electricity bill..." {...register('description')}
                  class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-medium" />
              </div>

              {/* Payment Status Dropdown selection */}
              <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <label class="block text-[9px] font-bold text-slate-350 uppercase tracking-wider">Payment Status Selection</label>
                <span class="block text-[8px] text-slate-500">Originates from Expense Ledger</span>
                <select
                  {...register('paymentStatus')}
                  class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-medium cursor-pointer font-bold"
                >
                  <option value="Pending">Pending (Not paid yet)</option>
                  <option value="Upcoming">Upcoming (Future due date)</option>
                  <option value="Overdue">Overdue (Due date passed & unpaid)</option>
                  <option value="Partially Paid">Partially Paid (Paid a portion)</option>
                  <option value="Paid">Paid (Fully paid & confirmed)</option>
                </select>
              </div>

              {/* Conditional paid portions input */}
              {watchedStatus === 'Partially Paid' && (
                <div class="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl space-y-3">
                  <label class="block text-[9px] font-bold text-cyan-400 uppercase">Amount Paid (Rs.)</label>
                  <span class="block text-[8px] text-slate-500">Originates from Expense Ledger</span>
                  <input type="number" step="0.01" required placeholder="Paid portion"
                    {...register('amountPaid')}
                    class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/40 transition-all font-medium" />
                </div>
              )}

              {/* Conditional paid method & date fields */}
              {(watchedStatus === 'Paid' || watchedStatus === 'Partially Paid') && (
                <div class="grid grid-cols-2 gap-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <div>
                    <label class="block text-[9px] font-bold text-emerald-400 uppercase mb-1">Payment Date</label>
                    <span class="block text-[8px] text-slate-500 mb-1">Originates from Expense Ledger</span>
                    <input type="date" {...register('paidDate')}
                      defaultValue={new Date().toISOString().split('T')[0]}
                      class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/40 transition-all font-medium cursor-pointer font-semibold" />
                  </div>
                  <div>
                    <label class="block text-[9px] font-bold text-emerald-400 uppercase mb-1">Payment Method</label>
                    <span class="block text-[8px] text-slate-500 mb-1">Originates from Expense Ledger</span>
                    <select {...register('paymentMethod')}
                      class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/40 transition-all font-medium cursor-pointer font-semibold">
                      <option value="">Select method...</option>
                      {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div class="flex items-center gap-3 pt-2">
                <button type="button" onClick={() => setAddModalOpen(false)}
                  class="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3 rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button type="submit"
                  class="flex-1 bg-brand-primary hover:bg-emerald-600 text-black font-bold text-xs py-3 rounded-xl cursor-pointer">
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Mark As Paid Modal ────────────────────────────────────────────── */}
      {markPaidModal && (
        <div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-center items-center px-4 animate-fade-in select-none">
          <div class="max-w-sm w-full bg-brand-card border border-slate-800 rounded-3xl p-7 space-y-5 shadow-2xl">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
                <CreditCard size={18} />
              </div>
              <div>
                <h2 class="text-base font-black text-white">Confirm Payment</h2>
                <p class="text-[10px] text-brand-muted">{markPaidModal.category} · Rs. {markPaidModal.amount?.toLocaleString()}</p>
              </div>
            </div>

            <form onSubmit={paidSubmit(handleMarkAsPaid)} class="space-y-4">
              <div>
                <label class="block text-[9px] font-bold text-slate-400 uppercase mb-1">Payment Date</label>
                <span class="block text-[8px] text-slate-500 mb-1">Originates from Expense Ledger</span>
                <input type="date" {...paidReg('paidDate')}
                  defaultValue={new Date().toISOString().split('T')[0]}
                  class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/40 transition-all font-medium cursor-pointer font-semibold" />
              </div>
              <div>
                <label class="block text-[9px] font-bold text-slate-400 uppercase mb-1">Payment Method</label>
                <span class="block text-[8px] text-slate-500 mb-1">Originates from Expense Ledger</span>
                <select {...paidReg('paymentMethod')}
                  class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/40 transition-all font-medium cursor-pointer font-semibold">
                  <option value="">Select (optional)...</option>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div class="flex items-center gap-3 pt-1">
                <button type="button" onClick={() => setMarkPaidModal(null)}
                  class="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3 rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button type="submit"
                  class="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2">
                  <CheckCircle2 size={14} /> Confirm Paid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Explain Modal */}
      {explainType && (
        <ExplainModal
          metricType={explainType}
          data={{
            value: totalLedgerOutflow,
            monthlyIncome: profile?.monthlyIncome || 0,
            expenseStatus: {
              actualPaidTotal: summary.paidTotal,
              pendingObligations: summary.pendingTotal,
              overdueObligations: summary.overdueTotal
            },
            totalEMI: summary.paidTotal // pass placeholder or appropriate values
          }}
          onClose={() => setExplainType(null)}
        />
      )}
    </div>
  );
};

export default ExpenseTracker;
