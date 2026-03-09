import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';

const VideoPlayerModal = ({ task, onProgressUpdate, onClose }) => {
    const [playing, setPlaying] = useState(false);
    const [secondsPlayed, setSecondsPlayed] = useState(0);
    const [error, setError] = useState(null);
    const playerRef = useRef(null);
    const timerRef = useRef(null);

    // Extract YouTube ID
    const getYouTubeID = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = getYouTubeID(task.videoUrl);

    useEffect(() => {
        if (playing) {
            timerRef.current = setInterval(() => {
                setSecondsPlayed(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [playing]);

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleSaveAndClose = () => {
        if (secondsPlayed > 0) {
            onProgressUpdate(Math.ceil(secondsPlayed / 60));
        }
        onClose();
    };

    if (!videoId) {
        return (
            <div style={modalOverlay} onClick={onClose}>
                <div style={modalContent} onClick={e => e.stopPropagation()}>
                    <div style={header}>
                        <h3 style={title}>Invalid Video URL</h3>
                        <button onClick={onClose} style={closeBtn}><X size={20} /></button>
                    </div>
                    <div style={errorContainer}>
                        <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
                        <p style={{ color: '#94a3b8' }}>This task doesn't have a valid YouTube link.</p>
                        <p style={{ color: '#475569', fontSize: '12px' }}>URL: {task.videoUrl || 'None'}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={modalOverlay} onClick={handleSaveAndClose}>
            <div style={modalContent} onClick={e => e.stopPropagation()}>
                <div style={{ ...header, flexDirection: window.innerWidth < 480 ? 'column' : 'row', alignItems: window.innerWidth < 480 ? 'flex-start' : 'center', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ ...title, fontSize: window.innerWidth < 480 ? '16px' : '20px' }}>{task.title}</h3>
                        <p style={subtitle}>{task.subject} • Educational Video</p>
                    </div>
                    <button onClick={handleSaveAndClose} style={{ ...closeBtn, alignSelf: window.innerWidth < 480 ? 'flex-end' : 'auto' }}><X size={20} /></button>
                </div>

                <div style={videoContainer}>
                    <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                    ></iframe>
                </div>

                <div style={{ ...footer, flexDirection: window.innerWidth < 640 ? 'column' : 'row', gap: '16px', alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={trackingInfo}>
                            <div style={timerLabel}>STUDYING FOR:</div>
                            <div style={timerValue}>{formatTime(secondsPlayed)}</div>
                        </div>

                        <div style={{ ...statusBadge, fontSize: '11px', padding: '4px 10px' }}>
                            <div style={activityDot} />
                            Active
                        </div>
                    </div>

                    <button onClick={handleSaveAndClose} style={{ ...saveBtn, width: '100%', justifyContent: 'center' }}>
                        <CheckCircle2 size={18} /> Finish & Log
                    </button>
                </div>
            </div>
        </div>
    );
};

// Styles
const modalOverlay = {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px'
};

const modalContent = {
    background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '24px', width: '100%', maxWidth: '900px',
    overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
};

const header = {
    padding: '24px', display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)',
    borderBottom: '1px solid rgba(255,255,255,0.05)'
};

const title = { fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0 };
const subtitle = { color: '#64748b', fontSize: '13px', margin: '4px 0 0' };
const closeBtn = { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' };

const videoContainer = { width: '100%', aspectRatio: '16/9', background: '#000' };

const footer = {
    padding: '20px 24px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)',
    borderTop: '1px solid rgba(255,255,255,0.05)'
};

const trackingInfo = { display: 'flex', flexDirection: 'column' };
const timerLabel = { fontSize: '10px', fontWeight: 700, color: '#475569', letterSpacing: '0.05em' };
const timerValue = { fontSize: '24px', fontWeight: 900, color: '#818cf8', fontFamily: 'monospace' };

const statusBadge = {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
    padding: '6px 14px', borderRadius: '30px', color: '#34d399', fontSize: '12px', fontWeight: 600
};

const activityDot = {
    width: '8px', height: '8px', borderRadius: '50%',
    background: '#10b981', boxShadow: '0 0 10px #10b981',
    animation: 'pulse 1.5s infinite'
};

const saveBtn = {
    background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff',
    border: 'none', borderRadius: '12px', padding: '12px 24px',
    fontSize: '14px', fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '8px',
    boxShadow: '0 4px 14px rgba(99,102,241,0.35)'
};

const errorContainer = {
    padding: '60px', textAlign: 'center', color: '#fff'
};

export default VideoPlayerModal;
