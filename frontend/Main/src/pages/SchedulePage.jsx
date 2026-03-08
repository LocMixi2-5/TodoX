import React, { useState, useEffect, useCallback } from "react";
import api from "../lib/axios";
import { toast } from "sonner";
import { Loader2, Calendar as CalendarIcon, ArrowLeft, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import WeeklyCalendar from "../components/WeeklyCalendar";
import { Link } from "react-router";

// Helper: lấy ngày thứ Hai đầu tuần
function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=CN, 1=T2, ...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// Helper: format ngày DD/MM
function formatShort(date) {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Helper: format ngày cho label tuần
function formatWeekLabel(monday) {
  const sun = new Date(monday);
  sun.setDate(sun.getDate() + 6);
  return `${formatShort(monday)} – ${formatShort(sun)}`;
}

// Helper: offset tuần
function addWeeks(date, weeks) {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return getMondayOfWeek(d);
}

// Helper: check nếu 2 Monday cùng tuần
function isSameWeek(a, b) {
  return a.getTime() === b.getTime();
}

export default function SchedulePage() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [schedules, setSchedules] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Week navigation
    const [selectedWeek, setSelectedWeek] = useState(() => getMondayOfWeek(new Date()));
    const currentWeekMonday = getMondayOfWeek(new Date());

    // Giới hạn 3 tháng từ hôm nay
    const minWeek = addWeeks(currentWeekMonday, -13); // ~3 tháng trước
    const maxWeek = addWeeks(currentWeekMonday, 13);  // ~3 tháng sau

    const fetchSchedule = useCallback(async (weekStart) => {
        setIsLoading(true);
        try {
            const res = await api.get("/schedules/weekly", {
                params: { weekStart: weekStart.toISOString() },
            });
            setSchedules(res.data);
        } catch (error) {
            toast.error("Không thể lấy dữ liệu lịch trình.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSchedule(selectedWeek);
    }, [selectedWeek, fetchSchedule]);

    const goToPrevWeek = () => {
        const prev = addWeeks(selectedWeek, -1);
        if (prev >= minWeek) setSelectedWeek(prev);
    };

    const goToNextWeek = () => {
        const next = addWeeks(selectedWeek, 1);
        if (next <= maxWeek) setSelectedWeek(next);
    };

    const goToCurrentWeek = () => {
        setSelectedWeek(currentWeekMonday);
    };

    // Thêm lịch trực tiếp (cho form 5 ô)
    const handleAddDirect = async (forceOverwrite = false) => {
        const taskName = document.getElementById('input-task').value;
        const dayText = document.getElementById('input-day').value;
        const start = document.getElementById('input-time-start').value;
        const end = document.getElementById('input-time-end').value;
        const location = document.getElementById('input-location').value;
        const instructor = document.getElementById('input-instructor').value;

        if (!taskName || !dayText || !start || !end) {
            toast.error("Vui lòng điền đủ thông tin bắt buộc!");
            return;
        }

        const dayMap = { "Thứ 2": 2, "Thứ 3": 3, "Thứ 4": 4, "Thứ 5": 5, "Thứ 6": 6, "Thứ 7": 7, "Chủ nhật": 8 };
        const dayOfWeek = dayMap[dayText];

        const parseToDecimal = (timeStr) => {
            const [h, m] = timeStr.split(':').map(Number);
            return h + m / 60;
        };

        const startHour = parseToDecimal(start);
        const endHour = parseToDecimal(end);

        setIsGenerating(true); // Dùng chung loading state
        try {
            const res = await api.post("/schedules/add", {
                taskName,
                dayOfWeek,
                startHour,
                endHour,
                location,
                instructor,
                weekStart: selectedWeek.toISOString(),
                forceOverwrite,
            });
            toast.success("Đã thêm vào lịch trình thành công!");
            setSchedules(res.data);
            // Clear form
            document.getElementById('input-task').value = "";
            document.getElementById('input-location').value = "";
            document.getElementById('input-instructor').value = "";
        } catch (error) {
            handleError(error, () => handleAddDirect(true));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleError = (error, retryFn) => {
        if (error.response?.status === 409) {
            const { conflicts } = error.response.data;
            toast.error(
                <div>
                    <p className="font-bold mb-1">⚠️ Trùng giờ!</p>
                    <ul className="text-sm mb-2 list-disc pl-4">
                        {conflicts.map((c, i) => (
                            <li key={i}>{c.day}: "{c.newTask}" trùng với "{c.existingTask} ({c.time})"</li>
                        ))}
                    </ul>
                    <div className="flex gap-2 mt-2">
                        <button onClick={() => { toast.dismiss(); retryFn(); }} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold">Ghi đè</button>
                        <button onClick={() => toast.dismiss()} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold">Hoàn tác</button>
                    </div>
                </div>,
                { duration: 10000 }
            );
        } else {
            toast.error(error.response?.data?.error || "Có lỗi xảy ra.");
        }
    };

    // Generate schedule with conflict detection (Cho NLP)
    const handleGenerate = async (forceOverwrite = false, builtPrompt = null) => {
        const textToSend = builtPrompt || prompt;
        if (!textToSend.trim()) return;

        setIsGenerating(true);
        try {
            const res = await api.post("/schedules/generate", {
                promptText: textToSend,
                weekStart: selectedWeek.toISOString(),
                forceOverwrite,
            });
            toast.success("Đã sinh thời khóa biểu thành công!");
            setSchedules(res.data);
            setPrompt("");
        } catch (error) {
            handleError(error, () => handleGenerate(true, textToSend));
        } finally {
            setIsGenerating(false);
        }
    };

    // Xoá 1 block
    const handleDeleteBlock = async (blockId) => {
        try {
            await api.delete(`/schedules/block/${blockId}`);
            setSchedules(prev => prev.filter(s => s._id !== blockId));
            toast.success("Đã xoá ca thành công!");
        } catch (error) {
            toast.error("Không thể xoá ca này.");
        }
    };

    // Xoá toàn bộ lịch tuần
    const handleDeleteWeek = async () => {
        if (schedules.length === 0) {
            toast.error("Không có lịch trình nào để xoá.");
            return;
        }

        toast(
            <div>
                <p className="font-bold mb-1">🗑️ Xoá lịch tuần này?</p>
                <p className="text-sm mb-2">Toàn bộ {schedules.length} ca sẽ bị xoá vĩnh viễn.</p>
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={async () => {
                            toast.dismiss();
                            try {
                                await api.delete(`/schedules/week/${selectedWeek.toISOString()}`);
                                setSchedules([]);
                                toast.success("Đã xoá toàn bộ lịch tuần!");
                            } catch {
                                toast.error("Không thể xoá lịch tuần.");
                            }
                        }}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors"
                    >
                        Xoá hết
                    </button>
                    <button
                        onClick={() => toast.dismiss()}
                        className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 transition-colors"
                    >
                        Huỷ
                    </button>
                </div>
            </div>,
            { duration: 10000 }
        );
    };

    const isCurrentWeek = isSameWeek(selectedWeek, currentWeekMonday);

    return (
        <div className="min-h-screen bg-[#f0fdfa] text-slate-800 p-6 md:p-10 font-sans relative">
            {/* Mint Fresh Breeze Background */}
            <div
                className="fixed inset-0 z-0"
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

            <div className="max-w-7xl mx-auto space-y-8 relative z-10">
                
                <div className="flex items-center justify-between">
                    <div>
                        <Link to="/" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-teal-600 transition-colors mb-4">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Quay lại Dashboard
                        </Link>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3 text-slate-800">
                            <CalendarIcon className="text-teal-500 w-8 h-8"/> Smart Schedule
                        </h1>
                        <p className="text-slate-600 mt-2 max-w-2xl font-medium">
                            Tự động quản lý và tối ưu hóa thời gian làm việc của bạn trên biểu đồ 7 ngày (từ 06:00 đến 00:00).
                        </p>
                    </div>
                </div>

                {/* Input Area */}
                <div className="bg-white/60 border border-white/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
                    <div className="flex items-center gap-2 mb-4 text-slate-700">
                        <CalendarIcon className="w-5 h-5 text-teal-600" />
                        <h3 className="font-bold text-lg">Khởi tạo lịch học / làm việc</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                        {/* 1. Tên Việc */}
                        <div className="flex flex-col gap-1.5 lg:col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">1. Tên công việc/Môn học <span className="text-red-500">*</span></label>
                            <input 
                                type="text"
                                className="w-full bg-white/70 border border-slate-200/60 rounded-xl px-4 py-2.5 text-slate-700 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all placeholder-slate-400 font-medium shadow-sm"
                                placeholder="VD: Lập trình Web"
                                id="input-task"
                            />
                        </div>

                        {/* 2. Thứ */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">2. Thứ <span className="text-red-500">*</span></label>
                            <select 
                                id="input-day"
                                className="w-full bg-white/70 border border-slate-200/60 rounded-xl px-4 py-2.5 text-slate-700 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all font-bold appearance-none cursor-pointer shadow-sm"
                            >
                                <option value="Thứ 2">Thứ 2</option>
                                <option value="Thứ 3">Thứ 3</option>
                                <option value="Thứ 4">Thứ 4</option>
                                <option value="Thứ 5">Thứ 5</option>
                                <option value="Thứ 6">Thứ 6</option>
                                <option value="Thứ 7">Thứ 7</option>
                                <option value="Chủ nhật">Chủ nhật</option>
                            </select>
                        </div>

                        {/* 3. Thời gian */}
                        <div className="flex flex-col gap-1.5 lg:col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">3. Khung giờ <span className="text-red-500">*</span></label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="time"
                                    id="input-time-start"
                                    className="w-full bg-white/70 border border-slate-200/60 rounded-xl px-3 py-2.5 text-slate-700 font-bold focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all shadow-sm"
                                />
                                <span className="text-slate-400 font-bold text-lg">-</span>
                                <input 
                                    type="time"
                                    id="input-time-end"
                                    className="w-full bg-white/70 border border-slate-200/60 rounded-xl px-3 py-2.5 text-slate-700 font-bold focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        {/* 4. Địa điểm */}
                        <div className="flex flex-col gap-1.5 lg:col-span-2 md:col-span-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">4. Địa điểm <span className="text-slate-400 font-normal lowercase">(Tùy chọn)</span></label>
                            <input 
                                type="text"
                                id="input-location"
                                className="w-full bg-white/70 border border-slate-200/60 rounded-xl px-4 py-2.5 text-slate-700 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all placeholder-slate-400 font-medium shadow-sm"
                                placeholder="VD: Phòng 401-A2"
                            />
                        </div>

                        {/* 5. Người dạy */}
                        <div className="flex flex-col gap-1.5 lg:col-span-3 md:col-span-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">5. Người dạy <span className="text-slate-400 font-normal lowercase">(Tùy chọn)</span></label>
                            <input 
                                type="text"
                                id="input-instructor"
                                className="w-full bg-white/70 border border-slate-200/60 rounded-xl px-4 py-2.5 text-slate-700 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all placeholder-slate-400 font-medium shadow-sm"
                                placeholder="VD: Thầy N.Đ.Quân"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-200/50">
                        <button 
                            disabled={isGenerating}
                            onClick={() => handleAddDirect(false)}
                            className="bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-white px-8 py-3.5 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                        >
                            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CalendarIcon className="w-5 h-5" />}
                            {isGenerating ? "Đang xử lý..." : "Thêm vào lịch tuần"}
                        </button>
                    </div>
                </div>

                {/* Week Picker + Calendar */}
                <div className="bg-white/40 p-6 rounded-3xl border border-white/60 shadow-xl backdrop-blur-md">
                    
                    {/* Week Navigator */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-extrabold flex items-center gap-2 text-slate-800">
                            📅 Thời Khóa Biểu
                            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-teal-600" />}
                        </h2>

                        <div className="flex items-center gap-2">
                            {/* Nút xoá lịch tuần */}
                            <button
                                onClick={handleDeleteWeek}
                                className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 transition-all border border-red-200/60"
                                title="Xoá toàn bộ lịch tuần này"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-1 bg-white/80 rounded-xl border border-slate-200/80 p-1 shadow-sm">
                                <button
                                    onClick={goToPrevWeek}
                                    disabled={selectedWeek <= minWeek}
                                    className="p-2 rounded-lg hover:bg-teal-50 text-slate-600 hover:text-teal-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={goToCurrentWeek}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all min-w-[160px] ${
                                        isCurrentWeek
                                            ? "bg-teal-500 text-white shadow-md shadow-teal-500/30"
                                            : "bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700"
                                    }`}
                                >
                                    {isCurrentWeek ? "📍 Tuần này" : formatWeekLabel(selectedWeek)}
                                </button>

                                <button
                                    onClick={goToNextWeek}
                                    disabled={selectedWeek >= maxWeek}
                                    className="p-2 rounded-lg hover:bg-teal-50 text-slate-600 hover:text-teal-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Nút quay về tuần hiện tại khi đang ở tuần khác */}
                            {!isCurrentWeek && (
                                <button
                                    onClick={goToCurrentWeek}
                                    className="px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-600 text-xs font-bold transition-all border border-teal-200/60"
                                >
                                    📍 Hôm nay
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Week label khi không phải tuần hiện tại */}
                    {!isCurrentWeek && (
                        <div className="mb-4 text-center">
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm font-semibold">
                                📆 Đang xem: {formatWeekLabel(selectedWeek)}
                            </span>
                        </div>
                    )}

                    {!isLoading && schedules.length === 0 ? (
                        <div className="w-full py-24 border-2 border-dashed border-teal-200 bg-white/30 rounded-2xl flex flex-col items-center justify-center text-slate-500">
                            <CalendarIcon className="w-16 h-16 mb-4 text-teal-300 opacity-60" />
                            <p className="font-semibold">Chưa có lịch trình nào cho tuần này.</p>
                            <p className="text-sm mt-1 text-slate-400">Hãy tạo bằng AI ở trên hoặc chọn tuần khác.</p>
                        </div>
                    ) : (
                        <WeeklyCalendar schedules={schedules} onDeleteBlock={handleDeleteBlock} />
                    )}
                </div>

            </div>
        </div>
    );
}
