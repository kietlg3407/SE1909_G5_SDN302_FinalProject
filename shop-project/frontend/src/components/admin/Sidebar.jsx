import { BarChart3, Menu, Tag, Users, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useState } from 'react';

const navigationItems = [
  {
    label: 'Dashboard Statistics',
    path: '/admin/dashboard',
    icon: BarChart3,
  },
  {
    label: 'User Management',
    path: '/admin/users',
    icon: Users,
  },
  {
    label: 'Coupon/Promotion Management',
    path: '/admin/coupons',
    icon: Tag,
  },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const closeSidebar = () => setIsOpen(false);

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
          <span className="admin-sidebar-eyebrow">Administration</span>
          <h2 className="admin-sidebar-title">Manage Store</h2>
        </div>

        <nav className="admin-sidebar-nav">
          {navigationItems.map(({ label, path, icon: Icon }) => (
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