import { useState, useEffect } from 'react';
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
      setError('New password must be at least 12 characters long.');
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
      <div className="flex h-96 items-center justify-center text-slate-400">
        Loading user management...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="User Management"
        description="Review and approve pending user registrations."
      >
        <div className="flex gap-4">
          <div className="glass-panel-strong section-shell px-4 py-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-400" />
              <span className="text-sm text-slate-300">Total: {users.length}</span>
            </div>
          </div>
          <div className="glass-panel-strong section-shell px-4 py-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-slate-300">Pending: {pendingUsers.length}</span>
            </div>
          </div>
        </div>
      </PageHeader>

      {error && (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-300">
          {error}
        </div>
      )}

      {passwordMessage && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          {passwordMessage}
        </div>
      )}

      <section className="glass-panel-strong section-shell relative overflow-hidden">
        <div className="ambient-orb -right-12 top-0 h-32 w-32 bg-sky-400/5 opacity-50" />
        <div className="relative mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-sky-500/15 p-3 text-sky-300">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <p className="eyebrow text-sky-400/80">Account Security</p>
            <h2 className="panel-title text-2xl">Change your password</h2>
            <p className="mt-1 text-sm text-slate-400">
              Update your own admin password. You will be signed out after the change.
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="relative grid gap-4 lg:grid-cols-3">
          <label className="space-y-2 text-sm text-slate-300">
            <span>Current password</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="field-shell w-full"
              required
            />
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span>New password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="field-shell w-full"
              minLength={12}
              required
            />
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span>Confirm new password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="field-shell w-full"
              minLength={12}
              required
            />
          </label>

          <div className="lg:col-span-3">
            <button
              type="submit"
              disabled={actionLoading === 'change-password'}
              className="button-primary w-full sm:w-auto"
            >
              <KeyRound className="h-4 w-4" />
              {actionLoading === 'change-password' ? 'Updating password...' : 'Update password'}
            </button>
          </div>
        </form>
      </section>

      {/* Pending Users Section */}
      {pendingUsers.length > 0 && (
        <section className="glass-panel-strong section-shell">
          <div className="mb-6">
            <p className="eyebrow text-amber-400/80">Pending Approval</p>
            <h2 className="panel-title text-2xl">New Registrations</h2>
          </div>
          
          <div className="space-y-3">
            {pendingUsers.map((user) => (
              <div key={user.id} className="glass-inset rounded-[22px] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{user.username}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(user.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(user.id)}
                      disabled={actionLoading === user.id}
                      className="button-primary !py-2 !px-4 text-sm"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(user.id)}
                      disabled={actionLoading === user.id}
                      className="button-secondary !py-2 !px-4 text-sm"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active Users Section */}
      <section className="glass-panel-strong section-shell">
        <div className="mb-6">
          <p className="eyebrow text-emerald-400/80">Active Users</p>
          <h2 className="panel-title text-2xl">Approved Members</h2>
        </div>
        
        {activeUsers.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No active users yet.</p>
        ) : (
          <div className="space-y-3">
            {activeUsers.map((user) => (
              <div key={user.id} className="glass-inset rounded-[22px] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-emerald-500/20 p-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{user.username}</p>
                      <p className="text-xs text-slate-500">
                        Role: {user.role} • {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wider text-emerald-400">
                    {user.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
