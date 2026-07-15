import React from 'react';
import { motion } from 'framer-motion';
import { Box, Sparkles, Trophy, MessageSquare, ChevronRight } from 'lucide-react';

export default function LandingPage({ onStart }) {
  return (
    <div className="fixed inset-0 z-[1000] bg-[#020617] text-white overflow-y-auto overflow-x-hidden ocean-gradient">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-32 flex flex-col items-center text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-8"
        >
          <Sparkles size={12} />
          Powered by Gemini AI 3-Flash
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]"
        >
          CHINH PHỤC <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400">
            KHÔNG GIAN 3D
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-400 text-lg md:text-xl max-w-2xl leading-relaxed mb-12"
        >
          Hệ thống học tập Hình học Không gian tích hợp AI đầu tiên tại Việt Nam. 
          Giúp bạn trực quan hóa mọi bài toán phức tạp chỉ trong tích tắc.
        </motion.p>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStart}
          className="group relative px-10 py-5 bg-cyan-600 hover:bg-cyan-500 rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-cyan-500/40 transition-all flex items-center gap-4 border border-cyan-400/40"
        >
          Bắt đầu hành trình
          <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </motion.button>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full">
          {[
            { 
              icon: Box, 
              title: "Trực quan 3D", 
              desc: "Mô hình hóa đề bài từ văn bản hoặc hình ảnh sang không gian 3D tương tác.",
              color: "text-cyan-400",
              bg: "bg-cyan-500/5"
            },
            { 
              icon: MessageSquare, 
              title: "Socratic AI", 
              desc: "Gia sư AI không đưa đáp án trực tiếp mà đặt câu hỏi gợi mở để bạn tự nhận ra lỗi sai.",
              color: "text-emerald-400",
              bg: "bg-emerald-500/5"
            },
            { 
              icon: Trophy, 
              title: "Gamification", 
              desc: "Hệ thống XP, Level, Rank và Streak giúp việc học toán trở nên thú vị như chơi game.",
              color: "text-orange-400",
              bg: "bg-orange-500/5"
            }
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`p-8 rounded-[32px] border border-white/5 text-left transition-all hover:bg-white/5 group ${f.bg}`}
            >
              <div className={`w-12 h-12 rounded-2xl ${f.bg} border border-white/5 flex items-center justify-center mb-6 ${f.color} group-hover:scale-110 transition-transform`}>
                <f.icon size={24} />
              </div>
              <h3 className="text-xl font-black mb-3">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-40 pt-10 border-t border-white/5 w-full text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">
          SpatialMind Engine v2.5 · Developed for Math Excellence
        </div>
      </div>
    </div>
  );
}
