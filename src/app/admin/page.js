'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { 
  Users, Swords, Signal, AlertTriangle, 
  Sparkles, CheckCircle2, TrendingUp, RefreshCw
} from 'lucide-react';
import { playSound } from '@/lib/sound';

export default function AdminDashboard() {
  // Trạng thái thống kê
  const [stats, setStats] = useState({
    totalStudents: 0,
    onlineStudents: 0,
    totalMatches: 0,
    todayMatches: 0,
  });

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Khởi tạo 7 ngày gần nhất với giá trị 0 thực tế
  const getInitialDays = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const pad = (n) => String(n).padStart(2, '0');
      return { date: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`, count: 0 };
    });
  };

  const [chartData, setChartData] = useState({
    userGrowth: getInitialDays(),
    subjectStats: [
      { subject: 'Toán', count: 0, color: '#3b82f6', glow: 'rgba(59,130,246,0.4)' },
      { subject: 'Vật lý', count: 0, color: '#a855f7', glow: 'rgba(168,85,247,0.4)' },
      { subject: 'Hóa học', count: 0, color: '#ec4899', glow: 'rgba(236,72,153,0.4)' },
      { subject: 'Sinh học', count: 0, color: '#10b981', glow: 'rgba(16,185,129,0.4)' },
    ]
  });

  useEffect(() => {
    // 1. Snapshot Realtime cho cảnh báo hệ thống (Không dùng cảnh báo giả lập)
    const alertsQuery = query(collection(db, 'system_alerts'), orderBy('timestamp', 'desc'), limit(5));
    const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
      const dbAlerts = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        dbAlerts.push({
          id: docSnap.id,
          ...data
        });
      });
      setAlerts(dbAlerts);
    }, (err) => {
      console.warn("Lỗi khi tải realtime alerts từ Firestore:", err);
    });

    // 2. Tải toàn bộ thống kê tổng quan thực tế
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const usersSnap = await getDocs(collection(db, 'users'));
        const roomsSnap = await getDocs(collection(db, 'match_rooms'));

        const now = Date.now();
        const startOfToday = new Date().setHours(0,0,0,0);

        let activeCount = 0;
        let todayMatchesCount = 0;
        let totalStus = 0;

        // Group người dùng mới theo ngày (7 ngày gần nhất)
        const dateMap = {};
        const days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const pad = (n) => String(n).padStart(2, '0');
          return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
        });
        
        days.forEach(day => {
          dateMap[day] = 0;
        });

        usersSnap.forEach(d => {
          const u = d.data();
          if (u.role !== 'admin' && u.email?.toLowerCase() !== 'admin123@gmail.com') {
            totalStus++;
            
            // Checking active within last 60 seconds
            if (u.lastActive && (now - u.lastActive) < 60000) {
              activeCount++;
            }

            // Phân bổ ngày đăng ký
            if (u.createdAt) {
              const regDate = new Date(u.createdAt);
              const pad = (n) => String(n).padStart(2, '0');
              const key = `${pad(regDate.getDate())}/${pad(regDate.getMonth() + 1)}`;
              if (dateMap[key] !== undefined) {
                dateMap[key]++;
              }
            }
          }
        });

        // Tích lũy số lượng người dùng tăng dần cho biểu đồ đường (hoàn toàn thực tế)
        let registeredInLast7Days = 0;
        days.forEach(day => {
          registeredInLast7Days += (dateMap[day] || 0);
        });

        let cumulativeUsers = Math.max(0, totalStus - registeredInLast7Days);
        const userGrowthData = days.map(day => {
          cumulativeUsers += (dateMap[day] || 0);
          return { date: day, count: cumulativeUsers };
        });

        // Thống kê trận đấu
        const subjectCount = { math: 0, physics: 0, chemistry: 0, biology: 0 };
        roomsSnap.forEach(d => {
          const r = d.data();
          if (r.createdAt) {
            const matchTime = new Date(r.createdAt).getTime();
            if (matchTime >= startOfToday) {
              todayMatchesCount++;
            }
          }
          if (r.subject) {
            subjectCount[r.subject] = (subjectCount[r.subject] || 0) + 1;
          }
        });

        const totalRooms = roomsSnap.size;

        setStats({
          totalStudents: totalStus,
          onlineStudents: activeCount,
          totalMatches: totalRooms,
          todayMatches: todayMatchesCount,
        });

        // Cập nhật biểu đồ với dữ liệu thực tế
        setChartData({
          userGrowth: userGrowthData,
          subjectStats: [
            { subject: 'Toán', count: subjectCount.math || 0, color: '#3b82f6', glow: 'rgba(59,130,246,0.4)' },
            { subject: 'Vật lý', count: subjectCount.physics || 0, color: '#a855f7', glow: 'rgba(168,85,247,0.4)' },
            { subject: 'Hóa học', count: subjectCount.chemistry || 0, color: '#ec4899', glow: 'rgba(236,72,153,0.4)' },
            { subject: 'Sinh học', count: subjectCount.biology || 0, color: '#10b981', glow: 'rgba(16,185,129,0.4)' },
          ]
        });
      } catch (err) {
        console.warn("Lỗi tải thống kê Dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();

    // Thiết lập refresh định kỳ mỗi 30s
    const refreshInterval = setInterval(fetchDashboardStats, 30000);

    return () => {
      unsubscribeAlerts();
      clearInterval(refreshInterval);
    };
  }, []);

  const handleRefreshData = () => {
    playSound.click();
    window.location.reload();
  };

  const getAlertStyle = (level) => {
    switch (level) {
      case 'warning':
        return {
          bg: 'bg-rose-500/5 border-rose-500/10',
          badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          text: 'text-rose-250',
          icon: <AlertTriangle className="w-4 h-4 text-rose-450 shrink-0" />
        };
      case 'security':
        return {
          bg: 'bg-purple-500/5 border-purple-500/10',
          badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          text: 'text-purple-250',
          icon: <AlertTriangle className="w-4 h-4 text-purple-450 shrink-0" />
        };
      case 'success':
        return {
          bg: 'bg-emerald-500/5 border-emerald-500/10',
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          text: 'text-emerald-250',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-450 shrink-0" />
        };
      default:
        return {
          bg: 'bg-zinc-500/5 border-zinc-500/10',
          badge: 'bg-zinc-550/10 text-zinc-400 border-zinc-500/20',
          text: 'text-zinc-300',
          icon: <Signal className="w-4 h-4 text-zinc-450 shrink-0" />
        };
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '--:--';
    try {
      let d;
      if (ts.toDate && typeof ts.toDate === 'function') {
        d = ts.toDate();
      } else {
        d = new Date(ts);
      }
      return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
    } catch (e) {
      return '--:--';
    }
  };

  // Tính toán đường Line SVG tự động vẽ biểu đồ
  const renderLineChart = () => {
    const counts = chartData.userGrowth.map(d => d.count);
    const maxVal = Math.max(...counts, 10);
    const minVal = Math.min(...counts, 0);
    const range = maxVal - minVal;
    
    const width = 500;
    const height = 150;
    const paddingLeft = 30;
    const paddingRight = 10;
    const paddingTop = 15;
    const paddingBottom = 20;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Tính tọa độ các điểm
    const points = chartData.userGrowth.map((d, i) => {
      const x = paddingLeft + (i / (chartData.userGrowth.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - ((d.count - minVal) / range) * chartHeight;
      return { x, y, ...d };
    });

    const pathD = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    // Tạo gradient lấp đầy bên dưới đường line
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        <defs>
          <linearGradient id="lineGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0" />
          </linearGradient>
          <filter id="neonShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Trục X ngang & Trục Y dọc mờ */}
        <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="#1f2235" strokeWidth="1" />
        <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={height - paddingBottom} stroke="#1f2235" strokeWidth="1" />

        {/* Lớp phủ màu chuyển sắc gradient */}
        <path d={areaD} fill="url(#lineGlow)" />

        {/* Đường line chính */}
        <path d={pathD} fill="none" stroke="#ec4899" strokeWidth="2.5" filter="url(#neonShadow)" />

        {/* Điểm các giá trị */}
        {points.map((p, i) => (
          <g key={i} className="group/dot cursor-pointer">
            <circle cx={p.x} cy={p.y} r="4" fill="#07080d" stroke="#ec4899" strokeWidth="2" />
            <circle cx={p.x} cy={p.y} r="7" fill="#ec4899" opacity="0" className="hover:opacity-30 transition-opacity" />
            {/* Tooltip khi rê chuột */}
            <text x={p.x} y={p.y - 8} textAnchor="middle" className="text-[8px] fill-zinc-350 font-mono font-bold">
              {p.count}
            </text>
          </g>
        ))}

        {/* Nhãn văn bản trục X */}
        {points.map((p, i) => (
          <text key={i} x={p.x} y={height - 5} textAnchor="middle" className="text-[7.5px] fill-zinc-500 font-mono font-semibold">
            {p.date}
          </text>
        ))}
      </svg>
    );
  };

  // Tính toán vẽ biểu đồ cột SVG
  const renderBarChart = () => {
    const counts = chartData.subjectStats.map(d => d.count);
    const maxVal = Math.max(...counts, 10);
    
    const width = 500;
    const height = 150;
    const paddingLeft = 35;
    const paddingRight = 10;
    const paddingTop = 15;
    const paddingBottom = 20;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    const barWidth = 40;
    const gap = (chartWidth - barWidth * chartData.subjectStats.length) / (chartData.subjectStats.length + 1);

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {/* Trục X & Y */}
        <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="#1f2235" strokeWidth="1" />
        <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={height - paddingBottom} stroke="#1f2235" strokeWidth="1" />

        {chartData.subjectStats.map((item, i) => {
          const barHeight = (item.count / maxVal) * chartHeight;
          const x = paddingLeft + gap + i * (barWidth + gap);
          const y = height - paddingBottom - barHeight;

          return (
            <g key={i} className="group/bar cursor-pointer">
              {/* Cột dữ liệu bóng mờ phát sáng */}
              <rect 
                x={x} 
                y={y} 
                width={barWidth} 
                height={barHeight} 
                fill={item.color} 
                rx="4"
                style={{ filter: `drop-shadow(0 0 5px ${item.glow})` }}
                className="transition-all hover:opacity-90"
              />
              
              {/* Nhãn số liệu trên đầu cột */}
              <text x={x + barWidth / 2} y={y - 5} textAnchor="middle" className="text-[9px] fill-white font-mono font-bold">
                {item.count}
              </text>

              {/* Nhãn môn học phía dưới cột */}
              <text x={x + barWidth / 2} y={height - 5} textAnchor="middle" className="text-[8px] fill-zinc-400 font-bold">
                {item.subject}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="space-y-8 select-none text-zinc-300 font-sans">
      {/* Page Title & Manual Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2 font-mono">
            Bảng điều khiển hệ thống
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Theo dõi thời gian thực, hoạt động người dùng và trạng thái của Đấu Trường STEM.
          </p>
        </div>

        <button
          onClick={handleRefreshData}
          className="flex items-center gap-2 px-4 py-2 bg-[#141622] hover:bg-[#1b1e30] border border-[#1f2235] hover:border-pink-500/40 text-xs font-mono font-bold text-zinc-350 hover:text-white rounded-xl transition-all cursor-pointer shadow-lg active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5 text-pink-500" /> Làm mới dữ liệu
        </button>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Students */}
        <div className="bg-[#0f1017]/60 border border-[#1f2235] hover:border-indigo-500/20 p-5 rounded-2xl relative overflow-hidden transition-all duration-300 group shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">TỔNG SỐ HỌC SINH</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/25">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">{stats.totalStudents}</span>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">tài khoản</span>
          </div>
          <p className="text-[10px] text-zinc-500 font-semibold mt-2">Dữ liệu liên kết từ Firebase Auth.</p>
        </div>

        {/* Card 2: Online Students */}
        <div className="bg-[#0f1017]/60 border border-[#1f2235] hover:border-emerald-500/20 p-5 rounded-2xl relative overflow-hidden transition-all duration-300 group shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">HỌC SINH ONLINE</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/25">
              <Signal className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">{stats.onlineStudents}</span>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">hoạt động</span>
          </div>
          <p className="text-[10px] text-zinc-500 font-semibold mt-2">Đang tương tác trong 60 giây qua.</p>
        </div>

        {/* Card 3: Total Matches */}
        <div className="bg-[#0f1017]/60 border border-[#1f2235] hover:border-pink-500/20 p-5 rounded-2xl relative overflow-hidden transition-all duration-300 group shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-pink-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">TỔNG SỐ TRẬN ĐẤU</span>
            <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 border border-pink-500/25">
              <Swords className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">{stats.totalMatches}</span>
            <span className="text-[10px] text-pink-450 font-bold font-mono">trận PvP</span>
          </div>
          <p className="text-[10px] text-zinc-500 font-semibold mt-2">Dữ liệu từ Firestore match_rooms.</p>
        </div>

        {/* Card 4: Today Matches */}
        <div className="bg-[#0f1017]/60 border border-[#1f2235] hover:border-amber-500/20 p-5 rounded-2xl relative overflow-hidden transition-all duration-300 group shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">ĐẤU TRONG HÔM NAY</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/25">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">{stats.todayMatches}</span>
            <span className="text-[10px] text-amber-450 font-bold font-mono">lượt chơi</span>
          </div>
          <p className="text-[10px] text-zinc-500 font-semibold mt-2">Tính từ 00:00 giờ sáng nay.</p>
        </div>
      </div>

      {/* Charts Section: User Growth & Subject Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Growth Line Chart */}
        <div className="bg-[#0f1017]/60 border border-[#1f2235] p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">Tăng trưởng tài khoản</h3>
              <p className="text-[10px] text-zinc-500 font-bold">Số lượng học sinh đăng ký 7 ngày gần nhất</p>
            </div>
            <span className="text-[9px] font-bold text-pink-500 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">7 Ngày</span>
          </div>
          <div className="w-full h-44 flex items-center justify-center">
            {loading ? (
              <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              renderLineChart()
            )}
          </div>
        </div>

        {/* Subject Stats Bar Chart */}
        <div className="bg-[#0f1017]/60 border border-[#1f2235] p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">Môn thi đấu ưa chuộng</h3>
              <p className="text-[10px] text-zinc-500 font-bold">Tổng hợp số lượt trận PvP theo 4 chuyên khoa</p>
            </div>
            <span className="text-[9px] font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/20">Lượt chơi</span>
          </div>
          <div className="w-full h-44 flex items-center justify-center">
            {loading ? (
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              renderBarChart()
            )}
          </div>
        </div>
      </div>

      {/* System Alerts / Activity Log List */}
      <div className="bg-[#0f1017]/60 border border-[#1f2235] p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#1f2235] pb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500 filter drop-shadow-[0_0_6px_rgba(245,158,11,0.2)] animate-pulse" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">Nhật ký & Cảnh báo hệ thống gần đây</h3>
          </div>
          <span className="text-[9px] font-bold text-zinc-400 bg-zinc-800 border border-zinc-700/60 px-2 py-0.5 rounded-full">Thời Gian Thực</span>
        </div>

        <div className="space-y-3 font-mono">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-xs font-bold text-zinc-550 border border-dashed border-[#1f2235] rounded-xl uppercase">
              Chưa có hoạt động hay cảnh báo nào được ghi nhận
            </div>
          ) : (
            alerts.map((alert) => {
              const style = getAlertStyle(alert.level);
              return (
                <div 
                  key={alert.id} 
                  className={`flex items-start gap-4 p-3.5 rounded-xl border ${style.bg} transition-all duration-300 hover:translate-x-1`}
                >
                  {style.icon}
                  <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <span className={`text-xs ${style.text} font-medium leading-relaxed`}>
                      {alert.message}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded border ${style.badge}`}>
                        {alert.level || 'info'}
                      </span>
                      <span className="text-[9px] text-zinc-550 font-bold">
                        [{formatTime(alert.timestamp)}]
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
