import { Schedule } from "../models/Schedule.js";
import Task from "../models/Task.js";

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
