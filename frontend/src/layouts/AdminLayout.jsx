import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LuLayoutDashboard, LuUsers, LuCalendarDays, LuCalendarClock, LuMessageSquare, LuStethoscope,
  LuHeartPulse, LuUserCog, LuLogOut, LuPanelLeftClose, LuPanelLeftOpen, LuGlobe, LuMonitor, LuMenu,
} from 'react-icons/lu';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import '../styles/admin.css';

const NAV = [
  { group: 'Overview', items: [
    { to: 'dashboard', icon: LuLayoutDashboard, label: 'Dashboard' },
  ] },
  { group: 'Front desk', items: [
    { to: 'appointments', icon: LuCalendarDays, label: 'Appointments' },
    { to: 'enquiries', icon: LuMessageSquare, label: 'Enquiries', badge: 'new_enquiries' },
    { to: 'patients', icon: LuUsers, label: 'Patients' },
    { to: 'schedule', icon: LuCalendarClock, label: 'Schedule' },
  ] },
  { group: 'Clinic', items: [
    { to: 'doctors', icon: LuStethoscope, label: 'Doctors' },
    { to: 'services', icon: LuHeartPulse, label: 'Services' },
    { to: 'staff', icon: LuUserCog, label: 'Staff', admin: true },
  ] },
];

const TITLES = Object.fromEntries(NAV.flatMap(g => g.items).map(i => [i.to, i.label]));

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem('admin-collapsed') === '1'; } catch { return false; } });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [counts, setCounts] = useState({});

  useEffect(() => { try { localStorage.setItem('admin-collapsed', collapsed ? '1' : '0'); } catch { /* private mode */ } }, [collapsed]);
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    const load = () => API.get('/api/dashboard/stats').then(r => setCounts(r.data)).catch(() => {});
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const section = pathname.split('/')[2] || 'dashboard';
  const now = new Date();

  return (
    <div className={`admin-shell${collapsed ? ' is-collapsed' : ''}${mobileOpen ? ' is-mobile-open' : ''}`}>
      <div className="admin-scrim" onClick={() => setMobileOpen(false)} />
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-mark"><img src="/brand/logo-mark-light.png" alt="" /></span>
          <div className="admin-brand-text">
            <strong>Srini Physio</strong>
            <span>Clinic console</span>
          </div>
        </div>

        <nav className="admin-nav">
          {NAV.map(g => (
            <div key={g.group} className="admin-nav-group">
              <div className="admin-nav-label">{g.group}</div>
              {g.items.filter(i => !i.admin || user?.role === 'admin').map(({ to, icon: Icon, label, badge }) => (
                <NavLink key={to} to={to} className={({ isActive }) => `admin-link${isActive ? ' active' : ''}`} title={collapsed ? label : undefined}>
                  <span className="admin-link-icon"><Icon /></span>
                  <span className="admin-link-text">{label}</span>
                  {badge && counts[badge] > 0 && <span className="admin-link-badge">{counts[badge]}</span>}
                </NavLink>
              ))}
            </div>
          ))}
          <div className="admin-nav-group">
            <div className="admin-nav-label">Screens</div>
            <a href="/admin/queue" target="_blank" rel="noopener" className="admin-link" title={collapsed ? 'Token screen' : undefined}>
              <span className="admin-link-icon"><LuMonitor /></span><span className="admin-link-text">Token screen</span>
            </a>
            <a href="/" target="_blank" rel="noopener" className="admin-link" title={collapsed ? 'Website' : undefined}>
              <span className="admin-link-icon"><LuGlobe /></span><span className="admin-link-text">Website</span>
            </a>
          </div>
        </nav>

        <div className="admin-user">
          <span className="admin-avatar">{user?.name?.[0]?.toUpperCase()}</span>
          <div className="admin-user-text">
            <strong>{user?.name}</strong>
            <span>{user?.role === 'admin' ? 'Administrator' : 'Receptionist'}</span>
          </div>
          <button onClick={handleLogout} className="admin-logout" title="Sign out" aria-label="Sign out"><LuLogOut /></button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            <button className="admin-icon-btn admin-only-mobile" onClick={() => setMobileOpen(true)} aria-label="Open menu"><LuMenu /></button>
            <button className="admin-icon-btn admin-only-desktop" onClick={() => setCollapsed(c => !c)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              {collapsed ? <LuPanelLeftOpen /> : <LuPanelLeftClose />}
            </button>
            <div style={{ minWidth: 0 }}>
              <div className="admin-crumb">Clinic console</div>
              <div className="admin-title">{TITLES[section] || 'Admin'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {(counts.waiting_now > 0 || counts.in_therapy_now > 0) && (
              <span className="admin-live"><i /> {counts.waiting_now || 0} waiting · {counts.in_therapy_now || 0} in therapy</span>
            )}
            <span className="admin-date">{now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}</span>
          </div>
        </header>

        <main className="admin-content" key={pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
