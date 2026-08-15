import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Microscope, 
  Dna, 
  Share2,
  ArrowRight,
  FlaskConical,
  User,
  Layers,
  Zap,
  ShieldCheck,
  Layout,
  BookOpen,
  MousePointer2,
  Trophy
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);

  const categories = [
    { id: 'anatomy', title: 'Sinh lý & Giải phẫu', icon: <User size={28} />, color: '#f43f5e', path: '/virtual-lab' },
    { id: 'genetics', title: 'Di truyền & Biến dị', icon: <Dna size={28} />, color: '#00ffa3', path: '/virtual-lab' },
    { id: 'ecology', title: 'Sinh thái & Tiến hóa', icon: <Share2 size={28} />, color: '#00f0ff', path: '/virtual-lab' },
    { id: 'cell', title: 'Tế bào & Thực vật', icon: <Layers size={28} />, color: '#8b5cf6', path: '/virtual-lab' }
  ];

  const features = [
    { icon: <Zap color="#f59e0b" />, title: 'Tương tác WebGL', desc: 'Công nghệ mô phỏng 3D mượt mà ngay trên trình duyệt.' },
    { icon: <ShieldCheck color="#10b981" />, title: 'Chuẩn GDPT 2018', desc: 'Nội dung bám sát chương trình giáo dục phổ thông mới.' },
    { icon: <Layout color="#3b82f6" />, title: 'Giao diện Premium', desc: 'Trải nghiệm người dùng tinh tế, tập trung vào việc học.' }
  ];

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#020617', color: '#fff' }}>
      
      {/* 1. Hero Section */}
      <section style={{ 
        padding: '120px 40px 100px', textAlign: 'center', 
        background: 'radial-gradient(circle at 50% 0%, #1e293b 0%, #020617 70%)',
        position: 'relative', overflow: 'hidden'
      }}>
        <div className="animate-slide-up" style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '8px', 
            padding: '8px 20px', borderRadius: '100px', 
            background: 'rgba(0, 240, 255, 0.05)', border: '1px solid rgba(0, 240, 255, 0.1)',
            marginBottom: '32px'
          }}>
            <FlaskConical size={18} color="#00f0ff" />
            <span style={{ color: '#00f0ff', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '2px' }}>
              FUTURE OF BIOLOGY EDUCATION
            </span>
          </div>
          
          <h1 style={{ fontSize: '4.5rem', fontWeight: 900, marginBottom: '24px', lineHeight: 1.1, letterSpacing: '-2px' }}>
            BioSTEM <span className="text-gradient">Virtual AI</span> <br/>
            Phòng Thí Nghiệm Số Thế Hệ Mới
          </h1>
          
          <p style={{ color: '#94a3b8', fontSize: '1.4rem', maxWidth: '800px', margin: '0 auto 48px', lineHeight: 1.6 }}>
            Nền tảng thực hành Sinh học tương tác cao, kết hợp giữa đồ họa 3D chuẩn xác 
            và trí tuệ nhân tạo, mang đến trải nghiệm học tập không giới hạn.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button className="btn-primary" style={{ padding: '16px 32px', borderRadius: '12px', fontSize: '1rem' }} onClick={() => navigate('/virtual-lab')}>
              Bắt đầu khám phá <ArrowRight size={20} />
            </button>
            <button className="btn-primary" style={{ padding: '16px 32px', borderRadius: '12px', fontSize: '1rem', background: 'rgba(255,255,255,0.05)' }} onClick={() => navigate('/theory')}>
              Tìm hiểu lý thuyết
            </button>
          </div>
        </div>
      </section>

      {/* 2. Core Features */}
      <section style={{ padding: '80px 40px', background: '#020617' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
          {features.map((f, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '32px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>{f.title}</h3>
              <p style={{ color: '#64748b', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Learning Path (How it works) */}
      <section style={{ padding: '100px 40px', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '60px' }}>Lộ Trình Trải Nghiệm</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', position: 'relative' }}>
            {[
              { icon: <BookOpen />, step: '01', title: 'Nghiên cứu lý thuyết', desc: 'Tìm hiểu kiến thức nền tảng tại thư viện Theory.' },
              { icon: <MousePointer2 />, step: '02', title: 'Thực hành tương tác', desc: 'Trực tiếp thao tác trên các mô hình 3D thực tế.' },
              { icon: <Trophy />, step: '03', title: 'Đánh giá kết quả', desc: 'Kiểm tra mức độ hiểu bài qua các chỉ số trong Lab.' }
            ].map((s, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <div style={{ fontSize: '4rem', fontWeight: 900, color: 'rgba(255,255,255,0.03)', position: 'absolute', top: '-20px', left: 0 }}>{s.step}</div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ color: 'var(--accent-cyan)', marginBottom: '16px' }}>{s.icon}</div>
                  <h4 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>{s.title}</h4>
                  <p style={{ color: '#64748b', fontSize: '0.95rem' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Categories Grid */}
      <section style={{ padding: '100px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Thư Viện Thí Nghiệm</h2>
            <p style={{ color: '#64748b' }}>Hệ thống 4 phân hệ chuyên sâu với hơn 20 bài thí nghiệm thực tế.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            {categories.map((cat) => (
              <div 
                key={cat.id}
                className="glass-panel" 
                style={{ 
                  padding: '32px', cursor: 'pointer', borderRadius: '24px', transition: 'all 0.3s ease',
                  border: hoveredCard === cat.id ? `1px solid ${cat.color}66` : '1px solid rgba(255,255,255,0.05)',
                  transform: hoveredCard === cat.id ? 'translateY(-8px)' : 'none'
                }}
                onMouseEnter={() => setHoveredCard(cat.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => navigate(cat.path)}
              >
                <div style={{ color: cat.color, marginBottom: '24px' }}>{cat.icon}</div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>{cat.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: cat.color, fontSize: '0.85rem', fontWeight: 600 }}>
                  Khám phá ngay <ArrowRight size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer style={{ padding: '60px 40px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '16px' }}>BioSTEM AI</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '32px' }}>
            Hệ sinh thái Giáo dục Thực hành Số © 2026. <br/>
            Thiết kế bám sát chương trình GDPT 2018.
          </p>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', color: '#64748b', fontSize: '0.8rem' }}>
            <span>Điều khoản sử dụng</span>
            <span>Chính sách bảo mật</span>
            <span>Liên hệ: support@biostem.ai</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;
