import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { subscribe, getSubscriptions, unsubscribe } from "../controllers/subscriptionController.js";

export const subRouter = express.Router();

subRouter.post("/", authMiddleware, subscribe);
subRouter.get("/", authMiddleware, getSubscriptions);
subRouter.delete("/", authMiddleware, unsubscribe);


