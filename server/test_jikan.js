import dotenv from 'dotenv';
import { processDailyUpdates } from './src/services/jikanService.js';

dotenv.config();

console.log("Running manual test of Jikan Daily Update...");

processDailyUpdates()
    .then(() => {
        console.log("Test execution finished.");
        process.exit(0);
    })
    .catch(err => {
        console.error("Test execution failed:", err);
        process.exit(1);
    });
