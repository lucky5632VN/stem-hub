export const REAL_TEST_BOT_ACCOUNTS = [
  { email: 'test1@gmail.com', name: 'Nguyễn Minh Khang', elo: 130, level: 4, wins: 8, losses: 3 },
  { email: 'test2@gmail.com', name: 'Trần Thị Thanh Vân', elo: 70, level: 3, wins: 5, losses: 3 },
  { email: 'test3@gmail.com', name: 'Lê Hoàng Nam', elo: 70, level: 3, wins: 5, losses: 3, subjectStrengths: { math: 86, physics: 89, chemistry: 83, biology: 37 } },
  { email: 'test4@gmail.com', name: 'Phạm Minh Anh', elo: 90, level: 6, wins: 8, losses: 7 },
  { email: 'test5@gmail.com', name: 'Vũ Hoàng Bách', elo: 80, level: 3, wins: 5, losses: 2 },
  { email: 'test6@gmail.com', name: 'Đặng Thùy Dương', elo: 50, level: 3, wins: 4, losses: 3 },
  { email: 'test7@gmail.com', name: 'Nguyễn Gia Bảo', elo: 60, level: 4, wins: 5, losses: 4 },
  { email: 'test8@gmail.com', name: 'Bùi Minh Triết', elo: 70, level: 3, wins: 5, losses: 3 },
  { email: 'test9@gmail.com', name: 'Phan Thanh Hằng', elo: 80, level: 5, wins: 7, losses: 6 },
  { email: 'test10@gmail.com', name: 'Nguyễn Tiến Đạt', elo: 90, level: 5, wins: 7, losses: 5 },
  { email: 'test11@gmail.com', name: 'Trần Đức Lộc', elo: 50, level: 2, wins: 3, losses: 1 },
  { email: 'test12@gmail.com', name: 'Hoàng Khánh Linh', elo: 90, level: 6, wins: 8, losses: 7 },
  { email: 'test13@gmail.com', name: 'Phạm Đăng Khoa', elo: 50, level: 2, wins: 3, losses: 1 },
  { email: 'test14@gmail.com', name: 'Vũ Thảo Nguyên', elo: 70, level: 2, wins: 4, losses: 1 },
  { email: 'test15@gmail.com', name: 'Nguyễn Hải Phong', elo: 110, level: 3, wins: 6, losses: 1 },
  { email: 'test16@gmail.com', name: 'Lê Cát Tường', elo: 100, level: 3, wins: 6, losses: 2 },
  { email: 'test17@gmail.com', name: 'Nguyễn Quốc Anh', elo: 60, level: 3, wins: 4, losses: 2 },
  { email: 'test18@gmail.com', name: 'Đỗ Gia Huy', elo: 90, level: 5, wins: 7, losses: 5 },
  { email: 'test19@gmail.com', name: 'Trần Mai Phương', elo: 110, level: 4, wins: 7, losses: 3 },
  { email: 'test20@gmail.com', name: 'Lê Thanh Tùng', elo: 130, level: 4, wins: 8, losses: 3 }
];

export const TEST_USER_PRESETS = REAL_TEST_BOT_ACCOUNTS.reduce((acc, item) => {
  acc[item.email] = {
    displayName: item.name,
    elo: item.elo,
    level: item.level,
    wins: item.wins,
    losses: item.losses,
    subjectStrengths: item.subjectStrengths || { math: 50, physics: 50, chemistry: 50, biology: 50 }
  };
  return acc;
}, {
  'p1@test.com': { displayName: 'Player One', elo: 100, level: 2, wins: 5, losses: 2 },
  'p2@test.com': { displayName: 'Player Two', elo: 90, level: 2, wins: 4, losses: 3 },
  'testuser1@example.com': { displayName: 'Test User One', elo: 80, level: 1, wins: 3, losses: 3 }
});

export const getPresetForEmail = (email) => {
  if (!email) return null;
  const lower = email.toLowerCase().trim();
  if (TEST_USER_PRESETS[lower]) return TEST_USER_PRESETS[lower];
  
  // Hỗ trợ dạng nhập nhanh: test1 -> test1@gmail.com
  const match = lower.match(/^test(\d+)$/);
  if (match) {
    const fullEmail = `test${match[1]}@gmail.com`;
    return TEST_USER_PRESETS[fullEmail] || null;
  }

  // Hỗ trợ domain tùy chỉnh test1@stemhub.vn -> test1@gmail.com
  const matchDomain = lower.match(/^test(\d+)@/);
  if (matchDomain) {
    const fullEmail = `test${matchDomain[1]}@gmail.com`;
    return TEST_USER_PRESETS[fullEmail] || null;
  }

  return null;
};
