
import { initScheduler } from "./src/services/cronService.js";

// Run immediate check
console.log("Testing Refactored Cron Logic...");
initScheduler();

// Keep process alive for async
setInterval(() => { }, 1000);
