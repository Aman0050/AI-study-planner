import React, { useState, useEffect, useRef } from 'react';
import {
    TrendingUp, Flame, Target, Clock, Award, CheckCircle2,
    Plus, X, Play, Pause, ChevronUp, ChevronDown, Zap,
    BookOpen, BarChart2, Timer
} from 'lucide-react';
import { taskService } from '../services/api';

// ─── helpers ──────────────────────────────────────────────────────────────────
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

const heatColor = (n) => {
    if (!n) return 'rgba(255,255,255,0.04)';
    if (n === 1) return 'rgba(99,102,241,0.3)';
    if (n === 2) return 'rgba(99,102,241,0.55)';
    return 'rgba(99,102,241,0.9)';
};

const fmt = (mins) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60), m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
};

const dayLabel = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function calcStreak(sessions) {
    const days = new Set(sessions.map(s => new Date(s.date).toDateString()));
    let streak = 0;
    const today = new Date();
    while (days.has(new Date(today.getTime() - streak * 86400000).toDateString())) streak++;
    return streak;
}

function weeklyMinutes(sessions) {
    const now = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - 6 + i);
        return d;
    });
    return days.map(d => ({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: d,
        mins: sessions
            .filter(s => new Date(s.date).toDateString() === d.toDateString())
            .reduce((a, s) => a + (s.duration || 0), 0),
    }));
};

function buildHeatmap(sessions) {
    const today = new Date();
    return Array.from({ length: 15 }, (_, w) =>
        Array.from({ length: 7 }, (_, d) => {
            const date = new Date(today);
            date.setDate(today.getDate() - (14 - w) * 7 + d - today.getDay());
            const count = sessions.filter(s => new Date(s.date).toDateString() === date.toDateString()).length;
            return { date, count };
        })
    );
};

// ─── Log Session Modal ────────────────────────────────────────────────────────
const LogModal = ({ subjects, onSave, onClose }) => {
    const [form, setForm] = useState({ title: '', subjectName: subjects[0]?.name || '', duration: 30, notes: '', completed: true });
    const [timerOn, setTimerOn] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef(null);

    useEffect(() => {
        if (timerOn) {
            timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
        } else {
            clearInterval(timerRef.current);
            if (elapsed > 0) setForm(f => ({ ...f, duration: Math.round(elapsed / 60) || 1 }));
        }
        return () => clearInterval(timerRef.current);
    }, [timerOn]);

    const pad = (n) => String(n).padStart(2, '0');

    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div onClick={e => e.stopPropagation()} style={{ ...glass, width: '100%', maxWidth: '440px', padding: '30px', margin: '0 16px', animation: 'popIn .18s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
                    <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#fff', margin: 0 }}>Log Study Session</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
                </div>

                {/* Live timer */}
                <div style={{ textAlign: 'center', marginBottom: '20px', padding: '16px', background: 'rgba(99,102,241,0.08)', borderRadius: '14px', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <div style={{ fontSize: '36px', fontWeight: 900, color: timerOn ? '#a5b4fc' : '#475569', fontFamily: 'monospace', letterSpacing: '2px' }}>
                        {pad(Math.floor(elapsed / 3600))}:{pad(Math.floor((elapsed % 3600) / 60))}:{pad(elapsed % 60)}
                    </div>
                    <button onClick={() => setTimerOn(v => !v)} style={{ marginTop: '10px', background: timerOn ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.15)', border: `1px solid ${timerOn ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)'}`, color: timerOn ? '#f87171' : '#818cf8', borderRadius: '8px', padding: '7px 18px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {timerOn ? <><Pause size={14} /> Stop Timer</> : <><Play size={14} /> Start Timer</>}
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '5px' }}>Session Title *</label>
                        <input style={inputStyle} placeholder="e.g. Chapter 4 Review" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '5px' }}>Subject</label>
                        <select style={inputStyle} value={form.subjectName} onChange={e => setForm(f => ({ ...f, subjectName: e.target.value }))}>
                            {subjects.length === 0
                                ? <option value="">No subjects — add some first</option>
                                : subjects.map(s => <option key={s.id} value={s.name}>{s.emoji} {s.name}</option>)
                            }
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '5px' }}>Duration (minutes)</label>
                        <input style={inputStyle} type="number" min="1" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }} onClick={() => setForm(f => ({ ...f, completed: !f.completed }))}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: form.completed ? 'linear-gradient(135deg,#6366f1,#a855f7)' : 'rgba(255,255,255,0.05)', border: form.completed ? 'none' : '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {form.completed && <CheckCircle2 size={13} color="white" />}
                        </div>
                        <span style={{ fontSize: '13px', color: form.completed ? '#c7d2fe' : '#64748b', fontWeight: 600 }}>Mark as completed</span>
                    </div>
                </div>

                <button
                    onClick={() => { if (form.title.trim()) { onSave({ ...form, date: new Date().toISOString() }); } }}
                    style={{ width: '100%', marginTop: '20px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: '#fff', border: 'none', borderRadius: '11px', padding: '13px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', boxShadow: '0 4px 14px rgba(99,102,241,.35)' }}>
                    <Plus size={17} /> Save Session
                </button>
            </div>
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const Progress = () => {
    const [sessions, setSessions] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [showLog, setShowLog] = useState(false);
    const [range, setRange] = useState('week'); // 'week' | 'month' | 'all'

    // Load data
    useEffect(() => {
        taskService.getAll().then(setTasks).catch(() => { });
        const subs = localStorage.getItem('studyai_subjects');
        if (subs) setSubjects(JSON.parse(subs));
        const sess = localStorage.getItem('studyai_sessions');
        if (sess) setSessions(JSON.parse(sess));
    }, []);

    const saveSessions = (list) => {
        setSessions(list);
        localStorage.setItem('studyai_sessions', JSON.stringify(list));
    };

    const handleLogSession = (sess) => {
        saveSessions([sess, ...sessions]);
        setShowLog(false);
    };

    const deleteSession = (idx) => saveSessions(sessions.filter((_, i) => i !== idx));

    // Combine tasks + manual sessions for analytics
    const taskSessions = tasks.map(t => ({
        title: t.title,
        subjectName: t.subject || 'General',
        date: t.date || new Date().toISOString(),
        duration: t.estimatedTime || 60,
        completed: t.completed || false,
        fromTask: true,
    }));
    const allSessions = [...sessions, ...taskSessions];

    // Filtered data
    const now = new Date();
    const filtered = allSessions.filter(s => {
        const d = new Date(s.date);
        if (range === 'week') return d >= new Date(now - 7 * 86400000);
        if (range === 'month') return d >= new Date(now - 30 * 86400000);
        return true;
    });

    // Stats
    const totalMins = filtered.reduce((a, s) => a + (s.duration || 0), 0);
    const done = filtered.filter(s => s.completed).length;
    const streak = calcStreak(allSessions);
    const weekData = weeklyMinutes(allSessions);
    const maxMins = Math.max(1, ...weekData.map(d => d.mins));
    const heatmap = buildHeatmap(allSessions);

    // Subject breakdown from real sessions
    const subjectMap = {};
    filtered.forEach(s => {
        const key = s.subjectName || 'General';
        subjectMap[key] = (subjectMap[key] || 0) + (s.duration || 0);
    });
    const subjectBreakdown = Object.entries(subjectMap).sort((a, b) => b[1] - a[1]);
    const maxSubMins = Math.max(1, ...subjectBreakdown.map(s => s[1]));

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#a855f7', '#ef4444', '#ec4899'];
    const getSubjectColor = (name) => {
        const subj = subjects.find(s => s.name === name);
        if (subj) return ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#ec4899', '#22c55e'][subj.colorIdx ?? 0];
        return '#6366f1';
    };
    const getSubjectEmoji = (name) => subjects.find(s => s.name === name)?.emoji || '📚';

    return (
        <div style={{ fontFamily: "'Inter', sans-serif" }}>
            {showLog && <LogModal subjects={subjects} onSave={handleLogSession} onClose={() => setShowLog(false)} />}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg,#f59e0b,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(245,158,11,.3)' }}>
                        <TrendingUp color="white" size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', margin: 0, fontFamily: "'Outfit',sans-serif" }}>Progress Tracking</h1>
                        <p style={{ color: '#64748b', margin: '3px 0 0', fontSize: '13px' }}>Real data from your study sessions & tasks</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {/* Range toggle */}
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '3px' }}>
                        {['week', 'month', 'all'].map(r => (
                            <button key={r} onClick={() => setRange(r)} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, background: range === r ? 'rgba(99,102,241,0.3)' : 'transparent', color: range === r ? '#c7d2fe' : '#64748b', textTransform: 'capitalize', transition: 'all .15s' }}>
                                {r === 'all' ? 'All Time' : `This ${r.charAt(0).toUpperCase() + r.slice(1)}`}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setShowLog(true)} style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: '#fff', border: 'none', borderRadius: '11px', padding: '10px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', boxShadow: '0 4px 14px rgba(99,102,241,.35)' }}>
                        <Timer size={16} /> Log Session
                    </button>
                </div>
            </div>

            {/* Empty state */}
            {allSessions.length === 0 && (
                <div style={{ ...glass, padding: '60px', textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '14px' }}>📈</div>
                    <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>No data yet</h3>
                    <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 24px' }}>Log your first study session to start seeing real analytics</p>
                    <button onClick={() => setShowLog(true)} style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 28px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                        + Log First Session
                    </button>
                </div>
            )}

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                {[
                    { icon: Flame, label: 'Day Streak', value: streak ? `${streak} 🔥` : '0', sub: streak ? 'Keep going!' : 'Log today to start', color: '#f59e0b', bg: 'rgba(245,158,11,.1)' },
                    { icon: Clock, label: 'Study Time', value: fmt(totalMins), sub: `${filtered.length} sessions`, color: '#818cf8', bg: 'rgba(99,102,241,.1)' },
                    { icon: CheckCircle2, label: 'Completed', value: done, sub: `of ${filtered.length} sessions`, color: '#34d399', bg: 'rgba(16,185,129,.1)' },
                    { icon: BookOpen, label: 'Subjects', value: subjects.length, sub: `${subjectBreakdown.length} active`, color: '#f9a8d4', bg: 'rgba(236,72,153,.1)' },
                ].map(s => (
                    <div key={s.label} style={{ ...glass, padding: '20px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                            <s.icon size={21} style={{ color: s.color }} />
                        </div>
                        <div style={{ fontSize: '26px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{s.value}</div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginTop: '4px' }}>{s.label}</div>
                        <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{s.sub}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '18px', marginBottom: '18px' }}>
                {/* Weekly bar chart */}
                <div style={{ ...glass, padding: '24px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: '0 0 20px' }}>Study Hours — Last 7 Days</h3>
                    {allSessions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#334155', fontSize: '13px' }}>Log sessions to see your chart</div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '140px' }}>
                            {weekData.map((d, i) => {
                                const pct = (d.mins / maxMins) * 100;
                                const isTd = d.date.toDateString() === new Date().toDateString();
                                return (
                                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                                        {d.mins > 0 && <div style={{ fontSize: '9px', fontWeight: 700, color: isTd ? '#a5b4fc' : '#64748b' }}>{fmt(d.mins)}</div>}
                                        <div style={{ width: '100%', height: `${Math.max(pct, d.mins > 0 ? 5 : 0)}%`, borderRadius: '7px 7px 3px 3px', background: isTd ? 'linear-gradient(180deg,#a855f7,#6366f1)' : d.mins > 0 ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: isTd ? '0 0 14px rgba(99,102,241,.3)' : 'none', transition: 'all .3s', minHeight: d.mins > 0 ? '8px' : '4px' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(180deg,#a855f7,#6366f1)'; e.currentTarget.style.boxShadow = '0 0 14px rgba(99,102,241,.3)'; }}
                                            onMouseLeave={e => { if (!isTd) { e.currentTarget.style.background = d.mins > 0 ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.03)'; e.currentTarget.style.boxShadow = 'none'; } }}
                                        />
                                        <div style={{ fontSize: '10px', fontWeight: 700, color: isTd ? '#a5b4fc' : '#334155' }}>{d.label}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Subject breakdown */}
                <div style={{ ...glass, padding: '22px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: '0 0 18px' }}>By Subject</h3>
                    {subjectBreakdown.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px 0', color: '#334155', fontSize: '13px' }}>No data for this range</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
                            {subjectBreakdown.slice(0, 6).map(([name, mins], i) => {
                                const pct = Math.round((mins / maxSubMins) * 100);
                                const color = getSubjectColor(name);
                                const emoji = getSubjectEmoji(name);
                                return (
                                    <div key={name}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                                <span style={{ fontSize: '14px' }}>{emoji}</span>
                                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                                            </div>
                                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{fmt(mins)}</span>
                                        </div>
                                        <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px', transition: 'width .6s ease', boxShadow: `0 0 6px ${color}55` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Heatmap */}
            <div style={{ ...glass, padding: '22px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>Activity Heatmap — Last 15 Weeks</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#475569' }}>
                        Less {[0, 1, 2, 3].map(i => <div key={i} style={{ width: '11px', height: '11px', borderRadius: '3px', background: heatColor(i) }} />)} More
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '18px', flexShrink: 0 }}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <div key={i} style={{ height: '13px', fontSize: '9px', color: '#334155', fontWeight: 700, textAlign: 'right', paddingRight: '6px' }}>{i % 2 === 0 ? d : ''}</div>
                        ))}
                    </div>
                    {heatmap.map((week, wi) => (
                        <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                            <div style={{ height: '14px', fontSize: '9px', color: '#334155', fontWeight: 700 }}>
                                {week[0]?.date.getDate() <= 7 ? week[0].date.toLocaleString('default', { month: 'short' }) : ''}
                            </div>
                            {week.map((day, di) => (
                                <div key={di}
                                    title={`${dayLabel(day.date)}: ${day.count} session${day.count !== 1 ? 's' : ''}`}
                                    style={{ width: '13px', height: '13px', borderRadius: '3px', background: heatColor(day.count), cursor: 'default', transition: 'transform .1s' }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.4)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent sessions list */}
            <div style={{ ...glass, padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>Recent Sessions</h3>
                    <button onClick={() => setShowLog(true)} style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', borderRadius: '9px', padding: '7px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Plus size={13} /> Log Session
                    </button>
                </div>
                {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#334155' }}>
                        <BarChart2 size={32} style={{ margin: '0 auto 10px', color: '#1e293b' }} />
                        <p style={{ margin: 0, fontSize: '13px' }}>No sessions logged for this period</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {filtered.slice(0, 10).map((s, i) => {
                            const color = getSubjectColor(s.subjectName);
                            const emoji = getSubjectEmoji(s.subjectName);
                            return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', transition: 'border-color .2s' }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                                >
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{emoji}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{s.subjectName} · {dayLabel(new Date(s.date))}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                        <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={11} />{fmt(s.duration)}</span>
                                        <span style={{ fontSize: '10px', fontWeight: 700, color: s.completed ? '#34d399' : '#f87171', background: s.completed ? 'rgba(16,185,129,.1)' : 'rgba(239,68,68,.08)', padding: '2px 8px', borderRadius: '20px' }}>
                                            {s.completed ? '✓ Done' : '○ Pending'}
                                        </span>
                                        {!s.fromTask && (
                                            <button onClick={() => deleteSession(sessions.indexOf(s))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.5, padding: '2px' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.5}>
                                                <X size={13} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style>{`@keyframes popIn { from { opacity:0; transform:scale(.96) translateY(8px); } to { opacity:1; transform:none; } }`}</style>
        </div>
    );
};

export default Progress;
