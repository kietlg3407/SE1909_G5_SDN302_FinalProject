import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, KeyRound, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentMessage, setSentMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error('Vui lòng nhập email');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/users/forgot-password', { email: cleanEmail });
      const message = response.data?.message || 'Vui lòng kiểm tra hộp thư của bạn.';
      setSentMessage(message);
      toast.success(message);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể gửi yêu cầu đặt lại mật khẩu');
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
          <h2 className="auth-title">Quên Mật Khẩu</h2>
          <p className="auth-subtitle">Nhập email tài khoản để nhận liên kết đặt lại mật khẩu</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="forgot-email">Địa chỉ Email</label>
            <div className="input-with-icon">
              <Mail className="field-icon" size={18} />
              <input
                id="forgot-email"
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {sentMessage ? <p className="auth-subtitle">{sentMessage}</p> : null}

          <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
            {loading ? (
              <span className="spinner-sm"></span>
            ) : (
              <>
                <span>Gửi liên kết</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="auth-footer-link">Quay lại đăng nhập</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
