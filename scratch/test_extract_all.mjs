import { parseNumericValue } from '../src/lib/geometryFactSolver.js';

const testCases = [
  {
    id: "TC1",
    text: "Cho lăng trụ ABCD.A'B'C'D' có ABCD là hình thoi cạnh a, góc ABC = 120 độ. Hình chiếu vuông góc của A' lên (ABCD) là trọng tâm của tam giác ABD. Biết AA' = a."
  },
  {
    id: "TC2",
    text: "Cho hình lăng trụ ABC.A'B'C' có đáy ABC là tam giác đều cạnh a. Hình chiếu vuông góc của A' trên (ABC) là trung điểm H của AB."
  },
  {
    id: "TC3",
    text: "Cho hình lăng trụ ABC.A'B'C' có đáy ABC là tam giác đều cạnh a. Hình chiếu vuông góc của A' lên mặt phẳng (ABC) trùng với trọng tâm của tam giác ABC."
  },
  {
    id: "TC4",
    text: "Cho hình lăng trụ đứng ABC.A'B'C' có đáy ABC là tam giác vuông tại A, AB = 3, AC = 4, chiều cao AA' = 5."
  },
  {
    id: "TC5",
    text: "Cho hình hộp chữ nhật ABCD.A'B'C'D' có đáy là hình chữ nhật AB = 4, AD = 5, chiều cao AA' = 6."
  },
  {
    id: "TC6",
    text: "Cho hình chóp S.ABCD có đáy ABCD là hình chữ nhật, AB = a, AD = 2a, SA vuông góc với mặt phẳng (ABCD), SA = a căn 3."
  },
  {
    id: "TC7",
    text: "Cho hình chóp S.ABC có SA vuông góc với mặt phẳng đáy, tam giác ABC vuông cân tại A có BC = 4 căn 2. Góc giữa mặt bên (SBC) và đáy bằng 60 độ."
  },
  {
    id: "TC8",
    text: "Cho hình chóp tứ giác đều S.ABCD có cạnh đáy bằng 4, chiều cao SO = 5."
  },
  {
    id: "TC9",
    text: "Cho hình chóp tam giác đều S.ABC có cạnh đáy bằng 4, chiều cao bằng 6."
  }
];

function extractFactsTest(problemText) {
  const clean = (problemText || '').toLowerCase();
  const givenFacts = [];

  // 1. Cạnh đáy hoặc cạnh hình đều / thoi
  const canhDayMatch = clean.match(/(?:cạnh\s*đáy|(?:hình\s*thoi|tam\s*giác\s*đều|hình\s*vuông)\s*cạnh)\s*(?:bằng\s*|=)?\s*([^\n,;.]+)/i);
  if (canhDayMatch) {
    const rawVal = canhDayMatch[1].trim();
    if (rawVal && !rawVal.includes('vuông') && !rawVal.includes('song song')) {
      const aVal = parseNumericValue(rawVal, 4);
      givenFacts.push({ type: 'length', element: 'canh_day', value: rawVal, numericValue: aVal });
    }
  }

  // 2. Các đoạn thẳng cụ thể: AB, BC, CD, DA, AD, AC, BD, SA, SB, SC, SD, SO, SH, AA', AA
  const segRegex = /\b(ab|bc|cd|da|ad|ac|bd|sa|sb|sc|sd|so|sh|aa'|aa)\s*(?:bằng\s*|=)\s*([^\n,;.]+)/gi;
  let m;
  while ((m = segRegex.exec(clean)) !== null) {
    const segName = m[1].toUpperCase();
    const rawVal = m[2].trim();
    if (rawVal && !rawVal.includes('vuông') && !rawVal.includes('song song')) {
      const val = parseNumericValue(rawVal);
      givenFacts.push({ type: 'length', element: segName, value: rawVal, numericValue: val });
    }
  }

  // 3. Chiều cao / đường cao nếu không trùng SA, SH, SO, AA'
  const hMatch = clean.match(/(?:chiều cao|đường cao)\s*(?:bằng\s*|=)\s*([^\n,;.]+)/i);
  if (hMatch) {
    const rawVal = hMatch[1].trim();
    if (rawVal && !rawVal.includes('vuông') && !rawVal.includes('song song')) {
      const hVal = parseNumericValue(rawVal, 5);
      // chỉ thêm nếu chưa có SA/SH/SO/AA'
      if (!givenFacts.some(f => ['SA', 'SH', 'SO', "AA'", 'AA'].includes(f.element))) {
        givenFacts.push({ type: 'length', element: 'chieu_cao', value: rawVal, numericValue: hVal });
      }
    }
  }

  // 4. Góc
  const angleDegreeMatch = clean.match(/(?:góc|tạo với|mặt phẳng nghiêng|mặt bên).*?([a-z0-9'()]+)?.*?(\d+)(?:°| độ|deg)/gi);
  // Góc cụ thể
  const faceAngleMatch = clean.match(/(?:góc giữa|mặt phẳng nghiêng|mặt bên).*?(\d+)(?:°| độ|deg)/i);
  if (faceAngleMatch) {
    const deg = parseFloat(faceAngleMatch[1]);
    const targetFace = clean.includes('sbc') ? '(SBC)' : (clean.includes('scd') ? '(SCD)' : (clean.includes("a'bc") ? "(A'BC)" : 'mat_ben'));
    givenFacts.push({ type: 'angle', between: [targetFace, 'mp_day'], degrees: deg });
  }

  const gocABC = clean.match(/góc\s*(?:giữa\s*)?([a-z0-9']+)\s*(?:bằng\s*|=)\s*(\d+)(?:°| độ|deg)/i);
  if (gocABC) {
    givenFacts.push({ type: 'angle', between: [gocABC[1].toUpperCase()], degrees: parseFloat(gocABC[2]) });
  }

  return givenFacts;
}

for (const tc of testCases) {
  console.log(`\n--- ${tc.id} ---`);
  const facts = extractFactsTest(tc.text);
  console.log(JSON.stringify(facts, null, 2));
}
