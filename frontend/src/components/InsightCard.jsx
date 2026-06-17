import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, AlertCircle, TrendingUp, Sparkles, Lightbulb } from 'lucide-react';

const InsightCard = ({ title, problem, whyItMatters, recommendedAction, expectedBenefit }) => {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.005 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="bg-brand-card border border-indigo-500/10 p-6 rounded-2xl shadow-glow-secondary hover:border-indigo-500/20 transition-all select-none space-y-4"
    >
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
          <Lightbulb size={16} />
        </div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title || 'Coach Insight'}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold leading-relaxed">
        {/* Left column: Problem & Why it matters */}
        <div className="space-y-3">
          {problem && (
            <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                <AlertCircle size={12} />
                <span>What is the issue?</span>
              </div>
              <p className="text-slate-300 font-medium">{problem}</p>
            </div>
          )}

          {whyItMatters && (
            <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <HelpCircle size={12} />
                <span>Why does it matter?</span>
              </div>
              <p className="text-slate-400 font-medium">{whyItMatters}</p>
            </div>
          )}
        </div>

        {/* Right column: Recommendation & Benefit */}
        <div className="space-y-3">
          {recommendedAction && (
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                <TrendingUp size={12} />
                <span>What should you do next?</span>
              </div>
              <p className="text-slate-300 font-medium">{recommendedAction}</p>
            </div>
          )}

          {expectedBenefit && (
            <div className="p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles size={12} />
                <span>Expected Benefit</span>
              </div>
              <p className="text-slate-300 font-medium">{expectedBenefit}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default InsightCard;
