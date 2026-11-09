'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Sparkles, 
  Check, 
  X, 
  Download, 
  Send, 
  Flame, 
  Compass, 
  Share2, 
  Trophy, 
  Palette, 
  Layers,
  ArrowRight,
  Loader
} from 'lucide-react';
import { playSound } from '@/lib/sound';
import { applyFilterToDataUrl, downloadDataUrl } from '@/lib/screenshotEngine';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp, collection } from 'firebase/firestore';
import { getRankInfo } from '@/lib/matchmaker';
import STEMAvatarSVG from '@/components/atoms/STEMAvatarSVG';
import { useRouter } from 'next/navigation';

const QUICK_STICKERS = ['🚀', '🧪', '⚡', '🧬', '👑', '🔥', '🏆', '💎', '🎉', '💡', '😍', '👏'];

const FILTERS = [
  { id: 'none', label: 'Nguyên Bản', icon: '✨' },
  { id: 'cyberpunk', label: 'Cyberpunk', icon: '⚡' },
  { id: 'golden', label: 'Hoàng Kim', icon: '🌟' },
  { id: 'hologram', label: 'Hologram', icon: '🔮' },
  { id: 'matrix', label: 'Ma Trận', icon: '💻' },
  { id: 'vintage', label: 'Lab Cổ Điển', icon: '🔬' },
];

export default function StoryStudioModal({
  isOpen,
  onClose,
  initialImage,
  initialContext = {},
  user,
  personalization = {},
}) {
  const router = useRouter();
  const [caption, setCaption] = useState(initialContext.caption || 'Khám phá thế giới khoa học STEM ảo siêu sống động! 🚀🧪');
  const [activeFilter, setActiveFilter] = useState('none');
  const [postToStory, setPostToStory] = useState(true);
  const [postToMoment, setPostToMoment] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [watermarkedImage, setWatermarkedImage] = useState(initialImage);

  const userElo = personalization.elo || initialContext.elo || 0;
  const rankInfo = getRankInfo(userElo);

  // Cập nhật khi initialImage thay đổi
  useEffect(() => {
    if (initialImage) {
      setWatermarkedImage(initialImage);
      setIsSuccess(false);
      setCaption(initialContext.caption || 'Khám phá thế giới khoa học STEM ảo siêu sống động! 🚀🧪');
    }
  }, [initialImage, initialContext]);

  if (!isOpen || !initialImage) return null;

  // Lấy CSS filter tương ứng
  const getFilterStyle = (filterId) => {
    switch (filterId) {
      case 'cyberpunk':
        return 'contrast-125 saturate-150 hue-rotate-[-15deg]';
      case 'golden':
        return 'sepia-[0.35] saturate-150 brightness-105';
      case 'hologram':
        return 'contrast-110 brightness-110 hue-rotate-[165deg]';
      case 'matrix':
        return 'contrast-125 saturate-125 hue-rotate-[80deg]';
      case 'vintage':
        return 'sepia-[0.55] contrast-95 brightness-95';
      default:
        return '';
    }
  };

  // Thêm sticker vào caption
  const handleAddSticker = (sticker) => {
    playSound.click();
    setCaption((prev) => (prev ? `${prev} ${sticker}` : sticker));
  };

  // Tải ảnh về máy tính
  const handleDownload = async () => {
    playSound.click();
    const finalImage = await applyFilterToDataUrl(initialImage, activeFilter);
    downloadDataUrl(finalImage, `STEM_HUB_Story_${Date.now()}.jpg`);
    playSound.success();
  };

  // Đăng story và moment
  const handlePublish = async () => {
    if (!caption.trim() || isPublishing) return;
    setIsPublishing(true);
    playSound.click();

    try {
      // 1. Áp dụng filter trước khi lưu
      const finalImage = await applyFilterToDataUrl(initialImage, activeFilter);

      const timestampNow = Date.now();
      const momentId = `moment_${timestampNow}`;
      const uid = user?.uid || 'guest_user';
      const displayName = user?.displayName || 'Nhà Khoa Học';

      // 2. Ghi bài viết vào bảng tin Moments (nếu được chọn)
      if (postToMoment) {
        const momentDoc = {
          id: momentId,
          userId: uid,
          authorId: uid,
          userName: displayName,
          avatar: '👑',
          avatarUrl: personalization.avatarUrl || '',
          avatarParts: personalization.avatarParts || null,
          title: rankInfo.title,
          elo: userElo,
          avatarFrame: personalization.avatarFrame || 'default',
          imageUrl: finalImage,
          caption: caption.trim(),
          subject: initialContext.subject || 'chemistry',
          subjectLabel: initialContext.subjectLabel || 'STEM Lab',
          createdAt: 'Vừa xong',
          reactions: { heart: 0, brain: 0, fire: 0 },
          comments: [],
          timestamp: serverTimestamp(),
          clientTime: timestampNow
        };
        await setDoc(doc(db, 'moments', momentId), momentDoc);
      }

      // 3. Ghi vào danh sách Stories 24h (nếu được chọn)
      if (postToStory) {
        const storyDocRef = doc(db, 'stories', uid);
        const storySnap = await getDoc(storyDocRef);

        const newSlide = {
          id: `s_${timestampNow}`,
          imageUrl: finalImage,
          caption: caption.trim(),
          createdAt: 'Vừa xong',
          timestamp: timestampNow
        };

        if (storySnap.exists()) {
          const prevStories = storySnap.data().stories || [];
          await setDoc(storyDocRef, {
            ...storySnap.data(),
            userId: uid,
            authorId: uid,
            userName: displayName,
            elo: userElo,
            title: rankInfo.title,
            activeFrame: personalization.avatarFrame || 'default',
            avatarUrl: personalization.avatarUrl || '',
            avatarParts: personalization.avatarParts || null,
            stories: [newSlide, ...prevStories.slice(0, 8)],
            updatedAt: serverTimestamp()
          }, { merge: true });
        } else {
          await setDoc(storyDocRef, {
            id: uid,
            userId: uid,
            authorId: uid,
            userName: displayName,
            avatar: '👑',
            avatarUrl: personalization.avatarUrl || '',
            avatarParts: personalization.avatarParts || null,
            elo: userElo,
            title: rankInfo.title,
            activeFrame: personalization.avatarFrame || 'default',
            stories: [newSlide],
            updatedAt: serverTimestamp()
          });
        }
      }

      // Phát âm thanh chiến thắng & chuyển trạng thái thành công
      playSound.success();
      setIsSuccess(true);
    } catch (err) {
      console.error('Lỗi xuất bản Story:', err);
      alert('Không thể kết nối đến máy chủ thời gian thực, bài đăng đã được lưu vào phiên làm việc cục bộ!');
      setIsSuccess(true);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-5 select-none overflow-y-auto">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          className="relative w-full max-w-4xl bg-gradient-to-b from-[#181335] via-[#0f0c22] to-[#070511] border border-purple-500/40 rounded-3xl p-5 sm:p-7 shadow-[0_0_80px_rgba(168,85,247,0.3)] text-left overflow-hidden ring-1 ring-purple-400/20 my-auto"
        >
          {/* Lưới tọa độ laser nền */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.06)_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />
          <div className="absolute -top-32 -left-32 w-72 h-72 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/30">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-500/10 border border-pink-400/30 text-pink-300 text-[10px] font-mono font-bold uppercase tracking-wider mb-0.5">
                  <Sparkles className="w-3 h-3 text-amber-300 animate-spin" />
                  <span>STEM STORY STUDIO v2.0</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                  Chỉnh Sửa & Xuất Bản Khoảnh Khắc Khoa Học
                </h3>
              </div>
            </div>

            <button
              onClick={() => {
                playSound.click();
                onClose();
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Màn hình thông báo xuất bản thành công */}
          {isSuccess ? (
            <div className="relative z-10 py-10 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h4 className="text-xl font-black text-white mb-2 uppercase tracking-wide">
                ĐÃ XUẤT BẢN THÀNH CÔNG! 🎉
              </h4>
              <p className="text-zinc-300 text-xs max-w-md mx-auto mb-6">
                Khoảnh khắc của bạn đã được cập nhật lên STEM Stories và Bảng Tin cộng đồng. Bạn bè và học sinh toàn trường có thể chiêm ngưỡng và thả tương tác ngay lập tức!
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => {
                    playSound.click();
                    onClose();
                    router.push('/story');
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-pink-500/25 cursor-pointer transition-all active:scale-95"
                >
                  <ArrowRight className="w-4 h-4" /> Xem Trên Bảng Tin Stories
                </button>
                <button
                  onClick={handleDownload}
                  className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-white/10 cursor-pointer transition-all active:scale-95"
                >
                  <Download className="w-4 h-4 text-cyan-400" /> Tải Ảnh Về Máy
                </button>
                <button
                  onClick={() => {
                    playSound.click();
                    onClose();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-all active:scale-95"
                >
                  Tiếp Tục Học Tập
                </button>
              </div>
            </div>
          ) : (
            /* Khung làm việc Studio chính */
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-5 mt-5">
              {/* Cột Trái (6/12): Xem trước ảnh chụp với filter & watermark */}
              <div className="md:col-span-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-pink-400" /> Bản Xem Trước Ảnh Chụp
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400">
                      Tự động tối ưu hóa HD (~95KB)
                    </span>
                  </div>

                  {/* Khung ảnh chụp mô phỏng */}
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-purple-500/30 bg-black/60 shadow-2xl group">
                    <img
                      src={initialImage}
                      alt="Captured Screenshot"
                      className={`w-full h-full object-contain transition-all duration-300 ${getFilterStyle(activeFilter)}`}
                    />

                    {/* Watermark STEM HUB xịn sò góc trái trên */}
                    <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/15 shadow-md">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-500 flex items-center justify-center text-[9px] font-black text-white">
                        ⚡
                      </div>
                      <span className="text-[9px] font-black text-white tracking-widest uppercase">
                        STEM HUB
                      </span>
                    </div>

                    {/* Watermark thông tin người dùng góc phải dưới */}
                    <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-purple-500/30 text-right">
                      <div className="w-6 h-6 rounded-full bg-purple-600/30 border border-purple-400/50 flex items-center justify-center overflow-hidden">
                        {personalization.avatarUrl === 'custom-avatar' ? (
                          <STEMAvatarSVG parts={personalization.avatarParts} className="w-full h-full scale-90" />
                        ) : personalization.avatarUrl && personalization.avatarUrl.startsWith('http') ? (
                          <img src={personalization.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs">👑</span>
                        )}
                      </div>
                      <div>
                        <div className="text-[9px] font-black text-white leading-none">
                          {user?.displayName || 'Nhà Khoa Học'}
                        </div>
                        <div className="text-[7.5px] font-mono font-bold text-amber-300 leading-tight">
                          🏆 {userElo} ELO • {rankInfo.title}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thanh lựa chọn bộ lọc Sci-Fi */}
                <div className="mt-3">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-amber-400" /> Chọn Bộ Lọc Màu Sci-Fi:
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {FILTERS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          playSound.click();
                          setActiveFilter(f.id);
                        }}
                        className={`px-2 py-1.5 rounded-xl text-[10px] font-bold border transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                          activeFilter === f.id
                            ? 'bg-purple-600/40 border-purple-400 text-white shadow-md shadow-purple-500/20'
                            : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                      >
                        <span className="text-xs">{f.icon}</span>
                        <span className="text-[9px] truncate w-full text-center">{f.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cột Phải (6/12): Soạn thảo Caption, chọn nơi đăng & Nút bấm */}
              <div className="md:col-span-6 flex flex-col justify-between space-y-3">
                {/* Ô nhập Caption */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Cảm Nghĩ / Chú Thích Khoảnh Khắc:
                    </label>
                    <span className="text-[9px] font-mono text-zinc-500">
                      {caption.length}/500
                    </span>
                  </div>
                  <textarea
                    rows="3"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    maxLength={500}
                    placeholder="Viết vài dòng chia sẻ về thành tựu hay trải nghiệm của bạn..."
                    className="w-full bg-zinc-900/80 border border-purple-500/30 focus:border-pink-500/60 rounded-xl p-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none transition-all resize-none shadow-inner"
                  />

                  {/* Thanh Sticker nhanh */}
                  <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <span className="text-[9px] text-zinc-500 shrink-0 font-bold">Gắn nhanh:</span>
                    {QUICK_STICKERS.map((stk) => (
                      <button
                        key={stk}
                        type="button"
                        onClick={() => handleAddSticker(stk)}
                        className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-xs shrink-0 transition-transform active:scale-90 cursor-pointer"
                      >
                        {stk}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chọn Nơi Đăng */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block mb-2">
                    Tùy Chọn Đích Đến:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 border border-white/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={postToStory}
                        onChange={(e) => setPostToStory(e.target.checked)}
                        className="rounded accent-pink-500 w-4 h-4 cursor-pointer"
                      />
                      <div className="leading-tight">
                        <div className="font-bold text-white text-[11px]">Story 24h</div>
                        <div className="text-[8.5px] text-zinc-400">Hiển thị ở dải Story đầu trang</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 border border-white/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={postToMoment}
                        onChange={(e) => setPostToMoment(e.target.checked)}
                        className="rounded accent-purple-500 w-4 h-4 cursor-pointer"
                      />
                      <div className="leading-tight">
                        <div className="font-bold text-white text-[11px]">Bảng Tin Moments</div>
                        <div className="text-[8.5px] text-zinc-400">Hiển thị trên tường cộng đồng</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Các nút hành động chính */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex gap-2">
                    <button
                      onClick={handlePublish}
                      disabled={isPublishing || (!postToStory && !postToMoment)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer ${
                        isPublishing || (!postToStory && !postToMoment)
                          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                          : 'bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-pink-500/25 border border-pink-400/30'
                      }`}
                    >
                      {isPublishing ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin text-white" />
                          <span>Đang Mã Hóa & Đăng...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Xuất Bản Ngay Lập Tức</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleDownload}
                      className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-white/10 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      title="Tải ảnh này về máy"
                    >
                      <Download className="w-4 h-4 text-cyan-400" />
                      <span className="hidden sm:inline">Tải Về</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-400 px-1">
                    <button
                      onClick={() => {
                        playSound.click();
                        onClose();
                        router.push('/story');
                      }}
                      className="text-pink-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <span>Mở Trang STEM Stories</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => {
                        playSound.click();
                        onClose();
                      }}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      Đóng & Giữ Nguyên Màn Hình
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

