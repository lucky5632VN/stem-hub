// sim-dong-dien.js - Quantum Simulation Engine for I = Snve (Multi-Environment)

const canvas = document.getElementById('sim-canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const wrapper = document.getElementById('canvas-wrapper');

// Setup UI Elements
const sliderS = document.getElementById('slider-S');
const sliderN = document.getElementById('slider-n');
const sliderV = document.getElementById('slider-v');
const valS = document.getElementById('val-S');
const valN = document.getElementById('val-n');
const valV = document.getElementById('val-v');

const readoutI = document.getElementById('readout-I');
const gaugeFill = document.getElementById('gauge-fill');
const particleCountDisplay = document.getElementById('particle-count-display');
const fpsCounter = document.getElementById('fps-counter');
const mathContainer = document.getElementById('math-equation-container');

// Environment State
let currentEnv = 'metal'; // 'metal', 'semi', 'electro', 'gas'

// Visual Settings
const COLORS = {
    bg: '#050810',
    velVector: '#FF0055',
    hudGlow: 'rgba(0, 229, 255, 0.2)',
    dangerBg: '#1a0b0b'
};

// Physics Variables
let S = 1.0;
let n = 500;
let v = 0.5;
const e = 1.6;

let currentI = 0;
let targetI = 0;

// ── Bidirectional I↔v coupling ──────────────────────────────
let _editingI = false; // true while user is typing in the I field

/** Called when user types directly into the I readout */
function onIInput(rawVal) {
    const Iinput = parseFloat(rawVal);
    if (isNaN(Iinput) || Iinput < 0) return;

    // Back-calculate v from I = S·(n/100)·v·e  →  v = I / (S·(n/100)·e)
    // For all environments use the metal formula as the primary mapping;
    // users see v change, animation updates accordingly.
    const denominator = S * (n / 100) * e;
    if (denominator < 1e-9) return;

    const vCalc = Iinput / denominator;
    const vClamped = Math.min(Math.max(vCalc, 0), 3.0); // clamp to slider range

    // Sync the v variable and slider without retriggering onIInput
    v = vCalc; // allow out-of-range for display, but clamp slider thumb
    sliderV.value = vClamped.toFixed(2);
    valV.innerText = vClamped.toFixed(1);

    // Drive the animation target directly from typed value
    targetI = Iinput;
    currentI = Iinput; // snap immediately so the gauge responds
}

// Off-screen canvas generator helper
function createParticleCanvas(coreColor, glowColor, size = 16) {
    const pc = document.createElement('canvas');
    pc.width = size;
    pc.height = size;
    const pCtx = pc.getContext('2d');
    const center = size / 2;
    const pGradient = pCtx.createRadialGradient(center, center, 0, center, center, center);
    pGradient.addColorStop(0, '#FFFFFF');
    pGradient.addColorStop(0.2, coreColor);
    pGradient.addColorStop(1, glowColor);
    pCtx.fillStyle = pGradient;
    pCtx.fillRect(0, 0, size, size);
    return pc;
}

// Particle Textures
const texElectron = createParticleCanvas('#00E5FF', 'rgba(0, 229, 255, 0)');
const texHole = createParticleCanvas('#FF9D00', 'rgba(255, 157, 0, 0)'); // Orange for Holes
const texCation = createParticleCanvas('#B000FF', 'rgba(176, 0, 255, 0)', 24); // Purple/Bigger for Cations
const texAnion = createParticleCanvas('#00FF66', 'rgba(0, 255, 102, 0)', 24); // Lime/Bigger for Anions
const texHighlight = createParticleCanvas('#FFFFFF', 'rgba(255, 255, 255, 0)', 32);
const texLattice = createParticleCanvas('#FF3366', 'rgba(255, 51, 102, 0)', 28); // Muted red/pink for Lattice Ions

// Particle System
let particles = [];
let latticeNodes = [];
let width, height;

function resizeCanvas() {
    const rect = wrapper.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    // Remove solid initial fill to make Canvas transparent
    ctx.clearRect(0, 0, width, height);
    generateLattice();
}
window.addEventListener('resize', resizeCanvas);

function generateLattice() {
    latticeNodes = [];
    if (currentEnv !== 'metal') return;
    
    const wireHeight = height * 0.2 * S;
    const cy = height / 2;
    const startY = cy - wireHeight / 2 + 15;
    const endY = cy + wireHeight / 2 - 15;
    
    for (let x = 30; x < width; x += 70) {
        for (let y = startY; y <= endY + 1; y += 45) {
            latticeNodes.push({
                baseX: x, baseY: y,
                phase: Math.random() * Math.PI * 2
            });
        }
    }
}

// Initial call
resizeCanvas();

class ChargedParticle {
    constructor(type) {
        this.type = type; // 'electron', 'hole', 'cation', 'anion', 'plasma-ion'
        
        switch(type) {
            case 'electron':
                this.charge = -1;
                this.texture = texElectron;
                this.baseSize = 2;
                this.massOffset = 1.0; // Normal drift
                break;
            case 'hole':
                this.charge = 1;
                this.texture = texHole;
                this.baseSize = 2.2;
                this.massOffset = 0.6; // Holes move slower
                break;
            case 'cation':
                this.charge = 1;
                this.texture = texCation;
                this.baseSize = 4;
                this.massOffset = 0.3; // Heavy ions
                break;
            case 'anion':
                this.charge = -1;
                this.texture = texAnion;
                this.baseSize = 4.2;
                this.massOffset = 0.25; // Heavy ions
                break;
        }
        this.reset(true);
    }
    
    reset(randomX = false) {
        const wireHeight = height * 0.2 * S;
        const centerY = height / 2;
        let minY = centerY - wireHeight / 2 + 5;
        let maxY = centerY + wireHeight / 2 - 5;
        
        // Gas/Plasma can escape the wire slightly due to chaos
        if (currentEnv === 'gas') {
            minY -= 20; maxY += 20;
        }
        
        this.x = randomX ? Math.random() * width : (this.charge === -1 ? -20 : width + 20);
        this.y = minY + Math.random() * (maxY - minY);
        
        // High thermal noise for Plasma, normal for others
        const thermalAmp = currentEnv === 'gas' ? 5 : 2;
        this.vxThermal = (Math.random() - 0.5) * thermalAmp;
        this.vyThermal = (Math.random() - 0.5) * thermalAmp;
        
        this.size = this.baseSize + Math.random();
    }
    
    update() {
        const thermalAmp = currentEnv === 'gas' ? 1.5 : 0.5;
        this.vxThermal += (Math.random() - 0.5) * thermalAmp;
        this.vyThermal += (Math.random() - 0.5) * thermalAmp;
        this.vxThermal *= 0.95;
        this.vyThermal *= 0.95;
        
        // Drift velocity depends on charge and mass
        // Electrons (charge -1) move Right (positive X). Holes/Positive move Left (negative X).
        const scaledDrift = v * 5 * this.massOffset * (this.charge * -1); 
        
        this.x += this.vxThermal + scaledDrift;
        this.y += this.vyThermal;
        
        const wireHeight = height * 0.2 * S;
        const centerY = height / 2;
        const minY = centerY - wireHeight / 2 + 2;
        const maxY = centerY + wireHeight / 2 - 2;
        
        if (currentEnv !== 'gas') {
            if (this.y < minY) { this.y = minY; this.vyThermal *= -1; }
            if (this.y > maxY) { this.y = maxY; this.vyThermal *= -1; }
        }
        
        // Wrap around X
        if (this.charge === -1 && this.x > width + 20) this.reset(false);
        if (this.charge === 1 && this.x < -20) this.reset(false);
        // Gas bounds
        if (currentEnv === 'gas' && (this.x < -20 || this.x > width + 20)) this.reset(false);
    }
    
    draw(ctx, highlightedVar) {
        if (highlightedVar === 'n') {
            const drawSize = this.size * 5;
            ctx.drawImage(texHighlight, this.x - drawSize/2, this.y - drawSize/2, drawSize, drawSize);
        } else {
            const drawSize = this.size * 4;
            ctx.drawImage(this.texture, this.x - drawSize/2, this.y - drawSize/2, drawSize, drawSize);
        }
        
        if (highlightedVar === 'v' && v > 0) {
            const scaledDrift = v * 15 * this.massOffset * (this.charge * -1);
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + scaledDrift, this.y);
            ctx.strokeStyle = COLORS.velVector;
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Arrowhead direction depends on charge
            const dir = this.charge === -1 ? -3 : 3;
            ctx.beginPath();
            ctx.moveTo(this.x + scaledDrift, this.y);
            ctx.lineTo(this.x + scaledDrift + dir, this.y - 2);
            ctx.lineTo(this.x + scaledDrift + dir, this.y + 2);
            ctx.fillStyle = COLORS.velVector;
            ctx.fill();
        }
    }
}

// Logic Binding & Environment Switching
function updateMathEquation() {
    let eqHTML = '';
    const spanHov = (id, color, hoverID) => `<span class="math-interactive text-[${color}] opacity-70 hover:opacity-100 hover:drop-shadow-[0_0_10px_${color}] hover:scale-110" onmouseover="highlightVar('${hoverID}')" onmouseout="resetHighlight()" id="math-${id}">${id}</span>`;
    
    if (currentEnv === 'metal') {
        eqHTML = `<span class="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">I</span> <span class="text-lab-dark_muted">=</span> ${spanHov('S', '#00FF66', 'S')} <span class="text-lab-dark_muted text-sm">&times;</span> ${spanHov('n_e', '#FFF', 'n')} <span class="text-lab-dark_muted text-sm">&times;</span> ${spanHov('v_e', '#FF0055', 'v')} <span class="text-lab-dark_muted text-sm">&times;</span> <span class="text-[#00E5FF]">e</span>`;
    } else if (currentEnv === 'semi') {
        eqHTML = `<span class="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">I</span> <span class="text-lab-dark_muted">=</span> ${spanHov('S', '#00FF66', 'S')} <span class="text-lab-dark_muted font-mono">(</span> ${spanHov('n_e', '#00E5FF', 'n')}<span class="text-lab-dark_muted text-sm">&middot;</span>${spanHov('v_e', '#FF0055', 'v')} <span class="text-white">+</span> ${spanHov('n_p', '#FF9D00', 'n')}<span class="text-lab-dark_muted text-sm">&middot;</span>${spanHov('v_p', '#FF0055', 'v')} <span class="text-lab-dark_muted font-mono">)</span> <span class="text-[#00E5FF]">e</span>`;
    } else if (currentEnv === 'electro') {
        eqHTML = `<span class="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">I</span> <span class="text-lab-dark_muted">=</span> ${spanHov('S', '#00FF66', 'S')} <span class="text-lab-dark_muted font-mono">(</span> <span class="text-[#B000FF] hover:scale-110">n<sub>+</sub>v<sub>+</sub></span> <span class="text-white">+</span> <span class="text-[#00FF66] hover:scale-110">n<sub>-</sub>v<sub>-</sub></span> <span class="text-lab-dark_muted font-mono">)</span> <span class="text-[#00E5FF]">e</span>`;
    } else { // gas
        eqHTML = `<span class="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">I</span> <span class="text-lab-dark_muted">=</span> <span class="text-[#FF0055]">PLASMA CHAOS</span>`;
    }
    
    mathContainer.innerHTML = eqHTML;
}

function updateI() {
    // Calculate total I based on environment
    if (currentEnv === 'metal') {
        targetI = S * (n/100) * v * e;
    } else if (currentEnv === 'semi') {
        targetI = S * ((n/100) * v + (n*0.8/100) * (v*0.6)) * e; // Holes are 80% count, 60% speed
    } else if (currentEnv === 'electro') {
        targetI = S * ((n/150) * (v*0.3) + (n/150) * (v*0.25)) * e; // Slower ions
    } else { // gas
        targetI = S * (n/50) * v * e; // Highly conductive
    }
    
    valS.innerText = S.toFixed(1);
    valN.innerText = n;
    valV.innerText = v.toFixed(1);
}

function updateParticleCount() {
    const targetCount = Math.floor(parseInt(n) / 5); 
    particles = []; // Clear for re-spawn on environment switch
    
    while (particles.length < targetCount) {
        if (currentEnv === 'metal') {
            particles.push(new ChargedParticle('electron'));
        } else if (currentEnv === 'semi') {
            particles.push(new ChargedParticle(Math.random() > 0.4 ? 'electron' : 'hole'));
        } else if (currentEnv === 'electro') {
            particles.push(new ChargedParticle(Math.random() > 0.5 ? 'cation' : 'anion'));
        } else if (currentEnv === 'gas') {
            let rand = Math.random();
            if (rand < 0.6) particles.push(new ChargedParticle('electron'));
            else if (rand < 0.8) particles.push(new ChargedParticle('cation'));
            else particles.push(new ChargedParticle('anion'));
        }
    }
    particleCountDisplay.innerText = `P: ${targetCount} (Visual)`;
}

// Environment Tabs
document.querySelectorAll('.env-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        // Reset old tab
        document.querySelectorAll('.env-tab').forEach(t => {
            t.classList.remove('active', 'bg-[#00E5FF]', 'text-black', 'font-bold', 'shadow-[0_0_10px_rgba(0,229,255,0.5)]');
            t.classList.add('text-lab-dark_muted');
        });
        
        // Active new tab
        e.target.classList.remove('text-lab-dark_muted');
        e.target.classList.add('active', 'bg-[#00E5FF]', 'text-black', 'font-bold', 'shadow-[0_0_10px_rgba(0,229,255,0.5)]');
        
        currentEnv = e.target.getAttribute('data-env');
        updateMathEquation();
        updateParticleCount();
        updateI();
        generateLattice();
    });
});

sliderS.addEventListener('input', (e) => { S = parseFloat(e.target.value); updateI(); generateLattice(); });
sliderN.addEventListener('input', (e) => { n = parseInt(e.target.value); updateI(); updateParticleCount(); });
sliderV.addEventListener('input', (e) => { v = parseFloat(e.target.value); updateI(); });

let currentHighlight = null;
window.highlightVar = function(v) { currentHighlight = v; };
window.resetHighlight = function() { currentHighlight = null; };

// Main render loop
let lastTime = 0;
let frameCount = 0;
let lastFpsTime = 0;

function render(time) {
    frameCount++;
    if (time - lastFpsTime >= 1000) {
        fpsCounter.innerText = frameCount;
        frameCount = 0;
        lastFpsTime = time;
    }
    
    currentI += (targetI - currentI) * 0.1;

    // Only update the readout when the user is NOT actively editing it
    if (!_editingI) {
        readoutI.value = currentI.toFixed(2);
    }
    
    const maxI = 150;
    const progress = Math.min(currentI / maxI, 1);
    const dashOffset = 251.2 * (1 - progress);
    gaugeFill.style.strokeDashoffset = dashOffset;
    
    if (progress > 0.8) {
        document.getElementById('ambient-container').classList.add('scale-[1.002]');
        wrapper.style.boxShadow = '0 0 30px rgba(255, 0, 85, 0.2)';
        wrapper.style.backgroundColor = 'rgba(255, 0, 40, 0.1)'; // Heat glow
        const jitterX = (Math.random() - 0.5) * 2;
        const jitterY = (Math.random() - 0.5) * 2;
        document.getElementById('hud-container').style.transform = `translate(${jitterX}px, ${jitterY}px)`;
    } else {
        document.getElementById('ambient-container').classList.remove('scale-[1.002]');
        wrapper.style.boxShadow = '';
        wrapper.style.backgroundColor = 'transparent';
        document.getElementById('hud-container').style.transform = `none`;
    }
    
    // Transparent Motion Blur (Fade Alpha)
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'; // Cuts 25% opacity each frame
    ctx.fillRect(0, 0, width, height);
    
    // Reset back to normal for rendering wire and others
    ctx.globalCompositeOperation = 'source-over';
    
    const wireHeight = height * 0.2 * S;
    const cy = height / 2;
    
    ctx.strokeStyle = currentHighlight === 'S' ? '#00FF66' : 'rgba(0, 255, 102, 0.15)';
    ctx.lineWidth = currentHighlight === 'S' ? 2 : 1;
    if (currentHighlight === 'S') ctx.shadowBlur = 10; ctx.shadowColor = '#00FF66';
    
    if (currentEnv !== 'gas') {
        ctx.beginPath();
        ctx.moveTo(0, cy - wireHeight / 2);
        ctx.lineTo(width, cy - wireHeight / 2);
        ctx.moveTo(0, cy + wireHeight / 2);
        ctx.lineTo(width, cy + wireHeight / 2);
        ctx.stroke();
        
        if (currentHighlight === 'S') {
            ctx.strokeStyle = 'rgba(0, 255, 102, 0.2)';
            ctx.beginPath();
            for(let x = 0; x < width; x += 50) {
                ctx.moveTo(x, cy - wireHeight / 2);
                ctx.lineTo(x + 20, cy + wireHeight / 2);
            }
            ctx.stroke();
        }
    } else {
        // Plasma containment field
        ctx.strokeStyle = 'rgba(255, 0, 85, 0.3)';
        ctx.beginPath();
        ctx.moveTo(0, cy - wireHeight / 2 - 20);
        ctx.lineTo(width, cy - wireHeight / 2 - 20);
        ctx.moveTo(0, cy + wireHeight / 2 + 20);
        ctx.lineTo(width, cy + wireHeight / 2 + 20);
        ctx.setLineDash([10, 10]);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    ctx.shadowBlur = 0;
    
    ctx.globalCompositeOperation = 'lighter'; 
    
    // Draw lattice nodes slowly vibrating
    if (currentEnv === 'metal') {
        const t = time * 0.003;
        for (let node of latticeNodes) {
            const nx = node.baseX + Math.sin(t + node.phase) * 2;
            const ny = node.baseY + Math.cos(t + node.phase * 1.5) * 2;
            
            ctx.globalAlpha = 0.5;
            ctx.drawImage(texLattice, nx - 14, ny - 14, 28, 28);
            ctx.globalAlpha = 1.0;
            
            // Draw plus sign inside Lattice Ion
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillRect(nx - 4, ny - 1, 8, 2);
            ctx.fillRect(nx - 1, ny - 4, 2, 8);
        }
    }
    
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw(ctx, currentHighlight);
    }
    
    requestAnimationFrame(render);
}

// Boot up
updateMathEquation();
updateParticleCount();
updateI();

// ── Focus/blur guards so render loop doesn't overwrite typed values ──
readoutI.addEventListener('focus', () => { _editingI = true; });
readoutI.addEventListener('blur',  () => {
    _editingI = false;
    // Re-sync display to latest computed value if user cleared/left invalid
    if (isNaN(parseFloat(readoutI.value))) {
        readoutI.value = currentI.toFixed(2);
    }
});

requestAnimationFrame(render);
