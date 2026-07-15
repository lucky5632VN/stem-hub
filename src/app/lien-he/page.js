'use client';

import { Mail, Send } from 'lucide-react';

export default function LienHePage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-12">
        <h1 className="text-2xl font-bold mb-2">Liên Hệ</h1>
        <p className="text-zinc-400 text-sm">Gửi tin nhắn hoặc góp ý cho dự án của chúng tôi.</p>
      </div>

      <div className="bg-[#2a2c3a] p-8 rounded-2xl border border-white/5">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert('Đã gửi tin nhắn thành công!'); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm text-zinc-300">Tên của bạn</label>
              <input 
                type="text" 
                required
                className="w-full bg-[#1c1e29] text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-pink-500/50 border border-transparent focus:border-white/10 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-300">Email</label>
              <input 
                type="email" 
                required
                className="w-full bg-[#1c1e29] text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-pink-500/50 border border-transparent focus:border-white/10 transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-zinc-300">Nội dung</label>
            <textarea 
              rows={4}
              required
              className="w-full bg-[#1c1e29] text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-pink-500/50 border border-transparent focus:border-white/10 transition-all resize-none"
            />
          </div>
          
          <button type="submit" className="w-full py-4 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-pink-500/20 active:scale-95">
            <Send className="w-4 h-4" /> Gửi Tin Nhắn
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-2 text-zinc-400 text-sm">
          <Mail className="w-4 h-4" />
          <span>contact@example.com</span>
        </div>
      </div>
    </div>
  );
}
