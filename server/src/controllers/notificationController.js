import { supabase } from "../config/supabase.js";

export const getNotifications = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", req.user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching notifications:", error);
            return res.status(500).json({ error: "DB error" });
        }

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Unexpected error" });
    }
};

export const markAsRead = async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("id", id)
            .eq("user_id", req.user.id);

        if (error) {
            console.error("Error marking notification as read:", error);
            return res.status(500).json({ error: "DB error" });
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Unexpected error" });
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", req.user.id);

        if (error) {
            console.error("Error marking all notifications as read:", error);
            return res.status(500).json({ error: "DB error" });
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Unexpected error" });
    }
};
