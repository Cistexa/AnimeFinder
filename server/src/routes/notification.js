import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
} from "../controllers/notificationController.js";

export const notificationRouter = express.Router();

notificationRouter.use(authMiddleware);

notificationRouter.get("/", getNotifications);
notificationRouter.put("/:id/read", markAsRead);
notificationRouter.put("/read-all", markAllAsRead);
