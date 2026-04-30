import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Check, KeyRound, ShieldCheck, Users, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { api } from '../lib/api';

interface User {
  id: string;
  username: string;
  role: string;
  status: string;
  created_at: string;
}

interface UserManagementProps {
  readonly onPasswordChanged: () => void;
}

export default function UserManagement({ onPasswordChanged }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const data = await api.get<User[]>('/auth/users');
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Unable to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApprove(userId: string) {
    setActionLoading(userId);
    try {
      await api.post(`/auth/approve/${userId}`, {});
      await fetchUsers();
    } catch (err) {
      console.error('Failed to approve user:', err);
      setError('Failed to approve user');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(userId: string) {
    setActionLoading(userId);
    try {
      await api.post(`/auth/reject/${userId}`, {});
      await fetchUsers();
    } catch (err) {
      console.error('Failed to reject user:', err);
      setError('Failed to reject user');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleChangePassword(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 12) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    setActionLoading('change-password');
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage('Password updated. Redirecting to login...');
      setTimeout(onPasswordChanged, 800);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      setError(message);
    } finally {
      setActionLoading(null);
    }
  }

  const pendingUsers = users.filter(u => u.status === 'pending');
  const activeUsers = users.filter(u => u.status === 'active');

  if (isLoading) {
    return (
      <div className="space-y-10 py-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-white/5 rounded-lg" />
          <div className="h-14 w-64 bg-white/5 rounded-2xl" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white/[0.03] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="User Management"
        description="Review and approve pending user registrations."
      >
        <div className="flex gap-4">
          <motion.div 
            className="glass px-5 py-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total users</p>
                <p className="text-lg font-bold text-white">{users.length}</p>
              </div>
            </div>
          </motion.div>
          <motion.div 
            className="glass px-5 py-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Pending</p>
                <p className="text-lg font-bold text-white">{pendingUsers.length}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </PageHeader>

      {error && (
        <div className="glass border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {passwordMessage && (
        <div className="glass border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-300">
          {passwordMessage}
        </div>
      )}

      <motion.section 
        className="glass-strong p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <p className="eyebrow-glass mb-1">Account Security</p>
            <h2 className="heading-section-glass">Change your password</h2>
            <p className="mt-1 text-sm text-slate-400">
              Update your own admin password. You will be signed out after the change.
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="grid gap-4 lg:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm text-slate-400">Current password</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="input-glass w-full"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-slate-400">New password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="input-glass w-full"
              minLength={8}
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-slate-400">Confirm new password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="input-glass w-full"
              minLength={8}
              required
            />
          </label>

          <div className="lg:col-span-3">
            <motion.button
              type="submit"
              disabled={actionLoading === 'change-password'}
              className="btn-glass w-full sm:w-auto disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <KeyRound className="h-4 w-4" />
              {actionLoading === 'change-password' ? 'Updating password...' : 'Update password'}
            </motion.button>
          </div>
        </form>
      </motion.section>

      {/* Pending Users Section */}
      {pendingUsers.length > 0 && (
        <motion.section 
          className="glass-strong p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="mb-6">
            <p className="eyebrow-glass mb-2">Pending Approval</p>
            <h2 className="heading-section-glass">New Registrations</h2>
          </div>
          
          <div className="space-y-2">
            {pendingUsers.map((user) => (
              <motion.div 
                key={user.id} 
                className="glass p-4"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 font-semibold text-sm"
                    >
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{user.username}</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {new Date(user.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => handleApprove(user.id)}
                      disabled={actionLoading === user.id}
                      className="btn-glass !py-2 !px-4 text-sm disabled:opacity-50"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </motion.button>
                    <motion.button
                      onClick={() => handleReject(user.id)}
                      disabled={actionLoading === user.id}
                      className="btn-glass-secondary !py-2 !px-4 text-sm disabled:opacity-50"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Active Users Section */}
      <motion.section 
        className="glass-strong p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="mb-6">
          <p className="eyebrow-glass mb-2">Active Users</p>
          <h2 className="heading-section-glass">Approved Members</h2>
        </div>
        
        {activeUsers.length === 0 ? (
          <p className="text-slate-600 text-center py-8">No active users yet.</p>
        ) : (
          <div className="space-y-2">
            {activeUsers.map((user) => (
              <motion.div 
                key={user.id} 
                className="glass p-4"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-semibold text-sm"
                    >
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{user.username}</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Role: {user.role} • {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="badge-glass border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
                    <ShieldCheck className="h-3 w-3" />
                    {user.status}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>
    </div>
  );
}
