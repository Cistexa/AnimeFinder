
import { supabase } from "./src/config/supabase.js";

const run = async () => {
    console.log("Checking 'users' table...");
    const { data, error } = await supabase.from("users").select("*").limit(5);

    if (error) {
        console.error("Error accessing 'users' table:", error);
    } else {
        console.log(`Found ${data.length} users.`);
        console.log(data);
    }
};

run();
