import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const glass = {
        background: type === 'success' ? 'rgba(6, 78, 59, 0.9)' : 'rgba(69, 10, 10, 0.9)',
        border: `1px solid ${type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
        borderRadius: '16px',
        backdropFilter: 'blur(12px)',
        color: type === 'success' ? '#34d399' : '#f87171',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: window.innerWidth < 640 ? '16px' : '32px',
            right: window.innerWidth < 640 ? '16px' : '32px',
            left: window.innerWidth < 640 ? '16px' : 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 24px',
            zIndex: 9999,
            animation: 'slideUp 0.3s ease-out',
            ...glass
        }}>
            {type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span style={{ fontWeight: 700, fontSize: '14px' }}>{message}</span>
            <button onClick={onClose} style={{ marginLeft: '12px', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.6, display: 'flex' }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
            >
                <X size={16} />
            </button>
            <style>{`
                @keyframes slideUp { 
                    from { transform: translateY(20px); opacity: 0; } 
                    to { transform: translateY(0); opacity: 1; } 
                }
            `}</style>
        </div>
    );
};

export default Toast;
