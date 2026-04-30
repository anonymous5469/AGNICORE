import { ReactNode, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#0a0a0f]">
      <Navbar
        currentPage={currentPage}
        onLogout={onLogout}
        onOpenMenu={() => setIsSidebarOpen(true)}
        user={user}
      />

      <div className="page-grid pt-5">
        <div className="flex gap-8">
          <div className="hidden xl:block xl:w-[260px] xl:shrink-0">
            <Sidebar 
              currentPage={currentPage} 
              onNavigate={onNavigate} 
              isAdmin={isAdmin}
            />
          </div>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>

      {isSidebarOpen ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close navigation"
          />
          <div className="relative h-full p-4">
            <Sidebar
              currentPage={currentPage}
              onNavigate={onNavigate}
              onClose={() => setIsSidebarOpen(false)}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
