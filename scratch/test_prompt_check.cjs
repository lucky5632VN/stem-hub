const { COMBINED_MATH_API_KEYS, RESILIENT_MODELS } = require('./keys.cjs');

// Let's test calling Gemini directly with the prompt
const text = "Cho hình lăng trụ ABC.A'B'C' có đáy ABC là tam giác đều cạnh bằng a. Hình chiếu vuông góc của A' trên (ABC) là trung điểm của AB. Mặt phẳng (AA'C'C) tạo với đáy một góc bằng 45°.";

const prompt = `
Bạn là chuyên gia bóc tách dữ liệu Toán học Hình học Không gian THPT cho hệ thống vẽ hình 3D tương tác.
Hãy phân tích đề bài sau và trích xuất các tham số hình học cùng các yêu cầu KẺ ĐƯỜNG PHỤ (Auxiliary Geometry) thành cấu trúc JSON chuẩn xác.

ĐỀ BÀI TOÁN:
"${text}"

QUY TẮC BẮT BUỘC:
1. CHỈ TRẢ VỀ ĐÚNG 1 KHỐI JSON DUY NHẤT. Tuyệt đối không thêm lời chào, không giải thích ngoài JSON.
2. "shapeType" bắt buộc phải là một trong các giá trị sau:
   - "hinh_lang_tru_tam_giac_deu": Hình lăng trụ tam giác (ABC.A'B'C' hoặc tam giác đều)
   - "hinh_chop_day_hcn": Hình chóp có đáy hình chữ nhật hoặc hình vuông
   - "hinh_chop_tu_giac_deu": Hình chóp tứ giác đều S.ABCD
   - "hinh_chop_tam_giac_deu": Hình chóp tam giác đều S.ABC
   - "hinh_hop_chu_nhat": Hình hộp chữ nhật, hình lập phương
   - "hinh_tru": Hình trụ tròn xoay
   - "hinh_non": Hình nón tròn xoay
   - "hinh_cau": Hình cầu
   - "khac": Khối hình khác
`;

console.log("Testing prompt...");
