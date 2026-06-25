import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import api from '../lib/api';
import toast from 'react-hot-toast';
import Starfield from '../components/Starfield';
import OrbitLogo from '../components/OrbitLogo';
import { Eye, EyeOff, Zap } from 'lucide-react';

// Matches `server/prisma/seed.js` (platform admin). Run `npm run db:seed` in server first.
const DEMO_CREDS = { email: 'admin@orbit.local', password: 'Password123!' };
const DEMO_NAME = 'Orbit Admin';

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-xs text-orbit-red mt-1 animate-fade-in">{msg}</p>;
}

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const setAuth = useAuthStore(s => s.setAuth);
  const navigate = useNavigate();

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!isLogin && form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const payload = isLogin ? { email: form.email, password: form.password } : form;
      const { data } = await api.post(endpoint, payload);
      setAuth(data.user, data.token);
      toast.success(isLogin ? `Welcome back, ${data.user.name}! 🚀` : 'Account created! 🎉');
      navigate('/dashboard');
    } catch (err) {
  console.log("Complete Error Object:", err);
  console.log("Error Message:", err.message);
  console.log("Error Code:", err.code);
  console.log("Response:", err.response);
  console.log("Request:", err.request);

  toast.error(err.message);
} finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setForm({ name: DEMO_NAME, email: DEMO_CREDS.email, password: DEMO_CREDS.password });
    setErrors({});
    toast('Demo credentials filled — click Sign In!', { icon: '⚡', duration: 2500 });
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4" style={{ background: '#0a0f1e' }}>
      <Starfield count={60} />

      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Logo & Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="animate-float mb-4">
            <OrbitLogo size={56} />
          </div>
          <h1 className="text-3xl font-heading font-bold text-gradient-space">Orbit</h1>
          <p className="text-gray-500 text-sm mt-1">Tasks in orbit. Team in sync.</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(13,18,30,0.9)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Tab toggle */}
          <div
            className="flex rounded-lg p-1 mb-7"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {['Sign In', 'Sign Up'].map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => { setIsLogin(i === 0); setErrors({}); }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  isLogin === (i === 0)
                    ? 'bg-orbit-blue text-white shadow-glow-blue'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4" noValidate>
            {!isLogin && (
              <div className="animate-slide-up">
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Full Name</label>
                <input
                  id="signup-name"
                  type="text"
                  className={`orbit-input ${errors.name ? 'error' : ''}`}
                  placeholder="Commander Jane"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  autoComplete="name"
                />
                <FieldError msg={errors.name} />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Email</label>
              <input
                id="login-email"
                type="email"
                className={`orbit-input ${errors.email ? 'error' : ''}`}
                placeholder="you@orbit.app"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                autoComplete="email"
              />
              <FieldError msg={errors.email} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`orbit-input pr-10 ${errors.password ? 'error' : ''}`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <FieldError msg={errors.password} />
            </div>

            <button
              id="auth-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Launching...
                </span>
              ) : (
                isLogin ? '🚀 Sign In' : '🌍 Create Account'
              )}
            </button>
          </form>

          {/* Quick Demo */}
          <div className="mt-5 pt-5 border-t border-white/5">
            <button
              id="demo-fill"
              type="button"
              onClick={fillDemo}
              className="btn-ghost w-full gap-2"
            >
              <Zap size={15} className="text-orbit-amber" />
              <span className="text-sm">Quick Demo — auto-fill admin credentials</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-6">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => { setIsLogin(v => !v); setErrors({}); }}
            className="text-orbit-blue hover:text-blue-400 font-medium transition-colors"
          >
            {isLogin ? 'Sign up free' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
