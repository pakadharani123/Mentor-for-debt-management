import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getTranslation } from '../services/localizer';
import apiService from '../services/apiService';
import SkeletonScreen from '../components/SkeletonScreen';
import { History, CheckCircle, AlertTriangle, XCircle, Award } from 'lucide-react';

const PaymentTracker = () => {
  const { user } = useContext(AuthContext);
  const lang = user?.preferredLanguage || 'en';

  const [scoreData, setScoreData] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const scoreRes = await apiService.recoveryScore.get();
        setScoreData(scoreRes.data);

        const loanRes = await apiService.loans.getAll();
        setLoans(loanRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <SkeletonScreen.Table rows={6} />;
  }

  if (!scoreData) {
    return (
      <div class="bg-brand-card border border-slate-800 p-8 rounded-3xl text-center space-y-4 max-w-lg mx-auto mt-12 select-none">
        <AlertTriangle size={48} class="text-rose-400" />
        <h2 class="text-lg font-bold text-white">Metrics Unavailable</h2>
        <p class="text-xs text-brand-muted leading-relaxed">
          Create your financial profile and seed loans to visualize payment tracking dashboards.
        </p>
      </div>
    );
  }

  const compliance = scoreData.factors.paymentCompliance.value;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Paid':
        return <CheckCircle size={15} class="text-brand-primary" />;
      case 'Late':
        return <AlertTriangle size={15} class="text-orange-400" />;
      case 'Missed':
      default:
        return <XCircle size={15} class="text-rose-400" />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Paid': return 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20';
      case 'Late': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      case 'Missed':
      default: return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    }
  };

  // Re-map mock histories since we can fetch loans metadata to match names
  return (
    <div class="space-y-8 select-none font-sans">
      {/* Title */}
      <div>
        <h1 class="text-2xl font-black tracking-tight text-white">{getTranslation(lang, 'paymentTracker')}</h1>
        <p class="text-xs text-brand-muted font-medium mt-1">Review loan installment compliance rates and chronological payments timeline logs.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Compliance Card */}
        <div class="bg-brand-card border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
          <div class="space-y-4">
            <div class="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">
              <Award size={16} class="text-brand-primary" />
              <span>Compliance Rate</span>
            </div>
            
            <div class="text-center py-6">
              <span class="text-4xl font-extrabold text-white tracking-tight">{compliance}%</span>
              <p class="text-[10px] text-brand-muted font-medium uppercase tracking-wider mt-2">Active Compliance Index</p>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800/80 text-[10px] leading-relaxed text-slate-400">
            Compliance rate dictates your score weighting. Maintaining compliance above **95%** secures a max 15 points towards recovery.
          </div>
        </div>

        {/* Payments Logs Timeline */}
        <div class="bg-brand-card border border-slate-800 p-6 rounded-2xl lg:col-span-2 space-y-4">
          <div class="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">
            <History size={16} />
            <span>Installment Payment Logs</span>
          </div>

          {/* Simple Table representation of logs */}
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs font-semibold">
              <thead>
                <tr class="border-b border-slate-800 text-slate-500 uppercase text-[9px] font-bold tracking-wider">
                  <th class="py-3 px-4">Date</th>
                  <th class="py-3 px-4">Loan Account</th>
                  <th class="py-3 px-4 text-right">Amount Paid</th>
                  <th class="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              {/* Using realistic seed data mappings */}
              <tbody class="divide-y divide-slate-800/60 text-slate-300">
                {loans.length > 0 ? (
                  // Create some default payment row snapshots for visual presentation
                  loans.map((loan, idx) => (
                    <tr key={idx} class="hover:bg-slate-900/40 transition-colors">
                      <td class="py-3.5 px-4 font-mono text-[10px] text-slate-500">
                        {new Date(loan.startDate).toLocaleDateString()}
                      </td>
                      <td class="py-3.5 px-4 text-white font-bold">{loan.loanName}</td>
                      <td class="py-3.5 px-4 text-right">Rs. {loan.emi.toLocaleString()}</td>
                      <td class="py-3.5 px-4 flex justify-center">
                        <span class={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${getStatusClass(loan.status === 'Active' ? 'Paid' : 'Late')}`}>
                          {getStatusIcon(loan.status === 'Active' ? 'Paid' : 'Late')}
                          <span>{loan.status === 'Active' ? 'Paid' : 'Late'}</span>
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" class="py-12 text-center text-slate-500">
                      No payment records loaded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentTracker;
