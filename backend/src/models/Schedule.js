import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    taskName: {
      type: String,
      required: true,
      trim: true,
    },
    dayOfWeek: {
      type: Number, // 2 = Thứ 2, 8 = Chủ nhật
      required: true,
      min: 2,
      max: 8,
    },
    startHour: {
      type: Number, // Dạng thập phân, VD: 6.5 = 6:30
      required: true,
    },
    endHour: {
      type: Number,
      required: true,
    },
    location: {
      type: String, // Địa điểm học
      default: "",
    },
    instructor: {
      type: String, // Người dạy
      default: "",
    },
    color: {
      type: String, // Màu nền của block trên UI
      default: "#34d399",
    },
    weekStart: {
      type: Date, // Ngày thứ 2 đầu tuần (ISO Monday), dùng để phân biệt lịch theo tuần
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index tìm kiếm nhanh theo user + tuần
scheduleSchema.index({ userId: 1, weekStart: 1 });

// TTL index: tự động xoá schedule sau 90 ngày (3 tháng)
scheduleSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });

export const Schedule = mongoose.model("Schedule", scheduleSchema);
