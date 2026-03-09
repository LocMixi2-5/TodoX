import React, { useEffect, useState } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Link } from "react-router";
import { useAuthStore } from "@/store/useAuthStore";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  TrendingUp,
  BarChart3,
  Timer,
  LogOut,
} from "lucide-react";

const AnalyticsPage = () => {
  const { authUser, logout } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeView, setTimeView] = useState("daily"); // daily | weekly

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get("/analytics/dashboard");
      setData(res.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Lỗi khi tải dữ liệu phân tích.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0fdfa] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-emerald-700 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { taskSummary, completionRate, timeAnalysis, dailyCompletions, weeklyCompletions, productivity, overdueTasks } = data;

  return (
    <div className="min-h-screen w-full bg-[#f0fdfa] relative">
      {/* Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(45deg,
              rgba(240,253,250,1) 0%,
              rgba(204,251,241,0.7) 30%,
              rgba(153,246,228,0.5) 60%,
              rgba(94,234,212,0.4) 100%
            ),
            radial-gradient(circle at 40% 30%, rgba(255,255,255,0.8) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(167,243,208,0.5) 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, rgba(209,250,229,0.6) 0%, transparent 45%)
          `,
        }}
      />

      <div className="container pt-6 pb-12 mx-auto relative z-10">
        <div className="w-full max-w-5xl mx-auto px-4 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="p-2 rounded-xl bg-white/70 hover:bg-white shadow-sm border border-emerald-100 text-emerald-700 hover:text-emerald-900 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-emerald-800">
                  📊 Phân tích dữ liệu
                </h1>
                <p className="text-sm text-emerald-600/70">
                  Tổng quan hiệu suất làm việc của bạn
                </p>
              </div>
            </div>
            {authUser && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-zinc-600 hidden sm:inline">
                  {authUser.username}
                </span>
                <button
                  onClick={logout}
                  className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              icon={<ListTodo className="w-6 h-6" />}
              label="Tổng công việc"
              value={taskSummary.total}
              color="blue"
            />
            <StatCard
              icon={<CheckCircle2 className="w-6 h-6" />}
              label="Hoàn thành"
              value={taskSummary.completed}
              color="green"
            />
            <StatCard
              icon={<Clock className="w-6 h-6" />}
              label="Đang làm"
              value={taskSummary.pending}
              color="amber"
            />
            <StatCard
              icon={<AlertTriangle className="w-6 h-6" />}
              label="Quá hạn"
              value={taskSummary.overdue}
              color="red"
            />
          </div>

          {/* Row: Completion Rate + Time Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Completion Rate Ring */}
            <GlassCard title="Tỉ lệ hoàn thành" icon={<TrendingUp className="w-5 h-5" />}>
              <div className="flex items-center justify-center py-4">
                <CompletionRing rate={completionRate} />
              </div>
              <div className="text-center">
                <p className="text-sm text-zinc-500">
                  {taskSummary.completed} / {taskSummary.total} công việc đã hoàn thành
                </p>
              </div>
            </GlassCard>

            {/* Time Analysis */}
            <GlassCard title="Phân tích thời gian" icon={<Timer className="w-5 h-5" />}>
              {timeAnalysis.length > 0 ? (
                <div className="space-y-3 py-2">
                  {timeAnalysis.slice(0, 6).map((item, i) => (
                    <TimeBar key={i} item={item} maxHours={timeAnalysis[0]?.totalHours || 1} index={i} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-zinc-400 text-sm">
                  Chưa có dữ liệu thời khóa biểu
                </div>
              )}
            </GlassCard>
          </div>

          {/* Tasks Over Time Chart */}
          <GlassCard
            title="Công việc theo thời gian"
            icon={<BarChart3 className="w-5 h-5" />}
            headerRight={
              <div className="flex gap-1 bg-emerald-50 rounded-lg p-0.5">
                <button
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    timeView === "daily"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-emerald-700 hover:bg-emerald-100"
                  }`}
                  onClick={() => setTimeView("daily")}
                >
                  Ngày
                </button>
                <button
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    timeView === "weekly"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-emerald-700 hover:bg-emerald-100"
                  }`}
                  onClick={() => setTimeView("weekly")}
                >
                  Tuần
                </button>
              </div>
            }
          >
            <div className="py-2">
              {timeView === "daily" ? (
                <BarChartSVG data={dailyCompletions} labelKey="date" valueKey="count" formatLabel={formatDateShort} />
              ) : (
                <BarChartSVG data={weeklyCompletions} labelKey="weekLabel" valueKey="count" />
              )}
            </div>
          </GlassCard>

          {/* Productivity Metrics */}
          <GlassCard title="Hiệu suất làm việc" icon={<TrendingUp className="w-5 h-5" />}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
              <MetricBox label="TB hoàn thành" value={`${productivity.avgCompletionTimeHours}h`} sub="thời gian / task" />
              <MetricBox label="Tasks / ngày" value={productivity.tasksPerDay} sub="30 ngày gần nhất" />
              <MetricBox label="Tasks / tuần" value={productivity.tasksPerWeek} sub="12 tuần gần nhất" />
              <MetricBox label="Giờ tuần này" value={`${productivity.totalScheduleHoursThisWeek}h`} sub="từ thời khóa biểu" />
            </div>
          </GlassCard>

          {/* Overdue Tasks */}
          <GlassCard
            title={`Công việc quá hạn (${overdueTasks.length})`}
            icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
          >
            {overdueTasks.length > 0 ? (
              <div className="space-y-2 py-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {overdueTasks.map((task) => (
                  <div
                    key={task._id}
                    className="flex items-center justify-between p-3 bg-red-50/80 border border-red-100 rounded-xl"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-800 truncate">
                        {task.title}
                      </p>
                      <p className="text-xs text-red-500">
                        Hạn: {new Date(task.deadline).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <span className="ml-3 px-2 py-1 text-xs font-bold bg-red-100 text-red-700 rounded-lg whitespace-nowrap">
                      Trễ {task.daysOverdue} ngày
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-emerald-500 text-sm">
                ✅ Không có công việc quá hạn — tuyệt vời!
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

// ────── Sub-components ──────

const colorSchemes = {
  blue: { bg: "bg-blue-50", icon: "text-blue-500", border: "border-blue-100", value: "text-blue-700" },
  green: { bg: "bg-emerald-50", icon: "text-emerald-500", border: "border-emerald-100", value: "text-emerald-700" },
  amber: { bg: "bg-amber-50", icon: "text-amber-500", border: "border-amber-100", value: "text-amber-700" },
  red: { bg: "bg-red-50", icon: "text-red-500", border: "border-red-100", value: "text-red-700" },
};

function StatCard({ icon, label, value, color }) {
  const c = colorSchemes[color];
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 ${c.bg} border ${c.border} shadow-sm hover:shadow-md transition-all duration-300 group`}
    >
      <div className={`${c.icon} mb-2 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <p className={`text-2xl sm:text-3xl font-bold ${c.value}`}>{value}</p>
      <p className="text-xs sm:text-sm text-zinc-500 mt-1">{label}</p>
      {/* Decorative circle */}
      <div
        className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full ${c.bg} opacity-60`}
      />
    </div>
  );
}

function GlassCard({ title, icon, children, headerRight }) {
  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-emerald-100/60 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-emerald-600">{icon}</span>
          <h3 className="font-semibold text-zinc-700 text-sm sm:text-base">{title}</h3>
        </div>
        {headerRight}
      </div>
      {children}
    </div>
  );
}

function CompletionRing({ rate }) {
  const radius = 70;
  const stroke = 10;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (rate / 100) * circumference;

  const getColor = (r) => {
    if (r >= 75) return { ring: "#10b981", bg: "#d1fae5" };
    if (r >= 50) return { ring: "#f59e0b", bg: "#fef3c7" };
    if (r >= 25) return { ring: "#f97316", bg: "#ffedd5" };
    return { ring: "#ef4444", bg: "#fee2e2" };
  };

  const colors = getColor(rate);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2}>
        {/* Background circle */}
        <circle
          stroke={colors.bg}
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Progress circle */}
        <circle
          stroke={colors.ring}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference + " " + circumference}
          strokeDashoffset={strokeDashoffset}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
            transition: "stroke-dashoffset 1s ease-in-out",
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold" style={{ color: colors.ring }}>
          {rate}%
        </span>
        <span className="text-xs text-zinc-400">hoàn thành</span>
      </div>
    </div>
  );
}

const barColors = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

function TimeBar({ item, maxHours, index }) {
  const widthPct = maxHours > 0 ? (item.totalHours / maxHours) * 100 : 0;
  const color = barColors[index % barColors.length];

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-600 font-medium truncate max-w-[180px]">
          {item.category}
        </span>
        <span className="text-sm font-semibold" style={{ color }}>
          {item.totalHours}h
        </span>
      </div>
      <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${widthPct}%`,
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
          }}
        />
      </div>
    </div>
  );
}

function BarChartSVG({ data, labelKey, valueKey, formatLabel }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-zinc-400 text-sm">
        Chưa có dữ liệu
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d[valueKey]), 1);
  const chartHeight = 160;
  const barWidth = Math.max(6, Math.min(20, Math.floor(600 / data.length) - 4));
  const gap = Math.max(2, Math.min(6, Math.floor(200 / data.length)));
  const totalWidth = data.length * (barWidth + gap);

  return (
    <div className="overflow-x-auto pb-2 custom-scrollbar">
      <svg
        width={Math.max(totalWidth + 40, 300)}
        height={chartHeight + 40}
        className="block mx-auto"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
          <g key={i}>
            <line
              x1={30}
              y1={chartHeight - chartHeight * pct + 10}
              x2={totalWidth + 35}
              y2={chartHeight - chartHeight * pct + 10}
              stroke="#e5e7eb"
              strokeDasharray="4,4"
            />
            <text
              x={26}
              y={chartHeight - chartHeight * pct + 14}
              textAnchor="end"
              fontSize={10}
              fill="#9ca3af"
            >
              {Math.round(maxVal * pct)}
            </text>
          </g>
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const barH = maxVal > 0 ? (d[valueKey] / maxVal) * chartHeight : 0;
          const x = 35 + i * (barWidth + gap);
          const y = chartHeight - barH + 10;
          const label = formatLabel ? formatLabel(d[labelKey]) : d[labelKey];

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={barWidth / 2}
                fill={d[valueKey] > 0 ? "#10b981" : "#e5e7eb"}
                opacity={0.85}
              >
                <title>{`${label}: ${d[valueKey]}`}</title>
              </rect>
              {/* Label every N bars to avoid clutter */}
              {(data.length <= 15 || i % Math.ceil(data.length / 10) === 0) && (
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 24}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#9ca3af"
                  className="select-none"
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function MetricBox({ label, value, sub }) {
  return (
    <div className="text-center p-3 rounded-xl bg-emerald-50/60 border border-emerald-100/50">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-emerald-700">{value}</p>
      <p className="text-[10px] text-zinc-400 mt-1">{sub}</p>
    </div>
  );
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export default AnalyticsPage;
