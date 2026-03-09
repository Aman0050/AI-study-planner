import React, { useState, useEffect } from 'react';
import { BrainCircuit, Mail, Lock, Eye, EyeOff, Sparkles, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

const API = `${API_BASE_URL}/api`;

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com";

const AuthPage = ({ onAuthSuccess }) => {
    const [mode, setMode] = useState('login'); // 'login' | 'signup'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        /* global google */
        if (typeof google !== 'undefined') {
            google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleLogin
            });

            google.accounts.id.renderButton(
                document.getElementById("google-signin-button"),
                { theme: "outline", size: "large", width: 360, text: "continue_with" }
            );
        }
    }, [mode]);

    const handleGoogleLogin = async (response) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API}/auth/google-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken: response.credential }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.message || 'Google Login failed.');
                return;
            }

            localStorage.setItem('studyai_token', data.token);
            localStorage.setItem('studyai_user', JSON.stringify(data.user));
            onAuthSuccess(data.user);
        } catch (err) {
            setError('Auth failed. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

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
            background: 'var(--bg-dark)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', sans-serif",
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Ultra-Premium Animated Background Blobs */}
            <div style={{
                position: 'absolute', top: '-15%', left: '-10%',
                width: '700px', height: '700px',
                background: 'radial-gradient(circle, rgba(0, 245, 255, 0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none',
                animation: 'float 25s infinite alternate ease-in-out',
            }} />
            <div style={{
                position: 'absolute', bottom: '-15%', right: '-10%',
                width: '700px', height: '700px',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none',
                animation: 'float 30s infinite alternate-reverse ease-in-out',
            }} />
            <div style={{
                position: 'absolute', top: '30%', right: '10%',
                width: '400px', height: '400px',
                background: 'radial-gradient(circle, rgba(255, 0, 255, 0.08) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none',
                animation: 'float 18s infinite alternate ease-in-out',
            }} />

            <div style={{
                width: '100%',
                maxWidth: '480px',
                padding: '0 1.5rem',
                zIndex: 1,
            }} className="page-transition">
                <div style={{
                    background: 'rgba(13, 20, 38, 0.6)',
                    backdropFilter: 'blur(32px) saturate(180%)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '32px',
                    padding: '56px 48px',
                    boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
                }} className="glow-edge">
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <div style={{
                            display: 'inline-flex', padding: '18px',
                            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                            borderRadius: '22px',
                            marginBottom: '24px',
                            boxShadow: '0 15px 40px var(--primary-glow)',
                            animation: 'bounceIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            position: 'relative'
                        }}>
                            <div style={{ position: 'absolute', inset: -4, background: 'var(--primary)', borderRadius: '26px', opacity: 0.2, filter: 'blur(12px)', zIndex: -1 }}></div>
                            <BrainCircuit color="white" size={36} />
                        </div>
                        <h1 style={{ fontSize: '42px', fontWeight: 900, marginBottom: '10px', background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.05em' }}>StudyAI</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '16px', fontWeight: 500, margin: 0, letterSpacing: '0.01em' }}>
                            {mode === 'login' ? 'Initiate focus sequence.' : 'Create your neural profile.'}
                        </p>
                    </div>

                    <div style={{
                        display: 'flex',
                        background: 'rgba(15, 23, 42, 0.5)',
                        padding: '6px',
                        borderRadius: '16px',
                        marginBottom: '36px',
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                        <button
                            onClick={() => { setMode('login'); setError(''); }}
                            style={{
                                flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
                                background: mode === 'login' ? 'rgba(99,102,241,0.15)' : 'transparent',
                                color: mode === 'login' ? '#818cf8' : '#64748b',
                                fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s',
                            }}
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => { setMode('signup'); setError(''); }}
                            style={{
                                flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
                                background: mode === 'signup' ? 'rgba(99,102,241,0.15)' : 'transparent',
                                color: mode === 'signup' ? '#818cf8' : '#64748b',
                                fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s',
                            }}
                        >
                            Sign Up
                        </button>
                    </div>

                    {mode === 'signup' ? (
                        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                            <div style={{
                                padding: '32px 24px',
                                background: 'rgba(99,102,241,0.05)',
                                borderRadius: '24px',
                                border: '1px solid rgba(99,102,241,0.15)',
                                marginBottom: '24px',
                                transition: 'transform 0.3s ease',
                            }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                <Sparkles size={36} color="#818cf8" style={{ marginBottom: '16px' }} />
                                <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '0 0 10px' }}>Verified Student Only</h3>
                                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                                    To ensure the highest platform integrity, we exclusively use <b style={{ color: '#818cf8' }}>Verified Gmail</b> for new accounts.
                                </p>
                            </div>
                            <div id="google-signin-button" style={{ display: 'flex', justifyContent: 'center' }}></div>
                        </div>
                    ) : (
                        <>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#94a3b8', marginBottom: '10px', paddingLeft: '4px' }}>
                                        Email Address
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                        <input
                                            type="email"
                                            placeholder="you@gmail.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            style={{ ...inputStyle, paddingLeft: '48px' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#94a3b8', marginBottom: '10px', paddingLeft: '4px' }}>
                                        Password
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            style={{ ...inputStyle, paddingLeft: '48px', paddingRight: '48px' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{
                                                position: 'absolute', right: '16px', top: '50%',
                                                transform: 'translateY(-50%)', background: 'none',
                                                border: 'none', cursor: 'pointer', color: '#64748b', padding: 0,
                                                display: 'flex'
                                            }}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div style={{
                                        padding: '14px 18px',
                                        background: 'rgba(239,68,68,0.08)',
                                        border: '1px solid rgba(239,68,68,0.2)',
                                        borderRadius: '12px',
                                        color: '#f87171',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        animation: 'shake 0.4s ease-in-out',
                                    }}>
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary"
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        fontSize: '16px',
                                        justifyContent: 'center',
                                        marginTop: '8px',
                                    }}
                                >
                                    {loading ? (
                                        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Sparkles size={20} />
                                            <span>{mode === 'login' ? 'Log In' : 'Sign Up'}</span>
                                        </div>
                                    )}
                                </button>
                            </form>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '28px 0 12px' }}>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Secure Auth</span>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                            </div>

                            <div id="google-signin-button" style={{ display: 'flex', justifyContent: 'center' }}></div>
                        </>
                    )}

                    <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', marginTop: '32px', marginBottom: 0 }}>
                        {mode === 'login' ? "New here?" : "Joined us before?"}{' '}
                        <button
                            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                            style={{ background: 'none', border: 'none', color: '#818cf8', fontWeight: 800, cursor: 'pointer', fontSize: '14px' }}
                            className="hover-underline"
                        >
                            {mode === 'login' ? 'Create Account' : 'Log In'}
                        </button>
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes float { 
                    0% { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(40px, 40px) scale(1.1); }
                }
                @keyframes bounceIn {
                    0% { opacity: 0; transform: scale(0.3); }
                    50% { opacity: 0.9; transform: scale(1.1); }
                    80% { opacity: 1; transform: scale(0.95); }
                    100% { opacity: 1; transform: scale(1); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-8px); }
                    75% { transform: translateX(8px); }
                }
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
