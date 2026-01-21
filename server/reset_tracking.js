import { supabase } from "./src/config/supabase.js";

async function resetTracking() {
    console.log("Resetting tracking data for ALL items...");

    // Set last_chapter and last_episode to 0 for everything
    const { error } = await supabase
        .from("items")
        .update({ last_chapter: 0, last_episode: 0 })
        .not("id", "is", null); // Update all rows safely

    if (error) {
        console.error("Error resetting data:", error);
    } else {
        console.log("✅ Tracking reset! Next server start will treat EVERYTHING as a new release.");
    }
}

resetTracking();
