import express from "express";
import {
  getWeeklySchedule,
  deleteScheduleBlock,
  deleteWeekSchedule,
  addSchedule,
} from "../controllers/scheduleController.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.use(protectRoute);

router.post("/add", addSchedule);
router.get("/weekly", getWeeklySchedule);
router.delete("/block/:id", deleteScheduleBlock);
router.delete("/week/:weekStart", deleteWeekSchedule);

export default router;
