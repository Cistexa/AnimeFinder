import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export default function NotificationBell() {
    const { authFetch } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const data = await authFetch("/notifications");
            if (Array.isArray(data)) {
                const unread = data.filter((n) => !n.is_read).length;
                setUnreadCount(unread);
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Link to="/notifications" className="notification-bell" style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Bell size={24} />
            {unreadCount > 0 && (
                <span
                    style={{
                        position: "absolute",
                        top: -5,
                        right: -5,
                        backgroundColor: "red",
                        color: "white",
                        borderRadius: "50%",
                        padding: "2px 6px",
                        fontSize: "12px",
                        fontWeight: "bold",
                    }}
                >
                    {unreadCount > 9 ? "9+" : unreadCount}
                </span>
            )}
        </Link>
    );
}
