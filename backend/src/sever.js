import express from "express";
import taskRoute from "./routes/tasksRouters.js";
import authRoute from "./routes/authRoutes.js";
import scheduleRoute from "./routes/scheduleRoutes.js";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";

dotenv.config();

const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

const app = express();

import cookieParser from "cookie-parser";

// middlewares
app.use(express.json());
app.use(cookieParser());

app.use(cors({ 
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use("/api/auth", authRoute);
app.use("/api/tasks", taskRoute);
app.use("/api/schedules", scheduleRoute);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/Main/dist")));

  app.get("", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/Main/dist/index.html"));
  });
}

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`server bắt đầu trên cổng ${PORT}`);
  });
});