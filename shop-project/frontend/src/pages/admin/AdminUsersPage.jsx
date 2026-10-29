import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Mail,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const ROLE_LABELS = {
  customer: 'Customer',
  staff: 'Staff',
  admin: 'Admin',
};

const ROLE_CLASSES = {
  customer: 'admin-users-role-customer',
  staff: 'admin-users-role-staff',
  admin: 'admin-users-role-admin',
};

const getUserId = (user) => user?._id || user?.id;

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.response?.data?.error || fallback;

const formatDate = (date) => {
  if (!date) return 'Not available';
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime())
    ? 'Not available'
    : parsedDate.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
};

const getInitials = (name, email) => {
  const source = name?.trim() || email || '?';
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
};

const AdminUsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/users');
      const receivedUsers = response.data?.users;
      setUsers(Array.isArray(receivedUsers) ? receivedUsers : []);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to load users'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (!deleteTarget) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !deletingId) setDeleteTarget(null);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [deleteTarget, deletingId]);

  const visibleUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesQuery =
        !normalizedQuery ||
        [user.name, user.email, user.role]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [query, roleFilter, users]);

  const handleRoleChange = async (user, role) => {
    const userId = getUserId(user);
    if (!userId || role === user.role) return;

    try {
      setUpdatingId(userId);
      const response = await api.put(`/api/admin/users/${userId}/role`, { role });
      const updatedUser = response.data?.user;

      setUsers((currentUsers) =>
        currentUsers.map((currentUserItem) =>
          getUserId(currentUserItem) === userId
            ? { ...currentUserItem, ...(updatedUser || { role }) }
            : currentUserItem
        )
      );
      toast.success('User role updated successfully');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to update user role'));
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmDelete = async () => {
    const userId = getUserId(deleteTarget);
    if (!userId) return;

    try {
      setDeletingId(userId);
      await api.delete(`/api/admin/users/${userId}`);
      setUsers((currentUsers) =>
        currentUsers.filter((currentUserItem) => getUserId(currentUserItem) !== userId)
      );
      setDeleteTarget(null);
      toast.success('User account deleted successfully');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to delete user account'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="admin-users-page">
      <style>{`
        .admin-users-page { min-height: 100vh; padding: 36px clamp(16px, 4vw, 56px) 56px; background: #f8fafc; color: #0f172a; }
        .admin-users-page .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
        .admin-users-shell { max-width: 1440px; margin: 0 auto; }
        .admin-users-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 28px; }
        .admin-users-eyebrow { display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 13px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
        .admin-users-header h1 { margin: 8px 0 6px; font-size: clamp(26px, 4vw, 36px); letter-spacing: -.04em; }
        .admin-users-header p { color: #64748b; font-size: 14px; }
        .admin-users-card { overflow: hidden; border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; box-shadow: 0 4px 16px rgb(15 23 42 / 5%); }
        .admin-users-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 20px 22px; border-bottom: 1px solid #e2e8f0; }
        .admin-users-filters { display: flex; flex: 1; gap: 10px; min-width: 0; }
        .admin-users-search { position: relative; flex: 1; max-width: 420px; }
        .admin-users-search svg { position: absolute; top: 11px; left: 11px; color: #94a3b8; }
        .admin-users-search input, .admin-users-filter { width: 100%; border: 1px solid #cbd5e1; border-radius: 9px; background: #fff; color: #0f172a; font: inherit; font-size: 13px; padding: 10px 12px; }
        .admin-users-search input { padding-left: 36px; }
        .admin-users-search input:focus, .admin-users-filter:focus { outline: none; border-color: #475569; box-shadow: 0 0 0 3px rgb(71 85 105 / 12%); }
        .admin-users-refresh { display: inline-flex; align-items: center; gap: 8px; border: 1px solid #cbd5e1; border-radius: 9px; padding: 10px 14px; color: #334155; font: inherit; font-size: 13px; font-weight: 700; white-space: nowrap; }
        .admin-users-refresh:hover:not(:disabled) { background: #f8fafc; }
        .admin-users-refresh:disabled { cursor: not-allowed; opacity: .6; }
        .admin-users-spin { animation: admin-users-spin .7s linear infinite; }
        .admin-users-table-wrap { overflow-x: auto; }
        .admin-users-table { width: 100%; min-width: 760px; border-collapse: collapse; }
        .admin-users-table th { padding: 14px 22px; background: #f8fafc; color: #64748b; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-align: left; text-transform: uppercase; }
        .admin-users-table td { padding: 17px 22px; border-top: 1px solid #f1f5f9; color: #334155; font-size: 13px; vertical-align: middle; }
        .admin-users-table tbody tr:hover { background: #fafcff; }
        .admin-users-person { display: flex; align-items: center; gap: 11px; }
        .admin-users-avatar { display: grid; flex: 0 0 36px; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: #e2e8f0; color: #334155; font-size: 12px; font-weight: 800; object-fit: cover; }
        .admin-users-name { color: #0f172a; font-weight: 700; }
        .admin-users-email { display: flex; align-items: center; gap: 6px; color: #64748b; }
        .admin-users-role { display: inline-flex; border-radius: 999px; padding: 5px 10px; font-size: 11px; font-weight: 800; }
        .admin-users-role-customer { background: #f1f5f9; color: #475569; }
        .admin-users-role-staff { background: #fffbeb; color: #b45309; }
        .admin-users-role-admin { background: #eef2ff; color: #4338ca; }
        .admin-users-role-select { border: 1px solid #cbd5e1; border-radius: 7px; padding: 7px 9px; background: #fff; color: #334155; font: inherit; font-size: 12px; }
        .admin-users-role-select:disabled { cursor: wait; opacity: .6; }
        .admin-users-actions { display: flex; justify-content: flex-end; gap: 8px; }
        .admin-users-action { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; color: #64748b; }
        .admin-users-action:hover:not(:disabled) { background: #f8fafc; color: #0f172a; }
        .admin-users-action-delete:hover:not(:disabled) { border-color: #fecaca; background: #fef2f2; color: #dc2626; }
        .admin-users-action:disabled { cursor: not-allowed; opacity: .45; }
        .admin-users-empty, .admin-users-loading { display: grid; place-items: center; gap: 10px; min-height: 250px; padding: 32px; color: #64748b; text-align: center; font-size: 13px; }
        .admin-users-empty svg { color: #94a3b8; }
        .admin-users-modal-copy { padding: 24px; color: #475569; font-size: 14px; }
        .admin-users-modal-copy strong { color: #0f172a; }
        .admin-users-modal-actions { display: flex; justify-content: flex-end; gap: 10px; padding: 0 24px 24px; }
        .admin-users-modal-button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; border-radius: 8px; padding: 10px 14px; font: inherit; font-size: 13px; font-weight: 700; }
        .admin-users-modal-cancel { border: 1px solid #cbd5e1; color: #334155; }
        .admin-users-modal-confirm { background: #dc2626; color: #fff; }
        .admin-users-modal-button:disabled { cursor: not-allowed; opacity: .6; }
        @keyframes admin-users-spin { to { transform: rotate(360deg); } }
        @media (max-width: 700px) {
          .admin-users-header { align-items: flex-start; flex-direction: column; }
          .admin-users-toolbar { align-items: stretch; flex-direction: column; }
          .admin-users-filters { flex-direction: column; }
          .admin-users-search { max-width: none; }
          .admin-users-refresh { justify-content: center; }
        }
      `}</style>

      <div className="admin-users-shell">
        <header className="admin-users-header">
          <div>
            <div className="admin-users-eyebrow"><Users size={16} /> Administration</div>
            <h1>User Management</h1>
            <p>Review registered users and manage their access roles.</p>
          </div>
        </header>

        <section className="admin-users-card" aria-label="Registered users">
          <div className="admin-users-toolbar">
            <div className="admin-users-filters">
              <label className="admin-users-search">
                <Search size={16} aria-hidden="true" />
                <span className="sr-only">Search users</span>
                <input
                  type="search"
                  value={query}
                  placeholder="Search by name or email"
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <select
                className="admin-users-filter"
                aria-label="Filter by role"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
              >
                <option value="all">All roles</option>
                {Object.entries(ROLE_LABELS).map(([role, label]) => (
                  <option key={role} value={role}>{label}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="admin-users-refresh"
              onClick={fetchUsers}
              disabled={loading}
            >
              <RefreshCw size={15} className={loading ? 'admin-users-spin' : ''} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="admin-users-loading" role="status" aria-live="polite">
              <RefreshCw size={24} className="admin-users-spin" />
              Loading users...
            </div>
          ) : visibleUsers.length === 0 ? (
            <div className="admin-users-empty">
              <UserRound size={32} />
              <span>{users.length ? 'No users match your filters.' : 'No registered users found.'}</span>
            </div>
          ) : (
            <div className="admin-users-table-wrap">
              <table className="admin-users-table">
                <caption className="sr-only">Registered system users</caption>
                <thead>
                  <tr>
                    <th scope="col">User</th>
                    <th scope="col">Role</th>
                    <th scope="col">Joined</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((user) => {
                    const userId = getUserId(user);
                    const isCurrentUser = userId === getUserId(currentUser);
                    const isUpdating = updatingId === userId;
                    const isDeleting = deletingId === userId;

                    return (
                      <tr key={userId || user.email}>
                        <td>
                          <div className="admin-users-person">
                            {user.avatar ? (
                              <img className="admin-users-avatar" src={user.avatar} alt="" />
                            ) : (
                              <span className="admin-users-avatar" aria-hidden="true">
                                {getInitials(user.name, user.email)}
                              </span>
                            )}
                            <div>
                              <div className="admin-users-name">{user.name || 'Unnamed user'}</div>
                              <div className="admin-users-email"><Mail size={13} />{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`admin-users-role ${ROLE_CLASSES[user.role] || ROLE_CLASSES.customer}`}>
                            {ROLE_LABELS[user.role] || user.role || 'Unknown'}
                          </span>
                        </td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>
                          <div className="admin-users-actions">
                            <label>
                              <span className="sr-only">Change role for {user.name || user.email}</span>
                              <select
                                className="admin-users-role-select"
                                value={user.role || 'customer'}
                                onChange={(event) => handleRoleChange(user, event.target.value)}
                                disabled={isCurrentUser || isUpdating || isDeleting}
                              >
                                {Object.entries(ROLE_LABELS).map(([role, label]) => (
                                  <option key={role} value={role}>{label}</option>
                                ))}
                              </select>
                            </label>
                            <button
                              type="button"
                              className="admin-users-action admin-users-action-delete"
                              aria-label={`Delete ${user.name || user.email}`}
                              title={isCurrentUser ? 'You cannot delete your own account' : 'Delete user'}
                              onClick={() => setDeleteTarget(user)}
                              disabled={isCurrentUser || isUpdating || isDeleting}
                            >
                              {isDeleting ? <RefreshCw size={16} className="admin-users-spin" /> : <Trash2 size={16} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {deleteTarget && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deletingId) setDeleteTarget(null);
          }}
        >
          <div className="modal-card animate-scale-up" role="alertdialog" aria-modal="true" aria-labelledby="delete-user-title">
            <div className="modal-header">
              <h3 id="delete-user-title">Delete user account?</h3>
              <button
                type="button"
                className="modal-close-btn"
                aria-label="Close confirmation"
                onClick={() => setDeleteTarget(null)}
                disabled={Boolean(deletingId)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="admin-users-modal-copy">
              <AlertTriangle size={22} color="#dc2626" aria-hidden="true" />
              <p>
                This permanently deletes <strong>{deleteTarget.name || deleteTarget.email}</strong>
                {' '}and cannot be undone.
              </p>
            </div>
            <div className="admin-users-modal-actions">
              <button
                type="button"
                className="admin-users-modal-button admin-users-modal-cancel"
                onClick={() => setDeleteTarget(null)}
                disabled={Boolean(deletingId)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-users-modal-button admin-users-modal-confirm"
                onClick={confirmDelete}
                disabled={Boolean(deletingId)}
              >
                {deletingId ? <RefreshCw size={15} className="admin-users-spin" /> : <Trash2 size={15} />}
                Delete account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;