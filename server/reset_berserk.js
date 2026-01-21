
import { supabase } from "./src/config/supabase.js";

const run = async () => {
    console.log("Resetting Berserk last_chapter to 1...");
    const { data, error } = await supabase
        .from("items")
        .update({ last_chapter: 1 })
        .eq("title", "Berserk")
        .select();

    if (error) {
        console.error("Error updating DB:", error);
    } else {
        console.log("Updated:", data);
    }
};

run();
