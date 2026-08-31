"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAudioStore } from "@/store/useAudioStore";

export function useVietnameseTTS() {
  const [isSupported, setIsSupported] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [vietnameseVoice, setVietnameseVoice] = useState(null);
  const [voiceStatus, setVoiceStatus] = useState("loading");
  const utteranceRef = useRef(null);
  const currentAudioRef = useRef(null);
  const keepAliveIntervalRef = useRef(null);

  useEffect(() => {
    try {
      useAudioStore.getState().setDucked(isSpeaking);
    } catch (_) {}
  }, [isSpeaking]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!("speechSynthesis" in window)) {
      setIsSupported(false);
      setVoiceStatus("not_supported");
      return;
    }

    function rankVoice(voice) {
      const name = voice.name ? voice.name.toLowerCase() : "";
      const lang = voice.lang ? voice.lang.toLowerCase() : "";
      if (name.includes("natural") || name.includes("hoaimy") || name.includes("namminh")) return 0;
      if (name.includes("google") && lang.startsWith("vi")) return 1;
      if (lang.startsWith("vi") || name.includes("vietnam") || name.includes("tiếng việt")) return 2;
      return 3;
    }

    function loadVietnameseVoice() {
      if (!window.speechSynthesis) return false;
      const allVoices = window.speechSynthesis.getVoices() || [];
      const vietnameseVoices = allVoices.filter((v) => {
        const lang = v.lang ? v.lang.toLowerCase() : "";
        const name = v.name ? v.name.toLowerCase() : "";
        return (
          lang.startsWith("vi") ||
          name.includes("vietnam") ||
          name.includes("tiếng việt") ||
          name.includes("hoaimy") ||
          name.includes("namminh")
        );
      });

      if (vietnameseVoices.length > 0) {
        const sorted = [...vietnameseVoices].sort((a, b) => rankVoice(a) - rankVoice(b));
        setVietnameseVoice(sorted[0]);
        setVoiceStatus("found");
        return true;
      }

      setVietnameseVoice(null);
      setVoiceStatus("native_lang_fallback");
      return false;
    }

    loadVietnameseVoice();

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVietnameseVoice;
    }

    const timers = [100, 300, 700, 1500].map((d) => setTimeout(loadVietnameseVoice, d));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  function sanitizeTextForSpeech(rawText) {
    if (!rawText) return "";
    return rawText
      .replace(/\[\[LINK:.*?:.*?\]\]/g, "")
      .replace(/\[\[NAV:.*?\]\]/g, "")
      .replace(/\[\[TOGGLE_THEME\]\]/g, "")
      .replace(/\[\[AUDIO_.*?\]\]/g, "")
      .replace(/\[\[.*?\]\]/g, "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/[*_#~>]/g, " ")
      .replace(/#{1,6}\s?/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  const speakWithAudioFallback = useCallback((cleanText) => {
    try {
      const rawSentences = cleanText.split(/(?<=[.!?;\n])\s+/).filter(s => s.trim().length > 0);
      const chunks = [];
      let currentChunk = "";
      for (const sentence of rawSentences) {
        if ((currentChunk + " " + sentence).length < 160) {
          currentChunk += (currentChunk ? " " : "") + sentence.trim();
        } else {
          if (currentChunk) chunks.push(currentChunk);
          currentChunk = sentence.trim();
        }
      }
      if (currentChunk) chunks.push(currentChunk);
      const finalChunks = chunks.length > 0 ? chunks : [cleanText.slice(0, 160)];

      let index = 0;
      setIsSpeaking(true);

      const playNextChunk = () => {
        if (index >= finalChunks.length) {
          setIsSpeaking(false);
          return;
        }

        const chunkText = finalChunks[index];
        index++;

        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunkText)}&tl=vi&client=tw-ob`;
        const audio = new Audio();
        audio.crossOrigin = "anonymous";
        audio.src = url;
        currentAudioRef.current = audio;

        audio.onended = () => playNextChunk();
        audio.onerror = () => {
          const backupUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunkText)}&tl=vi&client=gtx`;
          const backupAudio = new Audio(backupUrl);
          currentAudioRef.current = backupAudio;
          backupAudio.onended = () => playNextChunk();
          backupAudio.onerror = () => setIsSpeaking(false);
          backupAudio.play().catch(() => setIsSpeaking(false));
        };

        audio.play().catch(() => playNextChunk());
      };

      playNextChunk();
    } catch (err) {
      console.warn("Audio fallback error:", err);
      setIsSpeaking(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined") return;
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch (_) {}
      currentAudioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text, options = {}) => {
      if (typeof window === "undefined") return;

      const cleanText = sanitizeTextForSpeech(text);
      if (!cleanText) return;

      stop();

      // CHỈ sử dụng Web Speech API khi thiết bị thực sự CÓ giọng Tiếng Việt cài sẵn (vietnameseVoice !== null)
      if ("speechSynthesis" in window && window.speechSynthesis && vietnameseVoice) {
        try {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }

          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.lang = vietnameseVoice.lang || "vi-VN";
          utterance.voice = vietnameseVoice;
          utterance.rate = options.rate ?? 0.95;
          utterance.pitch = options.pitch ?? 1;
          utterance.volume = options.volume ?? 1;

          utterance.onstart = () => {
            setIsSpeaking(true);
            if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
            keepAliveIntervalRef.current = setInterval(() => {
              if (window.speechSynthesis && window.speechSynthesis.speaking) {
                window.speechSynthesis.pause();
                window.speechSynthesis.resume();
              } else {
                clearInterval(keepAliveIntervalRef.current);
              }
            }, 10000);
          };

          utterance.onend = () => {
            if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
            setIsSpeaking(false);
          };

          utterance.onerror = (e) => {
            if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
            console.warn("SpeechSynthesis error, falling back to Audio engine:", e);
            speakWithAudioFallback(cleanText);
          };

          utteranceRef.current = utterance;
          window.speechSynthesis.speak(utterance);
          setIsSpeaking(true);
          return;
        } catch (err) {
          console.warn("SpeechSynthesis exception, fallback to Audio:", err);
        }
      }

      // Nếu không có giọng Tiếng Việt trong hệ thống (vietnameseVoice === null), tự động dùng thẳng Audio Fallback phát âm chuẩn 100%
      speakWithAudioFallback(cleanText);
    },
    [vietnameseVoice, stop, speakWithAudioFallback]
  );

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isSupported,
    isSpeaking,
    voiceStatus,
    vietnameseVoice,
    speak,
    stop,
  };
}
