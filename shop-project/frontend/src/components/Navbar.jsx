import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, ShoppingBag, Menu, X, ShieldCheck } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/login');
  };

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        {/* Brand / Logo */}
        <Link to="/" className="brand-logo">
          <div className="logo-badge">
            <ShoppingBag size={22} className="logo-icon" />
          </div>
          <span className="brand-name">
            CLOSET<span className="brand-accent">STUDIO</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="nav-links">
          <Link to="/" className="nav-link">Trang chủ</Link>
          <a href="#products" className="nav-link">Bộ sưu tập</a>
        </nav>

        {/* User Actions */}
        <div className="nav-actions">
          {isAuthenticated ? (
            <div className="user-dropdown-wrapper">
              <button
                className="user-profile-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="User menu"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="user-avatar-img" />
                ) : (
                  <div className="user-avatar-fallback">
                    <User size={18} strokeWidth={2} />
                  </div>
                )}
                <div className="user-info-text">
                  <span className="user-display-name">{user?.name}</span>
                  {isAdmin ? (
                    <span className="admin-tag">Admin</span>
                  ) : user?.role === 'staff' ? (
                    <span className="staff-tag">Staff</span>
                  ) : null}
                </div>
              </button>

              {dropdownOpen && (
                <div className="dropdown-menu animate-fade-in" onClick={() => setDropdownOpen(false)}>
                  <div className="dropdown-header">
                    <p className="dropdown-name">{user?.name}</p>
                    <p className="dropdown-email">{user?.email}</p>
                  </div>
                  <div className="dropdown-divider"></div>

                  <Link to="/profile" className="dropdown-item">
                    <User size={16} />
                    <span>Hồ sơ cá nhân</span>
                  </Link>

                  {isAdmin && (
                    <div className="dropdown-item admin-link">
                      <ShieldCheck size={16} />
                      <span>Trang Quản Trị</span>
                    </div>
                  )}

                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-item logout-btn">
                    <LogOut size={16} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-btn-group">
              <Link to="/login" className="btn-secondary">Đăng nhập</Link>
              <Link to="/register" className="btn-primary">Đăng ký</Link>
            </div>
          )}

          {/* Mobile hamburger button */}
          <button
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-menu animate-fade-in">
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>Trang chủ</Link>
          <a href="#products" onClick={() => setMobileMenuOpen(false)}>Bộ sưu tập</a>
          {isAuthenticated ? (
            <>
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>Hồ sơ & Địa chỉ</Link>
              <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="mobile-logout-btn">
                Đăng xuất
              </button>
            </>
          ) : (
            <div className="mobile-auth-actions">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn-secondary">Đăng nhập</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn-primary">Đăng ký</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
