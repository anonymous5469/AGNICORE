import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useGlobalStore } from '../store/globalStore';

interface MainLayoutProps {
  readonly children: ReactNode;
  readonly currentPage: string;
  readonly onNavigate: (page: string) => void;
  readonly onLogout: () => void;
  readonly isAdmin: boolean;
  readonly user?: { username: string; role: string } | null;
}

export default function MainLayout({
  children,
  currentPage,
  onNavigate,
  onLogout,
  isAdmin,
  user,
}: MainLayoutProps) {
  const sidebarExpanded = useGlobalStore((state) => state.sidebarExpanded);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background gradient */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#0a0e1a] to-[#0f172a]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 orb-blue" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 orb-purple" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] orb-cyan opacity-5" />
      </div>

      <Navbar
        currentPage={currentPage}
        onLogout={onLogout}
        user={user}
      />

      <div className="relative z-10 flex pt-16">
        <Sidebar 
          currentPage={currentPage} 
          onNavigate={onNavigate} 
          isAdmin={isAdmin}
        />

        <main 
          className="flex-1 min-w-0 transition-all duration-300 ease-out"
          style={{ 
            marginLeft: sidebarExpanded ? '280px' : '80px',
          }}
        >
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="px-6 lg:px-10 py-8"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
