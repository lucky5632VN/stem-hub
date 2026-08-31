import { create } from 'zustand';
import { DEFAULT_AUDIO_CATALOG, SYSTEM_DEFAULT_TRACKS } from '@/lib/audioCatalog';

const LOCAL_STORAGE_CUSTOM_TRACKS = 'stem_hub_custom_music_tracks';
const LOCAL_STORAGE_VOLUME = 'stem_hub_user_music_volume';

export const useAudioStore = create((set, get) => ({
  // State cơ bản
  isPlaying: false,
  volume: 0.6,
  savedVolume: 0.6,
  isMuted: false,
  isDucked: false, // Giảm âm lượng khi Javit AI đang nói (Audio Ducking)
  currentGenre: 'default', // 'default' (Nhạc Có Sẵn) | 'custom' (Nhạc Tùy Chọn)
  
  // Track đang được phát thực tế (Độc lập với danh mục hiển thị bên dưới)
  playingTrack: SYSTEM_DEFAULT_TRACKS[0],

  // State Widget Nổi (Mặc định ẩn hoàn toàn khi vào trang web, bật nút trên Header mới xuất hiện)
  isWidgetOpen: false,
  isWidgetMinimized: true,

  // Điều khiển Widget Nổi
  toggleWidget: () => set((state) => ({ isWidgetOpen: !state.isWidgetOpen })),

  // Tương tác từ nút Header: Bấm mở ngay màn hình đầy đủ, bấm lần nữa đóng lại
  toggleHeaderWidget: () => set((state) => {
    if (!state.isWidgetOpen || state.isWidgetMinimized) {
      return { isWidgetOpen: true, isWidgetMinimized: false };
    }
    return { isWidgetOpen: false };
  }),

  openWidget: () => set({ isWidgetOpen: true, isWidgetMinimized: false }),
  closeWidget: () => set({ isWidgetOpen: false }),
  toggleMinimizeWidget: () => set((state) => ({ isWidgetMinimized: !state.isWidgetMinimized })),
  setMinimizedWidget: (minimized) => set({ isWidgetMinimized: minimized }),

  // Danh sách nhạc mặc định + nhạc người dùng tự thêm
  customTracks: [],
  activePlaylist: SYSTEM_DEFAULT_TRACKS,

  // Hành động khởi tạo
  initAudioStore: () => {
    try {
      const state = get();
      let currentG = state.currentGenre;
      
      // Chuyển đổi tương thích nếu state cũ lưu genre lofi/scifi...
      if (currentG !== 'custom') currentG = 'default';

      let freshPlaylist = SYSTEM_DEFAULT_TRACKS;
      
      if (typeof window !== 'undefined') {
        const savedCustom = localStorage.getItem(LOCAL_STORAGE_CUSTOM_TRACKS);
        if (savedCustom) {
          const parsed = JSON.parse(savedCustom);
          if (Array.isArray(parsed)) {
            set({ customTracks: parsed });
            if (currentG === 'custom') {
              freshPlaylist = parsed.length > 0 ? parsed : SYSTEM_DEFAULT_TRACKS;
            }
          }
        }

        const savedVol = localStorage.getItem(LOCAL_STORAGE_VOLUME);
        if (savedVol !== null) {
          const parsedVol = parseFloat(savedVol);
          if (!isNaN(parsedVol)) {
            const clamped = Math.max(0, Math.min(1, parsedVol));
            set({ volume: clamped, savedVolume: clamped, isMuted: clamped === 0 });
          }
        }
      }

      const activePlaying = state.playingTrack || freshPlaylist[0];
      set({ 
        currentGenre: currentG,
        activePlaylist: freshPlaylist,
        playingTrack: activePlaying,
        isPlaying: false
      });
    } catch (err) {
      console.warn('Không thể tải dữ liệu âm thanh:', err);
    }
  },

  // Điều khiển phát nhạc
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setVolume: (vol) => {
    const clamped = Math.max(0, Math.min(1, vol));
    set({ volume: clamped, savedVolume: clamped, isMuted: clamped === 0 });
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_VOLUME, clamped.toString());
      }
    } catch (_) {}
  },

  toggleMute: () => {
    const state = get();
    if (state.isMuted) {
      const restoreVol = state.savedVolume > 0 ? state.savedVolume : 0.5;
      set({ isMuted: false, volume: restoreVol });
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_VOLUME, restoreVol.toString());
        }
      } catch (_) {}
    } else {
      set({ isMuted: true, volume: 0 });
    }
  },

  // Audio Ducking khi Javit AI nói
  setDucked: (ducked) => {
    set({ isDucked: ducked });
  },

  // Đổi Thể loại nhạc (Chỉ có 2 danh mục: default - Nhạc Có Sẵn & custom - Nhạc Tùy Chọn)
  setGenre: (genre) => {
    const state = get();
    const targetGenre = genre === 'custom' ? 'custom' : 'default';
    let playlist = SYSTEM_DEFAULT_TRACKS;

    if (targetGenre === 'custom') {
      playlist = state.customTracks.length > 0 ? state.customTracks : SYSTEM_DEFAULT_TRACKS;
    }

    set({
      currentGenre: targetGenre,
      activePlaylist: playlist
    });
  },

  // Chuyển bài kế tiếp / trước đó trong danh sách hiện tại
  nextTrack: (forcePlay) => {
    const { activePlaylist, playingTrack, isPlaying } = get();
    if (!activePlaylist || activePlaylist.length === 0) return;
    
    const currIdx = activePlaylist.findIndex(t => t.id === playingTrack?.id || t.url === playingTrack?.url);
    const nextIdx = currIdx !== -1 ? (currIdx + 1) % activePlaylist.length : 0;
    
    const shouldPlay = typeof forcePlay === 'boolean' ? forcePlay : isPlaying;
    set({ playingTrack: activePlaylist[nextIdx], isPlaying: shouldPlay });
  },

  prevTrack: (forcePlay) => {
    const { activePlaylist, playingTrack, isPlaying } = get();
    if (!activePlaylist || activePlaylist.length === 0) return;
    
    const currIdx = activePlaylist.findIndex(t => t.id === playingTrack?.id || t.url === playingTrack?.url);
    const prevIdx = currIdx !== -1 ? (currIdx - 1 + activePlaylist.length) % activePlaylist.length : 0;
    
    const shouldPlay = typeof forcePlay === 'boolean' ? forcePlay : isPlaying;
    set({ playingTrack: activePlaylist[prevIdx], isPlaying: shouldPlay });
  },

  // Chọn bài nhạc cụ thể từ danh sách bên dưới
  selectTrack: (index) => {
    const { activePlaylist } = get();
    if (index >= 0 && index < activePlaylist.length) {
      set({ playingTrack: activePlaylist[index], isPlaying: true });
    }
  },

  // Thêm bài nhạc tùy chỉnh từ người dùng (Phát ngay bài mới thêm)
  addCustomTrack: (track) => {
    const state = get();
    const updated = [track, ...state.customTracks];
    set({ customTracks: updated });

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_CUSTOM_TRACKS, JSON.stringify(updated));
      }
    } catch (_) {}

    set({
      currentGenre: 'custom',
      activePlaylist: updated,
      playingTrack: track,
      isPlaying: true
    });
  },

  removeCustomTrack: (trackId) => {
    const state = get();
    const updated = state.customTracks.filter((t) => t.id !== trackId);
    set({ customTracks: updated });

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_CUSTOM_TRACKS, JSON.stringify(updated));
      }
    } catch (_) {}

    if (state.currentGenre === 'custom') {
      const playlist = updated.length > 0 ? updated : SYSTEM_DEFAULT_TRACKS;
      set({
        activePlaylist: playlist,
        playingTrack: state.playingTrack?.id === trackId ? playlist[0] : state.playingTrack
      });
    }
  }
}));
