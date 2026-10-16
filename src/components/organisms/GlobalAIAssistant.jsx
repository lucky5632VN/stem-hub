'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bot, Sparkles, Send, X, Trash2, 
  Compass, Zap, RefreshCw, Cpu, CheckCircle2, MessageSquare, History, ChevronRight,
  Plus, MessageSquarePlus, Clock, ArrowLeft, BookOpen, ExternalLink, Mic, MicOff,
  ShieldAlert, AlertTriangle, Lock, ImagePlus
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { useAudioStore } from '@/store/useAudioStore';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { playSound } from '@/lib/sound';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  retrieveTopK, 
  checkRAGCacheHit, 
  saveLearnedAnswerToRAG, 
  syncGlobalLearnedKnowledge, 
  detectQuerySubject, 
  sanitizeAnswerForStorage,
  containsPersonalOrSystemInfo,
  isGreetingOrChitchat
} from '@/lib/ragService';
import { predictUserIntent } from '@/lib/intentClassifier';
import { retrieveTopKMemories } from '@/lib/memoryService';
import { getAdaptiveDifficultyRecommendation, processInteractionFeedback } from '@/lib/continuousLearningPipeline';
import { formatMathText } from '@/lib/mathFormatter';

// Bộ giải mã chống bot quét chuỗi thô tĩnh trên mã nguồn client
const _d = (s) => (typeof window !== 'undefined' ? window.atob(s) : Buffer.from(s, 'base64').toString('utf-8'));

const BACKUP_ENCRYPTED_KEYS = []; // Đã bảo mật 100% qua Cloudflare Gateway

const GEMINI_API_KEYS = Array.from(new Set([
  process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  ...BACKUP_ENCRYPTED_KEYS.map(_d)
].filter(Boolean)));

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-2.0-flash',
  'gemini-2.5-pro'
];

const LOCAL_STORAGE_KEY = 'stem_hub_global_ai_history';
const LOCAL_STORAGE_SESSIONS = 'stem_hub_global_ai_sessions';

// Component định dạng văn bản câu trả lời AI đẹp mắt, sạch ký tự thô & tạo nút link tổng kiến thức + link tra cứu web
function FormattedAIMessage({ text, onNavigate, onTriggerExpandedAI, isDark = true }) {
  if (!text) return null;

  // Helper render các phần tử vectơ chuẩn JSX & KaTeX HTML với mũi tên → ĐẶT CHÍNH XÁC TRÊN ĐẦU CHỮ (Chuẩn Toán Học 100%)
  const renderTextWithVectorElements = (textStr, partKey) => {
    if (!textStr) return null;
    const vecSplitRegex = /(\[\[VEC:[^\]]+\]\])/g;
    const vecParts = textStr.split(vecSplitRegex);

    return vecParts.map((vPart, vIdx) => {
      const vecMatch = /^\[\[VEC:(.+)\]\]$/.exec(vPart);
      if (vecMatch) {
        const vecName = vecMatch[1];
        return (
          <span
            key={`${partKey}_v_${vIdx}`}
            className="inline-flex flex-col items-center justify-center align-middle mx-[2px] relative group/vec select-none leading-none"
            title={`Vectơ ${vecName}`}
          >
            <span className={`text-[8px] leading-[5px] -mb-[1px] font-sans font-black tracking-tighter transition-transform group-hover/vec:-translate-y-0.5 ${isDark ? 'text-cyan-400' : 'text-pink-600'}`}>
              →
            </span>
            <span className={`text-[12px] leading-none font-bold ${isDark ? 'text-cyan-200' : 'text-pink-950'}`}>{vecName}</span>
          </span>
        );
      }

      const containsHTML = vPart.includes('<span') || vPart.includes('<sub') || vPart.includes('<sup') || vPart.includes('<img');
      if (containsHTML) {
        return (
          <span
            key={`${partKey}_v_${vIdx}`}
            dangerouslySetInnerHTML={{ __html: vPart }}
          />
        );
      }

      return <React.Fragment key={`${partKey}_v_${vIdx}`}>{vPart.replace(/\*/g, '')}</React.Fragment>;
    });
  };

  // 🛡️ YÊU CẦU 2 (CẢNH BÁO THAY VÌ CỐ TRẢ LỜI): Trích xuất Nút Tham Khảo Mở Rộng
  let expandedQuery = null;
  const expandedMatch = text.match(/\[\[BTN_EXPANDED_AI_REPLY:(.*?)\]\]/);
  if (expandedMatch) {
    try {
      expandedQuery = decodeURIComponent(expandedMatch[1]);
    } catch (_) {
      expandedQuery = expandedMatch[1];
    }
  }

  // 🛡️ YÊU CẦU 2 (KHỐI TRÍCH DẪN RÕ RÀNG): Trích xuất thẻ [Nguồn dẫn chứng: ...]
  let citationText = null;
  const citationMatch = text.match(/\[Nguồn dẫn chứng:\s*([^\]]+)\]/i);
  if (citationMatch) {
    citationText = citationMatch[0];
  }

  // Extract explicit [[LINK:Title:URL]]
  const linkMatches = [];
  const linkRegex = /\[\[LINK:(.*?):(.*?)\]\]/g;
  let match;
  let cleanContent = text;

  while ((match = linkRegex.exec(text)) !== null) {
    linkMatches.push({ title: match[1].trim(), url: match[2].trim() });
  }
  cleanContent = cleanContent.replace(/\[\[LINK:.*?:.*?\]\]/g, '').trim();
  cleanContent = cleanContent.replace(/\[\[NAV:.*?\]\]/g, '').replace(/\[\[TOGGLE_THEME\]\]/g, '').trim();
  cleanContent = cleanContent.replace(/\[\[BTN_EXPANDED_AI_REPLY:.*?\]\]/g, '').trim();
  if (citationText) {
    cleanContent = cleanContent.replace(/\[Nguồn dẫn chứng:\s*[^\]]+\]/gi, '').trim();
  }

  // Lọc bỏ triệt để các chuỗi markdown link google rác/lỗi do AI sinh ra (như 📖 Tra cứu...](https://google...))
  cleanContent = cleanContent.replace(/\[?📖?\s*Tra cứu[^\]]*\]\(https?:\/\/[^\)]*google\.com\/search[^\)]*\)/gi, '');
  cleanContent = cleanContent.replace(/📖\s*Tra cứu[^\)]*https?:\/\/[^\)]*google\.com\/search[^\)]*\)?/gi, '');

  // Gộp các dòng link markdown đứng một mình thành một dòng chung ở cuối gạch đầu dòng trước đó
  cleanContent = cleanContent.replace(/(\n\s*)([\-\*\•]\s*)?(\[[^\]]+\]\(https?:\/\/[^)]+\))/g, ' $3');

  // Tự động phát hiện chủ đề môn học để bổ sung Nút Link Tổng Kiến Thức nếu AI chưa chèn
  if (linkMatches.length === 0) {
    const lower = text.toLowerCase();
    if (lower.includes('hóa') || lower.includes('este') || lower.includes('cacbohidrat') || lower.includes('amin') || lower.includes('polime') || lower.includes('kim loại')) {
      linkMatches.push({ title: 'Thư viện & Lab Tổng kiến thức Hóa học THPT', url: '/labs/lab-ktra15p/dist/index.html' });
    } else if (lower.includes('vật lý') || lower.includes('vật lí') || lower.includes('dao động') || lower.includes('sóng') || lower.includes('quang')) {
      linkMatches.push({ title: 'Thư viện & Lab Tổng kiến thức Vật lý THPT', url: '/labs/PhysicsLab/index.html' });
    } else if (lower.includes('sinh học') || lower.includes('adn') || lower.includes('di truyền') || lower.includes('tế bào')) {
      linkMatches.push({ title: 'Thư viện & Lab Tổng kiến thức Sinh học THPT', url: '/labs/lab_sinh/dist/index.html' });
    } else if (lower.includes('toán học') || lower.includes('hàm số') || lower.includes('tích phân') || lower.includes('hình học')) {
      linkMatches.push({ title: 'Thư viện & Lab Tổng kiến thức Toán học THPT', url: '/labs/toan/frontend/dist/index.html' });
    } else if (lower.includes('phòng thi') || lower.includes('luyện đề') || lower.includes('thpt')) {
      linkMatches.push({ title: 'Ngân hàng Đề thi THPT Quốc Gia 2025', url: '/phong-thi' });
    }
  }

  // ĐỊNH DẠNG TOÀN BỘ CÔNG THỨC TOÁN / LÝ / HÓA / SINH (KATEX) TRƯỚC KHI TÁCH DÒNG
  // Giúp các công thức nhiều dòng (\begin{cases}, \stackrel, $$...$$) không bị đứt đoạn hay lỗi cú pháp
  const preformattedContent = formatMathText(cleanContent);
  const lines = preformattedContent.split('\n');

  // Helper để render các đoạn văn bản có chứa [Text](URL), **Bold** hoặc `Code/Math`
  const renderInlineContent = (contentStr, itemKey) => {
    const linkSplitRegex = /(\[[^\]]+\]\([^)]+\))/g;
    const segments = contentStr.split(linkSplitRegex);

    return segments.map((segment, sIdx) => {
      const markdownLinkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(segment);

      if (markdownLinkMatch) {
        const linkTitle = markdownLinkMatch[1];
        const linkUrl = markdownLinkMatch[2];
        const isExternal = linkUrl.startsWith('http') || linkUrl.startsWith('https');

        if (isExternal) {
          // Làm sạch URL nếu có chứa gạch dưới _ rác trong câu lệnh tìm kiếm
          let cleanUrl = linkUrl;
          if (cleanUrl.includes('google.com/search')) {
            cleanUrl = cleanUrl.replace(/_/g, '%20');
          }

          let displayTitle = linkTitle;
          if (!displayTitle.startsWith('📖') && !displayTitle.startsWith('🔍')) {
            displayTitle = `📖 ${displayTitle}`;
          }

          return (
            <a
              key={`${itemKey}_s_${sIdx}`}
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 px-2 py-0.5 ml-1.5 my-0.5 rounded-lg text-[10px] font-mono transition-all no-underline shrink-0 align-middle group/link ${
                isDark
                  ? 'bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 hover:text-white shadow-[0_0_8px_rgba(34,211,238,0.15)]'
                  : 'bg-pink-50/80 hover:bg-pink-100 border border-pink-200/70 text-pink-700 hover:text-pink-900 font-medium'
              }`}
              title={`Tra cứu Google: ${linkTitle}`}
            >
              <span>{displayTitle}</span>
              <ExternalLink className={`w-2.5 h-2.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform ${isDark ? 'text-cyan-400' : 'text-pink-500'}`} />
            </a>
          );
        } else {
          return (
            <button
              key={`${itemKey}_s_${sIdx}`}
              type="button"
              onClick={() => onNavigate(linkUrl)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 mx-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                isDark
                  ? 'bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-400/40 text-indigo-300 hover:text-white'
                  : 'bg-pink-50/80 hover:bg-pink-100 border border-pink-200/70 text-pink-700 font-medium'
              }`}
            >
              <span>{linkTitle}</span>
              <ChevronRight className={`w-3 h-3 ${isDark ? 'text-indigo-400' : 'text-pink-500'}`} />
            </button>
          );
        }
      }

      // Xử lý đính kèm cả **Bold** và `Math/Code`
      const parts = segment.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
      return parts.map((part, pIdx) => {
        const itemSubKey = `${itemKey}_s_${sIdx}_p_${pIdx}`;
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldText = part.slice(2, -2);
          return (
            <strong key={itemSubKey} className={`font-bold ${isDark ? 'text-cyan-300' : 'text-pink-950'}`}>
              {renderTextWithVectorElements(boldText, itemSubKey)}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          const codeContent = part.slice(1, -1);
          return (
            <code
              key={itemSubKey}
              className={`px-1.5 py-0.5 mx-0.5 rounded text-[11px] font-mono border font-semibold inline-block my-0.5 ${
                isDark
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-400/40 shadow-[0_0_8px_rgba(34,211,238,0.15)]'
                  : 'bg-pink-100/80 text-pink-900 border-pink-300/60'
              }`}
            >
              {renderTextWithVectorElements(codeContent, itemSubKey)}
            </code>
          );
        }
        return (
          <span key={itemSubKey} className={isDark ? 'text-[#e4e4e7]' : 'text-pink-900 font-medium'}>
            {renderTextWithVectorElements(part, itemSubKey)}
          </span>
        );
      });
    });
  };



  // Tự động sinh link tra cứu Google dựa theo ĐÚNG TÊN CHỦ ĐỀ HIỂN THỊ TRONG KHUNG CHAT (Loại bỏ số thứ tự rác)
  const getTopicSearchObject = (lineText) => {
    const boldMatch = /\*\*([^*]+)\*\*/.exec(lineText);
    let topic = boldMatch ? boldMatch[1].trim() : '';
    if (!topic && lineText.includes(':')) {
      topic = lineText.split(':')[0].trim();
    }
    if (!topic) {
      topic = lineText.trim();
    }

    // Làm sạch tiêu đề: Loại bỏ ký tự danh sách, thứ tự (1. , 2. , Mục 1: ...)
    topic = topic
      .replace(/^[\*\-\•]\s*/, '')
      .replace(/^(chủ đề|mục|bài|phần)?\s*\d+[\.\:\)]\s*/i, '')
      .replace(/:$/, '')
      .trim();

    const lowerTopic = topic.toLowerCase();
    if (
      topic &&
      topic.length >= 4 &&
      !lowerTopic.includes('lưu ý') &&
      !lowerTopic.includes('hiện tượng') &&
      !lowerTopic.includes('công thức') &&
      !lowerTopic.includes('nova') &&
      !lowerTopic.includes('bạn có thể') &&
      !lowerTopic.includes('điều hướng') &&
      !lowerTopic.includes('tiến trình') &&
      !lowerTopic.includes('học tập') &&
      !lowerTopic.includes('trợ giúp') &&
      !lowerTopic.includes('khu vực')
    ) {
      const cleanTopicName = topic.replace(/_/g, ' ');
      return {
        url: `https://www.google.com/search?q=${encodeURIComponent('Kiến thức ' + cleanTopicName + ' THPT')}`,
        title: `Tra cứu ${cleanTopicName}`
      };
    }
    return null;
  };

  const renderFormattedLine = (line, idx) => {
    let trimmed = line.trim();
    if (!trimmed) return <div key={idx} className="h-1.5" />;

    // Phát hiện đầu dòng dạng danh sách: `* `, `* **`, `- `, `• `, `1. `, `2. `
    const isBullet = /^\s*[\*\-\•]\s+/.test(trimmed) || /^\*\s*\*\*/.test(trimmed) || /^\s*\d+[\.\)]\s+/.test(trimmed);
    if (isBullet) {
      trimmed = trimmed.replace(/^\s*[\*\-\•]\s*/, '').trim();
    }

    if (isBullet) {
      return (
        <div key={idx} className="flex items-start gap-2 my-1.5 pl-1">
          <span className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 animate-pulse ${isDark ? 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]' : 'bg-pink-500'}`} />
          <div className={`flex-1 leading-relaxed ${isDark ? 'text-[#e4e4e7]' : 'text-pink-900 font-medium'}`}>
            {renderInlineContent(trimmed, `line_${idx}`)}
          </div>
        </div>
      );
    }

    return (
      <div key={idx} className={`leading-relaxed my-0.5 ${isDark ? 'text-[#e4e4e7]' : 'text-pink-900 font-medium'}`}>
        {renderInlineContent(trimmed, `line_${idx}`)}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {lines.map((line, idx) => renderFormattedLine(line, idx))}

      {/* Render Nút Link Tổng Kiến Thức Nổi Bật */}
      {linkMatches.map((link, lIdx) => (
        <button
          key={lIdx}
          type="button"
          onClick={() => onNavigate(link.url)}
          className={`mt-3 w-full px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 backdrop-blur-md transition-all duration-300 active:scale-98 cursor-pointer group ${
            isDark
              ? 'bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-400/40 hover:border-cyan-300 text-cyan-200 hover:text-white shadow-[0_0_18px_rgba(34,211,238,0.2)]'
              : 'bg-pink-50/80 hover:bg-pink-100/90 border border-pink-200/80 text-pink-950 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform ${
              isDark ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-300' : 'bg-pink-100 border border-pink-200 text-pink-600'
            }`}>
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <span className={`truncate font-semibold ${isDark ? 'text-cyan-100 group-hover:text-white' : 'text-pink-950'}`}>{link.title}</span>
          </div>
          <div className={`flex items-center gap-1 text-[10px] font-mono shrink-0 group-hover:translate-x-1 transition-transform ${
            isDark ? 'text-cyan-400' : 'text-pink-600 font-bold'
          }`}>
            <span>Khám phá ngay</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>
      ))}

      {/* 🛡️ YÊU CẦU 2 (KHỐI TRÍCH DẪN RÕ RÀNG SGK CHUẨN) */}
      {citationText && (
        <div className={`mt-3.5 p-3 rounded-2xl border text-xs font-mono flex items-start gap-2.5 shadow-sm ${
          isDark
            ? 'bg-emerald-500/10 border-emerald-400/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
            : 'bg-emerald-50 border-emerald-300 text-emerald-900'
        }`}>
          <BookOpen className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold block tracking-wider uppercase text-[10px] text-emerald-400">
              CĂN CỨ HỌC LIỆU BẮT BUỘC
            </span>
            <span className="font-semibold">{citationText}</span>
          </div>
        </div>
      )}

      {/* 🛡️ YÊU CẦU 2 (CẢNH BÁO THAY VÌ CỐ TRẢ LỜI & STRICT GROUNDING ABSTENTION) */}
      {expandedQuery && (
        <div className={`mt-3.5 p-4 rounded-2xl border space-y-3 shadow-md ${
          isDark
            ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
            : 'bg-amber-50 border-amber-300 text-amber-950'
        }`}>
          <div className="flex items-start gap-2.5">
            <span className="text-xl shrink-0">⚠️</span>
            <div className="text-xs leading-relaxed font-sans">
              <strong className="text-amber-300 font-bold block mb-1">
                ⚠️ CẢNH BÁO THIẾU CĂN CỨ (STRICT GROUNDING ABSTENTION):
              </strong>
              Câu hỏi nằm ngoài phạm vi kho ngữ liệu Sách giáo khoa chuẩn hiện có. Hệ thống tạm dừng trả lời tự động để tránh sai lệch kiến thức.
            </div>
          </div>
          <button
            type="button"
            onClick={() => onTriggerExpandedAI && onTriggerExpandedAI(expandedQuery)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-mono font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
          >
            <span>[Vẫn xem gợi ý tham khảo mở rộng từ AI]</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function GlobalAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('✨ NOVA đang kết nối ma trận dữ liệu lượng tử...');
  const [lastInteractionTime, setLastInteractionTime] = useState(() => Date.now());
  const [attachedImage, setAttachedImage] = useState(null);
  const fileInputRef = useRef(null);

  // Xử lý dán ảnh từ Clipboard (Ctrl+V) vào ô chat NOVA AI
  const handlePaste = useCallback((e) => {
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
  }, []);

  // Trạng thái suy nghĩ thông minh linh hoạt theo chủ đề người dùng đang hỏi cho NOVA
  const getContextualLoadingText = (userQuery) => {
    if (!userQuery) return '✨ NOVA đang kết nối ma trận dữ liệu lượng tử...';
    const q = userQuery.toLowerCase();

    if (
      q.includes('toán') || q.includes('toan') || 
      q.includes('hàm số') || q.includes('ham so') || 
      q.includes('đạo hàm') || q.includes('dao ham') || 
      q.includes('tích phân') || q.includes('tich phan') || 
      q.includes('logarit') || q.includes('oxyz') || 
      q.includes('phương trình') || q.includes('phuong trinh') || 
      q.includes('hình học') || q.includes('hinh hoc') ||
      q.includes('nguyên hàm') || q.includes('nguyen ham')
    ) {
      return '📐 NOVA đang giải mã phương trình & không gian Toán học...';
    }

    if (
      q.includes('vật lý') || q.includes('vat ly') || 
      q.includes('vật lí') || q.includes('vat li') || 
      q.includes('dao động') || q.includes('dao dong') || 
      q.includes('sóng') || q.includes('song') || 
      q.includes('xoay chiều') || q.includes('xoay chieu') || 
      q.includes('điện') || q.includes('động lực')
    ) {
      return '⚡ NOVA đang tính toán động lực học & phương trình Vật lý...';
    }

    if (
      q.includes('hóa') || q.includes('hoa') || 
      q.includes('este') || q.includes('axit') || 
      q.includes('bazơ') || q.includes('bazo') || 
      q.includes('phản ứng') || q.includes('phan ung') || 
      q.includes('mol') || q.includes('nồng độ ph') || q.includes('độ ph') || 
      q.includes('nguyên tử') || q.includes('hóa học')
    ) {
      return '🧪 NOVA đang phân tích ma trận phản ứng Hóa học...';
    }

    if (
      q.includes('sinh') || q.includes('adn') || q.includes('arn') || 
      q.includes('di truyền') || q.includes('di truyen') || 
      q.includes('tế bào') || q.includes('te bao') || 
      q.includes('gen') || q.includes('màng')
    ) {
      return '🧬 NOVA đang quét chuỗi gen & cơ chế Sinh học...';
    }

    if (
      q.includes('đấu trường') || q.includes('dau truong') || 
      q.includes('pvp') || q.includes('thách đấu') || q.includes('thach dau') || 
      q.includes('thẻ bài') || q.includes('elo')
    ) {
      return '⚔️ NOVA đang phân tích chiến thuật & chỉ số Đấu trường...';
    }

    if (
      q.includes('phòng thi') || q.includes('phong thi') || 
      q.includes('đề thi') || q.includes('de thi') || 
      q.includes('thpt') || q.includes('luyện đề') || q.includes('luyen de')
    ) {
      return '🚀 NOVA đang quét ngân hàng đề thi THPT Quốc Gia...';
    }

    if (
      q.includes('hồ sơ') || q.includes('ho so') || 
      q.includes('danh hiệu') || q.includes('avatar') || q.includes('chibi')
    ) {
      return '🏆 NOVA đang kiểm tra hồ sơ & bộ sưu tập danh hiệu...';
    }

    const generalOptions = [
      '✨ NOVA đang kết nối ma trận dữ liệu lượng tử...',
      '🌀 NOVA đang giải mã kho tri thức STEM HUB...',
      '⚡ NOVA đang tổng hợp dữ liệu phản ứng siêu không gian...',
      '💡 NOVA đang nạp trí tuệ nhân tạo chuyên sâu...'
    ];
    return generalOptions[Math.floor(Math.random() * generalOptions.length)];
  };

  // Khai báo quản lý phiên chat & lịch sử hội thoại
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(() => 'session_' + Date.now());
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  // Quản lý Nhận diện giọng nói Tiếng Việt sang Văn bản (Speech Recognition STT)
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Đồng bộ Tri thức AI tự học toàn hệ thống từ Server DB
      syncGlobalLearnedKnowledge().catch(() => {});

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'vi-VN';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event) => {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript;
          if (transcript) {
            setInput(transcript);
          }
        };

        recognition.onerror = (event) => {
          console.warn('Lỗi nhận diện giọng nói:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Trình duyệt của bạn chưa hỗ trợ tính năng Nhận diện Giọng nói. Hãy dùng Google Chrome hoặc Microsoft Edge!');
      return;
    }

    if (isListening) {
      try { recognitionRef.current.stop(); } catch (_) {}
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Không thể kích hoạt Micro:', err);
        setIsListening(false);
      }
    }
  };

  const chatEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const pathname = usePathname();
  // Nút nổi NOVA AI hiển thị ở Trang chủ (Trang 'Danh mục phòng lab' chính trong Sidebar href: '/') và trang /phong-lab.
  // Khi học sinh vào bên trong các phòng lab cụ thể (/phong-lab/toan, /phong-lab/ly...) hoặc các màn khác, nút nổi ẩn đi để tránh vướng, dùng phím tắt Ctrl+K/Cmd+K để bật.
  const isHomeOrLabDirectory = !pathname || pathname === '/' || pathname === '/phong-lab' || pathname === '/phong-lab/';
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark'; // Tự động đồng bộ chuẩn 100% với màu nền website (Sáng / Tối)

  const user = useAppStore((state) => state.user);
  const openAuth = useAppStore((state) => state.openAuth);
  const { currentUser, loading: authLoading } = useAuth();
  const [authBlockedToast, setAuthBlockedToast] = useState(false);
  const personalization = useAppStore((state) => state.personalization);
  const activeLab = useAppStore((state) => state.activeLab);
  const setActiveLab = useAppStore((state) => state.setActiveLab);
  const arenaState = useAppStore((state) => state.arenaState);
  const subjectFrequency = useAppStore((state) => state.subjectFrequency);
  const conciseMode = useAppStore((state) => state.conciseMode);
  const incrementSubjectFrequency = useAppStore((state) => state.incrementSubjectFrequency);
  const recordFeedback = useAppStore((state) => state.recordFeedback);

  // State thông báo cảnh báo tính công bằng học thuật
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningReason, setWarningReason] = useState('');

  // Hàm kiểm tra xem người dùng có đang thi đấu hoặc luyện tập không
  const isMatchOrPracticeActive = useCallback(() => {
    if (typeof window === 'undefined') return { active: false, reason: '' };

    const isArenaRoute = pathname?.includes('/dau-truong');
    const isExamRoute = pathname?.includes('/phong-thi');

    if (isArenaRoute) {
      if (arenaState?.status === 'playing' || arenaState?.status === 'matching' || arenaState?.status === 'equipment') {
        return {
          active: true,
          reason: 'Đang tham gia trận đấu hoặc chuẩn bị trong Đấu trường 1v1'
        };
      }

      if (window.__STEM_HUB_IS_MATCH_ACTIVE) {
        return { active: true, reason: 'Đang thi đấu trận 1v1 trực tiếp' };
      }
      if (window.__STEM_HUB_IS_PRACTICE_ACTIVE) {
        return { active: true, reason: 'Đang trong Chế độ Luyện tập Đấu trường' };
      }

      const urlParams = new URLSearchParams(window.location.search);
      const modeParam = urlParams.get('mode');
      if (modeParam === 'practice' || modeParam === 'luyen-tap') {
        return { active: true, reason: 'Đang trong Chế độ Luyện tập Đấu trường' };
      }
      if (urlParams.get('roomId') || modeParam === 'match') {
        return { active: true, reason: 'Đang thi đấu trận 1v1 trực tiếp' };
      }

      const hasGameInterface = document.querySelector(
        '.arena-active-match, [data-arena-active="true"], .arena-game-screen, .arena-practice-active, .arena-question-card, .arena-timer'
      );
      if (hasGameInterface) {
        return { active: true, reason: 'Đang trong giao diện thi đấu hoặc luyện tập Đấu trường' };
      }

      const bodyText = document.body?.innerText || '';
      if (
        bodyText.includes('THỜI GIAN CÒN') ||
        bodyText.includes('GIAI ĐOẠN CHUẨN BỊ CHIẾN THUẬT') ||
        bodyText.includes('CHẾ ĐỘ LUYỆN TẬP') ||
        bodyText.includes('PHÒNG LUYỆN TẬP') ||
        bodyText.includes('LUYỆN TẬP TỰ DO') ||
        bodyText.includes('OPPONENT TRACKER') ||
        bodyText.includes('COHERENT SIGNAL') ||
        bodyText.includes('Luyện tập bài tập') ||
        bodyText.includes('ĐÀO TẠO THI ĐẤU') ||
        bodyText.includes('TRANG BỊ CHIÊU THỨC TRONG TRẬN')
      ) {
        return { active: true, reason: 'Đang trong Chế độ Luyện tập / Thi đấu 1v1' };
      }
    }

    if (isExamRoute) {
      const urlParams = new URLSearchParams(window.location.search);
      const modeParam = urlParams.get('mode');
      if (modeParam === 'exam' || modeParam === 'practice' || urlParams.get('examId')) {
        return { active: true, reason: 'Đang trong bài thi / làm đề luyện tập' };
      }

      const hasActiveExamDOM = document.querySelector('.exam-active-session, .exam-timer');
      if (hasActiveExamDOM) {
        return { active: true, reason: 'Đang tính giờ làm bài thi thực chiến' };
      }

      const bodyText = document.body?.innerText || '';
      if (bodyText.includes('THỜI GIAN CÒN LẠI') || bodyText.includes('NỘP BÀI THI')) {
        return { active: true, reason: 'Đang tính giờ làm bài thi thực chiến' };
      }
    }

    return { active: false, reason: '' };
  }, [pathname, arenaState?.status]);

  // Hàm mở HUD có kiểm tra xác thực người dùng (Layer 2 Client-Side Gating) và tính công bằng
  const handleOpenHUD = useCallback(() => {
    // 1. Kiểm tra trạng thái Auth
    if (authLoading) {
      // Đang trong quá trình nạp thông tin Auth ban đầu, không chặn nhầm
      return;
    }

    if (!currentUser) {
      try { playSound.hover?.() || playSound.click?.(); } catch (_) {}
      setAuthBlockedToast(true);
      console.log('[Client-Side Gating] 🔒 Chặn mở Chatbot AI: Chưa đăng nhập (!currentUser).');
      if (isOpen) setIsOpen(false);
      setTimeout(() => setAuthBlockedToast(false), 4000);
      return; // Chặn tuyệt đối không cho mở cửa sổ, không nạp Gemini
    }

    console.log('[Client-Side Gating] ✅ Xác thực người dùng thành công! Trợ lý AI NOVA đã sẵn sàng.');

    // 2. Kiểm tra tính công bằng học thuật khi thi đấu / luyện tập
    const check = isMatchOrPracticeActive();
    if (check.active) {
      try { playSound.hover?.() || playSound.click?.(); } catch (_) {}
      setWarningReason(check.reason);
      setShowWarningModal(true);
      if (isOpen) setIsOpen(false);
      return;
    }

    try { playSound.click(); } catch (_) {}
    setIsOpen(true);
  }, [authLoading, currentUser, isMatchOrPracticeActive, isOpen]);

  // Tự động đóng HUD nếu người dùng bắt đầu trận đấu hoặc luyện tập khi HUD đang mở
  useEffect(() => {
    if (isOpen) {
      const check = isMatchOrPracticeActive();
      if (check.active) {
        try { window.speechSynthesis?.cancel(); } catch (_) {}
        setIsOpen(false);
        setWarningReason(check.reason);
        setShowWarningModal(true);
      }
    }
  }, [isOpen, isMatchOrPracticeActive]);

  // Auto scroll to latest message
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: behavior
      });
    }
    chatEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Tự động cuộn xuống tin nhắn mới nhất chỉ khi MỞ HUD hoặc chuyển từ Drawer quay lại khung chat
  useEffect(() => {
    if (isOpen && !showHistoryDrawer) {
      scrollToBottom('auto');
      const timer1 = setTimeout(() => scrollToBottom('auto'), 50);
      const timer2 = setTimeout(() => scrollToBottom('smooth'), 250);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isOpen, showHistoryDrawer, scrollToBottom]);

  // Khôi phục danh sách các phiên chat cũ (Sessions) từ localStorage
  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem(LOCAL_STORAGE_SESSIONS);
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed)) {
          setSessions(parsed);
        }
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách phiên chat:', err);
    }
  }, []);

  // Khi RESET / TẢI LẠI TRANG: Tự động khởi tạo phiên Chat Mới
  useEffect(() => {
    const newSessionId = 'session_' + Date.now();
    setCurrentSessionId(newSessionId);

    const welcomeMsg = {
      id: 'welcome_' + Date.now(),
      sender: 'bot',
      text: `Hệ thống hỗ trợ học tập & tra cứu công thức Toán - Lý - Hóa - Sinh THPT. Nhập câu hỏi để nhận giải đáp tóm tắt kèm công thức chuẩn xác.`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([welcomeMsg]);
  }, [user, personalization?.name]);

  // Global hotkey Ctrl+K (hoặc Cmd+K trên macOS) hoặc Alt+A để bật/tắt AI Assistant ở mọi trang
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === 'k') || (e.altKey && e.key?.toLowerCase() === 'a')) {
        e.preventDefault();
        if (isOpen) {
          try { window.speechSynthesis?.cancel(); } catch (_) {}
          setIsOpen(false);
          try { playSound.click(); } catch (_) {}
        } else {
          handleOpenHUD();
        }
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        try { window.speechSynthesis?.cancel(); } catch (_) {}
        setIsOpen(false);
        try { playSound.click(); } catch (_) {}
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleOpenHUD]);

  // Lưu phiên chat hiện tại vào bộ nhớ danh sách các phiên (Sessions)
  const saveCurrentSession = useCallback((newMessages, sessionId = currentSessionId) => {
    try {
      const userMsgs = newMessages.filter(m => m.sender === 'user');
      if (userMsgs.length === 0) return;

      const firstMsgText = userMsgs[0].text;
      const title = firstMsgText.length > 30 ? firstMsgText.substring(0, 30) + '...' : firstMsgText;
      const dateStr = new Date().toLocaleString('vi-VN', { 
        hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' 
      });

      setSessions((prevSessions) => {
        const existingIdx = prevSessions.findIndex(s => s.id === sessionId);
        const sessionObj = {
          id: sessionId,
          title: title,
          date: dateStr,
          messages: newMessages
        };

        let nextSessions = [...prevSessions];
        if (existingIdx >= 0) {
          nextSessions[existingIdx] = sessionObj;
        } else {
          nextSessions.unshift(sessionObj);
        }

        if (nextSessions.length > 25) nextSessions = nextSessions.slice(0, 25);

        try {
          localStorage.setItem(LOCAL_STORAGE_SESSIONS, JSON.stringify(nextSessions));
        } catch (_) {}

        return nextSessions;
      });
    } catch (err) {
      console.warn('Lỗi lưu phiên chat:', err);
    }
  }, [currentSessionId]);

  // Tạo đoạn chat mới (+ Chat mới)
  const handleStartNewChat = () => {
    try { playSound.click(); } catch (_) {}

    const newId = 'session_' + Date.now();
    setCurrentSessionId(newId);

    const welcomeText = `Phiên tra cứu mới đã sẵn sàng. Nhập câu hỏi hoặc bài tập để nhận lời giải tóm tắt kèm công thức chuẩn.`;
    const welcomeMsg = {
      id: 'welcome_' + Date.now(),
      sender: 'bot',
      text: welcomeText,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([welcomeMsg]);
    setShowHistoryDrawer(false);

    setTimeout(() => scrollToBottom('auto'), 50);
  };

  // Chọn mở phiên chat cũ từ danh sách lịch sử
  const handleSelectSession = (session) => {
    try { playSound.click(); } catch (_) {}
    setCurrentSessionId(session.id);
    setMessages(session.messages || []);
    setShowHistoryDrawer(false);
    setTimeout(() => scrollToBottom('auto'), 80);
  };

  // Xóa một phiên chat cụ thể khỏi lịch sử
  const handleDeleteSession = (sessionId, e) => {
    e.stopPropagation();
    try { playSound.click(); } catch (_) {}

    setSessions((prev) => {
      const filtered = prev.filter(s => s.id !== sessionId);
      try {
        localStorage.setItem(LOCAL_STORAGE_SESSIONS, JSON.stringify(filtered));
      } catch (_) {}
      return filtered;
    });

    if (sessionId === currentSessionId) {
      handleStartNewChat();
    }
  };

  // Khai phá tri thức từ các phiên chat cũ để nạp vào bộ nhớ học hỏi AI (Chỉ tham khảo ngầm, không lặp lại)
  const getCrossSessionMemoryContext = useCallback(() => {
    if (!sessions || sessions.length === 0) return '';
    const userTopics = sessions
      .flatMap(s => s.messages || [])
      .filter(m => m.sender === 'user')
      .map(m => (m.text || '').substring(0, 35).trim())
      .filter(t => t && !isGreetingOrChitchat(t) && !containsPersonalOrSystemInfo(t))
      .slice(0, 5);

    if (userTopics.length === 0) return '';
    return `\n[BỐI CẢNH CHỦ ĐỀ HỌC SINH ĐANG QUAN TÂM (CHỈ THAM KHẢO NGẦM ĐỂ ĐIỀU CHỈNH BÀI HỌC, TUYỆT ĐỐI KHÔNG ĐỌC LẠI RA CÂU TRẢ LỜI)]: ${userTopics.join('; ')}`;
  }, [sessions]);

  // Human-readable page name generator for AI Context
  const getPageContextLabel = () => {
    if (activeLab) return `Phòng thí nghiệm ảo: ${activeLab.name || activeLab.title}`;
    if (pathname === '/') return 'Trang chủ STEM HUB (Tổng quan phòng lab)';
    if (pathname?.startsWith('/phong-thi')) return 'Phòng thi Luyện đề THPT Quốc Gia MoET 2025';
    if (pathname?.startsWith('/dau-truong')) return 'Đấu Trường Sinh Tử 1v1 PvP';
    if (pathname?.startsWith('/story')) return 'Mạng xã hội Học thuật Story';
    if (pathname?.startsWith('/ho-so')) return 'Hồ Sơ Danh Vọng & Trang bị Chibi';
    if (pathname?.startsWith('/xep-hang')) return 'Bảng Xếp Hạng Cao Thủ';
    return `Đang duyệt trang: ${pathname}`;
  };

  // Bộ Chuẩn Hóa Tự Động Ký Tự Khoa Học & Công Thức Toán/Hóa (Scientific Formula Sanitizer Engine)
  const sanitizeScientificText = (str) => {
    if (!str) return '';
    let s = str;

    // 1. Chuyển đổi ký tự LaTeX thô sang Unicode
    s = s.replace(/\\rightarrow/g, '→');
    s = s.replace(/\\Delta/g, 'Δ');
    s = s.replace(/\\alpha/g, 'α');
    s = s.replace(/\\beta/g, 'β');
    s = s.replace(/\\gamma/g, 'γ');
    s = s.replace(/\\pi/g, 'π');
    s = s.replace(/\\sqrt/g, '√');
    s = s.replace(/\\cdot/g, '·');
    s = s.replace(/\\le/g, '≤');
    s = s.replace(/\\ge/g, '≥');
    s = s.replace(/\\neq/g, '≠');
    s = s.replace(/\\approx/g, '≈');

    // 2. Chuyển đổi $ công thức $ của LaTeX
    s = s.replace(/\$([^\$]+)\$/g, '$1');

    // 3. Bảng ánh xạ Chỉ số dưới (Subscript) & Chỉ số trên (Superscript)
    const subscriptMap = {
      '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
      '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
      'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ',
      'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ',
      'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ',
      'v': 'ᵥ', 'x': 'ₓ', 'A': 'ₐ', 'M': 'ₘ', 'N': 'ₙ'
    };

    const superscriptMap = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
      '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
      '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
      'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ', 'y': 'ʸ'
    };

    // Tự động sửa 10^3 hoặc 10²3 thành 10²³ nếu nằm trong bối cảnh Avogadro / hạt mol
    s = s.replace(/10\^3\b/g, '10²³');
    s = s.replace(/10\^23/g, '10²³');
    s = s.replace(/10²3\b/g, '10²³');

    // Tự động chuyển Dấu gạch dưới C_M, N_A, H_2O, CO_2 -> Cₘ, Nₐ, H₂O, CO₂
    s = s.replace(/([A-Za-z0-9\)])_([0-9a-zA-Z]{1,3})/g, (_, base, sub) => {
      const subConverted = sub.split('').map(char => subscriptMap[char] || char).join('');
      return `${base}${subConverted}`;
    });

    // Tự động chuyển Mũ x^2, 10^-3, a^n -> x², 10⁻³, aⁿ
    s = s.replace(/([A-Za-z0-9\)])\^([\+\-]?[0-9a-zA-Z]{1,4})/g, (_, base, sup) => {
      const supConverted = sup.split('').map(char => superscriptMap[char] || char).join('');
      return `${base}${supConverted}`;
    });

    return s;
  };

  // Process system commands returned by AI (Agentic function calling)
  const processAgentCommands = (text) => {
    let cleanText = text;

    if (cleanText.includes('[[TOGGLE_THEME]]')) {
      setTheme(theme === 'dark' ? 'light' : 'dark');
      cleanText = cleanText.replace(/\[\[TOGGLE_THEME\]\]/g, '');
    }

    if (cleanText.includes('[[AUDIO_PLAY_LOFI]]')) {
      useAudioStore.getState().setGenre('lofi');
      cleanText = cleanText.replace(/\[\[AUDIO_PLAY_LOFI\]\]/g, '');
    }
    if (cleanText.includes('[[AUDIO_PLAY_SCIFI]]')) {
      useAudioStore.getState().setGenre('scifi');
      cleanText = cleanText.replace(/\[\[AUDIO_PLAY_SCIFI\]\]/g, '');
    }
    if (cleanText.includes('[[AUDIO_PLAY_BRAINWAVE]]')) {
      useAudioStore.getState().setGenre('brainwave');
      cleanText = cleanText.replace(/\[\[AUDIO_PLAY_BRAINWAVE\]\]/g, '');
    }
    if (cleanText.includes('[[AUDIO_PAUSE]]')) {
      useAudioStore.getState().pause();
      cleanText = cleanText.replace(/\[\[AUDIO_PAUSE\]\]/g, '');
    }
    if (cleanText.includes('[[AUDIO_NEXT]]')) {
      useAudioStore.getState().nextTrack();
      cleanText = cleanText.replace(/\[\[AUDIO_NEXT\]\]/g, '');
    }

    const navMatch = cleanText.match(/\[\[NAV:(.*?)\]\]/);
    if (navMatch && navMatch[1]) {
      const targetUrl = navMatch[1].trim();
      cleanText = cleanText.replace(/\[\[NAV:.*?\]\]/g, '');
      
      setTimeout(() => {
        if (targetUrl.includes('/labs/')) {
          setActiveLab({ link: targetUrl, name: 'Phòng lab ảo' });
          if (pathname !== '/') {
            router.push('/');
          }
        } else {
          setActiveLab(null);
          router.push(targetUrl);
        }
      }, 50);
    }

    // Tự động lọc và chuẩn hóa toàn bộ công thức Toán/Hóa/Lý trước khi render ra màn hình
    cleanText = sanitizeScientificText(cleanText);

    return cleanText.trim();
  };

  const generateOfflineFallbackResponse = (query, userDisplayName) => {
    const q = query.toLowerCase().trim();

    // RAG Semantic Vector Search Integration
    const ragResults = retrieveTopK(query, 3);
    if (ragResults && ragResults.length > 0 && ragResults[0].score >= 0.12) {
      const top = ragResults[0];
      const subjectLabLinks = {
        hoa: '/labs/lab-ktra15p/dist/index.html',
        ly: '/labs/PhysicsLab/index.html',
        sinh: '/labs/lab_sinh/dist/index.html',
        toan: '/labs/toan/frontend/dist/index.html'
      };
      const linkUrl = subjectLabLinks[top.subject] || '/labs/lab-ktra15p/dist/index.html';
      const subjectName = top.subject.toUpperCase();
      return processAgentCommands(`🧠 **[RAG Vector Search - ${subjectName}]** ${top.topic}:
${top.content}

[[LINK:Thư viện & Lab Tổng kiến thức ${subjectName} THPT:${linkUrl}]]`);
    }

    if (q.includes('bật nhạc') || q.includes('mở nhạc') || q.includes('phát nhạc') || q.includes('bật lofi') || q.includes('mở lofi')) {
      if (q.includes('scifi') || q.includes('sci-fi') || q.includes('vũ trụ')) {
        return processAgentCommands(`🚀 JAVIT đã bật **Nhạc Sci-Fi Cyberpunk Ambient** cho bạn! [[AUDIO_PLAY_SCIFI]]`);
      }
      if (q.includes('sóng não') || q.includes('alpha') || q.includes('tư duy')) {
        return processAgentCommands(`🧠 JAVIT đã bật **Nhạc Sóng Não Alpha 10Hz** giúp bạn tập trung tư duy chuyên sâu! [[AUDIO_PLAY_BRAINWAVE]]`);
      }
      return processAgentCommands(`🎧 JAVIT đã bật **Nhạc Lo-Fi Học Bài** thư giãn cho ${userDisplayName}. Chúc bạn tập trung học tốt! [[AUDIO_PLAY_LOFI]]`);
    }

    if (q.includes('tắt nhạc') || q.includes('dừng nhạc') || q.includes('ngừng phát nhạc') || q.includes('tạm dừng nhạc')) {
      return processAgentCommands(`🔇 JAVIT đã tạm dừng trình phát nhạc. [[AUDIO_PAUSE]]`);
    }

    if (q.includes('chuyển bài') || q.includes('bài tiếp theo') || q.includes('đổi bài')) {
      return processAgentCommands(`⏭️ JAVIT đã chuyển sang bài nhạc tiếp theo. [[AUDIO_NEXT]]`);
    }

    if (q === '1+1' || q === '1 + 1') {
      return processAgentCommands(`Chào ${userDisplayName}, **1 + 1 = 2**. JAVIT luôn sẵn sàng hỗ trợ các bài toán phức tạp hơn! [[LINK:Thư viện & Lab Tổng kiến thức Toán học THPT:/labs/toan/frontend/dist/index.html]]`);
    }

    if (q.includes('nhận biết khí') || q.includes('thử khí') || q.includes('thí nghiệm khí')) {
      return processAgentCommands(`🧪 **Bảng Thử & Nhận Biết Các Khí Trong Phòng Thí Nghiệm Hóa Học**:
• **Khí Hiđrô (H₂)**: Đưa tàn đốm cháy vào miệng ống nghiệm → Tiếng nổ "pop" dứt khoát (2H₂ + O₂ → 2H₂O).
• **Khí Oxi (O₂)**: Que đốm còn tàn đỏ bùng cháy rực sáng trở lại.
• **Khí Cacbon Đioxit (CO₂)**: Dập tắt que đốm đang cháy. Sục vào nước vôi trong Ca(OH)₂ làm đục nước vôi (CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O).
• **Khí Clo (Cl₂)**: Vàng lục, mùi hắc xốc, làm mất màu giấy quỳ ẩm hoặc làm xanh giấy thử hồ tinh bột-KI (Cl₂ + 2KI → 2KCl + I₂).
• **Khí Amoniac (NH₃)**: Mùi khai xốc, làm quỳ đỏ ẩm hóa xanh, tạo khói trắng NH₄Cl với đũa thủy tinh chấm axit HCl đặc.
• **Khí Lưu huỳnh Đioxit (SO₂)**: Mùi hắc diêm sinh, làm mất màu dung dịch Nước Brom hoặc Thuốc tím (SO₂ + Br₂ + 2H₂O → H₂SO₄ + 2HBr).

[[LINK:Thư viện & Lab Tổng kiến thức Hóa học THPT:/labs/lab-ktra15p/dist/index.html]]`);
    }

    if (q.includes('nhận biết ion') || q.includes('cation') || q.includes('anion') || q.includes('thử ngọn lửa')) {
      return processAgentCommands(`🧪 **Bảng Nhận Biết Cation & Anion Chuẩn Phòng Thử Nghiệm**:
• **Li⁺, Na⁺, K⁺**: Thử ngọn lửa Pt → Li⁺ (đỏ tía), Na⁺ (vàng cam chói), K⁺ (tím nhạt qua kính cobalt).
• **NH₄⁺**: Đun nhẹ với NaOH → Giải phóng khí NH₃ mùi khai làm quỳ ẩm hóa xanh (NH₄⁺ + OH⁻ → NH₃↑ + H₂O).
• **Cu²⁺**: Nhỏ NaOH → Tủa xanh lam Cu(OH)₂; Tan trong NH₃ dư thành dung dịch phức [Cu(NH₃)₄]²⁺ xanh thẫm.
• **Fe²⁺ / Fe³⁺**: Fe²⁺ tạo tủa trắng xanh Fe(OH)₂ bị hóa nâu ngoài không khí; Fe³⁺ tạo tủa nâu đỏ Fe(OH)₃ hoặc đỏ máu với KSCN.
• **Al³⁺ / Zn³⁺**: Tạo tủa keo Al(OH)₃ / Zn(OH)₂ tan được trong kiềm dư (tính chất lưỡng tính).
• **Cl⁻ / Br⁻ / I⁻**: Nhỏ AgNO₃ → AgCl (trắng), AgBr (vàng nhạt), AgI (vàng đậm).
• **SO₄²⁻**: Nhỏ BaCl₂ trong môi trường axit HCl → Kết tủa trắng BaSO₄ không tan trong axit.

[[LINK:Thư viện & Lab Tổng kiến thức Hóa học THPT:/labs/lab-ktra15p/dist/index.html]]`);
    }

    if (q.includes('lưỡng tính') || q.includes('luong tinh') || q.includes('al(oh)3') || q.includes('zn(oh)2')) {
      return processAgentCommands(`🧪 **Chuyên Đề Các Hợp Chất Lưỡng Tính (Vô cơ & Hữu cơ)**:
• **Hiđroxit lưỡng tính**: Al(OH)₃, Zn(OH)₂, Cr(OH)₃, Pb(OH)₂ (vừa tan trong axit mạnh, vừa tan trong bazơ mạnh).
  - Al(OH)₃ + 3HCl → AlCl₃ + 3H₂O
  - Al(OH)₃ + NaOH → NaAlO₂ + 2H₂O
• **Oxit lưỡng tính**: Al₂O₃, ZnO.
• **Muối lưỡng tính**: NaHCO₃, NaHS, (NH₄)₂CO₃.
• **Hợp chất hữu cơ lưỡng tính**: Amino axit H₂N-R-COOH (vừa chứa nhóm -COOH axit vừa chứa nhóm -NH₂ bazơ).

[[LINK:Thư viện & Lab Tổng kiến thức Hóa học THPT:/labs/lab-ktra15p/dist/index.html]]`);
    }

    if (q.includes('baking soda') || q.includes('vôi sống') || q.includes('nước vôi') || q.includes('tên thông dụng') || q.includes('thạch cao')) {
      return processAgentCommands(`🧪 **Bảng Tên Thông Dụng & Công Thức Hóa Học Trọng Tâm**:
• **Baking soda (Thuốc muối)**: NaHCO₃ (Natri hiđrocacbonat)
• **Soda Ash (Sô-đa)**: Na₂CO₃ (Natri cacbonat)
• **Vôi sống**: CaO (Canxi oxit) | **Nước vôi trong / Vôi tôi**: Ca(OH)₂
• **Thạch cao sống**: CaSO₄·2H₂O | **Thạch cao nung**: CaSO₄·0.5H₂O
• **Giấm ăn**: Dung dịch Acid axetic CH₃COOH 2% - 5%.
• **Phèn chua**: KAl(SO₄)₂·12H₂O (dùng làm trong nước đục).

[[LINK:Thư viện & Lab Tổng kiến thức Hóa học THPT:/labs/lab-ktra15p/dist/index.html]]`);
    }

    if (q.includes('na') && (q.includes('h2o') || q.includes('nước') || q.includes('nuoc'))) {
      return processAgentCommands(`🧪 **Phản ứng Natri tác dụng với Nước (H₂O)**:
2Na + 2H₂O → 2NaOH + H₂↑
• **Hiện tượng**: Natri nóng chảy thành giọt tròn chạy trên mặt nước, sủi bọt khí H₂ không màu, dung dịch tạo thành làm Phenolphtalein chuyển sang màu hồng.
• **Chủ đề tra cứu**: [📖 Tra cứu Natri tác dụng với nước](https://www.google.com/search?q=Kien+thuc+Natri+tac+dung+voi+nuoc+THPT)

[[LINK:Thư viện & Lab Tổng kiến thức Hóa học THPT:/labs/lab-ktra15p/dist/index.html]]`);
    }

    if ((q.includes('fe') && q.includes('hcl')) || q.includes('sắt tác dụng hcl')) {
      return processAgentCommands(`🧪 **Phản ứng Sắt tác dụng với Axit Clohiđric (HCl)**:
Fe + 2HCl → FeCl₂ + H₂↑
• **Hiện tượng**: Kim loại Sắt tan dần, sủi bọt khí H₂ không màu và tạo dung dịch Sắt(II) clorua màu xanh nhạt.
• **Chủ đề tra cứu**: [📖 Tra cứu Sắt tác dụng axit HCl](https://www.google.com/search?q=Kien+thuc+Sat+tac+dung+axit+HCl+THPT)

[[LINK:Thư viện & Lab Tổng kiến thức Hóa học THPT:/labs/lab-ktra15p/dist/index.html]]`);
    }

    if (q.includes('fe') && q.includes('hno3')) {
      return processAgentCommands(`🧪 **Phản ứng Sắt tác dụng Axit Nitric (HNO₃ đặc nóng)**:
Fe + 6HNO₃ (đặc, nóng) → Fe(NO₃)₃ + 3NO₂↑ + 3H₂O
• **Hiện tượng**: Sắt tan hoàn toàn tạo dung dịch Fe(NO₃)₃ màu vàng nâu và sinh ra khí NO₂ màu nâu đỏ độc hại.
• **Chủ đề tra cứu**: [📖 Tra cứu Sắt tác dụng HNO3](https://www.google.com/search?q=Kien+thuc+Sat+tac+dung+HNO3+THPT)

[[LINK:Thư viện & Lab Tổng kiến thức Hóa học THPT:/labs/lab-ktra15p/dist/index.html]]`);
    }

    if (q.includes('cuo') || (q.includes('đồng') && q.includes('oxit'))) {
      return processAgentCommands(`🧪 **Phản ứng khử Đồng(II) Oxit bằng H₂**:
CuO (đen) + H₂ -t°→ Cu (đỏ) + H₂O
• **Hiện tượng**: Bột CuO màu đen chuyển sang màu đỏ gạch của kim loại Đồng (Cu).
• **Chủ đề tra cứu**: [📖 Tra cứu Đồng II oxit](https://www.google.com/search?q=Kien+thuc+Dong+II+oxit+THPT)

[[LINK:Thư viện & Lab Tổng kiến thức Hóa học THPT:/labs/lab-ktra15p/dist/index.html]]`);
    }

    if (q.includes('este') || q.includes('lipit') || q.includes('xà phòng')) {
      return processAgentCommands(`🧪 **Chuyên đề Este - Lipit (Hóa 12)** cho ${userDisplayName}:
• **Công thức Este no đơn chức mạch hở**: C_n H_{2n} O₂ (n ≥ 2).
• **Phản ứng Xà phòng hóa**: RCOOR' + NaOH -t°→ RCOONa + R'OH.
• **Chủ đề tra cứu**: [📖 Tra cứu Este và Lipit](https://www.google.com/search?q=Kien+thuc+Este+va+Lipit+THPT)

[[LINK:Thư viện & Lab Tổng kiến thức Hóa học THPT:/labs/lab-ktra15p/dist/index.html]]`);
    }

    if (q.includes('gluco') || q.includes('tráng bạc') || q.includes('cacbohidrat')) {
      return processAgentCommands(`🧪 **Chuyên đề Cacbohidrat & Glucozơ (C₆H₁₂O₆)**:
• **Phản ứng tráng bạc**: 1 mol Glucozơ tráng bạc thu được 2 mol Ag↓.
• **Phản ứng lên men rượu**: C₆H₁₂O₆ -lên men→ 2C₂H₅OH + 2CO₂↑.
• **Chủ đề tra cứu**: [📖 Tra cứu Cacbohidrat và Glucozo](https://www.google.com/search?q=Kien+thuc+Cacbohidrat+va+Glucozo+THPT)

[[LINK:Thư viện & Lab Tổng kiến thức Hóa học THPT:/labs/lab-ktra15p/dist/index.html]]`);
    }

    const isGeneralChemistry = q.includes('hóa') || q.includes('hoa') || q.includes('chemistry') || 
                               q.includes('amin') || q.includes('polime') || q.includes('kim loại') || 
                               q.includes('->') || q.includes('+') || q.includes('axit') || q.includes('bazo');

    if (isGeneralChemistry) {
      return processAgentCommands(`🧪 **Kiến thức trọng tâm môn Hóa học THPT**:
• **Hóa Vô cơ**: Đại cương kim loại, Kiềm - Kiềm thổ - Nhôm, Sắt và Crom. [📖 Tra cứu Hóa vô cơ](https://www.google.com/search?q=Kien+thuc+Hoa+vo+co+THPT)
• **Hóa Hữu cơ**: Este - Lipit, Cacbohidrat, Amin - Amino axit - Peptit, Polime. [📖 Tra cứu Hóa hữu cơ](https://www.google.com/search?q=Kien+thuc+Hoa+huu+co+THPT)

[[LINK:Thư viện & Lab Tổng kiến thức Hóa học THPT:/labs/lab-ktra15p/dist/index.html]]`);
    }

    if (q.includes('cộng hưởng') || q.includes('tắt dần') || q.includes('cưỡng bức')) {
      return processAgentCommands(`⚙️ **Dao Động Tắt Dần, Dao Động Cưỡng Bức & Hiện Tượng Cộng Hưởng**:
• **Dao động tắt dần**: Biên độ và năng lượng giảm dần theo thời gian do ma sát / lực cản môi trường.
• **Dao động cưỡng bức**: Chịu tác dụng của ngoại lực tuần hoàn F = F₀·cos(ωt). Biên độ không đổi.
• **Hiện tượng Cộng hưởng**: Xảy ra khi tần số lực cưỡng bức f bằng tần số riêng f₀ của hệ (f = f₀) ⇒ Biên độ dao động đạt giá trị CỰC ĐẠI A_max.
• **Chủ đề tra cứu**: [📖 Tra cứu Hiện tượng cộng hưởng](https://www.google.com/search?q=Kien+thuc+Hien+tuong+cong+huong+Vat+ly+12)

[[LINK:Thư viện & Lab Tổng kiến thức Vật lý THPT:/labs/PhysicsLab/index.html]]`);
    }

    if (q.includes('sóng dừng') || q.includes('bụng sóng') || q.includes('nút sóng')) {
      return processAgentCommands(`⚙️ **Chuyên Đề Thí Nghiệm Sóng Dừng Trên Dây**:
• **Sóng dừng**: Tạo thành do sự giao thoa giữa sóng tới và sóng phản xạ trên cùng phương truyền.
• **Điều kiện có sóng dừng trên dây 2 đầu cố định**: L = k·(λ/2) (với k là số bụng sóng, k+1 là số nút).
• **Điều kiện có sóng dừng 1 đầu cố định, 1 đầu tự do**: L = (2k + 1)·(λ/4).
• **Khoảng cách giữa 2 nút sóng hoặc 2 bụng sóng liên tiếp**: λ/2.
• **Chủ đề tra cứu**: [📖 Tra cứu Sóng dừng](https://www.google.com/search?q=Kien+thuc+Song+dung+Vat+ly+12)

[[LINK:Thư viện & Lab Tổng kiến thức Vật lý THPT:/labs/PhysicsLab/index.html]]`);
    }

    if (q.includes('định luật ôm') || q.includes('định luật ohm') || q.includes('mạch kín') || q.includes('suất điện động')) {
      return processAgentCommands(`⚙️ **Thí Nghiệm Đo Suất Điện Động & Định Luật Ôm Toàn Mạch**:
• **Định luật Ôm cho toàn mạch**: I = E / (R + r)
  - E: Suất điện động của nguồn (V)
  - r: Điện trở trong của nguồn (Ω)
  - R: Điện trở tương đương mạch ngoài (Ω)
• **Hiệu điện thế hai đầu nguồn**: U = E - I·r = I·R
• **Hiệu suất của nguồn điện**: H = (U / E) · 100% = [R / (R + r)] · 100%

[[LINK:Thư viện & Lab Tổng kiến thức Vật lý THPT:/labs/PhysicsLab/index.html]]`);
    }

    if (q.includes('dao động') || q.includes('con lắc') || q.includes('lò xo')) {
      return processAgentCommands(`⚙️ **Công thức Dao Động Cơ Học (Vật lý 12)**:
• **Phương trình li độ**: x = A·cos(ωt + φ)
• **Vận tốc & Gia tốc cực đại**: v_max = ωA | a_max = ω²A
• **Chu kỳ con lắc lò xo**: T = 2π√(m/k)
• **Chu kỳ con lắc đơn**: T = 2π√(l/g)
• **Chủ đề tra cứu**: [📖 Tra cứu Dao động cơ học](https://www.google.com/search?q=Kien+thuc+Dao+dong+co+hoc+Vat+ly+12)

[[LINK:Thư viện & Lab Tổng kiến thức Vật lý THPT:/labs/PhysicsLab/index.html]]`);
    }

    if (q.includes('sóng') || q.includes('giao thoa')) {
      return processAgentCommands(`⚙️ **Công thức Sóng Cơ & Giao Thoa Sóng**:
• **Bước sóng**: λ = v·T = v/f
• **Cực đại giao thoa**: d₂ - d₁ = kλ (k ∈ ℤ)
• **Cực tiểu giao thoa**: d₂ - d₁ = (k + 0,5)λ
• **Chủ đề tra cứu**: [📖 Tra cứu Sóng cơ và giao thoa](https://www.google.com/search?q=Kien+thuc+Song+co+va+giao+thoa+Vat+ly+12)

[[LINK:Thư viện & Lab Tổng kiến thức Vật lý THPT:/labs/PhysicsLab/index.html]]`);
    }

    if (q.includes('xoay chiều') || q.includes('rlc') || q.includes('công suất')) {
      return processAgentCommands(`⚙️ **Dòng Điện Xoay Chiều - Mạch RLC Nối Tiếp**:
• **Tổng trở**: Z = √(R² + (Z_L - Z_C)²) với Z_L = ωL, Z_C = 1/(ωC)
• **Hiện tượng cộng hưởng điện**: Khi Z_L = Z_C ⇒ Z_min = R, I_max = U/R, cosφ = 1.
• **Chủ đề tra cứu**: [📖 Tra cứu Dòng điện xoay chiều](https://www.google.com/search?q=Kien+thuc+Dong+dien+xoay+chieu+Vat+ly+12)

[[LINK:Thư viện & Lab Tổng kiến thức Vật lý THPT:/labs/PhysicsLab/index.html]]`);
    }

    if (q.includes('lý') || q.includes('ly') || q.includes('physics') || q.includes('quang') || q.includes('hạt nhân')) {
      return processAgentCommands(`⚙️ **Tổng hợp kiến thức trọng tâm môn Vật lý THPT**:
• **Dao động & Sóng cơ**: Phương trình dao động, sự truyền sóng, giao thoa. [📖 Tra cứu Dao động cơ](https://www.google.com/search?q=Kien+thuc+Dao+dong+co+Vat+ly+12)
• **Dòng điện xoay chiều**: Mạch RLC nối tiếp, công suất, máy biến áp. [📖 Tra cứu Điện xoay chiều](https://www.google.com/search?q=Kien+thuc+Dien+xoay+chieu+Vat+ly+12)
• **Lượng tử ánh sáng**: Công thức Einstein E = hf = hc/λ. [📖 Tra cứu Lượng tử ánh sáng](https://www.google.com/search?q=Kien+thuc+Luong+tu+anh+sang+Vat+ly+12)

[[LINK:Thư viện & Lab Tổng kiến thức Vật lý THPT:/labs/PhysicsLab/index.html]]`);
    }

    if (q.includes('khảm động') || q.includes('màng tế bào') || q.includes('tưới nước muối') || q.includes('ưu trương')) {
      return processAgentCommands(`🧬 **Động Lực Học Màng Tế Bào & Hiện Tượng Thẩm Thấu (Sinh 10)**:
• **Mô hình Khảm Động (Fluid Mosaic Model - 1972)**: Màng sinh chất được cấu tạo từ lớp kép Phospholipid (đầu ưa nước quay ra ngoài, đuôi kỵ nước quay vào trong) và các Protein màng.
• **Tại sao tưới nước muối mặn cây bị héo?**: Nước muối là môi trường **ưu trương** (nồng độ chất tan bên ngoài cao hơn trong tế bào lông hút của rễ). Theo cơ chế thẩm thấu, nước bị rút từ trong tế bào rễ ra ngoài môi trường, khiến tế bào bị co nguyên sinh và cây héo do mất nước!

[[LINK:Thư viện & Lab Tổng kiến thức Sinh học THPT:/labs/lab_sinh/dist/index.html]]`);
    }

    if (q.includes('enzyme') || q.includes('năng lượng hoạt hóa') || q.includes('khớp cảm ứng')) {
      return processAgentCommands(`🧬 **Xúc Tác Sinh Học Enzyme (Sinh 10)**:
• **Bản chất**: Enzyme là chất xúc tác sinh học (hầu hết là protein).
• **Cơ chế**: Enzyme làm **giảm Năng lượng hoạt hóa (Ea)** cần thiết cho phản ứng, giúp hàng triệu phản ứng sinh hóa diễn ra cực nhanh ở nhiệt độ cơ thể (37°C).
• **Mô hình Khớp cảm ứng (Induced Fit)**: Enzyme biến đổi linh hoạt hình dạng Trung tâm hoạt động để ôm khít cơ chất.
• **Yếu tố ảnh hưởng**: Nhiệt độ cao làm đứt gãy liên kết Hydro làm enzyme biến tính; pH tối ưu (Pepsin dạ dày pH 2, Amylase nước bọt pH 7).

[[LINK:Thư viện & Lab Tổng kiến thức Sinh học THPT:/labs/lab_sinh/dist/index.html]]`);
    }

    if (q.includes('cung phản xạ') || q.includes('rụt tay') || q.includes('phản xạ tủy')) {
      return processAgentCommands(`🧬 **Hệ Thần Kinh & Cung Phản Xạ Tủy Sống (Sinh 11)**:
• **Trật tự Cung Phản Xạ Tủy (Ví dụ chạm vật nóng rụt tay)**:
  1. Thụ thể cảm giác đau ở da tiếp nhận kích thích.
  2. Dây thần kinh hướng tâm dẫn xung thần kinh vào tủy sống.
  3. Nơron trung gian tại tủy sống xử lý tín hiệu khẩn cấp.
  4. Dây thần kinh ly tâm truyền lệnh ra cơ quan đáp ứng.
  5. Cơ tay co rút lập tức.
• **Lưu ý**: Phản xạ rụt tay xử lý ngay tại Tủy Sống (không qua Não) để tiết kiệm thời gian, bảo vệ cơ thể khỏi tổn thương!

[[LINK:Thư viện & Lab Tổng kiến thức Sinh học THPT:/labs/lab_sinh/dist/index.html]]`);
    }

    if (q.includes('tế bào que') || q.includes('tế bào nón') || q.includes('nhìn trong bóng tối')) {
      return processAgentCommands(`🧬 **Giải Phẫu Mắt & Thị Giác Màu Sắc (Sinh 11)**:
• **Tế bào Que (Rod cells)**: Chứa sắc tố Rhodopsin, cực kỳ nhạy cảm với ánh sáng yếu, giúp nhận biết hình dáng và chuyển động ở điều kiện mờ tối (chỉ nhìn được Đen - Trắng).
• **Tế bào Nón (Cone cells)**: Chứa sắc tố Photopsin, hoạt động ở ánh sáng mạnh, giúp phân biệt 3 màu cơ bản: Đỏ, Lục, Lam.
• **Giải thích hiện tượng**: Trong bóng tối mờ ảo, chỉ có Tế bào Que được kích hoạt nên mắt ta thấy được hình dáng đồ vật nhưng không nhận biết được màu sắc!

[[LINK:Thư viện & Lab Tổng kiến thức Sinh học THPT:/labs/lab_sinh/dist/index.html]]`);
    }

    if (q.includes('vaccine') || q.includes('vắc xin') || q.includes('trí nhớ miễn dịch')) {
      return processAgentCommands(`🧬 **Hệ Miễn Dịch & Nguyên Lý Vaccine (Sinh 11)**:
• **Cơ chế hoạt động của Vaccine**: Đưa mầm bệnh đã bị làm chết, suy yếu hoặc đoạn ARN mã hóa vào cơ thể.
• **Trí nhớ miễn dịch**: Vaccine kích thích Tế bào B và Tế bào T nhân lên và tạo ra các **Tế bào nhớ (Memory Cells)**. Khi mầm bệnh thật xâm nhập sau này, tế bào nhớ sẽ sản xuất kháng thể ồ ạt tiêu diệt mầm bệnh trước khi kịp phát bệnh!

[[LINK:Thư viện & Lab Tổng kiến thức Sinh học THPT:/labs/lab_sinh/dist/index.html]]`);
    }

    if (q.includes('okazaki') || q.includes('nhân đôi adn') || q.includes('polymerase')) {
      return processAgentCommands(`🧬 **Cấu Trúc & Sao Chép Phân Tử ADN (Sinh 12)**:
• **Watson & Crick (1953)**: Cấu trúc xoắn kép đối song song 5'→3' và 3'→5'. A nối T (2 liên kết H), G nối X (3 liên kết H).
• **Tại sao xuất hiện đoạn Okazaki?**: Do enzyme ADN Polymerase III chỉ có thể tổng hợp mạch mới theo duy nhất một chiều 5'→3'. Vì 2 mạch gốc ngược chiều nhau nên mạch gốc 5'→3' phải tổng hợp gián đoạn từng đoạn nhỏ Okazaki, sau đó nhờ enzyme Ligase nối lại!

[[LINK:Thư viện & Lab Tổng kiến thức Sinh học THPT:/labs/lab_sinh/dist/index.html]]`);
    }

    if (q.includes('adn') || q.includes('arn') || q.includes('di truyền') || q.includes('gen') || q.includes('sinh')) {
      return processAgentCommands(`🧬 **Kiến thức trọng tâm môn Sinh học THPT**:
• **Cơ chế Di truyền & Biến dị**: ADN, ARN, Mã di truyền, Phiên mã & Dịch mã. [📖 Tra cứu Cơ chế di truyền](https://www.google.com/search?q=Kien+thuc+Co+che+di+truyen+va+bien+di+Sinh+12)
• **Quy luật di truyền**: Mendel phân ly, Phân ly độc lập, Hoán vị gen. [📖 Tra cứu Quy luật di truyền](https://www.google.com/search?q=Kien+thuc+Quy+luat+di+truyen+Sinh+12)
• **Di truyền quần thể**: Định luật Cân bằng Hardy-Weinberg. [📖 Tra cứu Di truyền quần thể](https://www.google.com/search?q=Kien+thuc+Di+truyen+quan+the+Sinh+12)

[[LINK:Thư viện & Lab Tổng kiến thức Sinh học THPT:/labs/lab_sinh/dist/index.html]]`);
    }

    if (q.includes('bậc hai') || q.includes('bậc 2') || q.includes('viét') || q.includes('viet')) {
      return processAgentCommands(`📐 **Công thức Phương trình Bậc hai (ax² + bx + c = 0)**:
• **Biệt thức**: Δ = b² - 4ac (Δ > 0: 2 nghiệm phân biệt; Δ = 0: nghiệm kép; Δ < 0: vô nghiệm)
• **Định lý Vi-ét**: x₁ + x₂ = -b/a  |  x₁·x₂ = c/a
• **Chủ đề tra cứu**: [📖 Tra cứu Phương trình bậc hai](https://www.google.com/search?q=Kien+thuc+Phuong+trinh+bac+hai+Toan+THPT)

[[LINK:Thư viện & Lab Tổng kiến thức Toán học THPT:/labs/toan/frontend/dist/index.html]]`);
    }

    if (q.includes('nguyên hàm') || q.includes('tích phân')) {
      return processAgentCommands(`📐 **Công thức Nguyên Hàm - Tích Phân trọng tâm**:
• **Công thức cơ bản**: ∫ xⁿ dx = xⁿ⁺¹/(n+1) + C (n ≠ -1) | ∫ (1/x) dx = ln|x| + C
• **Diện tích hình phẳng**: S = ∫ₐᵇ |f(x)| dx
• **Thể tích khối tròn xoay**: V = π ∫ₐᵇ f²(x) dx
• **Chủ đề tra cứu**: [📖 Tra cứu Nguyên hàm và Tích phân](https://www.google.com/search?q=Kien+thuc+Nguyen+ham+va+Tich+phan+Toan+12)

[[LINK:Thư viện & Lab Tổng kiến thức Toán học THPT:/labs/toan/frontend/dist/index.html]]`);
    }

    if (q.includes('logarit') || q.includes('mũ')) {
      return processAgentCommands(`📐 **Công thức Mũ & Logarit**:
• **Tính chất Logarit**: logₐ(b·c) = logₐ(b) + logₐ(c) | logₐ(b/c) = logₐ(b) - logₐ(c)
• **Đạo hàm**: (aˣ)' = aˣ·ln(a) | (ln x)' = 1/x
• **Chủ đề tra cứu**: [📖 Tra cứu Hàm số Mũ và Logarit](https://www.google.com/search?q=Kien+thuc+Ham+so+Mu+va+Logarit+Toan+12)

[[LINK:Thư viện & Lab Tổng kiến thức Toán học THPT:/labs/toan/frontend/dist/index.html]]`);
    }

    if (q.includes('số phức') || q.includes('so phuc')) {
      return processAgentCommands(`📐 **Công thức Số Phức (z = a + bi)**:
• **Phần thực**: a  |  **Phần ảo**: b  (với i² = -1)
• **Số phức liên hợp**: z̄ = a - bi
• **Môđun số phức**: |z| = √(a² + b²)
• **Chủ đề tra cứu**: [📖 Tra cứu Số phức](https://www.google.com/search?q=Kien+thuc+So+phuc+Toan+12)

[[LINK:Thư viện & Lab Tổng kiến thức Toán học THPT:/labs/toan/frontend/dist/index.html]]`);
    }

    if (q.includes('toán') || q.includes('toan') || q.includes('math') || q.includes('hàm số') || q.includes('hình học') || q.includes('oxyz')) {
      return processAgentCommands(`📐 **Tổng hợp kiến thức trọng tâm môn Toán học THPT**:
• **Khảo sát hàm số**: Cực trị, Tiệm cận, Đơn điệu. [📖 Tra cứu Khảo sát hàm số](https://www.google.com/search?q=Kien+thuc+Khao+sat+ham+so+Toan+12)
• **Hàm số Mũ & Logarit**: Phương trình và bất phương trình. [📖 Tra cứu Mũ và Logarit](https://www.google.com/search?q=Kien+thuc+Mu+va+Logarit+Toan+12)
• **Nguyên hàm & Tích phân**: Ứng dụng tính diện tích và thể tích. [📖 Tra cứu Tích phân](https://www.google.com/search?q=Kien+thuc+Tich+phan+Toan+12)
• **Hình học không gian Oxyz**: Phương trình mặt phẳng và đường thẳng. [📖 Tra cứu Oxyz](https://www.google.com/search?q=Kien+thuc+Oxyz+Toan+12)

[[LINK:Thư viện & Lab Tổng kiến thức Toán học THPT:/labs/toan/frontend/dist/index.html]]`);
    }

    if (q.includes('đấu trường') || q.includes('dau truong') || q.includes('pvp') || q.includes('thách đấu')) {
      return processAgentCommands(`⚔️ **Đấu Trường Sinh Tử 1v1**: Nơi thách đấu tri thức thời gian thực với hệ thống thẻ bài bổ trợ chiến thuật! [[NAV:/dau-truong]]`);
    }
    if (q.includes('thi') || q.includes('phòng thi') || q.includes('đề thi') || q.includes('luyện đề')) {
      return processAgentCommands(`🚀 **Phòng Thi THPT Quốc Gia 2025**: Luyện thi thực chiến đúng ma trận cấu trúc mới nhất của Bộ GD&ĐT! [[LINK:Ngân hàng Đề thi THPT Quốc Gia 2025:/phong-thi]]`);
    }
    if (q.includes('hồ sơ') || q.includes('ho so') || q.includes('danh hiệu') || q.includes('avatar')) {
      return processAgentCommands(`🏆 **Hồ Sơ Danh Vọng**: Tùy chỉnh avatar Chibi, mở khóa danh hiệu vinh quang và xem chứng chỉ! [[NAV:/ho-so]]`);
    }
    if (q.includes('story') || q.includes('bài viết') || q.includes('chia sẻ')) {
      return processAgentCommands(`📖 **Mạng Xã Hội Story**: Chia sẻ thành tích học tập và hình ảnh khoảnh khắc ấn tượng của bạn! [[NAV:/story]]`);
    }
    if (q.includes('theme') || q.includes('giao diện') || q.includes('sáng') || q.includes('tối')) {
      return processAgentCommands(`🌗 Đã chuyển đổi chế độ giao diện Sáng / Tối cho bạn! [[TOGGLE_THEME]]`);
    }

    return `Chào ${userDisplayName}! NOVA đã ghi nhận câu hỏi của bạn. Hệ thống đang sẵn sàng hướng dẫn bạn trải nghiệm các phòng lab Hóa, Lý, Sinh, Toán và Đấu trường tri thức STEM HUB!`;
  };

  const logDirectToFirestore = async (logData) => {
    try {
      const timestamp = Date.now();
      const timeStr = new Date(timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const logId = logData.logId || ('log_' + timestamp + '_' + Math.random().toString(36).substring(2, 7));
      const subjectName = (logData.subject || 'tổng hợp').toUpperCase();

      const terminalLines = [
        `🤖 [STEM HUB AI REASONING ENGINE — LOG REALTIME — ${timeStr}]`,
        `👤 Học sinh: ${logData.userDisplayName || 'Học sinh'} | Vị trí: ${logData.currentPage || 'Trang chủ'}`,
        `📥 Câu hỏi: "${logData.query || ''}"`,
        `🎯 1/3 Intent & Môn học: Intent '${logData.intent || 'stem_query'}' -> Môn: ${subjectName}`,
        logData.isCacheHit
          ? `⚡ [CACHE HIT - DỮ LIỆU TỰ HỌC] Tìm thấy câu trả lời trong Tri thức AI (Độ tương quan: ${Math.round((logData.ragScore || 0) * 100)}%)`
          : (logData.ragTopTopic ? `📚 2/3 Tầng 2 Vector RAG: Chunk '${logData.ragTopTopic}' (Độ tương quan: ${Math.round((logData.ragScore || 0) * 100)}%)` : `📚 2/3 Tầng 2 Vector RAG: Khai phá tri thức tự do & bài học tương quan`),
        logData.tfjsProb !== null && logData.tfjsProb !== undefined ? `🧠 3/3 Tầng 3 TF.js Online: Dự đoán xác suất = ${(logData.tfjsProb * 100).toFixed(1)}% -> Fit & lưu trọng số` : `🧠 3/3 Tầng 3 TF.js Online: Kích hoạt bộ nhớ tương tác client-side`,
        logData.isCacheHit ? `⚡ TRẢ LỜI TRỰC TIẾP TỪ TRÍ THỨC TỰ HỌC (BỎ QUA GEMINI APIKEY)` : `⚡ Tầng 1 Gemini LLM Engine: Phản hồi & Nạp tự động vào Tri thức AI`,
        logData.aiResponseText ? `💬 AI Phản hồi: "${logData.aiResponseText.slice(0, 120)}..."` : '',
        logData.actionTriggered ? `⚡ Lệnh kích hoạt: ${logData.actionTriggered}` : ''
      ].filter(Boolean);

      // Nhật ký suy luận đã được gửi và lưu trữ an toàn qua Server API /api/ai-reasoning-log
      // Tuân thủ quy tắc bảo mật TC27: Chặn Client người dùng ghi trực tiếp vào collection ai_reasoning_logs
    } catch (_) {
      // Ignored: Server API /api/ai-reasoning-log handles persistence securely
    }
  };

  // Main Bulletproof Multi-API-Key Failover Generator
  const handleSend = async (customPrompt = null, isExpandedOverride = false) => {
    if (!currentUser) {
      setAuthBlockedToast(true);
      console.warn('[GlobalAIAssistant] 🔒 Chặn gọi Gemini API: Người dùng chưa đăng nhập.');
      return;
    }

    const textToSend = customPrompt || input.trim();
    if ((!textToSend && !attachedImage) || isLoading) return;

    const currentImage = attachedImage;
    setAttachedImage(null);

    try { playSound.click(); } catch (_) {}
    setInput('');

    const userMsg = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: textToSend || 'Phân tích hình ảnh này và giải đáp chi tiết giúp mình nhé!',
      image: currentImage,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setTimeout(() => scrollToBottom('smooth'), 10);
    setIsLoading(true);
    setLoadingText(currentImage ? '🔍 NOVA đang phân tích thị giác hình ảnh...' : getContextualLoadingText(textToSend));

    const userDisplayName = personalization?.name || user?.displayName || 'Học sinh';
    const userLevel = personalization?.level || 1;
    const userElo = personalization?.elo || 0;
    const userTitle = personalization?.activeTitle || 'Học viên';
    const userCrystals = personalization?.crystals || 500;
    const currentPage = getPageContextLabel();
    const memoryContext = getCrossSessionMemoryContext();

    // Calculate Dwell Time for Continuous Learning Loop (Addendum 1 & Phase 3)
    const dwellTimeSec = Math.max(1, Math.round((Date.now() - lastInteractionTime) / 1000));
    setLastInteractionTime(Date.now());

    // Intent Classification & Subject Frequency Memory Tracking
    const intentResult = predictUserIntent(textToSend);
    if (intentResult?.command) {
      processAgentCommands(intentResult.command);
    }
    if (intentResult.subject && typeof incrementSubjectFrequency === 'function') {
      incrementSubjectFrequency(intentResult.subject);
    }
    const subjectCode = intentResult.subject === 'hoa' ? 1 : intentResult.subject === 'ly' ? 2 : intentResult.subject === 'toan' ? 3 : 4;
    const isReask = textToSend.toLowerCase().includes('không hiểu') || textToSend.toLowerCase().includes('giải thích lại');

    // Đọc thông số thực tế của học sinh từ personalization state & context trang
    const realAccuracyLast10 = typeof personalization?.accuracyLast10 === 'number' ? personalization.accuracyLast10 : 0.85;
    const realStreakCount = personalization?.streakCount || personalization?.currentStreak || 1;
    // Độ khó ngữ cảnh: nếu ở trang thí nghiệm/phòng thi đọc độ khó bài học, nếu chat tự do ghi nhận 0.5 (Mặc định chat tự do)
    const contextDifficulty = typeof window !== 'undefined' && window.location.pathname.includes('/labs') ? 0.7 : 0.5;

    // Trigger Continuous Learning Loop (Tầng 3 Online Learning + Implicit Reward)
    processInteractionFeedback({
      subjectCode,
      questionDifficulty: contextDifficulty,
      userElo,
      streakCount: realStreakCount,
      avgResponseTimeSec: Math.min(60, dwellTimeSec),
      accuracyLast10: realAccuracyLast10,
      actionSuccess: true,
      dwellTimeSeconds: dwellTimeSec,
      isReaskOrQuickClose: isReask
    }).catch(err => console.warn('[ContinuousLearning] Feedback warning:', err.message));

    // ⚡ BƯỚC 1: KIỂM TRA BỘ NHỚ AI TỰ HỌC (CACHE HIT) TRƯỚC KHI GỌI GEMINI API KEY (CHỈ KHI KHÔNG CÓ ẢNH ĐÍNH KÈM)
    const cacheResult = !currentImage ? checkRAGCacheHit(textToSend, 0.70) : null;
    if (cacheResult && cacheResult.hit) {
      // 1. Giả lập khoảng thời gian suy luận (Thinking State ~ 650ms) để không bị phản hồi đường đột
      setLoadingText("⚡ Nova đang truy xuất & suy luận từ bộ nhớ tri thức...");
      await new Promise((res) => setTimeout(res, 650));
      setIsLoading(false);

      const fullHeader = '';
      let rawCachedAnswer = sanitizeAnswerForStorage(cacheResult.cachedAnswer);
      // Xóa bỏ mọi lời chào robot đầu câu
      rawCachedAnswer = rawCachedAnswer.replace(/^(?:(?:xin\s+)?chào(?:\s+[^!.,:;~-]{1,30})?[!.,:;~-]?\s*)+/gi, '').trim();
      let cacheTextToProcess = rawCachedAnswer;
      if (intentResult?.command && intentResult.command.startsWith('[[NAV:') && !cacheTextToProcess.includes('[[NAV:')) {
        cacheTextToProcess = `${cacheTextToProcess}\n${intentResult.command}`;
      }
      const cachedResponse = processAgentCommands(cacheTextToProcess);
      const botMsgId = 'bot_' + Date.now();

      // Gửi Real-time Log về Terminal khẳng định Cache Hit
      const cacheLogPayload = {
        query: textToSend,
        userDisplayName,
        userEmail: user?.email || '',
        currentPage,
        intent: intentResult?.intent || 'stem_query',
        subject: intentResult?.subject || 'general',
        ragTopTopic: cacheResult.topic || 'Tri thức tự học AI',
        ragScore: cacheResult.score,
        isCacheHit: true,
        aiResponseText: cachedResponse.slice(0, 200)
      };
      try {
        fetch(`/api/ai-reasoning-log?t=${Date.now()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify(cacheLogPayload)
        }).catch(() => {});
      } catch (_) {}
      logDirectToFirestore(cacheLogPayload);

      // 2. Thêm tin nhắn bot ban đầu với tiêu đề Cache Hit
      const initialBotMsg = {
        id: botMsgId,
        sender: 'bot',
        text: fullHeader,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };

      let currentStreamText = fullHeader;
      setMessages([...newMessages, initialBotMsg]);

      // 3. Hiệu ứng gõ chữ từng từ từ (Typewriter Streaming ~18ms/từ) để học sinh không bị ngợp
      const words = cachedResponse.split(' ');
      for (let i = 0; i < words.length; i++) {
        currentStreamText += (i === 0 ? '' : ' ') + words[i];
        const updatedText = currentStreamText;

        setMessages((prevMsgs) =>
          prevMsgs.map((m) => (m.id === botMsgId ? { ...m, text: updatedText } : m))
        );

        await new Promise((r) => setTimeout(r, 18));
      }

      // Lưu phiên hội thoại sau khi gõ hoàn tất
      const finalMsgList = [...newMessages, { ...initialBotMsg, text: currentStreamText }];
      saveCurrentSession(finalMsgList, currentSessionId);
      return; // 🎯 HOÀN TOÀN BỎ QUA GEMINI API KEY!
    }

    // 🛡️ YÊU CẦU 2 (CẢNH BÁO THAY VÌ CỐ TRẢ LỜI & STRICT GROUNDING ABSTENTION):
    const ragResults = retrieveTopK(textToSend, 3);
    const topScore = (ragResults && ragResults.length > 0) ? (ragResults[0].score || 0) : 0;
    const isGreeting = isGreetingOrChitchat(textToSend);
    const isNav = intentResult?.intent && intentResult.intent.startsWith('nav_');
    const isToggle = intentResult?.intent === 'toggle_theme';
    const isChitchat = intentResult?.intent === 'chitchat' || isGreeting;
    const isPureCommand = textToSend.startsWith('[[') || isNav || isToggle || isChitchat;

    // Khi RAG Cosine Similarity < 0.30 (hoặc không tìm thấy SGK), kích hoạt Strict Grounding Abstention
    if (!isExpandedOverride && !isPureCommand && !currentImage && topScore < 0.30) {
      setIsLoading(false);
      const abstentionText = `⚠️ **Cảnh báo thiếu căn cứ**: Câu hỏi nằm ngoài phạm vi kho ngữ liệu Sách giáo khoa chuẩn hiện có. Hệ thống tạm dừng trả lời tự động để tránh sai lệch kiến thức.\n\n[[BTN_EXPANDED_AI_REPLY:${encodeURIComponent(textToSend)}]]`;

      const botMsgId = 'bot_' + Date.now();
      const initialBotMsg = {
        id: botMsgId,
        sender: 'bot',
        text: abstentionText,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      const finalMsgList = [...newMessages, initialBotMsg];
      setMessages(finalMsgList);
      saveCurrentSession(finalMsgList, currentSessionId);
      return;
    }

    let ragContextText = '';
    let mandatoryCitation = '';
    if (ragResults && ragResults.length > 0 && ragResults[0].score >= 0.30) {
      const topChunk = ragResults[0];
      mandatoryCitation = `[Nguồn dẫn chứng: SGK ${topChunk.subject.toUpperCase()} - ${topChunk.topic} - Đoạn mã ${topChunk.id}]`;
      ragContextText = `\n[TRI THỨC TRUY XUẤT TỪ SÁCH GIÁO KHOA CHUẨN GDPT 2018 (Độ tương quan: ${Math.round(topChunk.score * 100)}% >= 30%)]:\n` +
        ragResults.map((r, idx) => `${idx + 1}. [Chủ đề: ${r.topic} (${r.subject.toUpperCase()})] (Mã ID: ${r.id}, Độ tương quan: ${Math.round(r.score * 100)}%):\n${r.content}`).join('\n\n') +
        `\n\n[QUY TẮC BẮT BUỘC VỀ DẪN CHỨNG (STRICT CITATION)]: Cuối câu trả lời, BẮT BUỘC PHẢI ĐÍNH KÈM CHÍNH XÁC KHỐI DẪN CHỨNG: ${mandatoryCitation}`;
    } else if (isExpandedOverride) {
      ragContextText = `\n[LƯU Ý: Học sinh đã chủ động bấm nút "Vẫn xem gợi ý tham khảo mở rộng từ AI". Hãy cung cấp câu trả lời khoa học nhưng mở đầu bằng lời nhắc: "💡 *Nội dung tham khảo mở rộng từ AI, chưa đối sánh trực tiếp với SGK chuẩn*."]\n`;
    }

    // Tầng 2 Continuous Vector Memory Retrieval
    let tier2MemoryText = '';
    try {
      const userMems = await retrieveTopKMemories(user?.uid, textToSend, 3);
      if (userMems && userMems.length > 0) {
        tier2MemoryText = `\n[TẦNG 2 — CONTINUOUS RAG VECTOR MEMORY]:\n` +
          userMems.map((m, idx) => `  ${idx + 1}. [Ký ức cũ] ${m.summary} (Tương quan: ${Math.round(m.simScore * 100)}%)`).join('\n');
      }
    } catch (e) {}

    // Tầng 3 TensorFlow.js Adaptive Model Recommendation
    let tier3AdaptationText = '';
    let rec = null;
    try {
      rec = await getAdaptiveDifficultyRecommendation([
        subjectCode / 4.0,
        0.5,
        Math.min(1.0, (userElo || 1000) / 2500),
        0.1,
        0.3,
        0.8
      ]);
      if (rec) {
        tier3AdaptationText = `\n[TẦNG 3 — MÔ HÌNH DỰ ĐOÁN THÍCH ỨNG TENSORFLOW.JS]:\n  - Xác suất làm đúng tiếp theo: ${(rec.probSuccess * 100).toFixed(1)}%\n  - Gợi ý mức độ bài tập: ${rec.recommendedDifficulty.toUpperCase()} (Delta Elo: ${rec.deltaElo > 0 ? '+' : ''}${rec.deltaElo})`;
      }
    } catch (e) {}

    // Gửi log suy luận thời gian thực về Terminal/CMD & Firestore DB từ phía Client
    const sessionLogId = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const currentLogPayload = {
      logId: sessionLogId,
      query: textToSend,
      userDisplayName,
      userEmail: user?.email || '',
      currentPage,
      intent: intentResult?.intent || 'stem_query',
      subject: intentResult?.subject || 'general',
      ragTopTopic: ragResults?.[0]?.topic || null,
      ragScore: ragResults?.[0]?.score || null,
      tfjsProb: rec?.probSuccess ?? null,
      isCacheHit: false
    };

    try {
      fetch(`/api/ai-reasoning-log?t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(currentLogPayload)
      }).catch((err) => console.warn('Lỗi AI Log Fetch:', err));
    } catch (err) {
      console.warn('Lỗi AI Log Catch:', err);
    }
    logDirectToFirestore(currentLogPayload);

    const conciseInstruction = conciseMode ? `\n[CHẾ ĐỘ TRẢ LỜI NGẮN GỌN IS ACTIVE]: Học sinh thích câu trả lời cực kỳ ngắn gọn. Hãy trả lời dưới 50 từ, cô đọng, đi thẳng vào trọng tâm!` : '';

    const systemInstructionText = `
Bạn là NOVA - Trợ lý AI Chỉ huy Agentic của Hệ sinh thái Giáo dục STEM HUB (Website học tập STEM với Lab ảo 3D, Đấu trường PvP 1v1 & Phòng thi THPT QG).

[RANH GIỚI BỘ NÃO AI 4 TẦNG STEM HUB]:
- TẦNG 1 (Baseline LLM Mượn Sẵn): Gemini API đảm nhận suy luận ngôn ngữ & Tool Use.
- TẦNG 2 (Continuous Memory RAG Tự Phát Triển): Bộ nhớ dài hạn Vector Embeddings.
- TẦNG 3 (Online Learning Tự Huấn Luyện): TensorFlow.js Neural Net cập nhật client-side.

[NGỮ CẢNH HỌC TẬP THỰC TẾ (CHỈ DÙNG ĐỂ ĐIỀU CHỈNH ĐỘ SÂU BÀI GIẢNG, TUYỆT ĐỐI KHÔNG ĐỌC RA CÂU TRẢ LỜI)]:
- Vị trí hiện tại trên trang web: ${currentPage}
- Tần suất tương tác các môn: Hóa (${subjectFrequency?.hoa || 0}), Lý (${subjectFrequency?.ly || 0}), Toán (${subjectFrequency?.toan || 0}), Sinh (${subjectFrequency?.sinh || 0})
${memoryContext}
${ragContextText}
${tier2MemoryText}
${tier3AdaptationText}
${conciseInstruction}

[QUY TẮC PHẢN HỒI BẮT BUỘC - TUYỆT ĐỐI TUÂN THỦ]:
1. TRẢ LỜI TÓM TẮT, SÚC TÍCH (DƯỚI 80 TỪ): Đi thẳng vào trọng tâm cốt lõi. Tuyệt đối KHÔNG giải thích dài dòng lan man.
2. TUYỆT ĐỐI KHÔNG ĐỌC THÔNG TIN CÁ NHÂN: Không được nói kiểu "Bạn chính là [Tên], hiện đang ở cấp độ Lv.X, Elo Y, danh hiệu Z...". Người dùng không yêu cầu tra cứu thông tin cá nhân thì tuyệt đối không được đọc profile ra màn hình. Khi người dùng chào hỏi xã giao ("chào bạn", "hello"), chỉ chào ngắn gọn 1 câu và sẵn sàng giải đáp kiến thức khoa học STEM.
3. BẮT BUỘC ĐƯA CÔNG THỨC CHUẨN LATEX (ÁP DỤNG 100% TOÀN BỘ CÔNG THỨC & PHƯƠNG TRÌNH):
   - Mọi công thức Toán, Lý, Hóa, Sinh, phương trình hóa học, đại lượng, chỉ số phân tử, hằng số BẮT BUỘC viết bằng KaTeX/LaTeX bọc trong dấu đô la:
     + Nội dòng: bọc trong 1 cặp $, ví dụ: $\\text{H}_2\\text{SO}_4$, $\\text{Ca}(\\text{OH})_2$, $x^2 + 2x = 0$, $v = \\frac{s}{t}$, $\\lambda = \\frac{v}{f}$, $K_C = 3{,}4$.
     + Phương trình/công thức chính: bọc trong 2 cặp $$, ví dụ:
       $$\\text{RCOOH} + \\text{R'OH} \\stackrel{\\text{H}_2\\text{SO}_4\\text{ đ},\\, t^\\circ}{\\rightleftharpoons} \\text{RCOOR'} + \\text{H}_2\\text{O}$$
       $$2\\text{Na} + 2\\text{H}_2\\text{O} \\rightarrow 2\\text{NaOH} + \\text{H}_2\\uparrow$$
       $$\\begin{cases} 2x + y = 5 \\\\ x - y = 1 \\end{cases}$$
   - LUÔN LUÔN ĐÓNG ĐẦY ĐỦ CẶP DẤU $ hoặc $$ ngay trên cùng dòng công thức. Tuyệt đối không mở $ mà quên đóng.
   - TUYỆT ĐỐI KHÔNG dùng Unicode nửa vời như H₂SO_4 hay kí hiệu thô như ->, <=>. Phải dùng \\rightarrow, \\rightleftharpoons, \\uparrow, \\downarrow.
   - Nếu có từ tiếng Việt trong công thức, phải bọc trong \\text{...}, ví dụ: \\text{đặc}, \\text{kết tủa}, \\text{khí}.
4. KHI LIỆT KÊ CÁC MỤC KIẾN THỨC/CHUYÊN ĐỀ:
   Trình bày dạng danh sách gạch đầu dòng rõ ràng, đặt tên chuyên đề trong cặp dấu sao kép **Tên chuyên đề**: ...
5. BẮT BUỘC ĐÍNH KÈM NÚT LINK TỔNG KIẾN THỨC VÀO CUỐI CÂU TRẢ LỜI khi giải đáp kiến thức:
   - Hóa học: [[LINK:Thư viện & Lab Tổng kiến thức Hóa học THPT:/labs/lab-ktra15p/dist/index.html]]
   - Vật lý: [[LINK:Thư viện & Lab Tổng kiến thức Vật lý THPT:/labs/PhysicsLab/index.html]]
   - Sinh học: [[LINK:Thư viện & Lab Tổng kiến thức Sinh học THPT:/labs/lab_sinh/dist/index.html]]
   - Toán học: [[LINK:Thư viện & Lab Tổng kiến thức Toán học THPT:/labs/toan/frontend/dist/index.html]]
   - Luyện thi THPT QG: [[LINK:Ngân hàng Đề thi THPT Quốc Gia 2025:/phong-thi]]
6. NẾU người dùng yêu cầu chuyển trang hoặc thực hiện hành động, đính kèm lệnh:
   - Chuyển sang Phòng thi: [[NAV:/phong-thi]]
   - Chuyển sang Đấu trường PvP: [[NAV:/dau-truong]]
   - Chuyển sang Story: [[NAV:/story]]
   - Chuyển sang Hồ sơ: [[NAV:/ho-so]]
   - Mở Lab ảo: [[NAV:/labs/...]]
   - Đổi giao diện Sáng/Tối: [[TOGGLE_THEME]]
7. [AN TOÀN & ĐẠO ĐỨC AI - RESPONSIBLE AI GUARDRAILS]:
   - Tuyệt đối TỪ CHỐI các yêu cầu không thuộc giáo dục STEM, gian lận thi đấu, chế tạo chất nổ/vũ khí nguy hiểm, thông tin sai lệch, bạo lực.
   - Khi giải đáp kiến thức Hóa học có chứa hóa chất mạnh (như H2SO4 đặc, HNO3, KClO3), LUÔN LUÔN kèm lời cảnh báo an toàn thí nghiệm.
   - Bảo vệ quyền riêng tư học sinh: Tuyệt đối không thu thập hoặc yêu cầu số điện thoại, mật khẩu, hay thông tin cá nhân nhạy cảm.
8. KHÔNG ĐỂ DẤU SAO THÔ: Không để lại các dấu sao lẻ loi (*) trong câu trả lời.
`;


    const conversationHistory = newMessages.slice(-10).map((m) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    let aiSuccess = false;
    let responseText = '';

    // Định tuyến an toàn qua Local Next.js Gateway (/api/ai/chat - Zero Geo-block)
    const endpointsToTry = ['/api/ai/chat'];
    if (process.env.NEXT_PUBLIC_API_PROXY_URL) {
      endpointsToTry.push(`${process.env.NEXT_PUBLIC_API_PROXY_URL.replace(/\/$/, '')}/api/ai/chat`);
    }

    const bodyPayload = {
      contents: conversationHistory,
      systemInstruction: systemInstructionText,
      temperature: 0.3,
      maxOutputTokens: 1500,
      imageBase64: currentImage || undefined,
      mimeType: currentImage ? (currentImage.match(/data:([^;]+);/)?.[1] || 'image/jpeg') : undefined
    };

    for (const endpoint of endpointsToTry) {
      if (aiSuccess) break;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify(bodyPayload)
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          const replyText = data.text || data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            responseText = replyText;
            aiSuccess = true;
            break;
          }
        }
      } catch (err) {
        console.warn(`[NOVA AI] Endpoint ${endpoint} thất bại, thử cổng dự phòng:`, err.message);
      }
    }

    let finalText = '';
    if (aiSuccess && responseText) {
      let respToProcess = responseText;
      if (intentResult?.command && intentResult.command.startsWith('[[NAV:') && !respToProcess.includes('[[NAV:')) {
        respToProcess = `${respToProcess}\n${intentResult.command}`;
      }
      finalText = processAgentCommands(respToProcess);
    } else {
      // ⚡ GRACEFUL DEGRADATION: Nếu toàn bộ Gemini API cạn kiệt hạn mức, tự động tổng hợp từ RAG Top-3
      let fallbackText = '';
      if (ragResults && ragResults.length > 0 && ragResults[0].score > 0.08) {
        const topChunk = ragResults[0];
        fallbackText = `💡 **[Trợ Lý Ngoại Tuyến NOVA — Tri Thức Chuẩn GDPT 2018]**\n\n${topChunk.content || topChunk.answer}\n\n*(Hệ thống đang hoạt động ở chế độ Offline Tối ưu Băng thông)*`;
      } else {
        fallbackText = generateOfflineFallbackResponse(textToSend, userDisplayName);
      }

      if (intentResult?.command && intentResult.command.startsWith('[[NAV:') && !fallbackText.includes('[[NAV:')) {
        fallbackText = `${fallbackText}\n${intentResult.command}`;
      }
      finalText = processAgentCommands(fallbackText);
    }

    // 🛡️ BẮT BUỘC ĐÍNH KÈM KHỐI TRÍCH DẪN SGK NẾU CÓ TRUY XUẤT RAG HỢP LỆ
    if (mandatoryCitation && finalText && !finalText.includes('[Nguồn dẫn chứng:')) {
      finalText = `${finalText}\n\n${mandatoryCitation}`;
    }

    // Ghi log kết quả phản hồi cuối cùng vào Firestore DB
    if (finalText) {
      logDirectToFirestore({
        ...currentLogPayload,
        aiResponseText: finalText.slice(0, 200)
      });
    }

    // ⚡ BƯỚC 2: TỰ ĐỘNG LƯU VÀO DỮ LIỆU TỰ HỌC - CHỈ LƯU KIẾN THỨC HỌC THUẬT CHUẨN, TUYỆT ĐỐI KHÔNG LƯU DỮ LIỆU CÁ NHÂN HOẶC CÂU CHÀO HỎI
    const isErrorOrOffline = (str) => {
      if (!str) return true;
      const lower = str.toLowerCase();
      return (
        lower.includes('trợ lý ngoại tuyến') ||
        lower.includes('chế độ offline') ||
        lower.includes('gián đoạn kết nối') ||
        lower.includes('gặp sự cố khi kết nối') ||
        lower.includes('không thể kết nối') ||
        lower.includes('vui lòng thử lại') ||
        lower.includes('vui lòng hỏi lại') ||
        lower.includes('lỗi khi xử lý')
      );
    };

    const hasPersonalInfo = containsPersonalOrSystemInfo(textToSend) || containsPersonalOrSystemInfo(finalText);

    if (aiSuccess && finalText && textToSend.length >= 4 && !isErrorOrOffline(finalText) && !isGreeting && !hasPersonalInfo) {
      try {
        const detectedSubj = (intentResult?.subject && intentResult.subject !== 'general')
          ? intentResult.subject.toLowerCase()
          : (detectQuerySubject(textToSend) || 'stem');

        const validAcademic = ['toan', 'ly', 'hoa', 'sinh', 'tin', 'stem'];
        if (detectedSubj && validAcademic.includes(detectedSubj)) {
          await saveLearnedAnswerToRAG(
            textToSend,
            finalText,
            detectedSubj,
            'Tri thức tự học AI từ tương tác học sinh'
          );
        }
      } catch (err) {
        console.warn('[RAG Self-Learning] Lỗi lưu câu trả lời tự học:', err);
      }
    }

    setIsLoading(false);
    try { playSound.chime?.(); } catch (_) {}

    const botMsgId = 'bot_' + Date.now();

    const initialBotMsg = {
      id: botMsgId,
      sender: 'bot',
      text: '',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...newMessages, initialBotMsg]);

    // ⚡ HIỆU ỨNG GÕ CHỮ TỪ TỪ GIỐNG GEMINI WEB APP (Word-by-Word Streaming Effect ~16ms/từ)
    const words = finalText.split(' ');
    let currentStreamText = '';

    for (let i = 0; i < words.length; i++) {
      currentStreamText += (i === 0 ? '' : ' ') + words[i];
      const updatedText = currentStreamText;

      setMessages((prevMsgs) =>
        prevMsgs.map((m) => (m.id === botMsgId ? { ...m, text: updatedText } : m))
      );

      await new Promise((r) => setTimeout(r, 16));
    }

    const finalMessages = [...newMessages, { ...initialBotMsg, text: currentStreamText }];
    saveCurrentSession(finalMessages, currentSessionId);
  };

  return (
    <>
      <AnimatePresence>
        {showWarningModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.25 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[999999] w-[92vw] max-w-md p-4.5 rounded-3xl backdrop-blur-2xl bg-[#0f121d]/95 border border-rose-500/50 shadow-[0_10px_40px_rgba(244,63,94,0.35)] text-white select-none font-sans"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 text-rose-400 animate-bounce">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest text-rose-400">
                    CẢNH BÁO TÍNH CÔNG BẰNG HỌC THUẬT
                  </span>
                  <button
                    onClick={() => setShowWarningModal(false)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h4 className="text-sm font-black text-white mt-1">
                  Không thể mở Trợ lý AI NOVA!
                </h4>
                <p className="text-[11px] text-slate-200 leading-relaxed mt-1.5 font-medium">
                  Trợ lý AI bị tạm khóa khi bạn <strong className="text-rose-300 font-bold">{warningReason || 'đang trong trận đấu 1v1 hoặc chế độ Luyện tập'}</strong> để đảm bảo tính minh bạch & công bằng!
                </p>
                <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-rose-500/20 pt-2.5">
                  <span className="text-[9px] font-mono text-rose-300/80 truncate">
                    📍 {warningReason || 'Chế độ Thi đấu / Luyện tập đang hoạt động'}
                  </span>
                  <button
                    onClick={() => setShowWarningModal(false)}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-black font-mono transition-all shadow-lg shadow-rose-500/30 cursor-pointer active:scale-95 shrink-0"
                  >
                    Đã hiểu
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Cảnh báo Auth Wall (Client-side Gating Layer 2) */}
      <AnimatePresence>
        {authBlockedToast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999999] px-5 py-3.5 rounded-2xl bg-[#0d101c]/95 border border-amber-500/70 shadow-[0_10px_45px_rgba(245,158,11,0.35)] text-white flex items-center gap-3.5 backdrop-blur-2xl font-sans select-none pointer-events-auto"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shrink-0 text-base shadow-inner">
              🔒
            </div>
            <div className="text-xs">
              <span className="font-black text-amber-300 font-mono block tracking-wider uppercase text-[10px]">
                TRỢ LÝ AI ĐANG BỊ KHÓA
              </span>
              <span className="text-zinc-200 text-[12px] font-medium">
                🔒 Trợ lý AI đang bị khóa. Vui lòng đăng nhập để sử dụng tính năng này!
              </span>
            </div>
            <button
              onClick={() => {
                setAuthBlockedToast(false);
                openAuth('login');
              }}
              className="ml-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-mono font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95 shrink-0"
            >
              Đăng nhập ngay
            </button>
            <button
              onClick={() => setAuthBlockedToast(false)}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && !isMatchOrPracticeActive().active && isHomeOrLabDirectory && (
        <div className="fixed bottom-6 right-24 z-[999] screenshot-hide">
          <button
            onClick={handleOpenHUD}
            className={`group relative flex items-center gap-2.5 px-4 py-3 border rounded-full backdrop-blur-xl transition-all duration-300 active:scale-95 cursor-pointer ${
              isDark
                ? 'bg-[#0d1117]/90 hover:bg-[#161b22] border-cyan-500/40 hover:border-cyan-400 text-white shadow-[0_0_20px_rgba(34,211,238,0.25)] hover:shadow-[0_0_30px_rgba(34,211,238,0.45)]'
                : 'bg-white/95 hover:bg-[#F0EBFA] border-pink-200/80 hover:border-pink-300 text-slate-800 shadow-[0_4px_20px_rgba(124,58,237,0.08)]'
            }`}
            title={!currentUser && !authLoading ? "🔒 Trợ lý AI đang bị khóa. Vui lòng đăng nhập để sử dụng tính năng này!" : "Mở Trợ lý AI NOVA (Ctrl+K)"}
          >
            <span className={`absolute -inset-0.5 rounded-full blur-sm transition duration-300 animate-pulse ${
              isDark ? 'bg-gradient-to-r from-cyan-500 via-pink-500 to-indigo-500 opacity-30 group-hover:opacity-75' : 'bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 opacity-40 group-hover:opacity-70'
            }`} />
            
            <div className={`relative w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
              isDark ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300' : 'bg-[#F0EBFA] border border-pink-200 text-pink-600'
            }`}>
              <Bot className="w-4 h-4 animate-bounce" />
              {!currentUser && !authLoading && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-md border border-amber-300 text-[8px] font-bold select-none">
                  🔒
                </span>
              )}
            </div>

            <div className="relative hidden md:flex flex-col text-left">
              <span className={`text-[11px] font-black uppercase tracking-widest leading-none flex items-center gap-1 ${
                isDark ? 'text-cyan-400' : 'text-slate-800'
              }`}>
                NOVA AI 
                {!currentUser && !authLoading ? (
                  <span className="text-[10px] text-amber-400 font-mono ml-0.5 font-bold">🔒</span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                )}
              </span>
              <span className={`text-[9px] font-mono ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                {!currentUser && !authLoading ? 'Bị khóa • Đăng nhập' : 'Chỉ huy STEM • Ctrl+K'}
              </span>
            </div>
          </button>
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={`nova-hud-container fixed bottom-6 right-6 z-[99999] w-[92vw] sm:w-[430px] h-[600px] max-h-[85vh] rounded-3xl backdrop-blur-2xl flex flex-col overflow-hidden font-sans screenshot-hide select-none transition-colors duration-300 ${
              isDark
                ? 'bg-[#0c0e14]/95 border border-cyan-500/35 text-zinc-100 shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_30px_rgba(34,211,238,0.2)]'
                : 'bg-[#FAF8FE] border border-[#E2D9F3] text-[#1E152A] shadow-[0_15px_50px_rgba(124,58,237,0.1)]'
            } shadow-2xl`}
          >
            {/* Header */}
            <div className={`px-4 py-3 border-b flex items-center justify-between shrink-0 relative transition-colors ${
              isDark ? 'bg-[#121520]/90 border-cyan-500/20' : 'bg-[#F0EBFA]/90 border-[#E2D9F3] shadow-2xs'
            }`}>
              <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${
                isDark ? 'from-transparent via-cyan-400 to-transparent' : 'from-transparent via-pink-400/60 to-transparent'
              }`} />
              
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center relative shrink-0 transition-all ${
                  isDark
                    ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                    : 'bg-white border-pink-200 text-pink-600 shadow-2xs'
                }`}>
                  <Bot className="w-4 h-4 animate-pulse" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 border border-current rounded-full" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className={`text-xs font-bold uppercase tracking-wider font-mono ${
                      isDark ? 'text-cyan-400' : 'text-pink-900'
                    }`}>
                      NOVA HUD
                    </h3>
                  </div>
                  <p className={`text-[9px] truncate max-w-[150px] ${isDark ? 'text-zinc-400' : 'text-pink-700/80'}`}>
                    📍 {getPageContextLabel()}
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-1">
                {/* Nút Tạo đoạn chat mới */}
                <button
                  type="button"
                  onClick={handleStartNewChat}
                  className={`px-2 py-1 rounded-xl text-[10px] font-extrabold transition-all border flex items-center gap-1 cursor-pointer ${
                    isDark
                      ? 'bg-cyan-500/10 border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/20'
                      : 'bg-pink-100 border-pink-200 text-pink-700 hover:bg-pink-200'
                  }`}
                  title="Khởi tạo phiên trò chuyện mới"
                >
                  <Plus className="w-3 h-3" /> Chat mới
                </button>

                {/* Nút Xem lịch sử đoạn chat */}
                <button
                  type="button"
                  onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
                  className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                    showHistoryDrawer
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300'
                      : isDark
                      ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:text-cyan-300'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-pink-600'
                  }`}
                  title="Lịch sử trò chuyện"
                >
                  <History className="w-3.5 h-3.5" />
                </button>

                {/* Nút Đóng HUD */}
                <button
                  type="button"
                  onClick={() => {
                    try { window.speechSynthesis?.cancel(); } catch (_) {}
                    setIsOpen(false);
                  }}
                  className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                    isDark
                      ? 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-rose-400 hover:border-rose-400/50'
                      : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-rose-600'
                  }`}
                  title="Đóng HUD (Ctrl+K)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>



            {/* Chat Body Container */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
              {/* Drawer Xem Lịch Sử Các Phiên Chat Cũ */}
              <AnimatePresence>
                {showHistoryDrawer && (
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ duration: 0.2 }}
                    className={`absolute inset-0 z-20 flex flex-col p-4 font-sans ${
                      isDark ? 'bg-zinc-950/98 text-zinc-100' : 'bg-white text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold font-mono uppercase tracking-wider text-cyan-300">Lịch sử trò chuyện ({sessions.length})</span>
                      </div>
                      <button
                        onClick={() => setShowHistoryDrawer(false)}
                        className="p-1 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-cyber-scrollbar">
                      {sessions.length === 0 ? (
                        <div className="text-center py-10 text-xs text-zinc-500 font-mono">
                          Chưa có lịch sử cuộc hội thoại nào.
                        </div>
                      ) : (
                        sessions.map((s) => {
                          const isActive = s.id === currentSessionId;
                          return (
                            <div
                              key={s.id}
                              onClick={() => handleSelectSession(s)}
                              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 group ${
                                isActive
                                  ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                                  : 'bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:border-zinc-700'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold truncate leading-snug">{s.title || 'Phiên trò chuyện mới'}</p>
                                <span className="text-[9px] font-mono text-zinc-500 block mt-0.5">{s.date}</span>
                              </div>

                              <button
                                onClick={(e) => handleDeleteSession(s.id, e)}
                                className="p-1 text-zinc-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                title="Xóa đoạn chat này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <button
                      onClick={handleStartNewChat}
                      className="mt-3 w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Bắt đầu đoạn Chat Mới
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages Area */}
              <div 
                ref={scrollContainerRef}
                className="flex-1 p-4 overflow-y-auto space-y-3.5 custom-cyber-scrollbar"
              >
                {messages.map((m) => {
                  const isBot = m.sender === 'bot';
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2.5 ${isBot ? 'items-start' : 'items-end justify-end'}`}
                    >
                      {isBot && (
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-xs ${
                          isDark ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-300' : 'bg-pink-100 border border-pink-200 text-pink-600'
                        }`}>
                          🤖
                        </div>
                      )}

                      <div className={`max-w-[85%] rounded-3xl p-3.5 text-xs leading-relaxed transition-all shadow-sm ${
                        isBot
                          ? isDark
                            ? 'bg-[#141824]/90 border border-cyan-500/30 text-zinc-100 rounded-tl-sm'
                            : 'bg-[#F0EBFA] border border-[#E2D9F3] text-[#1E152A] rounded-tl-sm font-medium shadow-2xs'
                          : isDark
                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium rounded-tr-sm shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                            : 'bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-medium rounded-tr-sm shadow-xs'
                      }`}>
                        {isBot ? (
                          <>
                            <FormattedAIMessage
                              text={m.text}
                              onNavigate={(url) => {
                                if (url.includes('/labs/')) {
                                  setActiveLab({ link: url, name: 'Phòng lab ảo' });
                                  if (pathname !== '/') {
                                    router.push('/');
                                  }
                                } else {
                                  setActiveLab(null);
                                  router.push(url);
                                }
                              }}
                              onTriggerExpandedAI={(q) => handleSend(q, true)}
                              isDark={isDark}
                            />
                            
                            {/* Feedback Adaptive Loop Controls */}
                            <div className="flex items-center gap-3 mt-2 pt-1 border-t border-cyan-500/15 text-[10px]">
                              <button
                                type="button"
                                onClick={() => recordFeedback(true)}
                                className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer"
                                title="Câu trả lời hữu ích"
                              >
                                👍 Hay
                              </button>
                              <button
                                type="button"
                                onClick={() => recordFeedback(false)}
                                className="text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 cursor-pointer"
                                title="Câu trả lời quá dài (Hệ thống sẽ tự động bật chế độ trả lời ngắn gọn)"
                              >
                                👎 Dài quá / Chưa đúng
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            {m.image && (
                              <div className="mb-2 rounded-xl overflow-hidden border border-white/20 max-w-[260px] bg-black/40 shadow-md">
                                <img src={m.image} alt="Ảnh đính kèm" className="w-full h-auto max-h-48 object-contain" />
                              </div>
                            )}
                            <p className="whitespace-pre-wrap">{m.text}</p>
                          </>
                        )}
                        <span className={`text-[8px] font-mono block text-right mt-1.5 opacity-60 ${isBot ? (isDark ? 'text-cyan-300' : 'text-pink-600') : 'text-white'}`}>
                          {m.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* State Đang Suy Nghĩ / Đang Tải */}
                {isLoading && (
                  <div className="flex gap-2.5 items-start">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      isDark ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-300' : 'bg-pink-100 border border-pink-200 text-pink-600'
                    }`}>
                      🤖
                    </div>
                    <div className={`rounded-3xl p-3 text-xs leading-relaxed border animate-pulse flex items-center gap-2 ${
                      isDark ? 'bg-[#141824] border-cyan-500/30 text-cyan-300' : 'bg-[#F0EBFA] border-[#E2D9F3] text-pink-800'
                    }`}>
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span className="font-mono text-[11px]">{loadingText}</span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Action Quick Chips Row */}
              <div className={`px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t ${
                isDark ? 'border-zinc-800/60 bg-zinc-950/40' : 'border-[#E2D9F3] bg-[#FAF8FE]'
              }`}>
                {[
                  { label: '🧪 Lab Hóa', action: () => handleSend('Tôi muốn làm thí nghiệm thử khí và phản ứng Hóa học THPT') },
                  { label: '⚔️ Đấu Trường', action: () => handleSend('Hướng dẫn chiến thuật tăng điểm Elo Đấu Trường PvP') },
                  { label: '🚀 Phòng Thi', action: () => handleSend('Mở Phòng Thi Luyện Đề THPT Quốc Gia 2025') },
                  { label: '🌗 Đổi Theme', action: () => processAgentCommands('[[TOGGLE_THEME]]') }
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={chip.action}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono whitespace-nowrap border transition-all cursor-pointer shrink-0 ${
                      isDark
                        ? 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:border-cyan-400/50 hover:text-cyan-300'
                        : 'bg-white border-[#E2D9F3] text-[#1E152A] hover:bg-[#F0EBFA] shadow-2xs'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Preview ảnh đính kèm (Paste qua Ctrl+V hoặc Tải lên) */}
              {attachedImage && (
                <div className={`px-3 py-2 border-t flex items-center gap-2.5 ${
                  isDark ? 'bg-zinc-950/90 border-cyan-500/20' : 'bg-pink-50 border-pink-200'
                }`}>
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-cyan-400 shrink-0 bg-black/40">
                    <img src={attachedImage} alt="Preview ảnh đính kèm" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 text-[11px]">
                    <div className={`font-semibold flex items-center gap-1 ${isDark ? 'text-cyan-300' : 'text-pink-600'}`}>
                      <Sparkles className="w-3 h-3" /> Đã nhận diện ảnh (Ctrl+V)
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate">NOVA AI sẽ đọc và phân tích hình ảnh này</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachedImage(null)}
                    className="p-1 rounded-md text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                    title="Xóa ảnh đính kèm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Input Control Bar */}
              <div className={`p-3 border-t flex items-center gap-2 shrink-0 ${
                isDark ? 'bg-[#10121a] border-cyan-500/20' : 'bg-[#F0EBFA]/90 border-[#E2D9F3]'
              }`}>
                {/* Hidden file input for image upload */}
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

                {/* Nút Upload / Paste Ảnh */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    attachedImage
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                      : isDark
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-cyan-300 hover:border-cyan-400/40'
                      : 'bg-white border-pink-200 text-slate-500 hover:text-pink-600'
                  }`}
                  title="Tải lên hoặc dán ảnh bài tập (Ctrl+V) để NOVA AI đọc và giải bài"
                >
                  <ImagePlus className="w-4 h-4" />
                </button>

                {/* Nút Bật Micro Nhận Diện Giọng Nói STT */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    isListening
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                      : isDark
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-cyan-300 hover:border-cyan-400/40'
                      : 'bg-white border-pink-200 text-slate-500 hover:text-pink-600'
                  }`}
                  title={isListening ? 'Đang lắng nghe... Bấm để dừng Micro' : 'Bật Micro nhận diện giọng nói Tiếng Việt'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Input Text Box */}
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  onPaste={handlePaste}
                  placeholder={
                    attachedImage
                      ? 'Thêm câu hỏi cho ảnh hoặc nhấn Gửi (Enter)...'
                      : isListening
                      ? '🎙️ Đang nghe giọng nói của bạn...'
                      : 'Hỏi NOVA, dán ảnh Ctrl+V... (Enter gửi)'
                  }
                  className={`flex-1 px-3.5 py-2.5 rounded-2xl text-xs focus:outline-none transition-all ${
                    isDark
                      ? 'bg-zinc-900/90 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-400'
                      : 'bg-white border border-pink-200 text-slate-800 placeholder:text-slate-400 focus:border-pink-400'
                  }`}
                />

                {/* Nút Gửi Tin Nhắn */}
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={(!input.trim() && !attachedImage) || isLoading}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    isDark
                      ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/30'
                      : 'bg-pink-500 border-pink-400 text-white hover:bg-pink-600'
                  }`}
                  title="Gửi câu hỏi cho NOVA AI"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
