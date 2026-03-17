import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";

import taskRoute from "./routes/tasksRouters.js";
import authRoute from "./routes/authRoutes.js";
import scheduleRoute from "./routes/scheduleRoutes.js";
import analyticsRoute from "./routes/analyticsRoutes.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

// middlewares
app.use(express.json());
app.use(cookieParser());

// security
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút."
});

app.use("/api/", limiter);

// CORS
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      "http://localhost:5173",
      "http://localhost:5174"
    ].filter(Boolean),
    credentials: true
  })
);

// routes
app.use("/api/auth", authRoute);
app.use("/api/tasks", taskRoute);
app.use("/api/schedules", scheduleRoute);
app.use("/api/analytics", analyticsRoute);

// health check (giữ server Render không sleep)
app.get("/api/health", (req, res) => {
  res.send("Server running");
});

// production: serve frontend
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../frontend/dist");

  app.use(express.static(frontendPath));

  app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}
else
{
  console.error("Không đủ quyền");
}

// connect DB rồi mới start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server chạy tại cổng ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Lỗi kết nối DB:", err);
  });