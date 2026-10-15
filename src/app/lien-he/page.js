'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  MessageSquarePlus, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Clock, 
  Mail,
  CheckCheck,
  CornerDownRight
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { playSound } from '@/lib/sound';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';

export default function LienHePage() {
  const user = useAppStore((state) => state.user);

  const [subject, setSubject] = useState('Góp ý tính năng mới');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successStatus, setSuccessStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [myMessages, setMyMessages] = useState([]);

  // Kiểm tra tài khoản hiện tại có phải Admin không
  const isAdmin = Boolean(
    user?.role === 'admin' || 
    user?.email?.toLowerCase() === 'hohoanganh20092021@gmail.com' || 
    user?.email?.toLowerCase() === 'admin123@gmail.com'
  );

  // 1. Tải danh sách tin nhắn đã gửi từ localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('stemhub_my_sent_messages');
      if (saved) {
        setMyMessages(JSON.parse(saved));
      }
    } catch (_) {}
  }, []);

  // 2. Lắng nghe Realtime Firestore từ collection contact_messages nếu người dùng đã đăng nhập
  useEffect(() => {
    if (!user?.uid) return;

    try {
      const q = query(
        collection(db, 'contact_messages'),
        where('userId', '==', user.uid)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({
            id: docSnap.id,
            ...docSnap.data()
          });
        });

        list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        if (list.length > 0) {
          setMyMessages(list);
          try {
            localStorage.setItem('stemhub_my_sent_messages', JSON.stringify(list.slice(0, 10)));
          } catch (_) {}
        }
      }, (err) => {
        // Yên lặng bỏ qua nếu quyền chưa sẵn sàng
      });

      return () => unsubscribe();
    } catch (_) {}
  }, [user?.uid]);

  // 3. Lắng nghe cập nhật từng docId và sự kiện đồng bộ từ Admin
  useEffect(() => {
    // A. Lắng nghe sự kiện cập nhật tức thì nếu Admin và học sinh ở cùng máy/trình duyệt
    const handleLocalSync = () => {
      try {
        const saved = localStorage.getItem('stemhub_my_sent_messages');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setMyMessages(parsed);
          }
        }
      } catch (_) {}
    };

    window.addEventListener('storage', handleLocalSync);
    window.addEventListener('stemhub_contact_updated', handleLocalSync);

    // B. Lắng nghe Realtime Firestore theo từng ID tin nhắn mà học sinh đã gửi
    let unsubs = [];
    try {
      const saved = localStorage.getItem('stemhub_my_sent_messages');
      const parsed = saved ? JSON.parse(saved) : [];
      if (Array.isArray(parsed) && parsed.length > 0 && db) {
        // Tự động kiểm tra cập nhật ngay lập tức bằng getDoc cho các tin chưa có phản hồi
        parsed.forEach(async (item) => {
          if (!item.id) return;
          try {
            const docRef = doc(db, 'contact_messages', item.id);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
              const liveData = snap.data();
              if (liveData.adminReply || liveData.status === 'replied') {
                setMyMessages((prev) => {
                  const updated = prev.map((m) => m.id === snap.id ? { ...m, ...liveData, id: snap.id } : m);
                  try {
                    localStorage.setItem('stemhub_my_sent_messages', JSON.stringify(updated.slice(0, 10)));
                  } catch (_) {}
                  return updated;
                });
              }
            }
          } catch (_) {}
        });

        // Lắng nghe realtime onSnapshot
        unsubs = parsed.map((item) => {
          if (!item.id) return () => {};
          try {
            return onSnapshot(doc(db, 'contact_messages', item.id), (docSnap) => {
              if (docSnap.exists()) {
                const liveData = { id: docSnap.id, ...docSnap.data() };
                setMyMessages((prev) => {
                  const updated = prev.map((m) => m.id === liveData.id ? { ...m, ...liveData } : m);
                  try {
                    localStorage.setItem('stemhub_my_sent_messages', JSON.stringify(updated.slice(0, 10)));
                  } catch (_) {}
                  return updated;
                });
              }
            }, () => {});
          } catch (_) {
            return () => {};
          }
        });
      }
    } catch (_) {}

    return () => {
      window.removeEventListener('storage', handleLocalSync);
      window.removeEventListener('stemhub_contact_updated', handleLocalSync);
      unsubs.forEach((u) => {
        if (typeof u === 'function') u();
      });
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (message.trim().length < 5) {
      setErrorMessage('Nội dung phản hồi cần tối thiểu 5 ký tự.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessStatus(null);

    try {
      try { playSound.click(); } catch (_) {}

      const payload = {
        name: user?.displayName || user?.name || 'Học sinh STEM HUB',
        email: user?.email || '',
        userId: user?.uid || null,
        subject,
        message: message.trim()
      };

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể gửi tin nhắn. Vui lòng thử lại sau.');
      }

      try { playSound.success(); } catch (_) {}
      setSuccessStatus(data.message || 'Tin nhắn của bạn đã được chuyển đến Ban Quản Trị thành công!');
      
      // Lưu vào danh sách tin nhắn cá nhân để học sinh tiện theo dõi
      const newMsg = {
        id: data.messageId || 'msg_' + Date.now(),
        subject,
        message: message.trim(),
        timestamp: Date.now(),
        status: 'sent'
      };
      const updatedList = [newMsg, ...myMessages.slice(0, 9)];
      setMyMessages(updatedList);
      try {
        localStorage.setItem('stemhub_my_sent_messages', JSON.stringify(updatedList));
      } catch (_) {}

      setMessage('');
    } catch (err) {
      try { playSound.error(); } catch (_) {}
      setErrorMessage(err.message || 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccessStatus(null);
    setErrorMessage('');
    setMessage('');
  };

  return (
    <div className="p-4 md:p-10 max-w-2xl mx-auto text-text-primary">
      {/* Banner thông báo nếu người dùng đang đăng nhập bằng tài khoản Admin */}
      {isAdmin && (
        <div className="mb-6 p-4 rounded-3xl bg-accent-pink/10 border border-accent-pink/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-accent-pink/5 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent-pink/20 text-accent-pink shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-text-primary">Bạn đang đăng nhập bằng Tài Khoản Quản Trị Viên</p>
              <p className="text-[11px] text-text-secondary">Tất cả góp ý và tin nhắn của học sinh được lưu trữ tập trung tại Hòm thư Admin.</p>
            </div>
          </div>
          <Link
            href="/admin/contact"
            className="px-3.5 py-2 rounded-xl bg-accent-pink hover:bg-accent-pink/90 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-accent-pink/20 shrink-0 cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Mở Hòm Thư Admin</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Tiêu đề trang */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-pink/10 border border-accent-pink/20 text-accent-pink text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Hòm Thư Trực Tiếp Đến Admin</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-text-primary tracking-tight">
          Liên Hệ & Góp Ý
        </h1>
        <p className="text-text-secondary text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
          Gửi tin nhắn hoặc phản hồi trực tiếp cho ban quản trị dự án STEM HUB. Mọi ý kiến đóng góp sẽ được chuyển tiếp thẳng đến tài khoản Admin.
        </p>
      </div>

      {/* Khung Form trung tâm */}
      <div className="bg-bg-secondary p-6 md:p-8 rounded-3xl border border-border-theme shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-accent-pink/10 rounded-full blur-3xl pointer-events-none" />

        {successStatus ? (
          <div className="py-10 px-4 text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-success/15 border border-success/30 text-success rounded-full flex items-center justify-center mx-auto shadow-lg shadow-success/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-text-primary">Đã Gửi Thành Công!</h3>
            <p className="text-xs md:text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
              {successStatus}
            </p>
            {user && (
              <p className="text-[11px] text-accent-pink/80 font-mono">
                Gửi từ tài khoản: {user.displayName || user.email || 'Học sinh'}
              </p>
            )}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2.5 rounded-xl bg-bg-tertiary hover:bg-border-theme border border-border-theme text-text-primary text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                Gửi thêm tin nhắn khác
              </button>
              {isAdmin && (
                <Link
                  href="/admin/contact"
                  className="px-6 py-2.5 rounded-xl bg-accent-pink hover:bg-accent-pink/90 text-white text-xs font-bold transition-all shadow-md shadow-accent-pink/20"
                >
                  Xem trong Hòm Thư Admin
                </Link>
              )}
            </div>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Thông tin tài khoản người gửi */}
            {user ? (
              <div className="p-3.5 rounded-2xl bg-bg-tertiary/70 border border-border-theme flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-text-secondary">Tài khoản gửi:</span>
                  <span className="font-bold text-text-primary">{user.displayName || user.name || 'Học sinh'}</span>
                </div>
                {user.email && (
                  <span className="text-[11px] text-text-secondary font-mono truncate max-w-[180px]">
                    {user.email}
                  </span>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-bg-tertiary/50 border border-border-theme text-[11px] text-text-secondary flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-pink" />
                <span>Bạn đang gửi dưới dạng học sinh khách. Phản hồi sẽ được lưu trữ trực tiếp trên hệ thống Admin.</span>
              </div>
            )}

            {/* Chủ đề liên hệ */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
                <MessageSquarePlus className="w-3.5 h-3.5 text-accent-pink" />
                <span>Chủ đề liên hệ / góp ý</span>
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-bg-tertiary text-text-primary rounded-2xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-accent-pink/50 border border-border-theme transition-all text-xs cursor-pointer"
              >
                <option value="Góp ý tính năng mới">💡 Góp ý tính năng mới cho website</option>
                <option value="Báo lỗi kỹ thuật (Bug Report)">🐛 Báo cáo lỗi kỹ thuật / phòng lab 3D</option>
                <option value="Đóng góp câu hỏi & tài liệu học tập">📚 Đóng góp câu hỏi & tài liệu STEM</option>
                <option value="Góp ý về Đấu trường 1v1">⚔️ Góp ý về chế độ Đấu trường PvP</option>
                <option value="Ý kiến khác">💬 Ý kiến khác</option>
              </select>
            </div>

            {/* Nội dung tin nhắn */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-text-secondary">
                <span>Nội dung tin nhắn</span>
                <span className="text-[10px] text-text-secondary font-mono">
                  {message.length}/3000 ký tự
                </span>
              </div>
              <textarea 
                rows={5}
                required
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                disabled={isSubmitting}
                placeholder="Nhập tin nhắn hoặc góp ý của bạn gửi đến Admin (tối thiểu 5 ký tự)..."
                className="w-full bg-bg-tertiary text-text-primary placeholder:text-text-secondary/60 rounded-2xl p-4 focus:outline-none focus:ring-1 focus:ring-accent-pink/50 border border-border-theme transition-all resize-none text-xs leading-relaxed"
              />
              {message.trim().length > 0 && message.trim().length < 5 && (
                <p className="text-[11px] text-amber-500 font-medium animate-in fade-in duration-200">
                  ⚠️ Vui lòng nhập thêm {5 - message.trim().length} ký tự nữa để có thể bấm gửi.
                </p>
              )}
            </div>
            
            {/* Nút gửi */}
            <button 
              type="submit" 
              disabled={isSubmitting || message.trim().length < 5}
              className="w-full py-3.5 bg-accent-pink hover:bg-accent-pink/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-pink/20 active:scale-95 text-xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang chuyển đến Admin...</span>
                </>
              ) : message.trim().length < 5 ? (
                <>
                  <Send className="w-4 h-4 opacity-70" />
                  <span>Nhập tối thiểu 5 ký tự để gửi</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Gửi Tin Nhắn Đến Admin</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>


      {/* Lịch sử các tin nhắn người dùng đã gửi kèm phản hồi của Admin */}
      {myMessages.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-accent-pink" />
              <span>Tin nhắn bạn đã gửi gần đây</span>
            </h3>
            <span className="text-[10px] text-text-secondary font-mono">
              {myMessages.length} tin nhắn
            </span>
          </div>

          <div className="space-y-3">
            {myMessages.map((msg) => {
              const hasReply = Boolean(msg.adminReply);

              return (
                <div 
                  key={msg.id} 
                  className={`p-4 rounded-3xl border transition-all ${
                    hasReply 
                      ? 'bg-bg-secondary border-emerald-500/40 shadow-lg shadow-emerald-500/5' 
                      : 'bg-bg-secondary border-border-theme'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-bold text-text-primary text-xs">{msg.subject}</span>
                    {hasReply ? (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30 inline-flex items-center gap-1">
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Admin đã phản hồi</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-text-secondary font-medium bg-bg-tertiary px-2 py-0.5 rounded-full border border-border-theme inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-pink" />
                        <span>Đã chuyển đến Admin</span>
                      </span>
                    )}
                  </div>

                  {/* Nội dung bạn đã gửi */}
                  <p className="text-text-secondary text-[11px] leading-relaxed line-clamp-3 mb-2">
                    {msg.message}
                  </p>

                  <div className="text-[10px] text-text-secondary/70 font-mono mb-2">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleString('vi-VN') : ''}
                  </div>

                  {/* KHUNG CÂU TRẢ LỜI CỦA ADMIN */}
                  {hasReply ? (
                    <div className="mt-3 p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-200 space-y-1.5 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Ban Quản Trị STEM HUB Đã Phản Hồi:</span>
                        </span>
                        {msg.adminReplyAt && (
                          <span className="text-[10px] font-mono text-emerald-400/80">
                            {new Date(msg.adminReplyAt).toLocaleString('vi-VN')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-emerald-100 font-medium leading-relaxed whitespace-pre-wrap">
                        {msg.adminReply}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 text-[10px] text-text-secondary/80 flex items-center gap-1.5 italic">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span>Đang chờ Admin xem và giải đáp...</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
