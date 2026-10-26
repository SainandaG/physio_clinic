import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth, isStaff } from './context/AuthContext';
import './index.css';
import './styles/account.css';
import './styles/website.css';

// Public pages
import PublicLayout from './layouts/PublicLayout';
import Home from './pages/site/Home';
import Treatments from './pages/site/Treatments';
import TreatmentDetail from './pages/site/TreatmentDetail';
import About from './pages/site/About';
import Contact from './pages/site/Contact';
import Account from './pages/site/Account';
import Blog from './pages/site/Blog';
import BlogPost from './pages/site/BlogPost';
import AuthPage from './pages/auth/AuthPage';

// Admin pages
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Patients from './pages/admin/Patients';
import Appointments from './pages/admin/Appointments';
import Schedule from './pages/admin/Schedule';
import QueueDisplay from './pages/admin/QueueDisplay';
import Doctors from './pages/admin/Doctors';
import Services from './pages/admin/Services';
import Enquiries from './pages/admin/Enquiries';
import Staff from './pages/admin/Staff';
import AdminBlog from './pages/admin/Blog';
import SiteContent from './pages/admin/SiteContent';

const Loading = () => (
  <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--paper)' }}>
    <div className="spinner" />
  </div>
);

// Admin panel: clinic staff only. Patients are sent to their own account.
function StaffRoute({ children }) {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <Loading />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />;
  return isStaff(user) ? children : <Navigate to="/account" replace />;
}

function PatientRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login?next=/account" replace />;
  return isStaff(user) ? <Navigate to="/admin/dashboard" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ style:{ fontFamily:'DM Sans,sans-serif', fontWeight:600 } }} />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/treatments" element={<Treatments />} />
            <Route path="/treatments/:slug" element={<TreatmentDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/account" element={<PatientRoute><Account /></PatientRoute>} />
          </Route>

          {/* One sign-in for patients and staff */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/admin/login" element={<Navigate to="/login?next=/admin/dashboard" replace />} />
          <Route path="/admin/queue" element={<StaffRoute><QueueDisplay /></StaffRoute>} />

          {/* Admin (staff only) */}
          <Route path="/admin" element={<StaffRoute><AdminLayout /></StaffRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"    element={<Dashboard />} />
            <Route path="patients"     element={<Patients />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="schedule"     element={<Schedule />} />
            <Route path="doctors"      element={<Doctors />} />
            <Route path="services"     element={<Services />} />
            <Route path="enquiries"    element={<Enquiries />} />
            <Route path="staff"        element={<Staff />} />
            <Route path="blog"         element={<AdminBlog />} />
            <Route path="content"      element={<SiteContent />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
