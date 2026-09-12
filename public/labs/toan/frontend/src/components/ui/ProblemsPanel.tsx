import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, Clock, Crown, Search, ArrowLeft, 
  Lightbulb, Info, Trophy, Target, BookOpen, Send
} from 'lucide-react';
import { useGeometryStore } from '../../store/useGeometryStore';

interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  acceptanceRate: number;
  totalSubmissions: number;
  isPremium: boolean;
  content: string;
  explanation: string;
}

const PROBLEMS: Problem[] = [
  {
    id: "cau-1",
    title: "Câu 1: Góc giữa SC và mặt phẳng (ABCD)",
    difficulty: "Easy",
    tags: ["Hình chóp", "Góc"],
    acceptanceRate: 85.2,
    totalSubmissions: 3120,
    isPremium: false,
    content: "Cho hình chóp S.ABCD có đáy là hình vuông, SA vuông góc với (ABCD). Hãy xác định góc giữa đường thẳng SC và mặt phẳng (ABCD).",
    explanation: "Vì SA ⊥ (ABCD) nên AC là hình chiếu vuông góc của SC lên mặt phẳng (ABCD). Do đó, góc giữa đường thẳng SC và mặt phẳng (ABCD) là góc SCA."
  },
  {
    id: "cau-2",
    title: "Câu 2: Tính góc giữa SD và mặt đáy",
    difficulty: "Medium",
    tags: ["Hình chóp", "Góc"],
    acceptanceRate: 65.5,
    totalSubmissions: 2840,
    isPremium: false,
    content: "Cho hình chóp S.ABCD có đáy là hình vuông cạnh a, SA ⊥ (ABCD) và SA = a. Tính góc giữa SD và mặt đáy (ABCD).",
    explanation: "Góc giữa SD và (ABCD) là góc SDA. Xét tam giác vuông SAD tại A, ta có SA = AD = a, suy ra tam giác SAD vuông cân tại A. Vậy góc SDA = 45°."
  },
  {
    id: "cau-3",
    title: "Câu 3: Tính góc giữa SC và (ABC)",
    difficulty: "Medium",
    tags: ["Hình chóp", "Góc"],
    acceptanceRate: 58.2,
    totalSubmissions: 2150,
    isPremium: false,
    content: "Cho hình chóp S.ABC có SA ⊥ (ABC), SA = 2a. Tam giác ABC vuông tại B, AB = a√3 và BC = a. Tính góc giữa đường thẳng SC và mặt phẳng (ABC).",
    explanation: "AC = √(AB² + BC²) = √(3a² + a²) = 2a. Góc giữa SC và (ABC) là góc SCA. Xét tam giác vuông SAC tại A, ta có tan(SCA) = SA / AC = 2a / 2a = 1. Vậy góc SCA = 45°."
  },
  {
    id: "cau-4",
    title: "Câu 4: Góc giữa SC và (ABCD) (Đề TK 2020)",
    difficulty: "Medium",
    tags: ["Hình chóp", "Góc"],
    acceptanceRate: 62.1,
    totalSubmissions: 4500,
    isPremium: false,
    content: "Cho hình chóp S.ABCD có đáy là hình vuông cạnh a√3, SA ⊥ (ABCD) và SA = a√2. Tính góc giữa SC và mặt phẳng (ABCD).",
    explanation: "Đường chéo AC = (a√3) * √2 = a√6. Góc giữa SC và (ABCD) là góc SCA. Xét tam giác vuông SAC tại A, ta có tan(SCA) = SA / AC = a√2 / a√6 = 1/√3. Vậy góc SCA = 30°."
  },
  {
    id: "cau-5",
    title: "Câu 5: Góc giữa đường thẳng SB và đáy (Đề 2018)",
    difficulty: "Medium",
    tags: ["Hình chóp", "Góc"],
    acceptanceRate: 60.5,
    totalSubmissions: 3900,
    isPremium: false,
    content: "Cho hình chóp S.ABCD có đáy là hình vuông cạnh a, SA ⊥ (ABCD) và SB = 2a. Tính góc giữa đường thẳng SB và mặt phẳng đáy.",
    explanation: "Góc giữa SB và đáy là góc SBA. Xét tam giác vuông SAB tại A, ta có cos(SBA) = AB / SB = a / 2a = 1/2. Vậy góc SBA = 60°."
  },
  {
    id: "cau-6",
    title: "Câu 6: Tính góc giữa SM và (ABCD)",
    difficulty: "Medium",
    tags: ["Hình chữ nhật", "Góc"],
    acceptanceRate: 45.8,
    totalSubmissions: 1200,
    isPremium: false,
    content: "Cho hình chóp S.ABCD có đáy là hình chữ nhật ABCD có AB = a, AD = 2a. Cạnh SA = a√6 và vuông góc với mặt phẳng đáy. Gọi M là trung điểm của BC. Tính góc giữa SM và (ABCD).",
    explanation: "M là trung điểm BC => BM = a. Tam giác ABM vuông tại B => AM = √(AB² + BM²) = √(a² + a²) = a√2. Góc giữa SM và đáy là góc SMA. Xét tam giác vuông SAM tại A, ta có tan(SMA) = SA / AM = a√6 / a√2 = √3. Vậy góc SMA = 60°."
  },
  {
    id: "cau-7",
    title: "Câu 7: Góc tạo bởi SC và mặt phẳng (ABCD)",
    difficulty: "Medium",
    tags: ["Mặt bên vuông góc", "Góc"],
    acceptanceRate: 42.5,
    totalSubmissions: 1560,
    isPremium: true,
    content: "Cho hình chóp S.ABCD có đáy ABCD là hình chữ nhật, AB = a, BC = 2a. Hai mặt bên (SAB), (SAD) cùng vuông góc với mặt phẳng (ABCD) và SA = a√15. Tính góc tạo bởi SC và mặt phẳng (ABCD).",
    explanation: "(SAB) ⊥ (ABCD) và (SAD) ⊥ (ABCD) => SA ⊥ (ABCD). AC = √(AB² + BC²) = √(a² + 4a²) = a√5. Góc cần tìm là góc SCA. Xét tam giác vuông SAC tại A: tan(SCA) = SA / AC = a√15 / a√5 = √3. Vậy góc SCA = 60°."
  },
  {
    id: "cau-8",
    title: "Câu 8: Tính tan góc giữa SC và (ABCD)",
    difficulty: "Medium",
    tags: ["Hình chữ nhật", "Góc", "Tan"],
    acceptanceRate: 55.0,
    totalSubmissions: 2200,
    isPremium: false,
    content: "Cho hình chóp S.ABCD có đáy ABCD là hình chữ nhật, cạnh AB = a, AD = 2a, SA ⊥ (ABCD), SA = 5a. Tính tan góc giữa SC và mặt phẳng (ABCD).",
    explanation: "AC = √(AB² + BC²) = √(a² + 4a²) = a√5. Góc giữa SC và đáy là góc SCA. Xét tam giác vuông SAC tại A: tan(SCA) = SA / AC = 5a / a√5 = √5."
  }
];

const PROBLEM_CORRECT_ANSWERS: Record<string, string[]> = {
  'cau-1': ['sca', 'gocsca', 's-c-a'],
  'cau-2': ['45', '45o', '45 độ', '45deg', '45degrees'],
  'cau-3': ['45', '45o', '45 độ', '45deg', '45degrees'],
  'cau-4': ['30', '30o', '30 độ', '30deg', '30degrees'],
  'cau-5': ['60', '60o', '60 độ', '60deg', '60degrees'],
  'cau-6': ['60', '60o', '60 độ', '60deg', '60degrees'],
  'cau-7': ['60', '60o', '60 độ', '60deg', '60degrees'],
  'cau-8': ['\\sqrt{5}', 'sqrt(5)', 'căn 5', 'can 5', 'căn5', 'can5']
};

const getShapeDataForProblem = (id: string) => {
  if (id === 'cau-3') {
    // S.ABC
    return {
      vertices: {
        A: [-1, -0.8, -0.8],
        B: [1, -0.8, -0.8],
        C: [0, -0.8, 1],
        S: [-1, 1.4, -0.8]
      },
      edges: [
        ["A", "B", "white", "solid"],
        ["B", "C", "white", "solid"],
        ["C", "A", "white", "solid"],
        ["S", "A", "white", "solid"],
        ["S", "B", "white", "solid"],
        ["S", "C", "white", "solid"]
      ]
    };
  } else if (id === 'cau-6') {
    // S.ABCD with Midpoint M
    return {
      vertices: {
        A: [-1.2, -0.8, -0.8],
        B: [1.2, -0.8, -0.8],
        C: [1.2, -0.8, 1.2],
        D: [-1.2, -0.8, 1.2],
        S: [-1.2, 1.4, -0.8],
        M: [1.2, -0.8, 0.2]
      },
      edges: [
        ["A", "B", "white", "solid"],
        ["B", "M", "white", "solid"],
        ["M", "C", "white", "solid"],
        ["C", "D", "white", "solid"],
        ["D", "A", "white", "solid"],
        ["S", "A", "white", "solid"],
        ["S", "B", "white", "solid"],
        ["S", "C", "white", "solid"],
        ["S", "D", "white", "solid"],
        ["S", "M", "yellow", "solid"]
      ]
    };
  } else {
    // S.ABCD (SA ⊥ ABCD)
    return {
      vertices: {
        A: [-1, -0.8, -0.8],
        B: [1, -0.8, -0.8],
        C: [1, -0.8, 1],
        D: [-1, -0.8, 1],
        S: [-1, 1.4, -0.8]
      },
      edges: [
        ["A", "B", "white", "solid"],
        ["B", "C", "white", "solid"],
        ["C", "D", "white", "solid"],
        ["D", "A", "white", "solid"],
        ["S", "A", "white", "solid"],
        ["S", "B", "white", "solid"],
        ["S", "C", "white", "solid"],
        ["S", "D", "white", "solid"]
      ]
    };
  }
};

const ProblemsPanel: React.FC = () => {
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Solved' | 'Attempted' | 'Todo'>('All');
  
  // Progress & Work state
  const [solvedList, setSolvedList] = useState<string[]>([]);
  const [attemptedList, setAttemptedList] = useState<string[]>([]);
  const [explanation, setExplanation] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { setShapeData, setSelectedShape } = useGeometryStore();

  // Load progress
  useEffect(() => {
    try {
      const solved = JSON.parse(localStorage.getItem('spatialmind_solved_list') || '[]');
      const attempted = JSON.parse(localStorage.getItem('spatialmind_attempted_list') || '[]');
      setSolvedList(Array.isArray(solved) ? solved : []);
      setAttemptedList(Array.isArray(attempted) ? attempted : []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Sync Geometry Data on Selecting a Problem
  useEffect(() => {
    if (selectedProblem) {
      // Set to custom shape so ControlPanel doesn't overwrite it
      setSelectedShape('custom');
      const data = getShapeDataForProblem(selectedProblem.id);
      setShapeData(data as any);
      setExplanation('');
      setAnswerInput('');
      setShowResult(false);
    } else {
      setSelectedShape('pyramid_square');
    }
  }, [selectedProblem, setShapeData, setSelectedShape]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSelectProblem = (prob: Problem) => {
    setSelectedProblem(prob);
  };

  const handleBack = () => {
    setSelectedProblem(null);
  };

  const handleSubmitAnswer = () => {
    if (!selectedProblem) return;
    if (!answerInput.trim()) {
      showToast('Vui lòng nhập đáp số cuối cùng!');
      return;
    }

    const acceptableAnswers = PROBLEM_CORRECT_ANSWERS[selectedProblem.id] || [];
    const normalizedInput = answerInput.trim().toLowerCase().replace(/\s+/g, '').replace(/độ/g, '').replace(/°/g, '').replace(/o/g, '');

    const correct = acceptableAnswers.some(ans => {
      const normalizedAns = ans.toLowerCase().replace(/\s+/g, '').replace(/độ/g, '').replace(/°/g, '').replace(/o/g, '');
      return normalizedInput === normalizedAns;
    });

    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      const newSolved = [...solvedList];
      if (!newSolved.includes(selectedProblem.id)) {
        newSolved.push(selectedProblem.id);
        setSolvedList(newSolved);
        localStorage.setItem('spatialmind_solved_list', JSON.stringify(newSolved));
      }
      showToast('🎉 Chúc mừng! Đáp án hoàn toàn chính xác.');
    } else {
      const newAttempted = [...attemptedList];
      if (!newAttempted.includes(selectedProblem.id) && !solvedList.includes(selectedProblem.id)) {
        newAttempted.push(selectedProblem.id);
        setAttemptedList(newAttempted);
        localStorage.setItem('spatialmind_attempted_list', JSON.stringify(newAttempted));
      }
      showToast('❌ Đáp số chưa chính xác. Hãy tính toán lại!');
    }
  };

  // Filter problems
  const filteredProblems = PROBLEMS.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'All' || p.difficulty === difficultyFilter;
    
    let matchesStatus = true;
    const isSolved = solvedList.includes(p.id);
    const isAttempted = attemptedList.includes(p.id) && !isSolved;
    
    if (statusFilter === 'Solved') matchesStatus = isSolved;
    else if (statusFilter === 'Attempted') matchesStatus = isAttempted;
    else if (statusFilter === 'Todo') matchesStatus = !isSolved && !isAttempted;

    return matchesSearch && matchesDifficulty && matchesStatus;
  });

  return (
    <div style={{ flex: 1, display: 'flex', background: '#0d1117', color: '#c9d1d9', overflow: 'hidden', position: 'relative' }}>
      
      {/* Toast Alert */}
      {toastMsg && (
        <div style={{
          position: 'absolute', top: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(20, 20, 25, 0.95)', border: '1px solid rgba(88,166,255,0.2)',
          color: '#f0f6fc', fontWeight: 600, padding: '0.8rem 1.6rem', borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 10000, fontSize: '0.85rem'
        }}>
          {toastMsg}
        </div>
      )}

      {/* 1. LIST VIEW */}
      {!selectedProblem ? (
        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ maxWidth: '840px', width: '100%' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #a371f7, #58a6ff)', padding: '0.7rem', borderRadius: '12px', boxShadow: '0 4px 16px rgba(163,113,247,0.3)' }}>
                  <Trophy color="#fff" size={26} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f0f6fc', margin: 0 }}>Kho Bài Tập Tự Luận</h2>
                  <div style={{ fontSize: '0.8rem', color: '#8b949e', marginTop: '0.2rem' }}>Rèn luyện tư duy không gian với các dạng bài toán chọn lọc</div>
                </div>
              </div>

              {/* Progress Panel */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #30363d', padding: '0.7rem 1.2rem', borderRadius: '14px', textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#8b949e' }}>Tiến độ của bạn</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#58a6ff', marginTop: '0.1rem' }}>
                  {solvedList.length} <span style={{ color: '#8b949e', fontSize: '0.85rem' }}>/ {PROBLEMS.length}</span>
                </div>
              </div>
            </div>

            {/* Filter toolbar */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              
              {/* Search */}
              <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                <Search size={16} color="#8b949e" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Tìm kiếm bài tập..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', background: 'rgba(0,0,0,0.2)',
                    border: '1px solid #30363d', borderRadius: '10px', color: '#f0f6fc', outline: 'none',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              {/* Difficulty filter */}
              <select
                value={difficultyFilter}
                onChange={e => setDifficultyFilter(e.target.value as any)}
                style={{
                  padding: '0.6rem 1rem', background: '#21262d', border: '1px solid #30363d',
                  borderRadius: '10px', color: '#c9d1d9', outline: 'none', fontSize: '0.85rem', cursor: 'pointer'
                }}
              >
                <option value="All">Độ khó: Tất cả</option>
                <option value="Easy">Dễ (Easy)</option>
                <option value="Medium">Trung bình (Medium)</option>
                <option value="Hard">Khó (Hard)</option>
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                style={{
                  padding: '0.6rem 1rem', background: '#21262d', border: '1px solid #30363d',
                  borderRadius: '10px', color: '#c9d1d9', outline: 'none', fontSize: '0.85rem', cursor: 'pointer'
                }}
              >
                <option value="All">Trạng thái: Tất cả</option>
                <option value="Solved">Đã giải (Solved)</option>
                <option value="Attempted">Đang làm (Attempted)</option>
                <option value="Todo">Chưa giải (Todo)</option>
              </select>
            </div>

            {/* List */}
            <div style={{ display: 'grid', gap: '0.8rem' }}>
              {filteredProblems.length > 0 ? (
                filteredProblems.map(p => {
                  const isSolved = solvedList.includes(p.id);
                  const isAttempted = attemptedList.includes(p.id) && !isSolved;
                  
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProblem(p)}
                      className="glass-hover"
                      style={{
                        padding: '1.2rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.04)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
                        transition: 'all 0.2s', background: 'rgba(255,255,255,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* Status Icon */}
                        {isSolved ? (
                          <div style={{ color: '#56d364' }}><CheckCircle2 size={22} /></div>
                        ) : isAttempted ? (
                          <div style={{ color: '#e3b341' }}><Clock size={22} /></div>
                        ) : (
                          <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px dashed #30363d' }} />
                        )}

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 600, color: '#f0f6fc', fontSize: '0.95rem' }}>{p.title}</span>
                            {p.isPremium && <Crown size={14} color="#fbc02d" />}
                          </div>
                          
                          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                            {p.tags.map(t => (
                              <span key={t} style={{ fontSize: '0.7rem', background: 'rgba(88,166,255,0.08)', color: '#58a6ff', padding: '0.1rem 0.5rem', borderRadius: '6px', fontWeight: 600 }}>
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Meta badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{
                          fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '8px',
                          color: p.difficulty === 'Easy' ? '#56d364' : p.difficulty === 'Medium' ? '#e3b341' : '#f85149',
                          background: p.difficulty === 'Easy' ? 'rgba(84,211,100,0.1)' : p.difficulty === 'Medium' ? 'rgba(227,179,65,0.1)' : 'rgba(248,81,73,0.1)',
                          border: `1px solid ${p.difficulty === 'Easy' ? 'rgba(84,211,100,0.15)' : p.difficulty === 'Medium' ? 'rgba(227,179,65,0.15)' : 'rgba(248,81,73,0.15)'}`
                        }}>
                          {p.difficulty}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#8b949e', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px dashed #30363d' }}>
                  Không tìm thấy bài tập nào phù hợp.
                </div>
              )}
            </div>

          </div>
        </div>
      ) : (
        
        // 2. WORKSPACE VIEW
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          {/* Workspace Header */}
          <div style={{ padding: '0.8rem 1.5rem', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <button
                onClick={handleBack}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: 'none', color: '#c9d1d9',
                  padding: '0.4rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <span style={{ fontWeight: 700, color: '#f0f6fc', fontSize: '0.95rem' }}>{selectedProblem.title}</span>
                <span style={{
                  marginLeft: '0.8rem', fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.5rem', borderRadius: '6px',
                  color: selectedProblem.difficulty === 'Easy' ? '#56d364' : selectedProblem.difficulty === 'Medium' ? '#e3b341' : '#f85149',
                  background: selectedProblem.difficulty === 'Easy' ? 'rgba(84,211,100,0.1)' : selectedProblem.difficulty === 'Medium' ? 'rgba(227,179,65,0.1)' : 'rgba(248,81,73,0.1)',
                }}>
                  {selectedProblem.difficulty}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#8b949e', fontWeight: 600 }}>Hình mẫu đã được nạp tự động</span>
            </div>
          </div>

          {/* Body workspace */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            
            {/* Left side: Problem & Work panel */}
            <div style={{ width: '420px', borderRight: '1px solid #30363d', display: 'flex', flexDirection: 'column', height: '100%', background: '#090d13' }}>
              
              {/* Question content */}
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #30363d', background: 'rgba(255,255,255,0.01)', overflowY: 'auto', maxHeight: '40%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#58a6ff', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.8rem' }}>
                  <Target size={14} /> Đề bài
                </div>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#f0f6fc', lineHeight: 1.7, fontWeight: 500 }}>
                  {selectedProblem.content}
                </p>

                {/* AI Hint */}
                <div style={{ marginTop: '1.2rem', padding: '0.8rem 1rem', background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    <Lightbulb size={13} /> Gợi ý từ AI
                  </div>
                  <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.6 }}>
                    {selectedProblem.id === 'cau-1' || selectedProblem.id === 'cau-2' 
                      ? "Hãy xoay hình và chú ý vào mặt đáy. SA vuông góc với đáy nên hình chiếu của SC là AC, góc cần tìm chính là góc SCA."
                      : "Sử dụng định lý Pytago trong tam giác đáy để tính độ dài đường chéo, sau đó áp dụng hệ thức lượng lượng giác."}
                  </p>
                </div>
              </div>

              {/* Work area */}
              <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', overflowY: 'auto' }}>
                
                {/* Trình bày */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Phần trình bày bài giải
                  </label>
                  <textarea
                    ref={textareaRef}
                    placeholder="Nhập lập luận và các bước tính toán của bạn tại đây (VD: Ta có SA vuông góc đáy, AC là đường chéo...)"
                    value={explanation}
                    onChange={e => setExplanation(e.target.value)}
                    style={{
                      width: '100%', flex: 1, minHeight: '100px', background: 'rgba(0,0,0,0.3)', border: '1px solid #30363d',
                      borderRadius: '10px', padding: '0.8rem 1rem', color: '#c9d1d9', outline: 'none', resize: 'none',
                      fontSize: '0.85rem', lineHeight: 1.6, fontFamily: 'sans-serif'
                    }}
                  />
                </div>

                {/* Final answer input */}
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                    Đáp số cuối cùng <span style={{ color: '#f85149' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#58a6ff', fontSize: '0.9rem' }}>$</div>
                    <input
                      type="text"
                      placeholder="VD: 45, 60, 30, hoặc can 5"
                      value={answerInput}
                      onChange={e => setAnswerInput(e.target.value)}
                      style={{
                        width: '100%', padding: '0.7rem 1rem 0.7rem 2rem', background: '#040609', border: '1px solid #30363d',
                        borderRadius: '10px', color: '#f0f6fc', outline: 'none', fontSize: '0.85rem', fontWeight: 600
                      }}
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  onClick={handleSubmitAnswer}
                  style={{
                    padding: '0.8rem', background: 'linear-gradient(135deg, #1f6feb, #388bfd)', color: '#fff',
                    border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(31,111,235,0.3)', transition: 'all 0.2s'
                  }}
                >
                  <Send size={15} /> Nộp bài chấm điểm
                </button>

                {/* Result view */}
                {showResult && (
                  <div style={{
                    padding: '1rem', borderRadius: '12px', border: '1px solid',
                    background: isCorrect ? 'rgba(84,211,100,0.06)' : 'rgba(248,81,73,0.06)',
                    borderColor: isCorrect ? 'rgba(84,211,100,0.2)' : 'rgba(248,81,73,0.2)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: isCorrect ? '#56d364' : '#f85149', fontSize: '0.88rem' }}>
                      {isCorrect ? <CheckCircle2 size={18} /> : <Info size={18} />}
                      {isCorrect ? 'Accepted!' : 'Wrong Answer!'}
                    </div>
                    
                    <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.78rem', color: '#8b949e', lineHeight: 1.6 }}>
                      {isCorrect 
                        ? `Tuyệt vời! ${selectedProblem.explanation}` 
                        : "Đáp án của bạn chưa đúng. Hãy xem lại gợi ý từ AI hoặc lập luận tính toán."}
                    </p>
                  </div>
                )}

              </div>

            </div>

            {/* Right side: 3D interactive viewer banner helper */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', pointerEvents: 'none' }}>
              <div style={{ background: 'rgba(20,20,25,0.85)', padding: '1.2rem 2.5rem', borderRadius: '16px', border: '1px solid rgba(88,166,255,0.15)', textAlign: 'center', maxWidth: '340px' }}>
                <BookOpen size={32} color="#58a6ff" style={{ marginBottom: '0.6rem' }} />
                <h4 style={{ margin: 0, color: '#f0f6fc', fontSize: '0.95rem', fontWeight: 700 }}>Không Gian 3D Trực Quan</h4>
                <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.75rem', color: '#8b949e', lineHeight: 1.6 }}>
                  Hãy quan sát và xoay mô hình hình học ở góc nhìn bên để hiểu sâu hơn về mặt phẳng chiếu và góc tạo bởi đường thẳng!
                </p>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default ProblemsPanel;
