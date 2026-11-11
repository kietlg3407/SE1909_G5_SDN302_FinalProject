import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight, Shield, UserCheck, User } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    const res = await login(email.trim().toLowerCase(), password);
    setLoading(false);

    if (res.success) {
      // Phân quyền chuyển hướng sau khi đăng nhập:
      // - Admin và Staff: mặc định vào /admin/dashboard
      // - Customer: chuyển về trang chủ /
      if (res.user?.role === 'admin' || res.user?.role === 'staff') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  };

  const handleQuickFill = (testEmail, testPassword) => {
    setEmail(testEmail);
    setPassword(testPassword);
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card animate-fade-in">
        <div className="auth-header">
          <div className="auth-icon-badge">
            <LogIn size={26} />
          </div>
          <h2 className="auth-title">Chào Mừng Trở Lại</h2>
          <p className="auth-subtitle">Đăng nhập tài khoản để tiếp tục trải nghiệm</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Địa chỉ Email</label>
            <div className="input-with-icon">
              <Mail className="field-icon" size={18} />
              <input
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <div className="input-with-icon">
              <Lock className="field-icon" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-sm"></span>
            ) : (
              <>
                <span>Đăng nhập</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Khối tiện ích điền nhanh tài khoản kiểm thử chuẩn */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed #e2e8f0' }}>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', textAlign: 'center', fontWeight: 600 }}>
            Tài khoản kiểm thử nhanh:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              type="button"
              className="btn-outline"
              style={{ fontSize: '11px', padding: '6px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}
              onClick={() => handleQuickFill('admin@shop.com', 'admin123')}
            >
              <Shield size={14} color="#7c3aed" />
              <strong>Admin</strong>
            </button>
            <button
              type="button"
              className="btn-outline"
              style={{ fontSize: '11px', padding: '6px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}
              onClick={() => handleQuickFill('staff@shop.com', 'staff123')}
            >
              <UserCheck size={14} color="#0284c7" />
              <strong>Staff</strong>
            </button>
            <button
              type="button"
              className="btn-outline"
              style={{ fontSize: '11px', padding: '6px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}
              onClick={() => handleQuickFill('customer@shop.com', 'password123')}
            >
              <User size={14} color="#16a34a" />
              <strong>Customer</strong>
            </button>
          </div>
        </div>

        <div className="auth-footer">
          <span>Chưa có tài khoản? </span>
          <Link to="/register" className="auth-footer-link">Đăng ký ngay</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
