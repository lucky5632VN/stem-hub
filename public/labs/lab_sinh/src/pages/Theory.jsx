import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Beaker, 
  Search, 
  ArrowLeft, 
  Target, 
  FileText, 
  Layers, 
  Activity, 
  Dna, 
  Share2, 
  ArrowRight 
} from 'lucide-react';
import { experimentTheoryData } from '../data/experimentTheoryData';

const Theory = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLab, setSelectedLab] = useState(null);

  React.useEffect(() => {
    const savedLabId = sessionStorage.getItem('theory-active-lab-id');
    if (savedLabId) {
      const lab = experimentTheoryData.find(l => l.id === savedLabId);
      if (lab) setSelectedLab(lab);
    }
  }, []);

  const handleSelectLab = (lab) => {
    setSelectedLab(lab);
    if (lab) {
      sessionStorage.setItem('theory-active-lab-id', lab.id);
    } else {
      sessionStorage.removeItem('theory-active-lab-id');
    }
  };

  const categories = [...new Set(experimentTheoryData.map(l => l.category))];

  const filteredLabs = experimentTheoryData.filter(lab =>
    lab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lab.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBack = () => {
    handleSelectLab(null);
  };

  const getIcon = (category) => {
    switch (category) {
      case 'Sinh lý Thực vật': return <Layers size={20} color="var(--accent-cyan)" />;
      case 'Sinh lý & Giải phẫu Người': return <Activity size={20} color="#ef4444" />;
      case 'Di truyền & Biến dị': return <Dna size={20} color="#a855f7" />;
      case 'Sinh thái & Tiến hóa': return <Share2 size={20} color="#22c55e" />;
      default: return <FileText size={20} />;
    }
  };

  if (selectedLab) {
    return (
      <div style={{ 
        padding: '40px 60px', 
        height: '100%', 
        overflowY: 'auto', 
        background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
        color: '#f8fafc',
        fontFamily: "'Inter', sans-serif"
      }}>
        {/* Nút quay lại */}
        <button 
          onClick={handleBack}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#cbd5e1', padding: '10px 16px', borderRadius: '12px',
            cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem', fontWeight: 600,
            marginBottom: '32px'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          <ArrowLeft size={18} /> Quay lại danh sách
        </button>

        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Header chi tiết */}
          <div style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '24px', marginBottom: '40px' 
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                {getIcon(selectedLab.category)} {selectedLab.category} • {selectedLab.grade}
              </div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, color: '#fff', letterSpacing: '-0.5px' }}>
                {selectedLab.name}
              </h1>
            </div>

            <button 
              className="btn-primary" 
              style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
              onClick={() => navigate(`/virtual-lab/${selectedLab.id}`)}
            >
              <Beaker size={20} /> Vào Phòng Lab <ArrowRight size={18} />
            </button>
          </div>

          {/* Nội dung Bento Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px', alignItems: 'start' }}>
            
            {/* Cột trái: Lý thuyết & Nguyên lý */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Khối Mục tiêu */}
              <div style={{ 
                background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', 
                borderRadius: '20px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' 
              }}>
                <h3 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-cyan)', fontSize: '1.1rem', fontWeight: 800 }}>
                  <Target size={20} /> MỤC TIÊU THÍ NGHIỆM
                </h3>
                <p style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem', lineHeight: '1.6' }}>{selectedLab.purpose}</p>
              </div>

              {/* Khối Nguyên lý */}
              <div style={{ 
                background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.08)', 
                borderRadius: '24px', padding: '32px', backdropFilter: 'blur(20px)' 
              }}>
                <h3 style={{ margin: '0 0 24px 0', color: '#fff', fontSize: '1.3rem', fontWeight: 800 }}>
                  Cơ sở khoa học
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: '#cbd5e1', fontSize: '1.05rem', lineHeight: '1.8' }}>
                  {selectedLab.principles.map((p, idx) => (
                    <p key={idx} style={{ margin: 0 }}>{p}</p>
                  ))}
                </div>
              </div>

            </div>

            {/* Cột phải: Các bước tiến hành */}
            <div style={{ 
              background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.05)', 
              borderRadius: '24px', padding: '24px' 
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="var(--accent-cyan)" /> Các bước lý thuyết
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {selectedLab.steps.map((step, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.02)', 
                    padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.02)' 
                  }}>
                    <div style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>{idx + 1}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>{step.replace(/^Bước \d+:\s*/, '')}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
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
            Thư Viện Lý Thuyết Thực Hành
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>
            Tìm hiểu cơ sở khoa học chuyên sâu của 21 thí nghiệm ảo trong chương trình.
          </p>
        </div>

        {/* Thanh tìm kiếm */}
        <div style={{ 
          position: 'relative', 
          display: 'flex', 
          alignItems: 'center', 
          background: 'rgba(255,255,255,0.05)', 
          borderRadius: '12px', 
          padding: '10px 16px',
          width: '300px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <Search size={18} color="#64748b" />
          <input 
            placeholder="Tìm lý thuyết thí nghiệm..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              background: 'none', border: 'none', color: '#fff', 
              fontSize: '0.9rem', marginLeft: '10px', outline: 'none', width: '100%' 
            }}
          />
        </div>
      </div>

      {/* Danh sách Thí nghiệm theo Nhóm */}
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
              {labsInCat.map((lab) => (
                <div 
                  key={lab.id}
                  onClick={() => handleSelectLab(lab)}
                  style={{ 
                    padding: '24px', cursor: 'pointer', transition: 'all 0.3s ease', 
                    borderRadius: '20px', background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)';
                    e.currentTarget.style.boxShadow = '0 15px 30px rgba(6, 182, 212, 0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px', color: '#94a3b8' }}>
                        {lab.grade}
                      </span>
                      <BookOpen size={16} color="#64748b" />
                    </div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>
                      {lab.name}
                    </h3>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Xem chi tiết <ArrowRight size={14} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Theory;
