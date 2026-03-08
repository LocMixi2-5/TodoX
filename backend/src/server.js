import express from "express";
import taskRoute from "./routes/tasksRouters.js";
import authRoute from "./routes/authRoutes.js";
import scheduleRoute from "./routes/scheduleRoutes.js";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

dotenv.config();

const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

const app = express();

import cookieParser from "cookie-parser";

// middlewares
app.use(express.json());
app.use(cookieParser());

// security
app.use(helmet());
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút."
});
app.use("/api/", limiter);

app.use(cors({ 
  origin: [process.env.FRONTEND_URL, "http://localhost:5173", "http://localhost:5174"].filter(Boolean),
  credentials: true,
}));

app.use("/api/auth", authRoute);
app.use("/api/tasks", taskRoute);
app.use("/api/schedules", scheduleRoute);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`server bắt đầu trên cổng ${PORT}`);
  });
});