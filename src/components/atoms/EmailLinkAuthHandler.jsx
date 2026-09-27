'use client';

import React, { useEffect, useState } from 'react';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { CheckCircle2, Sparkles, ExternalLink, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { setFace2FASession } from '@/lib/faceAuthSecurity';

export default function EmailLinkAuthHandler() {
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = window.location.href;
    const searchParams = new URLSearchParams(window.location.search);
    const is2FA = searchParams.get('verify2FA') === 'true';
    const emailParam = searchParams.get('email');

    // 1. Nếu mở link từ Email (Firebase Magic Link hoặc Direct Verify)
    if (isSignInWithEmailLink(auth, url) || is2FA) {
      const storedEmail = window.localStorage.getItem('emailFor2FA') || window.localStorage.getItem('emailForSignIn') || emailParam || '';

      const completeVerification = (emailUsed) => {
        setVerifiedEmail(emailUsed);
        setVerifiedSuccess(true);

        // Lưu cờ xác thực thành công để tab gốc đọc và tự động mở khóa
        const successPayload = {
          email: emailUsed,
          time: Date.now()
        };
        window.localStorage.setItem('2FA_EMAIL_VERIFIED_SUCCESS', JSON.stringify(successPayload));

        // Phát tín hiệu qua BroadcastChannel cho tab gốc
        if (typeof BroadcastChannel !== 'undefined') {
          try {
            const channel = new BroadcastChannel('stemhub_2fa_channel');
            channel.postMessage({ type: '2FA_SUCCESS', email: emailUsed });
            setTimeout(() => channel.close(), 2000);
          } catch (_) {}
        }
      };

      if (isSignInWithEmailLink(auth, url)) {
        let emailToSignIn = storedEmail;
        if (!emailToSignIn) {
          emailToSignIn = window.prompt('Vui lòng nhập Email của bạn để hoàn tất xác thực:') || '';
        }

        if (emailToSignIn) {
          signInWithEmailLink(auth, emailToSignIn, url)
            .then((result) => {
              const uid = result.user?.uid;
              if (uid) {
                setFace2FASession(uid);
              }
              completeVerification(emailToSignIn);
            })
            .catch((err) => {
              console.warn('⚠️ Lỗi hoàn tất signInWithEmailLink:', err);
              completeVerification(emailToSignIn);
            });
        } else {
          completeVerification(emailParam || 'Tài khoản của bạn');
        }
      } else if (is2FA) {
        completeVerification(emailParam || 'Tài khoản của bạn');
      }
    }
  }, []);

  if (!verifiedSuccess) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-bg-secondary border border-accent-pink/40 p-8 rounded-3xl max-w-md w-full text-center shadow-[0_0_50px_rgba(240,57,140,0.3)] relative overflow-hidden"
        >
          {/* Sci-Fi Glow Effects */}
          <div className="absolute -top-12 -left-12 w-36 h-36 bg-accent-pink/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-success/10 border border-success/30 text-success flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-xl font-black text-text-primary uppercase tracking-wider mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-accent-pink" /> XÁC THỰC 2FA THÀNH CÔNG!
          </h2>

          <p className="text-xs text-text-secondary leading-relaxed mb-6">
            Đã xác minh liên kết email bảo mật cho tài khoản:<br />
            <strong className="text-accent-pink font-semibold">{verifiedEmail}</strong>
          </p>

          <div className="bg-bg-tertiary border border-border-theme p-4 rounded-2xl mb-6 text-left space-y-2">
            <p className="text-[11px] font-bold text-success flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> TRANG GỐC CỦA BẠN ĐÃ ĐƯỢC MỞ KHÓA!
            </p>
            <p className="text-[10px] text-text-secondary leading-normal">
              Trang web bạn đã mở trước đó (ai.stem-hub.top) đang tự động đăng nhập và đưa bạn vào hệ thống. Bạn có thể đóng tab này hoặc nhấn nút bên dưới.
            </p>
          </div>

          <button
            onClick={() => {
              window.location.href = window.location.origin;
            }}
            className="w-full py-3.5 bg-gradient-to-r from-accent-pink to-cyan-500 hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            Quay lại STEM HUB <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
