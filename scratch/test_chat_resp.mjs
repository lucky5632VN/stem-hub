const res = await fetch('http://localhost:3000/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Câu hỏi hoặc yêu cầu của học sinh: "📊 Tính thể tích khối hình"',
    systemInstruction: `Bạn là Trợ lý AI Chuyên gia Hình học Không gian 3D tương tác của hệ thống STEM HUB.
Trình bày NGẮN GỌN, TÓM TẮT, ĐI THẲNG VÀO TRỌNG TÂM TOÁN HỌC.
Công thức toán bọc trong $...$ hoặc $$...$$.

BẮT BUỘC TRẢ VỀ ĐỊNH DẠNG JSON DUY NHẤT HỢP LỆ THEO MẪU:
{
  "answer": "Câu trả lời diễn giải Toán học (dùng LaTeX $...$).",
  "action": null
}

NGỮ CẢNH: Hình lăng trụ xiên ABCD.A'B'C'D' đáy hình thoi cạnh a, góc 120 độ, A' chiếu lên trọng tâm ABD, chiều cao A'G = (a*sqrt(6))/3, diện tích đáy ABC = (a^2*sqrt(3))/4, thể tích ABC.A'B'C' = (a^3*sqrt(2))/4.`,
    responseMimeType: 'application/json',
    temperature: 0.2
  })
});

const data = await res.json();
console.log('API Response:', JSON.stringify(data, null, 2));
