// src/components/NotificationSettings.jsx
// Modal cài đặt notification (giống Duolingo)
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, BellOff, Mail, Clock, Check, Send } from 'lucide-react';
import axios from 'axios';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const formatHour = h => `${h.toString().padStart(2, '0')}:00`;

export default function NotificationSettings({ isOpen, onClose, user }) {
  const [email,       setEmail]       = useState(user?.email || '');
  const [name,        setName]        = useState(user?.displayName || '');
  const [hour,        setHour]        = useState(7);
  const [subscribed,  setSubscribed]  = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [testSent,    setTestSent]    = useState(false);
  const [message,     setMessage]     = useState('');

  useEffect(() => {
    if (user?.email) setEmail(user.email);
    if (user?.displayName) setName(user.displayName);
    const saved = localStorage.getItem('spatialmind_notif');
    if (saved) {
      const d = JSON.parse(saved);
      setSubscribed(d.subscribed || false);
      setHour(d.hour || 7);
    }
  }, [user]);

  const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:8000';

  const handleSubscribe = async () => {
    if (!email) { setMessage('Nhập email của bạn nhé!'); return; }
    setLoading(true); setMessage('');
    try {
      const res = await axios.post(`${baseUrl}/api/notifications/subscribe`, {
        email, name: name || 'bạn', notify_hour: hour,
      });
      setSubscribed(true);
      localStorage.setItem('spatialmind_notif', JSON.stringify({ subscribed: true, hour, email }));
      setMessage('✅ ' + (res.data.message || 'Đăng ký thành công!'));
    } catch {
      setMessage('❌ Không kết nối được server. Thử lại sau!');
    } finally { setLoading(false); }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      await axios.delete(`${baseUrl}/api/notifications/unsubscribe/${encodeURIComponent(email)}`);
      setSubscribed(false);
      localStorage.setItem('spatialmind_notif', JSON.stringify({ subscribed: false }));
      setMessage('Đã hủy đăng ký.');
    } catch {
      setMessage('Lỗi kết nối.');
    } finally { setLoading(false); }
  };

  const handleTestEmail = async () => {
    if (!email) { setMessage('Nhập email trước nhé!'); return; }
    setLoading(true);
    try {
      await axios.post(`${baseUrl}/api/notifications/send-test`, {
        email, name: name || 'bạn', streak: 7, xp: 450, rank_name: 'Gold',
      });
      setTestSent(true);
      setMessage('📧 Email test đã được gửi! Kiểm tra hộp thư nhé.');
      setTimeout(() => setTestSent(false), 5000);
    } catch {
      setMessage('❌ Không gửi được. Kiểm tra backend đã chạy chưa?');
    } finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.85, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="fixed inset-0 z-[301] flex items-center justify-center p-6 pointer-events-none"
          >
            <div
              className="relative w-full max-w-md rounded-3xl p-7 pointer-events-auto"
              style={{
                background: 'linear-gradient(135deg, rgba(2,6,23,0.99) 0%, rgba(15,23,42,0.99) 100%)',
                border: '1px solid rgba(251,146,60,0.2)',
                boxShadow: '0 0 60px rgba(251,146,60,0.08), 0 40px 80px rgba(0,0,0,0.6)',
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
              
              <button onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all">
                <X size={15} />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                  <Bell size={18} className="text-orange-400" />
                </div>
                <div>
                  <h2 className="text-white font-black text-lg">Nhắc nhở hàng ngày</h2>
                  <p className="text-slate-500 text-xs">Kiểu Duolingo — không bỏ lỡ streak nào!</p>
                </div>
              </div>

              {/* Status */}
              {subscribed && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-emerald-400 text-xs font-bold">Đang nhận nhắc nhở lúc {formatHour(hour)}</span>
                </div>
              )}

              {/* Form */}
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-slate-400 text-xs font-bold mb-1.5 block">Email nhận thông báo</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-orange-500/40 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 text-xs font-bold mb-1.5 block flex items-center gap-1.5">
                    <Clock size={11} /> Giờ nhận thông báo
                  </label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {[6, 7, 8, 9, 17, 20].map(h => (
                      <button key={h}
                        onClick={() => setHour(h)}
                        className="py-1.5 rounded-lg text-xs font-bold transition-all"
                        style={{
                          background: hour === h ? 'rgba(251,146,60,0.2)' : 'rgba(255,255,255,0.04)',
                          border: hour === h ? '1px solid rgba(251,146,60,0.4)' : '1px solid rgba(255,255,255,0.06)',
                          color: hour === h ? '#fb923c' : '#64748b',
                        }}
                      >
                        {formatHour(h)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Message */}
              {message && (
                <p className="text-xs font-bold px-1 mb-3" style={{
                  color: message.startsWith('✅') || message.startsWith('📧') ? '#34d399' : '#f87171'
                }}>{message}</p>
              )}

              {/* Buttons */}
              <div className="flex gap-2">
                {!subscribed ? (
                  <button onClick={handleSubscribe} disabled={loading}
                    className="flex-1 py-3 rounded-2xl font-black text-white transition-all flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', opacity: loading ? 0.7 : 1 }}
                  >
                    <Bell size={15} /> Đăng ký nhận nhắc
                  </button>
                ) : (
                  <button onClick={handleUnsubscribe} disabled={loading}
                    className="flex-1 py-3 rounded-2xl font-black transition-all flex items-center justify-center gap-2"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#94a3b8',
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    <BellOff size={15} /> Hủy đăng ký
                  </button>
                )}

                <button onClick={handleTestEmail} disabled={loading || testSent}
                  className="px-4 py-3 rounded-2xl font-black transition-all flex items-center gap-1.5"
                  style={{
                    background: testSent ? 'rgba(52,211,153,0.1)' : 'rgba(99,102,241,0.15)',
                    border: testSent ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(99,102,241,0.3)',
                    color: testSent ? '#34d399' : '#a5b4fc',
                  }}
                >
                  {testSent ? <Check size={14} /> : <Send size={14} />}
                  <span className="text-xs">{testSent ? 'Đã gửi!' : 'Test'}</span>
                </button>
              </div>

              <p className="text-center text-slate-600 text-[10px] mt-3 leading-relaxed">
                Email sẽ được gửi mỗi ngày lúc {formatHour(hour)} kèm thử thách hôm nay.<br />
                Giống Duolingo — không bao giờ bỏ lỡ streak! 🔥
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
