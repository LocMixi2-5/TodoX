import React from "react";
import { X } from "lucide-react";

export default function WeeklyCalendar({ schedules, onDeleteBlock }) {
  const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
  // Hours from 6:00 to 24:00 (Midnight)
  const hours = Array.from({ length: 19 }, (_, i) => i + 6);

  const HOUR_HEIGHT = 44; // Reduced from 60px to 44px per hour

  return (
    <div className="w-full max-h-[600px] overflow-auto bg-white/70 border border-white/80 rounded-2xl relative shadow-inner scrollbar-thin scrollbar-thumb-teal-300 scrollbar-track-transparent">
      <div className="flex sticky top-0 bg-white/95 backdrop-blur-md z-20 border-b border-slate-200/80 shadow-sm">
        <div className="w-16 shrink-0 text-center py-3 text-[11px] font-bold text-slate-500 border-r border-slate-200/60 uppercase tracking-wider">
          Giờ
        </div>
        {days.map((day) => (
          <div key={day} className="flex-1 text-center py-3 text-xs font-extrabold text-slate-700 border-r border-slate-200/60 last:border-0 uppercase tracking-wide">
            {day}
          </div>
        ))}
      </div>

      <div className="flex relative bg-white/40">
        <div className="w-16 shrink-0 bg-slate-50/50 border-r border-slate-200/60">
          {hours.map(hour => (
            <div
              key={hour}
              className="text-center text-[10px] font-bold text-slate-400 border-b border-slate-200/50 flex items-center justify-center relative"
              style={{ height: `${HOUR_HEIGHT}px` }}
            >
              {hour === 24 ? "00:00" : `${hour < 10 ? '0' : ''}${hour}:00`}
              <span className="absolute -bottom-[1px] w-full h-[1px] bg-slate-200/50"></span>
            </div>
          ))}
        </div>

        <div className="flex-1 flex relative">
          {days.map((day, dayIndex) => {
            const dbDayOfWeek = dayIndex + 2; // array 0 is Thứ 2, which is DB 2

            // Filter blocks for this specific day column
            const dayBlocks = schedules.filter(s => s.dayOfWeek === dbDayOfWeek);

            return (
              <div key={dayIndex} className="flex-1 border-r border-slate-200/60 relative group">
                {/* Lưới ngang (Grid lines) */}
                {hours.map(hour => (
                  <div
                    key={hour}
                    className="w-full border-b border-slate-200/40 group-hover:bg-teal-50/20 transition-colors"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                  />
                ))}

                {/* Khối màu nhiệm vụ */}
                {dayBlocks.map(block => {
                  const topOffset = (block.startHour - 6) * HOUR_HEIGHT;
                  const blockHeight = (block.endHour - block.startHour) * HOUR_HEIGHT;

                  return (
                    <div
                      key={block._id}
                      className="absolute w-[94%] left-[3%] p-2.5 rounded-xl text-white font-medium text-xs overflow-hidden shadow-md backdrop-blur-md transition-all ease-out duration-200 hover:scale-[1.03] hover:shadow-lg hover:z-10 cursor-default border border-white/40 group/block"
                      style={{
                        top: `${topOffset}px`,
                        height: `${blockHeight}px`,
                        background: `linear-gradient(135deg, ${block.color || "#14b8a6"} 0%, ${block.color ? darkenColor(block.color) : "#0f766e"} 100%)`,
                        opacity: 0.95
                      }}
                    >
                      {/* Nút xoá */}
                      {onDeleteBlock && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteBlock(block._id); }}
                          className="absolute top-1.5 right-1.5 w-5 h-5 bg-white/30 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover/block:opacity-100 transition-all duration-150 hover:scale-110 z-20"
                          title="Xoá ca này"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      )}
                      <div className="flex flex-col h-full justify-start text-[10px] leading-tight text-white font-bold tracking-tight py-0.5">
                        {/* Dòng 1: Tên môn */}
                        <div className="text-[11px] truncate pr-4 drop-shadow-sm mb-0.5" title={block.taskName}>
                          {block.taskName}
                        </div>

                        {/* Dòng 2: Thời gian */}
                        <div className="opacity-95 truncate drop-shadow-sm mb-0.5">
                          từ: {formatDecimalTime(block.startHour)}-{formatDecimalTime(block.endHour)}
                        </div>

                        {/* Dòng 3: Giảng viên */}
                        {block.instructor && (
                          <div className="opacity-90 truncate drop-shadow-sm mb-0.5">
                            thầy/cô {block.instructor}
                          </div>
                        )}

                        {/* Dòng 4: Địa điểm */}
                        {block.location && (
                          <div className="opacity-90 truncate drop-shadow-sm">
                            địa điểm: {block.location}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function formatDecimalTime(decimalAttr) {
  const hours = Math.floor(decimalAttr);
  const minutes = Math.round((decimalAttr - hours) * 60);
  const hStr = hours < 10 ? `0${hours}` : hours.toString();
  const mStr = minutes === 0 ? "00" : minutes.toString().padStart(2, '0');
  return `${hStr}:${mStr}`;
}

// Hàm làm tối màu Hex đi 20% để tạo gradient
function darkenColor(hex) {
  if (!hex) return "#0f766e";
  let color = hex.replace('#', '');
  if (color.length === 3) color = color.split('').map(c => c + c).join('');
  const amount = 20;
  const r = Math.max(0, parseInt(color.substring(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(color.substring(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(color.substring(4, 6), 16) - amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
