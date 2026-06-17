import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getTranslation } from '../services/localizer';
import apiService from '../services/apiService';
import {
  Bot,
  Send,
  HelpCircle,
  Sparkles,
  AlertTriangle,
  CheckSquare,
  PiggyBank,
  Clock,
  User,
  RotateCcw,
  ArrowRight,
  Brain,
  Calculator,
  TrendingUp,
  Zap,
  Search,
  Trash2,
  History,
  ChevronRight,
  MapPin,
  X,
  MessageSquare,
  Edit2,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Intent metadata ────────────────────────────────────────────────────────
const INTENT_LABELS = {
  RECOVERY_SCORE:  { label: 'Recovery Score',   color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/20' },
  SIMULATOR:       { label: 'EMI Simulator',     color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
  FORECAST:        { label: 'Debt Forecast',     color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/20' },
  LOAN_PRIORITY:   { label: 'Loan Priority',     color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20' },
  DEBT_REDUCTION:  { label: 'Debt Reduction',    color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20' },
  EMERGENCY_FUND:  { label: 'Emergency Fund',    color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/20' },
  BUDGETING:       { label: 'Budgeting',         color: 'text-green-400',   bg: 'bg-green-500/10 border-green-500/20' },
  DTI:             { label: 'DTI Ratio',         color: 'text-pink-400',    bg: 'bg-pink-500/10 border-pink-500/20' },
  PAYMENT_HISTORY: { label: 'Payment History',   color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
  GENERAL:         { label: 'General',           color: 'text-slate-400',   bg: 'bg-slate-500/10 border-slate-500/20' }
};

// ─── Relative time helper ───────────────────────────────────────────────────
const relativeTime = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// ─── Score ring color ────────────────────────────────────────────────────────
const scoreColor = (score) => {
  if (!score) return 'text-slate-500';
  if (score >= 86) return 'text-emerald-400';
  if (score >= 71) return 'text-cyan-400';
  if (score >= 51) return 'text-blue-400';
  if (score >= 31) return 'text-orange-400';
  return 'text-rose-400';
};

// ─── AI Response display ─────────────────────────────────────────────────────
// ─── AI Response display ─────────────────────────────────────────────────────
const AIResponseCard = ({ answer }) => {
  const [activeTab, setActiveTab] = useState('advice');

  if (!answer) return null;
  const intentMeta = INTENT_LABELS[answer.intent] || INTENT_LABELS.GENERAL;

  return (
    <div class="space-y-4">
      {/* Header */}
      <div class="flex justify-between items-center border-b border-slate-800 pb-2.5 flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <Bot size={14} class="text-brand-primary" />
          <span class="text-[10px] font-extrabold text-white uppercase tracking-wider">Coach Advice</span>
        </div>
        <div class="flex items-center gap-2">
          <span class={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${intentMeta.bg} ${intentMeta.color}`}>
            {intentMeta.label}
          </span>
          <span class="text-[8px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase">
            {answer.provider || 'mock'}
          </span>
        </div>
      </div>

      {/* Interactive Explanation Tabs */}
      <div class="flex border-b border-slate-800/80 text-[10px] font-extrabold uppercase tracking-wider gap-3 pb-0.5">
        <button 
          onClick={() => setActiveTab('advice')} 
          class={`pb-1.5 px-0.5 cursor-pointer transition-all border-b-2 ${activeTab === 'advice' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          Advice
        </button>
        <button 
          onClick={() => setActiveTab('math')} 
          class={`pb-1.5 px-0.5 cursor-pointer transition-all border-b-2 ${activeTab === 'math' ? 'border-indigo-400 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          Compounding Math
        </button>
        <button 
          onClick={() => setActiveTab('data')} 
          class={`pb-1.5 px-0.5 cursor-pointer transition-all border-b-2 ${activeTab === 'data' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          Data Sourced
        </button>
        <button 
          onClick={() => setActiveTab('heuristics')} 
          class={`pb-1.5 px-0.5 cursor-pointer transition-all border-b-2 ${activeTab === 'heuristics' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          AI Heuristics
        </button>
      </div>

      {/* Tab Panels */}
      <div class="pt-1 select-text">
        {activeTab === 'advice' && (
          <div class="space-y-4">
            {/* Direct Answer */}
            {answer.directAnswer && (
              <div class="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-3.5">
                <div class="flex items-center gap-1.5 text-brand-primary font-bold text-[9px] uppercase tracking-wider mb-1.5">
                  <Zap size={11} />
                  <span>Direct Answer</span>
                </div>
                <p class="text-xs text-slate-200 leading-relaxed font-medium">{answer.directAnswer}</p>
              </div>
            )}

            {/* Summary */}
            {answer.summary && answer.summary !== answer.directAnswer && (
              <p class="text-xs text-slate-400 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-900 font-medium">
                {answer.summary}
              </p>
            )}

            {/* Warnings */}
            {answer.warnings?.length > 0 && (
              <div class="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl space-y-1.5">
                <div class="flex items-center gap-1.5 font-bold text-[9px] uppercase tracking-wider">
                  <AlertTriangle size={11} />
                  <span>Risk Warnings</span>
                </div>
                <ul class="space-y-1 text-xs font-semibold">
                  {answer.warnings.map((w, idx) => <li key={idx} class="leading-relaxed">• {w}</li>)}
                </ul>
              </div>
            )}

            {/* Recommendations + Tips */}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              {answer.recommendations?.length > 0 && (
                <div class="space-y-2">
                  <div class="flex items-center gap-1.5 text-brand-primary font-bold text-[9px] uppercase tracking-wider">
                    <CheckSquare size={11} />
                    <span>Recommendations</span>
                  </div>
                  <ul class="space-y-1.5 text-xs text-slate-400 font-medium">
                    {answer.recommendations.map((rec, idx) => <li key={idx} class="leading-relaxed">• {rec}</li>)}
                  </ul>
                </div>
              )}
              {answer.budgetingTips?.length > 0 && (
                <div class="space-y-2">
                  <div class="flex items-center gap-1.5 text-indigo-400 font-bold text-[9px] uppercase tracking-wider">
                    <PiggyBank size={11} />
                    <span>Budgeting Tips</span>
                  </div>
                  <ul class="space-y-1.5 text-xs text-slate-400 font-medium">
                    {answer.budgetingTips.map((tip, idx) => <li key={idx} class="leading-relaxed">• {tip}</li>)}
                  </ul>
                </div>
              )}
            </div>

            {/* Next Actions */}
            {answer.nextActions?.length > 0 && (
              <div class="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3.5 space-y-2">
                <div class="flex items-center gap-1.5 text-emerald-400 font-bold text-[9px] uppercase tracking-wider">
                  <ArrowRight size={11} />
                  <span>Immediate Next Steps</span>
                </div>
                <ol class="space-y-1.5">
                  {answer.nextActions.map((action, idx) => (
                    <li key={idx} class="text-xs text-emerald-300 leading-relaxed flex items-start gap-2">
                      <span class="shrink-0 w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[8px] font-bold flex items-center justify-center mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {activeTab === 'math' && (
          <div class="space-y-4">
            <div>
              <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Compounding Math Formulas</span>
              <pre class="font-mono text-[10px] bg-slate-950 p-4 border border-indigo-950/40 rounded-xl leading-relaxed text-indigo-300 overflow-x-auto whitespace-pre-wrap">
                {answer.calculation || 'No mathematical formula string provided.'}
              </pre>
            </div>
            {answer.calculationExplanation && (
              <div class="bg-indigo-500/5 border border-indigo-500/20 text-indigo-200 p-4 rounded-xl space-y-1.5">
                <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Arithmetic Audit Steps</span>
                <p class="text-xs leading-relaxed font-semibold">{answer.calculationExplanation}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'data' && (
          <div class="space-y-4">
            <div class="flex justify-between items-center bg-slate-950/60 p-3 rounded-xl border border-slate-900">
              <span class="text-xs font-semibold text-slate-400">Context Reliability Rating:</span>
              <span class={`text-[9px] font-extrabold px-2.5 py-1 rounded-full border uppercase ${
                answer.confidenceLevel === 'High' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' :
                answer.confidenceLevel === 'Medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/25' :
                'text-rose-400 bg-rose-500/10 border-rose-500/25'
              }`}>
                {answer.confidenceLevel || 'Medium'} Confidence
              </span>
            </div>
            
            <div class="space-y-2">
              <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Context Sourced Data Variables</span>
              {answer.dataUsed && Object.keys(answer.dataUsed).length > 0 ? (
                <div class="overflow-x-auto border border-slate-800 rounded-xl">
                  <table class="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr class="bg-slate-900/60 text-[9px] font-bold text-slate-500 uppercase border-b border-slate-800">
                        <th class="py-2 px-3">Variable Sourced</th>
                        <th class="py-2 px-3 text-right">Value Used</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60 font-semibold">
                      {Object.entries(answer.dataUsed).map(([k, v]) => (
                        <tr key={k} class="hover:bg-slate-900/20">
                          <td class="py-2 px-3 text-slate-400 font-mono text-[10px]">{k}</td>
                          <td class="py-2 px-3 text-right text-indigo-300 font-mono">
                            {typeof v === 'number' ? v.toLocaleString() : String(v)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p class="text-[11px] text-slate-500 italic">No structured data variables captured in context payload.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'heuristics' && (
          <div class="space-y-2">
            <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Strategic Heuristic Logic</span>
            <p class="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-900 font-semibold">
              {answer.whyRecommendation || 'No heuristic reasoning trace was provided.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const AICoach = () => {
  const { user } = useContext(AuthContext);
  const lang = user?.preferredLanguage || 'en';

  // Active chat thread state
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [activeMessages, setActiveMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  // EMI Simulator parameters context
  const [loans, setLoans] = useState([]);
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [proposedEmiInput, setProposedEmiInput] = useState('');

  // Persistent threads list
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Thread title renaming state
  const [editingThreadId, setEditingThreadId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  const chatEndRef = useRef(null);

  // ── Fetch persistent threads ──────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    try {
      const res = await apiService.ai.getHistory();
      if (res.success) setHistory(res.data);
    } catch (err) {
      console.error('Failed to load AI history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // ── Initial data loads ────────────────────────────────────────────────────
  useEffect(() => {
    fetchHistory();
    const fetchLoans = async () => {
      try {
        const res = await apiService.loans.getAll();
        const active = res.data.filter(l => l.status === 'Active');
        setLoans(active);
        if (active.length > 0) {
          setSelectedLoanId(active[0]._id);
          setProposedEmiInput(active[0].emi + 3000);
        }
      } catch (err) { console.error(err); }
    };
    fetchLoans();
  }, [fetchHistory]);

  // ── Auto-scroll to bottom ─────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages, loading]);

  // ── Start a new blank chat thread ─────────────────────────────────────────
  const startNewChat = () => {
    setActiveThreadId(null);
    setActiveMessages([]);
    setPrompt('');
  };

  // ── Load a specific thread ────────────────────────────────────────────────
  const selectThread = async (id) => {
    if (activeThreadId === id) return;
    setLoading(true);
    setActiveThreadId(id);
    try {
      const res = await apiService.ai.getHistoryById(id);
      if (res.success) {
        setActiveMessages(res.data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load thread messages:', err);
      setActiveMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Handle inline rename activation ───────────────────────────────────────
  const startEditing = (e, id, title) => {
    e.stopPropagation();
    setEditingThreadId(id);
    setEditingTitle(title);
  };

  const handleRename = async (id) => {
    if (!editingTitle.trim()) {
      setEditingThreadId(null);
      return;
    }
    try {
      const res = await apiService.ai.renameHistory(id, editingTitle.trim());
      if (res.success) {
        setHistory(prev => prev.map(t => t._id === id ? { ...t, title: res.data.title } : t));
      }
    } catch (err) {
      console.error('Failed to rename thread:', err);
    } finally {
      setEditingThreadId(null);
    }
  };

  // ── Delete a single thread ────────────────────────────────────────────────
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this AI chat thread? All messages within this thread will be permanently deleted.')) return;
    setDeletingId(id);
    try {
      await apiService.ai.deleteHistory(id);
      setHistory(prev => prev.filter(h => h._id !== id));
      if (activeThreadId === id) {
        startNewChat();
      }
    } catch (err) {
      console.error('Failed to delete history thread:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Clear all history threads ─────────────────────────────────────────────
  const handleClearAll = async () => {
    if (!window.confirm('Clear all AI conversation history? This cannot be undone.')) return;
    try {
      await apiService.ai.clearHistory();
      setHistory([]);
      startNewChat();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportMarkdown = () => {
    if (activeMessages.length === 0) return;
    let md = `# AI Recovery Coach Discussion\n`;
    md += `Generated: ${new Date().toLocaleString()}\n`;
    md += `Conversation ID: ${activeThreadId || 'New Thread'}\n\n---\n\n`;
    
    activeMessages.forEach(msg => {
      const sender = msg.role === 'user' ? 'USER' : 'COACH';
      md += `### [${sender}] - ${msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ''}\n\n`;
      if (msg.role === 'user') {
        md += `${msg.content}\n\n`;
      } else {
        if (msg.content && typeof msg.content === 'object') {
          const ans = msg.content;
          md += `**Direct Answer:**\n${ans.directAnswer || ''}\n\n`;
          if (ans.summary) md += `**Summary:**\n${ans.summary}\n\n`;
          if (ans.calculation) md += `**Compounding Math:**\n\`\`\`\n${ans.calculation}\n\`\`\`\n\n`;
          if (ans.calculationExplanation) md += `**Steps:**\n${ans.calculationExplanation}\n\n`;
          if (ans.whyRecommendation) md += `**AI Heuristics:**\n${ans.whyRecommendation}\n\n`;
          if (ans.confidenceLevel) md += `**Confidence:** ${ans.confidenceLevel}\n\n`;
          if (ans.recommendations?.length > 0) {
            md += `**Recommendations:**\n`;
            ans.recommendations.forEach(r => md += `- ${r}\n`);
            md += `\n`;
          }
          if (ans.warnings?.length > 0) {
            md += `**Risk Warnings:**\n`;
            ans.warnings.forEach(w => md += `- ${w}\n`);
            md += `\n`;
          }
          if (ans.nextActions?.length > 0) {
            md += `**Immediate Steps:**\n`;
            ans.nextActions.forEach(a => md += `1. ${a}\n`);
            md += `\n`;
          }
        } else {
          md += `${msg.content || msg.error}\n\n`;
        }
      }
      md += `---\n\n`;
    });
    
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ai_coach_thread_${activeThreadId || 'new'}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Submit message / question ─────────────────────────────────────────────
  const executeQuery = async (questionText) => {
    if (!questionText?.trim() || loading) return;
    setLoading(true);

    // Optimistically add user query to messages UI
    const userMsg = { role: 'user', content: questionText, timestamp: new Date() };
    setActiveMessages(prev => [...prev, userMsg]);

    try {
      const payload = { userQuestion: questionText };
      if (activeThreadId) {
        payload.threadId = activeThreadId;
      }
      if (selectedLoanId && proposedEmiInput) {
        payload.loanId = selectedLoanId;
        payload.proposedEmi = parseFloat(proposedEmiInput);
      }
      const res = await apiService.ai.getAdvice(payload);
      if (res.success) {
        const assistantMsg = { role: 'assistant', content: res.data, timestamp: new Date() };
        setActiveMessages(prev => [...prev, assistantMsg]);
        
        // If a new thread was generated, update the active ID
        if (!activeThreadId && res.threadId) {
          setActiveThreadId(res.threadId);
        }
        // Refresh sidebar
        fetchHistory();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'AI Coach could not generate advice.';
      const errorMsgObj = { role: 'assistant', content: null, error: errorMessage, timestamp: new Date() };
      setActiveMessages(prev => [...prev, errorMsgObj]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || loading) return;
    const q = prompt;
    setPrompt('');
    await executeQuery(q);
  };

  // ── Filter threads list ───────────────────────────────────────────────────
  const filteredHistory = search.trim()
    ? history.filter(h => h.title.toLowerCase().includes(search.toLowerCase()))
    : history;

  const predefinedQuestions = [
    "Why is my recovery score low?",
    "Which loan should I pay off first?",
    "When will I become debt-free?",
    "What if I increase my EMI by Rs. 3000?",
    "How should I build my emergency fund?",
    "How can I improve my DTI ratio?"
  ];

  return (
    <div class="space-y-4 select-none font-sans">
      {/* Page Header */}
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Brain size={22} class="text-brand-primary" />
            {getTranslation(lang, 'aiCoach')} Advisor
          </h1>
          <p class="text-xs text-brand-muted font-medium mt-0.5">
            Persistent financial advisor — conversations saved across sessions.
          </p>
        </div>
        <div class="flex items-center gap-2">
          {activeMessages.length > 0 && (
            <button onClick={startNewChat}
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer">
              <RotateCcw size={12} /> New Chat
            </button>
          )}
          {activeMessages.length > 0 && (
            <button onClick={handleExportMarkdown}
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer">
              <Download size={12} /> Export Chat
            </button>
          )}
          {history.length > 0 && (
            <button onClick={handleClearAll}
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-900/60 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-400 transition-all cursor-pointer">
              <Trash2 size={12} /> Clear All History
            </button>
          )}
        </div>
      </div>

      {/* 3-Column Grid */}
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-4">

        {/* ─── LEFT: History Panel (3/12) ──────────────────────────────── */}
        <div class="xl:col-span-3 space-y-4">

          {/* History List */}
          <div class="bg-brand-card border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col max-h-[680px]">
            {/* Header */}
            <div class="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <History size={13} class="text-brand-primary" />
                <span class="text-[10px] font-bold text-white uppercase tracking-widest">History</span>
                {history.length > 0 && (
                  <span class="text-[9px] bg-brand-primary/20 text-brand-primary px-1.5 py-0.5 rounded-full font-bold">
                    {history.length}
                  </span>
                )}
              </div>
              <button onClick={startNewChat}
                class="flex items-center gap-1 px-2.5 py-1 rounded bg-brand-primary/10 border border-brand-primary/20 hover:bg-brand-primary/20 text-[9px] font-bold text-brand-primary transition-all cursor-pointer">
                + New Chat
              </button>
            </div>

            {/* Search */}
            <div class="px-3 py-2.5 border-b border-slate-800">
              <div class="relative">
                <Search size={11} class="absolute left-2.5 top-2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search discussions..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  class="w-full bg-slate-900 border border-slate-800 text-[11px] rounded-lg pl-7 pr-3 py-1.5 text-white placeholder-slate-600 focus:outline-none focus:border-brand-primary/40 transition-all"
                />
                {search && (
                  <button onClick={() => setSearch('')} class="absolute right-2 top-1.5 text-slate-500 hover:text-white cursor-pointer">
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>

            {/* Entries */}
            <div class="flex-1 overflow-y-auto scrollbar-thin">
              {historyLoading ? (
                <div class="p-4 space-y-2">
                  {[1,2,3].map(i => (
                    <div key={i} class="h-14 bg-slate-800/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredHistory.length === 0 ? (
                <div class="p-6 text-center">
                  <MessageSquare size={32} class="text-slate-700 mx-auto mb-2" />
                  <p class="text-[10px] text-slate-500">
                    {search ? 'No matching conversations.' : 'No history yet. Ask your first question!'}
                  </p>
                </div>
              ) : (
                <div class="divide-y divide-slate-800/50">
                  {filteredHistory.map(entry => {
                    const isActive = activeThreadId === entry._id;
                    const isEditing = editingThreadId === entry._id;
                    return (
                      <div
                        key={entry._id}
                        onClick={() => !isEditing && selectThread(entry._id)}
                        class={`w-full text-left px-3 py-3 flex items-start gap-2.5 group transition-all cursor-pointer ${isActive ? 'bg-brand-primary/10 border-l-2 border-brand-primary' : 'hover:bg-slate-800/40'}`}
                      >
                        <div class="shrink-0 w-5 h-5 rounded-full bg-slate-800/80 flex items-center justify-center mt-0.5">
                          <MessageSquare size={10} class="text-slate-400" />
                        </div>
                        <div class="flex-1 min-w-0">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={e => setEditingTitle(e.target.value)}
                              onBlur={() => handleRename(entry._id)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleRename(entry._id);
                                if (e.key === 'Escape') setEditingThreadId(null);
                              }}
                              autoFocus
                              onClick={e => e.stopPropagation()}
                              class="w-full bg-slate-950 border border-slate-800 text-[11px] rounded px-1.5 py-0.5 text-white focus:outline-none focus:border-brand-primary/40"
                            />
                          ) : (
                            <p 
                              onDoubleClick={(e) => startEditing(e, entry._id, entry.title)}
                              class="text-[11px] text-slate-300 font-medium leading-snug line-clamp-2 group-hover:text-white transition-colors"
                            >
                              {entry.title}
                            </p>
                          )}
                          <div class="flex items-center gap-2 mt-1">
                            <span class="text-[9px] text-slate-500">{relativeTime(entry.updatedAt || entry.createdAt)}</span>
                          </div>
                        </div>
                        {!isEditing && (
                          <div class="shrink-0 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                            <button
                              onClick={(e) => startEditing(e, entry._id, entry.title)}
                              class="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-white transition-all cursor-pointer"
                            >
                              <Edit2 size={10} />
                            </button>
                            <button
                              onClick={(e) => handleDelete(e, entry._id)}
                              disabled={deletingId === entry._id}
                              class="p-1 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all cursor-pointer"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick Questions */}
          <div class="bg-brand-card border border-slate-800 p-4 rounded-2xl space-y-3 shadow-xl">
            <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles size={11} class="text-brand-primary" />
              Quick Questions
            </h3>
            <div class="space-y-1.5">
              {predefinedQuestions.map((q, idx) => (
                <button key={idx} onClick={() => executeQuery(q)} disabled={loading}
                  class="w-full text-left bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-800/80 hover:border-slate-700/80 px-3 py-2.5 rounded-xl text-[11px] font-medium text-slate-300 transition-all cursor-pointer flex items-center justify-between group">
                  <span class="leading-snug">{q}</span>
                  <ChevronRight size={10} class="text-slate-600 group-hover:text-brand-primary transition-colors shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── CENTER: Chat Window (6/12) ───────────────────────────────── */}
        <div class="xl:col-span-6 bg-brand-card border border-slate-800 rounded-3xl flex flex-col h-[780px] overflow-hidden shadow-2xl">

          {/* Chat Header */}
          <div class="bg-slate-900/40 px-5 py-4 border-b border-slate-800 flex items-center gap-3">
            <div class="w-8 h-8 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center">
              <Bot size={17} />
            </div>
            <div class="flex-1">
              <h3 class="text-[11px] font-bold text-white uppercase tracking-wider">
                {activeThreadId ? '📂 Persistent Discussion' : 'AI Financial Advisor'}
              </h3>
              <p class="text-[9px] text-brand-muted mt-0.5">
                {activeThreadId
                  ? 'Double-click thread title in history to rename'
                  : 'Full account context · Persistent memory · Formula explanations'}
              </p>
            </div>
            {activeThreadId && (
              <button onClick={startNewChat}
                class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 hover:text-white transition-all cursor-pointer">
                <X size={11} /> Start New Chat
              </button>
            )}
            <div class="text-[8px] font-mono bg-slate-800 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/20">
              ● LIVE
            </div>
          </div>

          {/* Chat Body */}
          <div class="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
            {activeMessages.length === 0 ? (
              /* Empty state */
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="h-full flex flex-col justify-center items-center text-center text-slate-500 space-y-4 py-12">
                <HelpCircle size={48} class="text-slate-700 animate-bounce" />
                <div>
                  <h4 class="text-sm font-bold text-slate-300">Start Your Consultation</h4>
                  <p class="text-xs text-brand-muted max-w-sm mt-1.5 leading-relaxed">
                    Your AI advisor has access to your full financial profile, all loans, payment history, and previous coaching sessions.
                  </p>
                </div>
                {history.length > 0 && (
                  <p class="text-[10px] text-slate-600">
                    📂 {history.length} past conversation{history.length !== 1 ? 's' : ''} available in history
                  </p>
                )}
              </motion.div>
            ) : (
              /* Chat list */
              <div class="space-y-4">
                {activeMessages.map((msg, index) => (
                  <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }} class="space-y-3">
                    {msg.role === 'user' ? (
                      /* User bubble */
                      <div class="flex justify-end">
                        <div class="max-w-[85%] bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-tr-none px-4 py-3">
                          <div class="flex items-center gap-1.5 mb-1 justify-end">
                            <span class="text-[9px] font-bold text-indigo-400 uppercase">You</span>
                            <User size={10} class="text-indigo-400" />
                          </div>
                          <p class="text-xs text-slate-200 leading-relaxed text-right">{msg.content}</p>
                          <div class="flex items-center gap-1 mt-1.5 justify-end text-[9px] text-slate-500 font-mono">
                            <Clock size={8} />
                            <span>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Bot bubble */
                      <div class="flex justify-start w-full">
                        {msg.content ? (
                          <div class="max-w-[98%] w-full bg-slate-900/50 border border-slate-800/80 rounded-2xl rounded-tl-none p-5 shadow-lg space-y-3">
                            <AIResponseCard answer={msg.content} />
                            <div class="flex items-center gap-1 text-[9px] text-slate-500 font-mono border-t border-slate-800/40 pt-2.5 mt-1">
                              <Clock size={8} />
                              <span>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                            </div>
                          </div>
                        ) : msg.error ? (
                          <div class="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl rounded-tl-none flex flex-col gap-2">
                            <div class="flex items-center gap-3">
                              <AlertTriangle size={18} class="shrink-0" />
                              <div class="text-xs"><span class="font-bold">Error:</span> {msg.error}</div>
                            </div>
                            <div class="flex items-center gap-1 text-[9px] text-rose-400 font-mono">
                              <Clock size={8} />
                              <span>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                            </div>
                          </div>
                        ) : (
                          <div class="bg-slate-900/40 border border-slate-800/80 rounded-2xl rounded-tl-none px-5 py-4 flex items-center gap-3">
                            <Bot size={13} class="text-brand-primary animate-pulse" />
                            <div class="flex gap-1">
                              {[0, 150, 300].map(d => (
                                <span key={d} class="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"
                                  style={{ animationDelay: `${d}ms` }} />
                              ))}
                            </div>
                            <span class="text-[10px] text-slate-500">Analyzing your full financial profile...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}

                {loading && activeMessages[activeMessages.length - 1]?.role === 'user' && (
                  <div class="flex justify-start">
                    <div class="bg-slate-900/40 border border-slate-800/80 rounded-2xl rounded-tl-none px-5 py-4 flex items-center gap-3">
                      <Bot size={13} class="text-brand-primary animate-pulse" />
                      <div class="flex gap-1">
                        {[0, 150, 300].map(d => (
                          <span key={d} class="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"
                            style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                      <span class="text-[10px] text-slate-500">Analyzing your full financial profile...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div class="p-4 border-t border-slate-800 bg-slate-900/20">
            <form onSubmit={handleSubmit} class="relative">
              <input type="text" required disabled={loading}
                placeholder={getTranslation(lang, 'askCoach')}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                class="w-full bg-slate-950 border border-slate-800 text-xs rounded-2xl pl-4 pr-12 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-brand-primary/50 transition-all font-medium disabled:opacity-60"
              />
              <button type="submit" disabled={loading || !prompt.trim()}
                class="absolute right-2.5 top-2.5 p-2 bg-brand-primary hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-black rounded-xl cursor-pointer transition-colors active:scale-[0.98]">
                <Send size={12} />
              </button>
            </form>
            <p class="text-[9px] text-slate-600 mt-1.5 text-center">
              AI has access to your loans, payment history, score breakdown, and active chat threads.
            </p>
          </div>
        </div>

        {/* ─── RIGHT: Financial Journey Timeline (3/12) ─────────────────── */}
        <div class="xl:col-span-3 space-y-4">

          {/* EMI Simulator params */}
          <div class="bg-brand-card border border-slate-800 p-4 rounded-2xl space-y-3 shadow-xl">
            <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp size={11} class="text-indigo-400" />
              EMI Simulator Params
            </h3>
            {loans.length > 0 ? (
              <div class="space-y-3">
                <div>
                  <label class="block text-[9px] font-bold text-slate-500 uppercase mb-1.5">Target Loan</label>
                  <select value={selectedLoanId} onChange={e => setSelectedLoanId(e.target.value)}
                    class="w-full bg-slate-900 border border-slate-800 text-[11px] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-primary/50 transition-all cursor-pointer">
                    {loans.map(l => <option key={l._id} value={l._id}>{l.loanName}</option>)}
                  </select>
                </div>
                <div>
                  <label class="block text-[9px] font-bold text-slate-500 uppercase mb-1.5">Proposed EMI (Rs.)</label>
                  <input type="number" value={proposedEmiInput} onChange={e => setProposedEmiInput(e.target.value)}
                    class="w-full bg-slate-900 border border-slate-800 text-[11px] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-primary/50 transition-all" />
                </div>
              </div>
            ) : (
              <p class="text-[10px] text-slate-500">No active loans.</p>
            )}
          </div>

          {/* Financial Journey Timeline */}
          <div class="bg-brand-card border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col max-h-[580px]">
            <div class="px-4 py-3.5 border-b border-slate-800 flex items-center gap-2">
              <MapPin size={12} class="text-rose-400" />
              <span class="text-[10px] font-bold text-white uppercase tracking-widest">Recovery Journey</span>
            </div>

            <div class="flex-1 overflow-y-auto scrollbar-thin p-3">
              {historyLoading ? (
                <div class="space-y-3">
                  {[1,2,3].map(i => <div key={i} class="h-20 bg-slate-800/40 rounded-xl animate-pulse" />)}
                </div>
              ) : history.length === 0 ? (
                <div class="py-10 text-center">
                  <MapPin size={28} class="text-slate-700 mx-auto mb-2" />
                  <p class="text-[10px] text-slate-500">Your journey starts with your first question.</p>
                </div>
              ) : (
                <div class="relative">
                  {/* Vertical line */}
                  <div class="absolute left-4 top-4 bottom-4 w-px bg-gradient-to-b from-brand-primary/40 via-slate-700/60 to-transparent" />
                  <div class="space-y-3 pl-9">
                    {[...history].reverse().map((entry, idx) => {
                      const isActive = activeThreadId === entry._id;
                      return (
                        <button key={entry._id} onClick={() => selectThread(entry._id)}
                          class={`relative w-full text-left transition-all cursor-pointer ${isActive ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}>
                          {/* Timeline dot */}
                          <div class={`absolute -left-6 top-2.5 w-3 h-3 rounded-full border-2 border-brand-bg ${isActive ? 'bg-brand-primary' : 'bg-slate-700'}`} />
                          <div class={`bg-slate-900/60 border rounded-xl p-3 space-y-1.5 ${isActive ? 'border-brand-primary/40' : 'border-slate-800/60 hover:border-slate-700'}`}>
                            <div class="flex items-center justify-between">
                              <span class="text-[9px] text-slate-500 font-mono">
                                {new Date(entry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                              </span>
                            </div>
                            <p class="text-[10px] text-slate-300 leading-snug line-clamp-2 font-semibold">{entry.title}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AICoach;
