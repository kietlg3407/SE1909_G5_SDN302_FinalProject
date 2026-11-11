import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { User, LogOut, ShoppingBag, ShoppingCart, Menu, X, ShieldCheck, Heart, ClipboardList, Star } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin, isStaff } = useAuth();
  const { cartCount, wishlistCount } = useCart();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    navigate('/login');
  };

  const hasAdminAccess = isAdmin || isStaff;

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

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <Link to="/" className="nav-link">
            Trang Chủ
          </Link>
          <Link to="/products" className="nav-link">
            Sản Phẩm
          </Link>
          {hasAdminAccess && (
            <Link to="/admin/dashboard" className="nav-link admin-highlight">
              Quản Trị
            </Link>
          )}
        </nav>

        {/* User Actions */}
        <div className="nav-actions">
          {isAuthenticated ? (
            <>
              {hasAdminAccess && (
                <Link to="/admin/dashboard" className="admin-header-btn" title="Đi đến Trang Quản Trị">
                  <ShieldCheck size={16} />
                  <span>{isAdmin ? 'Admin Dashboard' : 'Staff Dashboard'}</span>
                </Link>
              )}
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
                      <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'capitalize' }}>
                        Vai trò: {user?.role === 'admin' ? 'Quản trị viên' : user?.role === 'staff' ? 'Nhân viên' : 'Khách hàng'}
                      </span>
                    </div>
                    <div className="dropdown-divider"></div>

                    {hasAdminAccess && (
                      <Link to="/admin/dashboard" className="dropdown-item admin-link" onClick={() => setDropdownOpen(false)}>
                        <ShieldCheck size={16} />
                        <span>Trang Quản Trị ({user?.role === 'admin' ? 'Admin' : 'Staff'})</span>
                      </Link>
                    )}

                    <Link to="/cart" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <ShoppingCart size={16} />
                      <span>Giỏ hàng ({cartCount})</span>
                    </Link>
                    <Link to="/wishlist" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <Heart size={16} color="#ef4444" />
                      <span>Sản phẩm yêu thích ({wishlistCount})</span>
                    </Link>
                    <Link to="/orders" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <ClipboardList size={16} />
                      <span>Đơn hàng của tôi</span>
                    </Link>
                    <Link to="/my-reviews" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <Star size={16} color="#f59e0b" fill="#f59e0b" />
                      <span>Đánh giá của tôi</span>
                    </Link>
                    <Link to="/profile" className="dropdown-item">
                      <User size={16} />
                      <span>Hồ sơ cá nhân</span>
                    </Link>

                    <div className="dropdown-divider"></div>
                    <button onClick={handleLogout} className="dropdown-item logout-btn">
                      <LogOut size={16} />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Giỏ hàng */}
              <Link
                to="/cart"
                className="header-favorites-btn"
                title="Giỏ hàng"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '999px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  fontWeight: 600,
                  fontSize: '13px',
                  textDecoration: 'none',
                  position: 'relative',
                }}
              >
                <ShoppingCart size={16} />
                <span>Giỏ Hàng</span>
                {cartCount > 0 && (
                  <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#dc2626', color: '#fff', fontSize: '10px', fontWeight: 700, minWidth: '18px', height: '18px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="header-favorites-btn"
                title="Danh sách yêu thích"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '999px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  fontWeight: 600,
                  fontSize: '13px',
                  textDecoration: 'none',
                  position: 'relative',
                }}
              >
                <Heart size={16} fill="#ef4444" color="#ef4444" />
                <span>Yêu Thích</span>
                {wishlistCount > 0 && (
                  <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#dc2626', color: '#fff', fontSize: '10px', fontWeight: 700, minWidth: '18px', height: '18px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </Link>

            </>
          ) : (
            <div className="auth-btn-group">
              <Link to="/login" className="btn-secondary">Đăng nhập</Link>
              <Link to="/register" className="btn-primary">Đăng ký</Link>
            </div>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer animate-slide-down">
          <Link to="/" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
            Trang Chủ
          </Link>
          <Link to="/products" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
            Sản Phẩm
          </Link>
          {hasAdminAccess && (
            <Link
              to="/admin/dashboard"
              className="mobile-link admin-highlight"
              onClick={() => setMobileMenuOpen(false)}
            >
              Trang Quản Trị ({isAdmin ? 'Admin' : 'Staff'})
            </Link>
          )}
          {isAuthenticated ? (
            <>
              <Link to="/cart" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                Giỏ Hàng ({cartCount})
              </Link>
              <Link to="/wishlist" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                Sản Phẩm Yêu Thích ({wishlistCount})
              </Link>
              <Link to="/orders" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                Đơn Hàng Của Tôi
              </Link>
              <Link to="/my-reviews" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                Đánh Giá Của Tôi
              </Link>
              <Link to="/profile" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                Hồ Sơ Cá Nhân
              </Link>
              <button onClick={handleLogout} className="mobile-link logout-text-btn">
                Đăng Xuất
              </button>
            </>
          ) : (
            <div className="mobile-auth-links">
              <Link to="/login" className="btn-secondary full-width" onClick={() => setMobileMenuOpen(false)}>
                Đăng Nhập
              </Link>
              <Link to="/register" className="btn-primary full-width" onClick={() => setMobileMenuOpen(false)}>
                Đăng Ký
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
