// Danh mục nhạc tuyển chọn sẵn (High Quality Royalty-Free Streams)
export const DEFAULT_AUDIO_CATALOG = {
  lofi: [
    {
      id: 'lofi_1',
      title: 'Midnight Quantum Study Beats',
      artist: 'Cyber Lofi Lab',
      genre: 'Lo-Fi Chill',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      type: 'direct',
      cover: '🎧'
    },
    {
      id: 'lofi_2',
      title: 'Cosmic Coffee & Code',
      artist: 'Orbital Beats',
      genre: 'Lo-Fi Chill',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      type: 'direct',
      cover: '☕'
    },
    {
      id: 'lofi_3',
      title: 'Deep Focus Chillhop',
      artist: 'Starlight Audio',
      genre: 'Lo-Fi Chill',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      type: 'direct',
      cover: '🌙'
    }
  ],
  scifi: [
    {
      id: 'scifi_1',
      title: 'Spaceship Cockpit Ambient',
      artist: 'Javit Core Soundscape',
      genre: 'Sci-Fi Cyber',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
      type: 'direct',
      cover: '🚀'
    },
    {
      id: 'scifi_2',
      title: 'Cyberpunk Matrix Pulse',
      artist: 'Neon Synthesizer',
      genre: 'Sci-Fi Cyber',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
      type: 'direct',
      cover: '⚡'
    }
  ],
  brainwave: [
    {
      id: 'brain_1',
      title: 'Alpha Wave Deep Concentration',
      artist: 'Neuro Focus Lab',
      genre: 'Alpha 10Hz',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3',
      type: 'direct',
      cover: '🧠'
    },
    {
      id: 'brain_2',
      title: 'Theta Wave Memory Retention',
      artist: 'Cognitive Audio',
      genre: 'Theta 6Hz',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3',
      type: 'direct',
      cover: '🔮'
    }
  ],
  nature: [
    {
      id: 'nature_1',
      title: 'Lab Window Gentle Rain',
      artist: 'Nature Ambience',
      genre: 'White Noise',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
      type: 'direct',
      cover: '🌧️'
    },
    {
      id: 'nature_2',
      title: 'Cosmic Solar Winds',
      artist: 'Space Soundscape',
      genre: 'Ambient Noise',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
      type: 'direct',
      cover: '🌌'
    }
  ]
};

// Gộp toàn bộ nhạc hệ thống có sẵn vào 1 danh sách duy nhất
export const SYSTEM_DEFAULT_TRACKS = [
  ...DEFAULT_AUDIO_CATALOG.lofi,
  ...DEFAULT_AUDIO_CATALOG.scifi,
  ...DEFAULT_AUDIO_CATALOG.brainwave,
  ...DEFAULT_AUDIO_CATALOG.nature
];

// Từ khóa phát hiện bài giảng / luyện đề (Warning Keywords)
const LECTURE_KEYWORDS = [
  'bài giảng', 'bai giang', 'giải đề', 'giai de', 'thuyết trình', 'thuyet trinh',
  'tiết học', 'tiet hoc', 'chữa đề', 'chua de', 'toán 12', 'toan 12', 'vật lý', 'vat ly',
  'hóa học', 'hoa hoc', 'sinh học', 'luyện thi', 'luyen thi', 'lớp 10', 'lớp 11', 'lớp 12',
  'bài 1', 'bài 2', 'bài 3', 'chương 1', 'chương 2', 'tập 1', 'tập 2'
];

/**
 * Trích xuất YouTube Video ID từ link bất kỳ
 */
export function getYouTubeVideoId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2] && match[2].length === 11) ? match[2] : null;
}

/**
 * Trích xuất danh sách mốc thời gian từ văn bản Timestamps dán vào (vd: 00:00 Túy Âm, 03:45 Cao Ốc 20)
 */
export function parseTimestampsText(text) {
  if (!text || typeof text !== 'string') return [];

  const lines = text.split('\n');
  const chapters = [];
  const timeRegex = /(?:(\d{1,2}):)?(\d{1,2}):(\d{2})/;

  lines.forEach((line, idx) => {
    const match = line.match(timeRegex);
    if (match) {
      const fullTimeStr = match[0];
      const hours = match[1] ? parseInt(match[1], 10) : 0;
      const mins = parseInt(match[2], 10);
      const secs = parseInt(match[3], 10);
      const totalSecs = hours * 3600 + mins * 60 + secs;

      let songTitle = line
        .replace(fullTimeStr, '')
        .replace(/^\s*\d+[\.\-\)]\s*/, '')
        .trim();

      if (!songTitle) {
        songTitle = `Bài ${idx + 1}`;
      }

      chapters.push({
        id: idx + 1,
        title: songTitle,
        startTime: totalSecs
      });
    }
  });

  chapters.sort((a, b) => a.startTime - b.startTime);
  return chapters;
}

/**
 * Trích xuất danh sách phân đoạn bài hát (Chapters/Sub-tracks) từ tiêu đề video Remix/Mix
 */
export function parseTrackChaptersFromTitle(title, totalDuration = 3600) {
  if (!title || typeof title !== 'string') return [];

  const rawParts = title
    .split(/[,|/+]|(?:\s-\s)|\bx\b|\b&\b/)
    .map(p => p.trim())
    .filter(p => (
      p.length > 1 && 
      !p.toLowerCase().includes('official') && 
      !p.toLowerCase().includes('audio') && 
      !p.toLowerCase().includes('mv') && 
      !p.toLowerCase().includes('video') &&
      !p.toLowerCase().includes('lyric') &&
      !p.toLowerCase().includes('full album') &&
      !p.toLowerCase().includes('những bản nhạc')
    ));

  if (rawParts.length <= 1) return [];

  const estDuration = totalDuration > 0 ? totalDuration : rawParts.length * 210;
  const segmentDuration = estDuration / rawParts.length;

  return rawParts.map((partTitle, idx) => ({
    id: idx + 1,
    title: partTitle,
    startTime: Math.round(idx * segmentDuration),
    endTime: Math.round((idx + 1) * segmentDuration)
  }));
}

/**
 * Tạo danh sách N bài hát con cho video Mix theo số lượng mong muốn (mặc định 16 bài)
 */
export function generateChaptersByCount(baseTitle, count = 16, totalDuration = 3600) {
  const numTracks = Math.max(1, parseInt(count, 10) || 16);
  const dur = totalDuration > 0 ? totalDuration : numTracks * 210;
  const seg = dur / numTracks;

  const parsedNames = parseTrackChaptersFromTitle(baseTitle, totalDuration);

  const chapters = [];
  for (let i = 0; i < numTracks; i++) {
    const defaultName = parsedNames[i] ? parsedNames[i].title : `Bài ${i + 1}`;
    chapters.push({
      id: i + 1,
      title: defaultName,
      startTime: Math.round(i * seg),
      endTime: Math.round((i + 1) * seg)
    });
  }
  return chapters;
}

/**
 * Hàm xác thực và kiểm tra tính hợp lệ của Link Nhạc do người dùng dán vào
 */
export async function validateAudioUrl(inputUrl, timestampText = '', customTrackCount = 16) {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { valid: false, message: 'Vui lòng nhập đường dẫn (URL) hợp lệ.' };
  }

  const url = inputUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return { valid: false, message: 'Đường dẫn phải bắt đầu bằng http:// hoặc https://' };
  }

  const lowerUrl = url.toLowerCase();

  // 1. Kiểm tra nếu là Link YouTube / YouTube Music / YouTube Shorts
  const ytId = getYouTubeVideoId(url);
  if (ytId) {
    let videoTitle = `Nhạc YouTube (${ytId})`;
    let artistName = 'YouTube Creator';
    let isLecture = false;

    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`;
      const res = await fetch(oembedUrl);
      if (res.ok) {
        const data = await res.json();
        videoTitle = data.title || videoTitle;
        artistName = data.author_name || artistName;
        isLecture = LECTURE_KEYWORDS.some(kw => videoTitle.toLowerCase().includes(kw));
      }
    } catch (err) {
      console.warn('Lỗi gọi YouTube oEmbed API:', err);
    }

    let chapters = parseTimestampsText(timestampText);

    if (chapters.length === 0) {
      chapters = parseTrackChaptersFromTitle(videoTitle);
    }

    if (chapters.length < 5) {
      chapters = generateChaptersByCount(videoTitle, customTrackCount || 16, 3600);
    }

    return {
      valid: true,
      type: 'youtube',
      youtubeId: ytId,
      url: url,
      title: videoTitle,
      artist: artistName,
      cover: '▶️',
      chapters: chapters,
      trackCount: chapters.length,
      isLectureWarning: isLecture,
      warningMessage: isLecture 
        ? '⚠️ Link này có vẻ là video bài giảng/luyện đề. Hệ thống vẫn lưu nhưng khuyên bạn dùng nhạc không lời để học tập tốt hơn!' 
        : null
    };
  }

  // 2. Kiểm tra nếu là Link Tệp Audio Trực Tiếp (.mp3, .wav, .aac, .m4a, .ogg, .flac)
  const isDirectAudio = /\.(mp3|wav|aac|m4a|ogg|flac|m3u8)(\?.*)?$/i.test(url);
  if (isDirectAudio) {
    const fileName = url.split('/').pop().split('?')[0];
    return {
      valid: true,
      type: 'direct',
      url: url,
      title: decodeURIComponent(fileName) || 'Nhạc Cá Nhân (.mp3)',
      artist: 'Nguồn âm thanh trực tiếp',
      cover: '🎵',
      chapters: [],
      trackCount: 1,
      isLectureWarning: false
    };
  }

  // 3. Link Zing MP3 / Nhaccuatui / SoundCloud / Web Stream
  if (lowerUrl.includes('soundcloud.com') || lowerUrl.includes('zingmp3') || lowerUrl.includes('nhaccuatui') || lowerUrl.includes('stream') || lowerUrl.includes('audio')) {
    return {
      valid: true,
      type: 'stream',
      url: url,
      title: 'Âm thanh Trực tuyến',
      artist: 'Web Audio Stream',
      cover: '☁️',
      chapters: [],
      trackCount: 1,
      isLectureWarning: false
    };
  }

  // 4. Chấp nhận tất cả các liên kết Web âm thanh/media hợp lệ khác
  try {
    const urlObj = new URL(url);
    const domainName = urlObj.hostname.replace('www.', '');
    const pathSnippet = urlObj.pathname.length > 1 ? urlObj.pathname.substring(0, 20) : '';

    return {
      valid: true,
      type: 'direct',
      url: url,
      title: `Nhạc Cá Nhân (${domainName}${pathSnippet})`,
      artist: domainName,
      cover: '🎧',
      chapters: [],
      trackCount: 1,
      isLectureWarning: false
    };
  } catch (err) {
    return {
      valid: false,
      message: 'Không thể nhận diện liên kết. Vui lòng nhập link HTTP/HTTPS hợp lệ.'
    };
  }
}
