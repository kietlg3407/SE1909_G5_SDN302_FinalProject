import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      return toast.error('Vui lòng điền đầy đủ các thông tin!');
    }

    if (password.length < 6) {
      return toast.error('Mật khẩu phải có ít nhất 6 ký tự!');
    }

    if (password !== confirmPassword) {
      return toast.error('Xác nhận mật khẩu không trùng khớp!');
    }

    setLoading(true);
    const res = await register(name, email, password);
    setLoading(false);

    if (res.success) {
      navigate('/');
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card animate-fade-in">
        <div className="auth-header">
          <div className="auth-icon-badge">
            <UserPlus size={26} />
          </div>
          <h2 className="auth-title">Tạo Tài Khoản Mới</h2>
          <p className="auth-subtitle">Đăng ký để tận hưởng ưu đãi và trải nghiệm tốt nhất</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Họ và tên *</label>
            <div className="input-with-icon">
              <User className="field-icon" size={18} />
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Địa chỉ Email *</label>
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
            <label>Mật khẩu *</label>
            <div className="input-with-icon">
              <Lock className="field-icon" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Tối thiểu 6 ký tự"
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

          <div className="form-group">
            <label>Xác nhận mật khẩu *</label>
            <div className="input-with-icon">
              <Lock className="field-icon" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
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
                <span>Đăng ký tài khoản</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <span>Đã có tài khoản? </span>
          <Link to="/login" className="auth-footer-link">Đăng nhập ngay</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
