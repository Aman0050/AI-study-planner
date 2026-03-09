import React, { useState } from 'react';
import {
    User, Mail, Lock, Edit3, Save, X, Plus, CheckCircle2,
    Eye, EyeOff, Trash2, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { API_BASE_URL } from '../config';

const AccountManagement = ({ user, showToast, onUserUpdate }) => {
    const [editMode, setEditMode] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [saving, setSaving] = useState(false);

    // Add Account state
    const [showAddAccount, setShowAddAccount] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState('');
    const [addSuccess, setAddSuccess] = useState('');

    const getInitials = (n) => n ? n.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) : 'U';

    const handleSaveName = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            // Update localStorage
            const stored = JSON.parse(localStorage.getItem('studyai_user') || '{}');
            const updated = { ...stored, name: name.trim() };
            localStorage.setItem('studyai_user', JSON.stringify(updated));
            if (onUserUpdate) onUserUpdate(updated);
            showToast('Profile name updated! ✅');
            setEditMode(false);
        } catch {
            showToast('Failed to update name.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleAddAccount = async () => {
        setAddError('');
        setAddSuccess('');
        if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
            setAddError('Please fill in all fields.');
            return;
        }
        if (newPassword.length < 6) {
            setAddError('Password must be at least 6 characters.');
            return;
        }
        setAddLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName.trim(), email: newEmail.trim(), password: newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Registration failed');
            setAddSuccess(`Account for ${newEmail.trim()} created successfully! They can now log in.`);
            setNewName(''); setNewEmail(''); setNewPassword('');
            showToast('New account created! 🎉');
        } catch (err) {
            setAddError(err.message);
        } finally {
            setAddLoading(false);
        }
    };

    const card = {
        background: 'rgba(30,41,59,0.8)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '20px',
        padding: '20px md:28px',
        marginBottom: '20px',
    };

    const input = {
        width: '100%', background: 'rgba(15,23,42,0.6)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
        padding: '11px 14px', color: '#f1f5f9', fontSize: '14px',
        outline: 'none', boxSizing: 'border-box',
    };

    return (
        <div style={{ maxWidth: '680px' }}>
            {/* Page Header */}
            <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: window.innerWidth < 480 ? '22px' : '26px', fontWeight: 800, color: '#fff', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                    Account Management
                </h2>
                <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '14px' }}>
                    Manage your profile and registered accounts
                </p>
            </div>

            {/* Current Account Card */}
            <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <ShieldCheck size={18} style={{ color: '#818cf8' }} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Current Account
                    </span>
                </div>

                {/* Avatar row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 800, fontSize: '22px',
                        boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
                        flexShrink: 0,
                    }}>
                        {getInitials(user?.name)}
                    </div>
                    <div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>{user?.name}</div>
                        <div style={{ fontSize: '13px', color: '#818cf8', marginTop: '2px' }}>{user?.email}</div>
                        <div style={{
                            marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px',
                            background: 'rgba(16,185,129,0.1)', borderRadius: '20px', padding: '3px 10px',
                        }}>
                            <CheckCircle2 size={11} style={{ color: '#10b981' }} />
                            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>Active</span>
                        </div>
                    </div>
                </div>

                {/* Editable fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Name */}
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            <User size={12} /> Display Name
                        </label>
                        {editMode ? (
                            <input
                                style={input}
                                value={name}
                                onChange={e => setName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditMode(false); }}
                                autoFocus
                            />
                        ) : (
                            <div style={{ ...input, color: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                {user?.name}
                            </div>
                        )}
                    </div>

                    {/* Email (read-only) */}
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            <Mail size={12} /> Email Address
                        </label>
                        <div style={{ ...input, color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Mail size={14} style={{ color: '#475569', flexShrink: 0 }} />
                            {user?.email}
                            <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#475569', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '6px' }}>Read-only</span>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    {editMode ? (
                        <>
                            <button
                                onClick={handleSaveName}
                                disabled={saving}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '7px',
                                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                    color: '#fff', border: 'none', borderRadius: '10px',
                                    padding: '10px 20px', fontSize: '13px', fontWeight: 700,
                                    cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                                }}
                            >
                                <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
                            </button>
                            <button
                                onClick={() => { setEditMode(false); setName(user?.name || ''); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '7px',
                                    background: 'rgba(255,255,255,0.05)', color: '#94a3b8',
                                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
                                    padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                }}
                            >
                                <X size={14} /> Cancel
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setEditMode(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '7px',
                                background: 'rgba(99,102,241,0.1)', color: '#818cf8',
                                border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px',
                                padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                            }}
                        >
                            <Edit3 size={14} /> Edit Profile
                        </button>
                    )}
                </div>
            </div>

            {/* Add Account Card */}
            <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showAddAccount ? '20px' : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '38px', height: '38px', borderRadius: '10px',
                            background: 'rgba(99,102,241,0.1)', border: '1px dashed rgba(99,102,241,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Plus size={18} style={{ color: '#818cf8' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>Add Another Account</div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Register a new user on this app</div>
                        </div>
                    </div>
                    <button
                        onClick={() => { setShowAddAccount(v => !v); setAddError(''); setAddSuccess(''); }}
                        style={{
                            background: showAddAccount ? 'rgba(239,68,68,0.08)' : 'rgba(99,102,241,0.1)',
                            color: showAddAccount ? '#f87171' : '#818cf8',
                            border: `1px solid ${showAddAccount ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)'}`,
                            borderRadius: '10px', padding: '8px 14px',
                            fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '5px',
                        }}
                    >
                        {showAddAccount ? <><X size={13} /> Cancel</> : <><Plus size={13} /> Add Account</>}
                    </button>
                </div>

                {showAddAccount && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {/* Name */}
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                <User size={12} /> Full Name
                            </label>
                            <input style={input} placeholder="e.g. Jane Smith" value={newName} onChange={e => setNewName(e.target.value)} />
                        </div>
                        {/* Email */}
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                <Mail size={12} /> Email Address
                            </label>
                            <input style={input} type="email" placeholder="jane@example.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                        </div>
                        {/* Password */}
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                <Lock size={12} /> Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    style={{ ...input, paddingRight: '42px' }}
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="Min 6 characters"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                />
                                <button
                                    onClick={() => setShowPass(v => !v)}
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}
                                >
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Error / Success */}
                        {addError && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px' }}>
                                <AlertTriangle size={14} style={{ color: '#f87171', flexShrink: 0 }} />
                                <span style={{ fontSize: '13px', color: '#fca5a5' }}>{addError}</span>
                            </div>
                        )}
                        {addSuccess && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px' }}>
                                <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                                <span style={{ fontSize: '13px', color: '#6ee7b7' }}>{addSuccess}</span>
                            </div>
                        )}

                        <button
                            onClick={handleAddAccount}
                            disabled={addLoading}
                            style={{
                                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                color: '#fff', border: 'none', borderRadius: '10px',
                                padding: '12px', fontSize: '14px', fontWeight: 700,
                                cursor: addLoading ? 'not-allowed' : 'pointer',
                                opacity: addLoading ? 0.7 : 1,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            }}
                        >
                            <Plus size={16} />
                            {addLoading ? 'Creating Account…' : 'Create Account'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountManagement;
