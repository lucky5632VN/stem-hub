'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { playSound } from '@/lib/sound';
import { savePendingShare } from '@/lib/indexedDB';
import { 
  ArrowLeft, Maximize2, Minimize2, RefreshCw, MessageSquare, 
  Camera, Sparkles, Send, X, Shield, Activity, Share2, CheckCircle2, Dna, ImagePlus
} from 'lucide-react';

const MolecularViewerModal = dynamic(() => import('@/components/organisms/MolecularViewerModal'), { 
  ssr: false,
  loading: () => null 
});

const AI_COMPANION_DATA = {
  chem: {
    welcome: "🔬 Xin chào! Tôi là Trợ lý Lượng tử phòng Lab Hóa. Tôi có thể hỗ trợ bạn thiết lập các chuỗi phản ứng axit-bazơ, cân bằng phương trình hóa học hoặc đo lường nồng độ pH. Hãy chọn một câu hỏi gợi ý bên dưới hoặc nhập câu hỏi của bạn nhé!",
    suggestions: [
      "Làm thế nào để pha dung dịch HCl 0.1M?",
      "Giải thích phản ứng trung hòa axit-bazơ?",
      "Công thức tính độ pH của dung dịch là gì?"
    ],
    answers: {
      "Làm thế nào để pha dung dịch HCl 0.1M?": "Để pha 1 lít dung dịch HCl 0.1M từ HCl đặc (thường là 37%, d = 1.19 g/mL):\n1. Tính số mol HCl cần dùng: n = C.V = 0.1 mol.\n2. Khối lượng HCl nguyên chất: m = 0.1 * 36.5 = 3.65g.\n3. Khối lượng dung dịch đặc cần lấy: m_dd = 3.65 / 0.37 = 9.86g.\n4. Thể tích dung dịch đặc cần hút: V_dd = m_dd / d = 9.86 / 1.19 ≈ 8.3 mL.\n5. Đong khoảng 500mL nước cất vào bình định mức 1L, hút từ từ 8.3 mL HCl đặc nhỏ vào (luôn cho axit vào nước, KHÔNG làm ngược lại), sau đó thêm nước cất đến vạch định mức 1L.",
      "Giải thích phản ứng trung hòa axit-bazơ?": "Phản ứng trung hòa là phản ứng giữa một axit và một bazơ tạo thành muối và nước. Bản chất là sự kết hợp giữa ion H+ (từ axit) và ion OH- (từ bazơ) để tạo thành phân tử nước (H2O):\n\nFormula: H⁺ + OH⁻ → H₂O\n\nVí dụ: HCl + NaOH → NaCl + H₂O. Khi phản ứng đạt điểm tương đương (lượng H+ bằng lượng OH-), dung dịch sẽ có tính trung tính (pH ≈ 7 nếu là axit mạnh và bazơ mạnh).",
      "Công thức tính độ pH của dung dịch là gì?": "Độ pH là đại lượng đo hoạt độ của các ion hydro (H+) trong dung dịch, xác định tính axit hay bazơ của dung dịch đó. Công thức xác định:\n\nFormula: pH = -log₁₀[H⁺]\n\nTrong đó [H+] là nồng độ ion H+ tính bằng mol/lít.\n- pH < 7: Dung dịch có tính axit (nồng độ H+ cao).\n- pH = 7: Dung dịch trung tính (nước tinh khiết).\n- pH > 7: Dung dịch có tính bazơ/kiềm (nồng độ H+ thấp, OH- cao)."
    }
  },
  phys: {
    welcome: "⚡ Chào bạn! Tôi là Trợ lý Lượng tử phòng Lab Lý. Bạn cần trợ giúp gì về dao động điều hòa, mạch điện xoay chiều AC hay các định luật Newton cơ học?",
    suggestions: [
      "Cách nối song song và nối tiếp các điện trở?",
      "Công thức tính chu kỳ dao động con lắc lò xo?",
      "Giải thích hiện tượng cảm ứng điện từ?"
    ],
    answers: {
      "Cách nối song song và nối tiếp các điện trở?": "1. Mạch nối tiếp:\n- Cường độ dòng điện bằng nhau qua mọi điện trở: I = I₁ = I₂.\n- Hiệu điện thế tổng bằng tổng các hiệu điện thế thành phần: U = U₁ + U₂.\n- Điện trở tương đương: R_tđ = R₁ + R₂.\n\n2. Mạch song song:\n- Hiệu điện thế bằng nhau: U = U₁ = U₂.\n- Cường độ dòng điện tổng bằng tổng các cường độ thành phần: I = I₁ + I₂.\n- Điện trở tương đương nghịch đảo: 1/R_tđ = 1/R₁ + 1/R₂.",
      "Công thức tính chu kỳ dao động con lắc lò xo?": "Chu kỳ dao động T của con lắc lò xo phụ thuộc vào khối lượng vật nặng m (kg) và độ cứng của lò xo k (N/m), được tính theo công thức:\n\nFormula: T = 2π * √(m / k)\n\nTrong đó:\n- T: Chu kỳ dao động (giây).\n- m: Khối lượng vật treo (kg).\n- k: Độ cứng lò xo (N/m).\nChu kỳ này hoàn toàn độc lập với biên độ dao động trong giới hạn đàn hồi.",
      "Giải thích hiện tượng cảm ứng điện từ?": "Hiện tượng cảm ứng điện từ là sự xuất hiện một suất điện động cảm ứng (và dòng điện cảm ứng nếu mạch kín) bên trong một mạch dẫn khi từ thông qua mạch đó biến thiên theo thời gian. Định luật Faraday phát biểu:\n\nFormula: e = -dΦ/dt\n\nChiều của dòng điện cảm ứng được xác định theo Định luật Lenz: Dòng điện cảm ứng xuất hiện có chiều sao cho từ trường do nó sinh ra có tác dụng chống lại sự biến thiên của từ thông đã sinh ra nó."
    }
  },
  math: {
    welcome: "📐 Xin chào! Tôi là Trợ lý Lượng tử phòng Lab Toán. Tôi ở đây để hỗ trợ bạn dựng hình học không gian 3D, tính toán thể tích và khám phá các định lý Euler.",
    suggestions: [
      "Định lý Euler cho đa diện lồi là gì?",
      "Công thức tính thể tích khối cầu và diện tích mặt cầu?",
      "Cách xác định góc giữa đường thẳng và mặt phẳng?"
    ],
    answers: {
      "Định lý Euler cho đa diện lồi là gì?": "Định lý Euler (hay hệ thức Euler) phát biểu rằng đối với bất kỳ đa diện lồi nào, mối quan hệ giữa số đỉnh (Đ), số cạnh (C) và số mặt (M) luôn thỏa mãn công thức hằng số:\n\nFormula: Đ - C + M = 2\n\nVí dụ:\n- Hình lập phương: 8 đỉnh, 12 cạnh, 6 mặt. Ta có: 8 - 12 + 6 = 2.\n- Hình chóp tam giác (tứ diện): 4 đỉnh, 6 cạnh, 4 mặt. Ta có: 4 - 6 + 4 = 2.",
      "Công thức tính thể tích khối cầu và diện tích mặt cầu?": "Với khối cầu có bán kính R:\n\n1. Thể tích khối cầu (V):\nFormula: V = (4/3) * π * R³\n\n2. Diện tích mặt cầu (S):\nFormula: S = 4 * π * R²\n\nTrong đó π ≈ 3.14159.",
      "Cách xác định góc giữa đường thẳng và mặt phẳng?": "Để xác định góc giữa đường thẳng d và mặt phẳng (P):\n1. Tìm giao điểm O của đường thẳng d và mặt phẳng (P).\n2. Lấy một điểm A bất kỳ trên d (A khác O). Dựng hình chiếu vuông góc H của A lên mặt phẳng (P).\n3. Góc giữa đường thẳng d và mặt phẳng (P) chính là góc giữa đường thẳng d và hình chiếu d' của nó trên (P), tức là góc AOH."
    }
  },
  bio: {
    welcome: "🧬 Xin chào! Tôi là Trợ lý Lượng tử phòng Lab Sinh. Hãy để tôi giúp bạn giải mã bản đồ gene di truyền, các quy luật phân ly Men-đen và cấu trúc mạch kép ADN nhé!",
    suggestions: [
      "Quy luật phân ly độc lập của Men-đen là gì?",
      "Cấu trúc cấu tạo của phân tử ADN?",
      "Cách tính tần số alen trong quần thể?"
    ],
    answers: {
      "Quy luật phân ly độc lập của Men-đen là gì?": "Quy luật phân ly độc lập phát biểu rằng các cặp nhân tố di truyền (cặp alen) phân ly độc lập với nhau trong quá trình hình thành giao tử. Điều này xảy ra khi các gen quy định các tính trạng khác nhau nằm trên các cặp nhiễm sắc thể tương đồng khác nhau. Tỷ lệ phân ly kiểu hình ở thế hệ lai F2 khi lai hai bố mẹ thuần chủng khác nhau về hai cặp tính trạng tương phản là 9:3:3:1.",
      "Cấu trúc cấu tạo của phân tử ADN?": "ADN (Axit đêôxiribônuclêic) là phân tử mang thông tin di truyền dưới dạng chuỗi xoắn kép gồm hai mạch polynucleotit song song ngược chiều. \n- Đơn phân là Nucleotit, gồm 4 loại: Adenin (A), Thymin (T), Guanin (G), Cytosin (X).\n- Hai mạch liên kết với nhau theo nguyên tắc bổ sung:\n  + A liên kết với T bằng 2 liên kết Hydro.\n  + G liên kết với X bằng 3 liên kết Hydro.",
      "Cách tính tần số alen trong quần thể?": "Trong một quần thể lưỡng bội cân bằng di truyền Hardy-Weinberg đối với một gen có hai alen A và a:\n- Gọi p là tần số của alen A, q là tần số của alen a (p + q = 1).\n- Tỷ lệ các kiểu gen trong quần thể sẽ tuân theo đẳng thức:\n\nFormula: p² (AA) + 2pq (Aa) + q² (aa) = 1\n\nĐể tính tần số alen A (p) từ số lượng cá thể: p = (2 * số cá thể AA + số cá thể Aa) / (2 * tổng số cá thể)."
    }
  }
};

export default function VirtualLabSandbox({
  subject = 'math',
  title = 'Phòng Thí Nghiệm Ảo',
  code = 'LAB-3D',
  labUrl = '',
  desc = '',
  badgeColor = 'from-cyan-500 to-blue-600'
}) {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const personalization = useAppStore((state) => state.personalization);
  const setActiveLab = useAppStore((state) => state.setActiveLab);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAiCompanion, setShowAiCompanion] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [screenshotFlash, setScreenshotFlash] = useState(false);
  const [showShareConfirm, setShowShareConfirm] = useState(false);
  const [showMolecularViewer, setShowMolecularViewer] = useState(false);
  const [iframeKey, setIframeKey] = useState(() => Date.now());

  const containerRef = useRef(null);
  const iframeRef = useRef(null);

  // Chuẩn hóa mã môn học
  const subjectKey = subject === 'toan' ? 'math' :
                     subject === 'ly' ? 'phys' :
                     subject === 'hoa' ? 'chem' :
                     subject === 'sinh' ? 'bio' : subject;

  const compData = AI_COMPANION_DATA[subjectKey] || AI_COMPANION_DATA.math;

  const normalizeLabUrl = (url) => {
    if (!url) return '';
    const [path, query] = url.split('?');
    const normalizedPath = path.endsWith('/') ? `${path}index.html` : (path.endsWith('.html') ? path : `${path}/index.html`);
    return query ? `${normalizedPath}?${query}` : normalizedPath;
  };

  const [currentSrc, setCurrentSrc] = useState(() => normalizeLabUrl(labUrl));

  useEffect(() => {
    setCurrentSrc(normalizeLabUrl(labUrl));
  }, [labUrl]);

  useEffect(() => {
    // Đăng ký phòng lab hiện tại vào store
    setActiveLab({
      id: subjectKey,
      name: title,
      title: title,
      link: labUrl
    });

    // Khởi tạo tin nhắn chào của AI
    setChatHistory([
      { sender: 'ai', text: compData.welcome, timestamp: new Date() }
    ]);

    return () => {
      setActiveLab(null);
    };
  }, [subjectKey, title, labUrl, setActiveLab]);

  const handleReload = () => {
    playSound.click?.();
    setIframeKey(Date.now());
  };

  const handleToggleFullscreen = () => {
    playSound.click?.();
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleTakeScreenshot = () => {
    playSound.click?.();
    setScreenshotFlash(true);
    setTimeout(() => setScreenshotFlash(false), 300);

    const pendingData = {
      type: 'lab_report',
      subject: subjectKey,
      subjectLabel: title,
      title: `Báo cáo thí nghiệm: ${title}`,
      description: `Đã hoàn thành xuất sắc bài thí nghiệm tại ${title}!`,
      score: 100,
      timestamp: new Date().toISOString(),
      imageUrl: '/bio_stem_cover.png',
      authorName: user?.displayName || 'Học viên',
      authorAvatarFrame: personalization?.avatarFrame || 'default',
      authorTitle: personalization?.activeTitle || 'apprentice'
    };

    savePendingShare(pendingData).then((isSaved) => {
      if (isSaved) {
        localStorage.setItem('daily_quest_lab_done', 'completed');
        setShowShareConfirm(true);
      }
    });
  };

  const [attachedImage, setAttachedImage] = useState(null);
  const fileInputRef = useRef(null);

  // Xử lý dán ảnh từ Clipboard (Ctrl+V) vào Companion AI
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setAttachedImage(reader.result);
          };
          reader.readAsDataURL(file);
          e.preventDefault();
          return;
        }
      }
    }
  };

  const handleSendChatMessage = async (textToSend = '') => {
    const text = textToSend.trim() || chatInput.trim();
    if (!text && !attachedImage) return;
    
    playSound.click?.();
    const currentImg = attachedImage;
    setAttachedImage(null);
    if (!textToSend) setChatInput('');

    const userMsg = { 
      sender: 'user', 
      text: text || 'Phân tích hình ảnh thí nghiệm này và giải đáp chi tiết giúp tôi.', 
      image: currentImg,
      timestamp: new Date() 
    };
    setChatHistory(prev => [...prev, userMsg]);
    setChatLoading(true);

    // Kiểm tra câu trả lời sẵn có nếu không có ảnh
    if (!currentImg && compData.answers && compData.answers[text]) {
      setTimeout(() => {
        setChatHistory(prev => [...prev, { sender: 'ai', text: compData.answers[text], timestamp: new Date() }]);
        setChatLoading(false);
        playSound.success?.();
      }, 500);
      return;
    }

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${text || 'Phân tích hình ảnh này'} [Phòng Lab: ${title}]`,
          systemInstruction: `Bạn là Trợ lý AI Chuyên gia Thí nghiệm ${title} của hệ sinh thái STEM HUB. Hãy giải thích hiện tượng, công thức và bản chất thí nghiệm chuẩn xác SGK Việt Nam. Định dạng công thức chuẩn LaTeX $...$.`,
          imageBase64: currentImg || undefined,
          mimeType: currentImg ? (currentImg.match(/data:([^;]+);/)?.[1] || 'image/jpeg') : undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        const aiText = data.text || data.candidates?.[0]?.content?.parts?.[0]?.text || 'Tôi đã tiếp nhận thông tin từ bạn.';
        setChatHistory(prev => [...prev, { sender: 'ai', text: aiText, timestamp: new Date() }]);
      } else {
        throw new Error('API error');
      }
    } catch (e) {
      // Fallback
      let fallbackText = "Tôi đã ghi nhận câu hỏi của bạn. Hãy thử hỏi lại hoặc chọn câu hỏi gợi ý nhé!";
      if (compData.answers) {
        const keys = Object.keys(compData.answers);
        const matched = keys.find(k => k.toLowerCase().includes(text.toLowerCase()) || text.toLowerCase().includes(k.toLowerCase()));
        if (matched) fallbackText = compData.answers[matched];
      }
      setChatHistory(prev => [...prev, { sender: 'ai', text: fallbackText, timestamp: new Date() }]);
    } finally {
      setChatLoading(false);
      playSound.success?.();
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative flex flex-col w-full h-screen bg-[#0a0b12] text-slate-100 overflow-hidden m-0 p-0 border-none"
    >
      {/* 🚀 MAIN CONTENT: FULLSCREEN IFRAME SANDBOX (EDGE-TO-EDGE) */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-[#0a0b12]">
        {/* Lab Iframe */}
        <div className="flex-1 h-full w-full relative">
          <iframe 
            key={iframeKey}
            ref={iframeRef}
            src={currentSrc}
            className="w-full h-full border-none bg-[#0a0b12]"
            title={title}
            allow="accelerometer; autoplay; camera; microphone; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />

          {/* Flash screen khi chụp ảnh */}
          {screenshotFlash && (
            <div className="absolute inset-0 bg-white z-[99999] animate-[ping_0.3s_ease-in-out_infinite]" />
          )}

          {/* Nút điều khiển HUD góc dưới bên trái */}
          <div className="absolute bottom-6 left-6 z-30 flex items-center gap-2.5 screenshot-hide">
            <button 
              onClick={() => {
                playSound.click?.();
                router.push('/');
              }}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 border border-rose-500/30 text-white rounded-2xl transition-all active:scale-95 flex items-center gap-1.5 shadow-lg shadow-rose-600/30 backdrop-blur-md group cursor-pointer font-sans"
            >
              <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              <span className="text-[11px] font-black uppercase tracking-wider">Về Hub</span>
            </button>

            {/* Nút mở Kính hiển vi 3D phân tử (Hóa học & Sinh học) */}
            {(subjectKey === 'chem' || subjectKey === 'bio') && (
              <button 
                onClick={() => {
                  playSound.click?.();
                  setShowMolecularViewer(true);
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 border border-cyan-400/40 text-white rounded-2xl transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-cyan-500/25 backdrop-blur-md group cursor-pointer font-sans"
              >
                <Dna className="w-4 h-4 text-cyan-200 group-hover:rotate-12 transition-transform duration-300" />
                <span className="text-[11px] font-black uppercase tracking-wider">Kính Hiển Vi 3D Phân Tử</span>
              </button>
            )}
          </div>
        </div>

        {/* AI Companion Drawer */}
        {showAiCompanion && (
          <div className="w-80 md:w-96 h-full bg-[#111422]/98 backdrop-blur-2xl border-l border-slate-800/80 flex flex-col justify-between z-20 shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Header Sidebar */}
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
                <span className="text-xs font-black text-white uppercase tracking-wide">
                  AI Companion — {title}
                </span>
              </div>
              <button 
                onClick={() => setShowAiCompanion(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-left text-xs">
              {chatHistory.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[9px] text-slate-400 mb-1 font-mono">
                    {msg.sender === 'user' ? 'Bạn' : 'Companion AI'}
                  </div>
                  <div className={`p-3 rounded-2xl max-w-[88%] leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-pink-600 text-white rounded-tr-none shadow-md' 
                      : 'bg-slate-800/80 border border-slate-700/60 text-slate-200 rounded-tl-none whitespace-pre-wrap'
                  }`}>
                    {msg.image && (
                      <div className="mb-2 rounded-xl overflow-hidden border border-white/20 max-w-[200px] bg-black/40">
                        <img src={msg.image} alt="Ảnh đính kèm" className="w-full h-auto max-h-36 object-contain" />
                      </div>
                    )}
                    {msg.text}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex flex-col items-start">
                  <div className="text-[9px] text-slate-400 mb-1 font-mono">Companion AI</div>
                  <div className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-2xl rounded-tl-none text-slate-300 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-pink-400" />
                    Đang giải mã dữ liệu thí nghiệm...
                  </div>
                </div>
              )}
            </div>

            {/* Footer Suggestions & Input */}
            <div className="p-3.5 border-t border-slate-800/80 space-y-2.5 bg-[#0e111d] shrink-0">
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-left">Gợi ý nhanh:</p>
                <div className="flex flex-col gap-1">
                  {compData.suggestions?.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendChatMessage(sug)}
                      className="w-full text-[10px] text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 p-1.5 rounded-lg text-left transition-all truncate cursor-pointer"
                    >
                      💡 {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview ảnh đính kèm (Paste qua Ctrl+V hoặc Tải lên) */}
              {attachedImage && (
                <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-pink-500/40 rounded-xl">
                  <img src={attachedImage} alt="Preview" className="w-9 h-9 rounded-lg object-cover border border-pink-400 shrink-0 bg-black/40" />
                  <div className="flex-1 min-w-0 text-[10px] text-pink-300 truncate font-semibold">
                    Đã nhận diện ảnh (Ctrl+V)
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setAttachedImage(null)} 
                    className="p-1 text-rose-400 hover:text-rose-300"
                    title="Xóa ảnh"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChatMessage();
                }}
                className="flex items-center gap-1.5"
              >
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setAttachedImage(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                    e.target.value = '';
                  }}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer shrink-0 ${
                    attachedImage
                      ? 'bg-pink-600/30 border-pink-400 text-pink-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-pink-300'
                  }`}
                  title="Tải lên hoặc dán ảnh (Ctrl+V)"
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                </button>

                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onPaste={handlePaste}
                  placeholder={attachedImage ? "Thêm câu hỏi hoặc Enter để gửi ảnh..." : "Hỏi công thức, dán ảnh Ctrl+V..."}
                  className="flex-1 bg-slate-900/90 border border-slate-700/80 focus:border-pink-500 focus:outline-none rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500"
                />
                <button 
                  type="submit"
                  disabled={(!chatInput.trim() && !attachedImage) || chatLoading}
                  className="p-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Modal xác nhận chia sẻ kết quả Story */}
      {showShareConfirm && (
        <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141828] border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center mx-auto mb-4 text-pink-400">
              <Camera className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-white uppercase tracking-wider">ĐÃ CHỤP ẢNH BÁO CÁO!</h3>
            <p className="text-xs text-slate-300 leading-relaxed mt-2">
              Kết quả thí nghiệm của bạn đã được ghi nhận vào nhật ký học tập. Bạn có muốn đăng lên bảng tin Stories không?
            </p>
            <div className="flex gap-2.5 mt-6">
              <button
                onClick={() => {
                  setShowShareConfirm(false);
                  router.push('/story');
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-pink-500/25 cursor-pointer"
              >
                Đăng lên Story 🚀
              </button>
              <button
                onClick={() => setShowShareConfirm(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3D Molecular Viewer Modal */}
      <MolecularViewerModal
        isOpen={showMolecularViewer}
        onClose={() => setShowMolecularViewer(false)}
        initialCategory={subjectKey === 'bio' ? 'bio' : 'chem'}
      />
    </div>
  );
}
