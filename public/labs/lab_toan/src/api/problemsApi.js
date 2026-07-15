// =====================================================
// Mock API cho Problems và User Progress
// =====================================================

export const MOCK_PROBLEMS = [
  {
    id: "cau-1",
    title: "Câu 1: Góc giữa SC và mặt phẳng (ABCD)",
    difficulty: "Easy",
    tags: ["Hình chóp", "Góc"],
    acceptanceRate: 85.2,
    totalSubmissions: 3120,
    isPremium: false,
    content: "Cho hình chóp S.ABCD có đáy là hình vuông, $SA \\perp (ABCD)$. Hãy xác định góc giữa đường thẳng SC và mặt phẳng (ABCD)."
  },
  {
    id: "cau-2",
    title: "Câu 2: Tính góc giữa SD và mặt đáy",
    difficulty: "Medium",
    tags: ["Hình chóp", "Góc"],
    acceptanceRate: 65.5,
    totalSubmissions: 2840,
    isPremium: false,
    content: "Cho hình chóp S.ABCD có đáy là hình vuông cạnh $a$, $SA \\perp (ABCD)$ và $SA = a$. Tính góc giữa SD và mặt đáy (ABCD)."
  },
  {
    id: "cau-3",
    title: "Câu 3: Tính góc giữa SC và (ABC)",
    difficulty: "Medium",
    tags: ["Hình chóp", "Góc"],
    acceptanceRate: 58.2,
    totalSubmissions: 2150,
    isPremium: false,
    content: "Cho hình chóp S.ABC có $SA \\perp (ABC)$, $SA = 2a$. Tam giác ABC vuông tại B, $AB = a\\sqrt{3}$ và $BC = a$. Tính góc giữa đường thẳng SC và mặt phẳng (ABC)."
  },
  {
    id: "cau-4",
    title: "Câu 4: Góc giữa SC và (ABCD) (Đề TK 2020)",
    difficulty: "Medium",
    tags: ["Hình chóp", "Góc"],
    acceptanceRate: 62.1,
    totalSubmissions: 4500,
    isPremium: false,
    content: "Cho hình chóp S.ABCD có đáy là hình vuông cạnh $a\\sqrt{3}$, $SA \\perp (ABCD)$ và $SA = a\\sqrt{2}$. Tính góc giữa SC và mặt phẳng (ABCD)."
  },
  {
    id: "cau-5",
    title: "Câu 5: Góc giữa đường thẳng SB và đáy (Đề 2018)",
    difficulty: "Medium",
    tags: ["Hình chóp", "Góc"],
    acceptanceRate: 60.5,
    totalSubmissions: 3900,
    isPremium: false,
    content: "Cho hình chóp S.ABCD có đáy là hình vuông cạnh $a$, $SA \\perp (ABCD)$ và $SB = 2a$. Tính góc giữa đường thẳng SB và mặt phẳng đáy."
  },
  {
    id: "cau-6",
    title: "Câu 6: Tính góc giữa SM và (ABCD)",
    difficulty: "Medium",
    tags: ["Hình chữ nhật", "Góc"],
    acceptanceRate: 45.8,
    totalSubmissions: 1200,
    isPremium: false,
    content: "Cho hình chóp S.ABCD có đáy là hình chữ nhật ABCD có $AB = a$, $AD = 2a$. Cạnh $SA = a\\sqrt{6}$ và vuông góc với mặt phẳng đáy. Gọi M là trung điểm của BC. Tính góc giữa SM và (ABCD)."
  },
  {
    id: "cau-7",
    title: "Câu 7: Góc tạo bởi SC và mặt phẳng (ABCD)",
    difficulty: "Medium",
    tags: ["Mặt bên vuông góc", "Góc"],
    acceptanceRate: 42.5,
    totalSubmissions: 1560,
    isPremium: true,
    content: "Cho hình chóp S.ABCD có đáy ABCD là hình chữ nhật, $AB = a$, $BC = 2a$. Hai mặt bên (SAB), (SAD) cùng vuông góc với mặt phẳng (ABCD) và $SA = a\\sqrt{15}$. Tính góc tạo bởi SC và mặt phẳng (ABCD)."
  },
  {
    id: "cau-8",
    title: "Câu 8: Tính tan góc giữa SC và (ABCD)",
    difficulty: "Medium",
    tags: ["Hình chữ nhật", "Góc", "Tan"],
    acceptanceRate: 55.0,
    totalSubmissions: 2200,
    isPremium: false,
    content: "Cho hình chóp S.ABCD có đáy ABCD là hình chữ nhật, cạnh $AB = a$, $AD = 2a$, $SA \\perp (ABCD)$, $SA = 5a$. Tính $\\tan$ góc giữa SC và mặt phẳng (ABCD)."
  },
  {
    id: "cau-14",
    title: "Câu 14: Góc nhị diện [S, CD, A]",
    difficulty: "Medium",
    tags: ["Góc nhị diện", "Hình chóp"],
    acceptanceRate: 35.5,
    totalSubmissions: 1100,
    isPremium: true,
    content: "Cho hình chóp S.ABCD có đáy là hình vuông cạnh $a$, $SA \\perp (ABCD)$ và $SA = 2a\\sqrt{3}$. Tính số đo của góc nhị diện [S, CD, A]."
  },
  {
    id: "cau-19",
    title: "Câu 19: Khoảng cách giữa BD và SC",
    difficulty: "Hard",
    tags: ["Khoảng cách", "Hình chóp đều"],
    acceptanceRate: 15.2,
    totalSubmissions: 3500,
    isPremium: false,
    content: "Cho hình chóp đều S.ABCD có đáy là hình vuông ABCD tâm O cạnh $2a$, cạnh bên $SA = a\\sqrt{5}$. Tính khoảng cách giữa BD và SC."
  },
  {
    id: "cau-20",
    title: "Câu 20: Khoảng cách giữa hai đường thẳng AB và CD",
    difficulty: "Hard",
    tags: ["Khoảng cách", "Tứ diện đều"],
    acceptanceRate: 18.4,
    totalSubmissions: 2800,
    isPremium: false,
    content: "Cho tứ diện đều ABCD cạnh $a\\sqrt{3}$. Tính khoảng cách giữa hai đường thẳng AB và CD."
  },
  {
    id: "cau-22",
    title: "Câu 22: Khoảng cách giữa AB và SC (Đề Vinh 2018)",
    difficulty: "Hard",
    tags: ["Khoảng cách", "Mặt phẳng"],
    acceptanceRate: 12.5,
    totalSubmissions: 4100,
    isPremium: true,
    content: "Cho hình chóp S.ABC có đáy ABC là tam giác vuông cân tại B, $AB = a$, cạnh bên SA vuông góc với mặt phẳng đáy, góc tạo bởi hai mặt phẳng (ABC) và (SBC) bằng $60^\\circ$. Tính khoảng cách giữa hai đường thẳng AB và SC."
  },
  {
    id: "cau-27",
    title: "Câu 27: Khoảng cách giữa SD và BM",
    difficulty: "Hard",
    tags: ["Khoảng cách", "Hình vuông"],
    acceptanceRate: 9.8,
    totalSubmissions: 5020,
    isPremium: true,
    content: "Cho hình chóp S.ABCD có đáy là hình vuông cạnh $2a$, $SA \\perp (ABCD)$. Gọi M là trung điểm của cạnh CD, biết $SA = a\\sqrt{5}$. Tính khoảng cách giữa hai đường thẳng SD và BM."
  },
  {
    id: "cau-30",
    title: "Câu 30: Thể tích của khối chóp S.ABC",
    difficulty: "Hard",
    tags: ["Thể tích", "Góc nhị diện"],
    acceptanceRate: 8.5,
    totalSubmissions: 2500,
    isPremium: false,
    content: "Cho khối chóp S.ABC có đáy ABC là tam giác vuông cân tại A, $AB = a$, $\\widehat{SBA} = \\widehat{SCA} = 90^\\circ$, góc giữa hai mặt phẳng (SAB) và (SAC) bằng $60^\\circ$. Tính thể tích của khối chóp đã cho."
  },
  {
    id: "pending-1",
    title: "Câu hỏi của Giáo viên A: Thể tích lăng trụ",
    difficulty: "Medium",
    tags: ["Lăng trụ", "Thể tích"],
    acceptanceRate: 0,
    totalSubmissions: 0,
    isPremium: false,
    status: "pending_approval",
    authorId: "teacher-123",
    content: "Tính thể tích khối lăng trụ tam giác đều có tất cả các cạnh bằng $a$."
  },
  {
    id: "pending-2",
    title: "Câu hỏi của Giáo viên B: Khoảng cách điểm đến mặt phẳng",
    difficulty: "Hard",
    tags: ["Khoảng cách", "Tọa độ"],
    acceptanceRate: 0,
    totalSubmissions: 0,
    isPremium: true,
    status: "pending_approval",
    authorId: "teacher-456",
    content: "Trong không gian Oxyz, tính khoảng cách từ điểm $M(1, 2, 3)$ đến mặt phẳng $(P): x + y + z - 1 = 0$."
  }
];
export const PROBLEM_CORRECT_ANSWERS = {
  'cau-1': ['sca', 'gocsca', 's-c-a'],
  'cau-2': ['45', '45o', '45 độ', '45deg', '45degrees'],
  'cau-3': ['45', '45o', '45 độ', '45deg', '45degrees'],
  'cau-4': ['30', '30o', '30 độ', '30deg', '30degrees'],
  'cau-5': ['60', '60o', '60 độ', '60deg', '60degrees'],
  'cau-6': ['60', '60o', '60 độ', '60deg', '60degrees'],
  'cau-7': ['60', '60o', '60 độ', '60deg', '60degrees'],
  'cau-8': ['\\sqrt{5}', 'sqrt(5)', 'căn5', 'can5']
};

export const checkProblemAnswer = (problemId, userAnswer) => {
  const acceptable = PROBLEM_CORRECT_ANSWERS[problemId];
  if (!acceptable) return false;
  
  const normUser = userAnswer.replace(/\s+/g, '').toLowerCase().replace(/độ/g, '').replace(/°/g, '').replace(/o/g, '');
  return acceptable.some(ans => {
    const normAns = ans.replace(/\s+/g, '').toLowerCase().replace(/độ/g, '').replace(/°/g, '').replace(/o/g, '');
    return normUser === normAns;
  });
};

export const MOCK_USER_PROGRESS = {
  solvedProblems: [],
  attemptedProblems: []
};

// Hàm mô phỏng độ trễ của API
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchProblems = async () => {
  await delay(600); // Simulate network latency
  // Trả về metadata, chỉ lấy các bài đã 'published' cho user thường
  return MOCK_PROBLEMS
    .filter(p => !p.status || p.status === 'published')
    .map(({ content, ...meta }) => meta);
};

export const fetchAdminProblems = async () => {
  await delay(600);
  return MOCK_PROBLEMS; // Admin thấy hết
};

export const approveProblem = async (id) => {
  await delay(500);
  // Fix W5: Tạo object mới thay vì mutate trực tiếp mảng module-scope
  const index = MOCK_PROBLEMS.findIndex(p => p.id === id);
  if (index !== -1) {
    MOCK_PROBLEMS[index] = { ...MOCK_PROBLEMS[index], status: 'published' };
  }
  return true;
};

export const rejectProblem = async (id) => {
  await delay(500);
  // Fix W5: Đánh dấu 'rejected' thay vì splice (tránh index shift và mất dữ liệu)
  const index = MOCK_PROBLEMS.findIndex(p => p.id === id);
  if (index !== -1) {
    MOCK_PROBLEMS[index] = { ...MOCK_PROBLEMS[index], status: 'rejected' };
  }
  return true;
};

export const fetchProblemById = async (id) => {
  await delay(400); // Simulate network latency
  const problem = MOCK_PROBLEMS.find(p => p.id === id);
  if (!problem) throw new Error("Problem not found");
  return problem;
};

export const fetchUserProgress = async (uid) => {
  await delay(400); // Simulate network latency
  
  let solved = [];
  let attempted = [];
  
  try {
    solved = JSON.parse(localStorage.getItem('spatialmind_solved_list') || '[]');
    attempted = JSON.parse(localStorage.getItem('spatialmind_attempted_list') || '[]');
  } catch (e) {
    console.error("Error loading user progress:", e);
  }
  
  if (!Array.isArray(solved)) solved = [];
  if (!Array.isArray(attempted)) attempted = [];
  
  return {
    solvedProblems: solved,
    attemptedProblems: attempted
  };
};
