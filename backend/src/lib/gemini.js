import { GoogleGenAI } from "@google/genai";

export const parseTasksWithAI = async (text, userTasks = []) => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn("No GEMINI_API_KEY found. Falling back to mock NLP parser.");
    return mockParse(text);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Prepare the list of existing tasks to show to the AI
    const tasksContext = userTasks.map(t => `- ${t.title}`).join("\n");

    const prompt = `
Bạn là một chuyên gia lập thời khóa biểu cực kỳ thông minh.
Nhiệm vụ của bạn là đọc yêu cầu của người dùng, kết hợp với danh sách Công việc (Todo list) hiện tại của họ để tạo ra một thời khóa biểu 1 tuần lễ.

Danh sách công việc TodoX hiện tại của người dùng:
${tasksContext || "(Không có công việc nào sẵn trong TodoX)"}

Yêu cầu chi tiết từ người dùng:
"${text}"

QUY TẮC HIỂU NGÔN NGỮ TỰ NHIÊN & CON NGƯỜI:
1. Bạn phải TỰ ĐỘNG CHIA NHỎ các môn học dài hạn. Ví dụ: Nếu người dùng báo "CCNA học trong 3 tháng", bạn tự suy luận xem riêng 1 TUẦN NÀY (hiện tại) cần học mấy buổi, mỗi buổi bao nhiêu tiếng để bắt kịp tiến độ 3 tháng đó. Không nhét toàn bộ vào 1 tuần gây quá tải.
2. Nếu người dùng CHỈ ĐỊNH GIỜ CỐ ĐỊNH (Ví dụ: "thứ 6 3 tiếng 20h-21h30"), bạn BẮT BUỘC phải tạo các object map chính xác khung giờ đó. (Ví dụ 20h đến 21h30 là startHour: 20.0, endHour: 21.5, dayOfWeek: 6). Nếu họ bảo 3 tiếng nhưng chỉ kể khung 1.5h, hãy tự suy luận cách xếp hợp lý hoặc tách làm 2 buổi.
3. Không được để các công việc trùng lặp (overlap) thời gian.
4. Giờ khả dụng: từ 6.0 (6h sáng) đến 24.0 (0h đêm).
5. Phân bổ công việc xen kẽ, có nghỉ ngơi (30 phút). Thời gian tối đa cho 1 block liên tục nên là 2-3 tiếng.

KẾT QUẢ TRẢ VỀ:
Chỉ trả về MỘT MẢNG JSON duy nhất, tuyệt đối KHÔNG bọc trong markdown (như \`\`\`json).
Mỗi object biểu diễn 1 khối thời gian (1 buổi học/làm):
{
  "taskName": "Tên môn/công việc",
  "dayOfWeek": Mã ngày (2 = Thứ 2, 3 = Thứ 3, ..., 8 = Chủ nhật),
  "startHour": Giờ bắt đầu (kiểu float, VD: 6.5 là 6h30 sáng, 20.0 là 8h tối),
  "endHour": Giờ kết thúc (kiểu float, VD: 21.5 là 9h30 tối),
  "location": "Phòng học, tòa nhà, hoặc địa chỉ nếu có (Ví dụ: Phòng 302, Tòa A). Bỏ trống chuỗi rỗng nếu không có.",
  "instructor": "Tên giáo viên/người dạy nếu có (Ví dụ: Thầy Hùng, Cô Lan). Bỏ trống chuỗi rỗng nếu không có."
}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    // Cleanup output to ensure pure JSON
    let jsonString = response.text.trim();
    if(jsonString.startsWith("```json")) {
        jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    } else if (jsonString.startsWith("```")) {
        jsonString = jsonString.replace(/```/g, '').trim();
    }

    return JSON.parse(jsonString);

  } catch (error) {
    console.error("Lỗi AI API:", error);
    throw new Error("Không thể trích xuất JSON lịch từ AI. Hãy thử lại mô tả dễ hiểu hơn.");
  }
};

const mockParse = (text) => {
    console.log("[MockParser] Parsing text:", text);
    
    // Bảng chuyển đổi tên ngày tiếng Việt -> dayOfWeek
    const dayMap = {
        '2': 2, 'hai': 2, 'mon': 2,
        '3': 3, 'ba': 3, 'tue': 3,
        '4': 4, 'tư': 4, 'tu': 4, 'wed': 4,
        '5': 5, 'năm': 5, 'nam': 5, 'thu': 5,
        '6': 6, 'sáu': 6, 'sau': 6, 'fri': 6,
        '7': 7, 'bảy': 7, 'bay': 7, 'sat': 7,
        'cn': 8, 'chủ nhật': 8, 'chu nhat': 8, 'sun': 8,
    };

    // Hàm parse giờ: "20:00" -> 20.0, "21:30" -> 21.5, "20h" -> 20.0, "20h30" -> 20.5
    const parseTime = (timeStr) => {
        if (!timeStr) return null;
        timeStr = timeStr.trim().toLowerCase().replace('h', ':');
        // Handle "20:" -> "20:00"
        if (timeStr.endsWith(':')) timeStr += '00';
        const parts = timeStr.split(':');
        const hours = parseInt(parts[0]);
        const minutes = parts[1] ? parseInt(parts[1]) : 0;
        return hours + minutes / 60;
    };

    const blocks = [];

    // Tách text theo dấu phẩy, chấm phẩy, hoặc dấu xuống dòng thành từng câu lệnh
    const sentences = text.split(/[;\n]+/).map(s => s.trim()).filter(Boolean);

    for (const sentence of sentences) {
        const lowerSentence = sentence.toLowerCase();
        
        // --- Tìm các ngày được đề cập ---
        let days = [];
        
        // Pattern: "thứ 3,5,7" hoặc "thứ 3, 5, 7" hoặc "thứ 3 5 7"
        const multiDayMatch = lowerSentence.match(/th[ứu]?\s*([\d,\s]+)/);
        if (multiDayMatch) {
            const dayNumbers = multiDayMatch[1].split(/[,\s]+/).filter(Boolean);
            for (const d of dayNumbers) {
                if (dayMap[d.trim()]) days.push(dayMap[d.trim()]);
            }
        }

        // Pattern: "chủ nhật" hoặc "CN"
        if (/ch[ủu]\s*nh[aậ]t|^cn$|\bcn\b/i.test(lowerSentence)) {
            days.push(8);
        }

        // Nếu chỉ nói "thứ 6" (1 ngày duy nhất)
        if (days.length === 0) {
            const singleDayMatch = lowerSentence.match(/th[ứu]?\s*(\w+)/);
            if (singleDayMatch && dayMap[singleDayMatch[1].trim()]) {
                days.push(dayMap[singleDayMatch[1].trim()]);
            }
        }
        
        // Mặc định: Thứ 2 nếu không tìm thấy ngày nào
        if (days.length === 0) days = [2];

        // --- Tìm khung giờ ---
        let startHour = null, endHour = null;

        // Pattern: "20:00-21:30", "20h-21h30", "từ 20:00 đến 21:30"
        const timeRangeMatch = sentence.match(/(\d{1,2}[h:]\d{0,2})\s*[-–đến]*\s*(\d{1,2}[h:]\d{0,2})/i);
        if (timeRangeMatch) {
            startHour = parseTime(timeRangeMatch[1]);
            endHour = parseTime(timeRangeMatch[2]);
        }

        // Nếu không tìm thấy khung giờ, xếp mặc định 8:00-10:00
        if (startHour === null) { startHour = 8.0; endHour = 10.0; }

        // --- Tìm tên môn/công việc ---
        // Loại bỏ tất cả phần ngày và giờ để lấy phần tên còn lại
        let taskName = sentence
            .replace(/th[ứu]?\s*[\d,\s]+/gi, '')
            .replace(/ch[ủu]\s*nh[aậ]t/gi, '')
            .replace(/\bcn\b/gi, '')
            .replace(/t[ừu]?\s*\d{1,2}[h:]\d{0,2}\s*[-–đến]*\s*\d{1,2}[h:]\d{0,2}/gi, '')
            .replace(/\d{1,2}[h:]\d{0,2}\s*[-–đến]*\s*\d{1,2}[h:]\d{0,2}/gi, '')
            .replace(/\d+\s*(tiếng|gi[ờo]|hours?)/gi, '')
            .replace(/h[oọ]c|làm|lam/gi, '')
            .replace(/v[aà]o|t[ừu]|đ[eế]n|den/gi, '')
            .trim();
        
        // Làm sạch khoảng trắng thừa
        taskName = taskName.replace(/\s{2,}/g, ' ').trim();
        
        // Viết hoa chữ cái đầu
        if (taskName) {
            taskName = taskName.charAt(0).toUpperCase() + taskName.slice(1);
        } else {
            taskName = "Công việc";
        }

        // --- Tạo block cho từng ngày ---
        for (const day of days) {
            blocks.push({
                taskName: taskName,
                dayOfWeek: day,
                startHour: startHour,
                endHour: endHour
            });
        }
    }

    console.log("[MockParser] Generated blocks:", JSON.stringify(blocks));
    return blocks;
};
