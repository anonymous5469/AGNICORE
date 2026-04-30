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
    <aside className="flex h-full w-full max-w-[260px] flex-col rounded-2xl bg-[#0f0f16] border border-[rgba(255,255,255,0.06)] p-5">
      <div className="mb-8 px-1">
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-[#5a5a66] mb-1">Terminal</p>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          AGNICORE
        </h2>
        <div className="mt-3 h-[2px] w-12 bg-[#d4a853] rounded-full" />
      </div>

      <nav className="space-y-1">
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
              className={`group flex w-full items-center gap-3.5 rounded-xl px-4 py-3.5 text-left transition-all duration-200 relative ${
                isActive
                  ? 'bg-[rgba(212,168,83,0.08)] text-white'
                  : 'text-[#8a8a96] hover:bg-[rgba(255,255,255,0.03)] hover:text-[#f0f0f5]'
              }`}
            >
              {/* Active indicator line */}
              {isActive && (
                <div className="absolute left-0 top-2.5 bottom-2.5 w-[3px] bg-[#d4a853] rounded-full" />
              )}
              
              <div
                className={`rounded-lg p-2 transition-colors ${
                  isActive 
                    ? 'bg-[rgba(212,168,83,0.15)] text-[#d4a853]' 
                    : 'bg-[rgba(255,255,255,0.03)] text-[#5a5a66] group-hover:text-[#8a8a96]'
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-[0.65rem] font-medium uppercase tracking-wider text-[#5a5a66] mt-0.5">{item.sub}</p>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="card p-4">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <div className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-400 animate-ping opacity-60" />
            </div>
            <p className="text-[0.7rem] font-bold uppercase tracking-wider text-emerald-400/90">System Secure</p>
          </div>
          <p className="mt-2 text-[0.7rem] leading-relaxed text-[#5a5a66]">
            All nodes reporting nominal trust telemetry.
          </p>
        </div>
      </div>
    </aside>
  );
}
