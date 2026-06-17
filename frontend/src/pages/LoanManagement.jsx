import React, { useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../context/AuthContext';
import { getTranslation } from '../services/localizer';
import apiService from '../services/apiService';
import SkeletonScreen from '../components/SkeletonScreen';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  TrendingUp, 
  Landmark, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';

const LoanManagement = () => {
  const { user } = useContext(AuthContext);
  const lang = user?.preferredLanguage || 'en';

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [sortBy, setSortBy] = useState('remainingAmount');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm();

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const res = await apiService.loans.getAll();
      setLoans(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const openAddModal = () => {
    setErrorMsg('');
    setEditingLoan(null);
    reset({
      loanName: '',
      loanType: 'Personal Loan',
      principalAmount: '',
      remainingAmount: '',
      interestRate: '',
      emi: '',
      startDate: new Date().toISOString().substring(0, 10)
    });
    setModalOpen(true);
  };

  const openEditModal = (loan) => {
    setErrorMsg('');
    setEditingLoan(loan);
    reset({
      loanName: loan.loanName,
      loanType: loan.loanType,
      principalAmount: loan.principalAmount,
      remainingAmount: loan.remainingAmount,
      interestRate: loan.interestRate,
      emi: loan.emi,
      startDate: new Date(loan.startDate).toISOString().substring(0, 10)
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (data) => {
    setErrorMsg('');
    try {
      const payload = {
        ...data,
        principalAmount: parseFloat(data.principalAmount),
        remainingAmount: parseFloat(data.remainingAmount),
        interestRate: parseFloat(data.interestRate),
        emi: parseFloat(data.emi)
      };

      if (editingLoan) {
        await apiService.loans.update(editingLoan._id, payload);
      } else {
        await apiService.loans.create(payload);
      }
      setModalOpen(false);
      fetchLoans();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to save loan particulars.');
    }
  };

  const handleDeleteLoan = async (id) => {
    if (window.confirm('Are you sure you want to delete this loan account? This will permanentely affect forecasts and trends.')) {
      try {
        await apiService.loans.delete(id);
        fetchLoans();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Filter and Sort Math
  const filteredLoans = loans.filter((loan) => {
    const matchesSearch = loan.loanName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'All' || loan.loanType === filterType;
    return matchesSearch && matchesFilter;
  });

  const sortedLoans = [...filteredLoans].sort((a, b) => {
    if (sortBy === 'remainingAmount') return b.remainingAmount - a.remainingAmount;
    if (sortBy === 'interestRate') return b.interestRate - a.interestRate;
    if (sortBy === 'emi') return b.emi - a.emi;
    return 0;
  });

  if (loading) {
    return <SkeletonScreen.Table rows={5} />;
  }

  const loanTypes = [
    'Personal Loan',
    'Home Loan',
    'Education Loan',
    'Vehicle Loan',
    'Credit Card Debt',
    'Other'
  ];

  return (
    <div class="space-y-8 select-none">
      {/* Title */}
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black tracking-tight text-white">{getTranslation(lang, 'loans')} Management</h1>
          <p class="text-xs text-brand-muted font-medium mt-1">Add, update, or remove active liabilities and EMI parameters.</p>
        </div>
        <button
          onClick={openAddModal}
          class="bg-brand-primary text-black font-bold text-xs px-4 py-3 rounded-xl flex items-center gap-2 hover:bg-emerald-600 cursor-pointer self-start md:self-auto shadow-glow-primary transition-all duration-200 active:scale-[0.98]"
        >
          <Plus size={16} />
          <span>{getTranslation(lang, 'addLoan')}</span>
        </button>
      </div>

      {/* Search & Sort Panel */}
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 bg-brand-card border border-slate-800 p-4 rounded-2xl">
        {/* Search */}
        <div class="relative md:col-span-2">
          <Search size={16} class="absolute left-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            placeholder={getTranslation(lang, 'searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            class="w-full bg-slate-900/60 border border-slate-800 text-xs rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-brand-primary/45 transition-all font-medium"
          />
        </div>

        {/* Filter Type */}
        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            class="w-full bg-slate-900/60 border border-slate-800 text-xs rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/45 transition-all font-medium cursor-pointer"
          >
            <option value="All">All Types</option>
            {loanTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            class="w-full bg-slate-900/60 border border-slate-800 text-xs rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/45 transition-all font-medium cursor-pointer"
          >
            <option value="remainingAmount">Remaining Balance (High to Low)</option>
            <option value="interestRate">Interest Rate (High to Low)</option>
            <option value="emi">EMI (High to Low)</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      {sortedLoans.length > 0 ? (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedLoans.map((loan) => (
            <div key={loan._id} class="bg-brand-card border border-slate-800 p-6 rounded-2xl flex flex-col justify-between space-y-5 hover:border-slate-700/80 transition-all">
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="text-sm font-bold text-white tracking-wide">{loan.loanName}</h3>
                  <span class="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{loan.loanType}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(loan)}
                    class="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteLoan(loan._id)}
                    class="p-2 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Balances details */}
              <div class="space-y-3">
                <div class="flex items-baseline justify-between text-xs">
                  <span class="text-slate-400 font-medium">Balance</span>
                  <span class="text-white font-extrabold">Rs. {loan.remainingAmount.toLocaleString()}</span>
                </div>
                <div class="flex items-baseline justify-between text-xs">
                  <span class="text-slate-400 font-medium">EMI</span>
                  <span class="text-white font-bold">Rs. {loan.emi.toLocaleString()} / mo</span>
                </div>
                <div class="flex items-baseline justify-between text-xs">
                  <span class="text-slate-400 font-medium">Interest Rate</span>
                  <span class="text-brand-primary font-bold">{loan.interestRate}% APR</span>
                </div>
              </div>

              {/* Footer status */}
              <div class="pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] font-bold">
                <span class="text-slate-500 font-mono">Started: {new Date(loan.startDate).toLocaleDateString()}</span>
                <span class={`px-2 py-0.5 rounded-full ${
                  loan.status === 'Active' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-slate-800 text-slate-400'
                }`}>
                  {loan.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div class="bg-brand-card border border-slate-800 p-12 rounded-3xl text-center space-y-4 flex flex-col justify-center items-center">
          <HelpCircle size={40} class="text-slate-600" />
          <h3 class="text-sm font-bold text-white">No active loan accounts found</h3>
          <p class="text-xs text-brand-muted max-w-sm leading-relaxed">
            Create your loan parameters to simulate repayments and forecast payoff dates.
          </p>
        </div>
      )}

      {/* Create/Edit Modal Dialogue */}
      {modalOpen && (
        <div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-center items-center px-4 animate-fade-in select-none">
          <div class="max-w-md w-full bg-brand-card border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl relative">
            <h2 class="text-lg font-black text-white">{editingLoan ? getTranslation(lang, 'editLoan') : getTranslation(lang, 'addLoan')}</h2>

            {errorMsg && (
              <div class="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-start gap-3 text-xs font-semibold leading-relaxed">
                <AlertCircle size={16} class="shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(handleFormSubmit)} class="space-y-4">
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Loan Identifier Name</label>
                <input
                  type="text"
                  required
                  placeholder="HDFC Personal Loan"
                  {...register('loanName', { required: 'Loan name is required' })}
                  class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-medium"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Loan Type</label>
                  <select
                    {...register('loanType')}
                    class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-medium cursor-pointer"
                  >
                    {loanTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Interest Rate (% APR)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="10.5"
                    {...register('interestRate', { required: 'Interest rate is required' })}
                    class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-medium"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Principal Amount</label>
                  <input
                    type="number"
                    required
                    placeholder="200000"
                    {...register('principalAmount', { required: 'Principal is required' })}
                    class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-medium"
                  />
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Remaining Amount</label>
                  <input
                    type="number"
                    required
                    placeholder="150000"
                    {...register('remainingAmount', { required: 'Remaining amount is required' })}
                    class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-medium"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">EMI amount</label>
                  <input
                    type="number"
                    required
                    placeholder="8500"
                    {...register('emi', { required: 'EMI amount is required' })}
                    class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-medium"
                  />
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Start Date</label>
                  <input
                    type="date"
                    required
                    {...register('startDate', { required: 'Start date is required' })}
                    class="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 transition-all font-medium cursor-pointer"
                  />
                </div>
              </div>

              <div class="flex items-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  class="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3 rounded-xl cursor-pointer"
                >
                  {getTranslation(lang, 'cancel')}
                </button>
                <button
                  type="submit"
                  class="flex-1 bg-brand-primary hover:bg-emerald-600 text-black font-bold text-xs py-3 rounded-xl cursor-pointer"
                >
                  {getTranslation(lang, 'save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanManagement;
