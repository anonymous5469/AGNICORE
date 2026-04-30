import { LayoutDashboard, TestTube, FileText, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalStore } from '../store/globalStore';

interface SidebarProps {
  readonly currentPage: string;
  readonly onNavigate: (page: string) => void;
  readonly onClose?: () => void;
  readonly isAdmin: boolean;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'simulation', label: 'Simulation', icon: TestTube },
  { id: 'logs', label: 'Audit Trail', icon: FileText },
];

const adminItems = [
  { id: 'users', label: 'User Management', icon: Users },
];

export default function Sidebar({ currentPage, onNavigate, onClose, isAdmin }: SidebarProps) {
  const sidebarExpanded = useGlobalStore((state) => state.sidebarExpanded);
  const allItems = isAdmin ? [...menuItems, ...adminItems] : menuItems;

  return (
    <motion.aside
      className="fixed left-0 top-16 bottom-0 z-30 glass-strong border-t-0 border-b-0 border-l-0 rounded-none"
      initial={false}
      animate={{ width: sidebarExpanded ? 280 : 80 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="flex flex-col h-full py-4">
        <nav className="flex-1 space-y-1 px-3">
          {allItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <motion.button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose?.();
                }}
                className={`relative flex items-center w-full rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-500/10 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
                style={{ 
                  padding: sidebarExpanded ? '12px 16px' : '12px',
                  justifyContent: sidebarExpanded ? 'flex-start' : 'center'
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-blue-500 rounded-full glow-blue"
                    layoutId="activeIndicator"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                
                <div className={`p-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'bg-white/5 text-slate-500 group-hover:text-slate-300'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                
                <AnimatePresence>
                  {sidebarExpanded && (
                    <motion.span
                      className="ml-3 text-sm font-medium whitespace-nowrap"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </nav>

        {/* System Status */}
        <div className="px-3 mt-auto">
          <div className={`glass p-3 ${!sidebarExpanded && 'flex justify-center'}`}>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-60" />
              </div>
              <AnimatePresence>
                {sidebarExpanded && (
                  <motion.span
                    className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                  >
                    System Secure
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
