import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Link, Check, X, QrCode, Send, Copy, ExternalLink } from 'lucide-react';

// =====================
// Generate QR code URL via Google Charts API (no package needed)
// =====================
function qrUrl(text) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(text)}&bgcolor=020617&color=22d3ee&margin=4`;
}

// =====================
// SharePanel component
// =====================
export default function SharePanel({ isOpen, onClose, problem, geometryData }) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [activeTab, setActiveTab] = useState('link'); // link | qr

  // Build shareable URL
  const shareUrl = useCallback(() => {
    const base = window.location.origin + window.location.pathname;
    const encoded = encodeURIComponent(problem || '');
    return `${base}?problem=${encoded}`;
  }, [problem]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = shareUrl();
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleTwitterShare = () => {
    const text = `🔺 Cùng giải bài hình học này với SpatialMind!\n\n"${(problem || '').slice(0, 100)}..."\n\n`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl())}`;
    window.open(url, '_blank');
  };

  const url = shareUrl();
  const shortUrl = url.length > 60 ? url.slice(0, 57) + '...' : url;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed top-24 right-8 z-[151] w-80"
            onClick={e => e.stopPropagation()}
          >
            <div
              className="rounded-3xl overflow-hidden"
              style={{
                background: 'rgba(2,6,23,0.95)',
                backdropFilter: 'blur(30px)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              }}
            >
              {/* Top glow */}
              <div className="h-0.5 bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <Share2 size={15} className="text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-sm">Chia sẻ bài</h3>
                    <p className="text-violet-400/60 text-[9px] font-bold uppercase tracking-widest">Share Problem</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all">
                  <X size={14} />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                {/* Problem preview */}
                {problem ? (
                  <div
                    className="p-3 rounded-2xl text-[11px] text-slate-300 leading-relaxed line-clamp-3"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    "{problem}"
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl text-[11px] text-slate-600 italic text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    Chưa có đề bài để chia sẻ
                  </div>
                )}

                {/* Tab: link / qr */}
                <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {[
                    { id: 'link', icon: Link, label: 'Copy Link' },
                    { id: 'qr',   icon: QrCode, label: 'QR Code' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all"
                      style={{
                        background: activeTab === tab.id ? 'rgba(139,92,246,0.15)' : 'transparent',
                        border: activeTab === tab.id ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
                        color: activeTab === tab.id ? '#a78bfa' : '#64748b',
                      }}
                    >
                      <tab.icon size={11} />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Link tab */}
                {activeTab === 'link' && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    {/* URL display */}
                    <div
                      className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <Link size={12} className="text-slate-500 shrink-0" />
                      <span className="text-[10px] text-slate-400 flex-1 truncate font-mono">{shortUrl}</span>
                    </div>

                    {/* Copy button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleCopy}
                      disabled={!problem}
                      className="w-full py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                      style={{
                        background: copied
                          ? 'rgba(52,211,153,0.15)'
                          : problem ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
                        border: copied
                          ? '1px solid rgba(52,211,153,0.3)'
                          : problem ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.06)',
                        color: copied ? '#34d399' : problem ? '#a78bfa' : '#475569',
                      }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Đã sao chép!' : 'Sao chép link'}
                    </motion.button>

                    {/* Share to Twitter */}
                    <button
                      onClick={handleTwitterShare}
                      disabled={!problem}
                      className="w-full py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                      style={{
                        background: 'rgba(29,161,242,0.08)',
                        border: '1px solid rgba(29,161,242,0.15)',
                        color: problem ? '#60a5fa' : '#334155',
                      }}
                    >
                      <Send size={12} />
                      Chia sẻ lên Twitter / X
                    </button>
                  </motion.div>
                )}

                {/* QR tab */}
                {activeTab === 'qr' && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-3"
                  >
                    {problem ? (
                      <>
                        <div
                          className="p-3 rounded-2xl"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          <img
                            src={qrUrl(url)}
                            alt="QR Code"
                            className="w-28 h-28 rounded-xl"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 text-center">
                          Quét QR để mở bài toán trên thiết bị khác
                        </p>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[10px] text-violet-400 hover:text-violet-300 font-bold transition-all"
                        >
                          <ExternalLink size={11} /> Mở trong tab mới
                        </a>
                      </>
                    ) : (
                      <p className="text-[11px] text-slate-600 italic py-4">Nhập đề bài trước để tạo QR</p>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 pb-4 text-center text-[9px] text-slate-700 font-bold uppercase tracking-widest">
                Link tự động load đề bài khi mở
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
