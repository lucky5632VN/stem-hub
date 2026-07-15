/**
 * Module Manager
 * Handles creating, saving, loading, and deleting custom simulation modules.
 * Uses localStorage for persistence.
 */

const STORAGE_KEY = 'custom_modules';

const ModuleManager = {
    /**
     * Get all modules
     * @returns {Array} List of module objects
     */
    getAllModules: () => {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    /**
     * Get a specific module by ID
     * @param {string} id 
     * @returns {Object|null}
     */
    getModuleById: (id) => {
        const modules = ModuleManager.getAllModules();
        return modules.find(m => m.id === id) || null;
    },

    /**
     * Save a new module
     * @param {Object} moduleData { name, description, code, icon }
     */
    saveModule: (moduleData) => {
        const modules = ModuleManager.getAllModules();
        const newModule = {
            id: 'mod_' + Date.now().toString(36), // Simple unique ID
            createdAt: new Date().toISOString(),
            ...moduleData
        };

        modules.push(newModule);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
        return newModule;
    },

    /**
     * Delete a module
     * @param {string} id 
     */
    deleteModule: (id) => {
        let modules = ModuleManager.getAllModules();
        modules = modules.filter(m => m.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));

        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('modules-updated'));
    },

    /**
     * Render the "New Module" card and Custom Modules into the Grid
     * @param {HTMLElement} container 
     */
    renderToHomeGrid: (container) => {
        if (!container) return;

        // 1. Render "New Module" Card (Always First or Fixed)
        // We actually want this to be part of the grid.
        // Let's create the element string.

        const newModuleCardHTML = `
            <a href="create-module.html" 
               class="module-card glass-panel rounded-xl p-6 relative group block text-center border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-lab-cyan dark:hover:border-lab-cyan transition-all duration-300 flex flex-col items-center justify-center min-h-[300px]">
                
                <div class="h-16 w-16 mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-lab-cyan group-hover:scale-110 transition-all duration-300 shadow-inner">
                    <i data-lucide="plus" class="w-8 h-8"></i>
                </div>
                
                <h3 class="text-xl font-bold text-slate-700 dark:text-slate-300 group-hover:text-lab-cyan font-tech mb-2">
                    Module Mới
                </h3>
                
                <p class="text-sm text-slate-500 dark:text-slate-400 font-light max-w-[200px]">
                    Thêm mô phỏng vật lý tiếp theo vào thư viện của bạn.
                </p>

                <div class="mt-8 flex items-center gap-2 text-xs font-mono text-slate-400">
                    <i data-lucide="infinity" class="w-3 h-3"></i> Tương lai
                    <i data-lucide="arrow-right" class="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform"></i>
                </div>
            </a>
        `;

        // 2. Get Custom Modules
        const customModules = ModuleManager.getAllModules();

        let customModulesHTML = customModules.map(mod => `
            <a href="viewer.html?id=${mod.id}" 
               class="module-card glass-panel rounded-xl p-6 relative group block overflow-hidden">
                <!-- Custom Marker -->
                <div class="absolute top-0 right-0 p-2 opacity-50">
                   <div class="text-[10px] font-mono border border-slate-300 dark:border-slate-600 rounded px-1 text-slate-500">CUSTOM</div>
                </div>

                <div class="flex items-start justify-between mb-5 relative z-10">
                    <div class="h-12 w-12 rounded-full bg-indigo-100/70 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-700/50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-md">
                        <i data-lucide="${mod.icon || 'box'}" class="w-6 h-6"></i>
                    </div>
                    <span class="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                        User Mod
                    </span>
                </div>

                <h3 class="module-title text-xl font-bold text-slate-800 dark:text-lab-dark_text font-tech mb-2 group-hover:text-indigo-500 transition">
                    ${mod.name}
                </h3>
                <p class="module-description text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6 font-light">
                    ${mod.description}
                </p>

                <div class="pt-4 border-t border-lab-accent/20 dark:border-slate-700 flex items-center justify-between group-hover:border-indigo-500/30 transition-colors">
                    <div class="flex items-center gap-1.5 text-xs font-mono text-indigo-600 font-semibold">
                        <i data-lucide="code" class="w-3 h-3"></i> Custom Code
                    </div>
                    
                    <button onclick="event.preventDefault(); ModuleManager.deleteModule('${mod.id}'); location.reload();" class="text-slate-400 hover:text-red-500 transition-colors z-20" title="Delete Module">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </a>
        `).join('');

        // Append to container. 
        // Note: This logic assumes we append these AFTER the static grid items. 
        // Ideally, we should have a placeholder or just append to end of grid.

        // We will insert the "New Module" card first, then the custom modules.

        // Since the static modules are hardcoded in HTML, we can just append these to the innerHTML?
        // Or we can use `insertAdjacentHTML`.

        container.insertAdjacentHTML('beforeend', customModulesHTML + newModuleCardHTML);

        // Re-init icons
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
};

// Auto-init on index page
document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('module-grid');
    if (grid) {
        ModuleManager.renderToHomeGrid(grid);
    }
});
