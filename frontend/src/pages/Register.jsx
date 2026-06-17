import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';

const Register = () => {
  const { register: registerUser } = useContext(AuthContext);
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      preferredLanguage: 'en'
    }
  });

  const onSubmit = async (data) => {
    setServerError('');
    setSubmitting(true);
    const res = await registerUser(data.name, data.email, data.password, data.preferredLanguage);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setServerError(res.error);
      setSubmitting(false);
    }
  };

  return (
    <div class="min-h-screen bg-brand-dark flex flex-col justify-center items-center px-4 select-none">
      <div class="max-w-md w-full bg-brand-card border border-slate-800 rounded-3xl p-8 space-y-5 shadow-2xl relative overflow-hidden">
        {/* Decorative ambient light */}
        <div class="absolute -top-12 -right-12 w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl"></div>

        {/* Brand Header */}
        <div class="text-center space-y-2 relative">
          <div class="mx-auto w-12 h-12 bg-indigo-500/10 text-brand-secondary rounded-2xl flex items-center justify-center mb-4">
            <TrendingUp size={24} />
          </div>
          <h1 class="text-2xl font-black text-white tracking-tight">Create Account</h1>
          <p class="text-xs text-brand-muted font-medium uppercase tracking-wider">Plan Smarter. Recover Faster.</p>
        </div>

        {/* Error Notification dialog */}
        {serverError && (
          <div class="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-start gap-3 text-xs font-semibold leading-relaxed">
            <AlertCircle size={16} class="shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit(onSubmit)} class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
            <input
              type="text"
              placeholder="Ram Charan"
              {...register('name', { 
                required: 'Full name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' }
              })}
              class="w-full bg-slate-900 border border-slate-800 text-sm rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-secondary/50 focus:ring-1 focus:ring-brand-secondary/20 transition-all font-medium"
            />
            {errors.name && (
              <p class="text-[10px] font-bold text-rose-400 mt-1.5 flex items-center gap-1 select-none">
                <AlertCircle size={12} /> {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email"
              placeholder="ram@example.com"
              {...register('email', { 
                required: 'Email address is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              class="w-full bg-slate-900 border border-slate-800 text-sm rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-secondary/50 focus:ring-1 focus:ring-brand-secondary/20 transition-all font-medium"
            />
            {errors.email && (
              <p class="text-[10px] font-bold text-rose-400 mt-1.5 flex items-center gap-1 select-none">
                <AlertCircle size={12} /> {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              {...register('password', { 
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' }
              })}
              class="w-full bg-slate-900 border border-slate-800 text-sm rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-secondary/50 focus:ring-1 focus:ring-brand-secondary/20 transition-all font-medium"
            />
            {errors.password && (
              <p class="text-[10px] font-bold text-rose-400 mt-1.5 flex items-center gap-1 select-none">
                <AlertCircle size={12} /> {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Preferred Language</label>
            <select
              {...register('preferredLanguage')}
              class="w-full bg-slate-900 border border-slate-800 text-sm rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-secondary/50 focus:ring-1 focus:ring-brand-secondary/20 transition-all font-medium cursor-pointer"
            >
              <option value="en">English</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="ta">தமிழ் (Tamil)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            class="w-full bg-brand-secondary hover:bg-indigo-600 active:scale-[0.98] transition-all text-white font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 mt-6 cursor-pointer shadow-glow-secondary"
          >
            {submitting ? (
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign Up</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div class="text-center pt-2">
          <p class="text-xs text-brand-muted font-medium">
            Already have an account?{' '}
            <Link to="/login" class="text-brand-secondary hover:underline font-bold transition-all">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
