
import { supabase } from "./src/config/supabase.js";

const userId = "58bb1ca7-09de-4827-8b72-dcd812babe91";

const run = async () => {
    console.log(`Checking status for User ID: ${userId}`);

    // 1. Check public.users
    const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

    if (error) console.log("❌ User not found in public.users:", error.message);
    else console.log("✅ User found in public.users:", user);

    // 2. Check Subscriptions
    const { data: subs } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId);
    console.log(`ℹ️ User has ${subs ? subs.length : 0} subscriptions.`);

    // 3. Try a dummy insert to notifications to see the exact error detail
    console.log("Attempting dummy notification insert...");
    const { error: insertErr } = await supabase.from("notifications").insert({
        user_id: userId,
        title: "Debug Test",
        message: "Testing FK",
        link: "#"
    });

    if (insertErr) {
        console.log("❌ Insert failed:", insertErr);
    } else {
        console.log("✅ Insert succeeded! (So FK is fine?)");
        // Cleanup
        await supabase.from("notifications").delete().eq("title", "Debug Test");
    }
};

run();
