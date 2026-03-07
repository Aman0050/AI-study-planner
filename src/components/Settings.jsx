import React, { useState, useEffect } from 'react';
import {
    User, Bell, Shield, Palette, Save, Eye, EyeOff,
    Lock, Moon, Sun, Monitor, Trash2, AlertTriangle,
    CheckCircle2, Mail, Target, Clock, Volume2, VolumeX,
    Smartphone, Globe, ChevronRight
} from 'lucide-react';
import { API_BASE_URL } from '../config';

// ── shared styles ─────────────────────────────────────────────────────────────
const glass = {
    background: 'rgba(30,41,59,0.75)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '18px',
    backdropFilter: 'blur(14px)',
};

const inp = {
    width: '100%', background: 'rgba(15,23,42,0.7)',
    border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px',
    padding: '11px 14px', color: '#f1f5f9', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color .2s',
};

const label = (text) => (
    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '6px' }}>{text}</div>
);

const Toggle = ({ on, onChange, accent = '#6366f1' }) => (
    <div onClick={() => onChange(!on)} style={{ width: '44px', height: '24px', borderRadius: '12px', background: on ? accent : 'rgba(255,255,255,0.08)', cursor: 'pointer', position: 'relative', transition: 'background .25s', flexShrink: 0, border: `1px solid ${on ? accent : 'rgba(255,255,255,0.1)'}` }}>
        <div style={{ position: 'absolute', top: '3px', left: on ? '22px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left .25s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
    </div>
);

const Row = ({ icon: Icon, title, desc, children, accent }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            {Icon && <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: accent || 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} style={{ color: '#818cf8' }} />
            </div>}
            <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>{title}</div>
                {desc && <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{desc}</div>}
            </div>
        </div>
        {children}
    </div>
);

const SectionTitle = ({ children }) => (
    <div style={{ fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '10px', marginTop: '4px' }}>{children}</div>
);

// ── Settings ──────────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
    name: '', email: '', goal: 'Master my studies', dailyGoalHours: 4,
    reminders: true, emailNotifs: true, sessionAlerts: true, soundEnabled: true,
    theme: 'dark', accentColor: '#6366f1',
    twoFactor: false, publicProfile: false,
};

const ACCENT_OPTIONS = ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#ec4899'];
const THEME_OPTIONS = [
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
    { id: 'light', label: 'Light', icon: Sun },
];

const Settings = ({ showToast, user }) => {
    const [tab, setTab] = useState('profile');
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [showPass, setShowPass] = useState(false);
    const [oldPass, setOldPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [savingPass, setSavingPass] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleteText, setDeleteText] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('studyai_settings');
        const userInfo = JSON.parse(localStorage.getItem('studyai_user') || '{}');
        const base = stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
        setSettings({ ...base, name: userInfo.name || base.name, email: userInfo.email || base.email });
    }, [user]);

    const set = (key, val) => setSettings(p => ({ ...p, [key]: val }));

    const saveProfile = () => {
        localStorage.setItem('studyai_settings', JSON.stringify(settings));
        // also update user name in studyai_user
        const userInfo = JSON.parse(localStorage.getItem('studyai_user') || '{}');
        localStorage.setItem('studyai_user', JSON.stringify({ ...userInfo, name: settings.name }));
        showToast('Settings saved! ✅');
    };

    const changePassword = async () => {
        if (!oldPass || !newPass) { showToast('Fill all password fields', 'error'); return; }
        if (newPass !== confirmPass) { showToast('Passwords do not match', 'error'); return; }
        if (newPass.length < 6) { showToast('Password must be 6+ characters', 'error'); return; }
        setSavingPass(true);
        try {
            const { token } = JSON.parse(localStorage.getItem('studyai_user') || '{}');
            const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            showToast('Password changed! 🔒');
            setOldPass(''); setNewPass(''); setConfirmPass('');
        } catch (e) {
            showToast(e.message || 'Change failed', 'error');
        } finally { setSavingPass(false); }
    };

    const handleDeleteAccount = () => {
        if (deleteText !== 'DELETE') { showToast('Type DELETE to confirm', 'error'); return; }
        localStorage.clear();
        window.location.reload();
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'security', label: 'Security', icon: Shield },
    ];

    const initials = settings.name ? settings.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", maxWidth: '860px' }}>
            {/* Confirm delete modal */}
            {confirmDelete && (
                <div onClick={() => setConfirmDelete(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div onClick={e => e.stopPropagation()} style={{ ...glass, padding: '32px', maxWidth: '380px', width: '100%', margin: '0 16px', textAlign: 'center', border: '1px solid rgba(239,68,68,0.25)' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <AlertTriangle size={28} style={{ color: '#ef4444' }} />
                        </div>
                        <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 800, margin: '0 0 8px' }}>Delete Account?</h3>
                        <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px', lineHeight: 1.6 }}>This will permanently erase all your data — subjects, sessions, tasks, and settings. This cannot be undone.</p>
                        <div style={{ marginBottom: '16px' }}>
                            {label('Type DELETE to confirm')}
                            <input style={{ ...inp, borderColor: deleteText === 'DELETE' ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.09)' }} placeholder="DELETE" value={deleteText} onChange={e => setDeleteText(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleDeleteAccount} style={{ flex: 1, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>Delete Everything</button>
                            <button onClick={() => { setConfirmDelete(false); setDeleteText(''); }} style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '11px 18px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(99,102,241,0.3)' }}>
                    <User color="white" size={24} />
                </div>
                <div>
                    <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Settings</h1>
                    <p style={{ color: '#64748b', margin: '3px 0 0', fontSize: '13px' }}>Manage your profile, notifications, and preferences</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '20px' }}>
                {/* Tab sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {tabs.map(t => {
                        const active = tab === t.id;
                        return (
                            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: active ? 'rgba(99,102,241,0.15)' : 'transparent', color: active ? '#a5b4fc' : '#475569', fontWeight: 700, fontSize: '13px', transition: 'all .15s', textAlign: 'left' }}
                                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <t.icon size={16} />
                                {t.label}
                                {active && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
                            </button>
                        );
                    })}
                </div>

                {/* Tab content */}
                <div>
                    {/* ── PROFILE ── */}
                    {tab === 'profile' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ ...glass, padding: '24px' }}>
                                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: '0 0 20px' }}>Profile Information</h3>

                                {/* Avatar */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 800, color: '#fff', boxShadow: '0 6px 20px rgba(99,102,241,0.35)' }}>{initials}</div>
                                    <div>
                                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{settings.name || 'Your Name'}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{settings.email || 'your@email.com'}</div>
                                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '10px', display: 'inline-block', marginTop: '5px' }}>Active</div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                                    <div>
                                        {label('Full Name')}
                                        <input style={inp} value={settings.name} onChange={e => set('name', e.target.value)}
                                            onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'} />
                                    </div>
                                    <div>
                                        {label('Email Address')}
                                        <input style={{ ...inp, color: '#475569' }} value={settings.email} disabled title="Email cannot be changed" />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '14px' }}>
                                    {label('Study Goal')}
                                    <input style={inp} placeholder="e.g. Master Full-Stack Development" value={settings.goal} onChange={e => set('goal', e.target.value)}
                                        onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'} />
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    {label('Daily Study Goal (hours)')}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <input type="range" min="1" max="12" value={settings.dailyGoalHours} onChange={e => set('dailyGoalHours', Number(e.target.value))}
                                            style={{ flex: 1, accentColor: '#6366f1', height: '4px' }} />
                                        <div style={{ width: '52px', textAlign: 'center', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '8px', padding: '6px', fontSize: '14px', fontWeight: 800, color: '#a5b4fc' }}>{settings.dailyGoalHours}h</div>
                                    </div>
                                </div>

                                <button onClick={saveProfile} style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: '#fff', border: 'none', borderRadius: '11px', padding: '12px 24px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(99,102,241,.3)' }}>
                                    <Save size={16} /> Save Profile
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── NOTIFICATIONS ── */}
                    {tab === 'notifications' && (
                        <div style={{ ...glass, padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>Notification Preferences</h3>
                            <SectionTitle>Study Alerts</SectionTitle>
                            <Row icon={Bell} title="Study Reminders" desc="Get notified before scheduled sessions">
                                <Toggle on={settings.reminders} onChange={v => set('reminders', v)} />
                            </Row>
                            <Row icon={Clock} title="Session Alerts" desc="Alerts when a session is about to end">
                                <Toggle on={settings.sessionAlerts} onChange={v => set('sessionAlerts', v)} />
                            </Row>
                            <Row icon={Volume2} title="Sound Effects" desc="Play sounds for timers and completions">
                                <Toggle on={settings.soundEnabled} onChange={v => set('soundEnabled', v)} />
                            </Row>

                            <SectionTitle>Email</SectionTitle>
                            <Row icon={Mail} title="Email Notifications" desc="Weekly progress summary to your inbox">
                                <Toggle on={settings.emailNotifs} onChange={v => set('emailNotifs', v)} />
                            </Row>

                            <button onClick={saveProfile} style={{ marginTop: '8px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: '#fff', border: 'none', borderRadius: '11px', padding: '12px 24px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', width: 'fit-content' }}>
                                <Save size={16} /> Save Preferences
                            </button>
                        </div>
                    )}

                    {/* ── APPEARANCE ── */}
                    {tab === 'appearance' && (
                        <div style={{ ...glass, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Appearance</h3>

                            <div>
                                <SectionTitle>Theme</SectionTitle>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {THEME_OPTIONS.map(t => {
                                        const active = settings.theme === t.id;
                                        return (
                                            <div key={t.id} onClick={() => set('theme', t.id)}
                                                style={{ flex: 1, padding: '16px', borderRadius: '12px', border: `2px solid ${active ? '#6366f1' : 'rgba(255,255,255,0.07)'}`, background: active ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)', cursor: 'pointer', textAlign: 'center', transition: 'all .15s' }}>
                                                <t.icon size={22} style={{ color: active ? '#818cf8' : '#64748b', margin: '0 auto 8px' }} />
                                                <div style={{ fontSize: '12px', fontWeight: 700, color: active ? '#a5b4fc' : '#64748b' }}>{t.label}</div>
                                                {active && <CheckCircle2 size={13} style={{ color: '#10b981', marginTop: '6px' }} />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <SectionTitle>Accent Color</SectionTitle>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {ACCENT_OPTIONS.map(c => (
                                        <div key={c} onClick={() => set('accentColor', c)}
                                            style={{ width: '36px', height: '36px', borderRadius: '50%', background: c, cursor: 'pointer', border: settings.accentColor === c ? '3px solid white' : '2px solid transparent', boxShadow: settings.accentColor === c ? `0 0 0 2px ${c}` : 'none', transition: 'all .15s' }} />
                                    ))}
                                </div>
                                <div style={{ marginTop: '14px', padding: '12px 16px', borderRadius: '12px', background: `${settings.accentColor}18`, border: `1px solid ${settings.accentColor}30`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '8px', background: settings.accentColor }} />
                                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>Accent preview — <strong style={{ color: '#fff' }}>{settings.accentColor}</strong></span>
                                </div>
                            </div>

                            <button onClick={saveProfile} style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: '#fff', border: 'none', borderRadius: '11px', padding: '12px 24px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', width: 'fit-content' }}>
                                <Save size={16} /> Save Appearance
                            </button>
                        </div>
                    )}

                    {/* ── SECURITY ── */}
                    {tab === 'security' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Change password */}
                            <div style={{ ...glass, padding: '24px' }}>
                                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: '0 0 18px' }}>Change Password</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
                                    <div>
                                        {label('Current Password')}
                                        <div style={{ position: 'relative' }}>
                                            <input type={showPass ? 'text' : 'password'} style={{ ...inp, paddingRight: '42px' }} placeholder="Enter current password" value={oldPass} onChange={e => setOldPass(e.target.value)} />
                                            <button onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}>
                                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        {label('New Password')}
                                        <input type="password" style={inp} placeholder="Min 6 characters" value={newPass} onChange={e => setNewPass(e.target.value)} />
                                    </div>
                                    <div>
                                        {label('Confirm New Password')}
                                        <input type="password" style={{ ...inp, borderColor: confirmPass && confirmPass !== newPass ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.09)' }} placeholder="Repeat new password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
                                        {confirmPass && confirmPass !== newPass && <div style={{ fontSize: '11px', color: '#f87171', marginTop: '4px' }}>Passwords don't match</div>}
                                    </div>
                                </div>
                                <button onClick={changePassword} disabled={savingPass} style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '11px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}>
                                    <Lock size={15} /> {savingPass ? 'Saving…' : 'Update Password'}
                                </button>
                            </div>

                            {/* Privacy toggles */}
                            <div style={{ ...glass, padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>Privacy</h3>
                                <Row icon={Globe} title="Public Profile" desc="Let others view your study stats">
                                    <Toggle on={settings.publicProfile} onChange={v => set('publicProfile', v)} />
                                </Row>
                                <Row icon={Smartphone} title="Two-Factor Auth" desc="Extra login security (coming soon)" >
                                    <Toggle on={settings.twoFactor} onChange={v => { if (!v) set('twoFactor', false); else showToast('2FA coming soon!', 'info'); }} />
                                </Row>
                                <button onClick={saveProfile} style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: '#fff', border: 'none', borderRadius: '11px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', marginTop: '6px', width: 'fit-content' }}>
                                    <Save size={15} /> Save Privacy Settings
                                </button>
                            </div>

                            {/* Danger zone */}
                            <div style={{ ...glass, padding: '24px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                    <AlertTriangle size={18} style={{ color: '#ef4444' }} />
                                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ef4444', margin: 0 }}>Danger Zone</h3>
                                </div>
                                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px', lineHeight: 1.6 }}>
                                    Deleting your account will permanently remove <strong style={{ color: '#94a3b8' }}>all subjects, sessions, study plans, and progress data</strong>. This action cannot be undone.
                                </p>
                                <button onClick={() => setConfirmDelete(true)} style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}>
                                    <Trash2 size={15} /> Delete My Account
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`@keyframes popIn { from { opacity:0; transform:scale(.96) translateY(8px); } to { opacity:1; transform:none; } }`}</style>
        </div>
    );
};

export default Settings;
