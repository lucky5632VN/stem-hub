const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('../stem-hub-43e96-firebase-adminsdk-fbsvc-d71f6a4cd7.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const MOCK_STORIES = [
  {
    id: 'user_story_1',
    userName: 'Kỹ Sư Lượng Tử',
    avatar: '🌀',
    elo: 2450,
    title: 'Viện Sĩ Lượng Tử',
    activeFrame: 'cyan_tech',
    stories: [
      {
        id: 's1_1',
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop',
        caption: 'Hệ thống gương phản xạ bẻ cong tia laser thành công! ⚡🔥',
        createdAt: '25 phút trước'
      },
      {
        id: 's1_2',
        imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=600&auto=format&fit=crop',
        caption: 'Đồ thị Parabol đi qua đúng đỉnh cực trị 3D! 🎯📐',
        createdAt: '10 phút trước'
      }
    ],
    updatedAt: Date.now() - 600000
  },
  {
    id: 'user_story_2',
    userName: 'Nhà Sáng Chế Trẻ',
    avatar: '🔬',
    elo: 2050,
    title: 'Giáo Sư Phát Minh',
    activeFrame: 'gold_vip',
    stories: [
      {
        id: 's2_1',
        imageUrl: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?q=80&w=600&auto=format&fit=crop',
        caption: 'Phản ứng nổ thuốc súng đen KNO₃ quá hoành tráng! 🧪💥😍',
        createdAt: '40 phút trước'
      },
      {
        id: 's2_2',
        imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop',
        caption: 'Dung dịch phenolphthalein chuyển màu hồng neon tuyệt đẹp 🧪✨',
        createdAt: '15 phút trước'
      }
    ],
    updatedAt: Date.now() - 900000
  },
  {
    id: 'user_story_3',
    userName: 'Genetics Wizard',
    avatar: '🧬',
    elo: 1650,
    title: 'Giáo Sư Phát Minh',
    activeFrame: 'neon_fire',
    stories: [
      {
        id: 's3_1',
        imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?q=80&w=600&auto=format&fit=crop',
        caption: 'Ghép cặp thành công chuỗi ADN virus đột biến! 🌾🧬💯',
        createdAt: '1 giờ trước'
      }
    ],
    updatedAt: Date.now() - 3600000
  },
  {
    id: 'user_story_4',
    userName: 'Nguyễn Minh Khang',
    avatar: '⚡',
    elo: 1300,
    title: 'Bậc Thầy Đấu Trường',
    activeFrame: 'top_1_sovereign',
    stories: [
      {
        id: 's4_1',
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop',
        caption: 'Chuỗi 8 trận thắng liên tiếp ở PvP Arena! 🏆🚀🔥',
        createdAt: '2 giờ trước'
      }
    ],
    updatedAt: Date.now() - 7200000
  },
  {
    id: 'user_story_5',
    userName: 'Trần Thị Thanh Vân',
    avatar: '📐',
    elo: 1150,
    title: 'Học Sinh Ưu Tú',
    activeFrame: 'cosmic_nebula',
    stories: [
      {
        id: 's5_1',
        imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=600&auto=format&fit=crop',
        caption: 'Vừa giải đáp xong bài toán Tọa độ 3D góc giữa 2 mặt phẳng 📐✨😍',
        createdAt: '3 giờ trước'
      }
    ],
    updatedAt: Date.now() - 10800000
  },
  {
    id: 'user_story_6',
    userName: 'Phạm Minh Anh',
    avatar: '🔬',
    elo: 1200,
    title: 'Nhà Nghiên Cứu',
    activeFrame: 'antimatter_era',
    stories: [
      {
        id: 's6_1',
        imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=600&auto=format&fit=crop',
        caption: 'Hiện tượng quang phổ vạch phát xạ trong phòng thí nghiệm ⚡🌈',
        createdAt: '4 giờ trước'
      }
    ],
    updatedAt: Date.now() - 14400000
  },
  {
    id: 'user_story_7',
    userName: 'Vũ Hoàng Bách',
    avatar: '⚙️',
    elo: 1080,
    title: 'Kỹ Thuật Viên',
    activeFrame: 'blackhole_gravity',
    stories: [
      {
        id: 's7_1',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop',
        caption: 'Lắp ráp mạch vi xử lý lượng tử đơn chip thành công 💻💥',
        createdAt: '5 giờ trước'
      }
    ],
    updatedAt: Date.now() - 18000000
  },
  {
    id: 'user_story_8',
    userName: 'Đặng Thùy Dương',
    avatar: '🌿',
    elo: 950,
    title: 'Thành Viên Năng Nổ',
    activeFrame: 'multiverse_overlord',
    stories: [
      {
        id: 's8_1',
        imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=600&auto=format&fit=crop',
        caption: 'Quan sát tế bào thực vật phân bào dưới kính hiển vi điện tử 🔬🌱😍',
        createdAt: '6 giờ trước'
      }
    ],
    updatedAt: Date.now() - 21600000
  },
  {
    id: 'user_story_9',
    userName: 'Lê Hoàng Nam',
    avatar: '🦁',
    elo: 890,
    title: 'Tân Binh Xuất Sắc',
    activeFrame: 'top_100_silver',
    stories: [
      {
        id: 's9_1',
        imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?q=80&w=600&auto=format&fit=crop',
        caption: 'Phá đảo 10 trận Sinh học PvP liên tiếp! 7 Thắng rực rỡ 🧬🏆🔥',
        createdAt: '7 giờ trước'
      }
    ],
    updatedAt: Date.now() - 25200000
  }
];

const MOCK_MOMENTS = [
  {
    id: 'moment_1',
    userName: 'Kỹ Sư Lượng Tử',
    avatar: '🌀',
    title: 'Viện Sĩ Lượng Tử',
    elo: 2450,
    avatarFrame: 'cyan_tech',
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=600&auto=format&fit=crop',
    caption: 'Tương giao đồ thị cực kỳ nhịp nhàng trong buổi Đấu trường sáng nay! Đã leo thành công lên 2450 ELO. Ai muốn solo môn Toán học 3D không nào? 📐🚀🔥',
    subject: 'math',
    subjectLabel: 'Toán Học 3D',
    createdAt: '15 phút trước',
    reactions: { heart: 42, brain: 28, fire: 35 },
    comments: [
      { id: 'c1', userName: 'Học Thần Hóa', text: 'Vẽ đỉnh thế anh ơi! 🔥👏' },
      { id: 'c2', userName: 'Nhà Sáng Chế Trẻ', text: 'Hóng solo Toán 3D nha 🚀💯' },
      { id: 'c3', userName: 'Trần Thị Thanh Vân', text: 'Chúc mừng idol nhé! 😍🎉' }
    ],
    timestamp: Date.now() - 900000
  },
  {
    id: 'moment_2',
    userName: 'Nhà Sáng Chế Trẻ',
    avatar: '🧪',
    title: 'Giáo Sư Phát Minh',
    elo: 2050,
    avatarFrame: 'gold_vip',
    imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop',
    caption: 'Đã hoàn thành phản ứng bẫy khí CO₂ chuẩn pH = 7.1 siêu ngọt ngào. Tránh được hoàn toàn vụ nổ bình ga của Chapter 1 luôn nhé mọi người! 🧪🔥😍',
    subject: 'chemistry',
    subjectLabel: 'Hóa Học Ảo',
    createdAt: '45 phút trước',
    reactions: { heart: 38, brain: 19, fire: 45 },
    comments: [
      { id: 'c4', userName: 'Genetics Wizard', text: 'Chỉ em cách đổ NaHCO₃ với, toàn bị nổ! 😅🧪' },
      { id: 'c5', userName: 'Vũ Hoàng Bách', text: 'Dùng tỉ lệ 2:1 là bao mượt nha bro 💡✨' }
    ],
    timestamp: Date.now() - 2700000
  },
  {
    id: 'moment_3',
    userName: 'Genetics Wizard',
    avatar: '🧬',
    title: 'Giáo Sư Phát Minh',
    elo: 1650,
    avatarFrame: 'neon_fire',
    imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?q=80&w=600&auto=format&fit=crop',
    caption: 'Thí nghiệm mô phỏng phiên mã ADN thành mARN vừa hoàn thành 100%! Cảm giác nối các cặp Nucleotit A-U, G-X cuốn thực sự! 🧬🌾💯',
    subject: 'biology',
    subjectLabel: 'Sinh Học Di Truyền',
    createdAt: '1 giờ trước',
    reactions: { heart: 51, brain: 34, fire: 29 },
    comments: [
      { id: 'c6', userName: 'Phạm Minh Anh', text: 'Quá đỉnh luôn b ơi! 🧬😍' },
      { id: 'c7', userName: 'Lê Hoàng Nam', text: 'Sinh học di truyền đỉnh cao! 👏🔥' }
    ],
    timestamp: Date.now() - 3600000
  },
  {
    id: 'moment_4',
    userName: 'Nguyễn Minh Khang',
    avatar: '⚡',
    title: 'Bậc Thầy Đấu Trường',
    elo: 1300,
    avatarFrame: 'top_1_sovereign',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop',
    caption: 'Chuỗi 8 trận thắng liên tiếp ở Đấu trường 1v1! Cú nổ ELO lên 1300 đỉnh nhất tuần này. Cảm ơn các đối thủ đã cho mình những trận đấu kịch tính! ⚔️🏆🔥',
    subject: 'physics',
    subjectLabel: 'Vật Lý Lượng Tử',
    createdAt: '2 giờ trước',
    reactions: { heart: 64, brain: 22, fire: 78 },
    comments: [
      { id: 'c8', userName: 'Bùi Minh Triết', text: 'Cao thủ quá bro ơi! 🏆💪' },
      { id: 'c9', userName: 'Hoàng Khánh Linh', text: 'Hẹn solo trận tới nha 🔥⚔️' }
    ],
    timestamp: Date.now() - 7200000
  },
  {
    id: 'moment_5',
    userName: 'Trần Thị Thanh Vân',
    avatar: '📐',
    title: 'Học Sinh Ưu Tú',
    elo: 1150,
    avatarFrame: 'cosmic_nebula',
    imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=600&auto=format&fit=crop',
    caption: 'Đêm muộn nhưng vẫn phải hoàn thành xong bài tập Tọa độ Không gian 3D. Góc giữa hai mặt phẳng ra đúng √3/2 ngọt lịm! 📐🌙✨',
    subject: 'math',
    subjectLabel: 'Toán Học 3D',
    createdAt: '3 giờ trước',
    reactions: { heart: 33, brain: 41, fire: 15 },
    comments: [
      { id: 'c10', userName: 'Kỹ Sư Lượng Tử', text: 'Dùng tích có hướng của 2 VTCP là ra ngay! 📐💡' },
      { id: 'c11', userName: 'Đặng Thùy Dương', text: 'Thức khuya học chăm quá b 🎉👏' }
    ],
    timestamp: Date.now() - 10800000
  },
  {
    id: 'moment_6',
    userName: 'Phạm Minh Anh',
    avatar: '🔬',
    title: 'Nhà Nghiên Cứu',
    elo: 1200,
    avatarFrame: 'antimatter_era',
    imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=600&auto=format&fit=crop',
    caption: 'Hiện tượng giao thoa ánh sáng đơn sắc với khe Y-âng tạo vân sáng vân tối nhìn như tác phẩm nghệ thuật. STEM HUB đúng là đỉnh! ⚡🌈😍',
    subject: 'physics',
    subjectLabel: 'Vật Lý Lượng Tử',
    createdAt: '4 giờ trước',
    reactions: { heart: 45, brain: 30, fire: 27 },
    comments: [
      { id: 'c12', userName: 'Nhà Sáng Chế Trẻ', text: 'Ảnh sắc nét vãi! 📸⚡' },
      { id: 'c13', userName: 'Genetics Wizard', text: 'Đẹp thực sự b ơi! ❤️✨' }
    ],
    timestamp: Date.now() - 14400000
  },
  {
    id: 'moment_7',
    userName: 'Lê Hoàng Nam',
    avatar: '🦁',
    title: 'Tân Binh Xuất Sắc',
    elo: 890,
    avatarFrame: 'top_100_silver',
    imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?q=80&w=600&auto=format&fit=crop',
    caption: 'Vừa giải xong sơ đồ phả hệ di truyền 4 thế hệ của môn Sinh! Tìm ra tỉ lệ kiểu gen bệnh di truyền chính xác 25%. Ai cần mẹo giải nhanh ib nhé! 🧬📊💪',
    subject: 'biology',
    subjectLabel: 'Sinh Học Di Truyền',
    createdAt: '5 giờ trước',
    reactions: { heart: 29, brain: 37, fire: 22 },
    comments: [
      { id: 'c14', userName: 'Nguyễn Minh Khang', text: 'Xin mẹo với bro ơi 🧬💡' },
      { id: 'c15', userName: 'Phan Thanh Hằng', text: 'Quá xuất sắc luôn 💯🎉' }
    ],
    timestamp: Date.now() - 18000000
  }
];

async function seed() {
  console.log("🌱 Ghi 9 Story và 7 Moment sinh động trực tiếp vào cơ sở dữ liệu Firestore...");

  for (const s of MOCK_STORIES) {
    await db.collection('stories').doc(s.id).set(s, { merge: true });
    console.log(`  └─ Story: ${s.userName}`);
  }

  for (const m of MOCK_MOMENTS) {
    await db.collection('moments').doc(m.id).set(m, { merge: true });
    console.log(`  └─ Moment: ${m.userName} (${m.subjectLabel})`);
  }

  console.log("✅ Đã ghi thành công toàn bộ dữ liệu Story & Moment phong phú vào Firestore!");
  process.exit(0);
}

seed().catch(err => {
  console.error("🚨 Lỗi khi seed Firestore:", err);
  process.exit(1);
});
