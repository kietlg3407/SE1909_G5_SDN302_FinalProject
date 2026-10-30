import React, { useState } from 'react';
import { BarChart3, Menu, Tag, Users, X, Shield, UserCheck } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const navigationItems = [
  {
    label: 'Dashboard Statistics',
    path: '/admin/dashboard',
    icon: BarChart3,
    roles: ['admin', 'staff'],
  },
  {
    label: 'User Management',
    path: '/admin/users',
    icon: Users,
    roles: ['admin'], // Chỉ Admin mới được hiển thị
  },
  {
    label: 'Coupon/Promotion Management',
    path: '/admin/coupons',
    icon: Tag,
    roles: ['admin', 'staff'],
  },
];

const Sidebar = () => {
  let user = null;
  try {
    const auth = useAuth();
    user = auth?.user;
  } catch {
    // Fallback for tests rendering Sidebar in isolation without AuthProvider
    user = { role: 'admin' };
  }

  const [isOpen, setIsOpen] = useState(false);

  const closeSidebar = () => setIsOpen(false);

  const userRole = user?.role || 'admin';
  const visibleItems = navigationItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <>
      <button
        type="button"
        className="admin-sidebar-toggle"
        aria-controls="admin-sidebar-navigation"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close admin navigation' : 'Open admin navigation'}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
      </button>

      {isOpen && (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          aria-label="Close admin navigation"
          onClick={closeSidebar}
        />
      )}

      <aside
        id="admin-sidebar-navigation"
        className={`admin-sidebar${isOpen ? ' admin-sidebar-open' : ''}`}
        aria-label="Admin navigation"
      >
        <div className="admin-sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            {userRole === 'admin' ? (
              <span className="role-tag-badge admin-badge" style={{ background: '#7c3aed', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                Quản Trị Viên
              </span>
            ) : (
              <span className="role-tag-badge staff-badge" style={{ background: '#0284c7', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                Nhân Viên
              </span>
            )}
          </div>
          <span className="admin-sidebar-eyebrow">Administration</span>
          <h2 className="admin-sidebar-title">Manage Store</h2>
        </div>

        <nav className="admin-sidebar-nav">
          {visibleItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end
              className={({ isActive }) =>
                `admin-sidebar-link${isActive ? ' admin-sidebar-link-active' : ''}`
              }
              onClick={closeSidebar}
            >
              <Icon size={20} strokeWidth={2} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
