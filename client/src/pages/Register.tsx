import { useState } from 'react';
import { Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import AuthScene from '../scenes/AuthScene';

interface RegisterProps {
  readonly onRegister: () => void;
}

export default function Register({ onRegister }: RegisterProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      await api.post('/auth/register', {
        username,
        password,
      });

      setSuccess(true);
      setTimeout(() => {
        onRegister();
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <AuthScene />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e1a] via-transparent to-[#0a0e1a] z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] via-transparent to-[#0a0e1a] z-[1]" />

        <motion.div 
          className="relative z-10 w-full max-w-[440px] px-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-10">
            <h1 className="text-5xl font-bold text-white tracking-tight mb-2">
              AGNICORE
            </h1>
            <div className="mt-4 mx-auto w-16 h-[2px] bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
          </div>

          <div className="glass-strong p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
            </motion.div>
            
            <h2 className="text-2xl font-semibold text-white mb-3">Registration Successful</h2>
            <p className="text-slate-400 mb-2">
              Your account has been created and is pending admin approval.
            </p>
            <p className="text-sm text-slate-500">
              Redirecting to login page...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <AuthScene />
      
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e1a] via-transparent to-[#0a0e1a] z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] via-transparent to-[#0a0e1a] z-[1]" />

      <motion.div 
        className="relative z-10 w-full max-w-[440px] px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="text-center mb-10">
          <motion.h1 
            className="text-5xl font-bold text-white tracking-tight mb-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            AGNICORE
          </motion.h1>
          <p className="text-sm text-slate-500 uppercase tracking-[0.2em]">
            Digital Sovereignty Protocol
          </p>
          <div className="mt-4 mx-auto w-16 h-[2px] bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
        </div>

        <motion.div 
          className="glass-strong p-8 sm:p-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-white mb-1">Create Account</h2>
            <p className="text-sm text-slate-400">Register for access to the command center</p>
          </div>

          {error && (
            <motion.div 
              className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-glass w-full pl-10"
                  placeholder="Choose a username"
                  required
                  minLength={3}
                  maxLength={32}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-glass w-full pl-10"
                  placeholder="••••••••••••••••"
                  required
                  minLength={12}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Min 12 chars, uppercase, lowercase, number, special char</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-glass w-full pl-10"
                  placeholder="••••••••••••••••"
                  required
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="btn-glass w-full mt-2 disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{isLoading ? 'Creating Account...' : 'Create Account'}</span>
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <button
                onClick={onRegister}
                className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
