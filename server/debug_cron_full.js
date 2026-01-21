
import { initScheduler } from "./src/services/cronService.js";

// We just import it; initScheduler runs processUpdates() immediately on verified call.
// But initScheduler in cronService.js does:
// console.log("Running immediate update check on startup...");
// processUpdates();
// So just importing it and running initScheduler should work.

console.log("Starting Debug run...");
initScheduler();
