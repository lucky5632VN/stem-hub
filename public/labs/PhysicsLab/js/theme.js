// === DARK/LIGHT MODE TOGGLE ===

/**
 * Thiết lập chủ đề giao diện (light/dark)
 * @param {string} theme - 'light' hoặc 'dark'
 */
function setTheme(theme) {
    const html = document.documentElement;
    const icon = document.getElementById('theme-icon');
    const status = document.getElementById('theme-status');

    if (theme === 'dark') {
        html.classList.add('dark');
        if (icon) icon.setAttribute('data-lucide', 'sun');
        if (status) status.textContent = 'Dark';
        localStorage.setItem('theme', 'dark');
    } else {
        html.classList.remove('dark');
        if (icon) icon.setAttribute('data-lucide', 'moon');
        if (status) status.textContent = 'Light';
        localStorage.setItem('theme', 'light');
    }
    // Dispatch custom event for complex components (Canvas/P5.js) to react
    const event = new CustomEvent('theme-changed', { detail: { theme: theme } });
    window.dispatchEvent(event);

    // Update icons (Sun/Moon)
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Synchronize theme across tabs
window.addEventListener('storage', (event) => {
    if (event.key === 'theme') {
        const newTheme = event.newValue || 'light';
        // Only update if the current class doesn't match the new theme
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        if (newTheme !== currentTheme) {
            setTheme(newTheme);
        }
    }
});

/**
 * Chuyển đổi giữa hai chế độ light và dark
 */
function toggleDarkMode() {
    const currentTheme = localStorage.getItem('theme');
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

/**
 * Áp dụng chủ đề ban đầu dựa trên Local Storage, ưu tiên Light Mode
 */
function applyInitialTheme() {
    const storedTheme = localStorage.getItem('theme');

    // [SECURITY] Whitelist validation — chỉ chấp nhận đúng 2 giá trị hợp lệ.
    // Chặn mọi nỗ lực inject giá trị độc hại vào localStorage.
    const ALLOWED_THEMES = ['light', 'dark'];
    const isValidTheme = ALLOWED_THEMES.includes(storedTheme);

    // Mặc định 'dark' nếu không có hoặc giá trị không hợp lệ.
    const initialTheme = isValidTheme ? storedTheme : 'dark';

    setTheme(initialTheme);
}

// Chạy các hàm khởi tạo khi cửa sổ tải xong
window.addEventListener('load', function () {
    applyInitialTheme(); // Áp dụng chế độ sáng/tối
    // Dispatch custom event for complex components (Canvas/P5.js) to react
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // --- Configuration Dropdown Logic (Injected) ---
    const configLink = document.querySelector('a[href="configuration.html"]');
    if (configLink) {
        // Find the "Chế Độ Giao Diện" button which is expected to be the next sibling or close by
        // We look for the button that toggles dark mode in the sidebar
        const sidebarNav = configLink.parentElement;
        const themeBtn = Array.from(sidebarNav.children).find(child =>
            child.tagName === 'BUTTON' && child.getAttribute('onclick') === 'toggleDarkMode()' && child.classList.contains('nav-link')
        );

        if (themeBtn) {
            // Setup initial state: Hide theme button
            themeBtn.style.display = 'none';
            themeBtn.style.transition = 'all 0.3s ease';
            themeBtn.style.overflow = 'hidden';

            // Modify Configuration Link to act as a toggle
            configLink.setAttribute('href', '#'); // Disable navigation
            configLink.addEventListener('click', (e) => {
                e.preventDefault();
                const isHidden = themeBtn.style.display === 'none';
                themeBtn.style.display = isHidden ? 'flex' : 'none';

                // Optional: Rotate icon or indicate state
                const settingsIcon = configLink.querySelector('[data-lucide="settings"]');
                if (settingsIcon) {
                    settingsIcon.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
                }
            });
        }
    }

    // --- Remove Header Toggle (Requested by User) ---
    // The button has title="Toggle Theme"
    const headerToggle = document.querySelector('button[title="Toggle Theme"]');
    if (headerToggle) {
        // Also remove the separator lines next to it if possible?
        // The structure is: div.separator, button, div.separator
        // Let's just hide the button for safety, or remove it.
        headerToggle.style.display = 'none';

        // Try to hide the previous separator if it exists
        const prev = headerToggle.previousElementSibling;
        if (prev && prev.classList.contains('w-px')) {
            prev.style.display = 'none';
        }
    }

    // --- Redirect "Start Simulation" to Phase Change 3D (Workaround Location) ---
    // Finding the button with text "BẮT ĐẦU MÔ PHỎNG"
    const startSimBtn = Array.from(document.querySelectorAll('a')).find(el => el.textContent.includes('BẮT ĐẦU MÔ PHỎNG'));
    if (startSimBtn) {
        startSimBtn.href = 'js/su-chuyen-the.html';
    }

    // --- Global Sidebar Injection ---
    createGlobalSidebar();

    // --- Hide Legacy "Back to Home" Buttons ---
    // Strategy 1: Look for arrow-left icon
    const backBtnIcon = Array.from(document.querySelectorAll('a')).find(el => {
        const hasArrow = el.querySelector('[data-lucide="arrow-left"]');
        const href = el.getAttribute('href');
        const goesHome = href && (href.includes('index.html') || href === '../');
        return hasArrow && goesHome;
    });
    if (backBtnIcon) backBtnIcon.style.display = 'none';

    // Strategy 2: Look for text "Quay về Trang Chủ" or "Trang Chủ" in top-left
    const backBtnText = Array.from(document.querySelectorAll('a, button')).find(el => {
        const text = el.textContent.trim().toLowerCase();
        // Check for specific text content
        const hasText = text.includes('quay về trang chủ') || (text.includes('trang chủ') && el.classList.contains('absolute'));
        // Check position (if possible to infer from classes)
        const isTopLeft = (el.classList.contains('top-4') || el.classList.contains('top-6')) &&
            (el.classList.contains('left-4') || el.classList.contains('left-6'));

        return hasText || (text === 'trang chủ' && isTopLeft);
    });
    if (backBtnText) backBtnText.style.display = 'none';

    // --- HOMEPAGE GRID MERGE LOGIC ---
    updateHomepageGrid();

// --- STATIC THEORY SYSTEM INJECTION ---
// Sử dụng setTimeout ngắn để đảm bảo Tailwind/Lucide đã ổn định
setTimeout(function injectTheorySystem() {
    const path = window.location.pathname;
    const isHome = path.endsWith('index.html') || path.endsWith('/') || path.endsWith('\\') || path.toLowerCase().endsWith('/physicslab');
    if (isHome) return; // Do not inject on homepage

    const isJsDir = path.includes('/js/') || path.includes('\\js\\');
    const theoryScript = document.createElement('script');
    
    // Tìm đường dẫn tương đối chính xác
    const scriptPath = isJsDir ? './theory-system.js?v=4.0.6' : 'js/theory-system.js?v=4.0.6';
    
    theoryScript.src = scriptPath;
    theoryScript.async = true;
    
    if (!document.querySelector(`script[src*="theory-system.js"]`)) {
        (document.head || document.documentElement).appendChild(theoryScript);
    }
    console.log('[Theme System] Injected Theory System via:', scriptPath);
}, 100);

// --- PHYSICS AI CHATBOT INJECTION ---
setTimeout(function injectPhysicsAIChatbot() {
    const path = window.location.pathname;
    const isJsDir = path.includes('/js/') || path.includes('\\js\\');
    const aiScript = document.createElement('script');
    const scriptPath = isJsDir ? './physics-ai-chatbot.js?v=1.0.0' : 'js/physics-ai-chatbot.js?v=1.0.0';
    aiScript.src = scriptPath;
    aiScript.async = true;
    if (!document.querySelector(`script[src*="physics-ai-chatbot.js"]`)) {
        (document.head || document.documentElement).appendChild(aiScript);
    }
    console.log('[Theme System] Injected Physics AI Chatbot via:', scriptPath);
}, 100);
});

function createGlobalSidebar() {
    // 0. Sidebar is now enabled on all pages including Home for consistency
    const path = window.location.pathname;
    const isJsDir = path.includes('/js/');
    const rootPrefix = isJsDir ? '../' : './';

    // 2. Inject Styles
    const style = document.createElement('style');
    style.innerHTML = `
        #global-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            width: 280px;
            background: rgba(255, 255, 255, 0.6);
            backdrop-filter: blur(12px);
            box-shadow: 4px 0 15px rgba(0,0,0,0.1);
            z-index: 9999;
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            flex-direction: column;
            border-right: 1px solid rgba(0,0,0,0.1);
        }
        .dark #global-sidebar {
            background: rgba(15, 23, 42, 0.6);
            border-right: 1px solid rgba(255,255,255,0.1);
            box-shadow: 4px 0 15px rgba(0,0,0,0.5);
        }
        #global-sidebar.open {
            transform: translateX(0);
        }
        #sidebar-toggle-btn {
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 10000;
            background: white; /* Solid background */
            color: #b298d3; /* Pink/Purple Icon */
            padding: 10px; /* Larger padding */
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px; /* Larger size */
            height: 48px;
            border: 1px solid rgba(0,0,0,0.1);
            box-shadow: 0 4px 15px rgba(0,0,0,0.15); /* Strong shadow */
            outline: none;
        }
        #sidebar-toggle-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        }
        .dark #sidebar-toggle-btn {
            background: #1e293b;
            color: #38bdf8; /* Blue/Sky Icon */
            border: 1px solid rgba(56, 189, 248, 0.3);
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        }
        .dark #sidebar-toggle-btn:hover {
            background: #334155;
        }
        .sidebar-header {
            padding: 24px;
            border-bottom: 1px solid rgba(0,0,0,0.05);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .dark .sidebar-header {
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .sidebar-content {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
        }
        .sidebar-link {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            margin-bottom: 4px;
            border-radius: 12px;
            color: #475569;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.2s;
        }
        .dark .sidebar-link {
            color: #94a3b8;
        }
        .sidebar-link:hover {
            background: #f1f5f9;
            color: #0f172a;
            transform: translateX(4px);
        }
        .dark .sidebar-link:hover {
            background: #334155;
            color: white;
        }
        .sidebar-link.active {
            background: #b298d3; /* lab-cyan (Purple) */
            color: white;
        }
        .dark .sidebar-link.active {
            background: #06b6d4; /* lab-dark_cyan (Blue) */
        }
        .sidebar-tag {
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 4px;
            background: #e2e8f0;
            color: #64748b;
            margin-left: auto;
        }
        .dark .sidebar-tag {
            background: #334155;
            color: #94a3b8;
        }
        .dark .sidebar-divider {
            background: rgba(255, 255, 255, 0.1) !important;
        }
    `;
    document.head.appendChild(style);

    // 3. Create HTML Structure
    const links = [
        { name: "Trang Chủ", file: "index.html", icon: "home" },
        { name: "Dao Động Điều Hòa", file: "dao-dong-dieu-hoa.html", icon: "activity" },
        { name: "Con Lắc Đơn & Lò Xo", file: "con-lac-don-lo-xo.html", icon: "clock" },
        { name: "Dao Động Tắt Dần", file: "dao-dong-tat-dan.html", icon: "bar-chart-2" },
        { name: "Giao Thoa Sóng Cơ", file: "giao-thoa-song-co.html", icon: "waves" },
        { name: "Sóng Âm", file: "do-tan-so-song-am.html", icon: "mic" },
        { name: "Đo Tốc Độ Sóng Âm", file: "thi-nghiem-song-dung.html", icon: "music" },
        { name: "Sóng Dừng", file: "js/song-dung.html", icon: "align-center", isSpecial: true },
        { name: "Giao Thoa Ánh Sáng", file: "giao-thoa-anh-sang.html", icon: "sun" },
        { name: "Cơ chế sinh dòng điện", file: "dong-dien-kim-loai.html", icon: "zap", isSpecial: true },
        { name: "Đặc tuyến Điện Trở Nhiệt", file: "dien-tro-nhiet.html", icon: "thermometer", isSpecial: true },
        { name: "Khảo sát Nguồn điện & Mạch kín", file: "nguon-dien-mach-kin.html", icon: "zap", isSpecial: true },
        { name: "Mạch Điện DC — MNA", file: "mach-dien-dc.html", icon: "circuit-board", isSpecial: true },
        { name: "Đo E & r của Pin", file: "do-suat-dien-dong.html", icon: "battery-charging" },
        { name: "Chuyển Thể 3D - Beta", file: "js/su-chuyen-the.html", icon: "box", isSpecial: true }
    ];

    // --- Dynamic Module Injection ---
    // [SECURITY] Validate và sanitize toàn bộ dữ liệu từ localStorage trước khi sử dụng.
    // Ngăn chặn: XSS qua tên module, Path Traversal qua id, Prototype Pollution.
    try {
        const raw = localStorage.getItem('custom_modules');
        const storedModules = raw ? JSON.parse(raw) : [];

        // [SECURITY] Whitelist các icon name hợp lệ của Lucide
        const ALLOWED_ICONS = [
            'box', 'zap', 'activity', 'atom', 'flask-conical', 'waves',
            'mic', 'music', 'sun', 'thermometer', 'cpu', 'bar-chart-2',
            'align-center', 'clock', 'repeat', 'trending-down', 'scale'
        ];

        // [SECURITY] Hàm strip HTML tags — ngăn XSS khi render innerHTML
        const stripHtml = (str) => String(str).replace(/<[^>]*>/g, '').trim();

        if (Array.isArray(storedModules)) {
            storedModules.forEach(mod => {
                // [SECURITY] Bỏ qua nếu không phải object hoặc thiếu trường bắt buộc
                if (!mod || typeof mod !== 'object') return;
                if (!mod.id || !mod.name) return;

                // [SECURITY] Sanitize từng trường: strip HTML + giới hạn độ dài
                const safeId   = stripHtml(mod.id).slice(0, 64);
                const safeName = stripHtml(mod.name).slice(0, 60);

                // [SECURITY] Chỉ cho phép id chứa ký tự an toàn (alphanumeric, dấu gạch)
                if (!/^[a-zA-Z0-9_\-]+$/.test(safeId)) {
                    console.warn('[Security] Module id chứa ký tự không hợp lệ, bỏ qua:', safeId);
                    return;
                }

                // [SECURITY] Chỉ dùng icon nếu nằm trong whitelist, fallback sang 'box'
                const safeIcon = ALLOWED_ICONS.includes(mod.icon) ? mod.icon : 'box';

                links.push({
                    name: safeName,
                    file: `viewer.html?id=${safeId}`,
                    icon: safeIcon,
                    isSpecial: false,
                    isCustom: true
                });
            });
        }
    } catch (e) {
        // [SECURITY] Fail Closed — xóa dữ liệu hỏng, không để lọt vào UI
        console.warn('[Security] Failed to load custom_modules, clearing corrupted data:', e);
        try { localStorage.removeItem('custom_modules'); } catch (_) {}
    }

    const sidebar = document.createElement('div');
    sidebar.id = 'global-sidebar';

    // Header
    sidebar.innerHTML = `
        <div class="sidebar-header">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-lab-cyan to-purple-600 dark:from-lab-dark_cyan dark:to-sky-600 flex items-center justify-center text-white font-bold">P</div>
                <span class="font-bold text-lg dark:text-white">Physics Lab</span>
            </div>
            <button id="sidebar-close" class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <i data-lucide="x" class="w-5 h-5 text-slate-500 dark:text-slate-400"></i>
            </button>
        </div>
        <div class="sidebar-content">
            <!-- Links injected here -->
        </div>
        <div class="p-4 border-t border-slate-100 dark:border-slate-800">
            <button onclick="toggleDarkMode()" class="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-semibold text-slate-600 dark:text-slate-300">
                 <i data-lucide="moon" class="w-4 h-4"></i> Đổi Giao Diện
            </button>
        </div>
    `;

    // Inject Links
    const content = sidebar.querySelector('.sidebar-content');
    const currentPath = window.location.pathname;

    links.forEach(link => {
        const a = document.createElement('a');

        // Resolve Path
        let href = '';
        if (link.file.startsWith('js/')) {
            const filename = link.file.split('/').pop();
            href = isJsDir ? './' + filename : link.file;
        } else {
            href = rootPrefix + link.file;
        }

        a.href = href;
        a.className = 'sidebar-link';
        // Strict check for active state to avoid partial matches (e.g. song-dung matching thi-nghiem-song-dung)
        const currentFilename = currentPath.split('/').pop().split('?')[0]; // Handle query params if any
        const linkFilename = link.file.split('/').pop();

        if (currentFilename === linkFilename) {
            a.classList.add('active');
        }

        a.innerHTML = `
            <i data-lucide="${link.icon}" class="w-5 h-5" style="min-width: 20px;"></i>
            <div class="flex flex-col">
                <span class="truncate">${link.name}</span>
                ${link.note ? `<span class="text-[10px] text-orange-500 italic font-normal">${link.note}</span>` : ''}
            </div>
            ${link.isSpecial && !link.note ? '<span class="sidebar-tag">New</span>' : ''}
            ${link.isCustom ? '<span class="sidebar-tag text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30">User</span>' : ''}
        `;
        content.appendChild(a);

        // Add divider after "Trang Chủ" (first item)
        if (link.name === "Trang Chủ") {
            const divider = document.createElement('div');
            divider.style.cssText = `
                height: 1px;
                background: rgba(0, 0, 0, 0.1);
                margin: 12px 8px;
            `;
            divider.className = 'sidebar-divider';
            content.appendChild(divider);
        }
    });

    document.body.appendChild(sidebar);

    // 4. Logo Layout Fix (Prevent Overlap)
    adjustHeaderLayout();

    // Toggle Button
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'sidebar-toggle-btn';
    toggleBtn.innerHTML = `<i data-lucide="menu" class="w-6 h-6"></i>`;
    document.body.appendChild(toggleBtn);

    // --- DRAGGABLE LOGIC ---
    let isDragging = false;
    let hasMoved = false;

    // Restore Position
    const savedPos = JSON.parse(localStorage.getItem('sidebar_toggle_pos'));
    if (savedPos) {
        toggleBtn.style.left = savedPos.x + 'px';
        toggleBtn.style.top = savedPos.y + 'px';
        toggleBtn.style.right = 'auto'; // Override default if any
    }

    // Drag Implementation
    toggleBtn.addEventListener('mousedown', (e) => {
        isDragging = true;
        hasMoved = false; // Reset move check

        const rect = toggleBtn.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        const onMouseMove = (moveEvent) => {
            if (!isDragging) return;
            hasMoved = true;
            toggleBtn.style.transition = 'none'; // Disable transition during drag

            let newX = moveEvent.clientX - offsetX;
            let newY = moveEvent.clientY - offsetY;

            // Boundaries
            const maxW = window.innerWidth - rect.width;
            const maxH = window.innerHeight - rect.height;
            newX = Math.max(0, Math.min(newX, maxW));
            newY = Math.max(0, Math.min(newY, maxH));

            toggleBtn.style.left = newX + 'px';
            toggleBtn.style.top = newY + 'px';
        };

        const onMouseUp = () => {
            isDragging = false;
            toggleBtn.style.transition = 'all 0.2s ease'; // Restore transition

            // Save Position
            const finalRect = toggleBtn.getBoundingClientRect();
            localStorage.setItem('sidebar_toggle_pos', JSON.stringify({ x: finalRect.left, y: finalRect.top }));

            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    // Logic
    function toggleSidebar() {
        sidebar.classList.toggle('open');
    }

    // Handle Click (Only if not dragged)
    toggleBtn.addEventListener('click', (e) => {
        if (hasMoved) {
            e.preventDefault();
            e.stopPropagation();
        } else {
            toggleSidebar();
        }
    });

    sidebar.querySelector('#sidebar-close').addEventListener('click', toggleSidebar);

    // Re-init icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/**
 * Adjust header/logo position to make room for the sidebar toggle
 */
function adjustHeaderLayout() {
    // 1. Try semantic header
    const header = document.querySelector('header');
    if (header) {
        // Check if header is fixed/top
        const style = window.getComputedStyle(header);
        if (style.position === 'fixed' || style.position === 'absolute' || style.top === '0px') {
            header.style.transition = 'padding-left 0.3s ease';
            header.style.paddingLeft = '60px'; // Shift content right
        }
    }

    // 2. Find "Physics Lab" text specifically
    // We look for an element that *contains* the text, but isn't the whole body
    const logocandidates = Array.from(document.querySelectorAll('a, h1, div, span'));
    const logoEl = logocandidates.find(el => {
        return el.textContent.includes('Physics Lab') &&
            (el.tagName === 'H1' || el.classList.contains('logo') || el.classList.contains('brand') || el.classList.contains('font-bold'));
    });

    if (logoEl) {
        // User requested to REMOVE the logo
        logoEl.style.display = 'none';

        // Also try to remove the P logo square if adjacent
        const prev = logoEl.previousElementSibling;
        if (prev && prev.textContent.trim() === 'P') {
            prev.style.display = 'none';
        }
    }
}

/**
 * Update Homepage Grid: Replace separate standing wave cards with Unified card
 */
function updateHomepageGrid() {
    // Check if we are on Homepage
    const path = window.location.pathname;
    const isHome = path.endsWith('index.html') || path.endsWith('/') || path.endsWith('\\') || path.toLowerCase().endsWith('/physicslab');
    if (!isHome) return;

    // Remove old cards
    const linksToRemove = ['song-dung-2-co-dinh.html', 'song-dung-1-tu-do.html'];
    let refCard = null; // Store a reference to check styling/location

    linksToRemove.forEach(href => {
        const linkEl = document.querySelector(`a[href="${href}"]`);
        if (linkEl) {
            // Find parent card container if it exists? 
            // The structure is usually <a>...</a> acting as card, or <div><a></a></div>
            // In index.html, the <a> tag is the card.
            if (!refCard) refCard = linkEl; // Save first one found as visual reference template
            linkEl.style.display = 'none'; // Hide it
        }
    });

    // Check if new card already exists
    if (document.querySelector('a[href="js/song-dung.html"]')) return;

    // Insert new card
    const grid = document.querySelector('.grid');
    if (grid) {
        // Create element
        const newCard = document.createElement('a');
        newCard.href = 'js/song-dung.html';
        // Generic classes based on project style
        newCard.className = "bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 block module-card";

        newCard.innerHTML = `
            <div class="w-12 h-12 rounded-xl bg-purple-100 dark:bg-sky-900/30 flex items-center justify-center text-purple-600 dark:text-sky-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                 <i data-lucide="align-center" class="w-6 h-6"></i>
            </div>
            <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-sky-400 transition-colors">Sóng Dừng</h3>
            <p class="text-sm text-gray-500 dark:text-slate-400">Mô phỏng 2 đầu cố định và 1 đầu tự do trong cùng một module.</p>
        `;

        // Append to grid
        grid.insertBefore(newCard, grid.children[5]); // Insert roughly in middle

        // Re-init icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// === GLOBAL AUTO-PAUSE ===
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Tab hidden: Pausing activities...');
        window.dispatchEvent(new CustomEvent('app-paused'));
    } else {
        console.log('Tab visible: Resuming activities...');
        window.dispatchEvent(new CustomEvent('app-resumed'));
    }
});

// === KEYBOARD SCREENSHOT PROTECTION ===
(function initScreenshotProtection() {

    // --- Toast Notification ---
    function showSecurityToast(msg) {
        const existing = document.getElementById('__sec-toast__');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = '__sec-toast__';
        toast.textContent = '🔒 ' + msg;
        toast.style.cssText = `
            position: fixed;
            bottom: 28px;
            left: 50%;
            transform: translateX(-50%) translateY(0);
            background: rgba(15, 23, 42, 0.92);
            color: #f87171;
            font-family: 'JetBrains Mono', monospace;
            font-size: 13px;
            font-weight: 600;
            padding: 10px 20px;
            border-radius: 10px;
            border: 1px solid rgba(239, 68, 68, 0.4);
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.25);
            z-index: 2147483647;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
        `;
        document.body.appendChild(toast);
        requestAnimationFrame(() => { toast.style.opacity = '1'; });
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 250);
        }, 2200);
    }

    // --- Xóa Clipboard ---
    function clearClipboard() {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText('[Physics Lab] Chức năng chụp màn hình bị vô hiệu hóa.')
                .catch(() => {});
        }
        // Fallback cho trình duyệt cũ
        try {
            const el = document.createElement('textarea');
            el.value = '[Physics Lab] Chức năng chụp màn hình bị vô hiệu hóa.';
            el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        } catch (_) {}
    }

    // --- Bộ phát hiện phím ---
    document.addEventListener('keydown', function(e) {

        // 1. PrintScreen (keyCode 44)
        if (e.key === 'PrintScreen' || e.keyCode === 44) {
            e.preventDefault();
            clearClipboard();
            showSecurityToast('Chụp màn hình bị chặn — Physics Lab');
            console.warn('[Security] PrintScreen bị chặn.');
            return false;
        }

        // 2. Ctrl + Shift + S (Save As nhiều trình duyệt/app)
        if (e.ctrlKey && e.shiftKey && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            e.stopPropagation();
            showSecurityToast('Lưu trang bị vô hiệu hóa — Physics Lab');
            console.warn('[Security] Ctrl+Shift+S bị chặn.');
            return false;
        }

        // 3. Ctrl + S (lưu trang web)
        if (e.ctrlKey && !e.shiftKey && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            e.stopPropagation();
            showSecurityToast('Lưu trang bị vô hiệu hóa — Physics Lab');
            console.warn('[Security] Ctrl+S bị chặn.');
            return false;
        }

        // 4. Ctrl + P (in trang)
        if (e.ctrlKey && (e.key === 'p' || e.key === 'P')) {
            e.preventDefault();
            e.stopPropagation();
            showSecurityToast('In trang bị vô hiệu hóa — Physics Lab');
            console.warn('[Security] Ctrl+P bị chặn.');
            return false;
        }

    }, true); // useCapture = true: bắt sự kiện trước khi bubble lên

    // --- Chặn menu chuột phải ---
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showSecurityToast('Nhấp chuột phải bị vô hiệu hóa — Physics Lab');
        return false;
    });

    console.log('[Security] Keyboard screenshot protection đã được kích hoạt.');
})();

