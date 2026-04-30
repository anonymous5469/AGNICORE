import { useState } from 'react';
import { Eye, EyeOff, Lock, User, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';

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
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4 py-6 sm:px-6 lg:px-8">
      <div className="w-full max-w-[440px]">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
            AGNICORE
          </h1>
          <p className="text-sm text-[#5a5a66] uppercase tracking-[0.2em]">
            Digital Sovereignty Protocol
          </p>
          <div className="mt-4 mx-auto w-12 h-[2px] bg-[#d4a853] rounded-full" />
        </div>

        {/* Card */}
        <div className="card p-8 sm:p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-white mb-1">Access Gateway</h2>
            <p className="text-sm text-[#8a8a96]">Authenticate to establish secure session</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-[#5a5a66]">
                Operative ID
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5a5a66]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-clean w-full pl-10"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-[#5a5a66]">
                Credential Key
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5a5a66]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-clean w-full pl-10 pr-10"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a5a66] hover:text-[#8a8a96] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary-v2 w-full mt-2"
            >
              <span>{isLoading ? 'Authenticating...' : 'Initialize Session'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.06)] text-center">
            <button
              onClick={onShowRegister}
              className="text-sm text-[#8a8a96] hover:text-[#d4a853] transition-colors"
            >
              Register Access
            </button>
          </div>
        </div>

        <p className="text-center mt-6 text-xs text-[#5a5a66] uppercase tracking-wider">
          256-bit AES encrypted
        </p>
      </div>
    </div>
  );
}
