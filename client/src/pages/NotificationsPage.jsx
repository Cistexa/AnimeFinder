import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Link } from "react-router-dom";

export default function NotificationsPage() {
    const { authFetch } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await authFetch("/notifications");
            setNotifications(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id, link) => {
        try {
            await authFetch(`/notifications/${id}/read`, { method: "PUT" });
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
            if (link) {
                window.open(link, "_blank");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await authFetch("/notifications/read-all", { method: "PUT" });
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="p-4">Loading notifications...</div>;

    return (
        <div className="notifications-page container">
            <div className="header-flex">
                <h1>Notifications</h1>
                {notifications.some((n) => !n.is_read) && (
                    <button onClick={markAllAsRead} className="btn-secondary">
                        Mark All Read
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <p>No notifications yet.</p>
            ) : (
                <ul className="notification-list">
                    {notifications.map((n) => (
                        <li
                            key={n.id}
                            className={`notification-item ${n.is_read ? "read" : "unread"}`}
                            onClick={() => markAsRead(n.id, n.link)}
                            style={{
                                cursor: "pointer",
                                padding: "1rem",
                                borderBottom: "1px solid #333",
                                backgroundColor: n.is_read ? "transparent" : "#1a1a1a",
                            }}
                        >
                            <div className="notif-title" style={{ fontWeight: "bold" }}>
                                {n.title}
                            </div>
                            <div className="notif-message">{n.message}</div>
                            <div className="notif-date" style={{ fontSize: "0.8rem", color: "#888" }}>
                                {new Date(n.created_at).toLocaleString()}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
