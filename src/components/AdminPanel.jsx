import React, { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle2, ShieldAlert, Trash2, Shield, ShieldOff, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config';

const glass = {
    background: 'rgba(30,41,59,0.75)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '20px',
    backdropFilter: 'blur(12px)'
};

const AdminPanel = ({ user, showToast }) => {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('studyai_token');
    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/admin/stats`, { headers }),
                fetch(`${API_BASE_URL}/api/admin/users`, { headers })
            ]);

            if (!statsRes.ok || !usersRes.ok) throw new Error('Not authorized or server error');

            setStats(await statsRes.json());
            setUsers(await usersRes.json());
        } catch (err) {
            showToast(err.message || 'Failed to load admin data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.isAdmin) loadData();
    }, [user]);

    const handleToggleAdmin = async (id, name, currentStatus) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}/role`, { method: 'PATCH', headers });
            if (!res.ok) throw new Error('Failed to update role');
            showToast(`${name} is now ${!currentStatus ? 'an Admin' : 'a regular user'} 🛡️`);
            loadData();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleDeleteUser = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, { method: 'DELETE', headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            showToast(`User ${name} deleted.`);
            loadData();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    if (!user?.isAdmin) {
        return (
            <div style={{ ...glass, padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '40px auto' }}>
                <ShieldAlert size={48} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: '0 0 10px' }}>Access Denied</h2>
                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6 }}>You do not have permission to view this page. If you are an admin, please try logging out and logging back in to refresh your token.</p>
            </div>
        );
    }

    return (
        <div style={{ fontFamily: "'Inter', sans-serif" }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg,#ef4444,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(239,68,68,0.3)' }}>
                        <ShieldAlert color="white" size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Admin Dashboard</h1>
                        <p style={{ color: '#64748b', margin: '3px 0 0', fontSize: '13px' }}>Manage users and view platform analytics</p>
                    </div>
                </div>
                <button onClick={loadData} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh Data
                </button>
            </div>

            {loading && !stats ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading admin data...</div>
            ) : (
                <>
                    {/* Stat Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        {[
                            { icon: Users, label: 'Total Users', value: stats?.totalUsers || 0, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
                            { icon: Shield, label: 'New Users (7d)', value: `+${stats?.newUsers || 0}`, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
                            { icon: FileText, label: 'Total Tasks', value: stats?.totalTasks || 0, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
                            { icon: CheckCircle2, label: 'Completed Tasks', value: stats?.completedTasks || 0, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
                        ].map(s => (
                            <div key={s.label} style={{ ...glass, padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <s.icon size={20} style={{ color: s.color }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{s.value}</div>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>{s.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Users Table */}
                    <div style={{ ...glass, padding: '24px', overflow: 'hidden' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: '0 0 16px' }}>Registered Users</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                        <th style={{ padding: '12px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>User</th>
                                        <th style={{ padding: '12px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>Email</th>
                                        <th style={{ padding: '12px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>Joined</th>
                                        <th style={{ padding: '12px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>Role</th>
                                        <th style={{ padding: '12px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '14px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 700 }}>
                                                    {u.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{u.name}</span>
                                            </td>
                                            <td style={{ padding: '14px 12px', fontSize: '13px', color: '#94a3b8' }}>{u.email}</td>
                                            <td style={{ padding: '14px 12px', fontSize: '13px', color: '#94a3b8' }}>
                                                {new Date(u.createdAt).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '14px 12px' }}>
                                                {u.isAdmin ? (
                                                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '4px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Shield size={10} /> Admin</span>
                                                ) : (
                                                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Users size={10} /> User</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                                    <button
                                                        onClick={() => handleToggleAdmin(u._id, u.name, u.isAdmin)}
                                                        title={u.isAdmin ? 'Remove Admin' : 'Make Admin'}
                                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: '#cbd5e1', display: 'flex', alignItems: 'center' }}
                                                    >
                                                        {u.isAdmin ? <ShieldOff size={14} /> : <Shield size={14} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(u._id, u.name)}
                                                        disabled={u.isAdmin}
                                                        title={u.isAdmin ? 'Cannot delete admins' : 'Delete user'}
                                                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', padding: '6px', cursor: u.isAdmin ? 'not-allowed' : 'pointer', color: u.isAdmin ? '#94a3b8' : '#ef4444', display: 'flex', alignItems: 'center', opacity: u.isAdmin ? 0.5 : 1 }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>No users found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminPanel;
