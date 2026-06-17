import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getTranslation } from '../services/localizer';
import { LogOut, Globe, User } from 'lucide-react';

const Topbar = () => {
  const { user, logout, updatePreferredLanguage } = useContext(AuthContext);
  const lang = user?.preferredLanguage || 'en';

  const handleLanguageChange = (e) => {
    updatePreferredLanguage(e.target.value);
  };

  return (
    <header class="h-16 bg-brand-card border-b border-slate-800 flex items-center justify-between px-8 select-none">
      {/* Welcome Title */}
      <div>
        <p class="text-xs text-brand-muted font-medium">
          {getTranslation(lang, 'welcome')},
        </p>
        <h2 class="text-sm font-bold text-white tracking-wide">
          {user?.name || 'Client'} {user?.role === 'admin' && <span class="ml-1 text-[9px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded font-mono">ADMIN</span>}
        </h2>
      </div>

      {/* Configurations & Controls */}
      <div class="flex items-center gap-6">
        {/* Language Selection selector */}
        <div class="flex items-center gap-2 bg-slate-800/40 px-3 py-1.5 rounded-xl border border-slate-800">
          <Globe size={15} class="text-brand-primary" />
          <select
            value={lang}
            onChange={handleLanguageChange}
            class="bg-transparent border-none text-xs text-slate-200 focus:outline-none cursor-pointer font-medium"
          >
            <option value="en" class="bg-brand-card">English</option>
            <option value="te" class="bg-brand-card">తెలుగు</option>
            <option value="hi" class="bg-brand-card">हिन्दी</option>
            <option value="ta" class="bg-brand-card">தமிழ்</option>
          </select>
        </div>

        {/* User profile icon */}
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 border border-slate-700">
            <User size={16} />
          </div>
        </div>

        {/* Divider */}
        <div class="w-[1px] h-6 bg-slate-800"></div>

        {/* Logout Button */}
        <button
          onClick={logout}
          class="flex items-center gap-2 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
          title={getTranslation(lang, 'logout')}
        >
          <LogOut size={16} />
          <span class="hidden md:inline">{getTranslation(lang, 'logout')}</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
