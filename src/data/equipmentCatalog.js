// Danh mục 10 Thẻ bài / Trang bị Đấu trường STEM (Giá > 1000 Pha Lê)
export const EQUIPMENT_CATALOG = [
  {
    id: 'card_elo_shield',
    name: 'Thẻ Bảo Hộ ELO',
    description: 'Thua trận tiếp theo không bị trừ ELO.',
    type: 'pre_match',
    category: 'defense',
    crystalPrice: 2400,
    icon: 'ShieldCheck',
    color: 'from-blue-500 to-cyan-500',
    borderColor: 'border-blue-400'
  },
  {
    id: 'card_crystal_magnet',
    name: 'Thẻ Nam Châm Pha Lê',
    description: 'Gấp đôi (x2) lượng Pha Lê nhận được nếu giành chiến thắng.',
    type: 'pre_match',
    category: 'buff',
    crystalPrice: 1800,
    icon: 'Gem',
    color: 'from-purple-500 to-indigo-500',
    borderColor: 'border-purple-400'
  },
  {
    id: 'card_subject_ban',
    name: 'Thẻ Cấm Thuật',
    description: 'Loại bỏ 1 môn học khỏi vòng xoay random ở lượt ghép trận tới.',
    type: 'pre_match',
    category: 'special',
    crystalPrice: 1400,
    icon: 'Ban',
    color: 'from-red-500 to-rose-600',
    borderColor: 'border-red-400'
  },
  {
    id: 'card_incognito',
    name: 'Thẻ Ẩn Danh',
    description: 'Ẩn tên, avatar và chỉ số ở màn hình chờ ghép trận (hiện ???).',
    type: 'pre_match',
    category: 'special',
    crystalPrice: 1200,
    icon: 'UserX',
    color: 'from-slate-600 to-zinc-800',
    borderColor: 'border-slate-400'
  },
  {
    id: 'card_wildcard_slot',
    name: 'Thẻ Lá Bài Tẩy',
    description: 'Mở rộng slot trang bị trận tiếp theo lên 4 thẻ (thay vì 3).',
    type: 'pre_match',
    category: 'buff',
    crystalPrice: 3500,
    icon: 'Layers',
    color: 'from-amber-400 to-yellow-600',
    borderColor: 'border-amber-400'
  },
  {
    id: 'card_time_freeze',
    name: 'Thẻ Đóng Băng Thời Gian',
    description: 'Khóa toàn bộ thao tác màn hình đối thủ trong 3 giây.',
    type: 'in_match',
    category: 'debuff',
    crystalPrice: 2500,
    icon: 'Snowflake',
    color: 'from-cyan-400 to-blue-600',
    borderColor: 'border-cyan-300'
  },
  {
    id: 'card_smoke_fog',
    name: 'Thẻ Mù Sương',
    description: 'Gây mờ và giật màn hình đối thủ trong 5 giây.',
    type: 'in_match',
    category: 'debuff',
    crystalPrice: 2000,
    icon: 'CloudFog',
    color: 'from-gray-500 to-slate-700',
    borderColor: 'border-gray-400'
  },
  {
    id: 'card_progress_steal',
    name: 'Thẻ Đánh Cắp Tiến Độ',
    description: 'Trừ 10% tiến độ của đối thủ và cộng vào tiến độ bản thân.',
    type: 'in_match',
    category: 'debuff',
    crystalPrice: 3000,
    icon: 'Zap',
    color: 'from-emerald-400 to-green-600',
    borderColor: 'border-emerald-400'
  },
  {
    id: 'card_ai_assist',
    name: 'Thẻ Trợ Giúp AI',
    description: 'Loại 2 đáp án sai (Sinh MCQ) hoặc gợi ý 1 phần công thức (Toán/Lý).',
    type: 'in_match',
    category: 'buff',
    crystalPrice: 1600,
    icon: 'Bot',
    color: 'from-violet-500 to-fuchsia-600',
    borderColor: 'border-violet-400'
  },
  {
    id: 'card_dispel',
    name: 'Thẻ Giải Trừ',
    description: 'Xóa lập tức mọi hiệu ứng Đóng băng / Mù sương đang áp lên bản thân.',
    type: 'in_match',
    category: 'defense',
    crystalPrice: 1500,
    icon: 'Sparkles',
    color: 'from-teal-400 to-emerald-500',
    borderColor: 'border-teal-400'
  },
  {
    id: 'card_counter',
    name: 'Thẻ Phản Đòn',
    description: 'Tự động đảo ngược hiệu ứng Mù Sương hoặc Đánh Cắp Tiến Độ của đối thủ sang chính đối thủ!',
    type: 'in_match',
    category: 'defense',
    crystalPrice: 2800,
    icon: 'ShieldAlert',
    color: 'from-amber-500 to-red-600',
    borderColor: 'border-amber-400'
  },
  {
    id: 'card_magic_hand',
    name: 'Thẻ Bàn Tay Ma Thuật',
    description: 'Tước đoạt 1 lá bài ngẫu nhiên từ khay trang bị của đối thủ về cho mình (Tối đa 2 lần/trận).',
    type: 'in_match',
    category: 'special',
    crystalPrice: 3200,
    icon: 'Hand',
    color: 'from-fuchsia-500 to-purple-800',
    borderColor: 'border-fuchsia-400'
  }
];

export const getEquipmentById = (cardId) => {
  return EQUIPMENT_CATALOG.find(c => c.id === cardId) || null;
};
