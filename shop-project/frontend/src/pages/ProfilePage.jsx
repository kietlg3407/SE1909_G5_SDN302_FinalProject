import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AddressManager from '../components/AddressManager';
import api from '../services/api';
import toast from 'react-hot-toast';
import { User, MapPin, KeyRound, Camera, Shield, Mail, Calendar, Check, Save } from 'lucide-react';

const ProfilePage = () => {
  const { user, updateProfile, changePassword, refreshUser } = useAuth();
  const location = useLocation();

  // Đọc query param ?tab=addresses nếu có
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'profile';

  const [activeTab, setActiveTab] = useState(initialTab);

  // Form states cho Cập nhật thông tin
  const [name, setName] = useState(user?.name || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Form states cho Đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  useEffect(() => {
    const tab = queryParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search]);

  // Xử lý upload ảnh đại diện lên Cloudinary
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Kiểm tra định dạng và dung lượng (< 5MB)
    if (!file.type.startsWith('image/')) {
      return toast.error('Vui lòng chỉ chọn tệp hình ảnh (JPG, PNG, WEBP)');
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Kích thước ảnh tối đa là 5MB');
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setUploadingAvatar(true);
      const res = await api.post('/api/users/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Cập nhật ảnh đại diện thành công!');
      await refreshUser();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload ảnh thất bại');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Cập nhật họ tên
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      return toast.error('Họ tên không được để trống');
    }
    setSavingProfile(true);
    await updateProfile({ name: name.trim() });
    setSavingProfile(false);
  };

  // Xử lý đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return toast.error('Vui lòng điền đầy đủ các thông tin mật khẩu');
    }
    if (newPassword.length < 6) {
      return toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
    }
    if (newPassword !== confirmNewPassword) {
      return toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp');
    }

    setSavingPassword(true);
    const res = await changePassword(currentPassword, newPassword);
    setSavingPassword(false);

    if (res.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
  };

  return (
    <div className="profile-page-container">
      {/* Profile Header Banner */}
      <div className="profile-banner-card">
        <div className="avatar-upload-wrapper">
          <div className="avatar-img-box">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="profile-large-avatar" />
            ) : (
              <div className="profile-large-fallback">
                <User size={48} strokeWidth={1.5} />
              </div>
            )}
            {uploadingAvatar && (
              <div className="avatar-loading-overlay">
                <span className="spinner-sm"></span>
              </div>
            )}
          </div>

          <label className="avatar-change-btn" title="Đổi ảnh đại diện">
            <Camera size={16} />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <div className="profile-header-info">
          <div className="profile-name-row">
            <h1 className="profile-user-name">{user?.name}</h1>
            <span className={`role-badge ${user?.role === 'admin' ? 'role-admin' : user?.role === 'staff' ? 'role-staff' : 'role-customer'}`}>
              <Shield size={14} />
              {user?.role === 'admin' ? 'Quản Trị Viên (Admin)' : user?.role === 'staff' ? 'Nhân Viên (Staff)' : 'Khách Hàng'}
            </span>
          </div>

          <div className="profile-meta-info">
            <div className="meta-item">
              <Mail size={16} />
              <span>{user?.email}</span>
            </div>
            <div className="meta-item">
              <Calendar size={16} />
              <span>
                Tham gia: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Mới đây'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="profile-content-layout">
        {/* Sidebar Tabs */}
        <aside className="profile-tabs-sidebar">
          <button
            className={`tab-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} />
            <span>Thông tin cá nhân</span>
          </button>

          <button
            className={`tab-nav-btn ${activeTab === 'addresses' ? 'active' : ''}`}
            onClick={() => setActiveTab('addresses')}
          >
            <MapPin size={18} />
            <span>Sổ địa chỉ ({user?.addresses?.length || 0})</span>
          </button>

          <button
            className={`tab-nav-btn ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <KeyRound size={18} />
            <span>Đổi mật khẩu</span>
          </button>
        </aside>

        {/* Tab Content Box */}
        <main className="profile-tab-content animate-fade-in">
          {activeTab === 'profile' && (
            <div className="tab-pane">
              <h2 className="section-title">Hồ Sơ Của Tôi</h2>
              <p className="section-subtitle">Quản lý thông tin hồ sơ để bảo mật tài khoản</p>

              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="form-group">
                  <label>Họ và tên</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nhập họ và tên của bạn"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email đăng ký</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="input-disabled"
                  />
                  <small className="help-text">Email dùng để đăng nhập và không thể thay đổi</small>
                </div>

                <div className="form-group">
                  <label>Vai trò tài khoản</label>
                  <input
                    type="text"
                    value={
                      user?.role === 'admin'
                        ? 'Quản trị viên (Admin)'
                        : user?.role === 'staff'
                        ? 'Nhân viên quản lý (Staff)'
                        : 'Khách hàng thành viên (Customer)'
                    }
                    disabled
                    className="input-disabled"
                  />
                </div>

                <div className="form-submit-row">
                  <button type="submit" className="btn-primary" disabled={savingProfile}>
                    <Save size={18} />
                    <span>{savingProfile ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="tab-pane">
              <AddressManager />
            </div>
          )}

          {activeTab === 'password' && (
            <div className="tab-pane">
              <h2 className="section-title">Đổi Mật Khẩu</h2>
              <p className="section-subtitle">Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác</p>

              <form onSubmit={handleChangePassword} className="profile-form">
                <div className="form-group">
                  <label>Mật khẩu hiện tại *</label>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu hiện tại"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mật khẩu mới *</label>
                  <input
                    type="password"
                    placeholder="Tối thiểu 6 ký tự"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Xác nhận mật khẩu mới *</label>
                  <input
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-submit-row">
                  <button type="submit" className="btn-primary" disabled={savingPassword}>
                    <KeyRound size={18} />
                    <span>{savingPassword ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;
