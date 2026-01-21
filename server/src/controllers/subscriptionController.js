import { supabase } from "../config/supabase.js";

export const subscribe = async (req, res) => {
    const { title, type, description } = req.body;
    if (!title || !type) {
        return res.status(400).json({ error: "title and type required" });
    }

    try {
        let { data: item, error: selectError } = await supabase
            .from("items")
            .select("*")
            .eq("title", title)
            .eq("type", type)
            .maybeSingle();

        if (selectError) {
            console.error(selectError);
            return res.status(500).json({ error: "DB error" });
        }

        if (!item) {
            const { data: inserted, error: insertError } = await supabase
                .from("items")
                .insert({ title, type, description })
                .select()
                .single();

            if (insertError) {
                console.error(insertError);
                return res.status(500).json({ error: "Failed to create item" });
            }
            item = inserted;
        }

        const { error: subError } = await supabase.from("subscriptions").insert({
            user_id: req.user.id,
            item_id: item.id,
        });

        if (subError) {
            console.error(subError);
            return res.status(500).json({ error: "Failed to subscribe" });
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Unexpected error" });
    }
};

export const getSubscriptions = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("subscriptions")
            .select("id, created_at, items(id, title, type, description)")
            .eq("user_id", req.user.id);

        if (error) {
            console.error(error);
            return res.status(500).json({ error: "DB error" });
        }

        const mapped =
            data?.map((row) => ({
                id: row.id,
                created_at: row.created_at,
                item: row.items,
            })) ?? [];

        res.json({ subscriptions: mapped });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Unexpected error" });
    }
};

export const unsubscribe = async (req, res) => {
    const { title, type } = req.body;
    if (!title || !type) {
        return res.status(400).json({ error: "title and type required" });
    }

    try {
        const { data: item, error: itemError } = await supabase
            .from("items")
            .select("id")
            .eq("title", title)
            .eq("type", type)
            .maybeSingle();

        if (itemError) {
            console.error(itemError);
            return res.status(500).json({ error: "DB error" });
        }

        if (!item) {
            return res.json({ success: true }); // already gone
        }

        const { error: delError } = await supabase
            .from("subscriptions")
            .delete()
            .eq("user_id", req.user.id)
            .eq("item_id", item.id);

        if (delError) {
            console.error(delError);
            return res.status(500).json({ error: "Failed to unsubscribe" });
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Unexpected error" });
    }
};
