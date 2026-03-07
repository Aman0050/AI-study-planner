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

    return { hoursStudied, sessionCount, completedCount, lastStudied, weekMins };
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
    const totalSessions = Object.values(analytics).reduce((a, v) => a + (v.sessionCount || 0), 0);
    const totalHours = Object.values(analytics).reduce((a, v) => a + (v.hoursStudied || 0), 0);
    const totalGoal = subjects.reduce((a, s) => a + (s.hoursGoal || 0), 0);
    const avgPct = subjects.length
        ? Math.round(subjects.reduce((a, s) => {
            const h = analytics[s.id]?.hoursStudied || 0;
            return a + Math.min(100, (h / (s.hoursGoal || 1)) * 100);
        }, 0) / subjects.length)
        : 0;

    return (
        <div style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* ── Modal ── */}
            {showModal && (
                <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div onClick={e => e.stopPropagation()} style={{ ...glass, width: '100%', maxWidth: '480px', padding: '32px', margin: '0 16px', animation: 'popIn 0.18s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0 }}>{editingId !== null ? 'Edit Subject' : 'Add Subject'}</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '6px' }}>Subject Name *</label>
                        <input style={{ ...inputStyle, marginBottom: '16px' }} placeholder="e.g. Mathematics" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} autoFocus />
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '8px' }}>Icon</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                            {EMOJIS.map(em => (
                                <button key={em} onClick={() => setForm(p => ({ ...p, emoji: em }))}
                                    style={{ width: '36px', height: '36px', fontSize: '18px', borderRadius: '8px', border: `2px solid ${form.emoji === em ? '#6366f1' : 'rgba(255,255,255,0.08)'}`, background: form.emoji === em ? 'rgba(99,102,241,0.15)' : 'transparent', cursor: 'pointer' }}>
                                    {em}
                                </button>
                            ))}
                        </div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '8px' }}>Color</label>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            {COLORS.map((c, i) => (
                                <div key={i} onClick={() => setForm(p => ({ ...p, colorIdx: i }))}
                                    style={{ width: '26px', height: '26px', borderRadius: '50%', background: c.accent, cursor: 'pointer', border: form.colorIdx === i ? '3px solid white' : '2px solid transparent', boxShadow: form.colorIdx === i ? `0 0 0 2px ${c.accent}` : 'none' }} />
                            ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '5px' }}>Priority</label>
                                <select style={inputStyle} value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '5px' }}>Goal (hrs)</label>
                                <input style={inputStyle} type="number" min="1" max="200" value={form.hoursGoal} onChange={e => setForm(p => ({ ...p, hoursGoal: Number(e.target.value) }))} />
                            </div>
                        </div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '6px' }}>Notes</label>
                        <input style={{ ...inputStyle, marginBottom: '24px' }} placeholder="Topics, textbook, goals..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleSave} style={{ flex: 1, background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
                                <Save size={16} /> {editingId !== null ? 'Save Changes' : 'Add Subject'}
                            </button>
                            <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', borderRadius: '10px', padding: '12px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Confirm Delete ── */}
            {confirmDelete !== null && (
                <div onClick={() => setConfirmDelete(null)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div onClick={e => e.stopPropagation()} style={{ ...glass, padding: '28px', maxWidth: '340px', width: '100%', margin: '0 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '38px', marginBottom: '12px' }}>🗑️</div>
                        <h3 style={{ color: '#fff', fontSize: '17px', fontWeight: 800, margin: '0 0 8px' }}>Remove Subject?</h3>
                        <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 22px' }}>Session data won't be deleted — only this subject card.</p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button onClick={() => handleDelete(confirmDelete)} style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 22px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                            <button onClick={() => setConfirmDelete(null)} style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 22px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg,#10b981,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(16,185,129,0.3)' }}>
                        <BookOpen color="white" size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', margin: 0, fontFamily: "'Outfit',sans-serif" }}>My Subjects</h1>
                        <p style={{ color: '#64748b', margin: '3px 0 0', fontSize: '13px' }}>Hours auto-synced from your Progress sessions</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={syncNow} title="Sync with latest sessions" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399', borderRadius: '11px', padding: '10px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                        <RefreshCw size={15} style={{ animation: syncing ? 'spin 0.6s linear infinite' : 'none' }} /> Sync
                    </button>
                    <button onClick={openAdd} style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', boxShadow: '0 4px 14px rgba(99,102,241,.3)' }}>
                        <Plus size={17} /> Add Subject
                    </button>
                </div>
            </div>

            {/* ── Stats Row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                {[
                    { icon: BookOpen, label: 'Subjects', value: subjects.length, color: '#818cf8', bg: 'rgba(99,102,241,.1)' },
                    { icon: BarChart2, label: 'Sessions Logged', value: totalSessions, color: '#34d399', bg: 'rgba(16,185,129,.1)' },
                    { icon: Clock, label: 'Hours Studied', value: `${totalHours}h`, color: '#fcd34d', bg: 'rgba(245,158,11,.1)' },
                    { icon: Target, label: 'Hours Goal', value: `${totalGoal}h`, color: '#f9a8d4', bg: 'rgba(236,72,153,.1)' },
                    { icon: TrendingUp, label: 'Avg Progress', value: `${avgPct}%`, color: '#7dd3fc', bg: 'rgba(14,165,233,.1)' },
                ].map(s => (
                    <div key={s.label} style={{ ...glass, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <s.icon size={19} style={{ color: s.color }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{s.value}</div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Auto-sync info banner ── */}
            {sessions.length === 0 && (
                <div style={{ ...glass, padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.05)' }}>
                    <Flame size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                        No sessions logged yet. Go to <strong style={{ color: '#fcd34d' }}>Progress → Log Session</strong> to record study time — hours will auto-appear here per subject.
                    </p>
                </div>
            )}

            {/* ── Search ── */}
            <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '340px' }}>
                <Search size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                <input style={{ ...inputStyle, paddingLeft: '38px' }} placeholder="Search subjects..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* ── Cards Grid ── */}
            {filtered.length === 0 ? (
                <div style={{ ...glass, padding: '60px', textAlign: 'center' }}>
                    <div style={{ fontSize: '44px', marginBottom: '14px' }}>📚</div>
                    <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>No subjects yet</h3>
                    <button onClick={openAdd} style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px 22px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>+ Add Your First Subject</button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {filtered.map(subj => {
                        const clr = COLORS[subj.colorIdx ?? 0];
                        const an = analytics[subj.id] || {};
                        const hoursStudied = an.hoursStudied || 0;
                        const pct = Math.min(100, Math.round((hoursStudied / (subj.hoursGoal || 1)) * 100));
                        const priorityColor = PRIORITY_COLORS[subj.priority] || '#10b981';
                        const weekMins = an.weekMins || Array(7).fill(0);

                        return (
                            <div key={subj.id}
                                style={{ ...glass, padding: '22px', border: `1px solid ${clr.border}`, background: clr.bg, position: 'relative', transition: 'transform 0.2s, box-shadow 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.3)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                {/* Top row */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                                        <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: `${clr.accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', border: `1px solid ${clr.border}` }}>{subj.emoji}</div>
                                        <div>
                                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{subj.name}</div>
                                            {subj.notes && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subj.notes}</div>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button onClick={() => openEdit(subj)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '5px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}><Edit3 size={12} /></button>
                                        <button onClick={() => setConfirmDelete(subj.id)} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', padding: '5px', cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center' }}><Trash2 size={12} /></button>
                                    </div>
                                </div>

                                {/* Badges row */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: `${priorityColor}15`, border: `1px solid ${priorityColor}30`, borderRadius: '20px', padding: '3px 9px' }}>
                                        <Flame size={9} style={{ color: priorityColor }} />
                                        <span style={{ fontSize: '10px', fontWeight: 700, color: priorityColor }}>{subj.priority}</span>
                                    </div>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '3px 9px' }}>
                                        <BarChart2 size={9} style={{ color: '#64748b' }} />
                                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>{an.sessionCount || 0} sessions</span>
                                    </div>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '3px 9px' }}>
                                        <Calendar size={9} style={{ color: '#64748b' }} />
                                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>{relativeDate(an.lastStudied)}</span>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span style={{ fontSize: '11px', color: '#64748b' }}>Progress</span>
                                        <span style={{ fontSize: '12px', fontWeight: 800, color: clr.text }}>{pct}%</span>
                                    </div>
                                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${clr.accent},${clr.text})`, borderRadius: '3px', transition: 'width .5s ease' }} />
                                    </div>
                                </div>

                                {/* Hours + sparkline */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Clock size={13} style={{ color: '#64748b' }} />
                                        <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
                                            <strong style={{ color: clr.text }}>{hoursStudied}h</strong>
                                            <span style={{ color: '#475569' }}> / {subj.hoursGoal}h goal</span>
                                        </span>
                                    </div>
                                    <div title="Study activity last 7 days">
                                        <Sparkline data={weekMins.map(m => m / 60)} color={clr.accent} />
                                    </div>
                                </div>

                                {/* Auto-sync note */}
                                <div style={{ marginTop: '10px', fontSize: '10px', color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <RefreshCw size={9} style={{ color: '#334155' }} />
                                    Hours auto-calculated from logged sessions
                                </div>
                            </div>
                        );
                    })}

                    {/* Add tile */}
                    <div onClick={openAdd}
                        style={{ ...glass, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px dashed rgba(99,102,241,0.25)', minHeight: '200px', gap: '10px', transition: 'all .2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(30,41,59,0.7)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)'; }}
                    >
                        <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: 'rgba(99,102,241,0.1)', border: '1px dashed rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Plus size={20} style={{ color: '#6366f1' }} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Add New Subject</span>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes popIn { from { opacity:0; transform:scale(.96) translateY(8px); } to { opacity:1; transform:none; } }
                @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default Subjects;
