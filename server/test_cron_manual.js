
import { initScheduler } from "./src/services/cronService.js";

// We want to run processUpdates immediately.
// initScheduler calls it immediately.
console.log("Starting manual cron test...");
initScheduler();

// Keep alive for a bit to let async finish
setInterval(() => { }, 1000);
