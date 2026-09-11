'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, 
  Music, Plus, Trash2, AlertTriangle, CheckCircle, Disc, Radio, ExternalLink, X,
  GripHorizontal, Minimize2, Maximize2, Move, ListMusic
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useAudioStore } from '@/store/useAudioStore';
import { validateAudioUrl, getYouTubeVideoId, parseTrackChaptersFromTitle, SYSTEM_DEFAULT_TRACKS } from '@/lib/audioCatalog';

/**
 * Helper định dạng giây thành dạng phút:giây (03:45) hoặc giờ:phút:giây (01:01:01)
 */
function formatTime(secs) {
  if (isNaN(secs) || secs <= 0) return '00:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);

  if (h > 0) {
    return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

/**
 * 1. COMPONENT NÚT ICON SIÊU GỌN TRÊN HEADER (DÙNG ĐỂ BẬT/TẮT WIDGET NHẠC)
 */
export function CyberMusicHeaderButton() {
  const { isPlaying, toggleHeaderWidget, initAudioStore } = useAudioStore();
  const { theme, resolvedTheme } = useTheme();
  const isDark = theme === 'dark' || resolvedTheme === 'dark';

  useEffect(() => {
    initAudioStore();
  }, [initAudioStore]);

  return (
    <button
      onClick={toggleHeaderWidget}
      className={`p-2 rounded-2xl border backdrop-blur-md transition-all duration-300 cursor-pointer shadow-sm active:scale-95 flex items-center justify-center ${
        isPlaying
          ? isDark
            ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
            : 'bg-pink-100/90 border-pink-400/80 text-pink-700 shadow-[0_0_12px_rgba(236,72,153,0.3)]'
          : isDark
            ? 'bg-zinc-900/90 hover:bg-zinc-900 border-zinc-700/80 text-zinc-400 hover:text-cyan-300'
            : 'bg-white/90 hover:bg-pink-50 border-pink-200/90 text-pink-700 hover:text-pink-900'
      }`}
      title={isPlaying ? 'Mở/Đóng Trình phát nhạc Cyber Audio (Đang phát)' : 'Mở Trình phát nhạc Cyber Audio'}
    >
      {isPlaying ? (
        <div className="flex items-end gap-0.5 h-3.5 w-3.5 px-0.5">
          <span className={`w-0.5 rounded-full h-full animate-[bounce_1s_infinite_100ms] ${isDark ? 'bg-cyan-400' : 'bg-pink-500'}`} />
          <span className={`w-0.5 rounded-full h-full animate-[bounce_1s_infinite_300ms] ${isDark ? 'bg-pink-500' : 'bg-purple-500'}`} />
          <span className={`w-0.5 rounded-full h-full animate-[bounce_1s_infinite_200ms] ${isDark ? 'bg-cyan-400' : 'bg-pink-500'}`} />
        </div>
      ) : (
        <Music className="w-4 h-4" />
      )}
    </button>
  );
}

/**
 * 2. COMPONENT CỬA SỔ WIDGET NỔI KÉO THẢ TỰ DO (ĐẶT Ở LEVEL ROOT LAYOUT)
 */
export default function CyberMusicPlayer() {
  const {
    isPlaying, volume, isMuted, isDucked, currentGenre, playingTrack,
    activePlaylist, customTracks, isWidgetOpen, isWidgetMinimized,
    initAudioStore, togglePlay, play, pause, setVolume, toggleMute, setGenre,
    nextTrack, prevTrack, selectTrack, addCustomTrack, removeCustomTrack,
    toggleWidget, openWidget, closeWidget, toggleMinimizeWidget
  } = useAudioStore();

  const { theme, resolvedTheme } = useTheme();
  const isDark = theme === 'dark' || resolvedTheme === 'dark';

  const [showAddModal, setShowAddModal] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [timestampText, setTimestampText] = useState('');
  const [customTrackCount, setCustomTrackCount] = useState(16);

  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [validationError, setValidationError] = useState('');

  // State Thời gian phát & Tua bài hát
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  const audioRef = useRef(null);
  const youtubeIframeRef = useRef(null);
  const prevTrackIdRef = useRef(null);

  // Khởi tạo bộ nhớ Store khi mount
  useEffect(() => {
    initAudioStore();
  }, [initAudioStore]);

  // Track đang phát thực tế
  const currentTrack = playingTrack || activePlaylist[0] || {};
  const ytVideoId = currentTrack.youtubeId || getYouTubeVideoId(currentTrack.url);
  const isYouTubeTrack = currentTrack.type === 'youtube' || Boolean(ytVideoId);

  // Phân tích phân đoạn bài hát trong video YouTube (Chapters/Sub-tracks)
  const currentChapters = (currentTrack.chapters && currentTrack.chapters.length > 0)
    ? currentTrack.chapters
    : (currentTrack.title ? parseTrackChaptersFromTitle(currentTrack.title, duration) : []);

  const hasChapters = currentChapters.length > 1;

  // Xác định bài hát con đang phát trong video dựa vào thời gian currentTime
  const activeChapterIndex = hasChapters
    ? currentChapters.findIndex((c, i) => {
        const nextC = currentChapters[i + 1];
        return currentTime >= c.startTime && (!nextC || currentTime < nextC.startTime);
      })
    : 0;

  const currentSubChapter = hasChapters && activeChapterIndex !== -1 ? currentChapters[activeChapterIndex] : null;

  // Tính toán âm lượng thực tế phát ra (Có tính Audio Ducking khi Javit AI nói)
  const effectiveVolume = isMuted ? 0 : isDucked ? volume * 0.25 : volume;

  // Lắng nghe sự kiện từ YouTube Iframe API để cập nhật thời gian phát
  useEffect(() => {
    const handleWindowMessage = (event) => {
      try {
        if (typeof event.data === 'string') {
          const data = JSON.parse(event.data);
          if (data.event === 'infoDelivery' && data.info) {
            if (!isSeeking && typeof data.info.currentTime === 'number') {
              setCurrentTime(data.info.currentTime);
            }
            if (typeof data.info.duration === 'number' && data.info.duration > 0) {
              setDuration(data.info.duration);
            }
          }
        }
      } catch (_) {}
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [isSeeking]);

  // Polling liên tục gửi tin nhắn yêu cầu YouTube API trả về thời gian thực currentTime và tổng thời lượng duration
  useEffect(() => {
    if (!isYouTubeTrack || !isPlaying) return;

    const interval = setInterval(() => {
      if (youtubeIframeRef.current && youtubeIframeRef.current.contentWindow) {
        try {
          youtubeIframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }),
            '*'
          );
        } catch (_) {}
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isYouTubeTrack, isPlaying]);

  // 1. Cập nhật âm lượng cho thẻ HTML5 Audio (.mp3, .wav)
  useEffect(() => {
    if (audioRef.current && !isYouTubeTrack) {
      audioRef.current.volume = effectiveVolume;
    }
  }, [effectiveVolume, isYouTubeTrack]);

  // 2. Cập nhật âm lượng cho YouTube Embed Iframe bằng postMessage API
  useEffect(() => {
    if (isYouTubeTrack && youtubeIframeRef.current && youtubeIframeRef.current.contentWindow) {
      try {
        const targetVol = Math.round(effectiveVolume * 100);
        youtubeIframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'setVolume', args: [targetVol] }),
          '*'
        );
        if (isMuted || effectiveVolume === 0) {
          youtubeIframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'mute', args: [] }),
            '*'
          );
        } else {
          youtubeIframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'unMute', args: [] }),
            '*'
          );
        }
      } catch (err) {
        console.warn('Lỗi điều khiển âm lượng YouTube Embed:', err);
      }
    }
  }, [currentTrack, effectiveVolume, isMuted, isYouTubeTrack]);

  // Xử lý nạp âm thanh khi chuyển bài (Chỉ reset thời gian khi đổi sang bài hát mới)
  useEffect(() => {
    if (!currentTrack.url) return;

    // CHỈ reset currentTime và duration khi bài hát thực sự thay đổi ID
    if (prevTrackIdRef.current !== currentTrack.id) {
      prevTrackIdRef.current = currentTrack.id;
      setCurrentTime(0);
      setDuration(0);
    }

    // Nếu bài hát thuộc dạng YouTube -> Dùng YouTube Engine, ngắt HTML5 audio
    if (isYouTubeTrack) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
      }
      return;
    }

    // Nếu là file Audio trực tiếp
    if (audioRef.current) {
      if (audioRef.current.src !== currentTrack.url) {
        audioRef.current.src = currentTrack.url;
        if (isPlaying) {
          audioRef.current.play().catch((err) => {
            console.warn('Lỗi phát tệp âm thanh HTML5, tự động chuyển bài tiếp theo:', err);
            nextTrack();
          });
        }
      } else {
        if (isPlaying) {
          audioRef.current.play().catch((err) => {
            console.warn('Lỗi phát tệp âm thanh HTML5, tự động chuyển bài tiếp theo:', err);
            nextTrack();
          });
        } else {
          audioRef.current.pause();
        }
      }
    }
  }, [currentTrack.id, currentTrack.url, isPlaying, isYouTubeTrack]);

  // Thao tác tua bài hát chuẩn xác (Seek to exact seconds)
  const performSeek = (seconds) => {
    const targetTime = Number(seconds);
    if (isNaN(targetTime) || targetTime < 0) return;

    setCurrentTime(targetTime);

    if (isYouTubeTrack) {
      if (youtubeIframeRef.current && youtubeIframeRef.current.contentWindow) {
        try {
          youtubeIframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'seekTo', args: [targetTime, true] }),
            '*'
          );
        } catch (err) {
          console.warn('Lỗi tua YouTube video:', err);
        }
      }
    } else if (audioRef.current) {
      try {
        audioRef.current.currentTime = targetTime;
      } catch (err) {
        console.warn('Lỗi tua HTML5 audio:', err);
      }
    }
  };

  const handleRangeSeek = (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      performSeek(val);
    }
  };

  // Xử lý nộp link nhạc mới để xác thực
  const handleValidateInput = async (e) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    setIsValidating(true);
    setValidationError('');
    setValidationResult(null);

    const result = await validateAudioUrl(inputUrl, timestampText, customTrackCount);
    setIsValidating(false);

    if (!result.valid) {
      setValidationError(result.message || 'Link không hợp lệ');
    } else {
      setValidationResult(result);
    }
  };

  // Xác nhận thêm nhạc vào danh sách
  const handleConfirmAdd = () => {
    if (!validationResult) return;

    const newTrack = {
      id: 'custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: validationResult.title || 'Nhạc Cá Nhân',
      artist: validationResult.artist || 'User Link',
      genre: 'Nhạc Cá Nhân',
      url: validationResult.url,
      type: validationResult.type,
      youtubeId: validationResult.youtubeId,
      chapters: validationResult.chapters || [],
      trackCount: validationResult.trackCount || 1,
      cover: validationResult.cover || '🎵'
    };

    addCustomTrack(newTrack);
    setShowAddModal(false);
    setInputUrl('');
    setTimestampText('');
    setValidationResult(null);
  };

  return (
    <>
      {/* HTML5 Audio Player ngầm (Không ngắt/tắt nhạc khi gặp file lỗi, mà tự chuyển bài) */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (!isSeeking && audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            if (audioRef.current.duration) {
              setDuration(audioRef.current.duration);
            }
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration || 0);
          }
        }}
        onEnded={() => {
          if (isPlaying) nextTrack(true);
        }}
        onError={(err) => {
          console.warn('Không thể nạp tệp âm thanh HTML5:', err);
          if (isPlaying) nextTrack(true);
        }}
      />

      {/* Embedded YouTube Audio Player ngầm (Nếu bài hát là dạng YouTube) */}
      {isYouTubeTrack && ytVideoId && isPlaying && (
        <iframe
          ref={youtubeIframeRef}
          className="hidden"
          width="1"
          height="1"
          src={`https://www.youtube.com/embed/${ytVideoId}?autoplay=1&enablejsapi=1`}
          allow="autoplay"
          title="YouTube Audio Engine"
          onLoad={() => {
            if (youtubeIframeRef.current && youtubeIframeRef.current.contentWindow) {
              const targetVol = Math.round(effectiveVolume * 100);
              youtubeIframeRef.current.contentWindow.postMessage(
                JSON.stringify({ event: 'command', func: 'setVolume', args: [targetVol] }),
                '*'
              );
            }
          }}
        />
      )}

      {/* CỬA SỔ WIDGET NỔI KÉO THẢ TỰ DO (FLOATING DRAGGABLE CYBER AUDIO HUD) */}
      <AnimatePresence>
        {isWidgetOpen && (
          <motion.div
            drag
            dragMomentum={false}
            dragConstraints={{
              left: -(typeof window !== 'undefined' ? window.innerWidth - 240 : 800),
              right: 10,
              top: -(typeof window !== 'undefined' ? window.innerHeight - 150 : 600),
              bottom: 10
            }}
            dragElastic={0.05}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className={`fixed bottom-12 right-6 z-[99998] select-none screenshot-hide font-sans rounded-3xl overflow-hidden border backdrop-blur-2xl transition-all duration-300 ${
              isDark 
                ? 'shadow-[0_0_35px_rgba(0,0,0,0.85)]' 
                : 'shadow-[0_15px_45px_rgba(124,58,237,0.12),0_0_20px_rgba(240,57,140,0.05)]'
            } ${
              isWidgetMinimized 
                ? isDark 
                  ? 'bg-zinc-950/95 border-cyan-500/50 p-1.5 w-auto cursor-grab active:cursor-grabbing' 
                  : 'bg-[#FAF8FE] border-[#E2D9F3] text-[#1E152A] p-1.5 w-auto cursor-grab active:cursor-grabbing shadow-md'
                : isDark
                  ? 'bg-zinc-950/95 border-cyan-500/40 text-zinc-100 w-[92vw] sm:w-[360px] max-h-[82vh] flex flex-col'
                  : 'bg-[#FAF8FE] border-[#E2D9F3] text-[#1E152A] w-[92vw] sm:w-[360px] max-h-[82vh] flex flex-col shadow-2xl'
            }`}
          >
            {/* MINIMIZED FLOATING BADGE MODE (DẠNG THU NHỎ SIÊU GỌN - KÉO THẢ TỰ DO BẤT KỲ ĐIỂM NÀO) */}
            {isWidgetMinimized ? (
              <div className="flex items-center gap-2 px-1.5 py-0.5">
                {/* Drag Grip Icon */}
                <GripHorizontal className={`w-3.5 h-3.5 shrink-0 cursor-grab active:cursor-grabbing ${isDark ? 'text-cyan-400' : 'text-pink-600'}`} />

                {/* Animated Equalizer or Music Disc Icon */}
                <div className="shrink-0 flex items-center cursor-grab active:cursor-grabbing">
                  {isPlaying ? (
                    <div className="flex items-end gap-0.5 h-3 w-3">
                      <span className={`w-0.5 rounded-full h-full animate-[bounce_1s_infinite_100ms] ${isDark ? 'bg-cyan-400' : 'bg-pink-500'}`} />
                      <span className={`w-0.5 rounded-full h-full animate-[bounce_1s_infinite_300ms] ${isDark ? 'bg-pink-500' : 'bg-purple-500'}`} />
                      <span className={`w-0.5 rounded-full h-full animate-[bounce_1s_infinite_200ms] ${isDark ? 'bg-cyan-400' : 'bg-pink-500'}`} />
                    </div>
                  ) : (
                    <Disc className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-pink-600'}`} />
                  )}
                </div>

                {/* Track Info (Siêu nhỏ gọn, kéo thả toàn vùng text) */}
                <div className="flex flex-col max-w-[100px] sm:max-w-[130px] truncate leading-tight select-none cursor-grab active:cursor-grabbing pr-0.5">
                  <span className={`text-[10px] font-bold truncate ${isDark ? 'text-zinc-100' : 'text-pink-950'}`}>
                    {currentSubChapter ? currentSubChapter.title : (currentTrack.title || 'Cyber Audio')}
                  </span>
                  <span className={`text-[8px] font-mono truncate ${isDark ? 'text-cyan-400/80' : 'text-pink-700/90 font-medium'}`}>
                    {hasChapters ? `Tổ hợp ${currentChapters.length} bài` : isDucked ? '🔊 Javit AI' : (currentTrack.artist || 'Lo-Fi')}
                  </span>
                </div>

                {/* Quick Play/Pause Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className={`p-1 rounded-lg border cursor-pointer shrink-0 transition-all active:scale-95 ${
                    isDark 
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 hover:bg-cyan-500/30' 
                      : 'bg-pink-500 text-white border-pink-400 hover:bg-pink-600 shadow-xs'
                  }`}
                  title={isPlaying ? 'Tạm dừng' : 'Phát'}
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                </button>

                {/* Maximize Button ONLY opens full window */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMinimizeWidget();
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className={`p-1 rounded-lg cursor-pointer shrink-0 transition-colors ${
                    isDark ? 'text-zinc-400 hover:text-cyan-300' : 'text-pink-700 hover:text-pink-950'
                  }`}
                  title="Phóng to giao diện đầy đủ"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>
            ) : (
              /* FULL EXPANDED CYBER AUDIO DOCK WINDOW */
              <div className="flex flex-col h-full overflow-hidden">
                {/* Drag Header Bar */}
                <div className={`flex items-center justify-between px-4 py-2.5 border-b cursor-grab active:cursor-grabbing shrink-0 transition-colors ${
                  isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-[#F0EBFA]/90 border-[#E2D9F3]'
                }`}>
                  <div className="flex items-center gap-2">
                    <GripHorizontal className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-pink-600'}`} />
                    <span className={`text-xs font-extrabold font-mono tracking-wider flex items-center gap-1.5 ${
                      isDark ? 'text-cyan-400' : 'text-pink-950'
                    }`}>
                      <Radio className="w-3.5 h-3.5 text-pink-500 animate-pulse" /> JAVIT CYBER AUDIO
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={toggleMinimizeWidget}
                      onPointerDown={(e) => e.stopPropagation()}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        isDark ? 'text-zinc-400 hover:text-cyan-300' : 'text-pink-700 hover:text-pink-950 hover:bg-pink-100/60'
                      }`}
                      title="Thu nhỏ thành đĩa nhạc nổi"
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={closeWidget}
                      onPointerDown={(e) => e.stopPropagation()}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        isDark ? 'text-zinc-400 hover:text-rose-400' : 'text-pink-700 hover:text-rose-600 hover:bg-rose-100/60'
                      }`}
                      title="Đóng cửa sổ nhạc"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Scrollable Inner Body Container */}
                <div 
                  onPointerDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="p-3.5 space-y-2.5 flex-1 overflow-y-auto overscroll-contain custom-cyber-scrollbar"
                >
                  {/* Visualizer Display Box */}
                  <div className={`p-3 border rounded-2xl flex items-center justify-between gap-3 shadow-inner transition-colors ${
                    isDark 
                      ? 'bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border-cyan-500/30' 
                      : 'bg-white border-[#E2D9F3] shadow-2xs'
                  }`}>
                    <div className="flex items-center gap-3 truncate">
                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-lg shrink-0 ${
                        isPlaying 
                          ? isDark 
                            ? 'bg-cyan-500/20 border border-cyan-400/50 animate-pulse' 
                            : 'bg-pink-100 border border-pink-300 animate-pulse'
                          : isDark
                            ? 'bg-zinc-800 border border-zinc-700'
                            : 'bg-pink-50 border border-pink-200'
                      }`}>
                        {currentTrack.cover || '🎧'}
                      </div>
                      <div className="truncate">
                        <p className={`font-bold text-xs truncate ${isDark ? 'text-zinc-100' : 'text-pink-950'}`}>
                          {currentSubChapter ? currentSubChapter.title : currentTrack.title}
                        </p>
                        <p className={`text-[10px] font-mono truncate mt-0.5 ${isDark ? 'text-cyan-400/90' : 'text-pink-700/90 font-medium'}`}>
                          {hasChapters 
                            ? `Nguồn: ${currentTrack.title}` 
                            : isDucked ? '🔊 Javit Voice (Ducked 25%)' : (currentTrack.artist || currentTrack.genre)}
                        </p>
                      </div>
                    </div>

                    {/* Equalizer Sóng Âm Neon */}
                    <div className="flex items-end gap-1 h-4 px-1 shrink-0">
                      <span className={`w-1 rounded-full ${
                        isPlaying 
                          ? isDark ? 'bg-cyan-400 h-full animate-[bounce_0.8s_infinite_100ms]' : 'bg-pink-500 h-full animate-[bounce_0.8s_infinite_100ms]' 
                          : isDark ? 'bg-zinc-700 h-2' : 'bg-pink-300 h-2'
                      }`} />
                      <span className={`w-1 rounded-full ${
                        isPlaying 
                          ? isDark ? 'bg-pink-500 h-full animate-[bounce_0.8s_infinite_300ms]' : 'bg-purple-500 h-full animate-[bounce_0.8s_infinite_300ms]' 
                          : isDark ? 'bg-zinc-700 h-3' : 'bg-pink-300 h-3'
                      }`} />
                      <span className={`w-1 rounded-full ${
                        isPlaying 
                          ? isDark ? 'bg-cyan-400 h-full animate-[bounce_0.8s_infinite_200ms]' : 'bg-pink-500 h-full animate-[bounce_0.8s_infinite_200ms]' 
                          : isDark ? 'bg-zinc-700 h-1.5' : 'bg-pink-300 h-1.5'
                      }`} />
                      <span className={`w-1 rounded-full ${
                        isPlaying 
                          ? isDark ? 'bg-purple-500 h-full animate-[bounce_0.8s_infinite_400ms]' : 'bg-purple-600 h-full animate-[bounce_0.8s_infinite_400ms]' 
                          : isDark ? 'bg-zinc-700 h-2.5' : 'bg-pink-300 h-2.5'
                      }`} />
                    </div>
                  </div>

                  {/* Audio Progress Bar & Seek Slider (Tích hợp Thanh Phân Đoạn Bài Hát Kiểu YouTube Chapters) */}
                  {hasChapters ? (
                    <div className="space-y-1.5 px-0.5 py-0.5">
                      {/* Chapter Track Header Status */}
                      <div className={`flex items-center justify-between text-[10px] font-mono font-medium border rounded-xl px-2 py-1 transition-colors ${
                        isDark 
                          ? 'bg-cyan-500/10 border-cyan-400/30 text-cyan-400/90' 
                          : 'bg-[#F0EBFA] border-[#E2D9F3] text-[#1E152A]'
                      }`}>
                        <div className="flex items-center gap-1.5 truncate">
                          <span className={`font-extrabold text-[9px] px-1.5 py-0.2 rounded ${
                            isDark ? 'bg-cyan-400 text-zinc-950' : 'bg-pink-500 text-white shadow-xs'
                          }`}>
                            Bài {activeChapterIndex !== -1 ? activeChapterIndex + 1 : 1}/{currentChapters.length}
                          </span>
                          <span className={`truncate font-bold ${isDark ? 'text-zinc-100' : 'text-pink-950'}`}>
                            {currentSubChapter ? currentSubChapter.title : currentTrack.title}
                          </span>
                        </div>
                        <span className={`font-extrabold text-[10px] shrink-0 ${isDark ? 'text-pink-400' : 'text-purple-700'}`}>
                          Tổ hợp {currentChapters.length} bài
                        </span>
                      </div>

                      {/* Segmented Chapter Progress Bar */}
                      <div className="flex items-center gap-0.5 h-3 group cursor-pointer">
                        {currentChapters.map((chap, idx) => {
                          const chapStart = chap.startTime;
                          const chapEnd = currentChapters[idx + 1] ? currentChapters[idx + 1].startTime : (duration || chapStart + 180);
                          const chapDur = Math.max(1, chapEnd - chapStart);
                          
                          let pct = 0;
                          if (currentTime >= chapEnd) pct = 100;
                          else if (currentTime > chapStart) pct = Math.min(100, Math.max(0, ((currentTime - chapStart) / chapDur) * 100));

                          const isCurrent = idx === (activeChapterIndex !== -1 ? activeChapterIndex : 0);

                          return (
                            <div
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                performSeek(chapStart);
                              }}
                              className={`relative flex-1 h-1.5 rounded-sm overflow-hidden transition-all hover:h-2.5 ${
                                isCurrent 
                                  ? isDark ? 'bg-zinc-700 ring-1 ring-cyan-400/60' : 'bg-purple-100 ring-1 ring-pink-400/80' 
                                  : isDark ? 'bg-zinc-800/80' : 'bg-pink-200/80'
                              }`}
                              title={`Bài ${idx + 1}: ${chap.title} (${formatTime(chapStart)})`}
                            >
                              <div
                                className={`h-full transition-all ${
                                  isCurrent 
                                    ? isDark 
                                      ? 'bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500 shadow-[0_0_8px_rgba(34,211,238,0.8)]' 
                                      : 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]'
                                    : pct === 100 
                                      ? isDark ? 'bg-cyan-500/80' : 'bg-pink-400/80' 
                                      : 'bg-transparent'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          );
                        })}
                      </div>

                      <div className={`flex items-center justify-between text-[9px] font-mono ${isDark ? 'text-zinc-400' : 'text-pink-800/80 font-medium'}`}>
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>
                  ) : (
                    /* Standard Continuous Progress Bar */
                    <div className="space-y-1 px-0.5 py-0.5">
                      <div className={`flex items-center justify-between text-[10px] font-mono font-medium ${isDark ? 'text-cyan-400/90' : 'text-pink-800'}`}>
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        step="0.1"
                        value={currentTime}
                        onMouseDown={() => setIsSeeking(true)}
                        onMouseUp={() => setIsSeeking(false)}
                        onTouchStart={() => setIsSeeking(true)}
                        onTouchEnd={() => setIsSeeking(false)}
                        onChange={handleRangeSeek}
                        className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer transition-all ${
                          isDark 
                            ? 'bg-zinc-800 accent-cyan-400 hover:accent-cyan-300' 
                            : 'bg-pink-200/80 accent-pink-500 hover:accent-pink-600'
                        }`}
                        title={`Tua bài hát: ${formatTime(currentTime)} / ${formatTime(duration)}`}
                      />
                    </div>
                  )}

                  {/* Main Play Controls & Volume Slider */}
                  <div className="flex items-center justify-between gap-2 px-0.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => prevTrack(true)}
                        className={`p-1.5 transition-colors cursor-pointer ${
                          isDark ? 'text-zinc-400 hover:text-cyan-300' : 'text-pink-700 hover:text-pink-950'
                        }`}
                        title="Bài trước"
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>

                      <button
                        onClick={togglePlay}
                        className={`p-2 rounded-2xl font-bold transition-all cursor-pointer active:scale-95 ${
                          isPlaying
                            ? isDark
                              ? 'bg-cyan-500 text-zinc-950 shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                              : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]'
                            : isDark
                              ? 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700'
                              : 'bg-white text-pink-900 hover:bg-pink-50 border border-pink-300 shadow-xs'
                        }`}
                        title={isPlaying ? 'Tạm dừng' : 'Phát nhạc'}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                      </button>

                      <button
                        onClick={() => nextTrack(true)}
                        className={`p-1.5 transition-colors cursor-pointer ${
                          isDark ? 'text-zinc-400 hover:text-cyan-300' : 'text-pink-700 hover:text-pink-950'
                        }`}
                        title="Bài kế tiếp"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Dynamic Volume Control Slider */}
                    <div className={`flex items-center gap-2 px-2.5 py-1 border rounded-2xl shadow-inner ${
                      isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-[#E2D9F3]'
                    }`}>
                      <button onClick={toggleMute} className={`cursor-pointer ${isDark ? 'text-zinc-400 hover:text-cyan-300' : 'text-pink-700 hover:text-pink-950'}`}>
                        {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className={`w-16 sm:w-20 h-1.5 rounded-lg appearance-none cursor-pointer ${
                          isDark ? 'bg-zinc-800 accent-cyan-400' : 'bg-pink-200/80 accent-pink-500'
                        }`}
                        title={`Âm lượng: ${Math.round(volume * 100)}%`}
                      />
                      <span className={`text-[10px] font-mono w-6 text-right ${isDark ? 'text-cyan-400/80' : 'text-purple-700 font-bold'}`}>
                        {Math.round((isMuted ? 0 : volume) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* 2 DANH MỤC NHẠC DUY NHẤT: NHẠC CÓ SẴN VÀ NHẠC TÙY CHỌN */}
                  <div className="grid grid-cols-2 gap-2 py-0.5">
                    {[
                      { id: 'default', label: `🎶 Nhạc Có Sẵn (${SYSTEM_DEFAULT_TRACKS.length})` },
                      { id: 'custom', label: `🎵 Nhạc Tùy Chọn (${customTracks.length})` }
                    ].map((g) => {
                      const isActive = currentGenre === g.id || (g.id === 'default' && currentGenre !== 'custom');
                      return (
                        <button
                          key={g.id}
                          onClick={() => setGenre(g.id)}
                          className={`py-1.5 px-2 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer border text-center truncate ${
                            isActive
                              ? isDark
                                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                                : 'bg-[#F0EBFA] border-pink-400 text-pink-950 font-bold shadow-2xs'
                              : isDark
                                ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                                : 'bg-white border-[#E2D9F3] text-[#6B5E85] hover:bg-[#F0EBFA]'
                          }`}
                        >
                          {g.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* DYNAMIC SUB-SONGS CLICKABLE LIST (DANH SÁCH BÀI HÁT CON TRỰC QUAN NẰM TRONG TAB NỘI DUNG) */}
                  {hasChapters && (
                    <div className={`border rounded-2xl p-2.5 space-y-1.5 shadow-inner my-1 transition-colors ${
                      isDark 
                        ? 'bg-zinc-900/90 border-cyan-500/30' 
                        : 'bg-white border-[#E2D9F3] shadow-2xs'
                    }`}>
                      <div className="flex items-center justify-between px-1">
                        <span className={`text-[10px] font-mono font-bold flex items-center gap-1.5 ${
                          isDark ? 'text-cyan-300' : 'text-pink-900'
                        }`}>
                          <ListMusic className="w-3.5 h-3.5 text-pink-500" /> Danh sách {currentChapters.length} bài trong Tổ Hợp
                        </span>
                        <span className={`text-[9px] font-mono font-semibold animate-pulse ${
                          isDark ? 'text-cyan-400/80' : 'text-purple-700'
                        }`}>
                          ↕️ Cuộn xem tất cả {currentChapters.length} bài
                        </span>
                      </div>

                      {/* Scroll container mượt mà với thanh cuộn neon cyan */}
                      <div 
                        onPointerDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className="space-y-1 max-h-36 overflow-y-auto pr-1 custom-cyber-scrollbar overscroll-contain"
                      >
                        {currentChapters.map((chap, idx) => {
                          const isCurrent = idx === (activeChapterIndex !== -1 ? activeChapterIndex : 0);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                performSeek(chap.startTime);
                              }}
                              className={`w-full text-left p-1.5 rounded-xl text-[10px] font-medium flex items-center justify-between gap-2 transition-all cursor-pointer border ${
                                isCurrent
                                  ? isDark
                                    ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200 font-bold shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                                    : 'bg-[#F0EBFA] border-pink-300 text-[#1E152A] font-bold shadow-2xs'
                                  : isDark
                                    ? 'bg-zinc-950/60 border-zinc-800/60 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                                    : 'bg-white border-[#E2D9F3] text-[#6B5E85] hover:bg-[#F0EBFA] hover:text-[#1E152A]'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-mono font-extrabold shrink-0 ${
                                  isCurrent 
                                    ? isDark ? 'bg-cyan-400 text-zinc-950 shadow-[0_0_6px_rgba(34,211,238,0.8)]' : 'bg-pink-500 text-white shadow-xs'
                                    : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-pink-100 text-pink-700'
                                }`}>
                                  {idx + 1}
                                </span>
                                <span className="truncate">{chap.title}</span>
                              </div>
                              <span className={`font-mono text-[9px] shrink-0 ${isDark ? 'text-zinc-500' : 'text-pink-700/70'}`}>
                                {formatTime(chap.startTime)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Playlist Scroll Area */}
                  <div 
                    onPointerDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-cyber-scrollbar overscroll-contain"
                  >
                    {activePlaylist.map((t, idx) => {
                      const isSelected = t.id === currentTrack.id || t.url === currentTrack.url;
                      const trackChapCount = t.chapters?.length || (t.trackCount > 1 ? t.trackCount : 1);
                      return (
                        <div
                          key={t.id || idx}
                          onClick={() => selectTrack(idx)}
                          className={`p-2 rounded-xl flex items-center justify-between gap-2 transition-all cursor-pointer border ${
                            isSelected
                              ? isDark
                                ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-200 font-semibold'
                                : 'bg-[#F0EBFA] border-pink-300 text-[#1E152A] font-bold shadow-2xs'
                              : isDark
                                ? 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                                : 'bg-white border-[#E2D9F3] text-[#6B5E85] hover:bg-[#F0EBFA] hover:text-[#1E152A]'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-xs shrink-0">{t.cover || '🎵'}</span>
                            <div className="truncate">
                              <p className={`truncate text-[11px] leading-snug ${isSelected && !isDark ? 'text-pink-950 font-bold' : ''}`}>{t.title}</p>
                              <p className={`text-[9px] font-mono truncate ${
                                isDark ? 'text-zinc-500' : 'text-pink-700/70 font-medium'
                              }`}>
                                {trackChapCount > 1 ? `🎵 Tổ hợp ${trackChapCount} bài` : (t.artist || t.genre)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {isSelected && isPlaying && (
                              <span className={`w-1.5 h-1.5 rounded-full animate-ping ${isDark ? 'bg-cyan-400' : 'bg-pink-500'}`} />
                            )}
                            {currentGenre === 'custom' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeCustomTrack(t.id);
                                }}
                                className={`p-1 transition-colors ${isDark ? 'text-zinc-500 hover:text-rose-400' : 'text-pink-400 hover:text-rose-600'}`}
                                title="Xóa bài nhạc"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Track Action Footer */}
                  <button
                    onClick={() => setShowAddModal(true)}
                    className={`w-full py-2 border font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isDark
                        ? 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-400/30 text-cyan-300'
                        : 'bg-pink-100/70 hover:bg-pink-200/80 border-pink-300/80 text-pink-800'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm Link Nhạc Cá Nhân
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL THÊM LINK NHẠC & XÁC THỰC THÔNG MINH */}
      {showAddModal && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-md border rounded-3xl p-6 font-sans relative transition-colors ${
            isDark
              ? 'bg-zinc-950 border-cyan-500/40 text-zinc-100 shadow-[0_0_40px_rgba(6,182,212,0.2)]'
              : 'bg-[#faf0fa] border-pink-300 text-pink-950 shadow-[0_15px_50px_rgba(124,58,237,0.18)]'
          }`}>
            <button
              onClick={() => {
                setShowAddModal(false);
                setValidationResult(null);
                setValidationError('');
              }}
              className={`absolute top-4 right-4 p-1 cursor-pointer transition-colors ${
                isDark ? 'text-zinc-400 hover:text-white' : 'text-pink-600 hover:text-pink-950'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                isDark ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300' : 'bg-pink-100 border-pink-300 text-pink-600'
              }`}>
                <Music className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`font-bold text-base ${isDark ? 'text-zinc-100' : 'text-pink-950'}`}>Thêm Link Nhạc Tập Trung</h3>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-pink-700/80 font-medium'}`}>Hỗ trợ file .mp3, .wav, YouTube Music, Remix Mix</p>
              </div>
            </div>

            <form onSubmit={handleValidateInput} className="space-y-3.5">
              <div>
                <label className={`block text-xs font-mono mb-1 ${isDark ? 'text-cyan-400' : 'text-pink-800 font-bold'}`}>ĐƯỜNG DẪN (URL):</label>
                <input
                  type="url"
                  required
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://... (.mp3 hoặc YouTube link)"
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none font-mono ${
                    isDark 
                      ? 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-400' 
                      : 'bg-white border-pink-200 text-pink-950 placeholder:text-pink-400 focus:border-pink-500'
                  }`}
                />
              </div>

              {/* Tùy chọn chia số bài hát con cho video Mix */}
              <div>
                <label className={`block text-xs font-mono mb-1 ${isDark ? 'text-cyan-400' : 'text-pink-800 font-bold'}`}>
                  SỐ LƯỢNG BÀI HÁT TRONG MIX (Mặc định 16 bài):
                </label>
                <div className="flex items-center gap-2">
                  {[5, 10, 16, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCustomTrackCount(num)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition-all border cursor-pointer ${
                        customTrackCount === num
                          ? isDark
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                            : 'bg-pink-500 border-pink-600 text-white shadow-xs'
                          : isDark
                            ? 'bg-zinc-900 border-zinc-700 text-zinc-400'
                            : 'bg-white border-pink-200 text-pink-700 hover:bg-pink-50'
                      }`}
                    >
                      {num} Bài
                    </button>
                  ))}
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={customTrackCount}
                    onChange={(e) => setCustomTrackCount(parseInt(e.target.value, 10) || 16)}
                    className={`w-16 border rounded-xl px-2 py-1 text-xs font-mono text-center ${
                      isDark 
                        ? 'bg-zinc-900 border-zinc-700 text-zinc-100' 
                        : 'bg-white border-pink-200 text-pink-950'
                    }`}
                  />
                </div>
              </div>

              {/* Ô dán Timestamps tùy chọn từ mô tả YouTube */}
              <div>
                <label className={`block text-xs font-mono mb-1 ${isDark ? 'text-cyan-400' : 'text-pink-800 font-bold'}`}>
                  DANH SÁCH BÀI HÁT / TIMESTAMPS (Dán từ mô tả YouTube nếu có):
                </label>
                <textarea
                  rows="2"
                  value={timestampText}
                  onChange={(e) => setTimestampText(e.target.value)}
                  placeholder="Dán mô tả YouTube (Ví dụ: 00:00 Túy Âm, 03:45 Cao Ốc 20...)"
                  className={`w-full border rounded-xl p-2 text-xs focus:outline-none font-mono ${
                    isDark 
                      ? 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-400' 
                      : 'bg-white border-pink-200 text-pink-950 placeholder:text-pink-400 focus:border-pink-500'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={isValidating}
                className={`w-full py-2.5 font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50 ${
                  isDark 
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-zinc-950' 
                    : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-md'
                }`}
              >
                {isValidating ? 'Đang phân tích link & trích xuất bài hát...' : 'Xác thực & Chia Bài Hát'}
              </button>

              {/* Thông báo lỗi nếu link không phải audio */}
              {validationError && (
                <div className={`p-3 border rounded-xl text-xs flex items-center gap-2 ${
                  isDark ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800 font-medium'
                }`}>
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Kết quả xác thực thành công */}
              {validationResult && (
                <div className={`p-3 border rounded-2xl space-y-2.5 ${
                  isDark ? 'bg-zinc-900/90 border-cyan-400/40' : 'bg-white border-pink-300 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Link nhạc hợp lệ!
                    </span>
                    {validationResult.chapters?.length > 1 && (
                      <span className={`border px-2 py-0.5 rounded-full text-[10px] ${
                        isDark ? 'bg-pink-500/20 text-pink-300 border-pink-500/40' : 'bg-pink-100 text-pink-700 border-pink-300 font-bold'
                      }`}>
                        Tổ hợp {validationResult.chapters.length} bài hát
                      </span>
                    )}
                  </div>

                  <div className={`text-xs space-y-1 p-2.5 rounded-xl border ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-pink-50/70 border-pink-200 text-pink-950'
                  }`}>
                    <p className="font-bold truncate">🎵 {validationResult.title}</p>
                    <p className={`text-[10px] font-mono truncate ${isDark ? 'text-zinc-400' : 'text-pink-700'}`}>
                      Đã tách thành công: {validationResult.chapters?.length || 1} bài hát con
                    </p>
                  </div>

                  {/* Cảnh báo nếu phát hiện bài giảng */}
                  {validationResult.isLectureWarning && (
                    <div className={`p-2.5 border rounded-xl text-[11px] leading-relaxed flex items-start gap-2 ${
                      isDark ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}>
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                      <span>{validationResult.warningMessage}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleConfirmAdd}
                    className={`w-full py-2.5 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md ${
                      isDark
                        ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/20'
                        : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-pink-500/20'
                    }`}
                  >
                    Lưu & Phát {validationResult.chapters?.length || 1} Bài Hát Này Ngay
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
