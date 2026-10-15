'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { 
  Mail, MessageSquare, Search, Trash2, CheckCircle, Clock, 
  User, Send, RefreshCw, AlertCircle, Sparkles, Inbox, Filter, 
  CornerDownRight, CheckCheck, Loader2, Edit3
} from 'lucide-react';
import { playSound } from '@/lib/sound';
import { useAppStore } from '@/store/useAppStore';

export default function AdminContactMessagesPage() {
  const currentUser = useAppStore((state) => state.user);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'unread', 'read', 'replied'
  const [selectedMessage, setSelectedMessage] = useState(null);

  // State cho việc phản hồi
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyFeedback, setReplyFeedback] = useState(null); // { type: 'success' | 'error', text: '' }
  const [isEditingReply, setIsEditingReply] = useState(false);

  // Lắng nghe Realtime Firestore từ collection contact_messages
  useEffect(() => {
    setLoading(true);
    const messagesCol = collection(db, 'contact_messages');
    
    const unsubscribe = onSnapshot(messagesCol, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });

      // Sắp xếp theo timestamp giảm dần (tin mới nhất lên đầu)
      list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setMessages(list);
      setLoading(false);

      // Cập nhật selectedMessage nếu có thay đổi từ realtime
      setSelectedMessage((prev) => {
        if (!prev) return null;
        const updated = list.find((m) => m.id === prev.id);
        return updated || prev;
      });
    }, (err) => {
      if (err?.code !== 'permission-denied') {
        console.warn('Lỗi tải contact_messages:', err);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Khi chọn một tin nhắn mới
  const handleSelectMessage = (msg) => {
    playSound.click();
    setSelectedMessage(msg);
    setReplyText(msg.adminReply || '');
    setIsEditingReply(!msg.adminReply);
    setReplyFeedback(null);

    // Nếu tin nhắn đang unread thì tự động chuyển sang read
    if (msg.status !== 'read' && msg.status !== 'replied') {
      try {
        updateDoc(doc(db, 'contact_messages', msg.id), { status: 'read' });
      } catch (_) {}
    }
  };

  // Đánh dấu đã đọc / chưa đọc
  const handleToggleRead = async (msg, e) => {
    e?.stopPropagation();
    try {
      playSound.click();
      const newStatus = msg.status === 'read' ? 'unread' : 'read';
      const msgRef = doc(db, 'contact_messages', msg.id);
      await updateDoc(msgRef, { status: newStatus });
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái:', err);
    }
  };

  // Xóa tin nhắn
  const handleDelete = async (msgId, e) => {
    e?.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa tin nhắn góp ý này?')) return;
    try {
      playSound.click();
      await deleteDoc(doc(db, 'contact_messages', msgId));
      if (selectedMessage?.id === msgId) {
        setSelectedMessage(null);
        setReplyText('');
      }
    } catch (err) {
      console.error('Lỗi xóa tin nhắn:', err);
    }
  };

  // Gửi phản hồi đến học sinh
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!selectedMessage || !replyText.trim()) return;

    setIsSendingReply(true);
    setReplyFeedback(null);

    const cleanReply = replyText.trim();
    const replyTimestamp = Date.now();
    const adminEmail = currentUser?.email || 'hohoanganh20092021@gmail.com';

    try {
      playSound.click();

      // 1. Cập nhật trực tiếp lên Firestore từ Admin Auth session đã đăng nhập
      if (db && selectedMessage.id) {
        try {
          const docRef = doc(db, 'contact_messages', selectedMessage.id);
          await updateDoc(docRef, {
            adminReply: cleanReply,
            adminReplyAt: replyTimestamp,
            status: 'replied',
            repliedBy: adminEmail
          });
        } catch (dbErr) {
          console.warn('Lỗi ghi Firestore từ client admin:', dbErr);
        }
      }

      // 2. Cập nhật ngay trong LocalStorage và broadcast sự kiện (hỗ trợ hiển thị tức thì trên cùng máy)
      try {
        const saved = localStorage.getItem('stemhub_my_sent_messages');
        if (saved) {
          const parsed = JSON.parse(saved);
          const updated = parsed.map((m) => 
            m.id === selectedMessage.id 
              ? { ...m, status: 'replied', adminReply: cleanReply, adminReplyAt: replyTimestamp, repliedBy: adminEmail } 
              : m
          );
          localStorage.setItem('stemhub_my_sent_messages', JSON.stringify(updated));
        }
        window.dispatchEvent(new CustomEvent('stemhub_contact_updated', {
          detail: { messageId: selectedMessage.id, adminReply: cleanReply, adminReplyAt: replyTimestamp }
        }));
      } catch (_) {}

      // 3. Cập nhật state nội bộ của trang Admin
      setSelectedMessage((prev) => prev ? {
        ...prev,
        adminReply: cleanReply,
        adminReplyAt: replyTimestamp,
        status: 'replied',
        repliedBy: adminEmail
      } : null);

      setMessages((prev) => prev.map((m) => 
        m.id === selectedMessage.id 
          ? { ...m, adminReply: cleanReply, adminReplyAt: replyTimestamp, status: 'replied', repliedBy: adminEmail } 
          : m
      ));

      // 4. Gọi API gửi Email thông báo tới học sinh nếu có email
      let emailSent = false;
      try {
        const res = await fetch('/api/contact/reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId: selectedMessage.id,
            replyText: cleanReply,
            adminEmail,
            studentEmail: selectedMessage.email,
            studentName: selectedMessage.name,
            subject: selectedMessage.subject,
            originalMessage: selectedMessage.message
          })
        });
        const data = await res.json();
        emailSent = Boolean(data.emailSent);
      } catch (apiErr) {
        console.warn('Lỗi gọi API gửi email:', apiErr);
      }

      try { playSound.success(); } catch (_) {}
      setReplyFeedback({
        type: 'success',
        text: emailSent 
          ? 'Đã lưu phản hồi vào hệ thống và gửi email thông báo cho học sinh!' 
          : 'Đã lưu phản hồi thành công! Học sinh sẽ nhìn thấy câu trả lời ngay trên website.'
      });
      setIsEditingReply(false);
    } catch (err) {
      try { playSound.error(); } catch (_) {}
      setReplyFeedback({
        type: 'error',
        text: err.message || 'Lỗi khi gửi phản hồi.'
      });
    } finally {
      setIsSendingReply(false);
    }
  };

  // Lọc theo từ khóa tìm kiếm và trạng thái
  const filteredMessages = messages.filter((msg) => {
    const matchesFilter = 
      filterStatus === 'all' ? true :
      filterStatus === 'unread' ? (msg.status !== 'read' && msg.status !== 'replied') :
      filterStatus === 'replied' ? msg.status === 'replied' :
      (msg.status === 'read');

    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = 
      !term ||
      (msg.name && msg.name.toLowerCase().includes(term)) ||
      (msg.email && msg.email.toLowerCase().includes(term)) ||
      (msg.subject && msg.subject.toLowerCase().includes(term)) ||
      (msg.message && msg.message.toLowerCase().includes(term)) ||
      (msg.adminReply && msg.adminReply.toLowerCase().includes(term));

    return matchesFilter && matchesSearch;
  });

  const unreadCount = messages.filter(m => m.status !== 'read' && m.status !== 'replied').length;
  const repliedCount = messages.filter(m => m.status === 'replied' || Boolean(m.adminReply)).length;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Tiêu đề trang & Thống kê nhanh */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1f2235] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold mb-2">
            <Mail className="w-3.5 h-3.5" />
            <span>Hộp Thư Quản Trị Hệ Thống</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Hòm Thư Liên Hệ & Góp Ý
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-500 text-white animate-pulse">
                {unreadCount} mới
              </span>
            )}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Đọc, xử lý và phản hồi trực tiếp các tin nhắn đóng góp ý kiến từ học sinh trên toàn hệ thống STEM HUB.
          </p>
        </div>

        {/* Các thẻ chỉ số */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-[#121420] border border-[#1f2235] text-center">
            <div className="text-xs text-zinc-400">Tổng tin nhắn</div>
            <div className="text-lg font-black text-white">{messages.length}</div>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-center">
            <div className="text-xs text-pink-400 font-semibold">Chưa xử lý</div>
            <div className="text-lg font-black text-pink-400">{unreadCount}</div>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <div className="text-xs text-emerald-400 font-semibold">Đã phản hồi</div>
            <div className="text-lg font-black text-emerald-400">{repliedCount}</div>
          </div>
        </div>
      </div>

      {/* Thanh công cụ: Tìm kiếm & Lọc trạng thái */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Tìm kiếm */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, email, nội dung, phản hồi..."
            className="w-full bg-[#121420] border border-[#1f2235] text-zinc-200 text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-pink-500/50 transition-all placeholder:text-zinc-500"
          />
        </div>

        {/* Tab Lọc */}
        <div className="flex items-center gap-1.5 bg-[#121420] p-1 rounded-xl border border-[#1f2235] self-stretch sm:self-auto overflow-x-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === 'all' ? 'bg-pink-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Tất cả ({messages.length})
          </button>
          <button
            onClick={() => setFilterStatus('unread')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === 'unread' ? 'bg-pink-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Chưa đọc ({unreadCount})
          </button>
          <button
            onClick={() => setFilterStatus('replied')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === 'replied' ? 'bg-emerald-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Đã phản hồi ({repliedCount})
          </button>
          <button
            onClick={() => setFilterStatus('read')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === 'read' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Đã đọc ({messages.filter(m => m.status === 'read').length})
          </button>
        </div>
      </div>

      {/* Danh sách tin nhắn & Khung chi tiết */}
      {loading ? (
        <div className="p-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-pink-500" />
          <span className="text-xs font-medium">Đang đồng bộ hòm thư từ Firestore...</span>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="p-16 rounded-3xl bg-[#121420]/50 border border-[#1f2235] text-center space-y-3">
          <Inbox className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-bold text-zinc-300">Không có tin nhắn nào phù hợp</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Hiện không có phản hồi nào trong mục này hoặc chưa có học sinh nào gửi góp ý.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cột danh sách (Bên trái) */}
          <div className="lg:col-span-5 space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {filteredMessages.map((msg) => {
              const isUnread = msg.status !== 'read' && msg.status !== 'replied';
              const isReplied = msg.status === 'replied' || Boolean(msg.adminReply);
              const isSelected = selectedMessage?.id === msg.id;

              return (
                <div
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected 
                      ? 'bg-pink-500/15 border-pink-500/40 shadow-lg shadow-pink-500/5'
                      : isReplied
                      ? 'bg-[#101b1b]/80 border-emerald-500/30 hover:border-emerald-500/50'
                      : isUnread
                      ? 'bg-[#151726] border-pink-500/20 hover:border-pink-500/30'
                      : 'bg-[#121420]/70 border-[#1f2235] hover:border-zinc-700/50 opacity-80 hover:opacity-100'
                  }`}
                >
                  {/* Huy hiệu trạng thái */}
                  {isReplied ? (
                    <span className="absolute top-4 right-4 text-[10px] text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCheck className="w-3 h-3" />
                      <span>Đã phản hồi</span>
                    </span>
                  ) : isUnread ? (
                    <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                  ) : null}

                  <div className="flex items-start justify-between gap-2 mb-1.5 pr-20">
                    <span className="text-xs font-bold text-white truncate max-w-[200px]">
                      {msg.name || 'Học sinh STEM HUB'}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleDateString('vi-VN') : ''}
                    </span>
                  </div>

                  <div className="text-[11px] font-semibold text-pink-400 mb-1 truncate">
                    {msg.subject || 'Góp ý hệ thống'}
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {msg.message}
                  </p>

                  {/* Trích đoạn phản hồi nếu có */}
                  {msg.adminReply && (
                    <div className="mt-2 pt-2 border-t border-[#1f2235] flex items-center gap-1.5 text-[11px] text-emerald-400/90 truncate">
                      <CornerDownRight className="w-3 h-3 shrink-0" />
                      <span className="truncate">Admin: {msg.adminReply}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Cột chi tiết & Phản hồi (Bên phải) */}
          <div className="lg:col-span-7">
            {selectedMessage ? (
              <div className="p-6 md:p-8 rounded-3xl bg-[#121420] border border-[#1f2235] shadow-xl space-y-6">
                {/* Header chi tiết */}
                <div className="flex items-start justify-between gap-4 border-b border-[#1f2235] pb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-pink-500/15 text-pink-400 border border-pink-500/20">
                        {selectedMessage.subject || 'Góp ý / Liên hệ'}
                      </span>
                      {selectedMessage.adminReply ? (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Đã gửi phản hồi</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-800 text-zinc-400">
                          Chờ giải đáp
                        </span>
                      )}
                    </div>

                    <h2 className="text-lg md:text-xl font-extrabold text-white">
                      {selectedMessage.name || 'Học sinh STEM HUB'}
                    </h2>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1">
                      {selectedMessage.email && (
                        <span>Email: <strong className="text-zinc-200">{selectedMessage.email}</strong></span>
                      )}
                      <span>&bull;</span>
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        {selectedMessage.timestamp ? new Date(selectedMessage.timestamp).toLocaleString('vi-VN') : 'Mới đây'}
                      </span>
                    </div>
                  </div>

                  {/* Nút hành động */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleToggleRead(selectedMessage, e)}
                      title={selectedMessage.status === 'read' ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
                      className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer border border-zinc-700/50"
                    >
                      <CheckCircle className={`w-4 h-4 ${selectedMessage.status === 'read' ? 'text-emerald-400' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(selectedMessage.id, e)}
                      title="Xóa tin nhắn này"
                      className="p-2 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive transition-all cursor-pointer border border-destructive/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Nội dung tin nhắn gốc từ học sinh */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Nội dung tin nhắn từ học sinh:
                  </div>
                  <div className="p-5 rounded-2xl bg-[#090a0f] border border-[#1f2235] text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedMessage.message}
                  </div>
                </div>

                {/* KHU VỰC PHẢN HỒI CỦA ADMIN */}
                <div className="space-y-3 pt-2 border-t border-[#1f2235]">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Phản Hồi Từ Ban Quản Trị</span>
                    </div>
                    {selectedMessage.adminReply && !isEditingReply && (
                      <button
                        type="button"
                        onClick={() => setIsEditingReply(true)}
                        className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1 cursor-pointer font-semibold"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Sửa câu trả lời</span>
                      </button>
                    )}
                  </div>

                  {/* Nếu đã phản hồi và không ở chế độ sửa */}
                  {selectedMessage.adminReply && !isEditingReply ? (
                    <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-100 space-y-2">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                        {selectedMessage.adminReply}
                      </p>
                      <div className="text-[11px] text-emerald-400/80 flex items-center justify-between pt-2 border-t border-emerald-500/20 font-mono">
                        <span>Người phản hồi: <strong>{selectedMessage.repliedBy || 'Admin'}</strong></span>
                        <span>
                          {selectedMessage.adminReplyAt ? new Date(selectedMessage.adminReplyAt).toLocaleString('vi-VN') : ''}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Form nhập phản hồi gửi cho học sinh */
                    <form onSubmit={handleSendReply} className="space-y-3">
                      <textarea
                        rows={4}
                        required
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Nhập nội dung giải đáp, cảm ơn hoặc phản hồi gửi đến học sinh..."
                        disabled={isSendingReply}
                        className="w-full bg-[#090a0f] border border-[#1f2235] focus:border-emerald-500/60 text-zinc-100 text-xs rounded-2xl p-4 focus:outline-none transition-all placeholder:text-zinc-600 leading-relaxed resize-none"
                      />

                      {replyFeedback && (
                        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                          replyFeedback.type === 'success' 
                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' 
                            : 'bg-destructive/15 border border-destructive/30 text-destructive'
                        }`}>
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{replyFeedback.text}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[11px] text-zinc-500">
                          {selectedMessage.email ? (
                            <span>Học sinh sẽ nhận được email và xem trực tiếp trên web.</span>
                          ) : (
                            <span>Học sinh sẽ xem trực tiếp trên trang Liên hệ của web.</span>
                          )}
                        </span>

                        <div className="flex items-center gap-2">
                          {selectedMessage.adminReply && isEditingReply && (
                            <button
                              type="button"
                              onClick={() => {
                                setReplyText(selectedMessage.adminReply);
                                setIsEditingReply(false);
                              }}
                              className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold cursor-pointer"
                            >
                              Hủy
                            </button>
                          )}

                          <button
                            type="submit"
                            disabled={isSendingReply || !replyText.trim()}
                            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
                          >
                            {isSendingReply ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Đang gửi phản hồi...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                <span>Gửi Phản Hồi Cho Học Sinh</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>

              </div>
            ) : (
              <div className="p-16 rounded-3xl bg-[#121420]/30 border border-dashed border-[#1f2235] text-center space-y-2 h-full flex flex-col items-center justify-center">
                <Mail className="w-10 h-10 text-zinc-600 mb-2" />
                <h4 className="text-sm font-bold text-zinc-400">Chọn một tin nhắn để xem chi tiết</h4>
                <p className="text-xs text-zinc-600 max-w-xs">
                  Bấm vào danh sách tin nhắn ở cột bên trái để đọc nội dung đầy đủ và gửi phản hồi cho học sinh.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
