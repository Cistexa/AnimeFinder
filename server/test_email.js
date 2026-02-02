import { sendEmailNotification } from "./src/services/emailService.js";
import dotenv from "dotenv";
dotenv.config();

console.log("Testing email...");
console.log("SMTP_USER:", process.env.SMTP_USER);

sendEmailNotification("cinarhuseyin13@gmail.com", "<h1>Test Email</h1><p>This is a test.</p>");
