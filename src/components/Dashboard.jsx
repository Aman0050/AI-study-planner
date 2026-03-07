import React, { useState, useEffect } from 'react';
import {
    Clock, CheckCircle2, Zap, Target, Plus, Star,
    BookOpen, TrendingUp, ArrowUpRight, Circle
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { taskService } from '../services/api';

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
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
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

// ── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, accent, bg }) => (
    <div style={{ ...glass, padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={21} style={{ color: accent }} />
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#34d399', background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <ArrowUpRight size={11} /> live
            </div>
        </div>
        <div style={{ fontSize: '26px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginTop: '5px' }}>{label}</div>
        {sub && <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{sub}</div>}
    </div>
);

// ── TaskRow ───────────────────────────────────────────────────────────────────
const TaskRow = ({ task, onToggle }) => {
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
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: task.completed ? '#10b981' : '#6366f1', flexShrink: 0 }} />
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

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = ({ onNavigate, showToast }) => {
    const [tasks, setTasks] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showProInfo, setShowProInfo] = useState(false);
    const [chartMode, setChartMode] = useState('sessions'); // 'sessions' | 'tasks'

    useEffect(() => {
        fetchAll();
        const s = localStorage.getItem('studyai_sessions');
        if (s) setSessions(JSON.parse(s));
        const sub = localStorage.getItem('studyai_subjects');
        if (sub) setSubjects(JSON.parse(sub));
    }, []);

    const fetchAll = async () => {
        try {
            const data = await taskService.getAll();
            setTasks(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
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
        const pct = Math.min(100, Math.round((s.hoursStudied / s.hoursGoal) * 100));
        return { ...s, pct };
    }).slice(0, 4);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Dashboard Overview</h1>
                    <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '13px' }}>Live data from your tasks, sessions & subjects</p>
                </div>
                <button onClick={() => onNavigate('planner')} style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: '#fff', border: 'none', borderRadius: '12px', padding: '11px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', boxShadow: '0 4px 14px rgba(99,102,241,.35)' }}>
                    <Plus size={17} /> Create New Plan
                </button>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                <StatCard icon={Clock} label="Study Hours" value={`${studyHours}h`} sub={`${sessions.length} sessions logged`} accent="#818cf8" bg="rgba(99,102,241,.1)" />
                <StatCard icon={CheckCircle2} label="Tasks Done" value={`${completedTasks}/${totalTasks}`} sub={totalTasks ? `${goalPct}% complete` : 'No tasks yet'} accent="#34d399" bg="rgba(16,185,129,.1)" />
                <StatCard icon={Zap} label="Day Streak" value={streak ? `${streak} 🔥` : '0'} sub={streak ? 'Keep it up!' : 'Log a session today'} accent="#f59e0b" bg="rgba(245,158,11,.1)" />
                <StatCard icon={Target} label="Goal Progress" value={`${goalPct}%`} sub={`${subjects.length} subject${subjects.length !== 1 ? 's' : ''} tracked`} accent="#f9a8d4" bg="rgba(236,72,153,.1)" />
            </div>

            {/* Main row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '18px' }}>
                {/* Chart area */}
                <div style={{ ...glass, padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>Study Activity</h3>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '3px 0 0' }}>
                                {chartMode === 'sessions' ? 'Hours studied per day' : 'Tasks completed per day'} — last 7 days
                            </p>
                        </div>
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', padding: '3px' }}>
                            {['sessions', 'tasks'].map(m => (
                                <button key={m} onClick={() => setChartMode(m)} style={{ padding: '5px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, background: chartMode === m ? 'rgba(99,102,241,0.3)' : 'transparent', color: chartMode === m ? '#c7d2fe' : '#64748b', textTransform: 'capitalize', transition: 'all .15s' }}>
                                    {m === 'sessions' ? '⏱ Hours' : '✅ Tasks'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {sessions.length === 0 && tasks.length === 0 ? (
                        <div style={{ height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
                            <TrendingUp size={36} style={{ marginBottom: '12px', color: '#1e293b' }} />
                            <p style={{ fontSize: '13px', margin: 0 }}>No data yet — log sessions or add tasks to see your chart</p>
                        </div>
                    ) : (
                        <div style={{ height: '220px' }}>
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
                                    <Area type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={2.5} fill="url(#grad)" dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#a5b4fc' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Right panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Today's tasks */}
                    <div style={{ ...glass, padding: '20px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>Today's Focus</h3>
                            <button onClick={() => onNavigate('planner')} style={{ fontSize: '11px', fontWeight: 700, color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer' }}>View All →</button>
                        </div>
                        {loading ? (
                            <div style={{ color: '#334155', fontSize: '12px', textAlign: 'center', padding: '20px' }}>Loading tasks…</div>
                        ) : todayTasks.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#334155' }}>
                                <CheckCircle2 size={28} style={{ margin: '0 auto 8px', color: '#1e293b' }} />
                                <p style={{ margin: 0, fontSize: '12px' }}>
                                    {tasks.length === 0 ? 'No tasks yet — create a plan!' : '🎉 All caught up for today!'}
                                </p>
                                {tasks.length === 0 && (
                                    <button onClick={() => onNavigate('planner')} style={{ marginTop: '12px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                                        + Create Plan
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {todayTasks.map(t => <TaskRow key={t._id} task={t} onToggle={handleToggle} />)}
                            </div>
                        )}
                    </div>

                    {/* Pro upgrade */}
                    <div style={{ ...glass, padding: '18px', background: 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(168,85,247,0.08))', border: '1px solid rgba(99,102,241,0.2)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <Star size={15} style={{ color: '#fbbf24' }} />
                            <h4 style={{ fontWeight: 700, color: '#fff', margin: 0, fontSize: '14px' }}>Upgrade to Pro</h4>
                        </div>
                        <p style={{ fontSize: '12px', color: 'rgba(199,210,254,0.7)', margin: '0 0 12px', lineHeight: 1.6 }}>Unlimited AI plans, deep analytics & focus mode.</p>
                        {showProInfo && (
                            <div style={{ marginBottom: '12px', padding: '10px', background: 'rgba(99,102,241,0.1)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.2)' }}>
                                {['✅ Unlimited AI study plans', '✅ Deep analytics', '✅ Priority AI responses', '✅ Focus mode & reminders'].map(f => (
                                    <div key={f} style={{ fontSize: '11px', color: '#a5b4fc', marginBottom: '4px' }}>{f}</div>
                                ))}
                                <p style={{ fontSize: '11px', color: '#818cf8', margin: '8px 0 0' }}>📧 support@studyai.app</p>
                            </div>
                        )}
                        <button onClick={() => setShowProInfo(v => !v)} style={{ width: '100%', padding: '8px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: '#fff', borderRadius: '9px', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 3px 10px rgba(99,102,241,.3)' }}>
                            {showProInfo ? 'Hide ↑' : 'Learn More →'}
                        </button>
                        <div style={{ position: 'absolute', right: '-12px', bottom: '-12px', width: '80px', height: '80px', background: 'rgba(99,102,241,0.15)', borderRadius: '50%', filter: 'blur(18px)', pointerEvents: 'none' }} />
                    </div>
                </div>
            </div>

            {/* Bottom row — Subject progress + Recent completions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                {/* Subject progress */}
                <div style={{ ...glass, padding: '22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>Subject Progress</h3>
                        <button onClick={() => onNavigate('subjects')} style={{ fontSize: '11px', fontWeight: 700, color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer' }}>Manage →</button>
                    </div>
                    {subjectProgress.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px 0', color: '#334155' }}>
                            <BookOpen size={26} style={{ margin: '0 auto 8px', color: '#1e293b' }} />
                            <p style={{ fontSize: '12px', margin: 0 }}>No subjects yet</p>
                            <button onClick={() => onNavigate('subjects')} style={{ marginTop: '10px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>+ Add Subject</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {subjectProgress.map(s => {
                                const colors = ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#ec4899', '#22c55e'];
                                const color = colors[s.colorIdx ?? 0];
                                return (
                                    <div key={s.id}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                                <span style={{ fontSize: '15px' }}>{s.emoji}</span>
                                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{s.name}</span>
                                            </div>
                                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{s.hoursStudied}h / {s.hoursGoal}h</span>
                                        </div>
                                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${s.pct}%`, background: color, borderRadius: '3px', transition: 'width .6s ease', boxShadow: `0 0 6px ${color}55` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Recently completed tasks */}
                <div style={{ ...glass, padding: '22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>Recently Completed</h3>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', background: 'rgba(16,185,129,0.1)', padding: '3px 9px', borderRadius: '20px' }}>{completedTasks} done</span>
                    </div>
                    {recentCompleted.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px 0', color: '#334155' }}>
                            <Circle size={26} style={{ margin: '0 auto 8px', color: '#1e293b' }} />
                            <p style={{ fontSize: '12px', margin: 0 }}>Complete tasks to see them here</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {recentCompleted.map((t, i) => (
                                <div key={t._id || i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}>
                                    <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', textDecoration: 'line-through', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                                        {t.subject && <div style={{ fontSize: '10px', color: '#475569', marginTop: '1px' }}>{t.subject}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
