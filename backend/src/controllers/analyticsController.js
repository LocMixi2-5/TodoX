import Task from "../models/Task.js";
import { Schedule } from "../models/Schedule.js";

export const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // ============ 1. Task Summary ============
    const allTasks = await Task.find({ userId }).lean();
    const total = allTasks.length;
    const completed = allTasks.filter((t) => t.status === "complete").length;
    const pending = allTasks.filter((t) => t.status === "active").length;

    // Overdue: deadline < now AND status !== "complete"
    const overdueTasks = allTasks.filter(
      (t) => t.deadline && new Date(t.deadline) < now && t.status !== "complete"
    );
    const overdue = overdueTasks.length;

    // ============ 2. Completion Rate ============
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // ============ 3. Time Analysis (from Schedule) ============
    let timeAnalysis = [];
    try {
      const allSchedules = await Schedule.find({ userId }).lean();

      const categoryMap = {};
      for (const s of allSchedules) {
        const hours = (s.endHour || 0) - (s.startHour || 0);
        if (hours > 0) {
          if (!categoryMap[s.taskName]) {
            categoryMap[s.taskName] = 0;
          }
          categoryMap[s.taskName] += hours;
        }
      }

      timeAnalysis = Object.entries(categoryMap)
        .map(([category, totalHours]) => ({
          category,
          totalHours: Math.round(totalHours * 10) / 10,
        }))
        .sort((a, b) => b.totalHours - a.totalHours);
    } catch (scheduleErr) {
      console.error("Error fetching schedules for analytics:", scheduleErr);
    }

    // ============ 4. Daily Completions (last 30 days) ============
    const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);

    const completedTasks = allTasks.filter(
      (t) => t.status === "complete" && t.completedAt
    );

    // Build a map for last 30 days
    const dailyMap = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const key = formatDateKey(d);
      dailyMap[key] = 0;
    }

    for (const t of completedTasks) {
      const key = formatDateKey(new Date(t.completedAt));
      if (dailyMap[key] !== undefined) {
        dailyMap[key]++;
      }
    }

    const dailyCompletions = Object.entries(dailyMap).map(([date, count]) => ({
      date,
      count,
    }));

    // ============ 5. Weekly Completions (last 12 weeks) ============
    const twelveWeeksAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 83);

    const weeklyBuckets = [];
    for (let i = 0; i < 12; i++) {
      const weekStart = new Date(twelveWeeksAgo);
      weekStart.setDate(weekStart.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      weeklyBuckets.push({
        weekLabel: `T${i + 1}`,
        startDate: formatDateKey(weekStart),
        start: weekStart,
        end: weekEnd,
        count: 0,
      });
    }

    for (const t of completedTasks) {
      if (!t.completedAt) continue;
      const completedDate = new Date(t.completedAt);
      for (let i = weeklyBuckets.length - 1; i >= 0; i--) {
        if (completedDate >= weeklyBuckets[i].start && completedDate < weeklyBuckets[i].end) {
          weeklyBuckets[i].count++;
          break;
        }
      }
    }

    const weeklyCompletions = weeklyBuckets.map(({ weekLabel, startDate, count }) => ({
      weekLabel,
      startDate,
      count,
    }));

    // ============ 6. Productivity Metrics ============
    const tasksWithCompletionTime = completedTasks.filter(
      (t) => t.completedAt && t.createdAt
    );

    let avgCompletionTimeHours = 0;
    if (tasksWithCompletionTime.length > 0) {
      const totalMs = tasksWithCompletionTime.reduce((sum, t) => {
        return sum + (new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime());
      }, 0);
      avgCompletionTimeHours =
        Math.round((totalMs / tasksWithCompletionTime.length / 3600000) * 10) / 10;
    }

    // Tasks per day (last 30 days)
    const tasksLast30 = completedTasks.filter(
      (t) => t.completedAt && new Date(t.completedAt) >= thirtyDaysAgo
    ).length;
    const tasksPerDay = Math.round((tasksLast30 / 30) * 10) / 10;

    // Tasks per week (last 12 weeks)
    const tasksLast12Weeks = completedTasks.filter(
      (t) => t.completedAt && new Date(t.completedAt) >= twelveWeeksAgo
    ).length;
    const tasksPerWeek = Math.round((tasksLast12Weeks / 12) * 10) / 10;

    // Total schedule hours this week
    let totalScheduleHoursThisWeek = 0;
    try {
      const mondayOfThisWeek = getMondayOfWeek(now);
      const allSchedules = await Schedule.find({ userId, weekStart: mondayOfThisWeek }).lean();
      totalScheduleHoursThisWeek = allSchedules.reduce(
        (sum, s) => sum + ((s.endHour || 0) - (s.startHour || 0)),
        0
      );
    } catch (err) {
      console.error("Error fetching this week's schedules:", err);
    }

    // ============ 7. Overdue Tasks List ============
    const overdueTasksList = overdueTasks.map((t) => ({
      _id: t._id,
      title: t.title,
      deadline: t.deadline,
      createdAt: t.createdAt,
      daysOverdue: Math.ceil((now.getTime() - new Date(t.deadline).getTime()) / (1000 * 60 * 60 * 24)),
    }));

    // ============ Response ============
    res.status(200).json({
      taskSummary: { total, completed, pending, overdue },
      completionRate,
      timeAnalysis,
      dailyCompletions,
      weeklyCompletions,
      productivity: {
        avgCompletionTimeHours,
        tasksPerDay,
        tasksPerWeek,
        totalScheduleHoursThisWeek:
          Math.round(totalScheduleHoursThisWeek * 10) / 10,
      },
      overdueTasks: overdueTasksList,
    });
  } catch (error) {
    console.error("Error in getDashboard:", error.message, error.stack);
    res.status(500).json({ error: "Lỗi hệ thống khi lấy dữ liệu analytics." });
  }
};

// Helpers
function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
