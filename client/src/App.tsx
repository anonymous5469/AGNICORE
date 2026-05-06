import { useState } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Simulation from './pages/Simulation';
import Logs from './pages/Logs';
import UserManagement from './pages/UserManagement';
import MainLayout from './layouts/MainLayout';

interface User {
  id: string;
  username: string;
  role: string;
  status: string;
}

function getStoredUser(): User | null {
  const userStr = localStorage.getItem('agnicore_user');
  if (userStr) {
    try {
      return JSON.parse(userStr) as User;
    } catch {
      localStorage.removeItem('agnicore_token');
      localStorage.removeItem('agnicore_user');
    }
  }
  return null;
}

function App() {
  const storedUser = getStoredUser();
  const [isAuthenticated, setIsAuthenticated] = useState(storedUser !== null);
  const [showRegister, setShowRegister] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [user, setUser] = useState<User | null>(storedUser);

  const handleLogin = () => {
    const userStr = localStorage.getItem('agnicore_user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setIsAuthenticated(true);
      } catch {
        console.error('Failed to parse user data');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('agnicore_token');
    localStorage.removeItem('agnicore_user');
    setIsAuthenticated(false);
    setUser(null);
    setCurrentPage('dashboard');
    setShowRegister(false);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const isAdmin = user?.role === 'admin';

  if (!isAuthenticated) {
    if (showRegister) {
      return <Register onRegister={() => setShowRegister(false)} />;
    }
    return <Login onLogin={handleLogin} onShowRegister={() => setShowRegister(true)} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'simulation':
        return <Simulation />;
      case 'logs':
        return <Logs />;
      case 'users':
        return isAdmin ? <UserManagement onPasswordChanged={handleLogout} /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <MainLayout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      isAdmin={isAdmin}
      user={user}
    >
      {renderPage()}
    </MainLayout>
  );
}

export default App;
