import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables before creating the client
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "Supabase env vars missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env"
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Basit bağlantı log'u (örnek bir sorgu ile)
async function testConnection() {
  try {
    const { error } = await supabase.from("users").select("id").limit(1);
    if (error) {
      console.error("Supabase test query failed:", error.message);
    } else {
      console.log("✅ Supabase connected successfully");
    }
  } catch (err) {
    console.error("Supabase connection error:", err.message);
  }
}

// Sunucu ayağa kalktığında bir kere çalışsın
testConnection();



