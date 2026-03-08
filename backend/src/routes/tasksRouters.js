import express from "express";
import { 
    deleteTask, 
    updateTask, 
    createTask, 
    getAllTasks, 
} from "../controllers/tasksControllers.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.use(protectRoute);

router.get("/", getAllTasks);
router.post("/", createTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;