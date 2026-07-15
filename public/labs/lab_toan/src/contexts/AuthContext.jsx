// =====================================================
// SpatialMind — Auth Context (Firebase Authentication)
// =====================================================
// Cung cấp: user, login, register, loginWithGoogle, logout
// Tự động sync profile lên Firestore khi login
// Fallback sang localStorage khi Firebase chưa cấu hình
// =====================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, db, googleProvider, githubProvider, isFirebaseConfigured } from '../firebaseConfig';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Fallback khi không có AuthProvider (chế độ offline)
    return {
      user: null,
      loading: false,
      authError: '',
      isAuthenticated: false,
      isOfflineMode: true,
      userProfile: null,
      register: async () => {},
      login: async () => {},
      loginWithGoogle: async () => {},
      logout: async () => {},
      clearError: () => {},
      updateUserProfile: async () => {},
    };
  }
  return ctx;
}

// Vietnamese error messages
function getErrorMessage(code) {
  const messages = {
    'auth/email-already-in-use': 'Email này đã được đăng ký. Hãy thử đăng nhập.',
    'auth/invalid-email': 'Địa chỉ email không hợp lệ.',
    'auth/wrong-password': 'Mật khẩu không chính xác.',
    'auth/user-not-found': 'Không tìm thấy tài khoản với email này.',
    'auth/weak-password': 'Mật khẩu phải có ít nhất 6 ký tự.',
    'auth/popup-closed-by-user': 'Đã hủy đăng nhập Google.',
    'auth/too-many-requests': 'Quá nhiều lần thử. Vui lòng đợi vài phút.',
    'auth/network-request-failed': 'Lỗi kết nối mạng. Kiểm tra internet.',
    'auth/invalid-credential': 'Email hoặc mật khẩu không chính xác.',
  };
  return messages[code] || `Đã xảy ra lỗi (${code}). Vui lòng thử lại.`;
}

import { useAuthStore } from '../store/useAuthStore';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const { setUser: setZustandUser, setInitializing } = useAuthStore();

  // ── Auth state listener ──
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      setInitializing(false);
      return;
    }

    let unsubscribe = () => {};

    Promise.all([
      import('firebase/auth'),
      import('firebase/firestore'),
    ]).then(([authMod, firestoreMod]) => {
      const { onAuthStateChanged: onAuth } = authMod;
      const { doc, getDoc, setDoc, updateDoc, serverTimestamp } = firestoreMod;

      unsubscribe = onAuth(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const profileRef = doc(db, 'users', firebaseUser.uid);
            const profileSnap = await getDoc(profileRef);

            let role = 'student';

            if (profileSnap.exists()) {
              role = profileSnap.data().role || 'student';
              await updateDoc(profileRef, {
                lastActive: serverTimestamp(),
                displayName: firebaseUser.displayName || profileSnap.data().displayName,
                photoURL: firebaseUser.photoURL || profileSnap.data().photoURL,
              });
              setUserProfile({ ...profileSnap.data(), uid: firebaseUser.uid, role });
            } else {
              const newProfile = {
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName || 'Học sinh SpatialMind',
                email: firebaseUser.email || '',
                photoURL: firebaseUser.photoURL || '',
                role: 'student', // Đăng ký mới mặc định là student
                xp: 0,
                streak: 0,
                maxStreak: 0,
                level: 1,
                rank: 'Beginner',
                rankLevel: 1,
                solvedProblems: 0,
                totalChallengesCompleted: 0,
                totalStars: 0,
                achievements: [],
                gallerySubmissions: 0,
                notificationActive: false,
                notifyHour: 7,
                createdAt: serverTimestamp(),
                lastActive: serverTimestamp(),
              };
              await setDoc(profileRef, newProfile);
              setUserProfile(newProfile);
            }

            // Sync with Zustand
            setZustandUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: role,
            });

          } catch (err) {
            console.warn('Firestore profile load failed:', err);
            setUserProfile(null);
            setZustandUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: 'student',
            });
          }
          setUser(firebaseUser);
        } else {
          setUser(null);
          setUserProfile(null);
          setZustandUser(null);
        }
        setLoading(false);
        setInitializing(false);
      });
    }).catch(() => {
      setLoading(false);
      setInitializing(false);
    });

    return () => unsubscribe();
  }, [setZustandUser, setInitializing]);

  // ── Register ──
  const register = useCallback(async (email, password, displayName) => {
    if (!isFirebaseConfigured) throw new Error('Firebase chưa cấu hình');
    setAuthError('');
    try {
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      return result.user;
    } catch (err) {
      setAuthError(getErrorMessage(err.code));
      throw err;
    }
  }, []);

  // ── Login Email/Password ──
  const login = useCallback(async (email, password) => {
    if (!isFirebaseConfigured) throw new Error('Firebase chưa cấu hình');
    setAuthError('');
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err) {
      setAuthError(getErrorMessage(err.code));
      throw err;
    }
  }, []);

  // ── Login Google ──
  const loginWithGoogle = useCallback(async () => {
    if (!isFirebaseConfigured) throw new Error('Firebase chưa cấu hình');
    setAuthError('');
    try {
      const { signInWithPopup } = await import('firebase/auth');
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err) {
      setAuthError(getErrorMessage(err.code));
      throw err;
    }
  }, []);

  // ── Login Github ──
  const loginWithGithub = useCallback(async () => {
    if (!isFirebaseConfigured) throw new Error('Firebase chưa cấu hình');
    setAuthError('');
    try {
      const { signInWithPopup } = await import('firebase/auth');
      const result = await signInWithPopup(auth, githubProvider);
      return result.user;
    } catch (err) {
      setAuthError(getErrorMessage(err.code));
      throw err;
    }
  }, []);

  // ── Logout ──
  const logout = useCallback(async () => {
    if (!isFirebaseConfigured) return;
    try {
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  // ── Clear error ──
  const clearError = useCallback(() => setAuthError(''), []);

  // ── Update profile in Firestore ──
  const updateUserProfile = useCallback(async (updates) => {
    if (!isFirebaseConfigured || !user) return;
    try {
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const profileRef = doc(db, 'users', user.uid);
      await updateDoc(profileRef, { ...updates, lastActive: serverTimestamp() });
      setUserProfile(prev => ({ ...prev, ...updates }));
    } catch (err) {
      console.warn('Profile update failed:', err);
    }
  }, [user]);

  const value = {
    user,
    userProfile,
    loading,
    authError,
    isAuthenticated: !!user,
    isOfflineMode: !isFirebaseConfigured,
    register,
    login,
    loginWithGoogle,
    loginWithGithub,
    logout,
    clearError,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
