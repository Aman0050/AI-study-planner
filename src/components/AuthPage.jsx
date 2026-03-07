import React, { useState } from 'react';
import { BrainCircuit, Mail, Lock, Eye, EyeOff, Sparkles, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

const API = `${API_BASE_URL}/api`;

const AuthPage = ({ onAuthSuccess }) => {
    const [mode, setMode] = useState('login'); // 'login' | 'signup'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = mode === 'login' ? `${API}/auth/login` : `${API}/auth/register`;
            const body = mode === 'login'
                ? { email, password }
                : { name, email, password };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || 'Something went wrong.');
                return;
            }

            // Save token and user to localStorage
            localStorage.setItem('studyai_token', data.token);
            localStorage.setItem('studyai_user', JSON.stringify(data.user));
            onAuthSuccess(data.user);
        } catch (err) {
            setError('Cannot connect to server. Please make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', sans-serif",
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Decorative blobs */}
            <div style={{
                position: 'absolute', top: '-15%', left: '-10%',
                width: '500px', height: '500px',
                background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: '-15%', right: '-10%',
                width: '500px', height: '500px',
                background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none',
            }} />

            <div style={{
                width: '100%', maxWidth: '440px',
                margin: '0 24px',
                background: 'rgba(30, 41, 59, 0.7)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '24px',
                padding: '48px 40px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            }}>
                {/* Logo + Title */}
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <div style={{
                        display: 'inline-flex', padding: '14px',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        borderRadius: '16px',
                        marginBottom: '16px',
                        boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
                    }}>
                        <BrainCircuit color="white" size={28} />
                    </div>
                    <h1 style={{
                        fontSize: '28px', fontWeight: 800,
                        color: '#f8fafc', letterSpacing: '-0.5px',
                        fontFamily: "'Outfit', sans-serif",
                        margin: 0,
                    }}>StudyAI</h1>
                    <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '6px', marginBottom: 0 }}>
                        {mode === 'login' ? 'Welcome back! Let\'s get studying.' : 'Start your learning journey today.'}
                    </p>
                </div>

                {/* Tab switcher */}
                <div style={{
                    display: 'flex',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '12px',
                    padding: '4px',
                    marginBottom: '28px',
                    border: '1px solid rgba(255,255,255,0.06)',
                }}>
                    {['login', 'signup'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { setMode(tab); setError(''); }}
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '9px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '14px',
                                transition: 'all 0.2s',
                                background: mode === tab
                                    ? 'linear-gradient(135deg, #6366f1, #a855f7)'
                                    : 'transparent',
                                color: mode === tab ? '#fff' : '#64748b',
                                boxShadow: mode === tab ? '0 4px 12px rgba(99,102,241,0.35)' : 'none',
                            }}
                        >
                            {tab === 'login' ? 'Log In' : 'Sign Up'}
                        </button>
                    ))}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {mode === 'signup' && (
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>
                                Full Name
                            </label>
                            <input
                                type="text"
                                placeholder="Aman Naeem"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required={mode === 'signup'}
                                style={inputStyle}
                            />
                        </div>
                    )}
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>
                            Email Address
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                            <input
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ ...inputStyle, paddingLeft: '42px' }}
                            />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ ...inputStyle, paddingLeft: '42px', paddingRight: '44px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: '14px', top: '50%',
                                    transform: 'translateY(-50%)', background: 'none',
                                    border: 'none', cursor: 'pointer', color: '#64748b', padding: 0,
                                }}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            padding: '12px 16px',
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.25)',
                            borderRadius: '10px',
                            color: '#f87171',
                            fontSize: '13px',
                            fontWeight: 500,
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '12px',
                            border: 'none',
                            background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #a855f7)',
                            color: '#fff',
                            fontSize: '15px',
                            fontWeight: 700,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
                            marginTop: '4px',
                            transition: 'all 0.2s',
                        }}
                    >
                        {loading ? (
                            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                            <Sparkles size={18} />
                        )}
                        {loading ? 'Please wait...' : (mode === 'login' ? 'Log In to StudyAI' : 'Create My Account')}
                    </button>
                </form>

                <p style={{ textAlign: 'center', color: '#475569', fontSize: '13px', marginTop: '24px', marginBottom: 0 }}>
                    {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button
                        onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                        style={{ background: 'none', border: 'none', color: '#818cf8', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
                    >
                        {mode === 'login' ? 'Sign Up Free' : 'Log In'}
                    </button>
                </p>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#f8fafc',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
};

export default AuthPage;
