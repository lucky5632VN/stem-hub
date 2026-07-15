import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Save, ArrowLeft, Eye, Edit3, Tags } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../components/ui/select';

export default function CreateProblemPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // RBAC Guard: Chỉ teacher hoặc admin mới được vào
  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#020617] text-white">
        <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
        <p className="text-slate-400">Bạn không có quyền truy cập trang này.</p>
        <button onClick={() => navigate('/problems')} className="mt-4 px-4 py-2 bg-cyan-600 rounded-lg text-white font-medium hover:bg-cyan-500 transition-colors">
          Quay lại Kho bài tập
        </button>
      </div>
    );
  }

  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('Cho hình chóp $S.ABCD$... \n\nA. Phương án 1\nB. Phương án 2\nC. Phương án 3\nD. Phương án 4');
  const [isPremium, setIsPremium] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Tạo data object
    const newProblem = {
      title,
      difficulty,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      content,
      isPremium,
      authorId: user.uid,
      status: user.role === 'admin' ? 'published' : 'pending_approval',
      acceptanceRate: 0,
      totalSubmissions: 0,
      createdAt: new Date(),
    };

    console.log("Submitting problem to Firestore...", newProblem);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Tạo bài tập thành công! ' + (user.role === 'admin' ? 'Bài tập đã được xuất bản.' : 'Bài tập đang chờ Admin duyệt.'));
      navigate('/problems');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] pt-20 px-6 pb-12">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/problems')}
              className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg text-slate-500 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                Tạo Bài Tập Mới
                {user.role === 'admin' ? (
                  <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full uppercase tracking-widest border border-red-500/20">Admin</span>
                ) : (
                  <span className="text-[10px] bg-cyan-500/10 text-cyan-500 px-2 py-0.5 rounded-full uppercase tracking-widest border border-cyan-500/20">Giáo viên</span>
                )}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Biên soạn nội dung bài tập bằng định dạng Markdown & LaTeX.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPreview(!isPreview)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-zinc-700 transition-colors"
            >
              {isPreview ? <Edit3 size={16} /> : <Eye size={16} />}
              {isPreview ? 'Tiếp tục sửa' : 'Xem trước (Preview)'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {isSubmitting ? 'Đang lưu...' : (user.role === 'admin' ? 'Xuất bản ngay' : 'Gửi duyệt')}
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Metadata Sidebar */}
          <div className="lg:col-span-1 space-y-5 bg-white dark:bg-zinc-950/50 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Tiêu đề bài toán</label>
              <Input 
                placeholder="VD: Tính thể tích khối chóp S.ABCD..." 
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="bg-slate-50 dark:bg-black/20"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Độ khó</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="bg-slate-50 dark:bg-black/20">
                  <SelectValue placeholder="Chọn độ khó" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Dễ (Easy)</SelectItem>
                  <SelectItem value="Medium">Trung bình (Medium)</SelectItem>
                  <SelectItem value="Hard">Khó (Hard)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Tags size={12} /> Tags (cách nhau bởi dấu phẩy)
              </label>
              <Input 
                placeholder="VD: Hình chóp, Thể tích, Góc" 
                value={tags}
                onChange={e => setTags(e.target.value)}
                className="bg-slate-50 dark:bg-black/20"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div>
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">Nội dung Premium</label>
                <p className="text-xs text-slate-500">Chỉ người dùng VIP mới xem được</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsPremium(!isPremium)}
                className={`w-12 h-6 rounded-full transition-colors relative ${isPremium ? 'bg-amber-500' : 'bg-slate-300 dark:bg-zinc-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${isPremium ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>

          {/* Markdown Content Area */}
          <div className="lg:col-span-2 flex flex-col h-[600px] bg-white dark:bg-zinc-950/50 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 flex items-center justify-between">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                {isPreview ? 'Bản xem trước (Preview)' : 'Trình soạn thảo Markdown & LaTeX'}
              </span>
              <a href="https://katex.org/docs/supported.html" target="_blank" rel="noreferrer" className="text-xs text-cyan-500 hover:underline">
                Hướng dẫn viết LaTeX
              </a>
            </div>

            <div className="flex-1 relative overflow-hidden">
              {isPreview ? (
                <div className="absolute inset-0 overflow-y-auto p-6 custom-scrollbar bg-white dark:bg-transparent">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown 
                      remarkPlugins={[remarkMath]} 
                      rehypePlugins={[rehypeKatex]}
                    >
                      {content || '*Chưa có nội dung*'}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-full p-6 resize-none outline-none bg-transparent text-slate-800 dark:text-slate-200 custom-scrollbar font-mono text-sm leading-relaxed"
                  placeholder="Bắt đầu viết đề bài tại đây..."
                />
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
