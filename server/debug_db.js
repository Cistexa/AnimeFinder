import { supabase } from "./src/config/supabase.js";

async function debugDB() {
    console.log("Querying new_releases...");
    const { data, error } = await supabase
        .from("new_releases")
        .select("*");

    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`Found ${data.length} rows.`);
        console.log(JSON.stringify(data, null, 2));
    }
}

debugDB();
