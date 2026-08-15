'use client';

import { Mail, Send } from 'lucide-react';

export default function LienHePage() {
  return (
    <div className="p-8 max-w-3xl mx-auto text-text-primary">
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold mb-2 text-text-primary tracking-tight">Liên Hệ</h1>
        <p className="text-text-secondary text-xs">Gửi tin nhắn hoặc góp ý trực tiếp cho ban quản trị dự án STEM Hub.</p>
      </div>

      <div className="bg-bg-secondary p-8 rounded-3xl border border-border-theme shadow-2xl">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert('Đã gửi tin nhắn thành công!'); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary">Tên của bạn</label>
              <input 
                type="text" 
                required
                placeholder="Nhập tên của bạn"
                className="w-full bg-bg-tertiary text-text-primary placeholder:text-text-secondary rounded-2xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-accent-pink/50 border border-border-theme transition-all text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary">Email</label>
              <input 
                type="email" 
                required
                placeholder="email@domain.com"
                className="w-full bg-bg-tertiary text-text-primary placeholder:text-text-secondary rounded-2xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-accent-pink/50 border border-border-theme transition-all text-xs"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-secondary">Nội dung</label>
            <textarea 
              rows={4}
              required
              placeholder="Nhập tin nhắn hoặc góp ý của bạn..."
              className="w-full bg-bg-tertiary text-text-primary placeholder:text-text-secondary rounded-2xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-accent-pink/50 border border-border-theme transition-all resize-none text-xs"
            />
          </div>
          
          <button type="submit" className="w-full py-4 bg-accent-pink hover:bg-accent-pink/90 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-pink/20 active:scale-95 text-xs">
            <Send className="w-4 h-4" /> Gửi Tin Nhắn
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border-theme flex items-center gap-2 text-text-secondary text-xs">
          <Mail className="w-4 h-4 text-accent-pink" />
          <span>contact@stemhub.edu.vn</span>
        </div>
      </div>
    </div>
  );
}
