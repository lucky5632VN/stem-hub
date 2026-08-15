import React, { useState } from 'react';
import { 
  Target, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCcw, 
  ChevronRight, 
  Search,
  Trophy,
  BookOpen,
  ArrowLeft,
  Activity,
  Dna,
  Share2,
  Layers
} from 'lucide-react';
import { experimentTheoryData } from '../data/experimentTheoryData';
import { questionBank } from '../data/questionBank';

// Bảng ánh xạ Lab sang Chuyên đề câu hỏi hiện có
const labToTopicMap = {
  'ct-scan': '11-1',
  'brain-sections': '11-1',
  'bone-scintigraphy': '11-4',
  'anatomy': '11-3',
  'spinal-cord': '11-1',
  'human-brain': '11-1',
  'taste': '11-2',
  'urinary-system': '11-3',
  'digestive-tract': '11-3',
  'muscle-contraction': '11-4',
  'respiratory-system': '11-3',
  'male-reproductive': '11-4',
  'female-reproductive': '11-4',
  'fertilization': '11-4',
  'karyotype-activities': '12-1',
  'mendel-experiment': '12-2',
  'mendel-di-hybrid': '12-2',
  'food-network': '12-2',
  'mountain-food-chain': '12-2',
  'the-tree': '12-1',
  'root-absorption': '10-1'
};

const Exercises = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLab, setActiveLab] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);

  const categories = [...new Set(experimentTheoryData.map(l => l.category))];

  const filteredLabs = experimentTheoryData.filter(lab =>
    lab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lab.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startQuiz = (lab) => {
    const topicId = labToTopicMap[lab.id];
    const questions = questionBank[topicId] || [];
    
    if (questions.length > 0) {
      const randomQ = questions[Math.floor(Math.random() * questions.length)];
      setActiveLab(lab);
      setActiveQuestion(randomQ);
      setHasSubmitted(false);
      setSelectedOption(null);
    } else {
      alert("Hệ thống đang cập nhật câu hỏi cho thí nghiệm này!");
    }
  };

  const handleSelect = (idx) => {
    if (!hasSubmitted) setSelectedOption(idx);
  };

  const handleNext = () => {
    const topicId = labToTopicMap[activeLab.id];
    const questions = questionBank[topicId] || [];
    const randomQ = questions[Math.floor(Math.random() * questions.length)];
    setActiveQuestion(randomQ);
    setHasSubmitted(false);
    setSelectedOption(null);
  };

  const finishQuiz = () => {
    setActiveLab(null);
    setActiveQuestion(null);
    setHasSubmitted(false);
    setSelectedOption(null);
  };

  const handleSubmit = () => {
    setHasSubmitted(true);
    setTotalAttempted(prev => prev + 1);
    if (activeQuestion.options[selectedOption].isCorrect) {
      setScore(prev => prev + 1);
    }
  };

  const getIcon = (category) => {
    switch (category) {
      case 'Sinh lý Thực vật': return <Layers size={20} color="var(--accent-cyan)" />;
      case 'Sinh lý & Giải phẫu Người': return <Activity size={20} color="#ef4444" />;
      case 'Di truyền & Biến dị': return <Dna size={20} color="#a855f7" />;
      case 'Sinh thái & Tiến hóa': return <Share2 size={20} color="#22c55e" />;
      default: return <Target size={20} />;
    }
  };

  if (activeLab) {
    const currentOption = selectedOption !== null ? activeQuestion.options[selectedOption] : null;

    return (
      <div style={{ 
        padding: '40px', 
        height: '100%', 
        overflowY: 'auto', 
        background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
        color: '#f8fafc',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          <button 
            onClick={finishQuiz}
            style={{ 
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
              color: '#cbd5e1', cursor: 'pointer', padding: '10px 16px', borderRadius: '12px',
              display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px', fontSize: '0.9rem', fontWeight: 600
            }}
          >
            <ArrowLeft size={16} /> Thoát luyện tập
          </button>

          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              {getIcon(activeLab.category)} {activeLab.name}
            </div>
            <h1 style={{ fontSize: '2rem', color: '#fff', margin: 0, fontWeight: 900 }}>Luyện Tập Củng Cố</h1>
          </div>

          <div style={{ 
            background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(20px)',
            padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
          }}>
            
            <h2 style={{ fontSize: '1.25rem', lineHeight: '1.7', marginBottom: '40px', color: '#fff', fontWeight: 700 }}>
              {activeQuestion.text}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
              {activeQuestion.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = hasSubmitted && opt.isCorrect;
                const isWrong = hasSubmitted && isSelected && !opt.isCorrect;

                let bg = 'rgba(255, 255, 255, 0.02)';
                let border = '1px solid rgba(255, 255, 255, 0.05)';

                if (isSelected) {
                  bg = 'rgba(0, 240, 255, 0.05)';
                  border = '1px solid var(--accent-cyan)';
                }

                if (hasSubmitted) {
                  if (opt.isCorrect) {
                    bg = 'rgba(34, 197, 94, 0.15)';
                    border = '1px solid #22c55e';
                  } else if (isSelected) {
                    bg = 'rgba(239, 68, 68, 0.15)';
                    border = '1px solid #ef4444';
                  }
                }

                return (
                  <button 
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    style={{ 
                      padding: '20px 24px', textAlign: 'left', borderRadius: '16px',
                      background: bg, border: border, color: '#fff', 
                      cursor: hasSubmitted ? 'default' : 'pointer',
                      fontSize: '1.05rem', transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', gap: '16px'
                    }}
                  >
                    <div style={{ 
                      width: '28px', height: '28px', borderRadius: '8px', 
                      background: isSelected ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.9rem', fontWeight: 700, color: isSelected ? '#000' : '#64748b'
                    }}>
                      {opt.id}
                    </div>
                    {opt.text}
                    {isCorrect && <CheckCircle size={20} color="#22c55e" style={{ marginLeft: 'auto' }} />}
                    {isWrong && <AlertTriangle size={20} color="#ef4444" style={{ marginLeft: 'auto' }} />}
                  </button>
                );
              })}
            </div>

            {!hasSubmitted ? (
              <button 
                style={{ 
                  width: '100%', padding: '18px', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 700,
                  background: selectedOption !== null ? 'linear-gradient(90deg, var(--accent-cyan), #3b82f6)' : 'rgba(255,255,255,0.05)',
                  color: selectedOption !== null ? '#000' : '#64748b', border: 'none',
                  cursor: selectedOption === null ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s'
                }}
                disabled={selectedOption === null}
                onClick={handleSubmit}
              >
                Nộp Bài & Kiểm Tra
              </button>
            ) : (
              <div style={{ animation: 'slideUp 0.4s ease-out' }}>
                <div style={{ 
                  padding: '24px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid rgba(255,255,255,0.05)', marginBottom: '32px' 
                }}>
                  <h3 style={{ color: currentOption.isCorrect ? '#22c55e' : '#ef4444', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {currentOption.isCorrect ? <CheckCircle /> : <AlertTriangle />}
                    {currentOption.isCorrect ? 'Câu trả lời chính xác!' : 'Đáp án chưa chính xác'}
                  </h3>
                  <p style={{ color: '#cbd5e1', lineHeight: 1.7, margin: 0 }}>
                    {currentOption.isCorrect ? currentOption.feedback : currentOption.scientificFact}
                  </p>
                  {!currentOption.isCorrect && (
                    <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                      <span style={{ color: '#fca5a5', fontSize: '0.85rem', fontWeight: 700 }}>PHÂN TÍCH SAI LẦM: </span>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{currentOption.misconception}</span>
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '16px' }}>
                  <button 
                    onClick={handleNext}
                    style={{ 
                      flex: 1, padding: '16px', borderRadius: '12px', background: 'var(--accent-cyan)', color: '#000', 
                      fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.2s' 
                    }}
                  >
                    Câu hỏi tiếp theo
                  </button>
                  <button 
                    onClick={() => { setHasSubmitted(false); setSelectedOption(null); }}
                    style={{ 
                      padding: '16px 24px', borderRadius: '12px', background: 'none', 
                      border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' 
                    }}
                    title="Thử lại câu này"
                  >
                    <RefreshCcw size={18} />
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
        
        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '40px', 
      height: '100%', 
      overflowY: 'auto', 
      background: '#020617',
      fontFamily: "'Inter', sans-serif" 
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div>
          <h1 className="text-glow" style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '2rem', fontWeight: 900 }}>
            Trung Tâm Ôn Luyện
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>
            Luyện tập câu hỏi trắc nghiệm bám sát nội dung của 21 thí nghiệm ảo.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, letterSpacing: '1px' }}>ĐÃ TRẢ LỜI</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>{totalAttempted}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, letterSpacing: '1px' }}>ĐÚNG</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-green)' }}>{score}</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ 
        position: 'relative', 
        display: 'flex', 
        alignItems: 'center', 
        background: 'rgba(255,255,255,0.03)', 
        borderRadius: '12px', 
        padding: '12px 20px',
        border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: '40px',
        maxWidth: '400px'
      }}>
        <Search size={18} color="#64748b" />
        <input 
          placeholder="Tìm bài tập thí nghiệm..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: '0.95rem', marginLeft: '12px', outline: 'none', width: '100%' }} 
        />
      </div>

      {/* Grid Labs */}
      {categories.map((cat, idx) => {
        const labsInCat = filteredLabs.filter(l => l.category === cat);
        if (labsInCat.length === 0) return null;

        return (
          <div key={idx} style={{ marginBottom: '40px' }}>
            <h2 style={{ 
              fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', 
              color: 'var(--accent-cyan)', borderLeft: '4px solid var(--accent-cyan)', paddingLeft: '12px',
              fontWeight: 800
            }}>
              {getIcon(cat)} {cat}
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {labsInCat.map((lab) => {
                const topicId = labToTopicMap[lab.id];
                const qCount = (questionBank[topicId] || []).length;

                return (
                  <div 
                    key={lab.id}
                    onClick={() => startQuiz(lab)}
                    style={{ 
                      padding: '24px', cursor: 'pointer', transition: 'all 0.3s ease', 
                      borderRadius: '20px', background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px', color: '#94a3b8' }}>
                          {lab.grade}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {qCount} câu
                        </span>
                      </div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>
                        {lab.name}
                      </h3>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Luyện tập ngay <ChevronRight size={14} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Exercises;
