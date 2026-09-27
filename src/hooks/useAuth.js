'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAppStore } from '@/store/useAppStore';

/**
 * Hook useAuth cung cấp trạng thái xác thực người dùng đồng bộ:
 * - currentUser: Thông tin người dùng hiện tại (Firebase User object hoặc null)
 * - loading: true khi đang khởi tạo kiểm tra phiên từ Firebase Auth
 * - isAuthenticated: boolean xác nhận đã đăng nhập
 */
export function useAuth() {
  const storeUser = useAppStore((state) => state.user);
  const [currentUser, setCurrentUser] = useState(auth?.currentUser || storeUser);
  const [loading, setLoading] = useState(!auth?.currentUser && !storeUser);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const getCookieFlags = () => {
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      return `; path=/; max-age=604800; SameSite=Lax${isHttps ? '; Secure' : ''}`;
    };

    // Nếu đã có sẵn currentUser từ auth instance
    if (auth.currentUser) {
      setCurrentUser(auth.currentUser);
      setLoading(false);
      auth.currentUser.getIdToken().then((token) => {
        document.cookie = `session=${token}${getCookieFlags()}`;
      }).catch(() => {});
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);

      if (user) {
        try {
          const token = await user.getIdToken();
          document.cookie = `session=${token}${getCookieFlags()}`;
          console.log('[Auth Hook] ✅ Xác thực phiên người dùng thành công:', user.email || user.displayName || user.uid);
        } catch (_) {}
      } else {
        const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
        document.cookie = `session=; path=/; max-age=0; SameSite=Lax${isHttps ? '; Secure' : ''}`;
        console.log('[Auth Hook] ℹ️ Người dùng chưa đăng nhập (Khách vãng lai).');
      }
    });

    return () => unsubscribe();
  }, []);

  // Đồng bộ nếu storeUser thay đổi từ các nguồn khác
  useEffect(() => {
    if (storeUser && !currentUser) {
      setCurrentUser(storeUser);
      setLoading(false);
    }
  }, [storeUser, currentUser]);

  const activeUser = currentUser || storeUser;

  return {
    user: activeUser,
    currentUser: activeUser,
    isAuthenticated: !!activeUser,
    loading
  };
}

export default useAuth;
