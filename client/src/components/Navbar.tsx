import { Menu, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatPageTitle } from '../lib/ui';
import { useGlobalStore } from '../store/globalStore';

interface NavbarProps {
  readonly currentPage: string;
  readonly onLogout: () => void;
  readonly user?: { username: string; role: string } | null;
}

export default function Navbar({ currentPage, onLogout, user }: NavbarProps) {
  const toggleSidebar = useGlobalStore((state) => state.toggleSidebar);

  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-40 h-16"
      initial={{ y: -64 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="glass-strong h-full px-6 flex items-center justify-between rounded-none border-x-0 border-t-0">
        <div className="flex items-center gap-4">
          <motion.button
            onClick={toggleSidebar}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu className="h-5 w-5 text-slate-300" />
          </motion.button>
          
          <div className="hidden sm:block">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              AGNICORE
            </p>
            <h1 className="text-lg font-semibold text-white -mt-0.5">
              {formatPageTitle(currentPage)}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {user?.role === 'admin' ? 'Administrator' : 'Analyst'}
              </p>
              <p className="text-sm font-medium text-white -mt-0.5">{user?.username || 'Unknown'}</p>
            </div>
          </div>
          
          <motion.button 
            onClick={onLogout} 
            className="btn-glass-secondary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
