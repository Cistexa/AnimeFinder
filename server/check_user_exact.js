
import { supabase } from "./src/config/supabase.js";
const userId = "58bb1ca7-09de-4827-8b72-dcd812babe91";
const run = async () => {
    const { data } = await supabase.from("users").select("id").eq("id", userId).single();
    if (data) console.log("RESULT: EXISTS");
    else console.log("RESULT: MISSING");
};
run();
