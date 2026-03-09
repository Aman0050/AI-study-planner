import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
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
        const userInfo = JSON.parse(localStorage.getItem('studyai_user') || '{}');
        localStorage.setItem('studyai_user', JSON.stringify({ ...userInfo, name: settings.name }));
        showToast('Settings successfully updated! ✨');
    };

    const changePassword = async () => {
        if (!oldPass || !newPass) { showToast('Complete all password fields', 'error'); return; }
        if (newPass !== confirmPass) { showToast('New passwords do not match', 'error'); return; }
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
            showToast('Password updated securely! 🔒');
            setOldPass(''); setNewPass(''); setConfirmPass('');
        } catch (e) {
            showToast(e.message || 'Update failed', 'error');
        } finally { setSavingPass(false); }
    };

    const handleDeleteAccount = () => {
        if (deleteText !== 'DELETE') { showToast('Verification failed. Type DELETE.', 'error'); return; }
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
        <div style={{ maxWidth: '940px', margin: '0 auto', paddingBottom: '60px' }} className="page-transition">
            {/* Confirm delete modal */}
            {confirmDelete && (
                <div onClick={() => setConfirmDelete(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                    <div onClick={e => e.stopPropagation()} style={{ padding: '40px', maxWidth: '420px', width: '100%', animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }} className="glass-card">
                        <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <AlertTriangle size={32} style={{ color: '#ef4444' }} />
                        </div>
                        <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, margin: '0 0 12px', textAlign: 'center' }}>Terminate Account?</h3>
                        <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 28px', lineHeight: 1.6, textAlign: 'center' }}>This will permanently erase your entire academic history, subjects, and progress reports. This action is irreversible.</p>
                        <div style={{ marginBottom: '24px' }}>
                            {label('Type DELETE to verify')}
                            <input style={{ ...inp, borderColor: deleteText === 'DELETE' ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.06)', padding: '14px' }} placeholder="DELETE" value={deleteText} onChange={e => setDeleteText(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: '14px' }}>
                            <button onClick={handleDeleteAccount} style={{ flex: 1, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '14px', padding: '14px', fontWeight: 800, cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'} onMouseLeave={e => e.currentTarget.style.filter = 'none'}>DELETE EVERYTHING</button>
                            <button onClick={() => { setConfirmDelete(false); setDeleteText(''); }} style={{ background: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px 24px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '3.5rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(99,102,241,0.3)', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: -2, background: 'linear-gradient(135deg,#6366f1,#a855f7)', borderRadius: '20px', opacity: 0.3, filter: 'blur(8px)', zIndex: -1 }}></div>
                    <User color="white" size={28} />
                </div>
                <div>
                    <h1 className="gradient-text" style={{ margin: 0 }}>Terminal Settings</h1>
                    <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '15px', fontWeight: 500 }}>Global preferences, identity management, and security.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 800 ? '1fr' : '240px 1fr', gap: '32px' }}>
                {/* Tab sidebar */}
                <div style={{ display: 'flex', flexDirection: window.innerWidth < 800 ? 'row' : 'column', gap: '8px', overflowX: window.innerWidth < 800 ? 'auto' : 'visible', paddingBottom: window.innerWidth < 800 ? '12px' : '0' }}>
                    {tabs.map(t => {
                        const active = tab === t.id;
                        return (
                            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', borderRadius: '16px', border: 'none', cursor: 'pointer', background: active ? 'rgba(99,102,241,0.12)' : 'transparent', color: active ? '#818cf8' : '#64748b', fontWeight: 700, fontSize: '14px', transition: 'all .25s ease', textAlign: 'left', whiteSpace: 'nowrap', position: 'relative' }}
                                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#94a3b8'; } }}
                                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; } }}
                            >
                                {active && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '4px', background: '#6366f1', borderRadius: '0 4px 4px 0', boxShadow: '0 0 10px rgba(99,102,241,0.5)' }} />}
                                <t.icon size={18} style={{ opacity: active ? 1 : 0.6 }} />
                                <span style={{ display: window.innerWidth < 480 && !active ? 'none' : 'inline' }}>{t.label}</span>
                                {active && window.innerWidth >= 800 && <ChevronRight size={16} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
                            </button>
                        );
                    })}
                </div>

                {/* Tab content */}
                <div style={{ animation: 'fadeIn .4s ease-out' }}>
                    {/* ── PROFILE ── */}
                    {tab === 'profile' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className="glass-card" style={{ padding: '32px' }}>
                                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#fff', margin: '0 0 28px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Identity</h3>

                                {/* Avatar */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 900, color: '#fff', boxShadow: '0 12px 32px rgba(99,102,241,0.4)', position: 'relative' }}>
                                        {initials}
                                        <div style={{ position: 'absolute', bottom: -4, right: -4, width: '22px', height: '22px', borderRadius: '50%', background: '#10b981', border: '3px solid #0f172a', boxShadow: '0 0 10px rgba(16,185,129,0.3)' }}></div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>{settings.name || 'Anonymous Intelligence'}</div>
                                        <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>{settings.email || 'not_connected@studyai.io'}</div>
                                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#818cf8', background: 'rgba(99,102,241,0.1)', padding: '4px 12px', borderRadius: '10px', display: 'inline-block', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PREMIUM ARCHITECT</div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                                    <div>
                                        {label('Public Identity')}
                                        <input style={{ ...inp, padding: '14px', borderRadius: '14px' }} value={settings.name} onChange={e => set('name', e.target.value)}
                                            onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.4)'; e.target.style.background = 'rgba(15,23,42,0.9)'; }}
                                            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.06)'; e.target.style.background = 'rgba(15,23,42,0.7)'; }} />
                                    </div>
                                    <div>
                                        {label('Secure Email')}
                                        <input style={{ ...inp, color: '#475569', padding: '14px', borderRadius: '14px', opacity: 0.7 }} value={settings.email} disabled title="Contact support to change email" />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    {label('Mission Statement')}
                                    <input style={{ ...inp, padding: '14px', borderRadius: '14px' }} placeholder="Define your ultimate study objective..." value={settings.goal} onChange={e => set('goal', e.target.value)}
                                        onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.4)'; e.target.style.background = 'rgba(15,23,42,0.9)'; }}
                                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.06)'; e.target.style.background = 'rgba(15,23,42,0.7)'; }} />
                                </div>

                                <div style={{ marginBottom: '32px' }}>
                                    {label(`Daily Effort Target: ${settings.dailyGoalHours}h`)}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px 20px', background: 'rgba(0,0,0,0.2)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <input type="range" min="1" max="15" value={settings.dailyGoalHours} onChange={e => set('dailyGoalHours', Number(e.target.value))}
                                            style={{ flex: 1, accentColor: '#6366f1', height: '6px', borderRadius: '3px' }} />
                                        <div style={{ minWidth: '64px', textAlign: 'center', background: 'linear-gradient(135deg,#6366f1,#818cf8)', borderRadius: '12px', padding: '8px', fontSize: '15px', fontWeight: 900, color: '#fff', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>{settings.dailyGoalHours}h</div>
                                    </div>
                                </div>

                                <button onClick={saveProfile} className="btn-primary" style={{ padding: '14px 32px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 24px rgba(99,102,241,0.25)' }}>
                                    <Save size={18} /> COMMIT CHANGES
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── NOTIFICATIONS ── */}
                    {tab === 'notifications' && (
                        <div className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#fff', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Neural Alerts</h3>

                            <SectionTitle>Global Signaling</SectionTitle>
                            <Row icon={Bell} title="Core Push Notifications" desc="System-level alerts for critical study milestones" accent="rgba(99,102,241,0.12)">
                                <Toggle on={settings.systemNotifs} onChange={v => set('systemNotifs', v)} />
                            </Row>

                            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.04)', margin: '8px 0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#e2e8f0' }}>Tactical Focus Nudge</div>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>Scheduled daily motivation check-in</div>
                                    </div>
                                    <input
                                        type="time"
                                        value={settings.dailyReminderTime || '18:00'}
                                        onChange={e => set('dailyReminderTime', e.target.value)}
                                        style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px 14px', color: '#fff', outline: 'none', fontSize: '14px', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}
                                    />
                                </div>
                            </div>

                            <Row icon={Mail} title="Weekly Intel Reports" desc="Consolidated progress data sent to your secure inbox" accent="rgba(168,85,247,0.12)">
                                <Toggle on={settings.emailNotifs} onChange={v => set('emailNotifs', v)} />
                            </Row>
                            <Row icon={Clock} title="Session Proximity Alerts" desc="Neural pulse when timers reach critical phases" accent="rgba(14,165,233,0.12)">
                                <Toggle on={settings.sessionAlerts} onChange={v => set('sessionAlerts', v)} />
                            </Row>
                            <Row icon={Volume2} title="Audio Feedback" desc="Sonic confirmation for tactical completions" accent="rgba(16,185,129,0.12)">
                                <Toggle on={settings.soundEnabled} onChange={v => set('soundEnabled', v)} />
                            </Row>

                            <div style={{ padding: '24px', background: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(168,85,247,0.08))', borderRadius: '22px', border: '1px solid rgba(99,102,241,0.2)', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>Diagnostic Signal</div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', fontWeight: 500 }}>Verify neural link connection with a test pulse</div>
                                </div>
                                <button
                                    onClick={async () => {
                                        const allowed = await notificationService.requestPermission();
                                        if (allowed) {
                                            notificationService.send("StudyAI: Neural Link Active! 🚀", {
                                                body: "Protocols verified. Your device is synchronized with StudyAI."
                                            });
                                        } else {
                                            showToast("Neural link authorization denied", "error");
                                        }
                                    }}
                                    style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px', padding: '10px 20px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'}
                                >
                                    SEND PULSE
                                </button>
                            </div>

                            <button onClick={saveProfile} className="btn-primary" style={{ marginTop: '20px', padding: '14px 32px', borderRadius: '14px', width: 'fit-content' }}>
                                <Save size={18} /> SYNC PREFERENCES
                            </button>
                        </div>
                    )}

                    {/* ── APPEARANCE ── */}
                    {tab === 'appearance' && (
                        <div className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#fff', margin: '0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visual Processing</h3>

                            <div>
                                <SectionTitle>Global Visual Mode</SectionTitle>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                    {THEME_OPTIONS.map(t => {
                                        const active = settings.theme === t.id;
                                        return (
                                            <div key={t.id} onClick={() => set('theme', t.id)}
                                                style={{ padding: '24px 16px', borderRadius: '20px', border: `2px solid ${active ? '#6366f1' : 'rgba(255,255,255,0.04)'}`, background: active ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'center', transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', overflow: 'hidden' }}>
                                                {active && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(45deg, transparent, rgba(99,102,241,0.1), transparent)', animation: 'shimmer 2s infinite' }} />}
                                                <t.icon size={28} style={{ color: active ? '#818cf8' : '#475569', margin: '0 auto 12px', transition: 'all 0.3s' }} />
                                                <div style={{ fontSize: '13px', fontWeight: 800, color: active ? '#fff' : '#475569', letterSpacing: '0.05em' }}>{t.label.toUpperCase()}</div>
                                                {active && <div style={{ position: 'absolute', top: '10px', right: '10px' }}><CheckCircle2 size={16} style={{ color: '#10b981' }} /></div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <SectionTitle>Interface Accent Pulse</SectionTitle>
                                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', padding: '24px', background: 'rgba(0,0,0,0.2)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    {ACCENT_OPTIONS.map(c => (
                                        <div key={c} onClick={() => set('accentColor', c)}
                                            style={{ width: '42px', height: '42px', borderRadius: '14px', background: c, cursor: 'pointer', border: settings.accentColor === c ? '4px solid #fff' : '2px solid transparent', boxShadow: settings.accentColor === c ? `0 0 20px ${c}66` : 'none', transition: 'all .3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', transform: settings.accentColor === c ? 'scale(1.15)' : 'scale(1)' }}
                                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                                            onMouseLeave={e => e.currentTarget.style.transform = settings.accentColor === c ? 'scale(1.15)' : 'scale(1)'}
                                        />
                                    ))}
                                </div>
                                <div style={{ marginTop: '20px', padding: '16px 20px', borderRadius: '16px', background: `${settings.accentColor}12`, border: `1px solid ${settings.accentColor}25`, display: 'flex', alignItems: 'center', gap: '14px', animation: 'fadeIn .5s' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: settings.accentColor, boxShadow: `0 0 15px ${settings.accentColor}44` }} />
                                    <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>Spectral preview verified — <strong style={{ color: '#fff', letterSpacing: '0.05em' }}>{settings.accentColor.toUpperCase()}</strong></span>
                                </div>
                            </div>

                            <button onClick={saveProfile} className="btn-primary" style={{ padding: '14px 32px', borderRadius: '14px', width: 'fit-content' }}>
                                <Save size={18} /> EXECUTE STYLE SYNC
                            </button>
                        </div>
                    )}

                    {/* ── SECURITY ── */}
                    {tab === 'security' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Change password */}
                            <div className="glass-card" style={{ padding: '32px' }}>
                                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#fff', margin: '0 0 24px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Encryption Protocol</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '28px' }}>
                                    <div>
                                        {label('Current Access Token')}
                                        <div style={{ position: 'relative' }}>
                                            <input type={showPass ? 'text' : 'password'} style={{ ...inp, padding: '14px 48px 14px 14px', borderRadius: '14px' }} placeholder="Existing authorization password" value={oldPass} onChange={e => setOldPass(e.target.value)} />
                                            <button onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#475569'}>
                                                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            {label('New Access Key')}
                                            <input type="password" style={{ ...inp, padding: '14px', borderRadius: '14px' }} placeholder="Secure 6+ string" value={newPass} onChange={e => setNewPass(e.target.value)} />
                                        </div>
                                        <div>
                                            {label('Confirm Key')}
                                            <input type="password" style={{ ...inp, padding: '14px', borderRadius: '14px', borderColor: confirmPass && confirmPass !== newPass ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.06)' }} placeholder="Verify secure string" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
                                        </div>
                                    </div>
                                    {confirmPass && confirmPass !== newPass && <div style={{ fontSize: '12px', color: '#f87171', fontWeight: 600, marginTop: '-12px' }}>Keys do not synchronize. Verified mismatch.</div>}
                                </div>
                                <button onClick={changePassword} disabled={savingPass} style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '14px', padding: '14px 24px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}>
                                    <Lock size={18} /> {savingPass ? 'ENCRYPTING…' : 'UPDATE SECURITY KEYS'}
                                </button>
                            </div>

                            {/* Privacy toggles */}
                            <div className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#fff', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data Privacy</h3>
                                <Row icon={Globe} title="Intelligence Sharing" desc="Allow external nodes to view your productivity metrics" accent="rgba(14,165,233,0.12)">
                                    <Toggle on={settings.publicProfile} onChange={v => set('publicProfile', v)} />
                                </Row>
                                <Row icon={Smartphone} title="Biometric / 2FA Verification" desc="Enhanced secondary authorization layer (IN DEVELOPMENT)" accent="rgba(168,85,247,0.12)">
                                    <Toggle on={settings.twoFactor} onChange={v => { if (!v) set('twoFactor', false); else showToast('Multi-factor protocol coming soon!', 'info'); }} />
                                </Row>
                                <button onClick={saveProfile} className="btn-primary" style={{ marginTop: '16px', padding: '12px 28px', borderRadius: '12px', fontSize: '13px', width: 'fit-content' }}>
                                    <Save size={16} /> COMMUTE PRIVACY PROTOCOL
                                </button>
                            </div>

                            {/* Danger zone */}
                            <div className="glass-card" style={{ padding: '32px', border: '1px solid rgba(239,68,68,0.25)', background: 'linear-gradient(to bottom right, rgba(239,68,68,0.05), transparent)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                    <AlertTriangle size={24} style={{ color: '#ef4444' }} />
                                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#ef4444', margin: 0 }}>Terminus Zone</h3>
                                </div>
                                <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px', lineHeight: 1.7, fontWeight: 500 }}>
                                    Initiating account termination will result in the <strong style={{ color: '#f87171' }}>absolute erasure</strong> of all subjects, sessions, tasks, and historical progress. This action is terminal and cannot be reversed.
                                </p>
                                <button onClick={() => setConfirmDelete(true)} style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '14px', padding: '14px 28px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}>
                                    <Trash2 size={18} /> TERMINATE ACCOUNT
                                </button>
                            </div>
                        </div>
                    )}
                    <style>{`@keyframes popIn { from { opacity:0; transform:scale(.96) translateY(8px); } to { opacity:1; transform:none; } }`}</style>
                </div>
            </div>
        </div>
    );
};

export default Settings;
