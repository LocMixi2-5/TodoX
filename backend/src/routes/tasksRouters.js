import express from "express";
import { 
    deleteTask, 
    updateTask, 
    createTask, 
    getAllTasks, 
} from "../controllers/tasksControllers.js";

const router = express.Router();

router.get("/", getAllTasks);
router.post("/", createTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;