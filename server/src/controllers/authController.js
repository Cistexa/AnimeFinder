import bcrypt from "bcryptjs";
import { supabase } from "../config/supabase.js";
import { createToken } from "../middleware/auth.js";

export const register = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "email and password required" });
    }

    try {
        const password_hash = await bcrypt.hash(password, 10);

        const { data: existing, error: existingError } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .maybeSingle();

        if (existingError) {
            console.error(existingError);
            return res.status(500).json({ error: "DB error" });
        }

        if (existing) {
            return res.status(400).json({ error: "User already exists" });
        }

        const { data, error } = await supabase
            .from("users")
            .insert({ email, password_hash })
            .select()
            .single();

        if (error) {
            console.error(error);
            return res.status(500).json({ error: "Could not create user" });
        }

        const token = createToken(data);
        return res.json({ token, user: { id: data.id, email: data.email } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Unexpected error" });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "email and password required" });
    }
    try {
        const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .maybeSingle();

        if (error) {
            console.error(error);
            return res.status(500).json({ error: "DB error" });
        }

        if (!user) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const token = createToken(user);
        return res.json({ token, user: { id: user.id, email: user.email } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Unexpected error" });
    }
};
