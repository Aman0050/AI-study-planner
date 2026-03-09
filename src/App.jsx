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
import StudyRoom from './components/StudyRoom';
import AllTasks from './components/AllTasks';
import './App.css';

const App = () => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('studyai_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef(null);

  // Responsive detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Click outside account menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setActiveTab('dashboard');
    showToast(`Welcome, ${userData.name.split(' ')[0]}! 👋`);
  };

  const handleLogout = () => {
    localStorage.removeItem('studyai_token');
    localStorage.removeItem('studyai_user');
    setUser(null);
    setActiveTab('dashboard');
    setShowAccountMenu(false);
  };

  const getInitials = (n) => n ? n.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) : 'U';

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={setActiveTab} showToast={showToast} />;
      case 'planner': return <AIPlanner showToast={showToast} />;
      case 'calendar': return <Calendar onNavigate={setActiveTab} />;
      case 'settings': return <Settings user={user} showToast={showToast} />;
      case 'account': return <AccountManagement user={user} showToast={showToast} onUserUpdate={setUser} />;
      case 'subjects': return <Subjects showToast={showToast} />;
      case 'progress': return <Progress />;
      case 'studyroom': return <StudyRoom showToast={showToast} />;
      case 'tasks': return <AllTasks showToast={showToast} />;
      case 'admin': return <AdminPanel user={user} showToast={showToast} />;
      default: return <Dashboard onNavigate={setActiveTab} showToast={showToast} />;
    }
  };

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
    <div style={{
      display: 'flex',
      backgroundColor: 'var(--bg-dark)',
      minHeight: '100vh',
      color: 'var(--text-main)',
      position: 'relative',
      overflowX: 'hidden',
    }}>
      {/* Interactive Aura Background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%',
          background: 'radial-gradient(circle, rgba(0, 245, 255, 0.08) 0%, transparent 70%)',
          filter: 'blur(80px)', animation: 'pulseAura 12s infinite alternate'
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '-5%', width: '35%', height: '35%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
          filter: 'blur(100px)', animation: 'pulseAura 15s infinite alternate-reverse'
        }} />
      </div>

      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => { setActiveTab(tab); setSidebarOpen(false); }}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />

      {/* Overlay for mobile sidebar */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)', zIndex: 40, animation: 'fadeIn 0.3s ease'
          }}
        />
      )}

      <main style={{
        flex: 1,
        marginLeft: isMobile ? 0 : '18rem',
        width: '100%',
        transition: 'margin 0.4s cubic-bezier(0.2, 1, 0.2, 1)',
        minWidth: 0,
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Header */}
        <header style={{
          height: '72px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '0 1.5rem' : '0 2.5rem',
          backgroundColor: 'rgba(6, 9, 18, 0.6)',
          backdropFilter: 'blur(24px) saturate(180%)',
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                style={{
                  background: 'none', border: 'none', color: '#fff',
                  cursor: 'pointer', padding: '8px', marginLeft: '-8px',
                  display: 'flex', flexDirection: 'column', gap: '4px'
                }}
              >
                <div style={{ width: '20px', height: '2px', background: '#fff', borderRadius: '2px' }} />
                <div style={{ width: '14px', height: '2px', background: '#fff', borderRadius: '2px' }} />
                <div style={{ width: '20px', height: '2px', background: '#fff', borderRadius: '2px' }} />
              </button>
            )}
            <div>
              <h2 style={{
                fontSize: isMobile ? '10px' : '11px',
                fontWeight: 600, color: '#818cf8', textTransform: 'uppercase',
                letterSpacing: '0.15em', margin: 0
              }}>
                {isMobile ? `Hi, ${user.name.split(' ')[0]}` : `Welcome back, ${user.name.split(' ')[0]}`}
              </h2>
              <p style={{
                fontSize: isMobile ? '16px' : '20px',
                fontWeight: 800, color: '#fff', margin: 0,
                fontFamily: "'Outfit', sans-serif"
              }}>
                {isMobile ? "Crush your goals! 🚀" : "Let's start crushing your goals!"}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* Avatar with dropdown */}
            <div ref={accountMenuRef} style={{ position: 'relative' }}>
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
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '12px',
                  boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
                  flexShrink: 0,
                }}>
                  {getInitials(user.name)}
                </div>
                {!isMobile && (
                  <>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>{user.name}</div>
                      <div style={{ fontSize: '11px', color: '#818cf8' }}>{user.email}</div>
                    </div>
                    <span style={{ color: '#64748b', fontSize: '10px' }}>▾</span>
                  </>
                )}
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
                  <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(99,102,241,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px' }}>
                        {getInitials(user.name)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                        <div style={{ fontSize: '11px', color: '#818cf8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '8px' }}>
                    {[
                      { icon: '👤', label: 'Account', action: () => { setActiveTab('account'); setShowAccountMenu(false); } },
                      { icon: '⚙️', label: 'Settings', action: () => { setActiveTab('settings'); setShowAccountMenu(false); } },
                    ].map(item => (
                      <div key={item.label} onClick={item.action} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <span style={{ fontSize: '16px' }}>{item.icon}</span>
                        <span style={{ fontSize: '13px', color: '#e2e8f0' }}>{item.label}</span>
                      </div>
                    ))}
                    {user?.isAdmin && (
                      <div onClick={() => { setActiveTab('admin'); setShowAccountMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', background: 'rgba(239,68,68,0.1)', marginTop: '4px' }}>
                        <span style={{ fontSize: '16px' }}>🛡️</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#ef4444' }}>Admin Panel</span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <span style={{ fontSize: '16px' }}>🚪</span>
                      <span style={{ fontSize: '13px', color: '#f87171', fontWeight: 600 }}>Log Out</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div style={{ padding: isMobile ? '1rem' : '2rem' }}>
          {renderContent()}
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dropIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default App;
