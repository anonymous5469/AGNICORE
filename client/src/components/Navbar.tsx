import { Menu, LogOut, Shield, Sparkles } from 'lucide-react';
import { formatPageTitle } from '../lib/ui';

interface NavbarProps {
  readonly currentPage: string;
  readonly onLogout: () => void;
  readonly onOpenMenu: () => void;
  readonly user?: { username: string; role: string } | null;
}

export default function Navbar({ currentPage, onLogout, onOpenMenu, user }: NavbarProps) {
  return (
    <header className="page-grid pb-0">
      <div className="glass-panel-strong section-shell relative overflow-hidden">
        {/* Animated ambient orbs */}
        <div className="ambient-orb -left-20 top-0 h-40 w-40 bg-sky-400/10 opacity-40 animate-pulse" />
        <div className="ambient-orb -right-10 -bottom-10 h-32 w-32 bg-rose-400/8 opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="ambient-orb left-1/2 top-0 h-24 w-24 bg-amber-400/5 opacity-20" />
        
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <button
              onClick={onOpenMenu}
              className="button-secondary lg:hidden hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>
            
            {/* Shield icon with glow */}
            <div className="relative">
              <div className="rounded-[22px] bg-gradient-to-br from-rose-400/20 to-sky-300/10 p-3 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-400/30 to-sky-300/20 opacity-50" />
                <Shield className="h-6 w-6 relative" />
              </div>
              <div className="absolute inset-0 rounded-[22px] bg-gradient-to-br from-rose-400/20 to-sky-300/10 blur-xl opacity-60" />
            </div>
            
            <div>
              <p className="eyebrow">AGNICORE command center</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
                {formatPageTitle(currentPage)}
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Zero-trust access control across identity, context, risk, and policy.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Posture status */}
            <div className="glass-inset rounded-[22px] px-5 py-3 relative overflow-hidden group hover:bg-white/[0.04] transition-all">
              <div className="absolute top-0 left-4 right-4 h-[2px] bg-gradient-to-r from-emerald-400/50 to-transparent" />
              <div className="flex items-center gap-2 text-emerald-100">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-semibold">Posture stable</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">Threat surface monitored in real time</p>
            </div>
            
            {/* User info */}
            <div className="glass-inset rounded-[22px] px-5 py-3 relative overflow-hidden group hover:bg-white/[0.04] transition-all">
              <div className="absolute top-0 left-4 right-4 h-[2px] bg-gradient-to-r from-sky-400/50 to-transparent" />
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">{user?.role === 'admin' ? 'Administrator' : 'Analyst'}</p>
              <p className="mt-1 text-sm font-bold text-white">{user?.username || 'Unknown'}</p>
            </div>
            
            <button 
              onClick={onLogout} 
              className="button-secondary hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
