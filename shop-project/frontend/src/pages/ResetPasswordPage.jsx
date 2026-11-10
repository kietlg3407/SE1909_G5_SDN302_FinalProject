import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, KeyRound, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Xác nhận mật khẩu không trùng khớp!');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/api/users/reset-password/${token}`, { password });
      await logout(false);
      toast.success(response.data?.message || 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card animate-fade-in">
        <div className="auth-header">
          <div className="auth-icon-badge">
            <KeyRound size={26} />
          </div>
          <h2 className="auth-title">Đặt Lại Mật Khẩu</h2>
          <p className="auth-subtitle">Chọn mật khẩu mới cho tài khoản của bạn</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="reset-password">Mật khẩu mới</label>
            <div className="input-with-icon">
              <Lock className="field-icon" size={18} />
              <input
                id="reset-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reset-confirm">Xác nhận mật khẩu</label>
            <div className="input-with-icon">
              <Lock className="field-icon" size={18} />
              <input
                id="reset-confirm"
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary auth-submit-btn" disabled={loading || !token}>
            {loading ? (
              <span className="spinner-sm"></span>
            ) : (
              <>
                <span>Cập nhật mật khẩu</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <span>Nhớ mật khẩu? </span>
          <Link to="/login" className="auth-footer-link">Đăng nhập ngay</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
