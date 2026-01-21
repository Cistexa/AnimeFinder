
import { supabase } from "./src/config/supabase.js";
import { fetchMangaLatestChapter, sendEmailNotification } from "./src/services/jikanService.js";
import { checkMangaUpdate } from "./src/services/matchingService.js";

const run = async () => {
    console.log("--- Targeted Debug: Berserk ---");

    // 1. Fetch Berserk from DB
    const { data: items } = await supabase.from("items").select("*").eq("title", "Berserk");
    const item = items[0];

    if (!item) {
        console.error("Berserk not found in DB");
        return;
    }
    console.log(`Checking item: ${item.title} (Last Ch: ${item.last_chapter})`);

    // 2. Fetch API
    const apiData = await fetchMangaLatestChapter(item.title);
    if (!apiData) {
        console.error("API returned null");
        return;
    }
    console.log(`API Result: ${apiData.title} - Ch: ${apiData.chapters}`);

    // 3. Match
    const update = checkMangaUpdate(item, apiData);
    if (!update) {
        console.log("No update detected.");
        return;
    }
    console.log("Update Detected!", update);

    // 4. Find Subscriptions
    const { data: subs } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("item_id", item.id);

    console.log(`Found ${subs.length} subscribers.`);

    // 5. Simulate Notification
    for (const sub of subs) {
        console.log(`Processing user ${sub.user_id}...`);

        const { data: user } = await supabase.from("users").select("email").eq("id", sub.user_id).single();
        if (!user) {
            console.error("User not found in public.users");
            continue;
        }

        const notif = {
            user_id: sub.user_id,
            title: update.message,
            message: `${update.title} - ${update.message}`,
            link: update.url,
            is_read: false
        };

        console.log("Inserting Notification:", notif);
        const { error: notifErr } = await supabase.from("notifications").insert([notif]);

        if (notifErr) {
            console.error("DB Insert Error:", notifErr);
        } else {
            console.log("✅ Notification inserted successfully!");
        }
    }
    console.log("--- End Debug ---");
};

run();
