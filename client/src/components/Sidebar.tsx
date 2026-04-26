import { LayoutDashboard, TestTube, FileText, Users } from 'lucide-react';

interface SidebarProps {
  readonly currentPage: string;
  readonly onNavigate: (page: string) => void;
  readonly onClose?: () => void;
  readonly isAdmin: boolean;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, sub: 'Posture Overview' },
  { id: 'simulation', label: 'Simulation', icon: TestTube, sub: 'Trust Testing' },
  { id: 'logs', label: 'Audit Trail', icon: FileText, sub: 'Forensic Review' },
];

const adminItems = [
  { id: 'users', label: 'User Management', icon: Users, sub: 'Admin Panel' },
];

export default function Sidebar({ currentPage, onNavigate, onClose, isAdmin }: SidebarProps) {
  const allItems = isAdmin ? [...menuItems, ...adminItems] : menuItems;

  return (
    <aside className="glass-panel-strong flex h-full w-full max-w-[280px] flex-col rounded-[32px] p-6 shadow-2xl relative overflow-hidden">
      {/* Ambient background */}
      <div className="ambient-orb -right-10 top-10 h-32 w-32 bg-sky-400/8 opacity-40" />
      <div className="ambient-orb -left-10 bottom-20 h-24 w-24 bg-rose-400/5 opacity-30" />
      
      <div className="relative z-10">
        <div className="mb-10 p-2">
          <p className="eyebrow text-sky-400/80">Terminal</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tighter text-white">
            AGNICORE
          </h2>
          <div className="mt-2 h-[2px] w-16 bg-gradient-to-r from-sky-400/60 to-transparent rounded-full" />
        </div>

        <nav className="space-y-3">
          {allItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose?.();
                }}
                className={`group flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all duration-300 relative overflow-hidden ${
                  isActive
                    ? 'bg-white/[0.08] text-white shadow-[0_0_24px_rgba(115,196,255,0.15)] border border-white/15'
                    : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200 hover:shadow-[0_0_16px_rgba(255,255,255,0.05)]'
                }`}
              >
                {/* Active indicator line */}
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-[3px] bg-gradient-to-b from-sky-400 to-sky-300/50 rounded-full" />
                )}
                
                <div
                  className={`rounded-xl p-2.5 transition-all duration-300 relative ${
                    isActive 
                      ? 'bg-sky-500/20 text-sky-400 shadow-[0_0_12px_rgba(115,196,255,0.3)]' 
                      : 'bg-white/5 text-slate-500 group-hover:text-slate-300 group-hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-5 w-5 relative" />
                  
                  {isActive && (
                    <div className="absolute inset-0 bg-sky-400/20 blur-lg rounded-xl" />
                  )}
                </div>
                <div className="relative">
                  <p className="text-sm font-bold tracking-wide">{item.label}</p>
                  <p className="text-[0.65rem] font-medium uppercase tracking-widest opacity-40 mt-0.5">{item.sub}</p>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto relative">
        <div className="glass-inset p-5 relative overflow-hidden group hover:bg-white/[0.04] transition-all">
          {/* Top accent */}
          <div className="absolute top-0 left-4 right-4 h-[2px] bg-gradient-to-r from-emerald-400/50 to-transparent" />
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse" />
              <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
            </div>
            <p className="text-[0.7rem] font-bold uppercase tracking-widest text-emerald-400/90">System Secure</p>
          </div>
          <p className="mt-2 text-[0.65rem] font-medium leading-relaxed text-slate-500">
            All nodes reporting nominal trust telemetry.
          </p>
        </div>
      </div>
    </aside>
  );
}
