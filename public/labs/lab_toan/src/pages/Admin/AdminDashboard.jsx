import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Users, 
  Database, 
  Filter, 
  Search, 
  MoreVertical,
  Eye,
  Trash2
} from 'lucide-react';
import { fetchAdminProblems, approveProblem, rejectProblem } from '../../api/problemsApi';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { userProfile, loading: authLoading } = useAuth();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'inventory' | 'users'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminProblems();
      setProblems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (confirm('Phê duyệt bài tập này?')) {
      await approveProblem(id);
      loadProblems();
    }
  };

  const handleReject = async (id) => {
    if (confirm('Từ chối bài tập này?')) {
      await rejectProblem(id);
      loadProblems();
    }
  };

  // RBAC Guard
  if (authLoading) return <div className="h-screen flex items-center justify-center text-white">Đang xác thực...</div>;
  if (!userProfile || userProfile.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const pendingProblems = problems.filter(p => p.status === 'pending_approval');
  const publishedProblems = problems.filter(p => !p.status || p.status === 'published');
  
  const filteredProblems = (activeTab === 'pending' ? pendingProblems : problems).filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: 'Chờ duyệt', value: pendingProblems.length, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Đã xuất bản', value: publishedProblems.length, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Tổng bài tập', value: problems.length, icon: Database, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    { label: 'Người dùng', value: 1250, icon: Users, color: 'text-violet-400', bg: 'bg-violet-400/10' },
  ];

  return (
    <div className="min-h-screen bg-[#020617] pt-24 px-6 md:px-12 pb-20">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <ShieldCheck className="text-cyan-500" size={32} />
              Admin Control Center
            </h1>
            <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-bold">Quản lý nội dung & người dùng</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text"
                placeholder="Tìm kiếm bài tập..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all w-64"
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:bg-white/[0.07] transition-all"
            >
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-white mt-1">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="bg-[#0f172a]/50 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-2 border-b border-white/5 bg-black/20">
            {[
              { id: 'pending', label: 'Duyệt bài tập', count: pendingProblems.length },
              { id: 'inventory', label: 'Kho bài tập', count: problems.length },
              { id: 'users', label: 'Người dùng', count: null },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2
                  ${activeTab === tab.id ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-black/20' : 'bg-white/10'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Table Area */}
          <div className="overflow-x-auto min-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredProblems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <Database size={48} className="mb-4 opacity-20" />
                <p>Không có dữ liệu nào phù hợp</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <th className="px-6 py-4">Tên bài tập</th>
                    <th className="px-6 py-4">Độ khó</th>
                    <th className="px-6 py-4">Tác giả</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredProblems.map((problem) => (
                    <motion.tr 
                      layout
                      key={problem.id} 
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-5">
                        <div>
                          <p className="text-sm font-bold text-white mb-1">{problem.title}</p>
                          <div className="flex gap-2">
                            {problem.tags.map(tag => (
                              <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-slate-400 uppercase font-bold">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full 
                          ${problem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400' : 
                            problem.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                          {problem.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs text-slate-300 font-medium">{problem.authorId || 'System'}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${problem.status === 'pending_approval' ? 'bg-yellow-500' : 'bg-emerald-500'}`} />
                          <span className="text-[10px] font-bold uppercase text-slate-400">
                            {problem.status === 'pending_approval' ? 'Đang chờ duyệt' : 'Đã đăng'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {problem.status === 'pending_approval' ? (
                            <>
                              <button 
                                onClick={() => handleApprove(problem.id)}
                                className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-black transition-all"
                                title="Duyệt"
                              >
                                <CheckCircle2 size={18} />
                              </button>
                              <button 
                                onClick={() => handleReject(problem.id)}
                                className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                title="Từ chối"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          ) : (
                            <button className="p-2 text-slate-500 hover:text-cyan-400 transition-colors">
                              <Eye size={18} />
                            </button>
                          )}
                          <button className="p-2 text-slate-500 hover:text-white transition-colors">
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
