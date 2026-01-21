import { supabase } from "./src/config/supabase.js";

async function checkUser() {
    const userId = "58bb1ca7-09de-4827-8b72-dcd812babe91"; // ID from your screenshot

    console.log(`Checking existence of user: ${userId}`);

    const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

    if (error) {
        console.error("Error fetching user:", error);
    } else {
        console.log("User found in public.users:", user);
    }

    const { data: sub, error: subError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId);

    if (subError) {
        console.error("Error fetching subs:", subError);
    } else {
        console.log(`User has ${sub.length} subscriptions.`);
    }
}

checkUser();
