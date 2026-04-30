import { Menu, LogOut } from 'lucide-react';
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
      <div className="flex items-center justify-between py-5 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenMenu}
            className="btn-secondary-v2 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
          
          <div>
            <p className="eyebrow-v2 text-[0.6rem] tracking-[0.3em]">AGNICORE</p>
            <h1 className="text-xl font-semibold text-white mt-0.5">
              {formatPageTitle(currentPage)}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-medium text-[#5a5a66] uppercase tracking-wider">
                {user?.role === 'admin' ? 'Administrator' : 'Analyst'}
              </p>
              <p className="text-sm font-semibold text-[#f0f0f5]">{user?.username || 'Unknown'}</p>
            </div>
          </div>
          
          <button 
            onClick={onLogout} 
            className="btn-secondary-v2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
