import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Calendar, Trophy, AlertCircle, PlayCircle, BarChart2, BookOpen, Users } from 'lucide-react';

export default function ContestDetailPage() {
  const { contestId } = useParams();
  const navigate = useNavigate();

  // Mock data for the contest
  const contestName = contestId?.includes('weekly') ? `Weekly Contest ${contestId.replace('weekly-', '')}` : 'SpatialMind Contest';
  
  // Fix I4: Generate số người tham gia (pseudo-random nhưng ổn định theo contestId)
  const participantCount = React.useMemo(() => {
    let hash = 0;
    const str = contestId || 'default';
    for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
    return Math.abs(hash % 5000) + 1200; // Số ảo từ 1200 - 6200
  }, [contestId]);

  return (
    <div className="min-h-screen font-sans bg-gray-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-gray-300 py-24 px-4 md:px-8 transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column (8): Main Info */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Header Section */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="px-3 py-1 bg-fuchsia-500/20 text-fuchsia-500 text-xs font-bold uppercase tracking-widest rounded-md border border-fuchsia-500/30">
                  Virtual
                </span>
                <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 font-mono">
                  <Calendar size={14} /> 10 May 2026
                </span>
                <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 font-mono">
                  <Clock size={14} /> 08:00 AM - 09:30 AM
                </span>
                <span className="flex items-center gap-1.5 text-sm text-cyan-600 dark:text-cyan-400 font-bold ml-auto bg-cyan-50 dark:bg-cyan-900/20 px-3 py-1 rounded-full border border-cyan-100 dark:border-cyan-800">
                  <Users size={14} /> {participantCount.toLocaleString()} Tham gia
                </span>
              </div>
              
              <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                {contestName}
              </h1>

              <button 
                onClick={() => navigate(`/contest/${contestId}/workspace/1`)}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors shadow-sm"
              >
                <PlayCircle size={20} />
                Start Virtual Contest
              </button>
            </div>

            {/* Rules Section */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                <AlertCircle className="text-yellow-500" size={20} />
                Contest Rules
              </h2>
              
              <ul className="space-y-4 text-slate-600 dark:text-gray-400 text-sm leading-relaxed list-none">
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 bg-cyan-500 rounded-full flex-shrink-0" />
                  <p>Kỳ thi kéo dài <strong className="text-slate-900 dark:text-gray-200">90 phút</strong>. Thời gian đếm ngược sẽ bắt đầu ngay khi bạn ấn "Start Virtual Contest".</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 bg-cyan-500 rounded-full flex-shrink-0" />
                  <p>Mỗi lần nộp bài sai (Wrong Answer), bạn sẽ bị phạt <strong className="text-slate-900 dark:text-gray-200">5 phút</strong> vào tổng thời gian hoàn thành (Penalty).</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 bg-cyan-500 rounded-full flex-shrink-0" />
                  <p>Hệ thống AI sẽ đánh giá đồng thời cả <strong className="text-slate-900 dark:text-gray-200">kết quả cuối cùng</strong> và <strong className="text-slate-900 dark:text-gray-200">phần lập luận/trình bày</strong> của bạn. Vui lòng trình bày mạch lạc.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 bg-cyan-500 rounded-full flex-shrink-0" />
                  <p>Xếp hạng dựa trên tổng điểm. Nếu bằng điểm, người có tổng thời gian (bao gồm Penalty) ít hơn sẽ xếp trên.</p>
                </li>
              </ul>
            </div>

          </div>

          {/* Right Column (4): Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Card 1: Ranking */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
              <Trophy size={40} className="text-yellow-500 mb-4 drop-shadow-md" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Bảng Xếp Hạng</h3>
              <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">Xem vị trí của bạn so với các thí sinh khác trong kỳ thi này.</p>
              
              <button 
                onClick={() => navigate(`/contest/${contestId}/ranking`)}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-white font-bold rounded-xl transition-colors"
              >
                <BarChart2 size={18} /> View Ranking
              </button>
            </div>

            {/* Card 2: Problems List */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <BookOpen size={18} className="text-cyan-500 dark:text-cyan-400" />
                Danh Sách Bài Toán
              </h3>
              
              <div className="divide-y divide-gray-100 dark:divide-zinc-800/60 border border-gray-200 dark:border-zinc-800/60 rounded-xl overflow-hidden bg-gray-50 dark:bg-zinc-900/50">
                
                <div className="flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-700 dark:text-gray-300 w-6">Q1</span>
                    <span className="text-sm text-slate-600 dark:text-gray-400">Hình học cơ bản</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-400/10 px-2 py-1 rounded">3pt</span>
                </div>
                
                <div className="flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-700 dark:text-gray-300 w-6">Q2</span>
                    <span className="text-sm text-slate-600 dark:text-gray-400">Khoảng cách</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-400/10 px-2 py-1 rounded">4pt</span>
                </div>

                <div className="flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-700 dark:text-gray-300 w-6">Q3</span>
                    <span className="text-sm text-slate-600 dark:text-gray-400">Thể tích chóp</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-400/10 px-2 py-1 rounded">5pt</span>
                </div>

                <div className="flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-700 dark:text-gray-300 w-6">Q4</span>
                    <span className="text-sm text-slate-600 dark:text-gray-400">Min-Max</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-400/10 px-2 py-1 rounded">6pt</span>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
