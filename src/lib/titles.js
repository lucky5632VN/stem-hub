export const TITLES_MAP = {
  apprentice: 'Tập sự STEM',
  alchemist_expert: 'Bậc thầy Hóa học',
  math_wizard: 'Chiến thần Toán học',
  physics_guru: 'Kỹ sư Cơ học',
  cosmic_explorer: 'Nhà thám hiểm Vũ trụ',
  nuclear_engineer: 'Kỹ sư Phản ứng hạt',
  quantum_master: 'Thạc sĩ Lượng tử',
  stem_legend: 'Huyền thoại STEM',
  multiverse_theorist: 'Nhà lập thuyết Đa vũ trụ',
  dimension_creator: 'Đấng kiến tạo Không gian',
  top_1_universe: 'Đại Đế STEM 👑',
  top_10_legend: 'Huyền thoại Đấu trường',
  top_100_elite: 'Đại Cao Thủ STEM',
  // Legacy / fallback keys
  scholar: 'Học giả STEM',
  adept: 'Chuyên gia STEM',
  master: 'Bậc thầy STEM',
  grandmaster: 'Huyền thoại STEM',
  academician: 'Viện sĩ STEM'
};

export const getTitleLabel = (titleKey) => {
  if (!titleKey) return 'Tập sự STEM';
  return TITLES_MAP[titleKey] || titleKey;
};
