import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  TrendingUp,
  Settings,
  LogOut,
  ChevronRight,
  BrainCircuit,
  X,
  Menu,
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active, onClick, danger }) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 14px',
      cursor: 'pointer',
      borderRadius: '12px',
      marginBottom: '4px',
      transition: 'all 0.2s',
      background: active ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
      color: active ? '#fff' : (danger ? '#f87171' : '#94a3b8'),
      boxShadow: active ? '0 0 15px rgba(99,102,241,0.2)' : 'none',
    }}
    onMouseEnter={(e) => {
      if (!active) {
        e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.05)';
        e.currentTarget.style.color = danger ? '#f87171' : '#fff';
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = danger ? '#f87171' : '#94a3b8';
      }
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <Icon size={20} style={{ color: active ? '#818cf8' : (danger ? '#f87171' : 'inherit') }} />
      <span style={{ fontWeight: 500, fontSize: '15px' }}>{label}</span>
    </div>
    {active && <ChevronRight size={16} style={{ color: '#818cf8' }} />}
  </div>
);

// Full-screen Main Menu Modal
const MainMenuModal = ({ onClose, setActiveTab }) => {
  const sections = [
    {
      group: 'Study',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Overview of your progress, tasks & streaks' },
        { id: 'planner', label: 'AI Planner', icon: BrainCircuit, desc: 'Generate AI-powered personalized study plans' },
        { id: 'calendar', label: 'Calendar', icon: Calendar, desc: 'View and manage your study schedule' },
      ],
    },
    {
      group: 'Analytics',
      items: [
        { id: 'progress', label: 'Progress', icon: TrendingUp, desc: 'Track your learning milestones and improvement' },
        { id: 'subjects', label: 'Subjects', icon: BookOpen, desc: 'Manage and organize your study subjects' },
      ],
    },
    {
      group: 'Account',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings, desc: 'Update your profile and preferences' },
      ],
    },
  ];

  const navigate = (id) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '680px',
          background: 'linear-gradient(135deg, rgba(30,41,59,0.98) 0%, rgba(15,23,42,0.98) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px',
          padding: '36px 40px',
          boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
          maxHeight: '85vh',
          overflowY: 'auto',
          animation: 'slideUp 0.2s ease',
          margin: '0 24px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(99,102,241,0.4)',
            }}>
              <BrainCircuit color="white" size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                Main Menu
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Navigate to any section</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px', padding: '8px',
              cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#64748b'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Sections */}
        {sections.map((section) => (
          <div key={section.group} style={{ marginBottom: '28px' }}>
            <div style={{
              fontSize: '10px', fontWeight: 700, color: '#475569',
              textTransform: 'uppercase', letterSpacing: '0.12em',
              marginBottom: '12px', paddingLeft: '4px',
            }}>
              {section.group}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
              {section.items.map(({ id, label, icon: Icon, desc }) => (
                <div
                  key={id}
                  onClick={() => navigate(id)}
                  style={{
                    padding: '16px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(99,102,241,0.12)';
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(99,102,241,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'rgba(99,102,241,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '12px',
                  }}>
                    <Icon size={18} style={{ color: '#818cf8' }} />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9', marginBottom: '4px' }}>{label}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div style={{
          marginTop: '8px', padding: '14px 16px',
          background: 'rgba(99,102,241,0.06)',
          borderRadius: '12px', border: '1px solid rgba(99,102,241,0.15)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ fontSize: '16px' }}>⌨️</span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Tip: Click any card above to jump directly to that section. Press <kbd style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 6px', borderRadius: '4px', fontSize: '11px', color: '#94a3b8' }}>Esc</kbd> to close.
          </span>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

const Sidebar = ({ activeTab, setActiveTab, onLogout }) => {
  const [showMainMenu, setShowMainMenu] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'planner', label: 'AI Planner', icon: BrainCircuit },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
  ];

  // Close on Escape
  React.useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setShowMainMenu(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {showMainMenu && (
        <MainMenuModal
          onClose={() => setShowMainMenu(false)}
          setActiveTab={setActiveTab}
        />
      )}

      <div style={{
        width: '18rem',
        height: '100vh',
        backgroundColor: '#1e293b',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        position: 'fixed',
        left: 0, top: 0,
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 6px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(99,102,241,0.35)',
            flexShrink: 0,
          }}>
            <BrainCircuit color="white" size={22} />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
            StudyAI
          </h1>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1 }}>
          {/* Clickable MAIN MENU label */}
          <div
            onClick={() => setShowMainMenu(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '11px', fontWeight: 700, color: '#475569',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              marginBottom: '12px', paddingLeft: '6px',
              cursor: 'pointer', transition: 'color 0.2s',
              userSelect: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#818cf8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#475569';
            }}
            title="Open full navigation menu"
          >
            <Menu size={12} />
            Main Menu
          </div>

          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              {...item}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            />
          ))}
        </nav>

        {/* Bottom actions */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
          <SidebarItem
            icon={Settings}
            label="Settings"
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          />
          <SidebarItem
            icon={LogOut}
            label="Log Out"
            danger={true}
            onClick={onLogout || (() => window.location.reload())}
          />
        </div>
      </div>
    </>
  );
};

export default Sidebar;
