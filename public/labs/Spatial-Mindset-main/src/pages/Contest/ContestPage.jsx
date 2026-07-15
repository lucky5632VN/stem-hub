import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCountdown } from '../../hooks/useCountdown';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Trophy, Clock, Users, ArrowRight, ShieldAlert, PlayCircle, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock Data
const UPCOMING_CONTESTS = [
  {
    id: "weekly-1",
    type: "Weekly",
    title: "SpatialMind STEM Contest 1",
    startTime: "2026-05-10T08:00:00Z",
    registered: 1250,
    gradient: "from-blue-600 to-indigo-900"
  },
  {
    id: "weekly-2",
    type: "Weekly",
    title: "SpatialMind STEM Contest 2",
    startTime: "2026-05-13T14:00:00Z",
    registered: 890,
    gradient: "from-purple-600 to-fuchsia-900"
  },
  {
    id: "weekly-3",
    type: "Weekly",
    title: "SpatialMind STEM Contest 3",
    startTime: "2026-05-17T09:00:00Z",
    registered: 1500,
    gradient: "from-emerald-600 to-teal-900"
  },
  {
    id: "weekly-4",
    type: "Weekly",
    title: "SpatialMind STEM Contest 4",
    startTime: "2026-05-20T20:00:00Z",
    registered: 720,
    gradient: "from-rose-600 to-orange-900"
  }
];

const PAST_CONTESTS = [
  { id: 1, title: "Weekly Contest 11", date: "03 Th05 2026", participants: 1420 },
  { id: 2, title: "Biweekly Contest 3", date: "29 Th04 2026", participants: 1105 },
  { id: 3, title: "Weekly Contest 10", date: "26 Th04 2026", participants: 1350 },
  { id: 4, title: "Weekly Contest 9", date: "19 Th04 2026", participants: 1280 },
];

const MOCK_LEADERBOARD = [
  { rank: 1, username: "Trung Hiếu", avatar: "TH", score: 4, penalty: 45 },
  { rank: 2, username: "Quốc Hán", avatar: "QH", score: 4, penalty: 52 },
  { rank: 3, username: "Đức Dũng", avatar: "DD", score: 4, penalty: 68 },
  { rank: 4, username: "Quỳnh Trang", avatar: "QT", score: 3, penalty: 30 },
  { rank: 5, username: "Anh Thư", avatar: "AT", score: 3, penalty: 45 },
  { rank: 6, username: "Phương Anh", avatar: "PA", score: 2, penalty: 15 },
  { rank: 7, username: "Hoàng Hiệp", avatar: "HH", score: 2, penalty: 20 },
  { rank: 8, username: "Lê Trang", avatar: "LT", score: 0, penalty: 0 },
];

const ContestCard = ({ contest }) => {
  const navigate = useNavigate();
  const { formattedText, isOver } = useCountdown(contest.startTime);
  
  return (
    <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${contest.gradient} border border-white/10 shadow-xl p-8 flex-1 min-w-[300px] text-left`}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[80px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 flex flex-col h-full justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-widest mb-4">
            <Trophy size={14} /> {contest.type}
          </div>
          <h2 className="text-3xl font-black text-white leading-tight mb-2">
            {contest.title}
          </h2>
          <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
            <Users size={16} />
            {contest.registered.toLocaleString()} người đã đăng ký
          </div>
        </div>

        <div className="flex flex-col xl:flex-row items-center gap-4 bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <div className="flex-1 text-center xl:text-left">
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Bắt đầu sau</p>
            <div className="font-mono text-xl xl:text-2xl font-black text-white tracking-wider">
              {isOver ? (
                <span className="text-green-400 animate-pulse">ĐANG DIỄN RA!</span>
              ) : (
                formattedText
              )}
            </div>
          </div>
          <button 
            onClick={() => navigate(`/contest/${contest.id}`)}
            className="w-full xl:w-auto px-6 py-3 bg-white text-black hover:bg-slate-200 font-black rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] flex items-center justify-center gap-2 whitespace-nowrap"
          >
            Đăng ký <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

const columnHelper = createColumnHelper();

const columns = [
  columnHelper.accessor('rank', {
    header: 'Hạng',
    cell: (info) => {
      const rank = info.getValue();
      if (rank === 1) return <span className="text-2xl drop-shadow-md flex justify-center" title="Top 1">🥇</span>;
      if (rank === 2) return <span className="text-2xl drop-shadow-md flex justify-center" title="Top 2">🥈</span>;
      if (rank === 3) return <span className="text-2xl drop-shadow-md flex justify-center" title="Top 3">🥉</span>;
      return <span className="text-gray-500 dark:text-slate-400 font-bold text-sm w-full flex justify-center">{rank}</span>;
    },
  }),
  columnHelper.accessor('username', {
    header: 'Học sinh',
    cell: (info) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs flex-shrink-0">
          {info.row.original.avatar}
        </div>
        <span className="font-bold text-zinc-900 dark:text-white text-sm truncate">{info.getValue()}</span>
      </div>
    ),
  }),
  columnHelper.accessor('score', {
    header: 'Đ',
    cell: (info) => <span className="text-green-600 dark:text-emerald-400 font-bold text-sm">{info.getValue()}</span>,
  }),
  columnHelper.accessor('penalty', {
    header: 'P',
    cell: (info) => <span className="text-red-500 dark:text-red-400 font-medium text-xs font-mono">{info.getValue()}</span>,
  })
];

export default function ContestPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('past');

  const table = useReactTable({
    data: MOCK_LEADERBOARD,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="min-h-screen font-sans bg-gray-50 dark:bg-[#0a0a0a] pt-24 px-4 md:px-8 pb-20 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Top (Hero): Centered, Title, and Cards */}
        <div className="flex flex-col items-center text-center space-y-8">
          <div>
            <Trophy size={56} className="text-yellow-500 dark:text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_20px_rgba(234,179,8,0.4)] dark:drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
            <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white leading-tight">
              Đấu Trường Không Gian
            </h1>
            <p className="text-gray-600 dark:text-slate-400 text-lg mt-4 max-w-2xl mx-auto">
              Tham gia các kỳ thi định kỳ để rèn luyện tư duy không gian, cạnh tranh với hàng ngàn học sinh khác và ghi danh lên Bảng Phong Thần.
            </p>
          </div>
          
          <div className="w-full flex flex-col md:flex-row gap-6 justify-center">
            {UPCOMING_CONTESTS.map(c => <ContestCard key={c.id} contest={c} />)}
          </div>
        </div>

        {/* Bottom (Main Content): CSS Grid 4:8 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Cột trái (4): Bảng phong thần */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
              <Trophy className="text-yellow-500 dark:text-yellow-400" size={20} /> Bảng Phong Thần
            </h3>
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id} className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-black/20">
                      {headerGroup.headers.map(header => (
                        <th key={header.id} className="px-4 py-3 text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="border-b border-gray-100 dark:border-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-4 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-3 text-center border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-black/10 hover:bg-gray-100 dark:hover:bg-black/30 transition-colors cursor-pointer">
                 <button className="text-blue-600 dark:text-cyan-400 text-sm font-bold">Xem toàn bộ bảng xếp hạng</button>
              </div>
            </div>
          </div>

          {/* Cột phải (8): Tabs */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center gap-2 border-b border-gray-200 dark:border-zinc-800 pb-4">
              <button 
                onClick={() => setActiveTab('past')}
                className={`px-6 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'past' ? 'bg-zinc-900 text-white dark:bg-zinc-800' : 'text-gray-500 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800/50'}`}
              >
                Kỳ thi đã qua (Past Contests)
              </button>
              <button 
                onClick={() => setActiveTab('my')}
                className={`px-6 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'my' ? 'bg-zinc-900 text-white dark:bg-zinc-800' : 'text-gray-500 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800/50'}`}
              >
                Lịch sử của tôi (My Contests)
              </button>
            </div>

            {activeTab === 'past' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {PAST_CONTESTS.map(contest => (
                  <div key={contest.id} className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-gray-300 dark:hover:border-zinc-700 transition-colors shadow-sm">
                    <div className="flex items-center gap-5 w-full sm:w-auto">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                         <Calendar className="text-gray-500 dark:text-slate-400" size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">{contest.title}</h4>
                        <div className="flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-slate-400 font-mono">
                          <span className="flex items-center gap-1"><Clock size={14}/> {contest.date}</span>
                          <span className="flex items-center gap-1"><Users size={14}/> {contest.participants.toLocaleString()} tham gia</span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => navigate(`/contest/${contest.id}`)}
                      className="w-full sm:w-auto px-6 py-2.5 bg-fuchsia-100 dark:bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400 hover:bg-fuchsia-200 dark:hover:bg-fuchsia-500/30 font-bold rounded-xl transition-all flex items-center justify-center gap-2 flex-shrink-0"
                    >
                      <PlayCircle size={18} /> Virtual
                    </button>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'my' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-10 text-center flex flex-col items-center shadow-sm"
              >
                 <ShieldAlert size={48} className="text-gray-400 dark:text-slate-600 mb-4" />
                 <h4 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Bạn chưa tham gia kỳ thi nào</h4>
                 <p className="text-gray-500 dark:text-slate-400 max-w-md">Hãy đăng ký tham gia các kỳ thi sắp tới hoặc luyện tập ảo (Virtual) các kỳ thi đã qua để có tên trên bảng xếp hạng.</p>
              </motion.div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
