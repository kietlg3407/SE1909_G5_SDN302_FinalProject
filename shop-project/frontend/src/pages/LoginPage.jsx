import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    const res = await login(email.trim().toLowerCase(), password);
    setLoading(false);

    if (res.success) {
      navigate(from, { replace: true });
    }
  };

  // Nút điền nhanh tài khoản test đã tạo
  const handleQuickFill = () => {
    setEmail('bao@shop.com');
    setPassword('password123');
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card animate-fade-in">
        <div className="auth-header">
          <div className="auth-icon-badge">
            <LogIn size={26} />
          </div>
          <h2 className="auth-title">Chào Mừng Trở Lại</h2>
          <p className="auth-subtitle">Đăng nhập tài khoản để tiếp tục trải nghiệm mua sắm</p>
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
            <div className="label-with-link">
              <label>Mật khẩu</label>
              <a href="#forgot" className="forgot-link">Quên mật khẩu?</a>
            </div>
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

        <div className="auth-footer">
          <span>Chưa có tài khoản? </span>
          <Link to="/register" className="auth-footer-link">Đăng ký ngay</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
