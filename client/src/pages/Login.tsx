import { useState } from 'react';
import { Eye, EyeOff, Lock, User, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import AuthScene from '../scenes/AuthScene';

interface LoginProps {
  readonly onLogin: () => void;
  readonly onShowRegister: () => void;
}

export default function Login({ onLogin, onShowRegister }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<{ token: string; user: Record<string, unknown> }>('/auth/login', {
        username,
        password,
      });

      localStorage.setItem('agnicore_token', response.token);
      localStorage.setItem('agnicore_user', JSON.stringify(response.user));
      onLogin();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid credentials';
      if (message.includes('Forbidden')) {
        setError('Your account is pending approval. Please wait for admin confirmation.');
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 3D Background */}
      <AuthScene />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e1a] via-transparent to-[#0a0e1a] z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] via-transparent to-[#0a0e1a] z-[1]" />

      {/* Content */}
      <motion.div 
        className="relative z-10 w-full max-w-[440px] px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Logo */}
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

        {/* Glass Card */}
        <motion.div 
          className="glass-strong p-8 sm:p-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-white mb-1">Access Gateway</h2>
            <p className="text-sm text-slate-400">Authenticate to establish secure session</p>
          </div>

          {/* Error */}
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
                Operative ID
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-glass w-full pl-10"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Credential Key
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-glass w-full pl-10 pr-10"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="btn-glass w-full mt-2 disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{isLoading ? 'Authenticating...' : 'Initialize Session'}</span>
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <button
              onClick={onShowRegister}
              className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
            >
              Register Access
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
