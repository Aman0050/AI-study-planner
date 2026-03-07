import React, { useState } from 'react';
import { BrainCircuit, Sparkles, Send, Loader2, BookOpen, Clock, Target, CheckCircle2, Plus } from 'lucide-react';
import { plannerService, taskService } from '../services/api';

const AIPlanner = ({ showToast }) => {
    const [loading, setLoading] = useState(false);
    const [goal, setGoal] = useState('');
    const [subject, setSubject] = useState('');
    const [duration, setDuration] = useState('1');
    const [generatedPlan, setGeneratedPlan] = useState(null);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        setSaved(false);
        try {
            const plan = await plannerService.generate({
                subject,
                goal,
                duration: parseInt(duration)
            });
            setGeneratedPlan(plan);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to generate study plan. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSavePlan = async () => {
        if (!generatedPlan) return;
        setSaving(true);
        try {
            for (const module of generatedPlan.modules) {
                await taskService.create({
                    title: module.name,
                    subject: subject,
                    time: module.time,
                    description: module.topics.join(', ')
                });
            }
            setSaved(true);
            showToast('Study plan saved to your dashboard!');
        } catch (err) {
            console.error(err);
            showToast('Failed to save some modules. Please try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ maxWidth: '56rem', margin: '0 auto' }} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-4">
                <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-2">
                    <BrainCircuit size={32} />
                </div>
                <h1 className="text-4xl font-bold text-white tracking-tight">AI Study Architect</h1>
                <p className="text-slate-400 max-w-lg mx-auto">Tell us what you want to learn, and our AI will build a personalized roadmap just for you.</p>
            </div>

            <div className="glass-card p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 text-indigo-500/10 pointer-events-none">
                    <Sparkles size={120} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative" style={{ zIndex: 10 }}>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>
                                <BookOpen size={16} style={{ color: '#818cf8' }} />
                                What subject are you studying?
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Quantum Computing, React.js, Organic Chemistry"
                                style={{
                                    width: '100%',
                                    backgroundColor: 'rgba(30, 41, 59, 0.8)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    borderRadius: '12px',
                                    padding: '12px 16px',
                                    color: '#f8fafc',
                                    outline: 'none',
                                    fontSize: '15px',
                                }}
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>
                                <Clock size={16} style={{ color: '#818cf8' }} />
                                Duration (Weeks)
                            </label>
                            <select
                                style={{
                                    width: '100%',
                                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    borderRadius: '12px',
                                    padding: '12px 16px',
                                    color: '#f8fafc',
                                    outline: 'none',
                                    fontSize: '15px',
                                    appearance: 'none',
                                    cursor: 'pointer',
                                }}
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                            >
                                <option value="1">1 Week Intensive</option>
                                <option value="2">2 Weeks Balanced</option>
                                <option value="4">4 Weeks Comprehensive</option>
                                <option value="8">8 Weeks Deep Dive</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>
                                <Target size={16} style={{ color: '#818cf8' }} />
                                What's your specific goal?
                            </label>
                            <textarea
                                placeholder="e.g. I want to build a full-stack app from scratch"
                                style={{
                                    width: '100%',
                                    backgroundColor: 'rgba(30, 41, 59, 0.8)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    borderRadius: '12px',
                                    padding: '12px 16px',
                                    color: '#f8fafc',
                                    outline: 'none',
                                    fontSize: '15px',
                                    height: '160px',
                                    resize: 'none',
                                    lineHeight: '1.6',
                                }}
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={loading || !subject || !goal}
                    className="w-full mt-10 btn-primary flex items-center justify-center gap-3 py-4 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Generating your masterpiece...
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} />
                            Generate Study Plan
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-medium">
                    {error}
                </div>
            )}

            {generatedPlan && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-white/10" />
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Plan Generated</h2>
                        <div className="h-px flex-1 bg-white/10" />
                    </div>

                    <div className="glass-card p-8 border-indigo-500/20">
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px' }}>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{generatedPlan.title}</h2>
                                <p className="text-slate-400 mt-2">{generatedPlan.overview}</p>
                            </div>
                            <button
                                onClick={handleSavePlan}
                                disabled={saving || saved}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 24px',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap',
                                    border: saved ? '1px solid rgba(52,211,153,0.3)' : 'none',
                                    backgroundColor: saved ? 'rgba(16,185,129,0.15)' : '#4f46e5',
                                    color: saved ? '#34d399' : '#fff',
                                    cursor: saved ? 'default' : 'pointer',
                                    transition: 'all 0.2s',
                                    flexShrink: 0,
                                }}
                            >
                                {saving ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : saved ? (
                                    <CheckCircle2 size={18} />
                                ) : (
                                    <Plus size={18} />
                                )}
                                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save to Dashboard'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {generatedPlan.modules.map((module, i) => (
                                <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all group">
                                    <span className="text-xs font-bold text-indigo-400 mb-2 block">{module.time}</span>
                                    <h4 className="font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors">{module.name}</h4>
                                    <ul className="space-y-2">
                                        {module.topics.map((topic, j) => (
                                            <li key={j} className="text-sm text-slate-400 flex items-center gap-2">
                                                <div className="w-1 h-1 rounded-full bg-slate-600 flex-shrink-0" />
                                                {topic}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIPlanner;
