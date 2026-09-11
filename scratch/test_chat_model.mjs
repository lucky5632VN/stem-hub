const question = "Tính thể tích khối lăng trụ ABC.A'B'C' biết AB = a, góc ABC = 120 độ, AA' = a.";
const modelContext = {
  shapeType: "hinh_lang_tru_tam_giac_deu",
  shapeName: "Hình lăng trụ ABC.A'B'C'",
  parameters: { canhDay: 4, chieuCao: 3.266 },
  originalProblemText: "Câu 2. Cho lăng trụ ABCD.A'B'C'D' có ABCD là hình thoi. Hình chiếu của A' lên (ABCD) là trọng tâm của tam giác ABD. Tính thể tích khối lăng trụ ABC.A'B'C' biết AB = a, góc ABC = 120 độ, AA' = a."
};

async function test() {
  console.log('Sending chat-model request to localhost:3000...');
  const res = await fetch('http://localhost:3000/api/lab-toan/chat-model', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, modelContext })
  });
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response:', data);
}

test().catch(console.error);
