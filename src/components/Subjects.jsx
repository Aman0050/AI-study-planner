import React, { useState, useEffect } from 'react';
import {
    BookOpen, Plus, X, Edit3, Save, Trash2,
    Target, Clock, TrendingUp, Flame, Search,
    Calendar, CheckCircle2, BarChart2, RefreshCw
} from 'lucide-react';

const COLORS = [
    { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', accent: '#6366f1', text: '#a5b4fc' },
    { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)', accent: '#a855f7', text: '#d8b4fe' },
    { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', accent: '#10b981', text: '#6ee7b7' },
    { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', accent: '#f59e0b', text: '#fcd34d' },
    { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', accent: '#ef4444', text: '#fca5a5' },
    { bg: 'rgba(14,165,233,0.12)', border: 'rgba(14,165,233,0.3)', accent: '#0ea5e9', text: '#7dd3fc' },
    { bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.3)', accent: '#ec4899', text: '#f9a8d4' },
    { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', accent: '#22c55e', text: '#86efac' },
];

const EMOJIS = ['📚', '🔬', '🧮', '🎨', '🌍', '💻', '🎵', '⚗️', '📐', '🧬', '🏛️', '📝', '🎭', '🌿', '🔭', '💡'];
const PRIORITIES = ['High', 'Medium', 'Low'];
const PRIORITY_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };

const fmtTime = (mins) => {
    if (mins <= 0) return '0h';
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const glass = {
    background: 'rgba(30,41,59,0.7)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '20px',
    backdropFilter: 'blur(12px)',
};

const inputStyle = {
    width: '100%', background: 'rgba(15,23,42,0.7)',
    border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px',
    padding: '10px 14px', color: '#f1f5f9', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box',
};

const DEFAULT_SUBJECTS = [
    { id: 1, name: 'Mathematics', emoji: '🧮', colorIdx: 0, hoursGoal: 10, notes: 'Calculus & Linear Algebra', priority: 'High' },
    { id: 2, name: 'Physics', emoji: '⚗️', colorIdx: 2, hoursGoal: 8, notes: 'Mechanics & Thermodynamics', priority: 'Medium' },
    { id: 3, name: 'Programming', emoji: '💻', colorIdx: 5, hoursGoal: 12, notes: 'Data Structures & Algorithms', priority: 'High' },
];

// ── derive per-subject analytics from sessions ────────────────────────────────
function analyzeSubject(name, sessions) {
    const subSessions = sessions.filter(s =>
        (s.subjectName || '').toLowerCase() === name.toLowerCase()
    );
    const totalMins = subSessions.reduce((a, s) => a + (s.duration || 0), 0);
    const hoursStudied = Math.round((totalMins / 60) * 10) / 10;
    const sessionCount = subSessions.length;
    const completedCount = subSessions.filter(s => s.completed).length;

    // Last studied date
    const dates = subSessions.map(s => new Date(s.date)).sort((a, b) => b - a);
    const lastStudied = dates[0] || null;

    // Weekly hours (last 7 days) for mini-chart
    const now = new Date();
    const weekMins = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - 6 + i);
        return subSessions
            .filter(s => new Date(s.date).toDateString() === d.toDateString())
            .reduce((a, s) => a + (s.duration || 0), 0);
    });

    return { hoursStudied, totalMins, sessionCount, completedCount, lastStudied, weekMins };
}

function relativeDate(d) {
    if (!d) return 'Never';
    const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Mini sparkline ────────────────────────────────────────────────────────────
const Sparkline = ({ data, color }) => {
    const max = Math.max(1, ...data);
    const w = 80, h = 32;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - (v / max) * h;
        return `${x},${y}`;
    }).join(' ');
    const area = `0,${h} ${pts} ${w},${h}`;
    return (
        <svg width={w} height={h} style={{ overflow: 'visible' }}>
            <defs>
                <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon points={area} fill={`url(#sg-${color.replace('#', '')})`} />
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────
const Subjects = ({ showToast }) => {
    const [subjects, setSubjects] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ name: '', emoji: '📚', colorIdx: 0, hoursGoal: 10, notes: '', priority: 'Medium' });
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [analytics, setAnalytics] = useState({});

    const loadData = () => {
        const storedSubs = localStorage.getItem('studyai_subjects');
        const loadedSubs = storedSubs ? JSON.parse(storedSubs) : DEFAULT_SUBJECTS;
        const storedSess = localStorage.getItem('studyai_sessions');
        const loadedSess = storedSess ? JSON.parse(storedSess) : [];
        setSubjects(loadedSubs);
        setSessions(loadedSess);

        // Build analytics map
        const map = {};
        loadedSubs.forEach(s => {
            map[s.id] = analyzeSubject(s.name, loadedSess);
        });
        setAnalytics(map);

        // Persist updated hoursStudied back to localStorage
        const updated = loadedSubs.map(s => ({
            ...s,
            hoursStudied: map[s.id]?.hoursStudied ?? s.hoursStudied ?? 0,
        }));
        localStorage.setItem('studyai_subjects', JSON.stringify(updated));
    };

    useEffect(() => { loadData(); }, []);

    const syncNow = () => {
        setSyncing(true);
        setTimeout(() => { loadData(); setSyncing(false); showToast('Synced with latest sessions ✅'); }, 500);
    };

    const saveSubjects = (list) => {
        setSubjects(list);
        localStorage.setItem('studyai_subjects', JSON.stringify(list));
        // Rebuild analytics
        const sess = JSON.parse(localStorage.getItem('studyai_sessions') || '[]');
        const map = {};
        list.forEach(s => { map[s.id] = analyzeSubject(s.name, sess); });
        setAnalytics(map);
    };

    const openAdd = () => {
        setForm({ name: '', emoji: '📚', colorIdx: 0, hoursGoal: 10, notes: '', priority: 'Medium' });
        setEditingId(null);
        setShowModal(true);
    };

    const openEdit = (s) => { setForm({ ...s }); setEditingId(s.id); setShowModal(true); };

    const handleSave = () => {
        if (!form.name.trim()) return;
        let updated;
        if (editingId !== null) {
            updated = subjects.map(s => s.id === editingId ? { ...s, ...form, id: editingId } : s);
            showToast('Subject updated! ✅');
        } else {
            updated = [...subjects, { ...form, id: Date.now() }];
            showToast('Subject added! 🎉');
        }
        saveSubjects(updated);
        setShowModal(false);
    };

    const handleDelete = (id) => {
        saveSubjects(subjects.filter(s => s.id !== id));
        setConfirmDelete(null);
        showToast('Subject removed.');
    };

    const filtered = subjects.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

    // Aggregate stats
    const totalSessions = sessions.length;
    const totalMins = sessions.reduce((a, s) => a + (s.duration || 0), 0);
    const totalHoursDisplay = fmtTime(totalMins);
    const totalGoal = subjects.reduce((a, s) => a + (s.hoursGoal || 0), 0);
    const avgPct = subjects.length
        ? Math.round(subjects.reduce((a, s) => {
            const h = analytics[s.id]?.hoursStudied || 0;
            return a + Math.min(100, (h / (s.hoursGoal || 1)) * 100);
        }, 0) / subjects.length)
        : 0;

    return (
        <div style={{ fontFamily: "'Inter', sans-serif" }} className="page-transition">
            {/* ── Modal ── */}
            {showModal && (
                <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', padding: '32px', maxHeight: '90vh', overflowY: 'auto', animation: 'popIn 0.18s ease' }} className="glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0 }}>{editingId !== null ? 'Edit Subject' : 'Add New Subject'}</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '8px' }}>Subject Name *</label>
                        <input style={{ ...inputStyle, marginBottom: '20px' }} placeholder="e.g. Mathematics" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} autoFocus />
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '10px' }}>Icon</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                            {EMOJIS.map(em => (
                                <button key={em} onClick={() => setForm(p => ({ ...p, emoji: em }))}
                                    style={{ width: '40px', height: '40px', fontSize: '20px', borderRadius: '10px', border: `2px solid ${form.emoji === em ? '#6366f1' : 'rgba(255,255,255,0.06)'}`, background: form.emoji === em ? 'rgba(99,102,241,0.15)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    {em}
                                </button>
                            ))}
                        </div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '10px' }}>Theme Color</label>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            {COLORS.map((c, i) => (
                                <div key={i} onClick={() => setForm(p => ({ ...p, colorIdx: i }))}
                                    style={{ width: '28px', height: '28px', borderRadius: '50%', background: c.accent, cursor: 'pointer', border: form.colorIdx === i ? '3px solid white' : '2px solid transparent', boxShadow: form.colorIdx === i ? `0 0 0 2px ${c.accent}` : 'none', transition: 'all 0.2s' }} />
                            ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '8px' }}>Priority</label>
                                <select style={inputStyle} value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '8px' }}>Goal (hrs)</label>
                                <input style={inputStyle} type="number" min="1" max="200" value={form.hoursGoal} onChange={e => setForm(p => ({ ...p, hoursGoal: Number(e.target.value) }))} />
                            </div>
                        </div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '8px' }}>Notes</label>
                        <input style={{ ...inputStyle, marginBottom: '28px' }} placeholder="Topics, textbook, goals..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={handleSave} className="btn-primary" style={{ flex: 1, height: '48px' }}>
                                <Save size={18} /> {editingId !== null ? 'Save Changes' : 'Add Subject'}
                            </button>
                            <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', borderRadius: '12px', padding: '0 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', height: '48px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Confirm Delete ── */}
            {confirmDelete !== null && (
                <div onClick={() => setConfirmDelete(null)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <div onClick={e => e.stopPropagation()} style={{ padding: '32px', maxWidth: '360px', width: '100%', margin: '0 16px', textAlign: 'center' }} className="glass-card">
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗑️</div>
                        <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, margin: '0 0 12px' }}>Remove Subject?</h3>
                        <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 28px', lineHeight: 1.6, fontWeight: 500 }}>Session data won't be deleted — only this visual card will be removed.</p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button onClick={() => handleDelete(confirmDelete)} style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '12px 24px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}>Delete</button>
                            <button onClick={() => setConfirmDelete(null)} style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 24px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg,#10b981,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(16,185,129,0.3)' }}>
                        <BookOpen color="white" size={26} />
                    </div>
                    <div>
                        <h1 className="gradient-text" style={{ margin: 0 }}>My Subjects</h1>
                        <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '14px', fontWeight: 500 }}>Hours auto-synced from your Progress sessions</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={syncNow} title="Sync with latest sessions" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399', borderRadius: '12px', padding: '0 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', height: '42px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.12)'}>
                        <RefreshCw size={16} style={{ animation: syncing ? 'spin 0.6s linear infinite' : 'none' }} /> Sync
                    </button>
                    <button onClick={openAdd} className="btn-primary" style={{ padding: '0 24px', height: '42px' }}>
                        <Plus size={18} /> Add Subject
                    </button>
                </div>
            </div>

            {/* ── Stats Row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                {[
                    { icon: BookOpen, label: 'Curated Subjects', value: subjects.length, color: '#818cf8', bg: 'rgba(99,102,241,.1)' },
                    { icon: BarChart2, label: 'Total Sessions', value: totalSessions, color: '#34d399', bg: 'rgba(16,185,129,.1)' },
                    { icon: Clock, label: 'Studied Time', value: totalHoursDisplay, color: '#fcd34d', bg: 'rgba(245,158,11,.1)' },
                    { icon: Target, label: 'Academic Goal', value: `${totalGoal}h`, color: '#f9a8d4', bg: 'rgba(236,72,153,.1)' },
                ].map(s => (
                    <div key={s.label} style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }} className="glass-card">
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <s.icon size={22} style={{ color: s.color }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff', lineHeight: 1, fontFamily: "'Outfit', sans-serif" }}>{s.value}</div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', marginTop: '4px' }}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Auto-sync info banner ── */}
            {sessions.length === 0 && (
                <div style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.08)', borderRadius: '16px' }}>
                    <Flame size={20} style={{ color: '#818cf8', flexShrink: 0 }} />
                    <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>
                        No sessions logged yet. <strong style={{ color: '#a5b4fc' }}>Watch a study video</strong> or go to <strong style={{ color: '#a5b4fc' }}>Progress → Log Session</strong> — hours will auto-appear here.
                    </p>
                </div>
            )}

            {/* ── Search ── */}
            <div style={{ position: 'relative', marginBottom: '24px', maxWidth: '400px', width: '100%' }}>
                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input style={{ ...inputStyle, paddingLeft: '48px', height: '48px' }} placeholder="Search your subjects..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* ── Cards Grid ── */}
            {filtered.length === 0 ? (
                <div style={{ padding: '80px', textAlign: 'center' }} className="glass-card">
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>📚</div>
                    <h3 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, margin: '0 0 12px' }}>No subjects found</h3>
                    <p style={{ color: '#64748b', fontSize: '16px', margin: '0 0 32px', fontWeight: 500 }}>Add your academic subjects to track progress and set goals.</p>
                    <button onClick={openAdd} className="btn-primary" style={{ margin: '0 auto' }}>+ Add Your First Subject</button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                    {filtered.map(subj => {
                        const clr = COLORS[subj.colorIdx ?? 0];
                        const an = analytics[subj.id] || {};
                        const hoursStudied = an.hoursStudied || 0;
                        const pct = Math.min(100, Math.round((hoursStudied / (subj.hoursGoal || 1)) * 100));
                        const priorityColor = PRIORITY_COLORS[subj.priority] || '#10b981';
                        const weekMins = an.weekMins || Array(7).fill(0);

                        return (
                            <div key={subj.id}
                                style={{ padding: '24px', border: `1px solid ${clr.border}`, background: clr.bg, position: 'relative', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                                className="glass-card"
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px) scale(1.01)'; e.currentTarget.style.boxShadow = `0 15px 35px ${clr.accent}20`; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                {/* Top row */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: `${clr.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', border: `1px solid ${clr.border}`, boxShadow: `0 4px 12px ${clr.accent}15` }}>{subj.emoji}</div>
                                        <div>
                                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>{subj.name}</div>
                                            {subj.notes && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{subj.notes}</div>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => openEdit(subj)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}><Edit3 size={16} /></button>
                                        <button onClick={() => setConfirmDelete(subj.id)} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}><Trash2 size={16} /></button>
                                    </div>
                                </div>

                                {/* Badges row */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: `${priorityColor}15`, border: `1px solid ${priorityColor}30`, borderRadius: '20px', padding: '4px 12px' }}>
                                        <Flame size={12} style={{ color: priorityColor }} />
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: priorityColor, textTransform: 'uppercase' }}>{subj.priority}</span>
                                    </div>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '4px 12px' }}>
                                        <BarChart2 size={12} style={{ color: '#64748b' }} />
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{an.sessionCount || 0} DECK SESSIONS</span>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div style={{ marginBottom: '18px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>MASTERY PROGRESS</span>
                                        <span style={{ fontSize: '13px', fontWeight: 800, color: clr.text }}>{pct}%</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${clr.accent},${clr.text})`, borderRadius: '4px', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: `0 0 10px ${clr.accent}55` }} />
                                    </div>
                                </div>

                                {/* Hours + sparkline */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Clock size={16} style={{ color: '#64748b' }} />
                                        <span style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: 500 }}>
                                            <strong style={{ color: '#fff' }}>{fmtTime(an.totalMins || 0)}</strong>
                                            <span style={{ color: '#475569', fontSize: '12px' }}> / {subj.hoursGoal}h goal</span>
                                        </span>
                                    </div>
                                    <div title="Study activity last 7 days">
                                        <Sparkline data={weekMins.map(m => m / 60)} color={clr.accent} />
                                    </div>
                                </div>

                                {/* Last Studied */}
                                <div style={{ marginTop: '14px', fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                    <Calendar size={12} />
                                    LAST STUDIED: {relativeDate(an.lastStudied).toUpperCase()}
                                </div>
                            </div>
                        );
                    })}

                    {/* Add tile */}
                    <div onClick={openAdd}
                        style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px dashed rgba(99,102,241,0.2)', minHeight: '260px', gap: '14px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                        className="glass-card"
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.transform = 'scale(0.98)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(30,41,59,0.7)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(99,102,241,0.1)', border: '1px dashed rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Plus size={24} style={{ color: '#6366f1' }} />
                        </div>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#64748b' }}>Design New Module</span>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes popIn { from { opacity:0; transform:scale(.97) translateY(12px); } to { opacity:1; transform:none; } }
                @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default Subjects;
