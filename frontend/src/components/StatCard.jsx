import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, colorClass = "text-brand-primary bg-emerald-500/10", trend, trendType = "up", onExplain, sourceText, sourceLink }) => {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      class="bg-brand-card border border-slate-800/80 p-6 rounded-2xl shadow-sm hover:border-slate-700/80 transition-all select-none flex flex-col justify-between"
    >
      <div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-brand-muted font-bold tracking-wide uppercase">{title}</span>
          <div class={`p-2 rounded-xl ${colorClass}`}>
            <Icon size={18} />
          </div>
        </div>

        <div class="mt-4 flex items-baseline gap-2">
          <h3 class="text-2xl font-black text-white tracking-tight leading-none">
            {value}
          </h3>
          
          {trend && (
            <span class={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
              trendType === "up" 
                ? 'bg-emerald-500/10 text-emerald-400' 
                : 'bg-rose-500/10 text-rose-400'
            }`}>
              {trend}
            </span>
          )}
        </div>
      </div>

      {(onExplain || sourceText) && (
        <div class="mt-4 pt-3 border-t border-slate-800/60 flex flex-col gap-2 text-[10px]">
          {sourceText && (
            <div class="flex justify-between items-center text-slate-500 font-medium leading-none">
              <span>{sourceText}</span>
              {sourceLink && (
                <NavLink to={sourceLink} class="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
                  Edit Source
                </NavLink>
              )}
            </div>
          )}
          {onExplain && (
            <button
              onClick={(e) => { e.stopPropagation(); onExplain(); }}
              class="font-bold text-brand-primary hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer bg-transparent border-none focus:outline-none self-start mt-0.5"
            >
              Why?
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
