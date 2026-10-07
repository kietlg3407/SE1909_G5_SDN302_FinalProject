import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ChevronDown,
  Edit3,
  Mail,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const ROLE_LABELS = {
  customer: 'Khách hàng',
  staff: 'Nhân viên',
  admin: 'Quản trị viên',
};

const ROLE_CLASSES = {
  customer: 'admin-user-role-customer',
  staff: 'admin-user-role-staff',
  admin: 'admin-user-role-admin',
};

const getUserId = (user) => user?._id || user?.id;

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.response?.data?.error || fallback;

const formatDate = (date) => {
  if (!date) return 'Chưa cập nhật';
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime())
    ? 'Chưa cập nhật'
    : parsedDate.toLocaleDateString('vi-VN', {
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
  const [editingId, setEditingId] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/users');
      const receivedUsers = response.data?.users;
      setUsers(Array.isArray(receivedUsers) ? receivedUsers : []);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể tải danh sách người dùng'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const counts = useMemo(
    () =>
      users.reduce(
        (result, account) => {
          result.all += 1;
          if (result[account.role] !== undefined) result[account.role] += 1;
          return result;
        },
        { all: 0, customer: 0, staff: 0, admin: 0 }
      ),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return users
      .filter((account) => {
        const matchesQuery =
          !normalizedQuery ||
          [account.name, account.email].some((value) =>
            String(value || '').toLowerCase().includes(normalizedQuery)
          );
        return matchesQuery && (roleFilter === 'all' || account.role === roleFilter);
      })
      .sort((first, second) => String(first.name || '').localeCompare(String(second.name || '')));
  }, [query, roleFilter, users]);

  const isCurrentUser = (account) =>
    Boolean(currentUser && getUserId(account) === getUserId(currentUser));

  const startEditing = (account) => {
    setEditingId(getUserId(account));
    setSelectedRole(account.role);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setSelectedRole('');
  };

  const updateRole = async (account) => {
    const accountId = getUserId(account);
    if (!accountId || selectedRole === account.role) {
      cancelEditing();
      return;
    }

    try {
      setUpdatingId(accountId);
      const response = await api.put(`/api/admin/users/${accountId}/role`, {
        role: selectedRole,
      });
      const updatedUser = response.data?.user;
      setUsers((currentUsers) =>
        currentUsers.map((currentUserItem) =>
          getUserId(currentUserItem) === accountId
            ? updatedUser || { ...currentUserItem, role: selectedRole }
            : currentUserItem
        )
      );
      toast.success(`Đã cập nhật quyền của ${account.name}`);
      cancelEditing();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể cập nhật quyền người dùng'));
    } finally {
      setUpdatingId(null);
    }
  };

  const revokeAccount = async (account) => {
    const accountId = getUserId(account);
    if (!accountId || isCurrentUser(account)) return;
    if (!window.confirm(`Thu hồi tài khoản của ${account.name || account.email}?`)) return;

    try {
      setDeletingId(accountId);
      await api.delete(`/api/admin/users/${accountId}`);
      setUsers((currentUsers) =>
        currentUsers.filter((currentUserItem) => getUserId(currentUserItem) !== accountId)
      );
      toast.success('Đã thu hồi tài khoản');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể thu hồi tài khoản'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="admin-users-page">
      <style>{`
        .admin-users-page { min-height: 100vh; padding: 36px clamp(16px, 4vw, 56px) 56px; background: #f8fafc; color: #0f172a; }
        .admin-users-shell { max-width: 1440px; margin: 0 auto; }
        .admin-users-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 28px; }
        .admin-users-eyebrow { display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 13px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
        .admin-users-header h1 { margin: 8px 0 6px; font-size: clamp(26px, 4vw, 36px); letter-spacing: -.04em; }
        .admin-users-header p { color: #64748b; font-size: 14px; }
        .admin-users-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid #cbd5e1; border-radius: 9px; background: #fff; color: #334155; padding: 10px 14px; font: inherit; font-size: 13px; font-weight: 700; transition: .2s; }
        .admin-users-button:hover:not(:disabled) { background: #f1f5f9; }
        .admin-users-button:disabled { cursor: not-allowed; opacity: .6; }
        .admin-users-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 24px; }
        .admin-users-stat { display: flex; align-items: center; gap: 13px; border: 1px solid #e2e8f0; border-radius: 14px; background: #fff; padding: 17px; box-shadow: 0 4px 16px rgb(15 23 42 / 4%); }
        .admin-users-stat-icon { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 10px; background: #f1f5f9; color: #475569; }
        .admin-users-stat strong { display: block; font-size: 20px; line-height: 1.1; }
        .admin-users-stat span { display: block; color: #64748b; font-size: 11px; margin-top: 4px; }
        .admin-users-card { min-width: 0; overflow: hidden; border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; box-shadow: 0 4px 16px rgb(15 23 42 / 5%); }
        .admin-users-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 20px 22px; border-bottom: 1px solid #e2e8f0; }
        .admin-users-toolbar h2 { font-size: 18px; }
        .admin-users-toolbar p { color: #64748b; font-size: 12px; margin-top: 4px; }
        .admin-users-tools { display: flex; gap: 8px; }
        .admin-users-search { position: relative; min-width: 230px; }
        .admin-users-search svg { position: absolute; top: 10px; left: 10px; color: #94a3b8; }
        .admin-users-search input, .admin-users-role-filter select, .admin-users-role-editor select { width: 100%; border: 1px solid #cbd5e1; border-radius: 9px; background: #fff; color: #0f172a; font: inherit; font-size: 13px; padding: 10px 12px; }
        .admin-users-search input { padding-left: 33px; }
        .admin-users-search input:focus, .admin-users-role-filter select:focus, .admin-users-role-editor select:focus { outline: none; border-color: #475569; box-shadow: 0 0 0 3px rgb(71 85 105 / 12%); }
        .admin-users-role-filter { position: relative; min-width: 145px; }
        .admin-users-role-filter svg { position: absolute; pointer-events: none; right: 10px; top: 11px; color: #64748b; }
        .admin-users-role-filter select { appearance: none; padding-right: 30px; }
        .admin-users-table-wrap { overflow-x: auto; }
        .admin-users-table { width: 100%; min-width: 760px; border-collapse: collapse; }
        .admin-users-table th { background: #f8fafc; color: #64748b; font-size: 11px; font-weight: 800; letter-spacing: .04em; padding: 12px 20px; text-align: left; text-transform: uppercase; white-space: nowrap; }
        .admin-users-table td { border-top: 1px solid #f1f5f9; padding: 14px 20px; font-size: 13px; vertical-align: middle; }
        .admin-users-table tbody tr:hover { background: #fafafa; }
        .admin-users-profile { display: flex; align-items: center; gap: 11px; min-width: 210px; }
        .admin-users-avatar { display: grid; place-items: center; flex: 0 0 auto; width: 38px; height: 38px; overflow: hidden; border-radius: 50%; background: #e2e8f0; color: #475569; font-size: 12px; font-weight: 800; }
        .admin-users-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .admin-users-name { display: block; color: #0f172a; font-weight: 800; }
        .admin-users-email { display: flex; align-items: center; gap: 5px; color: #64748b; font-size: 12px; margin-top: 2px; }
        .admin-users-role { display: inline-flex; align-items: center; border-radius: 999px; padding: 5px 9px; font-size: 11px; font-weight: 800; white-space: nowrap; }
        .admin-user-role-customer { background: #f1f5f9; color: #475569; }
        .admin-user-role-staff { background: #fef3c7; color: #a16207; }
        .admin-user-role-admin { background: #ede9fe; color: #6d28d9; }
        .admin-users-current { color: #64748b; font-size: 11px; font-weight: 700; margin-left: 6px; }
        .admin-users-actions { display: flex; justify-content: flex-end; gap: 4px; white-space: nowrap; }
        .admin-users-icon-button { display: inline-flex; align-items: center; justify-content: center; border-radius: 7px; color: #64748b; padding: 7px; }
        .admin-users-icon-button:hover:not(:disabled) { background: #f1f5f9; color: #0f172a; }
        .admin-users-icon-button-danger:hover:not(:disabled) { background: #fef2f2; color: #dc2626; }
        .admin-users-role-editor { display: flex; align-items: center; gap: 6px; }
        .admin-users-role-editor select { min-width: 130px; padding: 7px 9px; }
        .admin-users-save { display: inline-flex; align-items: center; justify-content: center; border-radius: 7px; background: #0f172a; color: #fff; padding: 7px; }
        .admin-users-save:hover:not(:disabled) { background: #1e293b; }
        .admin-users-cancel { display: inline-flex; align-items: center; justify-content: center; border-radius: 7px; color: #64748b; padding: 7px; }
        .admin-users-cancel:hover { background: #f1f5f9; color: #0f172a; }
        .admin-users-empty, .admin-users-loading { display: grid; place-items: center; gap: 8px; min-height: 230px; padding: 28px; color: #64748b; text-align: center; font-size: 13px; }
        .admin-users-spin { animation: admin-users-spin 1s linear infinite; }
        @keyframes admin-users-spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) { .admin-users-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 650px) { .admin-users-page { padding-top: 24px; } .admin-users-header { align-items: flex-start; flex-direction: column; } .admin-users-toolbar { align-items: stretch; flex-direction: column; } .admin-users-tools { flex-direction: column; } .admin-users-search, .admin-users-role-filter { min-width: 0; } }
      `}</style>

      <div className="admin-users-shell">
        <header className="admin-users-header">
          <div>
            <div className="admin-users-eyebrow"><ShieldCheck size={15} /> Quản trị hệ thống</div>
            <h1>Quản lý người dùng</h1>
            <p>Phân quyền và quản lý quyền truy cập của các tài khoản trong hệ thống.</p>
          </div>
          <button type="button" className="admin-users-button" onClick={fetchUsers} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'admin-users-spin' : ''} /> Làm mới
          </button>
        </header>

        <section className="admin-users-summary" aria-label="Tổng quan người dùng">
          <div className="admin-users-stat"><div className="admin-users-stat-icon"><Users size={18} /></div><div><strong>{counts.all}</strong><span>Tổng tài khoản</span></div></div>
          <div className="admin-users-stat"><div className="admin-users-stat-icon"><UserRound size={18} /></div><div><strong>{counts.customer}</strong><span>Khách hàng</span></div></div>
          <div className="admin-users-stat"><div className="admin-users-stat-icon"><Shield size={18} /></div><div><strong>{counts.staff}</strong><span>Nhân viên</span></div></div>
          <div className="admin-users-stat"><div className="admin-users-stat-icon"><ShieldCheck size={18} /></div><div><strong>{counts.admin}</strong><span>Quản trị viên</span></div></div>
        </section>

        <section className="admin-users-card">
          <div className="admin-users-toolbar">
            <div><h2>Tất cả tài khoản</h2><p>{filteredUsers.length} tài khoản được hiển thị</p></div>
            <div className="admin-users-tools">
              <div className="admin-users-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên hoặc email..." aria-label="Tìm người dùng" /></div>
              <label className="admin-users-role-filter"><ChevronDown size={15} /><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} aria-label="Lọc vai trò"><option value="all">Tất cả vai trò</option><option value="customer">Khách hàng</option><option value="staff">Nhân viên</option><option value="admin">Quản trị viên</option></select></label>
            </div>
          </div>

          {loading ? (
            <div className="admin-users-loading"><RefreshCw size={23} className="admin-users-spin" /> Đang tải danh sách người dùng...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="admin-users-empty"><Users size={25} />{users.length ? 'Không tìm thấy tài khoản phù hợp.' : 'Chưa có người dùng nào.'}</div>
          ) : (
            <div className="admin-users-table-wrap">
              <table className="admin-users-table">
                <thead><tr><th>Người dùng</th><th>Vai trò</th><th>Ngày tham gia</th><th>Địa chỉ</th><th aria-label="Thao tác" /></tr></thead>
                <tbody>
                  {filteredUsers.map((account) => {
                    const accountId = getUserId(account);
                    const ownAccount = isCurrentUser(account);
                    const editing = editingId === accountId;
                    return (
                      <tr key={accountId || account.email}>
                        <td><div className="admin-users-profile"><div className="admin-users-avatar">{account.avatar ? <img src={account.avatar} alt="" /> : getInitials(account.name, account.email)}</div><div><span className="admin-users-name">{account.name || 'Chưa đặt tên'}{ownAccount && <span className="admin-users-current">Bạn</span>}</span><span className="admin-users-email"><Mail size={12} />{account.email}</span></div></div></td>
                        <td>{editing ? <div className="admin-users-role-editor"><select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)} aria-label={`Vai trò của ${account.name}`}><option value="customer">Khách hàng</option><option value="staff">Nhân viên</option><option value="admin">Quản trị viên</option></select><button type="button" className="admin-users-save" onClick={() => updateRole(account)} disabled={updatingId === accountId} aria-label="Lưu vai trò">{updatingId === accountId ? <RefreshCw size={14} className="admin-users-spin" /> : <ShieldCheck size={14} />}</button><button type="button" className="admin-users-cancel" onClick={cancelEditing} aria-label="Hủy sửa"><X size={14} /></button></div> : <span className={`admin-users-role ${ROLE_CLASSES[account.role] || ROLE_CLASSES.customer}`}>{ROLE_LABELS[account.role] || account.role || 'Khách hàng'}</span>}</td>
                        <td>{formatDate(account.createdAt)}</td>
                        <td>{account.addresses?.length ? `${account.addresses.length} địa chỉ` : 'Chưa có'}</td>
                        <td><div className="admin-users-actions">{!ownAccount && <><button type="button" className="admin-users-icon-button" onClick={() => startEditing(account)} disabled={editing || deletingId === accountId} aria-label={`Đổi vai trò cho ${account.name}`}><Edit3 size={15} /></button><button type="button" className="admin-users-icon-button admin-users-icon-button-danger" onClick={() => revokeAccount(account)} disabled={deletingId === accountId || updatingId === accountId} aria-label={`Thu hồi ${account.name}`}>{deletingId === accountId ? <RefreshCw size={15} className="admin-users-spin" /> : <Trash2 size={15} />}</button></>}</div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminUsersPage;