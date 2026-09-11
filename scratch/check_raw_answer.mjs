const question = "Tính thể tích khối hình";
const modelContext = {
  shapeType: "hinh_lang_tru_tu_giac_xien",
  shapeName: "Hình lăng trụ xiên ABCD.A'B'C'D' (A'G ⊥ đáy tại trọng tâm G của ΔABD)",
  parameters: { canhDay: 4, chieuCao: 3.266 },
  originalProblemText: "Câu 2. Cho lăng trụ ABCD.A'B'C'D' có ABCD là hình thoi. Hình chiếu của A' lên (ABCD) là trọng tâm của tam giác ABD.",
  calculations: {
    canhDay: 4,
    chieuCao: 3.266,
    dienTichDay: 6.928,
    theTich: 22.627,
    donVi: "cm",
    congThuc: {
      dienTichDay: "S_{\\Delta ABC} = \\frac{a^2\\sqrt{3}}{4}",
      chieuCao: "A'G = \\sqrt{AA'^2 - AG^2} = \\frac{a\\sqrt{6}}{3}",
      theTich: "V_{ABC.A'B'C'} = S_{\\Delta ABC} \\cdot A'G = \\frac{a^3\\sqrt{2}}{4}",
      theTichToanKhoi: "V_{ABCD.A'B'C'D'} = 2 \\cdot V_{ABC.A'B'C'} = \\frac{a^3\\sqrt{2}}{2}"
    }
  }
};

async function check() {
  const res = await fetch('http://localhost:3000/api/lab-toan/chat-model', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, modelContext })
  });
  const data = await res.json();
  console.log('Answer from API:');
  console.log(data.answer);
}

check().catch(console.error);
