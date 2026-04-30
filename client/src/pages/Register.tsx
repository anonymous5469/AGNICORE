import { useState } from 'react';
import { Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';

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
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4 py-6 sm:px-6 lg:px-8">
        <div className="w-full max-w-[440px]">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
              AGNICORE
            </h1>
            <div className="mt-4 mx-auto w-12 h-[2px] bg-[#d4a853] rounded-full" />
          </div>

          <div className="card p-8 text-center">
            <div className="mb-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-3">Registration Successful</h2>
            <p className="text-[#8a8a96] mb-2">
              Your account has been created and is pending admin approval.
            </p>
            <p className="text-sm text-[#5a5a66]">
              Redirecting to login page...
            </p>
          </div>
        </div>
      </div>
    );
  }

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
            <h2 className="text-2xl font-semibold text-white mb-1">Create Account</h2>
            <p className="text-sm text-[#8a8a96]">Register for access to the command center</p>
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
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5a5a66]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-clean w-full pl-10"
                  placeholder="Choose a username"
                  required
                  minLength={3}
                  maxLength={32}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-[#5a5a66]">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5a5a66]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-clean w-full pl-10"
                  placeholder="••••••••••••••••"
                  required
                  minLength={12}
                />
              </div>
              <p className="text-xs text-[#5a5a66] mt-1">Min 12 chars, uppercase, lowercase, number, special char</p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-[#5a5a66]">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5a5a66]" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-clean w-full pl-10"
                  placeholder="••••••••••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary-v2 w-full mt-2"
            >
              <span>{isLoading ? 'Creating Account...' : 'Create Account'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.06)] text-center">
            <p className="text-sm text-[#8a8a96]">
              Already have an account?{' '}
              <button
                onClick={onRegister}
                className="text-[#d4a853] hover:text-[#e8c070] transition-colors font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
