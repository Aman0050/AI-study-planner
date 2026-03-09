import React, { useState, useEffect } from 'react';
import {
    CheckCircle2, Circle, Search, Filter,
    Calendar, Play, Trash2, BookOpen, Clock,
    LayoutList, MoreVertical, ChevronRight
} from 'lucide-react';
import { taskService } from '../services/api';
import VideoPlayerModal from './VideoPlayerModal';

const glass = {
    background: 'rgba(30, 41, 59, 0.7)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px'
};

const AllTasks = ({ showToast }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSubject, setFilterSubject] = useState('All');
    const [playingTask, setPlayingTask] = useState(null);
    const [subjects, setSubjects] = useState([]);

    useEffect(() => {
        fetchTasks();
        const storedSubjects = localStorage.getItem('studyai_subjects');
        if (storedSubjects) {
            setSubjects(JSON.parse(storedSubjects));
        }
    }, []);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const data = await taskService.getAll();
            setTasks(data);
        } catch (error) {
            showToast('Failed to fetch tasks', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (id, completed) => {
        // Optimistic update
        setTasks(prev => prev.map(t => t._id === id ? { ...t, completed } : t));
        try {
            await taskService.update(id, { completed });
            showToast(completed ? 'Task marked as done! ✨' : 'Task re-opened', 'success');
        } catch (error) {
            showToast('Update failed', 'error');
            fetchTasks();
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        try {
            await taskService.delete(id);
            setTasks(prev => prev.filter(t => t._id !== id));
            showToast('Task deleted successfully', 'success');
        } catch (error) {
            showToast('Delete failed', 'error');
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.subject && task.subject.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesSubject = filterSubject === 'All' || task.subject === filterSubject;
        return matchesSearch && matchesSubject;
    });

    const ongoingTasks = filteredTasks.filter(t => !t.completed).sort((a, b) => new Date(a.date) - new Date(b.date));
    const completedTasks = filteredTasks.filter(t => t.completed).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    const uniqueSubjects = ['All', ...new Set(tasks.map(t => t.subject).filter(Boolean))];

    const TaskCard = ({ task }) => (
        <div style={{
            ...glass,
            padding: '16px 20px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: task.completed ? 0.7 : 1,
            transform: 'translateZ(0)',
            cursor: 'default'
        }}
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.85)';
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.005)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.7)';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
            }}
        >
            <button
                onClick={() => handleToggle(task._id, !task.completed)}
                style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    color: task.completed ? '#10b981' : '#64748b', transition: 'all 0.2s'
                }}
            >
                {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
            </button>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: '16px', fontWeight: 600, color: task.completed ? '#94a3b8' : '#f8fafc',
                    textDecoration: task.completed ? 'line-through' : 'none',
                    marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                    {task.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {task.subject && (
                        <div style={{
                            fontSize: '11px', fontWeight: 700, color: '#818cf8',
                            background: 'rgba(99, 102, 241, 0.1)', padding: '2px 8px', borderRadius: '6px',
                            textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>
                            {task.subject}
                        </div>
                    )}
                    {task.date && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#475569' }}>
                            <Calendar size={12} />
                            {new Date(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: 'auto' }}>
                {task.videoUrl && (
                    <button
                        onClick={() => setPlayingTask(task)}
                        style={{
                            background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: 'none',
                            borderRadius: '8px', padding: '8px', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
                        title="Watch Session Video"
                    >
                        <Play size={16} fill="currentColor" />
                    </button>
                )}
                <button
                    onClick={() => handleDelete(task._id)}
                    style={{
                        background: 'transparent', color: '#334155', border: 'none',
                        borderRadius: '8px', padding: '8px', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = '#334155'}
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out', paddingBottom: '60px' }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ flex: '1 1 300px' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                        Task Repository
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '15px', marginTop: '6px' }}>
                        Manage all your study missions and track your completions.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', width: '100%', maxWidth: '400px' }}>
                    <div style={{ position: 'relative', flex: '1 1 180px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{
                                background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '12px', padding: '10px 12px 10px 40px', color: '#fff', fontSize: '14px',
                                outline: 'none', width: '100%', transition: 'all 0.2s'
                            }}
                            onFocus={e => e.target.style.borderColor = 'rgba(99, 102, 241, 0.4)'}
                        />
                    </div>

                    <div style={{ position: 'relative', flex: '1 1 140px' }}>
                        <Filter size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                        <select
                            value={filterSubject}
                            onChange={e => setFilterSubject(e.target.value)}
                            style={{
                                background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '12px', padding: '10px 12px 10px 40px', color: '#fff', fontSize: '14px',
                                appearance: 'none', outline: 'none', cursor: 'pointer', width: '100%'
                            }}
                        >
                            {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <div style={{
                        width: '40px', height: '40px', border: '3px solid rgba(99, 102, 241, 0.2)',
                        borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }} />
                    <p style={{ color: '#475569', fontSize: '14px' }}>Syncing your mission logs...</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }}>
                    {/* Ongoing Tasks Section */}
                    <section>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <div style={{ padding: '6px', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', borderRadius: '8px' }}>
                                <LayoutList size={18} />
                            </div>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>Strategic Missions</h2>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: '20px' }}>
                                {ongoingTasks.length} Pending
                            </span>
                        </div>

                        {ongoingTasks.length === 0 ? (
                            <div style={{ ...glass, padding: '40px', textAlign: 'center', color: '#475569' }}>
                                <BookOpen size={40} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
                                <p style={{ fontSize: '15px' }}>No pending tasks found. Time to generate a new plan!</p>
                            </div>
                        ) : (
                            <div>
                                {ongoingTasks.map(task => <TaskCard key={task._id} task={task} />)}
                            </div>
                        )}
                    </section>

                    {/* Completed Section */}
                    {completedTasks.length > 0 && (
                        <section>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                <div style={{ padding: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px' }}>
                                    <CheckCircle2 size={18} />
                                </div>
                                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>Completed Vault</h2>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: '20px' }}>
                                    {completedTasks.length} Achieved
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                                {completedTasks.map(task => <TaskCard key={task._id} task={task} />)}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {playingTask && (
                <VideoPlayerModal
                    videoUrl={playingTask.videoUrl}
                    taskTitle={playingTask.title}
                    onClose={() => setPlayingTask(null)}
                />
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default AllTasks;
