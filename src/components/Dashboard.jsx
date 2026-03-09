import React, { useState, useEffect } from 'react';
import {
    Clock, CheckCircle2, Zap, Target, Plus, Star,
    BookOpen, TrendingUp, ArrowUpRight, Circle, Play
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { taskService } from '../services/api';
import VideoPlayerModal from './VideoPlayerModal';

// ── helpers ──────────────────────────────────────────────────────────────────
const glass = { background: 'rgba(30,41,59,0.75)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', backdropFilter: 'blur(12px)' };

function calcStreak(sessions) {
    const days = new Set(sessions.map(s => new Date(s.date).toDateString()));
    let streak = 0;
    const today = new Date();
    while (days.has(new Date(today.getTime() - streak * 86400000).toDateString())) streak++;
    return streak;
}

function last7DaysData(sessions) {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - 6 + i);
        const mins = sessions
            .filter(s => new Date(s.date).toDateString() === d.toDateString())
            .reduce((a, s) => a + (s.duration || 0), 0);
        return { name: d.toLocaleDateString('en-US', { weekday: 'short' }), hours: Math.round((mins / 60) * 10) / 10 };
    });
}

// ── Skeleton Components ───────────────────────────────────────────────────────
const StatSkeleton = () => (
    <div style={{ ...glass, padding: '22px' }} className="skeleton">
        <div style={{ height: '42px', width: '42px', borderRadius: '12px', marginBottom: '16px', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ height: '26px', width: '60%', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', marginBottom: '8px' }} />
        <div style={{ height: '12px', width: '40%', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }} />
    </div>
);

const TaskSkeleton = () => (
    <div style={{ height: '48px', width: '100%', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }} className="skeleton" />
);

// ── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, accent, bg }) => (
    <div style={{ ...glass, padding: '22px' }} className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={21} style={{ color: accent }} />
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#34d399', background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <ArrowUpRight size={11} /> live
            </div>
        </div>
        <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em', fontFamily: "'Outfit', sans-serif" }}>{value}</div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginTop: '6px' }}>{label}</div>
        {sub && <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>{sub}</div>}
    </div>
);

// ── TaskRow ───────────────────────────────────────────────────────────────────
const TaskRow = ({ task, onToggle, onPlay }) => {
    const [hover, setHover] = useState(false);
    return (
        <div
            onClick={() => onToggle(task._id, !task.completed)}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px', background: hover ? 'rgba(99,102,241,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${hover ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)'}`, cursor: 'pointer', transition: 'all 0.18s' }}
        >
            <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: `2px solid ${task.completed ? '#10b981' : 'rgba(255,255,255,0.2)'}`, background: task.completed ? 'rgba(16,185,129,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                {task.completed && <CheckCircle2 size={12} style={{ color: '#10b981' }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: task.completed ? '#475569' : '#f1f5f9', textDecoration: task.completed ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                {task.subject && <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{task.subject}</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {task.videoUrl && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onPlay(task); }}
                        style={{ background: 'rgba(99,102,241,0.15)', border: 'none', borderRadius: '6px', padding: '4px', cursor: 'pointer', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Watch Study Video"
                    >
                        <Play size={14} fill="currentColor" />
                    </button>
                )}
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: task.completed ? '#10b981' : '#6366f1' }} />
            </div>
        </div>
    );
};

// ── Tooltip ───────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px' }}>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 4px', fontWeight: 600 }}>{label}</p>
            <p style={{ fontSize: '16px', fontWeight: 800, color: '#a5b4fc', margin: 0 }}>{payload[0].value}h</p>
        </div>
    );
};

// ── Format Helper ────────────────────────────────────────────────────────────
const fmtTime = (mins) => {
    if (mins <= 0) return '0h';
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = ({ onNavigate, showToast }) => {
    const [tasks, setTasks] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showProInfo, setShowProInfo] = useState(false);
    const [chartMode, setChartMode] = useState('sessions'); // 'sessions' | 'tasks'
    const [playingTask, setPlayingTask] = useState(null);

    useEffect(() => {
        fetchAll();
        const s = localStorage.getItem('studyai_sessions');
        if (s) setSessions(JSON.parse(s));
        const sub = localStorage.getItem('studyai_subjects');
        if (sub) setSubjects(JSON.parse(sub));
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const data = await taskService.getAll();
            setTasks(data);
        } catch (e) {
            console.error(e);
        } finally {
            // Add a small artificial delay to show off the skeletons
            setTimeout(() => setLoading(false), 800);
        }
    };

    const handleVideoProgress = (mins) => {
        if (!playingTask || mins < 1) return;

        const newSession = {
            title: `Watched: ${playingTask.title}`,
            subjectName: playingTask.subject || 'General',
            duration: mins,
            date: new Date().toISOString(),
            completed: true,
            fromVideo: true
        };

        const updatedSessions = [newSession, ...sessions];
        setSessions(updatedSessions);
        localStorage.setItem('studyai_sessions', JSON.stringify(updatedSessions));

        // Also update subject hours if it exists
        if (playingTask.subject) {
            const updatedSubjects = subjects.map(s => {
                if (s.name === playingTask.subject) {
                    return { ...s, hoursStudied: (s.hoursStudied || 0) + (mins / 60) };
                }
                return s;
            });
            setSubjects(updatedSubjects);
            localStorage.setItem('studyai_subjects', JSON.stringify(updatedSubjects));
        }

        showToast(`Auto-logged ${mins}m study session! 🎥`);
    };

    const handleToggle = async (id, completed) => {
        if (!id) return;
        setTasks(prev => prev.map(t => t._id === id ? { ...t, completed } : t));
        try {
            await taskService.update(id, { completed });
            showToast(completed ? '✅ Task completed!' : '↩ Task re-opened');
        } catch {
            showToast('Failed to update task', 'error');
            fetchAll();
        }
    };

    // ── Computed stats ─────────────────────────────────────────────────────
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;
    const goalPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const totalStudyMins = sessions.reduce((a, s) => a + (s.duration || 0), 0);
    const studyHours = Math.round((totalStudyMins / 60) * 10) / 10;
    const streak = calcStreak(sessions);

    // ── Chart data ─────────────────────────────────────────────────────────
    const sessionChart = last7DaysData(sessions);

    // Task completion per day (last 7 days)
    const now = new Date();
    const taskChart = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - 6 + i);
        const done = tasks.filter(t => t.completed && new Date(t.updatedAt || t.date).toDateString() === d.toDateString()).length;
        return { name: d.toLocaleDateString('en-US', { weekday: 'short' }), hours: done };
    });

    const chartData = chartMode === 'sessions' ? sessionChart : taskChart;

    // Today's tasks (due today or not yet done)
    const todayTasks = tasks.filter(t => {
        if (t.completed) return false;
        if (!t.date) return true;
        const td = new Date(t.date).toDateString();
        return td === new Date().toDateString() || new Date(t.date) <= new Date();
    }).slice(0, 5);

    const recentCompleted = tasks.filter(t => t.completed).slice(-3).reverse();

    // Subject progress
    const subjectProgress = subjects.map(s => {
        const goal = s.hoursGoal || 1;
        const studied = s.hoursStudied || 0;
        const pct = Math.min(100, Math.round((studied / goal) * 100));
        return { ...s, pct: isNaN(pct) ? 0 : pct };
    });

    const userTime = new Date().getHours();
    const greeting = userTime < 12 ? 'Good Morning' : userTime < 18 ? 'Good Afternoon' : 'Good Evening';
    const userName = JSON.parse(localStorage.getItem('studyai_user') || '{}').name?.split(' ')[0] || 'Scholar';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', fontFamily: "'Outfit', sans-serif", paddingBottom: '40px' }} className="page-transition">
            {/* Welcome Section */}
            <div style={{ position: 'relative', padding: '48px', borderRadius: '32px', background: 'rgba(13, 20, 38, 0.4)', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.4)', transition: 'transform 0.4s' }} className="glass-card glow-edge">
                <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0, 245, 255, 0.1) 0%, transparent 70%)', filter: 'blur(50px)', animation: 'pulseAura 10s infinite alternate' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                        <div style={{ padding: '6px 16px', background: 'rgba(0, 245, 255, 0.1)', borderRadius: '20px', fontSize: '12px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.1em', border: '1px solid rgba(0, 245, 255, 0.2)' }}>MISSION CONTROL</div>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 15px #10b981' }} />
                    </div>
                    <h1 style={{ fontSize: 'clamp(34px, 6vw, 48px)', fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.1, letterSpacing: '-0.04em' }}>
                        {greeting}, <span style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{userName}</span>.
                    </h1>
                    <p style={{ color: 'var(--text-muted)', margin: '20px 0 0', fontSize: '18px', fontWeight: 500, maxWidth: '550px', lineHeight: 1.7 }}>
                        Neural systems optimized. You've completed <strong style={{ color: '#fff' }}>{goalPct}%</strong> of your weekly tactical objectives. Ready to initiate the next focus sprint?
                    </p>
                    <div style={{ display: 'flex', gap: '18px', marginTop: '40px' }}>
                        <button onClick={() => onNavigate('study')} className="btn-primary" style={{ padding: '16px 32px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 15px 35px var(--primary-glow)', fontSize: '15px' }}>
                            <Play size={20} fill="currentColor" /> Resume Focus Session
                        </button>
                        <button onClick={() => onNavigate('planner')} style={{ background: 'rgba(255,255,255,0.03)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px 28px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s', fontSize: '15px' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                            Plan Next Sprint
                        </button>
                    </div>
                </div>
            </div>

            {/* Stat cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '24px'
            }}>
                {loading ? (
                    [...Array(4)].map((_, i) => <StatSkeleton key={i} />)
                ) : (
                    <>
                        <StatCard icon={Clock} label="Study Time" value={fmtTime(totalStudyMins)} sub={`${sessions.length} sessions logged`} accent="var(--primary)" bg="rgba(0,245,255,.1)" />
                        <StatCard icon={CheckCircle2} label="Tasks Done" value={`${completedTasks}/${totalTasks}`} sub={totalTasks ? `${goalPct}% complete` : 'No tasks yet'} accent="#34d399" bg="rgba(16,185,129,.1)" />
                        <StatCard icon={Zap} label="Day Streak" value={streak ? `${streak} 🔥` : '0'} sub={streak ? 'Neural link stable' : 'Initiate log today'} accent="#f59e0b" bg="rgba(245,158,11,.1)" />
                        <StatCard icon={Target} label="Goal Progress" value={`${goalPct}%`} sub={`${subjects.length} subject${subjects.length !== 1 ? 's' : ''} tracked`} accent="var(--secondary)" bg="rgba(139,92,246,.1)" />
                    </>
                )}
            </div>

            {/* Main row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '24px'
            }}>
                {/* Chart area */}
                <div style={{ ...glass, padding: '28px' }} className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <div>
                            <h3 style={{ fontSize: '18px', margin: 0 }}>Study Activity</h3>
                            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
                                {chartMode === 'sessions' ? 'Hours studied per day' : 'Tasks completed per day'} — last 7 days
                            </p>
                        </div>
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '4px' }}>
                            {['sessions', 'tasks'].map(m => (
                                <button key={m} onClick={() => setChartMode(m)} style={{ padding: '6px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, background: chartMode === m ? 'rgba(99,102,241,0.25)' : 'transparent', color: chartMode === m ? '#c7d2fe' : '#64748b', textTransform: 'capitalize', transition: 'all .2s' }}>
                                    {m === 'sessions' ? '⏱ Hours' : '✅ Tasks'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {sessions.length === 0 && tasks.length === 0 ? (
                        <div style={{ height: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
                            <TrendingUp size={40} style={{ marginBottom: '16px', color: '#1e293b' }} />
                            <p style={{ fontSize: '14px', margin: 0 }}>No data yet — log sessions or add tasks to see your chart</p>
                        </div>
                    ) : (
                        <div style={{ height: '260px', minWidth: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                                    <defs>
                                        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={3} fill="url(#grad)" dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#a5b4fc', stroke: '#fff', strokeWidth: 2 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Right panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {/* Today's tasks */}
                    <div style={{ ...glass, padding: '24px', flex: 1 }} className="glass-card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '17px', margin: 0 }}>Today's Focus</h3>
                            <button onClick={() => onNavigate('tasks')} style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer' }} className="hover-underline">View All →</button>
                        </div>
                        {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {[...Array(3)].map((_, i) => <TaskSkeleton key={i} />)}
                            </div>
                        ) : todayTasks.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '30px', color: '#334155' }}>
                                <CheckCircle2 size={32} style={{ margin: '0 auto 12px', color: '#1e293b' }} />
                                <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
                                    {tasks.length === 0 ? 'No tasks yet — create a plan!' : '🎉 All caught up for today!'}
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {todayTasks.map(t => <TaskRow key={t._id} task={t} onToggle={handleToggle} onPlay={setPlayingTask} />)}
                            </div>
                        )}
                    </div>

                    {/* Pro upgrade */}
                    <div style={{ ...glass, padding: '24px', background: 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(168,85,247,0.1))', border: '1px solid rgba(99,102,241,0.25)', position: 'relative', overflow: 'hidden' }} className="glass-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <Star size={18} style={{ color: '#fbbf24' }} fill="#fbbf24" />
                            <h4 style={{ fontWeight: 800, color: '#fff', margin: 0, fontSize: '16px', fontFamily: "'Outfit', sans-serif" }}>Upgrade to Pro</h4>
                        </div>
                        <p style={{ fontSize: '13px', color: 'rgba(199,210,254,0.8)', margin: '0 0 16px', lineHeight: 1.6 }}>Get unlimited AI study plans, deep productivity metrics & zero distractions.</p>
                        <button onClick={() => setShowProInfo(v => !v)} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                            {showProInfo ? 'Hide Details' : 'Unlock Pro — $0/mo'}
                        </button>
                        <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', width: '100px', height: '100px', background: 'rgba(99,102,241,0.2)', borderRadius: '50%', filter: 'blur(24px)', pointerEvents: 'none' }} />
                    </div>
                </div>
            </div>

            {/* Bottom row — Subject progress + Recent completions */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '24px'
            }}>
                {/* Subject progress */}
                <div style={{ ...glass, padding: '24px' }} className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
                        <h3 style={{ fontSize: '17px', margin: 0 }}>Subject Progress</h3>
                        <button onClick={() => onNavigate('subjects')} style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer' }} className="hover-underline">Manage →</button>
                    </div>
                    {subjectProgress.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px 0', color: '#334155' }}>
                            <BookOpen size={30} style={{ margin: '0 auto 12px', color: '#1e293b' }} />
                            <p style={{ fontSize: '14px', margin: 0 }}>No subjects being tracked</p>
                            <button onClick={() => onNavigate('subjects')} style={{ marginTop: '16px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', borderRadius: '10px', padding: '8px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>+ Add Your First Subject</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '280px', overflowY: 'auto', paddingRight: '8px' }}>
                            {subjectProgress.map(s => {
                                const colors = ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#ec4899', '#22c55e'];
                                const color = colors[s.colorIdx ?? 0];
                                return (
                                    <div key={s.id}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '18px' }}>{s.emoji}</span>
                                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>{s.name}</span>
                                            </div>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>{s.hoursStudied}h / {s.hoursGoal}h</span>
                                        </div>
                                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${s.pct}%`, background: `linear-gradient(90deg, ${color}, ${color}dd)`, borderRadius: '4px', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: `0 0 10px ${color}44` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Recently completed tasks */}
                <div style={{ ...glass, padding: '24px' }} className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
                        <h3 style={{ fontSize: '17px', margin: 0 }}>Success History</h3>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#34d399', background: 'rgba(16,185,129,0.1)', padding: '4px 12px', borderRadius: '24px', letterSpacing: '0.05em' }}>{completedTasks} MISSIONS DONE</span>
                    </div>
                    {recentCompleted.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px 0', color: '#334155' }}>
                            <Circle size={30} style={{ margin: '0 auto 12px', color: '#1e293b' }} />
                            <p style={{ fontSize: '14px', margin: 0 }}>Completed tasks will appear here</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {recentCompleted.map((t, i) => (
                                <div key={t._id || i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; e.currentTarget.style.transform = 'scale(1.02)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.05)'; e.currentTarget.style.transform = 'scale(1)'; }}>
                                    <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8', textDecoration: 'line-through', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                                        {t.subject && <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{t.subject}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {playingTask && (
                <VideoPlayerModal
                    task={playingTask}
                    onProgressUpdate={handleVideoProgress}
                    onClose={() => setPlayingTask(null)}
                />
            )}
        </div>
    );
};

export default Dashboard;
