import { apiFetch } from "../services/api";
import React, { useEffect, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './authContext';
import { apiUrl } from '../services/api';

const socket = io(apiUrl('/'), { withCredentials: true });

const NotificationBell = () => {
    const { auth } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount]     = useState(0);
    const [open, setOpen]                   = useState(false);

    useEffect(() => {
        if (!auth?.user) return;

        // Join personal room based on role
        const userId = auth.user.userId || auth.user.ngoId || auth.user.carehomeId;
        socket.emit('join', { userId, role: auth.role });

        // Listen for real-time notifications
        socket.on('new_notification', (notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        // Fetch existing from DB on load
        fetchNotifications();

        return () => socket.off('new_notification');
    }, [auth?.user]);

    const fetchNotifications = async () => {
        try {
            const res  = await apiFetch('/api/notifications', { credentials: 'include' });
            const data = await res.json();
            if (data.success) {
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    const handleClick = async (notification) => {
    await apiFetch(`/api/notifications/${notification._id}/read`, {
        method: 'PATCH',
        credentials: 'include'
    });

    setNotifications(prev =>
        prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    setOpen(false);

    // Navigate and scroll to section
    const [, anchor] = notification.link.split('#');
    window.location.href = notification.link;
    
    if (anchor) {
        setTimeout(() => {
            const el = document.getElementById(anchor);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 500);
    }
};

    const markAllRead = async () => {
        await apiFetch('/api/notifications/read-all', {
            method: 'PATCH',
            credentials: 'include'
        });
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
    };

    if (!auth?.user) return null;

    return (
        <li style={{ position: 'relative', listStyle: 'none' }}>
            {/* Bell button */}
            <button
                onClick={() => setOpen(!open)}
                style={{
                    position: 'relative', background: 'none',
                    border: 'none', cursor: 'pointer',
                    fontSize: '20px', padding: '4px'
                }}
            >
                🔔
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: '-4px', right: '-4px',
                        background: '#E24B4A', color: 'white',
                        borderRadius: '50%', width: '16px', height: '16px',
                        fontSize: '10px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontWeight: '500'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div style={{
                    position: 'absolute', right: 0, top: '36px',
                    width: '300px', background: 'white',
                    border: '1px solid #eee', borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    zIndex: 1000, maxHeight: '380px', overflowY: 'auto'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '10px 14px', borderBottom: '1px solid #eee',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <span style={{ fontWeight: '500', fontSize: '13px', color: '#1a1a1a' }}>
                            Notifications
                        </span>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} style={{
                                fontSize: '11px', color: '#378ADD',
                                background: 'none', border: 'none', cursor: 'pointer'
                            }}>
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    {notifications.length === 0 ? (
                        <div style={{
                            padding: '24px', textAlign: 'center',
                            color: '#888', fontSize: '13px'
                        }}>
                            No notifications yet
                        </div>
                    ) : (
                        notifications.map(n => (
                            <div
                                key={n._id}
                                onClick={() => handleClick(n)}
                                style={{
                                    padding: '10px 14px',
                                    borderBottom: '1px solid #f5f5f5',
                                    cursor: 'pointer',
                                    background: n.isRead ? 'white' : '#EFF6FF',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '3px'
                                }}
                            >
                                <span style={{ fontSize: '12px', color: '#1a1a1a' }}>
                                    {n.message}
                                </span>
                                <span style={{ fontSize: '10px', color: '#888' }}>
                                    {new Date(n.createdAt).toLocaleString()}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </li>
    );
};

export default NotificationBell;