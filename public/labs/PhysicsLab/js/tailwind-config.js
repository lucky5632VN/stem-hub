tailwind.config = {
    darkMode: 'class', // BẬT DARK MODE BẰNG CLASS
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                tech: ['Rajdhani', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            colors: {
                lab: {
                    // Cập nhật hệ màu tối hoàn toàn cho hiệu ứng Glass
                    dark_bg: '#080c14',       // Nền chính tối sâu
                    dark_glass: 'rgba(20, 28, 43, 0.45)', // Màu kính chính
                    dark_glass_hover: 'rgba(30, 42, 60, 0.55)', // Kính khi hover
                    dark_panel: 'rgba(15, 23, 42, 0.6)', // Glass panel
                    dark_cyan: '#00f2fe',      // Cyan sáng neon
                    dark_accent: '#4facfe',    // Xanh accent sáng
                    dark_text: '#f8fafc',      // Chữ trắng sáng
                    dark_muted: '#94a3b8',     // Chữ phụ
                    
                    // Giữ lại các biến cũ tránh lỗi code (tuỳ biến cho Glass)
                    bg: '#080c14',
                    panel: 'rgba(30, 41, 59, 0.5)',
                    cyan: '#00f2fe',
                    accent: '#4facfe',
                    success: '#10b981',
                    warning: '#f59e0b',
                    danger: '#ef4444',
                    text: '#f8fafc',
                    muted: '#94a3b8',
                }
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                'glass-inset': 'inset 0 1px 1px rgba(255, 255, 255, 0.1), inset 0 2px 20px rgba(0, 242, 254, 0.05)',
                'neon': '0 0 10px rgba(0, 242, 254, 0.5), 0 0 20px rgba(0, 242, 254, 0.3)',
                'neon-orange': '0 0 10px rgba(249, 115, 22, 0.5), 0 0 20px rgba(249, 115, 22, 0.3)',
                'neon-danger': '0 0 10px rgba(239, 68, 68, 0.5), 0 0 20px rgba(239, 68, 68, 0.3)'
            },
            backdropBlur: {
                'glass': '24px',
                'superglass': '40px'
            },
            backgroundImage: {
                'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)',
            },
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            }
        }
    }
}
