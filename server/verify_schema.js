
import { supabase } from "./src/config/supabase.js";

const run = async () => {
    console.log("Checking new_releases columns...");
    // Try to select mal_id. If it fails, column doesn't exist.
    const { data, error } = await supabase
        .from("new_releases")
        .select("mal_id")
        .limit(1);

    if (error) {
        console.error("❌ verification FAILED: " + JSON.stringify(error, null, 2));
    } else {
        console.log("✅ 'mal_id' column exists! Verification PASSED.");
    }
};

run();
