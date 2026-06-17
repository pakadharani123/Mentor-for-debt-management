import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';

const Login = () => {
  const { login } = useContext(AuthContext);
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // Countdown timer for lockout
  React.useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setServerError(''); // clear lockout error message
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const onSubmit = async (data) => {
    if (lockoutSeconds > 0) return;
    setServerError('');
    setSubmitting(true);
    const res = await login(data.email, data.password);
    
    if (res.success) {
      navigate('/dashboard');
    } else {
      if (res.cooldownRemaining && res.cooldownRemaining > 0) {
        setLockoutSeconds(res.cooldownRemaining);
      }
      setServerError(res.error);
      setSubmitting(false);
    }
  };

  return (
    <div class="min-h-screen bg-brand-dark flex flex-col justify-center items-center px-4 select-none">
      <div class="max-w-md w-full bg-brand-card border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Decorative ambient background */}
        <div class="absolute -top-12 -right-12 w-36 h-36 bg-brand-primary/5 rounded-full blur-2xl"></div>

        {/* Brand Header */}
        <div class="text-center space-y-2 relative">
          <div class="mx-auto w-12 h-12 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center mb-4">
            <TrendingUp size={24} />
          </div>
          <h1 class="text-2xl font-black text-white tracking-tight">AI Recovery Assistant</h1>
          <p class="text-xs text-brand-muted font-medium uppercase tracking-wider">Plan Smarter. Recover Faster.</p>
        </div>

        {/* Error Dialog */}
        {serverError && (
          <div class="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-start gap-3 text-xs font-semibold leading-relaxed">
            <AlertCircle size={16} class="shrink-0 mt-0.5" />
            <span>
              {lockoutSeconds > 0 
                ? `Too many failed login attempts. Try again in: ${lockoutSeconds} seconds` 
                : serverError
              }
            </span>
          </div>
        )}

        {/* Form elements */}
        <form onSubmit={handleSubmit(onSubmit)} class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              {...register('email', { 
                required: 'Email address is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              class="w-full bg-slate-900 border border-slate-800 text-sm rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/20 transition-all font-medium"
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
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
              class="w-full bg-slate-900 border border-slate-800 text-sm rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/20 transition-all font-medium"
            />
            {errors.password && (
              <p class="text-[10px] font-bold text-rose-400 mt-1.5 flex items-center gap-1 select-none">
                <AlertCircle size={12} /> {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || lockoutSeconds > 0}
            class="w-full bg-brand-primary hover:bg-emerald-600 active:scale-[0.98] transition-all text-black font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 mt-6 cursor-pointer shadow-glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <div class="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : lockoutSeconds > 0 ? (
              <span>Locked ({lockoutSeconds}s)</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer redirection link */}
        <div class="text-center pt-2">
          <p class="text-xs text-brand-muted font-medium">
            New to the platform?{' '}
            <Link to="/register" class="text-brand-primary hover:underline font-bold transition-all">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
