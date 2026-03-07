import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AIPlanner from './components/AIPlanner';
import Calendar from './components/Calendar';
import Settings from './components/Settings';
import Toast from './components/Toast';
import AuthPage from './components/AuthPage';
import AccountManagement from './components/AccountManagement';
import Subjects from './components/Subjects';
import Progress from './components/Progress';
import AdminPanel from './components/AdminPanel';
import './App.css';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef(null);

  // On mount, check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('studyai_user');
    const storedToken = localStorage.getItem('studyai_token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setAuthLoading(false);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    showToast(`Welcome back, ${userData.name}! 🎉`);
  };

  const handleLogout = () => {
    setShowAccountMenu(false);
    if (window.confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('studyai_token');
      localStorage.removeItem('studyai_user');
      setUser(null);
      setActiveTab('dashboard');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleUserUpdate = (updated) => {
    setUser(updated);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} showToast={showToast} />;
      case 'calendar':
        return <Calendar onNavigate={setActiveTab} />;
      case 'planner':
        return <AIPlanner showToast={showToast} />;
      case 'progress':
        return <Progress />;
      case 'subjects':
        return <Subjects showToast={showToast} />;
      case 'settings':
        return <Settings showToast={showToast} user={user} />;
      case 'account':
        return <AccountManagement user={user} showToast={showToast} onUserUpdate={handleUserUpdate} />;
      case 'admin':
        return <AdminPanel user={user} showToast={showToast} />;
      default:
        return <Dashboard onNavigate={setActiveTab} showToast={showToast} />;
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0f172a', color: '#818cf8', fontSize: '18px', fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px', border: '3px solid rgba(99,102,241,0.2)',
            borderTopColor: '#6366f1', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          Loading...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Not logged in — show auth page
  if (!user) {
    return (
      <>
        <AuthPage onAuthSuccess={handleAuthSuccess} />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  // Logged in — show main app
  return (
    <div style={{ display: 'flex', backgroundColor: '#0f172a', minHeight: '100vh', color: '#e2e8f0' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

      <main style={{ flex: 1, marginLeft: '18rem' }}>
        {/* Header */}
        <header style={{
          height: '72px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 2rem',
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div>
            <h2 style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
              Welcome back, {user.name.split(' ')[0]}
            </h2>
            <p style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>Let's start crushing your goals!</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Avatar with dropdown */}
            <div ref={accountMenuRef} style={{ position: 'relative' }}>
              {/* Clickable avatar */}
              <div
                onClick={() => setShowAccountMenu(prev => !prev)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  cursor: 'pointer', padding: '6px 12px 6px 8px',
                  borderRadius: '40px',
                  background: showAccountMenu ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${showAccountMenu ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  transition: 'all 0.2s',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!showAccountMenu) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showAccountMenu) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  }
                }}
              >
                <div style={{
                  width: '34px', height: '34px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '13px',
                  boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
                  flexShrink: 0,
                }}>
                  {getInitials(user.name)}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>{user.name}</div>
                  <div style={{ fontSize: '11px', color: '#818cf8' }}>{user.email}</div>
                </div>
                <span style={{ color: '#64748b', fontSize: '10px', marginLeft: '2px' }}>▾</span>
              </div>

              {/* Dropdown */}
              {showAccountMenu && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  width: '260px',
                  background: 'linear-gradient(135deg, #1e293b, #162032)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                  zIndex: 100,
                  overflow: 'hidden',
                  animation: 'dropIn 0.15s ease',
                }}>
                  {/* Header */}
                  <div style={{
                    padding: '16px 18px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(99,102,241,0.06)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: '16px',
                        boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
                        flexShrink: 0,
                      }}>
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{user.name}</div>
                        <div style={{ fontSize: '11px', color: '#818cf8', marginTop: '1px' }}>{user.email}</div>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div style={{ padding: '8px' }}>
                    {[
                      { icon: '👤', label: 'Manage Account', sub: 'Update your profile & preferences', action: () => { setActiveTab('account'); setShowAccountMenu(false); } },
                      { icon: '⚙️', label: 'Settings', sub: 'App configuration', action: () => { setActiveTab('settings'); setShowAccountMenu(false); } },
                    ].map(item => (
                      <div
                        key={item.label}
                        onClick={item.action}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '10px 12px', borderRadius: '10px',
                          cursor: 'pointer', transition: 'background 0.15s',
                          marginBottom: '2px',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <span style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>{item.icon}</span>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{item.label}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{item.sub}</div>
                        </div>
                      </div>
                    ))}

                    {user?.isAdmin && (
                      <div
                        onClick={() => { setActiveTab('admin'); setShowAccountMenu(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '10px 12px', borderRadius: '10px',
                          cursor: 'pointer', transition: 'background 0.15s',
                          marginTop: '4px', background: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.2)'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                      >
                        <span style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>🛡️</span>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#ef4444' }}>Admin Panel</div>
                          <div style={{ fontSize: '11px', color: '#fca5a5' }}>Manage users & stats</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Logout */}
                  <div style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div
                      onClick={handleLogout}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '10px 12px', borderRadius: '10px',
                        cursor: 'pointer', transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>🚪</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#f87171' }}>Log Out</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Sign out of your account</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div style={{ padding: '2rem' }}>
          {renderContent()}
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`@keyframes dropIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export default App;
