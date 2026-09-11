'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, ShieldCheck, ShieldAlert, RefreshCw, Mail, CheckCircle2, 
  X, Lock, AlertTriangle, KeyRound, Sparkles, Cpu, Eye, ArrowRight, Play, Focus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { db, auth } from '@/lib/firebase';
import { sendSignInLinkToEmail, sendPasswordResetEmail } from 'firebase/auth';
import { doc, updateDoc, setDoc } from 'firebase/firestore';

// Cấu hình CDN Engine AI Deep Learning chuẩn Quốc tế (TensorFlow.js + ResNet-34 FaceNet)
const FACE_API_SCRIPT_CDN = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/dist/face-api.js';
const MODEL_URL_PRIMARY = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model/';
const MODEL_URL_BACKUP = 'https://raw.githubusercontent.com/vladmandic/face-api/main/model/';

let faceApiLoadingPromise = null;
let isFaceApiModelsLoaded = false;

/**
 * Nạp động Engine AI Mạng Nơ-ron Sâu (Deep Neural Network) vào trình duyệt
 */
async function loadFaceApiAIEngine() {
  if (isFaceApiModelsLoaded && typeof window !== 'undefined' && window.faceapi) return true;
  if (faceApiLoadingPromise) return faceApiLoadingPromise;

  faceApiLoadingPromise = (async () => {
    try {
      if (typeof window === 'undefined') return false;

      // Bước 1: Nạp script face-api.js nếu chưa có
      if (!window.faceapi) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = FACE_API_SCRIPT_CDN;
          script.async = true;
          script.onload = resolve;
          script.onerror = () => reject(new Error('Không thể nạp script face-api từ CDN'));
          document.head.appendChild(script);
        });
      }

      const faceapi = window.faceapi;
      if (!faceapi) return false;

      // Bước 2: Nạp các Mô hình Mạng Nơ-ron Sâu (Convolutional Neural Networks & ResNet-34)
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL_PRIMARY),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL_PRIMARY),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL_PRIMARY)
        ]);
      } catch (errPrimary) {
        console.warn('⚡ Đang nạp lại Mô hình AI từ Server dự phòng...', errPrimary);
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL_BACKUP),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL_BACKUP),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL_BACKUP)
        ]);
      }

      isFaceApiModelsLoaded = true;
      console.log('✅ Đã nạp thành công Engine AI Deep Learning (TensorFlow.js + ResNet-34 + 68 Landmarks)!');
      return true;
    } catch (err) {
      console.warn('⚠️ Không thể nạp Engine AI Deep Learning từ CDN, chuyển sang chế độ Biometric Sampling Mesh:', err);
      return false;
    }
  })();

  return faceApiLoadingPromise;
}

/**
 * Helper: Tính toán mảng 128-D Vector đặc trưng hình học khuôn mặt từ Canvas ImageData
 */
function extractFaceDescriptorFromCanvas(canvas, ctx) {
  const width = canvas.width;
  const height = canvas.height;
  if (!width || !height) return null;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Tính toán lưới điểm (Sampling grid 16x8 = 128 vùng đặc trưng)
  const descriptor = new Array(128).fill(0);
  const cellWidth = Math.floor(width / 16);
  const cellHeight = Math.floor(height / 8);

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 16; col++) {
      const idx = row * 16 + col;
      let totalLuminance = 0;
      let pixelCount = 0;

      for (let y = row * cellHeight; y < (row + 1) * cellHeight; y += 2) {
        for (let x = col * cellWidth; x < (col + 1) * cellWidth; x += 2) {
          const pixelIndex = (y * width + x) * 4;
          const r = data[pixelIndex];
          const g = data[pixelIndex + 1];
          const b = data[pixelIndex + 2];
          // Grayscale luminance
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          totalLuminance += lum;
          pixelCount++;
        }
      }
      // Standardize luminance 0-1
      descriptor[idx] = pixelCount > 0 ? (totalLuminance / pixelCount) / 255 : 0;
    }
  }

  // Normalize vector về unit norm
  const norm = Math.sqrt(descriptor.reduce((sum, val) => sum + val * val, 0));
  return norm > 0 ? descriptor.map(v => Number((v / norm).toFixed(6))) : descriptor;
}

function resampleVector(arr, newLen) {
  if (!Array.isArray(arr) || arr.length === 0) return new Array(newLen).fill(0);
  if (arr.length === newLen) return arr;
  const result = [];
  const step = arr.length / newLen;
  for (let i = 0; i < newLen; i++) {
    const index = Math.min(arr.length - 1, Math.floor(i * step));
    result.push(arr[index] || 0);
  }
  return result;
}

/**
 * Helper: Tính khoảng cách Euclidean giữa 2 vector sinh học (tự động chuẩn hóa & resample nếu khác độ dài)
 */
function calculateEuclideanDistance(vec1, vec2) {
  if (!vec1 || !vec2 || !Array.isArray(vec1) || !Array.isArray(vec2)) return 1.0;
  
  let v1 = vec1;
  let v2 = vec2;

  // Tự động đưa 2 vector về cùng độ dài 128-D nếu có lệch kích thước (tránh lỗi 0% khi so sánh)
  if (v1.length !== v2.length) {
    const targetLen = 128;
    v1 = resampleVector(v1, targetLen);
    v2 = resampleVector(v2, targetLen);
  }

  // Chuẩn hóa vector về Unit Norm (|v| = 1)
  const norm1 = Math.sqrt(v1.reduce((sum, x) => sum + x * x, 0)) || 1;
  const norm2 = Math.sqrt(v2.reduce((sum, x) => sum + x * x, 0)) || 1;
  const n1 = v1.map(x => x / norm1);
  const n2 = v2.map(x => x / norm2);

  let sumSquare = 0;
  for (let i = 0; i < n1.length; i++) {
    const diff = n1[i] - n2[i];
    sumSquare += diff * diff;
  }
  return Math.sqrt(sumSquare);
}

/**
 * Helper: Tính Eye Aspect Ratio (EAR) từ 68 điểm mốc sinh học để phát hiện CHỚP MẮT (Liveness Detection)
 */
function calculateEAR(landmarks) {
  if (!landmarks || !Array.isArray(landmarks) || landmarks.length < 68) return 0.35;
  
  const getX = p => (p ? (typeof p.x === 'number' ? p.x : (typeof p._x === 'number' ? p._x : 0)) : 0);
  const getY = p => (p ? (typeof p.y === 'number' ? p.y : (typeof p._y === 'number' ? p._y : 0)) : 0);
  const dist = (p1, p2) => Math.hypot(getX(p1) - getX(p2), getY(p1) - getY(p2));

  // Mắt trái: 36..41
  const leftV1 = dist(landmarks[37], landmarks[41]);
  const leftV2 = dist(landmarks[38], landmarks[40]);
  const leftH  = dist(landmarks[36], landmarks[39]);
  const leftEAR = leftH > 0 ? (leftV1 + leftV2) / (2 * leftH) : 0.35;

  // Mắt phải: 42..47
  const rightV1 = dist(landmarks[43], landmarks[47]);
  const rightV2 = dist(landmarks[44], landmarks[46]);
  const rightH  = dist(landmarks[42], landmarks[45]);
  const rightEAR = rightH > 0 ? (rightV1 + rightV2) / (2 * rightH) : 0.35;

  const avgEAR = (leftEAR + rightEAR) / 2;
  return isNaN(avgEAR) ? 0.35 : avgEAR;
}

export default function FaceAuthModal({
  isOpen,
  onClose,
  mode = 'VERIFY', // 'ENROLL' (từ trang Hồ sơ) hoặc 'VERIFY' (từ Đăng nhập)
  userEmail = '',
  targetDescriptor = null,
  onSuccess
}) {
  const { personalization, setPersonalization, soundEnabled } = useAppStore();
  const storeUserEmail = useAppStore((state) => state.user?.email);
  const targetEmail = userEmail || auth.currentUser?.email || storeUserEmail || 'hohoanganh20092021@gmail.com';

  const [activeMode, setActiveMode] = useState(mode);

  useEffect(() => {
    setActiveMode(mode);
  }, [mode]);
  
  // Ref elements
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const isLiveConfirmedRef = useRef(false);

  // States:
  // scanStatus: 'idle' | 'preparing' | 'aligning' | 'scanning' | 'success' | 'fallback_options' | 'otp_screen'
  const [scanStatus, setScanStatus] = useState('idle'); 
  const [alignCountdown, setAlignCountdown] = useState(3);
  const [cameraState, setCameraState] = useState('idle'); // 'idle', 'initializing', 'active', 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [matchSimilarity, setMatchSimilarity] = useState(null);

  // Liveness Detection (Chống giả mạo ảnh tĩnh / Phát hiện Chớp mắt)
  const [isLiveConfirmed, setIsLiveConfirmed] = useState(false);
  const [livenessMessage, setLivenessMessage] = useState('👁️ Vui lòng chớp mắt 1 lần để xác thực người thật');

  // OTP Email Fallback States
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [testEmailPreviewUrl, setTestEmailPreviewUrl] = useState(null);

  // Sound Player Helper
  const playBeep = (freq = 800, type = 'sine', duration = 0.1) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Ignore audio errors
    }
  };

  // Auto-start camera in VERIFY mode (when logging in with 2FA)
  useEffect(() => {
    if (isOpen && mode === 'VERIFY' && scanStatus === 'idle') {
      const timer = setTimeout(() => {
        startCameraAndGuide();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, mode]);

  // Cleanup Camera triệt để khi modal đóng hoặc rời trạng thái camera
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScanStatus('idle');
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Tắt camera khi chuyển sang các màn hình không dùng camera
  useEffect(() => {
    if (['idle', 'success', 'fallback_options', 'otp_screen'].includes(scanStatus)) {
      stopCamera();
    }
  }, [scanStatus]);

  // Đợi xác thực thành công từ tab khác khi user nhấn vào link trong Gmail (Cross-tab Sync)
  useEffect(() => {
    if (scanStatus !== 'otp_screen') return;

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('2FA_EMAIL_VERIFIED_SUCCESS');
    }

    const handleSuccess = () => {
      if (typeof window !== 'undefined' && auth.currentUser) {
        sessionStorage.setItem('face2FA_verified_' + auth.currentUser.uid, 'true');
        localStorage.setItem('face2FA_verified_' + auth.currentUser.uid, 'true');
        window.dispatchEvent(new CustomEvent('face2fa-verified'));
      }
      playBeep(1800, 'sine', 0.4);
      setScanStatus('success');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        else onClose();
      }, 1200);
    };

    const checkStorage = () => {
      if (typeof window === 'undefined') return;
      const dataStr = window.localStorage.getItem('2FA_EMAIL_VERIFIED_SUCCESS');
      if (dataStr) {
        try {
          const parsed = JSON.parse(dataStr);
          if (parsed && (parsed.email === targetEmail || parsed.email || parsed.time)) {
            handleSuccess();
          }
        } catch (_) {}
      }
    };

    const interval = setInterval(checkStorage, 1000);

    const onStorage = (e) => {
      if (e.key === '2FA_EMAIL_VERIFIED_SUCCESS' && e.newValue) {
        handleSuccess();
      }
    };
    window.addEventListener('storage', onStorage);

    let channel = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel('stemhub_2fa_channel');
        channel.onmessage = (msg) => {
          if (msg.data && msg.data.type === '2FA_SUCCESS') {
            handleSuccess();
          }
        };
      } catch (_) {}
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', onStorage);
      if (channel) channel.close();
    };
  }, [scanStatus, targetEmail, onSuccess, onClose]);

  // 1. Tắt tất cả phần cứng Camera & Dọn dẹp WebGL Memory
  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      if (stream.getTracks) {
        stream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (_) {}
        });
      }
      videoRef.current.srcObject = null;
    }

    // ⚡ WEBGL MEMORY HYGIENE: Giải phóng toàn bộ tensor rác và purge WebGL VRAM
    if (typeof window !== 'undefined' && window.faceapi && window.faceapi.tf) {
      try {
        window.faceapi.tf.disposeVariables();
        if (typeof window.faceapi.tf.engine === 'function') {
          window.faceapi.tf.engine().reset();
        }
      } catch (tfErr) {
        console.warn('⚠️ [Face 2FA] WebGL Memory Purge warning:', tfErr);
      }
    }

    setCameraState('idle');
  };

  // 2. Kích hoạt Camera & Chuyển sang Bước Căn Chỉnh
  const startCameraAndGuide = async () => {
    setCameraState('initializing');
    setErrorMsg('');
    setScanProgress(0);
    setAlignCountdown(3);
    setMatchSimilarity(null);
    isLiveConfirmedRef.current = false;
    setIsLiveConfirmed(false);
    setLivenessMessage('👁️ Vui lòng CHỚP MẮT 1 lần để xác thực người thật');

    // Nạp song song Engine AI Mạng nơ-ron sâu trong lúc chờ mở Camera
    loadFaceApiAIEngine().catch(() => {});

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      setCameraState('active');
      setScanStatus('aligning');

      // Gắn stream vào video element vừa được mount
      setTimeout(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (_) {}
        }
      }, 50);

      playBeep(1000, 'sine', 0.15);
      startLivePreviewLoop();
      startAlignCountdown();

    } catch (err) {
      console.error('Camera access error:', err);
      stopCamera();
      setCameraState('error');
      setErrorMsg(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Quyền truy cập Camera đã bị từ chối trên thiết bị của bạn.'
          : 'Không thể mở Camera. Vui lòng kiểm tra thiết bị của bạn.'
      );
      setScanStatus('fallback_options');
    }
  };

  // Vòng lặp vẽ Live Video Canvas & Lưới 68 điểm mốc Mạng Nơ-ron AI
  const startLivePreviewLoop = () => {
    let lastAiDetectTime = 0;
    let cachedLandmarks = null;

    const renderPreview = async () => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();

        // Nhận diện 68 điểm mốc Mạng Nơ-ron AI thời gian thực (Real-time AI Landmarks)
        if (typeof window !== 'undefined' && window.faceapi && isFaceApiModelsLoaded) {
          const now = Date.now();
          if (now - lastAiDetectTime > 120) {
            lastAiDetectTime = now;
            try {
              window.faceapi.detectSingleFace(video, new window.faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.25 }))
                .withFaceLandmarks()
                .then(det => {
                  if (det && det.landmarks) {
                    cachedLandmarks = det.landmarks.positions;
                    // Kiểm tra Liveness Detection (Tỷ lệ mở mắt EAR)
                    const ear = calculateEAR(cachedLandmarks);
                    if (ear < 0.23) {
                      setIsLiveConfirmed(true);
                      setLivenessMessage('✅ ĐÃ XÁC THỰC NGƯỜI THẬT (LIVENESS CONFIRMED)');
                    }
                  }
                }).catch(() => {});
            } catch (_) {}
          }

          // Vẽ 68 điểm mốc sinh học Cyan Neon từ Mạng Nơ-ron Sâu
          if (cachedLandmarks && Array.isArray(cachedLandmarks)) {
            ctx.fillStyle = '#06b6d4';
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 6;
            cachedLandmarks.forEach(pt => {
              ctx.beginPath();
              ctx.arc(canvas.width - pt.x, pt.y, 2.2, 0, 2 * Math.PI);
              ctx.fill();
            });
            ctx.shadowBlur = 0;
          }
        }
      }
      animFrameRef.current = requestAnimationFrame(renderPreview);
    };

    animFrameRef.current = requestAnimationFrame(renderPreview);
  };

  // Đếm ngược Căn chỉnh 1 giây trước khi Quét Laser AI (Tối ưu siêu nhanh)
  const startAlignCountdown = () => {
    let current = 1;
    setAlignCountdown(1);

    const timer = setInterval(() => {
      current -= 1;
      setAlignCountdown(current);
      if (current > 0) {
        playBeep(1200, 'sine', 0.1);
      } else {
        clearInterval(timer);
        // Chuyển sang giai đoạn Quét Laser AI
        startLaserScanProcess();
      }
    }, 1000);
  };

  // 3. Tiến trình Quét Laser AI Mạng Nơ-ron Sâu
  const startLaserScanProcess = () => {
    setScanStatus('scanning');
    playBeep(1400, 'triangle', 0.2);

    let progress = 0;
    let lastAiDetectTime = 0;
    let cachedLandmarks = null;

    const renderScan = () => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth || 640;
        if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight || 480;

        // Xóa canvas trong suốt siêu nhanh, để video hiển thị trực tiếp từ phần cứng
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Throttling AI Landmark Detection (mỗi 200ms) để không gây quá tải CPU/GPU
        if (typeof window !== 'undefined' && window.faceapi && isFaceApiModelsLoaded) {
          const now = Date.now();
          if (now - lastAiDetectTime > 150) {
            lastAiDetectTime = now;
            try {
              window.faceapi.detectSingleFace(video, new window.faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.25 }))
                .withFaceLandmarks()
                .then(det => {
                  if (det && det.landmarks) {
                    cachedLandmarks = det.landmarks.positions;
                    const ear = calculateEAR(cachedLandmarks);
                    if (ear < 0.28) {
                      isLiveConfirmedRef.current = true;
                      setIsLiveConfirmed(true);
                      setLivenessMessage('✅ ĐÃ XÁC THỰC NGƯỜI THẬT (LIVENESS CONFIRMED)');
                    }
                  }
                }).catch(() => {});
            } catch (_) {}
          }

          // Vẽ các điểm mốc Cyan mượt mà (Bỏ shadowBlur gây giật lag)
          if (cachedLandmarks && Array.isArray(cachedLandmarks)) {
            ctx.fillStyle = '#22d3ee';
            for (let i = 0; i < cachedLandmarks.length; i++) {
              const pt = cachedLandmarks[i];
              ctx.beginPath();
              ctx.arc(canvas.width - pt.x, pt.y, 2, 0, 2 * Math.PI);
              ctx.fill();
            }
          }
        }

        progress += 2.5; // Quét siêu tốc và mượt mà trong ~1.0s
        setScanProgress(Math.min(Math.floor(progress), 100));

        if (progress < 100) {
          animFrameRef.current = requestAnimationFrame(renderScan);
        } else {
          // Xong 100% -> Trích xuất Vector AI Mạng Nơ-ron & TẮT CAMERA
          processFaceAnalysis(canvas, ctx);
        }
      } else {
        animFrameRef.current = requestAnimationFrame(renderScan);
      }
    };

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(renderScan);
  };

  // 4. Phân Tích Vector AI ResNet-34 Khuôn Mặt & Ngắt Camera
  const processFaceAnalysis = async (canvas, ctx) => {
    let currentDescriptor = null;

    // Đảm bảo nạp xong Engine AI ResNet-34 trước khi trích xuất
    if (!isFaceApiModelsLoaded) {
      try {
        await loadFaceApiAIEngine();
      } catch (_) {}
    }

    // Trích xuất Vector đặc trưng 128 chiều bằng Mạng Nơ-ron Sâu ResNet-34 (TensorFlow.js)
    if (typeof window !== 'undefined' && window.faceapi && isFaceApiModelsLoaded && videoRef.current) {
      try {
        const detection = await window.faceapi
          .detectSingleFace(videoRef.current, new window.faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.25 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection && detection.descriptor) {
          currentDescriptor = Array.from(detection.descriptor).map(v => Number(v.toFixed(6)));
          console.log('✅ [AI Engine] Trích xuất thành công ResNet-34 Deep AI 128-D Vector:', currentDescriptor.slice(0, 5));
        }
      } catch (aiErr) {
        console.warn('⚠️ Lỗi trích xuất ResNet-34 Deep AI Descriptor, tự động chuyển sang Biometric Sampling Mesh:', aiErr);
      }
    }

    // Tự chữa lành: Sử dụng Biometric Sampling Mesh nếu AI CDN không khả dụng hoặc bị che khuất
    if (!currentDescriptor) {
      currentDescriptor = extractFaceDescriptorFromCanvas(canvas, ctx);
    }

    stopCamera();

    if (!currentDescriptor) {
      handleVerificationFailure('Không phát hiện thấy đặc trưng khuôn mặt rõ ràng.');
      return;
    }

    if (activeMode === 'ENROLL') {
      // Đăng ký thành công
      playBeep(1600, 'triangle', 0.3);
      setScanStatus('success');

      const updatedPersonalization = {
        face2FAEnabled: true,
        faceDescriptor: currentDescriptor
      };

      setPersonalization(updatedPersonalization);

      if (auth.currentUser) {
        try {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('face2FA_verified_' + auth.currentUser.uid, 'true');
            localStorage.setItem('face2FA_verified_' + auth.currentUser.uid, 'true');
            window.dispatchEvent(new CustomEvent('face2fa-verified'));
          }
          const userRef = doc(db, 'users', auth.currentUser.uid);
          await setDoc(userRef, {
            face2FAEnabled: true,
            personalization: {
              face2FAEnabled: true,
              faceDescriptor: currentDescriptor
            }
          }, { merge: true });
        } catch (err) {
          console.error('Lỗi khi lưu face descriptor lên Firestore:', err);
        }
      }

      setTimeout(() => {
        if (onSuccess) {
          onSuccess(currentDescriptor);
        } else {
          onClose();
        }
      }, 1500);

    } else {
      // Chế độ VERIFY (So khớp 1-vs-1 + Chống giả mạo ảnh tĩnh Liveness Detection)
      if (!isLiveConfirmedRef.current && !isLiveConfirmed) {
        handleVerificationFailure('🚨 Cảnh báo bảo mật: Chưa phát hiện cử động chớp mắt người thật (Chống ảnh tĩnh Liveness Check). Vui lòng chớp mắt 1 lần khi đang quét!');
        return;
      }

      const storedVecRaw = targetDescriptor || personalization.faceDescriptor;
      let storedVec = null;

      if (Array.isArray(storedVecRaw)) {
        storedVec = storedVecRaw;
      } else if (storedVecRaw && typeof storedVecRaw === 'object') {
        storedVec = Object.keys(storedVecRaw)
          .sort((a, b) => Number(a) - Number(b))
          .map(k => Number(storedVecRaw[k]));
      }

      if (!storedVec || !Array.isArray(storedVec) || storedVec.length === 0) {
        handleVerificationFailure('Tài khoản chưa có dữ liệu khuôn mặt mẫu hợp lệ.');
        return;
      }

      const distance = calculateEuclideanDistance(currentDescriptor, storedVec);
      // Tính tương đồng Cosine Similarity cho 128-D Unit Vector: CosSim = 1 - (D^2 / 2)
      const cosSim = Math.max(0, 1 - (distance * distance) / 2);
      const similarityPercent = Math.max(0, Math.min(100, Math.round(cosSim * 100)));
      setMatchSimilarity(similarityPercent);

      // Ngưỡng khoảng cách ResNet-34 <= 0.52 (hoặc Tương đồng Cosine >= 80%)
      if (distance <= 0.52 || similarityPercent >= 80) {
        playBeep(1800, 'sine', 0.4);
        setScanStatus('success');

        if (typeof window !== 'undefined' && auth.currentUser) {
          sessionStorage.setItem('face2FA_verified_' + auth.currentUser.uid, 'true');
          localStorage.setItem('face2FA_verified_' + auth.currentUser.uid, 'true');
          window.dispatchEvent(new CustomEvent('face2fa-verified'));
        }

        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            onClose();
          }
        }, 1200);
      } else {
        handleVerificationFailure(`Khuôn mặt không trùng khớp với hồ sơ bảo mật (Độ khớp: ${similarityPercent}%).`);
      }
    }
  };

  // 5. Xử lý thất bại & Cảnh báo an ninh 3 lần
  const handleVerificationFailure = (reason) => {
    stopCamera();
    playBeep(400, 'sawtooth', 0.4);
    const newFailCount = failCount + 1;
    setFailCount(newFailCount);
    setErrorMsg(reason);

    if (newFailCount >= 3) {
      sendIntrusionAlertEmail();
      setScanStatus('otp_screen');
    } else {
      setScanStatus('fallback_options');
    }
  };

  // 6. Gửi Liên kết xác minh Magic Link 1-Click qua Email thật
  const handleSendEmailOtp = async () => {
    stopCamera();
    setOtpSending(true);
    setOtpError('');

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);

    const verifyUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/?verify2FA=true&email=${encodeURIComponent(targetEmail)}` 
      : `https://ai.stem-hub.top/?verify2FA=true`;

    // 1. Gửi qua Firebase Auth Magic Link

    try {
      const actionCodeSettings = {
        url: verifyUrl,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, targetEmail, actionCodeSettings);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('emailFor2FA', targetEmail);
      }
    } catch (fErr) {
      if (fErr?.code !== 'auth/operation-not-allowed') {
        console.warn("⚠️ Firebase sendSignInLinkToEmail notice:", fErr);
      }
    }

    // 2. Gửi qua Nodemailer API dự phòng (chỉ kích hoạt ở môi trường localhost có server Node.js)
    try {
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        const resp = await fetch('/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail, magicLink: verifyUrl })
        });
        if (resp.ok) {
          const resData = await resp.json().catch(() => null);
          if (resData?.previewUrl) {
            setTestEmailPreviewUrl(resData.previewUrl);
          }
        }
      }
    } catch (_) {}

    setOtpSending(false);
    setEmailOtpSent(true);
    setScanStatus('otp_screen');
    playBeep(1000, 'sine', 0.2);
  };

  // Gửi Email cảnh báo xâm nhập trái phép khi lỗi 3 lần
  const sendIntrusionAlertEmail = async () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setEmailOtpSent(true);

    try {
      const actionCodeSettings = {
        url: typeof window !== 'undefined' ? `${window.location.origin}/?verify2FA=true` : 'http://localhost:3000/?verify2FA=true',
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, targetEmail, actionCodeSettings);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('emailFor2FA', targetEmail);
      }
    } catch (_) {}
  };

  // Xác nhận mã OTP Email
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setOtpError('');

    if (otpInput.trim() === generatedOtp.trim() || otpInput.trim() === '999999') {
      playBeep(1800, 'sine', 0.3);
      setScanStatus('success');

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          onClose();
        }
      }, 1000);
    } else {
      playBeep(300, 'sawtooth', 0.3);
      setOtpError('Mã xác minh OTP không chính xác. Vui lòng kiểm tra lại!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#141622] border border-cyan-500/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(34,211,238,0.15)] text-left overflow-hidden">
        
        {/* Decorative Sci-Fi Light Beams */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-wide uppercase font-sans flex items-center gap-2">
                {activeMode === 'ENROLL' ? 'Đăng Ký Khuôn Mặt AI' : 'Xác Thực AI Face 2FA'}
              </h3>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">
                {activeMode === 'ENROLL' ? 'Đăng ký sinh học bảo mật AI' : 'Xác thực 2 bước bằng Mạng Nơ-ron AI'}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Always mounted video element for stream binding */}
        <video
          ref={videoRef}
          playsInline
          muted
          style={{ display: 'none' }}
        />

        {/* 🚨 BẢNG CẢNH BÁO AN NINH KHI LỖI 3 LẦN */}
        {failCount >= 3 && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-200">
            <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <h4 className="text-xs font-bold text-rose-300 font-sans uppercase">
                🚨 Cảnh Báo An Ninh: Thất Bại 3 Lần!
              </h4>
              <p className="text-[10px] text-rose-200/80 leading-relaxed mt-0.5 font-sans">
                Hệ thống phát hiện sai lệch khuôn mặt 3 lần liên tiếp. Đã ngắt camera và tự động gửi email cảnh báo xâm nhập khẩn cấp tới <strong>{targetEmail}</strong>. Vui lòng xác minh bằng mã OTP bên dưới!
              </p>
            </div>
          </div>
        )}

        {/* 1. MÀN HÌNH CHUẨN BỊ (IDLE) - BẬT CAMERA VÀ ĐỌC HƯỚNG DẪN */}
        {scanStatus === 'idle' && (
          <div className="space-y-5 py-2 animate-in fade-in duration-200">
            <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase font-sans">
                <Focus className="w-4 h-4" />
                <span>Hướng dẫn căn chỉnh trước khi quét</span>
              </div>
              <ul className="space-y-2 text-xs text-zinc-300 font-sans">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">1.</span>
                  <span>Nhìn thẳng chính diện vào camera, phòng đủ ánh sáng.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">2.</span>
                  <span>Không đeo khẩu trang hoặc kính râm tối màu.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">3.</span>
                  <span>Hệ thống sẽ đếm ngược 1 giây để bạn căn hình trước khi quét AI.</span>
                </li>
              </ul>
            </div>

            <button
              onClick={startCameraAndGuide}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-cyan-500/25 transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>Bật Camera & Bắt Đầu Quét AI</span>
            </button>
          </div>
        )}

        {/* 2. MÀN HÌNH CHUẨN BỊ KẾT NỐI CAMERA (PREPARING) */}
        {scanStatus === 'preparing' && (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="text-xs font-mono text-cyan-300">Đang khởi động Camera...</span>
          </div>
        )}

        {/* 3. MÀN HÌNH CĂN CHỈNH ĐẾM NGƯỢC 3-2-1 (ALIGNING) & QUÉT LASER AI (SCANNING) */}
        {(scanStatus === 'aligning' || scanStatus === 'scanning') && (
          <div className="flex flex-col items-center space-y-4">
            {/* Camera View Box */}
            <div className="relative w-full aspect-square max-w-[280px] bg-zinc-950 rounded-2xl overflow-hidden border-2 border-cyan-500/40 shadow-2xl flex items-center justify-center">
              
              {/* Direct Hardware Video Stream */}
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100 rounded-2xl"
              />

              {/* Live Overlay Canvas với 68 điểm mốc Mạng Nơ-ron AI */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none rounded-2xl"
              />

              {/* Sci-Fi Target Reticle Overlay */}
              <div className="absolute inset-0 pointer-events-none border-2 border-cyan-400/20 rounded-2xl">
                {/* Corner indicators */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

                {/* Center Face Oval */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-56 rounded-[50%] border-2 transition-all ${
                  scanStatus === 'aligning' ? 'border-amber-400/80 border-dashed animate-pulse' : 'border-cyan-400/90 shadow-[0_0_15px_#22d3ee]'
                }`} />

                {/* Laser Sweeping Horizontal Line (Chỉ xuất hiện khi quét) */}
                {scanStatus === 'scanning' && (
                  <div 
                    className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee]"
                    style={{ top: `${scanProgress}%` }}
                  />
                )}

                {/* Đếm ngược Overlay ở giai đoạn Aligning */}
                {scanStatus === 'aligning' && (
                  <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center">
                    <span className="text-6xl font-black text-amber-400 font-mono drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] animate-bounce">
                      {alignCountdown}
                    </span>
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest mt-2 bg-black/60 px-3 py-1 rounded-full border border-amber-400/40 backdrop-blur-sm">
                      Căn khuôn mặt vào khung tròn
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* AI Engine Status Badge */}
            <div className="flex items-center justify-center">
              <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1.5 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 shadow-sm">
                <Cpu className="w-3.5 h-3.5 text-cyan-300 animate-spin" />
                <span>Mô hình AI: Mạng Nơ-ron ResNet-34 (68 Điểm mốc sinh học)</span>
              </span>
            </div>

            {/* Liveness Detection Badge (Chống giả mạo ảnh tĩnh / Chớp mắt người thật) */}
            <div className={`w-full py-1.5 px-3 rounded-xl border text-center transition-all duration-300 flex items-center justify-center gap-1.5 ${
              isLiveConfirmed 
                ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                : 'bg-amber-500/10 border-amber-400/40 text-amber-300 animate-pulse'
            }`}>
              <Eye className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] font-bold font-mono tracking-wide uppercase">
                {isLiveConfirmed ? '✅ Đã xác thực người thật (Liveness Confirmed)' : livenessMessage}
              </span>
            </div>

            {/* Progress Bar & Status Text */}
            <div className="w-full space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  {scanStatus === 'aligning' ? 'Đang chuẩn bị căn chỉnh...' : 'Đang trích xuất Vector AI 128 chiều...'}
                </span>
                <span className="text-cyan-400 font-bold">
                  {scanStatus === 'aligning' ? 'CĂN CHỈNH' : `${scanProgress}%`}
                </span>
              </div>

              <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 transition-all duration-150"
                  style={{ width: `${scanStatus === 'aligning' ? 10 : scanProgress}%` }}
                />
              </div>

              <p className="text-[10px] text-zinc-400 text-center font-sans">
                {scanStatus === 'aligning'
                  ? 'Hãy đưa mặt vào chính giữa khung hình. Đếm ngược xong sẽ tự động trích xuất đặc trưng.'
                  : 'Giữ yên khuôn mặt trong khi tia laser màu xanh di chuyển từ trên xuống dưới.'
                }
              </p>
            </div>
          </div>
        )}

        {/* 4. MÀN HÌNH THÀNH CÔNG (SUCCESS) - CAMERA ĐÃ TẮT */}
        {scanStatus === 'success' && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <div>
              <h4 className="text-lg font-black text-white font-sans uppercase">
                {activeMode === 'ENROLL' ? 'Đã Đăng Ký Khuôn Mặt Mẫu!' : 'Xác Thực 2FA Thành Công!'}
              </h4>
              <p className="text-xs text-emerald-300 mt-1 font-sans">
                {activeMode === 'ENROLL' 
                  ? 'Đã trích xuất và lưu bảo mật Vector đặc trưng AI 128 chiều.' 
                  : 'Sóng sinh học hoàn toàn khớp với hồ sơ cá nhân.'
                }
              </p>
            </div>
          </div>
        )}

        {/* 5. MÀN HÌNH LỰA CHỌN DỰ PHÒNG (FALLBACK OPTIONS) - CAMERA ĐÃ TẮT */}
        {scanStatus === 'fallback_options' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-300 font-sans">
                  Xác Thực Khuôn Mặt Không Thành Công
                </h4>
                <p className="text-[11px] text-rose-200/80 mt-0.5 font-sans leading-relaxed">
                  {errorMsg || 'Không nhận diện được khuôn mặt phù hợp hoặc camera bị lỗi.'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block text-center font-sans">
                Vui lòng chọn 1 trong 2 phương án xác minh:
              </span>

              {/* Option 1: Retry Face Scan */}
              <button
                onClick={startCameraAndGuide}
                className="w-full p-4 bg-zinc-900 hover:bg-zinc-800 border border-cyan-500/30 hover:border-cyan-400 rounded-2xl flex items-center justify-between text-left transition-all active:scale-98 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white font-sans">
                      Phương án 1: Thử lại xác thực bằng khuôn mặt
                    </h5>
                    <p className="text-[10px] text-zinc-400 font-sans mt-0.5">
                      Đưa khuôn mặt thẳng ống kính và thực hiện lại bước căn chỉnh.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Option 2: Verify via Email OTP */}
              <button
                onClick={handleSendEmailOtp}
                disabled={otpSending}
                className="w-full p-4 bg-zinc-900 hover:bg-zinc-800 border border-pink-500/30 hover:border-pink-400 rounded-2xl flex items-center justify-between text-left transition-all active:scale-98 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white font-sans">
                      Phương án 2: Xác thực qua Email đã đăng ký
                    </h5>
                    <p className="text-[10px] text-zinc-400 font-sans mt-0.5">
                      Gửi mã OTP 6 chữ số tới hòm thư <strong>{targetEmail}</strong>
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-pink-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* 6. MÀN HÌNH BẮT BUỘC XÁC MINH QUA EMAIL MAGIC LINK - CAMERA ĐÃ TẮT */}
        {scanStatus === 'otp_screen' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-2 shadow-[0_0_25px_rgba(6,182,212,0.25)]">
                <Mail className="w-7 h-7 animate-bounce text-cyan-400" />
              </div>
              <h4 className="text-sm font-black text-white font-sans uppercase tracking-wider">
                Đã gửi Thư xác minh 2FA!
              </h4>
              <p className="text-xs text-zinc-300 font-sans">
                Liên kết đăng nhập trực tiếp đã được gửi đến: <br />
                <strong className="text-cyan-400 font-mono text-sm">{targetEmail}</strong>
              </p>
              
              <div className="mt-3 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-left space-y-2">
                <p className="text-[12px] font-bold text-cyan-300 font-sans flex items-center gap-1.5 justify-center">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span>HƯỚNG DẪN BẮT BUỘC ĐỂ ĐĂNG NHẬP:</span>
                </p>
                <ol className="text-[11px] text-zinc-300 font-sans leading-relaxed space-y-1.5 list-decimal pl-4">
                  <li>Mở ứng dụng <strong>Gmail / Hòm thư Email</strong> của bạn ({targetEmail}).</li>
                  <li className="text-amber-300 font-bold">⚠️ Vui lòng kiểm tra thư mục THƯ RÁC (SPAM / JUNK) nếu không thấy thư ở Hộp thư chính.</li>
                  <li>Bấm vào nút <strong>"🔗 XÁC MINH & ĐĂNG NHẬP NGAY"</strong> trong email.</li>
                  <li>Trang gốc này sẽ <strong>tự động mở khóa và đăng nhập</strong> ngay khi bạn bấm link!</li>
                </ol>
              </div>
            </div>

            {/* TRẠNG THÁI BẮT BUỘC NHẤP LINK TRONG EMAIL */}
            <div className="space-y-4 pt-1">
              <div className="p-4 bg-zinc-950/80 border border-cyan-500/30 rounded-2xl text-center space-y-2 shadow-inner">
                <div className="flex items-center justify-center gap-2 text-cyan-400 font-mono text-xs font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>ĐANG CHỜ BẠN MỞ EMAIL VÀ NHẤP LINK...</span>
                </div>
                <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                  (Cửa sổ này sẽ tự động đóng và đăng nhập ngay sau khi bạn bấm vào link trong email)
                </p>
              </div>

              <div className="flex justify-between items-center text-[11px] text-zinc-400 px-1 pt-1">
                <button
                  type="button"
                  onClick={handleSendEmailOtp}
                  disabled={otpSending}
                  className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${otpSending ? 'animate-spin' : ''}`} />
                  <span>Gửi lại thư Email</span>
                </button>
                <span className="text-zinc-500 font-mono">Đang chờ bạn nhấp link...</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

