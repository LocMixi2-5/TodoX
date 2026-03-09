import express from "express";
import { getDashboard } from "../controllers/analyticsController.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.use(protectRoute);

router.get("/dashboard", getDashboard);

export default router;
