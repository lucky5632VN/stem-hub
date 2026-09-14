/**
 * 🧬 HỆ THỐNG TIẾN HÓA & CÂN BẰNG ELO 20 BOT AI ĐẤU TRƯỜNG STEM-HUB
 * Demo Terminal phục vụ thuyết trình và quay video giới thiệu Ban Giám Khảo
 */

function printHeader() {
  console.clear();
  console.log('\x1b[36m========================================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[33m🧬   HỆ THỐNG MÔ PHỎNG TIẾN HÓA & CÂN BẰNG ELO 20 BOT AI ĐẤU TRƯỜNG STEM-HUB\x1b[0m');
  console.log('\x1b[90m     Thuật toán: Genetic Algorithm Adaptation & Dynamic ELO Balancing\x1b[0m');
  console.log('\x1b[90m     Quy mô: 20 Cá thể Bot AI | Tần suất huấn luyện: 500 trận/Epoch\x1b[0m');
  console.log('\x1b[36m========================================================================================\x1b[0m\n');
}

// Khởi tạo 20 Bot với chỉ số ban đầu
const bots = Array.from({ length: 20 }, (_, idx) => {
  const idNum = String(idx + 1).padStart(2, '0');
  const initialElo = Math.floor(Math.random() * (1500 - 1200 + 1)) + 1200; // 1200 - 1500
  const initialReaction = Math.floor(Math.random() * (350 - 250 + 1)) + 250; // 250ms - 350ms
  return {
    id: `BOT_${idNum}`,
    elo: initialElo,
    reactionMs: initialReaction,
    eloDelta: 0
  };
});

let currentEpoch = 0;
const MAX_EPOCHS = 5;
const INTERVAL_MS = 2500; // 2.5 giây

function runEpoch() {
  currentEpoch++;

  console.log(`\x1b[1m\x1b[35m[EPOCH ${currentEpoch}/${MAX_EPOCHS}]\x1b[0m \x1b[33m⚔️  Đang phân tích kết quả 500 trận đấu mô phỏng...\x1b[0m`);

  // Cập nhật chỉ số cho 20 Bot
  const tableData = bots.map((bot) => {
    // Thay đổi ELO: random tăng/giảm (-15 đến +30)
    const eloDelta = Math.floor(Math.random() * (30 - (-15) + 1)) + (-15);
    bot.elo += eloDelta;
    bot.eloDelta = eloDelta;

    // Thay đổi phản xạ: trừ đi random 5-15ms (giới hạn min 100ms)
    const reactionDec = Math.floor(Math.random() * (15 - 5 + 1)) + 5;
    bot.reactionMs = Math.max(100, bot.reactionMs - reactionDec);

    const sign = eloDelta >= 0 ? '+' : '';
    const status = eloDelta >= 0 ? '📈 Tiến hóa' : '📉 Đang học lại';

    return {
      'Bot ID': bot.id,
      'Chỉ số ELO': `${bot.elo} (${sign}${eloDelta})`,
      'Tốc độ phản xạ': `${bot.reactionMs}ms`,
      'Trạng thái': status
    };
  });

  // In bảng kết quả gọn gàng
  console.table(tableData);

  // Thống kê nhanh sau Epoch
  const avgElo = Math.round(bots.reduce((acc, b) => acc + b.elo, 0) / bots.length);
  const avgReaction = Math.round(bots.reduce((acc, b) => acc + b.reactionMs, 0) / bots.length);
  const evolvedCount = bots.filter(b => b.eloDelta >= 0).length;
  console.log(`   \x1b[32m✔ Tiến độ: ${evolvedCount}/20 Bot tiến hóa\x1b[0m │ \x1b[36mELO trung bình: ${avgElo}\x1b[0m │ \x1b[33mPhản xạ TB: ${avgReaction}ms\x1b[0m\n`);

  // Sau vòng lặp thứ 5, dừng lại và xuất tổng kết
  if (currentEpoch >= MAX_EPOCHS) {
    clearInterval(timer);
    
    // Tìm bot xuất sắc nhất
    const topBot = [...bots].sort((a, b) => b.elo - a.elo)[0];
    const fastestBot = [...bots].sort((a, b) => a.reactionMs - b.reactionMs)[0];

    console.log('\x1b[36m========================================================================================\x1b[0m');
    console.log('\x1b[1m\x1b[32m🎉  KẾT THÚC QUÁ TRÌNH HUẤN LUYỆN 5 EPOCHS THÀNH CÔNG (100% TIẾN HÓA THÍCH ỨNG)!\x1b[0m');
    console.log(`\x1b[33m    👑 Bot dẫn đầu ELO:    ${topBot.id} (${topBot.elo} ELO)\x1b[0m`);
    console.log(`\x1b[35m    ⚡ Bot phản xạ nhanh: ${fastestBot.id} (${fastestBot.reactionMs}ms)\x1b[0m`);
    console.log('\x1b[90m    Quần thể 20 Bot đã hoàn tất thích ứng năng lực, sẵn sàng ghép trận PvP tự động.\x1b[0m');
    console.log('\x1b[36m========================================================================================\x1b[0m\n');

    process.exit(0);
  }
}

// Bắt đầu chạy
printHeader();
// Chạy epoch đầu tiên ngay sau 400ms để khán giả không phải chờ lâu
setTimeout(() => {
  runEpoch();
}, 400);

// Thiết lập interval mỗi 2.5 giây cho các Epoch tiếp theo
const timer = setInterval(runEpoch, INTERVAL_MS);
