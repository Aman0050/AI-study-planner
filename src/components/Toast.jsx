import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed bottom-8 right-8 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right-8 duration-300
            ${type === 'success'
                ? 'bg-[#064e3b] border-emerald-500/30 text-emerald-400'
                : 'bg-[#450a0a] border-rose-500/30 text-rose-400'}`}>
            {type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="font-bold text-sm">{message}</span>
            <button onClick={onClose} className="ml-4 hover:opacity-70 transition-opacity">
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast;
