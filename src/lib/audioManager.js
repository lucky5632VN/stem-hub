/**
 * QUẢN LÝ ÂM THANH TOÀN CỤC (GLOBAL AUDIO MANAGER)
 * Cung cấp giao diện phát nhạc nền và hiệu ứng âm thanh Sci-Fi
 */

import { playSound } from './sound';

class AudioManager {
  constructor() {
    this.currentTrack = null;
    this.audioElement = null;
  }

  /**
   * Phát thể loại nhạc được chỉ định bởi AI
   * @param {string} genre Thể loại nhạc ('sci-fi', 'ambient', 'focus', 'victory', 'relax')
   */
  playGenre(genre = 'sci-fi') {
    try {
      // Kích hoạt hiệu ứng click xác nhận
      playSound.click();

      if (typeof window === 'undefined') return;

      console.log(`🎵 [AudioManager] Executing playGenre: ${genre}`);

      // Nếu đã có âm thanh phát trước đó
      if (this.audioElement) {
        this.audioElement.pause();
      }

      // Tái sử dụng âm thanh từ sound.js hoặc tạo hiệu ứng Web Audio Synth nhẹ
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Tần số tương ứng thể loại
        let freq = 440;
        if (genre === 'sci-fi') freq = 523.25; // C5 synth
        else if (genre === 'ambient') freq = 329.63; // E4 soft
        else if (genre === 'focus') freq = 392.00; // G4 steady
        else if (genre === 'victory') freq = 659.25; // E5 triumphant

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 1.5);
      }
    } catch (err) {
      console.warn("⚠️ Audio playback error:", err);
    }
  }

  stopMusic() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
  }
}

export const globalAudio = new AudioManager();
