// Seed script: tạo tài khoản demo với dữ liệu phong phú
// Chạy: node seed_demo.js

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { User } from "./src/models/User.js";
import Task from "./src/models/Task.js";
import { Schedule } from "./src/models/Schedule.js";

dotenv.config();

const MONGO_URI = process.env.MONGODB_CONNECTIONGSTRING;

// ======= CONFIG =======
const DEMO_USER = {
  username: "DemoLocMixi",
  email: "demo@locmixi.com",
  password: "demo123456",
};

// ======= HELPERS =======
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function addHours(date, hours) {
  return new Date(date.getTime() + hours * 3600000);
}
function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// ======= TASK DATA =======
const taskTemplates = [
  // Học tập
  "Ôn tập Toán Cao Cấp chương 3",
  "Làm bài tập Xác suất Thống kê",
  "Đọc sách Cấu trúc Dữ liệu và Giải thuật",
  "Hoàn thành báo cáo môn Mạng Máy Tính",
  "Học từ vựng TOEIC 50 từ mới",
  "Làm đề thi thử TOEIC Reading",
  "Ôn tập CCNA Module 1",
  "Ôn tập CCNA Module 2",
  "Ôn tập CCNA Module 3",
  "Viết essay IELTS Writing Task 2",
  "Nghe podcast tiếng Anh 30 phút",
  "Học Grammar Unit 15 - Conditionals",
  "Đọc tài liệu Hệ Điều Hành chương 5",
  "Ôn thi giữa kỳ môn Cơ sở Dữ liệu",
  "Làm đồ án nhóm môn Công nghệ Phần mềm",
  // Lập trình
  "Code tính năng đăng nhập cho dự án",
  "Fix bug trang chủ không hiển thị danh sách",
  "Refactor API endpoint /users",
  "Viết unit test cho module authentication",
  "Học React Hooks: useEffect, useMemo",
  "Tạo component Dashboard cho dự án",
  "Deploy dự án lên Vercel",
  "Setup CI/CD pipeline với GitHub Actions",
  "Học Docker cơ bản",
  "Code REST API cho module sản phẩm",
  "Tối ưu database query - indexing",
  "Học TypeScript generic types",
  "Implement WebSocket cho chat real-time",
  "Code giao diện responsive cho mobile",
  "Review code PR #42 của teammate",
  // Cá nhân
  "Tập gym - Ngày chân",
  "Tập gym - Ngày ngực + tay",
  "Tập gym - Ngày lưng + vai",
  "Chạy bộ 5km buổi sáng",
  "Đi khám sức khỏe định kỳ",
  "Mua sách giáo trình học kỳ mới",
  "Dọn dẹp phòng trọ",
  "Giặt đồ cuối tuần",
  "Nấu meal prep cho tuần mới",
  "Gọi điện về nhà",
  "Đi siêu thị mua đồ ăn",
  "Sửa xe máy bảo dưỡng",
  "Đăng ký thẻ thư viện",
  "Nộp tiền phòng trọ tháng 2",
  "Nộp tiền phòng trọ tháng 3",
  "Họp nhóm đồ án lúc 19h",
  "Chuẩn bị slide thuyết trình",
  "Tham gia workshop AI tại trường",
  "Đi phỏng vấn thực tập công ty X",
  "Viết CV và cover letter",
  "Cập nhật LinkedIn profile",
  "Luyện giải thuật trên LeetCode",
  "Xem tutorial Next.js 14 trên YouTube",
  "Hoàn thành khóa học Udemy - Node.js",
  "Thiết kế wireframe cho dự án cá nhân",
  "Backup dữ liệu laptop",
  "Cài đặt môi trường dev mới",
  "Viết blog kỹ thuật về MongoDB",
  "Tham gia buổi seminar về Cloud Computing",
  "Đọc documentation của Redis",
];

// ======= SCHEDULE DATA =======
const scheduleTemplates = [
  { taskName: "Toán Cao Cấp", location: "Phòng A301", instructor: "Thầy Minh", hours: [7, 9.5] },
  { taskName: "Xác suất Thống kê", location: "Phòng B205", instructor: "Cô Hương", hours: [9.5, 11.5] },
  { taskName: "Mạng Máy Tính", location: "Phòng Lab C102", instructor: "Thầy Tuấn", hours: [13, 15] },
  { taskName: "Cấu trúc Dữ liệu", location: "Phòng A402", instructor: "Thầy Đức", hours: [15.5, 17.5] },
  { taskName: "TOEIC Listening", location: "Phòng Nghe", instructor: "Ms. Lan", hours: [7, 8.5] },
  { taskName: "TOEIC Reading", location: "Phòng Đọc", instructor: "Ms. Lan", hours: [8.5, 10] },
  { taskName: "Coding Practice", location: "Nhà", instructor: "", hours: [20, 22] },
  { taskName: "Gym", location: "Phòng tập X", instructor: "", hours: [17.5, 19] },
  { taskName: "CCNA Lab", location: "Phòng Lab C103", instructor: "Thầy Nam", hours: [13, 15.5] },
  { taskName: "Công nghệ Phần mềm", location: "Phòng A201", instructor: "Cô Thảo", hours: [9.5, 11.5] },
  { taskName: "Học nhóm Đồ án", location: "Thư viện", instructor: "", hours: [19, 21] },
  { taskName: "Self-study English", location: "Nhà", instructor: "", hours: [6, 7] },
  { taskName: "Hệ Điều Hành", location: "Phòng B301", instructor: "Thầy Phong", hours: [7, 9] },
  { taskName: "Cơ sở Dữ liệu", location: "Phòng A105", instructor: "Cô Linh", hours: [13.5, 15.5] },
];

const colors = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981", "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef", "#f43f5e"];

async function seed() {
  console.log("🔗 Đang kết nối MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("✅ Đã kết nối MongoDB!");

  // --- 1. Tạo hoặc tìm user ---
  let user = await User.findOne({ email: DEMO_USER.email });
  if (user) {
    console.log(`👤 User "${DEMO_USER.username}" đã tồn tại, xóa dữ liệu cũ...`);
    await Task.deleteMany({ userId: user._id });
    await Schedule.deleteMany({ userId: user._id });
  } else {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(DEMO_USER.password, salt);
    user = await User.create({
      username: DEMO_USER.username,
      email: DEMO_USER.email,
      password: hashedPassword,
    });
    console.log(`👤 Đã tạo user: ${DEMO_USER.username}`);
  }
  const userId = user._id;

  // --- 2. Tạo tasks (từ 1/1/2026 → 9/3/2026) ---
  const START_DATE = new Date("2026-01-01T00:00:00+07:00");
  const END_DATE = new Date("2026-03-09T12:00:00+07:00");
  const totalDays = Math.ceil((END_DATE - START_DATE) / (1000 * 60 * 60 * 24));

  const tasks = [];
  let taskIndex = 0;

  for (let day = 0; day < totalDays; day++) {
    const baseDate = addDays(START_DATE, day);
    // 1-4 tasks mỗi ngày
    const tasksPerDay = randomInt(1, 4);

    for (let t = 0; t < tasksPerDay; t++) {
      const title = taskTemplates[taskIndex % taskTemplates.length];
      taskIndex++;

      const createdAt = addHours(baseDate, randomInt(6, 22));

      // 70% chance đã hoàn thành
      const isComplete = Math.random() < 0.7;
      // 40% chance có deadline
      const hasDeadline = Math.random() < 0.4;

      let deadline = null;
      if (hasDeadline) {
        // Deadline 1-7 ngày sau ngày tạo
        deadline = addDays(createdAt, randomInt(1, 7));
      }

      let status = "active";
      let completedAt = null;

      if (isComplete) {
        status = "complete";
        // Hoàn thành 0.5 - 48h sau khi tạo
        completedAt = addHours(createdAt, randomInt(1, 48));
      }

      // Nếu task chưa hoàn thành + có deadline + deadline đã qua → overdue!
      // Giữ nguyên status active

      tasks.push({
        title,
        status,
        deadline,
        completedAt,
        userId,
        createdAt,
        updatedAt: completedAt || createdAt,
      });
    }
  }

  // Thêm thêm vài task quá hạn rõ ràng
  const overdueExtras = [
    { title: "Nộp báo cáo thực tập (QUÁ HẠN!)", daysAgo: 5, deadlineDaysAgo: 3 },
    { title: "Trả sách thư viện (QUÁ HẠN!)", daysAgo: 10, deadlineDaysAgo: 4 },
    { title: "Hoàn thành bài tập lớn CTDL (QUÁ HẠN!)", daysAgo: 7, deadlineDaysAgo: 2 },
    { title: "Submit PR cho dự án nhóm (QUÁ HẠN!)", daysAgo: 3, deadlineDaysAgo: 1 },
    { title: "Nộp tiền điện nước phòng trọ (QUÁ HẠN!)", daysAgo: 4, deadlineDaysAgo: 2 },
  ];

  for (const ot of overdueExtras) {
    const createdAt = addDays(END_DATE, -ot.daysAgo);
    tasks.push({
      title: ot.title,
      status: "active",
      deadline: addDays(END_DATE, -ot.deadlineDaysAgo),
      completedAt: null,
      userId,
      createdAt,
      updatedAt: createdAt,
    });
  }

  await Task.insertMany(tasks);
  console.log(`📝 Đã tạo ${tasks.length} tasks!`);

  // --- 3. Tạo schedules (10 tuần gần nhất) ---
  const schedules = [];

  for (let weekOffset = -10; weekOffset <= 0; weekOffset++) {
    const refDate = addDays(END_DATE, weekOffset * 7);
    const weekStart = getMondayOfWeek(refDate);

    // Mỗi tuần có 8-12 schedule blocks
    const blocksThisWeek = randomInt(8, 12);
    const usedSlots = new Set();

    for (let b = 0; b < blocksThisWeek; b++) {
      const template = randomItem(scheduleTemplates);
      const dayOfWeek = randomInt(2, 8); // T2-CN
      const slotKey = `${dayOfWeek}-${template.hours[0]}`;

      if (usedSlots.has(slotKey)) continue;
      usedSlots.add(slotKey);

      schedules.push({
        userId,
        taskName: template.taskName,
        dayOfWeek,
        startHour: template.hours[0],
        endHour: template.hours[1],
        location: template.location,
        instructor: template.instructor,
        color: colors[schedules.length % colors.length],
        weekStart,
        createdAt: weekStart,
        updatedAt: weekStart,
      });
    }
  }

  await Schedule.insertMany(schedules);
  console.log(`📅 Đã tạo ${schedules.length} schedule blocks!`);

  // --- Summary ---
  const completedCount = tasks.filter((t) => t.status === "complete").length;
  const overdueCount = tasks.filter(
    (t) => t.status === "active" && t.deadline && new Date(t.deadline) < END_DATE
  ).length;

  console.log("\n╔════════════════════════════════════════╗");
  console.log("║      🎉 SEED DATA HOÀN TẤT!          ║");
  console.log("╠════════════════════════════════════════╣");
  console.log(`║ 📧 Email:    ${DEMO_USER.email.padEnd(24)}║`);
  console.log(`║ 🔑 Password: ${DEMO_USER.password.padEnd(24)}║`);
  console.log(`║ 👤 Username: ${DEMO_USER.username.padEnd(24)}║`);
  console.log("╠════════════════════════════════════════╣");
  console.log(`║ 📝 Tổng tasks:      ${String(tasks.length).padEnd(17)}║`);
  console.log(`║ ✅ Đã hoàn thành:   ${String(completedCount).padEnd(17)}║`);
  console.log(`║ ⏰ Quá hạn:         ${String(overdueCount).padEnd(17)}║`);
  console.log(`║ 📅 Schedule blocks: ${String(schedules.length).padEnd(17)}║`);
  console.log("╚════════════════════════════════════════╝\n");

  await mongoose.disconnect();
  console.log("🔌 Đã ngắt kết nối MongoDB.");
}

seed().catch((err) => {
  console.error("❌ Lỗi seed:", err);
  process.exit(1);
});
