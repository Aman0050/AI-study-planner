import React, { useState, useEffect } from 'react';
import {
    ChevronLeft, ChevronRight, Calendar as CalendarIcon,
    Clock, Plus, X, Check, Flame, Target, BookOpen, BrainCircuit
} from 'lucide-react';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays,
    eachDayOfInterval, isToday, parseISO
} from 'date-fns';
import { taskService } from '../services/api';

// Color palette for events
const EVENT_COLORS = [
    { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.4)', text: '#a5b4fc', dot: '#6366f1' },
    { bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.4)', text: '#d8b4fe', dot: '#a855f7' },
    { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', text: '#6ee7b7', dot: '#10b981' },
    { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', text: '#fcd34d', dot: '#f59e0b' },
    { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', text: '#fca5a5', dot: '#ef4444' },
    { bg: 'rgba(14,165,233,0.15)', border: 'rgba(14,165,233,0.4)', text: '#7dd3fc', dot: '#0ea5e9' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Calendar = ({ onNavigate }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [tasks, setTasks] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', desc: '', time: '09:00', color: 0 });
    const [customEvents, setCustomEvents] = useState([]);
    const [view, setView] = useState('month'); // 'month' | 'week'

    useEffect(() => {
        taskService.getAll().then(data => setTasks(data)).catch(() => { });
        const stored = localStorage.getItem('calendar_events');
        if (stored) setCustomEvents(JSON.parse(stored));
    }, []);

    const saveCustomEvents = (evts) => {
        setCustomEvents(evts);
        localStorage.setItem('calendar_events', JSON.stringify(evts));
    };

    const allEvents = [
        ...tasks.map((t, i) => ({ date: t.date, title: t.subject || t.title, desc: t.description || '', time: '', colorIdx: i % EVENT_COLORS.length, source: 'task' })),
        ...customEvents,
    ];

    const getEventsForDay = (day) =>
        allEvents.filter(e => {
            try { return isSameDay(new Date(e.date), day); } catch { return false; }
        });

    const monthStart = startOfMonth(currentMonth);
    const calendarDays = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(endOfMonth(monthStart)) });

    const weekStart = startOfWeek(selectedDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const selectedDayEvents = getEventsForDay(selectedDate);

    const handleAddEvent = () => {
        if (!newEvent.title.trim()) return;
        const evt = { ...newEvent, date: selectedDate.toISOString(), colorIdx: newEvent.color };
        saveCustomEvents([...customEvents, evt]);
        setNewEvent({ title: '', desc: '', time: '09:00', color: 0 });
        setShowAddModal(false);
    };

    const removeEvent = (idx) => {
        const updated = customEvents.filter((_, i) => i !== idx);
        saveCustomEvents(updated);
    };

    // ---- Styles ----
    const glass = {
        background: 'rgba(30,41,59,0.7)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '20px',
        backdropFilter: 'blur(12px)',
    };

    const inputStyle = {
        width: '100%', background: 'rgba(15,23,42,0.8)',
        border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px',
        padding: '10px 14px', color: '#f1f5f9', fontSize: '14px',
        outline: 'none', boxSizing: 'border-box', marginBottom: '12px',
    };

    const btnPrimary = {
        background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff',
        border: 'none', borderRadius: '10px', padding: '10px 20px',
        fontSize: '13px', fontWeight: 700, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '6px',
        boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
    };

    return (
        <div style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* ---- Add Event Modal ---- */}
            {showAddModal && (
                <div
                    onClick={() => setShowAddModal(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
                >
                    <div onClick={e => e.stopPropagation()} style={{ ...glass, width: '100%', maxWidth: '420px', padding: '24px md:28px', maxHeight: '90vh', overflowY: 'auto', animation: 'popIn 0.18s ease' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                                Add Event — {format(selectedDate, 'MMM d, yyyy')}
                            </h3>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <input style={inputStyle} placeholder="Event title *" value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} autoFocus />
                        <input style={inputStyle} placeholder="Description (optional)" value={newEvent.desc} onChange={e => setNewEvent(p => ({ ...p, desc: e.target.value }))} />
                        <input style={{ ...inputStyle, marginBottom: '16px' }} type="time" value={newEvent.time} onChange={e => setNewEvent(p => ({ ...p, time: e.target.value }))} />
                        {/* Color picker */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Color</div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {EVENT_COLORS.map((c, i) => (
                                    <div key={i} onClick={() => setNewEvent(p => ({ ...p, color: i }))}
                                        style={{ width: '24px', height: '24px', borderRadius: '50%', background: c.dot, cursor: 'pointer', border: newEvent.color === i ? '2px solid white' : '2px solid transparent', boxShadow: newEvent.color === i ? '0 0 0 2px rgba(255,255,255,0.3)' : 'none', transition: 'all 0.15s' }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleAddEvent} style={btnPrimary}><Plus size={16} /> Add Event</button>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ---- Header ---- */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(99,102,241,0.35)' }}>
                        <CalendarIcon color="white" size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Study Calendar</h1>
                        <p style={{ color: '#64748b', margin: '3px 0 0', fontSize: '13px' }}>Track sessions, deadlines & milestones</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {/* View toggle */}
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '3px' }}>
                        {['month', 'week'].map(v => (
                            <button key={v} onClick={() => setView(v)} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, background: view === v ? 'rgba(99,102,241,0.3)' : 'transparent', color: view === v ? '#c7d2fe' : '#64748b', textTransform: 'capitalize', transition: 'all 0.15s' }}>
                                {v}
                            </button>
                        ))}
                    </div>
                    {/* Month nav */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} style={{ width: '34px', height: '34px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ChevronLeft size={16} />
                        </button>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff', minWidth: '110px', textAlign: 'center' }}>{format(currentMonth, 'MMM yyyy')}</span>
                        <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} style={{ width: '34px', height: '34px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    <button onClick={() => { setSelectedDate(new Date()); setShowAddModal(true); }} style={{ ...btnPrimary, padding: '8px 16px' }}>
                        <Plus size={16} /> <span className="hidden sm:inline">Add Event</span>
                    </button>
                </div>
            </div>

            {/* ---- Today strip ---- */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
                {weekDays.map((d, i) => {
                    const isSelected = isSameDay(d, selectedDate);
                    const dayEvts = getEventsForDay(d);
                    return (
                        <div key={i} onClick={() => setSelectedDate(d)} style={{ flexShrink: 0, width: '68px', borderRadius: '16px', padding: '12px 0', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: isSelected ? 'linear-gradient(135deg,#6366f1,#a855f7)' : isToday(d) ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isSelected ? 'transparent' : isToday(d) ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`, boxShadow: isSelected ? '0 8px 24px rgba(99,102,241,0.35)' : 'none' }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: isSelected ? 'rgba(255,255,255,0.8)' : '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{DAYS[d.getDay()]}</div>
                            <div style={{ fontSize: '20px', fontWeight: 800, color: isSelected ? '#fff' : isToday(d) ? '#818cf8' : '#94a3b8' }}>{format(d, 'd')}</div>
                            {dayEvts.length > 0 && (
                                <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'center', gap: '2px', flexWrap: 'wrap' }}>
                                    {dayEvts.slice(0, 3).map((_, di) => (
                                        <div key={di} style={{ width: '5px', height: '5px', borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.7)' : EVENT_COLORS[_.colorIdx ?? 0].dot }} />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ---- Main grid ---- */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {/* Month / Week grid */}
                <div style={{ ...glass, overflow: 'hidden' }}>

                    {view === 'month' ? (
                        <>
                            {/* Month — day headers */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                {DAYS.map(d => (
                                    <div key={d} style={{ padding: '14px 4px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(255,255,255,0.02)' }}>{d}</div>
                                ))}
                            </div>
                            {/* Month — cells */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                                {calendarDays.map((day, i) => {
                                    const dayEvts = getEventsForDay(day);
                                    const inMonth = isSameMonth(day, monthStart);
                                    const isSelected = isSameDay(day, selectedDate);
                                    const isTd = isToday(day);
                                    return (
                                        <div key={i} onClick={() => setSelectedDate(day)}
                                            style={{
                                                minHeight: window.innerWidth < 480 ? '60px' : '100px', padding: '8px 4px',
                                                borderRight: '1px solid rgba(255,255,255,0.04)',
                                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                cursor: 'pointer', transition: 'background 0.15s',
                                                background: isSelected ? 'rgba(99,102,241,0.08)' : 'transparent',
                                                opacity: inMonth ? 1 : 0.25,
                                            }}
                                            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                                            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                <span style={{
                                                    width: '26px', height: '26px', borderRadius: '8px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '12px', fontWeight: 700,
                                                    background: isTd ? 'linear-gradient(135deg,#6366f1,#a855f7)' : isSelected ? 'rgba(99,102,241,0.25)' : 'transparent',
                                                    color: isTd ? '#fff' : isSelected ? '#a5b4fc' : '#94a3b8',
                                                    boxShadow: isTd ? '0 2px 8px rgba(99,102,241,0.4)' : 'none',
                                                }}>
                                                    {format(day, 'd')}
                                                </span>
                                                {dayEvts.length > 0 && (
                                                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.12)', borderRadius: '4px', padding: '1px 5px' }}>
                                                        {dayEvts.length}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                                {dayEvts.slice(0, 2).map((evt, ei) => {
                                                    const clr = EVENT_COLORS[evt.colorIdx ?? 0];
                                                    return (
                                                        <div key={ei} style={{ fontSize: '10px', fontWeight: 600, padding: '3px 6px', borderRadius: '5px', background: clr.bg, border: `1px solid ${clr.border}`, color: clr.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {evt.time && <span style={{ opacity: 0.7, marginRight: '4px' }}>{evt.time}</span>}
                                                            {evt.title}
                                                        </div>
                                                    );
                                                })}
                                                {dayEvts.length > 2 && (
                                                    <div style={{ fontSize: '9px', color: '#6366f1', fontWeight: 700, paddingLeft: '6px' }}>+{dayEvts.length - 2} more</div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Week view — day column headers */}
                            <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ padding: '14px 4px', background: 'rgba(255,255,255,0.02)' }} />
                                {weekDays.map((d, i) => {
                                    const isTd = isToday(d);
                                    const isSel = isSameDay(d, selectedDate);
                                    return (
                                        <div key={i} onClick={() => setSelectedDate(d)}
                                            style={{ padding: '12px 4px', textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', borderLeft: '1px solid rgba(255,255,255,0.04)' }}>
                                            <div style={{ fontSize: '10px', fontWeight: 700, color: isTd ? '#818cf8' : '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{DAYS[d.getDay()]}</div>
                                            <div style={{
                                                width: '32px', height: '32px', margin: '4px auto 0',
                                                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '14px', fontWeight: 800,
                                                background: isTd ? 'linear-gradient(135deg,#6366f1,#a855f7)' : isSel ? 'rgba(99,102,241,0.2)' : 'transparent',
                                                color: isTd ? '#fff' : isSel ? '#a5b4fc' : '#94a3b8',
                                                boxShadow: isTd ? '0 2px 10px rgba(99,102,241,0.4)' : 'none',
                                            }}>{format(d, 'd')}</div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Week view — hour rows */}
                            <div style={{ overflowY: 'auto', maxHeight: '520px' }}>
                                {Array.from({ length: 15 }, (_, hi) => {
                                    const hour = hi + 7; // 7am – 9pm
                                    const label = hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`;
                                    return (
                                        <div key={hi} style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', borderBottom: '1px solid rgba(255,255,255,0.04)', minHeight: '64px' }}>
                                            {/* Hour label */}
                                            <div style={{ padding: '8px 6px', fontSize: '10px', fontWeight: 600, color: '#334155', textAlign: 'right', paddingRight: '10px', paddingTop: '10px', flexShrink: 0 }}>{label}</div>
                                            {/* Day cells */}
                                            {weekDays.map((d, di) => {
                                                const dayEvts = getEventsForDay(d).filter(e => {
                                                    if (!e.time) return false;
                                                    const h = parseInt(e.time.split(':')[0]);
                                                    return h === hour;
                                                });
                                                const isSel = isSameDay(d, selectedDate);
                                                return (
                                                    <div key={di}
                                                        onClick={() => { setSelectedDate(d); }}
                                                        style={{ borderLeft: '1px solid rgba(255,255,255,0.04)', padding: '4px', cursor: 'pointer', background: isSel ? 'rgba(99,102,241,0.04)' : 'transparent', transition: 'background 0.15s', position: 'relative' }}
                                                        onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                                                        onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                                                    >
                                                        {dayEvts.map((evt, ei) => {
                                                            const clr = EVENT_COLORS[evt.colorIdx ?? 0];
                                                            return (
                                                                <div key={ei} style={{ fontSize: '10px', fontWeight: 700, padding: '5px 7px', borderRadius: '7px', background: clr.bg, border: `1px solid ${clr.border}`, color: clr.text, marginBottom: '3px', borderLeft: `3px solid ${clr.dot}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    <div style={{ fontSize: '9px', opacity: 0.7 }}>{evt.time}</div>
                                                                    {evt.title}
                                                                </div>
                                                            );
                                                        })}
                                                        {/* Show all-day events (no time) only in 9am slot */}
                                                        {hour === 9 && getEventsForDay(d).filter(e => !e.time).map((evt, ei) => {
                                                            const clr = EVENT_COLORS[evt.colorIdx ?? 0];
                                                            return (
                                                                <div key={`notime-${ei}`} style={{ fontSize: '10px', fontWeight: 700, padding: '5px 7px', borderRadius: '7px', background: clr.bg, border: `1px solid ${clr.border}`, color: clr.text, marginBottom: '3px', borderLeft: `3px solid ${clr.dot}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {evt.title}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>


                {/* ---- Sidebar Panel ---- */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Selected day events */}
                    <div style={{ ...glass, padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{format(selectedDate, 'EEEE')}</div>
                                <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>{format(selectedDate, 'MMMM d, yyyy')}</div>
                            </div>
                            <button onClick={() => setShowAddModal(true)} style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Plus size={16} />
                            </button>
                        </div>

                        {selectedDayEvents.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: '#334155', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.06)' }}>
                                <CalendarIcon size={28} style={{ color: '#334155', margin: '0 auto 8px' }} />
                                <p style={{ fontSize: '12px', margin: 0, color: '#475569' }}>No events. Click + to add one.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {selectedDayEvents.map((evt, i) => {
                                    const clr = EVENT_COLORS[evt.colorIdx ?? 0];
                                    const isCustom = customEvents.includes(evt);
                                    return (
                                        <div key={i} style={{ padding: '12px 14px', borderRadius: '12px', background: clr.bg, border: `1px solid ${clr.border}`, position: 'relative' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    {evt.time && (
                                                        <div style={{ fontSize: '10px', fontWeight: 700, color: clr.text, opacity: 0.7, marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Clock size={10} /> {evt.time}
                                                        </div>
                                                    )}
                                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{evt.title}</div>
                                                    {evt.desc && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{evt.desc}</div>}
                                                </div>
                                                <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: clr.dot, marginTop: '4px' }} />
                                                    {isCustom && (
                                                        <button onClick={() => removeEvent(customEvents.indexOf(evt))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0', lineHeight: 1 }}>
                                                            <X size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Stats card */}
                    <div style={{ ...glass, padding: '20px', background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08))' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#818cf8', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <Flame size={15} /> Monthly Overview
                        </div>
                        {[
                            { label: 'Study Sessions', value: tasks.length, icon: BookOpen, color: '#818cf8' },
                            { label: 'Custom Events', value: customEvents.length, icon: Target, color: '#a78bfa' },
                            { label: 'Total Events', value: allEvents.length, icon: CalendarIcon, color: '#34d399' },
                        ].map(s => (
                            <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <s.icon size={14} style={{ color: s.color }} />
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>{s.label}</span>
                                </div>
                                <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{s.value}</span>
                            </div>
                        ))}
                        <div style={{ marginTop: '14px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, (allEvents.length / 20) * 100)}%`, background: 'linear-gradient(90deg,#6366f1,#a855f7)', borderRadius: '2px', transition: 'width 0.6s ease' }} />
                        </div>
                        <div style={{ fontSize: '10px', color: '#475569', marginTop: '6px' }}>
                            {allEvents.length}/20 events this month
                        </div>
                    </div>

                    {/* Quick add to Planner */}
                    <div
                        onClick={() => onNavigate('planner')}
                        style={{ ...glass, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid rgba(99,102,241,0.15)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(30,41,59,0.7)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)'; }}
                    >
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <BrainCircuit size={18} style={{ color: '#818cf8' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Generate AI Plan</div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Let AI build your study schedule →</div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes popIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
            `}</style>
        </div>
    );
};

export default Calendar;
