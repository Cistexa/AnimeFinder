
import fs from "fs";
const content = fs.readFileSync("debug_log_v3.txt", "utf8"); // Adjust encoding if needed ("ucs2" for utf-16le)
console.log(content);
