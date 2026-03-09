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
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div onClick={e => e.stopPropagation()} style={{ ...glass, width: '100%', maxWidth: '440px', padding: '24px md:30px', maxHeight: '90vh', overflowY: 'auto', animation: 'popIn .18s ease' }}>
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

    const allSessions = [...sessions];

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

    const getSubjectColor = (name) => {
        const subj = subjects.find(s => s.name === name);
        if (subj) return ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#ec4899', '#22c55e'][subj.colorIdx ?? 0];
        return '#6366f1';
    };
    const getSubjectEmoji = (name) => subjects.find(s => s.name === name)?.emoji || '📚';

    return (
        <div style={{ fontFamily: "'Inter', sans-serif" }} className="page-transition">
            {showLog && <LogModal subjects={subjects} onSave={handleLogSession} onClose={() => setShowLog(false)} />}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg,#f59e0b,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(239,68,68,0.3)' }}>
                        <TrendingUp color="white" size={24} />
                    </div>
                    <div>
                        <h1 className="gradient-text" style={{ margin: 0 }}>Progress Tracking</h1>
                        <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '14px', fontWeight: 500 }}>Real data from your study sessions & tasks</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '4px' }}>
                        {['week', 'month', 'all'].map(r => (
                            <button key={r} onClick={() => setRange(r)} style={{ padding: '6px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, background: range === r ? 'rgba(99,102,241,0.25)' : 'transparent', color: range === r ? '#c7d2fe' : '#64748b', textTransform: 'capitalize', transition: 'all .2s' }}>
                                {r === 'all' ? 'All Time' : `This ${r.charAt(0).toUpperCase() + r.slice(1)}`}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setShowLog(true)} className="btn-primary">
                        <Timer size={18} /> Log Session
                    </button>
                </div>
            </div>

            {/* Empty state */}
            {allSessions.length === 0 && (
                <div style={{ padding: '60px', textAlign: 'center', marginBottom: '24px' }} className="glass-card">
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>📉</div>
                    <h3 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, margin: '0 0 8px', fontFamily: "'Outfit', sans-serif" }}>No data yet</h3>
                    <p style={{ color: '#64748b', fontSize: '15px', margin: '0 0 24px', fontWeight: 500 }}>Log your first study session to start seeing real analytics</p>
                    <button onClick={() => setShowLog(true)} className="btn-primary" style={{ margin: '0 auto' }}>
                        + Log First Session
                    </button>
                </div>
            )}

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px', marginBottom: '24px' }}>
                {[
                    { icon: Flame, label: 'Streak', value: streak ? `${streak}🔥` : '0', sub: streak ? 'Keep it up!' : 'Start today', color: '#f59e0b', bg: 'rgba(245,158,11,.1)' },
                    { icon: Clock, label: 'Studied', value: fmt(totalMins), sub: `${filtered.length} sessions`, color: '#818cf8', bg: 'rgba(99,102,241,.1)' },
                    { icon: CheckCircle2, label: 'Completed', value: done, sub: `of ${filtered.length} total`, color: '#34d399', bg: 'rgba(16,185,129,.1)' },
                    { icon: BookOpen, label: 'Subjects', value: subjects.length, sub: `${subjectBreakdown.length} active now`, color: '#f9a8d4', bg: 'rgba(236,72,153,.1)' },
                ].map(s => (
                    <div key={s.label} style={{ padding: '24px' }} className="glass-card">
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                            <s.icon size={20} style={{ color: s.color }} />
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em', fontFamily: "'Outfit', sans-serif" }}>{s.value}</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginTop: '6px' }}>{s.label}</div>
                        <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>{s.sub}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                {/* Weekly bar chart */}
                <div style={{ padding: '28px' }} className="glass-card">
                    <h3 style={{ fontSize: '18px', margin: '0 0 24px' }}>Study Hours — Last 7 Days</h3>
                    {allSessions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#334155', fontSize: '14px' }}>Log sessions to see your chart</div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '180px' }}>
                            {weekData.map((d, i) => {
                                const pct = (d.mins / maxMins) * 100;
                                const isTd = d.date.toDateString() === new Date().toDateString();
                                return (
                                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                                        {d.mins > 0 && <div style={{ fontSize: '10px', fontWeight: 800, color: isTd ? '#a5b4fc' : '#64748b' }}>{fmt(d.mins)}</div>}
                                        <div style={{
                                            width: '100%',
                                            height: `${Math.max(pct, d.mins > 0 ? 5 : 0)}%`,
                                            borderRadius: '8px',
                                            background: isTd ? 'linear-gradient(180deg,#a855f7,#6366f1)' : d.mins > 0 ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            boxShadow: isTd ? '0 8px 24px rgba(99,102,241,0.4)' : 'none',
                                            transition: 'all .4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                            minHeight: d.mins > 0 ? '8px' : '4px'
                                        }}
                                            onMouseEnter={e => { e.currentTarget.style.transform = 'scaleY(1.05)'; e.currentTarget.style.background = 'linear-gradient(180deg,#a855f7,#6366f1)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.transform = 'scaleY(1)'; if (!isTd) e.currentTarget.style.background = d.mins > 0 ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.03)'; }}
                                        />
                                        <div style={{ fontSize: '11px', fontWeight: 700, color: isTd ? '#a5b4fc' : '#475569' }}>{d.label}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Subject breakdown */}
                <div style={{ padding: '28px' }} className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '18px', margin: 0 }}>By Subject</h3>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>{filtered.length} SESSIONS Total</span>
                    </div>
                    {subjectBreakdown.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#334155', fontSize: '14px' }}>No data for this range</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '280px', overflowY: 'auto', paddingRight: '8px' }}>
                            {subjectBreakdown.slice(0, 8).map(([name, mins], i) => {
                                const pct = Math.round((mins / maxSubMins) * 100);
                                const color = getSubjectColor(name);
                                const emoji = getSubjectEmoji(name);
                                return (
                                    <div key={name}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '18px' }}>{emoji}</span>
                                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                                            </div>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>{fmt(mins)}</span>
                                        </div>
                                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}dd)`, borderRadius: '4px', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: `0 0 10px ${color}44` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Heatmap */}
            <div style={{ padding: '28px', marginBottom: '24px' }} className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '18px', margin: 0 }}>Activity Heatmap — Last 15 Weeks</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                        Less {[0, 1, 2, 3].map(i => <div key={i} style={{ width: '12px', height: '12px', borderRadius: '3px', background: heatColor(i) }} />)} More
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingTop: '22px', flexShrink: 0 }}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <div key={i} style={{ height: '14px', fontSize: '10px', color: '#475569', fontWeight: 800, textAlign: 'right', paddingRight: '10px' }}>{i % 2 === 0 ? d : ''}</div>
                        ))}
                    </div>
                    {heatmap.map((week, wi) => (
                        <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '5px', flexShrink: 0 }}>
                            <div style={{ height: '16px', fontSize: '10px', color: '#475569', fontWeight: 800 }}>
                                {week[0]?.date.getDate() <= 7 ? week[0].date.toLocaleString('default', { month: 'short' }) : ''}
                            </div>
                            {week.map((day, di) => (
                                <div key={di}
                                    title={`${dayLabel(day.date)}: ${day.count} session${day.count !== 1 ? 's' : ''}`}
                                    style={{ width: '14px', height: '14px', borderRadius: '4px', background: heatColor(day.count), cursor: 'pointer', transition: 'all .2s' }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.4)'; e.currentTarget.style.zIndex = '10'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.zIndex = '1'; }}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent sessions list */}
            <div style={{ padding: '28px' }} className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '18px', margin: 0 }}>Recent Successes</h3>
                    <button onClick={() => setShowLog(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                        <Plus size={16} /> Log Session
                    </button>
                </div>
                {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#334155' }}>
                        <BarChart2 size={42} style={{ margin: '0 auto 16px', color: '#1e293b' }} />
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: 500, color: '#94a3b8' }}>No sessions logged for this period</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {filtered.slice(0, 10).map((s, i) => {
                            const color = getSubjectColor(s.subjectName);
                            const emoji = getSubjectEmoji(s.subjectName);
                            return (
                                <div key={i} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    padding: '16px 20px',
                                    borderRadius: '16px',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'; e.currentTarget.style.transform = 'translateX(6px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                                >
                                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{emoji}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>{s.subjectName} · {dayLabel(new Date(s.date))}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: 800 }}>{fmt(s.duration)}</div>
                                            <div style={{ fontSize: '11px', color: s.completed ? '#10b981' : '#f43f5e', fontWeight: 700 }}>{s.completed ? 'COMPLETED' : 'PENDING'}</div>
                                        </div>
                                        {!s.fromTask && (
                                            <button onClick={() => deleteSession(sessions.indexOf(s))} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', cursor: 'pointer', padding: '8px', borderRadius: '10px', transition: 'all .2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}>
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style>{`@keyframes popIn { from { opacity:0; transform:scale(.97) translateY(12px); } to { opacity:1; transform:none; } }`}</style>
        </div>
    );
};

export default Progress;
