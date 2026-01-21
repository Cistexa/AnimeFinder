
import { supabase } from "./src/config/supabase.js";

const run = async () => {
    console.log("Reading Items...");
    const { data: items, error: iErr } = await supabase.from("items").select("*");
    if (iErr) console.error(iErr);
    else console.table(items);

    console.log("Reading Subscriptions...");
    const { data: subs, error: sErr } = await supabase.from("subscriptions").select("*");
    if (sErr) console.error(sErr);
    else console.table(subs);

    console.log("Reading Notifications (Recent)...");
    const { data: notifs, error: nErr } = await supabase.from("notifications").select("*").limit(5).order('created_at', { ascending: false });
    if (nErr) console.error(nErr);
    else console.table(notifs);
};

run();
