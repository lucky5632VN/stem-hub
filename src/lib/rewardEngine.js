/**
 * IMPLICIT REWARD ENGINE (Continuous Learning Label Generator)
 * 
 * ⚠️ GIÁ TRỊ KHỞI TẠO TẠM THỜI — chưa qua kiểm chứng bằng dữ liệu thật.
 * Cần hiệu chỉnh lại sau khi có đủ dữ liệu tương tác thật (xem TODO Giai đoạn 5).
 */
export const REWARD_SIGNAL_CONFIG = {
  actionSuccess: 1.0,     // Thao tác Lab an toàn đúng / Trả lời đúng câu hỏi cùng dạng
  dwellTimeMin: 15,       // giây (khung thời gian đọc tối thiểu tạm thời)
  dwellTimeMax: 45,       // giây (khung thời gian đọc tối đa tạm thời)
  dwellTimeScore: 0.5,    // Điểm thưởng khi dwell time nằm trong khung
  reaskPenalty: -0.5,     // Hình phạt khi hỏi lại "không hiểu" / đóng modal nhanh
};

/**
 * Trọng số mặc định bằng nhau theo đúng quy tắc KHÔNG ĐOÁN SẴN
 */
export const DEFAULT_REWARD_WEIGHTS = {
  wAction: 0.33,
  wTime: 0.33,
  wReask: 0.34
};

/**
 * Tính toán điểm reward dựa trên tín hiệu hành vi và lưu log chi tiết (bao gồm dwellTime thô)
 */
export function calculateImplicitReward({
  actionSuccess = false,
  dwellTimeSeconds = 0,
  isReaskOrQuickClose = false,
  weights = DEFAULT_REWARD_WEIGHTS
}) {
  let sAction = actionSuccess ? REWARD_SIGNAL_CONFIG.actionSuccess : 0.0;
  
  let sTime = 0.0;
  if (dwellTimeSeconds >= REWARD_SIGNAL_CONFIG.dwellTimeMin && dwellTimeSeconds <= REWARD_SIGNAL_CONFIG.dwellTimeMax) {
    sTime = REWARD_SIGNAL_CONFIG.dwellTimeScore;
  }

  let pReask = isReaskOrQuickClose ? REWARD_SIGNAL_CONFIG.reaskPenalty : 0.0;

  // Reward thô trong khoảng [-0.5, 1.5] -> kẹp về [-1.0, 1.0]
  const rawReward = (weights.wAction * sAction) + (weights.wTime * sTime) + (weights.wReask * pReask);
  const clampedReward = Math.max(-1.0, Math.min(1.0, rawReward));

  // Chuẩn hóa [-1.0, 1.0] sang nhãn huấn luyện Sigmoid [0.0, 1.0] cho Tầng 3
  const normalizedLabel = (clampedReward + 1.0) / 2.0;

  return {
    rawReward,
    clampedReward,
    normalizedLabel,
    rawMetrics: {
      dwellTimeSeconds, // GHI LẠI DỮ LIỆU DWELL TIME THÔ ĐỂ PHÂN TÍCH HISTOGRAM Ở GIAI ĐOẠN 5
      actionSuccess,
      isReaskOrQuickClose,
      timestamp: Date.now()
    }
  };
}

/**
 * HIỆU CHỈNH KHUNG DWELL-TIME KHÔNG HARDCODE (Addendum #1 Task - Giai đoạn 5)
 * Tự động cập nhật `dwellTimeMin` & `dwellTimeMax` dựa trên phân bố Percentile (P25 - P75)
 */
export function updateRewardDwellConfig(dwellTimeMin, dwellTimeMax) {
  if (typeof dwellTimeMin === 'number' && typeof dwellTimeMax === 'number' && dwellTimeMin < dwellTimeMax) {
    REWARD_SIGNAL_CONFIG.dwellTimeMin = Math.max(5, dwellTimeMin);
    REWARD_SIGNAL_CONFIG.dwellTimeMax = Math.min(300, dwellTimeMax);
    console.log(`[RewardEngine] Đã hiệu chỉnh Dwell-time Config: Min=${REWARD_SIGNAL_CONFIG.dwellTimeMin}s, Max=${REWARD_SIGNAL_CONFIG.dwellTimeMax}s`);
    return true;
  }
  return false;
}

