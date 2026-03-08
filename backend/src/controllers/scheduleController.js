import { Schedule } from "../models/Schedule.js";
import Task from "../models/Task.js";
import { parseTasksWithAI } from "../lib/gemini.js";

// Bảng màu cho các môn học
const colors = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981", "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef", "#f43f5e"];

// Helper: lấy ngày thứ Hai đầu tuần từ 1 Date bất kỳ
function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=CN, 1=T2, ...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// Helper: kiểm tra 2 block có overlap giờ không
function isOverlapping(blockA, blockB) {
  return blockA.dayOfWeek === blockB.dayOfWeek &&
    blockA.startHour < blockB.endHour &&
    blockA.endHour > blockB.startHour;
}

export const generateSchedule = async (req, res) => {
  try {
    const { promptText, weekStart: weekStartStr, forceOverwrite } = req.body;
    console.log("[Schedule] Received promptText:", promptText);
    console.log("[Schedule] weekStart:", weekStartStr, "forceOverwrite:", forceOverwrite);

    if (!promptText) {
      return res.status(400).json({ error: "Vui lòng cung cấp văn bản yêu cầu." });
    }

    // Xác định weekStart
    let weekStart;
    if (weekStartStr) {
      weekStart = getMondayOfWeek(new Date(weekStartStr));
    } else {
      weekStart = getMondayOfWeek(new Date());
    }

    // Lấy danh sách nhiệm vụ TodoX hiện tại của User
    const userTasks = await Task.find({ userId: req.user._id, status: "active" });

    // AI phân tích và xếp lịch
    let generatedBlocks = await parseTasksWithAI(promptText, userTasks);
    console.log("[Schedule] AI returned blocks:", JSON.stringify(generatedBlocks));

    if (!Array.isArray(generatedBlocks) || generatedBlocks.length === 0) {
      return res.status(400).json({ error: "Thất bại: AI không trả về được thời khóa biểu nào." });
    }

    // Lấy lịch hiện tại của tuần này
    const existingSchedules = await Schedule.find({ userId: req.user._id, weekStart });

    // Kiểm tra overlap giờ giữa blocks MỚI và blocks HIỆN TẠI
    if (existingSchedules.length > 0 && !forceOverwrite) {
      const dayNames = { 2: "Thứ 2", 3: "Thứ 3", 4: "Thứ 4", 5: "Thứ 5", 6: "Thứ 6", 7: "Thứ 7", 8: "Chủ nhật" };
      const conflicts = [];

      for (const newBlock of generatedBlocks) {
        for (const existing of existingSchedules) {
          if (isOverlapping(newBlock, existing)) {
            conflicts.push({
              existingTask: existing.taskName,
              newTask: newBlock.taskName,
              day: dayNames[newBlock.dayOfWeek],
              time: `${formatHour(existing.startHour)}-${formatHour(existing.endHour)}`,
            });
          }
        }
      }

      if (conflicts.length > 0) {
        const conflictDetails = conflicts.map(c =>
          `${c.day}: "${c.newTask}" trùng với "${c.existingTask}" (${c.time})`
        );

        return res.status(409).json({
          error: "Trùng giờ!",
          conflicts,
          message: `Phát hiện ${conflicts.length} ca bị trùng giờ:\n${conflictDetails.join("\n")}`,
        });
      }
    }

    // Nếu forceOverwrite → xoá các block bị overlap trước
    if (forceOverwrite && existingSchedules.length > 0) {
      const idsToDelete = [];
      for (const newBlock of generatedBlocks) {
        for (const existing of existingSchedules) {
          if (isOverlapping(newBlock, existing)) {
            idsToDelete.push(existing._id);
          }
        }
      }
      if (idsToDelete.length > 0) {
        await Schedule.deleteMany({ _id: { $in: idsToDelete } });
        console.log("[Schedule] Deleted", idsToDelete.length, "overlapping blocks.");
      }
    }

    // Tạo mảng insert
    let colorIndex = 0;
    const taskColors = {};

    // Lấy lại màu từ lịch hiện tại nếu có (để giữ nhất quán)
    const currentSchedules = await Schedule.find({ userId: req.user._id, weekStart });
    for (const s of currentSchedules) {
      if (s.color && s.taskName && !taskColors[s.taskName]) {
        taskColors[s.taskName] = s.color;
        colorIndex++;
      }
    }

    const scheduleDocs = generatedBlocks.map(block => {
      if (!taskColors[block.taskName]) {
        taskColors[block.taskName] = colors[colorIndex % colors.length];
        colorIndex++;
      }

      return {
        userId: req.user._id,
        taskName: block.taskName,
        dayOfWeek: block.dayOfWeek,
        startHour: block.startHour,
        endHour: block.endHour,
        location: block.location || "",
        instructor: block.instructor || "",
        color: taskColors[block.taskName],
        weekStart,
      };
    });

    const inserted = await Schedule.insertMany(scheduleDocs);
    console.log("[Schedule] SUCCESS! Inserted", inserted.length, "blocks for week", weekStart.toISOString());

    // Trả về toàn bộ lịch tuần (cũ + mới)
    const allSchedules = await Schedule.find({ userId: req.user._id, weekStart });
    res.status(201).json(allSchedules);

  } catch (error) {
    console.error("[Schedule] CAUGHT ERROR:", error.message);
    res.status(500).json({ error: error.message || "Lỗi hệ thống khi sinh thời khóa biểu." });
  }
};

function formatHour(decimal) {
  const h = Math.floor(decimal);
  const m = Math.round((decimal - h) * 60);
  return `${h < 10 ? "0" : ""}${h}:${m === 0 ? "00" : String(m).padStart(2, "0")}`;
}

export const getWeeklySchedule = async (req, res) => {
  try {
    let weekStart;
    if (req.query.weekStart) {
      weekStart = getMondayOfWeek(new Date(req.query.weekStart));
    } else {
      weekStart = getMondayOfWeek(new Date());
    }

    const schedules = await Schedule.find({ userId: req.user._id, weekStart });
    res.status(200).json(schedules);
  } catch (error) {
    console.error("Error in getWeeklySchedule:", error);
    res.status(500).json({ error: "Lỗi hệ thống khi lấy thời khóa biểu." });
  }
};

// Xoá 1 block lịch theo ID
export const deleteScheduleBlock = async (req, res) => {
  try {
    const { id } = req.params;
    const block = await Schedule.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!block) {
      return res.status(404).json({ error: "Không tìm thấy block lịch trình." });
    }

    res.status(200).json({ message: "Đã xoá block thành công.", deletedBlock: block });
  } catch (error) {
    console.error("Error in deleteScheduleBlock:", error);
    res.status(500).json({ error: "Lỗi khi xoá block." });
  }
};

// Xoá toàn bộ lịch của 1 tuần
export const deleteWeekSchedule = async (req, res) => {
  try {
    const weekStart = getMondayOfWeek(new Date(req.params.weekStart));

    const result = await Schedule.deleteMany({ userId: req.user._id, weekStart });

    res.status(200).json({
      message: `Đã xoá ${result.deletedCount} block lịch của tuần.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error in deleteWeekSchedule:", error);
    res.status(500).json({ error: "Lỗi khi xoá lịch tuần." });
  }
};

// Thêm lịch trực tiếp (không qua AI)
export const addSchedule = async (req, res) => {
  try {
    const { taskName, dayOfWeek, startHour, endHour, location, instructor, weekStart: weekStartStr, forceOverwrite } = req.body;
    
    if (!taskName || !dayOfWeek || startHour === undefined || endHour === undefined) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc." });
    }

    const weekStart = getMondayOfWeek(new Date(weekStartStr || new Date()));
    const newBlock = { dayOfWeek, startHour, endHour, taskName, location, instructor };

    // Kiểm tra trùng lặp
    const existingSchedules = await Schedule.find({ userId: req.user._id, weekStart });
    
    const isOverlapping = (a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return false;
        return a.startHour < b.endHour && a.endHour > b.startHour;
    };

    const conflicts = existingSchedules.filter(s => isOverlapping(newBlock, s));

    if (conflicts.length > 0 && !forceOverwrite) {
        const dayNames = { 2: "Thứ 2", 3: "Thứ 3", 4: "Thứ 4", 5: "Thứ 5", 6: "Thứ 6", 7: "Thứ 7", 8: "Chủ nhật" };
        
        const formatHour = (decimal) => {
            const h = Math.floor(decimal);
            const m = Math.round((decimal - h) * 60);
            return `${h}:${m === 0 ? "00" : String(m).padStart(2, "0")}`;
        };

        return res.status(409).json({
          error: "Trùng giờ!",
          conflicts: conflicts.map(c => ({
              existingTask: c.taskName,
              newTask: taskName,
              day: dayNames[c.dayOfWeek],
              time: `${formatHour(c.startHour)}-${formatHour(c.endHour)}`,
          })),
        });
    }

    if (forceOverwrite && conflicts.length > 0) {
      await Schedule.deleteMany({ _id: { $in: conflicts.map(c => c._id) } });
    }

    // Colors mapping (reusing existing colors array logic if possible, or defining local fallback)
    const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];
    
    // Lấy màu từ task cùng tên trước đó hoặc sinh màu mới
    let color = "#10b981";
    const sameTask = await Schedule.findOne({ userId: req.user._id, taskName });
    if (sameTask) {
      color = sameTask.color;
    } else {
      const allTasks = await Schedule.distinct("taskName", { userId: req.user._id });
      color = colors[allTasks.length % colors.length];
    }

    await Schedule.create({
      userId: req.user._id,
      taskName,
      dayOfWeek,
      startHour,
      endHour,
      location: location || "",
      instructor: instructor || "",
      color,
      weekStart,
    });

    const allSchedules = await Schedule.find({ userId: req.user._id, weekStart });
    res.status(201).json(allSchedules);
  } catch (error) {
    console.error("Error in addSchedule:", error);
    res.status(500).json({ error: "Lỗi khi thêm lịch." });
  }
};
