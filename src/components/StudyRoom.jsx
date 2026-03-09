import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, RefreshCcw, BookOpen, Clock, Activity, Coffee, CheckCircle2, Music, Wind, Waves, CloudRain, Zap, Maximize2, Minimize2, Timer } from 'lucide-react';
import { taskService } from '../services/api';
import { notificationService } from '../services/notificationService';
import VideoPlayerModal from './VideoPlayerModal';

const glass = { background: 'rgba(13, 20, 38, 0.6)', border: '1px solid var(--border-color)', borderRadius: '32px', backdropFilter: 'blur(24px) saturate(180%)' };

const CircularProgress = ({ size, strokeWidth, percentage, color, isActive }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', transition: 'all 0.5s cubic-bezier(0.2, 1, 0.2, 1)' }}>
                {/* Background Circle */}
                <circle
                    stroke="rgba(255,255,255,0.03)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                {/* Progress Circle */}
                <circle
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 1s linear, stroke 0.3s', filter: isActive ? `drop-shadow(0 0 16px ${color})` : 'none' }}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Inner Glow */}
                <div style={{ position: 'absolute', width: size * 0.75, height: size * 0.75, background: isActive ? `radial-gradient(circle, ${color}15 0%, transparent 65%)` : 'transparent', borderRadius: '50%', zIndex: 0, filter: 'blur(10px)' }} />
            </div>
        </div>
    );
};

const TaskRow = ({ task, onToggle, onPlay }) => {
    const [hover, setHover] = useState(false);
    return (
        <div
            onClick={() => onToggle(task._id, !task.completed)}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '16px', background: hover ? 'rgba(0, 245, 255, 0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${hover ? 'rgba(0, 245, 255, 0.2)' : 'rgba(255,255,255,0.04)'}`, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.2, 1, 0.2, 1)', marginBottom: '10px' }}
        >
            <div style={{ width: '22px', height: '22px', borderRadius: '8px', border: `2px solid ${task.completed ? 'var(--primary)' : 'rgba(255,255,255,0.15)'}`, background: task.completed ? 'rgba(0,245,255,0.1)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s', boxShadow: task.completed ? '0 0 10px var(--primary-glow)' : 'none' }}>
                {task.completed && <CheckCircle2 size={12} style={{ color: 'var(--primary)' }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: task.completed ? 'var(--text-muted)' : '#fff', textDecoration: task.completed ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.01em' }}>{task.title}</div>
                {task.subject && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{task.subject}</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {task.videoUrl && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onPlay(task); }}
                        style={{ background: 'rgba(0, 245, 255, 0.1)', border: '1px solid rgba(0, 245, 255, 0.2)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '11px', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 245, 255, 0.15)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0, 245, 255, 0.1)'}
                    >
                        <Play size={12} fill="currentColor" /> Watch
                    </button>
                )}
            </div>
        </div>
    );
};

const StudyRoom = ({ showToast }) => {
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [sessionGoal, setSessionGoal] = useState('Deep focus work');

    // Immersive State
    const [timerMode, setTimerMode] = useState('stopwatch'); // 'stopwatch' or 'pomodoro'
    const [pomoPhase, setPomoPhase] = useState('work'); // 'work' or 'break'
    const [isZenMode, setIsZenMode] = useState(false);
    const [activeAmbient, setActiveAmbient] = useState(null); // 'rain', 'waves', 'wind', 'lofi'
    const audioRef = useRef(null);

    // Timer state
    const [time, setTime] = useState(0); // in seconds
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef(null);

    const [tasks, setTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [playingTask, setPlayingTask] = useState(null); // Optional: handles video modal

    // Fetch tasks and load subjects
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const data = await taskService.getAll();
                setTasks(data.filter(t => !t.completed).slice(0, 10));
            } catch (err) {
                console.error("Failed to load tasks", err);
            } finally {
                setLoadingTasks(false);
            }
        };
        fetchTasks();

        try {
            const stored = localStorage.getItem('studyai_subjects');
            if (stored) {
                const parsed = JSON.parse(stored);
                setSubjects(parsed);
                if (parsed.length > 0) setSelectedSubject(parsed[0].name);
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    const toggleTask = async (id, completed) => {
        setTasks(tasks.map(t => t._id === id ? { ...t, completed } : t));
        try { await taskService.update(id, { completed }); }
        catch (e) { console.error('Toggle failed', e); }
    };

    // Timer logic
    useEffect(() => {
        if (isActive && !isPaused) {
            timerRef.current = setInterval(() => {
                if (timerMode === 'stopwatch') {
                    setTime((time) => time + 1);
                } else {
                    setTime((time) => {
                        if (time <= 0) {
                            handlePhaseComplete();
                            return 0;
                        }
                        return time - 1;
                    });
                }
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isActive, isPaused, timerMode]);

    const handlePhaseComplete = () => {
        setIsActive(false);
        if (pomoPhase === 'work') {
            showToast("Focus session complete! Take a breather. ☕", "success");
            notificationService.notifyCompletion(selectedSubject || 'your focus session');
            setPomoPhase('break');
            setTime(5 * 60); // 5 min break
        } else {
            showToast("Break over. Let's get back to it! 🚀", "success");
            setPomoPhase('work');
            setTime(25 * 60); // 25 min work
        }
    };

    const toggleMode = (mode) => {
        if (isActive) {
            if (!window.confirm("Switching modes will reset your current progress. Continue?")) return;
        }
        setTimerMode(mode);
        setIsActive(false);
        setIsPaused(false);
        if (mode === 'stopwatch') {
            setTime(0);
        } else {
            setPomoPhase('work');
            setTime(25 * 60);
        }
    };

    const toggleAmbient = (type) => {
        if (activeAmbient === type) {
            setActiveAmbient(null);
            if (audioRef.current) audioRef.current.pause();
        } else {
            setActiveAmbient(type);
            const sounds = {
                rain: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                waves: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
                wind: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
                lofi: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
            };
            if (audioRef.current) {
                audioRef.current.src = sounds[type];
                audioRef.current.loop = true;
                audioRef.current.play().catch(e => console.error("Audio play failed", e));
            }
        }
    };

    const handleStart = () => {
        setIsActive(true);
        setIsPaused(false);
    };

    const handlePause = () => {
        setIsPaused(!isPaused);
    };

    const handleReset = () => {
        setIsActive(false);
        setIsPaused(false);
        if (timerMode === 'stopwatch') {
            setTime(0);
        } else {
            setTime(pomoPhase === 'work' ? 25 * 60 : 5 * 60);
        }
    };

    const handleEndSession = () => {
        if (time < 60) {
            showToast("Keep going! Sessions under 1 minute aren't logged.", "error");
            handleReset();
            return;
        }

        const minutes = Math.floor(time / 60);

        try {
            const sessions = JSON.parse(localStorage.getItem('studyai_sessions') || '[]');
            const newSession = {
                title: `Focus Room: ${sessionGoal}`,
                subjectName: selectedSubject || 'General',
                duration: minutes,
                date: new Date().toISOString(),
                completed: true,
                fromStudyRoom: true
            };
            const updatedSessions = [newSession, ...sessions];
            localStorage.setItem('studyai_sessions', JSON.stringify(updatedSessions));

            if (selectedSubject) {
                let storedSubjects = JSON.parse(localStorage.getItem('studyai_subjects') || '[]');
                const updatedSubjects = storedSubjects.map(s => {
                    if (s.name === selectedSubject) {
                        return { ...s, hoursStudied: (s.hoursStudied || 0) + (minutes / 60) };
                    }
                    return s;
                });
                localStorage.setItem('studyai_subjects', JSON.stringify(updatedSubjects));
            }

            showToast(`Brilliant! You've mastered ${minutes} minutes of focus. 🧠`);
            handleReset();

        } catch (err) {
            console.error("Error logging session:", err);
            showToast("Couldn't save session data.", "error");
        }
    };

    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return [
            hours > 0 ? String(hours).padStart(2, '0') : null,
            String(minutes).padStart(2, '0'),
            String(seconds).padStart(2, '0')
        ].filter(Boolean).join(':');
    };

    const percentage = timerMode === 'stopwatch' ? ((time % 60) / 60) * 100 : ((time / (pomoPhase === 'work' ? 25 * 60 : 5 * 60)) * 100);
    const progressColor = pomoPhase === 'break' ? '#10b981' : '#6366f1';

    if (isZenMode) {
        return (
            <div style={{ position: 'fixed', inset: 0, backgroundColor: '#0b0f1a', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.8s ease-out' }}>
                <audio ref={audioRef} />
                <button
                    onClick={() => setIsZenMode(false)}
                    style={{ position: 'absolute', top: '30px', right: '30px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', padding: '14px', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.3s', zIndex: 10 }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                >
                    <Minimize2 size={24} />
                </button>

                <div style={{ textAlign: 'center', maxWidth: '640px', width: '90%', padding: '40px' }} className="glass-card">
                    <div style={{ marginBottom: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                        <CircularProgress size={window.innerWidth < 480 ? 280 : 380} strokeWidth={window.innerWidth < 480 ? 10 : 14} percentage={percentage} color={progressColor} isActive={isActive && !isPaused} />
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                            <div style={{ fontSize: window.innerWidth < 480 ? '56px' : '88px', fontWeight: 900, color: '#fff', letterSpacing: '-3px', textShadow: isActive && !isPaused ? `0 0 50px ${progressColor}44` : 'none', fontFamily: "'Outfit', sans-serif" }}>
                                {formatTime(time)}
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: progressColor, textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: '8px', opacity: 0.8 }}>
                                {timerMode === 'pomodoro' ? `${pomoPhase}` : 'deep focus'}
                            </div>
                        </div>
                    </div>

                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', marginBottom: '12px', fontFamily: "'Outfit', sans-serif" }}>{sessionGoal}</h2>
                    <p style={{ color: '#475569', fontSize: '16px', fontStyle: 'italic', margin: '0 auto', maxWidth: '440px', fontWeight: 500, lineHeight: 1.6 }}>"The only way to do great work is to love what you do. Focus on the process."</p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', marginTop: '60px' }}>
                        <button onClick={handlePause} style={{ flex: '1 1 180px', maxWidth: '220px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '16px 32px', borderRadius: '18px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
                            {isPaused ? 'RESUME FLOW' : 'PAUSE SESSION'}
                        </button>
                        <button onClick={handleEndSession} style={{ flex: '1 1 180px', maxWidth: '220px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#f87171', padding: '16px 32px', borderRadius: '18px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}>
                            END & LOG
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '60px' }} className="page-transition">
            <audio ref={audioRef} />

            {/* Header Section */}
            <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '24px' }}>
                <div style={{ textAlign: 'left', flex: '1 1 340px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(99,102,241,0.3)' }}>
                            <Coffee size={24} />
                        </div>
                        <h1 className="gradient-text" style={{ margin: 0 }}>Focus Studio</h1>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '16px', margin: 0, fontWeight: 500 }}>
                        Curate your ideal atmosphere and master your productive hours.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => setIsZenMode(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', color: '#94a3b8', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    >
                        <Maximize2 size={16} /> ENTER ZEN MODE
                    </button>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '32px',
                alignItems: 'start'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* Main Timer Display Area */}
                    <div style={{ padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }} className="glass-card glow-edge">
                        <div style={{ position: 'absolute', top: '30px', left: '30px', display: 'flex', background: 'rgba(0,0,0,0.4)', padding: '6px', borderRadius: '20px', border: '1px solid var(--border-color)', backdropFilter: 'blur(10px)' }}>
                            <button
                                onClick={() => toggleMode('stopwatch')}
                                style={{ padding: '10px 22px', borderRadius: '14px', border: 'none', background: timerMode === 'stopwatch' ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'transparent', color: timerMode === 'stopwatch' ? '#fff' : 'var(--text-muted)', fontSize: '13px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.2, 1, 0.2, 1)', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: timerMode === 'stopwatch' ? '0 4px 15px var(--primary-glow)' : 'none' }}
                            >
                                <Timer size={16} /> Stopwatch
                            </button>
                            <button
                                onClick={() => toggleMode('pomodoro')}
                                style={{ padding: '10px 22px', borderRadius: '14px', border: 'none', background: timerMode === 'pomodoro' ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'transparent', color: timerMode === 'pomodoro' ? '#fff' : 'var(--text-muted)', fontSize: '13px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.2, 1, 0.2, 1)', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: timerMode === 'pomodoro' ? '0 4px 15px var(--primary-glow)' : 'none' }}
                            >
                                <Zap size={16} /> Pomodoro
                            </button>
                        </div>

                        <div style={{ position: 'relative', marginBottom: '50px', display: 'flex', justifyContent: 'center' }}>
                            <CircularProgress size={window.innerWidth < 480 ? 240 : 320} strokeWidth={12} percentage={percentage} color={progressColor} isActive={isActive && !isPaused} />
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                <div style={{ fontSize: window.innerWidth < 480 ? '56px' : '72px', fontWeight: 900, color: isActive ? (isPaused ? 'var(--text-muted)' : '#fff') : 'rgba(255,255,255,0.05)', letterSpacing: '-3px', fontVariantNumeric: 'tabular-nums', fontFamily: "'Outfit', sans-serif" }}>
                                    {formatTime(time)}
                                </div>
                                {timerMode === 'pomodoro' && (
                                    <div style={{ fontSize: '12px', fontWeight: 900, color: progressColor, textTransform: 'uppercase', letterSpacing: '0.25em', marginTop: '-6px', opacity: 0.9 }}>
                                        {pomoPhase} PHASE
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '20px', width: '100%', maxWidth: '440px' }}>
                            {!isActive ? (
                                <button
                                    onClick={handleStart}
                                    className="btn-primary"
                                    style={{ flex: 1, padding: '22px', fontSize: '16px', borderRadius: '20px', boxShadow: '0 15px 40px var(--primary-glow)', justifyContent: 'center', letterSpacing: '0.05em' }}
                                >
                                    <Play size={22} fill="currentColor" /> INITIATE FLOW
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handlePause}
                                        style={{ width: '84px', background: 'rgba(255,255,255,0.03)', color: '#fff', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                    >
                                        {isPaused ? <Play size={28} /> : <Pause size={28} />}
                                    </button>
                                    <button
                                        onClick={handleEndSession}
                                        style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '20px', borderRadius: '20px', fontWeight: 900, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', transition: 'all 0.3s', letterSpacing: '0.05em' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                    >
                                        <Square size={20} fill="currentColor" /> COMPLETE MISSION
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        style={{ width: '68px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
                                        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <RefreshCcw size={22} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Atmospheric Controls */}
                    <div style={{ padding: '28px' }} className="glass-card">
                        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Music size={20} style={{ color: '#818cf8' }} /> Environment Soundscape
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '16px' }}>
                            {[
                                { id: 'rain', icon: CloudRain, label: 'Rain', color: '#60a5fa' },
                                { id: 'waves', icon: Waves, label: 'Ocean', color: '#2dd4bf' },
                                { id: 'wind', icon: Wind, label: 'Breeze', color: '#4ade80' },
                                { id: 'lofi', icon: Coffee, label: 'Lo-fi', color: '#fbbf24' }
                            ].map(sound => (
                                <button
                                    key={sound.id}
                                    onClick={() => toggleAmbient(sound.id)}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '20px 10px',
                                        borderRadius: '20px', background: activeAmbient === sound.id ? `${sound.color}18` : 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${activeAmbient === sound.id ? `${sound.color}44` : 'rgba(255,255,255,0.04)'}`,
                                        color: activeAmbient === sound.id ? sound.color : '#475569', cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                    onMouseEnter={e => !activeAmbient === sound.id && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                                    onMouseLeave={e => !activeAmbient === sound.id && (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                                >
                                    <sound.icon size={24} strokeWidth={activeAmbient === sound.id ? 2.5 : 2} />
                                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{sound.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {/* Settings Panel */}
                    <div style={{ padding: '28px' }} className="glass-card">
                        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Timer size={20} style={{ color: '#818cf8' }} /> Session Protocol
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.1em' }}>Select Subject Module</label>
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    disabled={isActive}
                                    style={{ width: '100%', padding: '14px', borderRadius: '14px', background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', fontSize: '14px', outline: 'none', transition: 'all 0.2s', opacity: isActive ? 0.6 : 1, fontWeight: 600 }}
                                >
                                    <option value="">General Academic Focus</option>
                                    {subjects.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.1em' }}>Strategic Objective</label>
                                <input
                                    type="text"
                                    value={sessionGoal}
                                    onChange={(e) => setSessionGoal(e.target.value)}
                                    disabled={isActive}
                                    style={{ width: '100%', padding: '14px', borderRadius: '14px', background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', fontSize: '14px', outline: 'none', transition: 'all 0.2s', opacity: isActive ? 0.6 : 1, fontWeight: 600 }}
                                    placeholder="Define your mission..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Task List */}
                    <div style={{ padding: '28px', flex: 1, display: 'flex', flexDirection: 'column' }} className="glass-card">
                        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Activity size={20} style={{ color: '#818cf8' }} /> Tactical Roadmap
                        </h3>
                        <div style={{ flex: 1, overflowY: 'auto', maxHeight: '420px', paddingRight: '12px' }}>
                            {loadingTasks ? (
                                <div style={{ color: '#475569', textAlign: 'center', fontSize: '14px', padding: '60px 0', fontWeight: 600 }}>SYNCHRONIZING DATA...</div>
                            ) : tasks.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                    <p style={{ color: '#334155', fontSize: '14px', margin: 0, fontWeight: 600 }}>NO ACTIVE OBJECTIVES DEFINED.</p>
                                </div>
                            ) : (
                                tasks.map(task => <TaskRow key={task._id} task={task} onToggle={toggleTask} onPlay={(t) => setPlayingTask(t)} />)
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {playingTask && (
                <VideoPlayerModal
                    videoUrl={playingTask.videoUrl}
                    taskTitle={playingTask.title}
                    onClose={() => setPlayingTask(null)}
                />
            )}
        </div>
    );
};

export default StudyRoom;
