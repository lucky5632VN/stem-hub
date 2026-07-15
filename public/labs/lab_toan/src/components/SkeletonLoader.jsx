/**
 * SkeletonLoader — Loading placeholders với animated shimmer effect
 * Dùng thay cho spinner đơn giản khi AI đang xử lý (tối đa 60s)
 */
import React from 'react';
import { motion } from 'framer-motion';

// Shimmer animation
const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'linear',
  },
};

const shimmerStyle = {
  background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)',
  backgroundSize: '200% 100%',
};

function SkeletonBlock({ className = '', style = {} }) {
  return (
    <motion.div
      animate={shimmer.animate}
      transition={shimmer.transition}
      className={`rounded-xl ${className}`}
      style={{ ...shimmerStyle, ...style }}
    />
  );
}

/**
 * Skeleton cho Sidebar khi đang load kết quả AI
 */
export function SidebarSkeleton() {
  return (
    <div className="space-y-4 pt-4 border-t border-white/5">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-3 w-28" />
        <SkeletonBlock className="h-5 w-12 rounded-full" />
      </div>

      {/* Step skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 rounded-2xl border border-white/5 space-y-2"
          style={{ opacity: 1 - (i - 1) * 0.25 }}>
          <div className="flex items-center gap-3">
            <SkeletonBlock className="w-7 h-7 rounded-full shrink-0" />
            <SkeletonBlock className="h-3 flex-1" />
          </div>
          <SkeletonBlock className="h-2 w-4/5 ml-10" />
          <SkeletonBlock className="h-2 w-3/5 ml-10" />
        </div>
      ))}

      {/* Quiz skeleton */}
      <div className="p-4 rounded-2xl border border-cyan-500/10 space-y-3">
        <SkeletonBlock className="h-3 w-36" />
        {[1, 2, 3, 4].map((i) => (
          <SkeletonBlock key={i} className="h-9 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton cho 3D Canvas area
 */
export function CanvasSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      {/* Spinner 3D orb */}
      <div className="relative w-24 h-24">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-cyan-500/30 border-t-cyan-400"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-2 rounded-full border-2 border-violet-500/20 border-t-violet-400/60"
        />
        <motion.div
          animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-6 h-6 rounded-full bg-cyan-400/30 backdrop-blur-sm" />
        </motion.div>
      </div>

      {/* Steps text */}
      <div className="text-center space-y-2">
        <p className="text-cyan-400 text-xs font-black uppercase tracking-widest animate-pulse">
          AI đang phân tích...
        </p>
        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-wider">
          Khởi tạo không gian 3D
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
            className="w-2 h-2 rounded-full bg-cyan-400"
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton inline nhỏ gọn cho card
 */
export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock
          key={i}
          className="h-3"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

export default SkeletonBlock;
