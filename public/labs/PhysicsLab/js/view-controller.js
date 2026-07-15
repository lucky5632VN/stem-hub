/**
 * View Controller
 * Handles toggling between Grid and List views for the modules section.
 */

function setModuleView(viewMode) {
    const gridContainer = document.getElementById('module-grid');
    const btnGrid = document.getElementById('btn-grid-view');
    const btnList = document.getElementById('btn-list-view');

    if (!gridContainer || !btnGrid || !btnList) return;

    // Reset logic
    if (viewMode === 'list') {
        gridContainer.classList.add('list-view');

        // Update Buttons Apperance (Active state)
        btnList.classList.add('bg-slate-100', 'dark:bg-slate-700', 'text-lab-cyan');
        btnList.classList.remove('text-slate-400', 'dark:text-white', 'hover:bg-white');

        btnGrid.classList.remove('bg-white', 'dark:bg-lab-dark_panel', 'text-lab-cyan');
        btnGrid.classList.add('text-slate-400', 'hover:text-slate-700', 'dark:hover:text-white');

        localStorage.setItem('moduleView', 'list');
    } else {
        gridContainer.classList.remove('list-view');

        // Update Buttons Apperance (Active state)
        btnGrid.classList.add('bg-white', 'dark:bg-lab-dark_panel', 'text-lab-cyan');
        btnGrid.classList.remove('text-slate-400', 'hover:text-slate-700');

        btnList.classList.remove('bg-slate-100', 'dark:bg-slate-700', 'text-lab-cyan');
        btnList.classList.add('text-slate-400', 'dark:text-white', 'hover:bg-white');

        localStorage.setItem('moduleView', 'grid');
    }
}

function initView() {
    const savedView = localStorage.getItem('moduleView') || 'grid';
    setModuleView(savedView);

    // Event Listeners
    const btnGrid = document.getElementById('btn-grid-view');
    const btnList = document.getElementById('btn-list-view');

    if (btnGrid) btnGrid.onclick = () => setModuleView('grid');
    if (btnList) btnList.onclick = () => setModuleView('list');
}

// Init on load
document.addEventListener('DOMContentLoaded', initView);
