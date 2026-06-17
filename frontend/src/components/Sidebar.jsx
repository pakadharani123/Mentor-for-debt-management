import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getTranslation } from '../services/localizer';
import { 
  LayoutDashboard, 
  Award, 
  Landmark, 
  Receipt, 
  Calculator, 
  TrendingUp, 
  BarChart3, 
  Bot, 
  History, 
  ShieldCheck,
  FileCheck2,
  Settings,
  Lightbulb,
  Map
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useContext(AuthContext);
  const lang = user?.preferredLanguage || 'en';

  const menuItems = [
    { name: getTranslation(lang, 'dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { name: getTranslation(lang, 'recoveryScore'), path: '/recovery-score', icon: Award },
    { name: getTranslation(lang, 'loans'), path: '/loans', icon: Landmark },
    { name: getTranslation(lang, 'expenses'), path: '/expenses', icon: Receipt },
    { name: getTranslation(lang, 'simulator'), path: '/simulator', icon: Calculator },
    { name: getTranslation(lang, 'forecast'), path: '/forecast', icon: TrendingUp },
    { name: getTranslation(lang, 'analytics'), path: '/analytics', icon: BarChart3 },
    { name: getTranslation(lang, 'aiCoach'), path: '/ai-coach', icon: Bot },
    { name: 'Smart Advisor', path: '/smart-advisor', icon: Lightbulb },
    { name: 'Recovery Journey', path: '/recovery-journey', icon: Map },
    { name: getTranslation(lang, 'paymentTracker'), path: '/payments', icon: History },
    { name: getTranslation(lang, 'audit'), path: '/audit', icon: FileCheck2 }
  ];

  return (
    <aside class="w-64 bg-brand-card border-r border-slate-800 flex flex-col h-full shrink-0">
      {/* Brand Header */}
      <div class="p-6 border-b border-slate-800">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-emerald-500/10 rounded-lg text-brand-primary">
            <TrendingUp size={22} />
          </div>
          <div>
            <h1 class="font-extrabold text-sm tracking-wide text-white leading-tight">AI RECOVERY</h1>
            <p class="text-[10px] text-brand-muted uppercase tracking-wider">Plan Smarter. Recover Faster.</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav class="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            class={({ isActive }) => `
              flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive 
                ? 'bg-brand-primary/10 text-brand-primary shadow-glow-primary border-l-2 border-brand-primary' 
                : 'text-brand-muted hover:bg-slate-800/50 hover:text-slate-100'}
            `}
          >
            <item.icon size={18} />
            <span>{item.name}</span>
          </NavLink>
        ))}

        {/* Settings Navigation Section */}
        <div class="pt-4 mt-4 border-t border-slate-800">
          <p class="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Settings</p>
          <NavLink
            to="/settings/profile"
            class={({ isActive }) => `
              flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive 
                ? 'bg-brand-primary/10 text-brand-primary shadow-glow-primary border-l-2 border-brand-primary' 
                : 'text-brand-muted hover:bg-slate-800/50 hover:text-slate-100'}
            `}
          >
            <Settings size={18} />
            <span>{getTranslation(lang, 'financialProfile')}</span>
          </NavLink>
        </div>

        {/* Admin Navigation (Render only for admins) */}
        {user?.role === 'admin' && (
          <div class="pt-4 mt-4 border-t border-slate-800">
            <p class="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">System Admin</p>
            <NavLink
              to="/admin"
              class={({ isActive }) => `
                flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-indigo-500/10 text-indigo-400 shadow-glow-secondary border-l-2 border-indigo-400' 
                  : 'text-brand-muted hover:bg-slate-800/50 hover:text-slate-100'}
              `}
            >
              <ShieldCheck size={18} />
              <span>{getTranslation(lang, 'adminDashboard')}</span>
            </NavLink>
          </div>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
