/**
 * ============================================================
 * sim-mach-dien-dc.js — Động Cơ Mô Phỏng Mạch Điện DC
 * Physics Lab | EXPERIMENT: Mạch Điện Một Chiều
 * Phương pháp: Modified Nodal Analysis (MNA)
 * Tích phân số: Backward Euler cho tụ điện
 * ============================================================
 */

'use strict';

// ============================================================
// 1. CONSTANTS & CONFIG
// ============================================================
const CANVAS_BG      = '#0d1117';
const GRID_COLOR     = 'rgba(255,255,255,0.04)';
const WIRE_COLOR     = 'rgba(100,200,255,0.8)';
const WIRE_HOVER     = 'rgba(0,229,255,1)';
const PARTICLE_COLOR = '#00E5FF';
const TERMINAL_R     = 5;
const GRID_SIZE      = 40;
const SNAP           = GRID_SIZE / 2;

const COMPONENT_W    = 80;
const COMPONENT_H    = 40;

const COLORS = {
    voltage_source : { fill:'#1a2a1a', stroke:'#00FF66', label:'#00FF66' },
    resistor       : { fill:'#1a1a2a', stroke:'#FF9900', label:'#FF9900' },
    capacitor      : { fill:'#1a1a2e', stroke:'#7B68EE', label:'#7B68EE' },
    ammeter        : { fill:'#2a1a1a', stroke:'#FF4444', label:'#FF4444' },
    voltmeter      : { fill:'#1a2a2a', stroke:'#00E5FF', label:'#00E5FF' },
    wire           : WIRE_COLOR,
};

// ============================================================
// 2. CIRCUIT MODEL
// ============================================================
class CircuitModel {
    constructor() {
        this.components = []; // [{id, type, x, y, rotation, params}]
        this.wires      = []; // [{id, fromCompId, fromTermIdx, toCompId, toTermIdx}]
        this._nextId    = 1;
    }

    addComponent(type, x, y, params = {}) {
        const defaults = {
            voltage_source : { voltage: 9,     label: 'E' },
            resistor       : { resistance: 100, label: 'R' },
            capacitor      : { capacitance: 0.001, initial_voltage: 0, label: 'C' },
            ammeter        : { internal_resistance: 0.001, label: 'A' },
            voltmeter      : { internal_resistance: 1e9,   label: 'V' },
        };
        const id = 'c' + (this._nextId++);
        const comp = {
            id,
            type,
            x: snap(x),
            y: snap(y),
            rotation: 0,
            params: Object.assign({}, defaults[type] || {}, params),
            selected: false,
        };
        this.components.push(comp);
        return comp;
    }

    addWire(fromCompId, fromTermIdx, toCompId, toTermIdx) {
        // avoid duplicates
        const exists = this.wires.find(w =>
            w.fromCompId === fromCompId && w.fromTermIdx === fromTermIdx &&
            w.toCompId   === toCompId   && w.toTermIdx   === toTermIdx
        );
        if (exists) return null;
        const id = 'w' + (this._nextId++);
        const wire = { id, fromCompId, fromTermIdx, toCompId, toTermIdx };
        this.wires.push(wire);
        return wire;
    }

    removeComponent(id) {
        this.components = this.components.filter(c => c.id !== id);
        this.wires = this.wires.filter(w => w.fromCompId !== id && w.toCompId !== id);
    }

    removeWire(id) {
        this.wires = this.wires.filter(w => w.id !== id);
    }

    clear() {
        this.components = [];
        this.wires = [];
    }

    /** Get terminal world positions for a component */
    getTerminals(comp) {
        const hw = COMPONENT_W / 2;
        const hh = COMPONENT_H / 2;
        const cx = comp.x;
        const cy = comp.y;
        // Always horizontal: terminal[0]=left, terminal[1]=right
        return [
            { x: cx - hw - 12, y: cy, label: '-' },
            { x: cx + hw + 12, y: cy, label: '+' },
        ];
    }
}

// ============================================================
// 3. UNION-FIND — gộp terminal thành node điện học
// ============================================================
class UnionFind {
    constructor() { this.parent = {}; this.rank = {}; }
    make(x) { if (!(x in this.parent)) { this.parent[x] = x; this.rank[x] = 0; } }
    find(x) {
        if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]);
        return this.parent[x];
    }
    union(a, b) {
        this.make(a); this.make(b);
        let ra = this.find(a), rb = this.find(b);
        if (ra === rb) return;
        if (this.rank[ra] < this.rank[rb]) [ra, rb] = [rb, ra];
        this.parent[rb] = ra;
        if (this.rank[ra] === this.rank[rb]) this.rank[ra]++;
    }
}

// ============================================================
// 4. NETLIST BUILDER
// ============================================================
function buildNetlist(model) {
    const uf = new UnionFind();

    // Terminal key: "compId_termIdx"
    function tkey(compId, termIdx) { return `${compId}_${termIdx}`; }

    // Initialize all terminals
    model.components.forEach(c => {
        model.getTerminals(c).forEach((_, i) => {
            const k = tkey(c.id, i);
            uf.make(k);
        });
    });

    // Union via wires
    model.wires.forEach(w => {
        uf.union(tkey(w.fromCompId, w.fromTermIdx), tkey(w.toCompId, w.toTermIdx));
    });

    // Assign node indices; choose ground = most-connected root
    const rootCount = {};
    model.components.forEach(c => {
        model.getTerminals(c).forEach((_, i) => {
            const r = uf.find(tkey(c.id, i));
            rootCount[r] = (rootCount[r] || 0) + 1;
        });
    });

    // Ground = root with highest count
    let groundRoot = null, maxCount = 0;
    Object.entries(rootCount).forEach(([r, cnt]) => {
        if (cnt > maxCount) { maxCount = cnt; groundRoot = r; }
    });

    // Map root → node index (ground = -1)
    const rootToNode = {};
    let nodeIdx = 0;
    Object.keys(rootCount).forEach(r => {
        if (r === groundRoot) rootToNode[r] = -1; // ground
        else rootToNode[r] = nodeIdx++;
    });

    function nodeOf(compId, termIdx) {
        const r = uf.find(tkey(compId, termIdx));
        return rootToNode[r] ?? -1;
    }

    const N = nodeIdx; // number of non-ground nodes

    return { nodeOf, N, groundRoot };
}

// ============================================================
// 5. MNA SOLVER
// ============================================================
class MNASolver {
    /**
     * Solve steady-state or one transient step.
     * capacitorStates: { [compId]: { Vc: number, Geq: number, Ieq: number } }
     */
    solve(model, netlist, capacitorStates = {}) {
        const { nodeOf, N } = netlist;

        // Identify voltage sources (voltage_source + ammeter treated as 0V source)
        const vsources = model.components.filter(c =>
            c.type === 'voltage_source' || c.type === 'ammeter'
        );
        const M = vsources.length;

        // System size: N + M
        const SZ = N + M;
        if (SZ === 0) return null;

        // Allocate matrix A and vector b (SZ x SZ)
        const A = Array.from({ length: SZ }, () => new Float64Array(SZ));
        const b = new Float64Array(SZ);

        function stamp_conductance(ni, nj, g) {
            if (ni >= 0) A[ni][ni] += g;
            if (nj >= 0) A[nj][nj] += g;
            if (ni >= 0 && nj >= 0) { A[ni][nj] -= g; A[nj][ni] -= g; }
        }

        function stamp_current_source(ni, nj, I) {
            // current entering nj, leaving ni
            if (ni >= 0) b[ni] -= I;
            if (nj >= 0) b[nj] += I;
        }

        function stamp_vsource(ni, nj, k, V) {
            // B column k: +1 at ni, -1 at nj
            if (ni >= 0) { A[ni][N + k] += 1; A[N + k][ni] += 1; }
            if (nj >= 0) { A[nj][N + k] -= 1; A[N + k][nj] -= 1; }
            b[N + k] = V;
        }

        // Stamp each component
        model.components.forEach(comp => {
            const ni = nodeOf(comp.id, 1); // positive terminal
            const nj = nodeOf(comp.id, 0); // negative terminal

            switch (comp.type) {
                case 'resistor': {
                    const R = Math.max(comp.params.resistance, 1e-6);
                    stamp_conductance(ni, nj, 1 / R);
                    break;
                }
                case 'voltmeter': {
                    const R = comp.params.internal_resistance || 1e9;
                    stamp_conductance(ni, nj, 1 / R);
                    break;
                }
                case 'capacitor': {
                    const cs = capacitorStates[comp.id];
                    if (cs) {
                        // Transient model: Geq resistor + Ieq current source
                        stamp_conductance(ni, nj, cs.Geq);
                        stamp_current_source(ni, nj, cs.Ieq);
                    } else {
                        // Steady state: open circuit (do nothing, infinite R)
                    }
                    break;
                }
                case 'voltage_source': {
                    const k = vsources.indexOf(comp);
                    stamp_vsource(ni, nj, k, comp.params.voltage);
                    break;
                }
                case 'ammeter': {
                    const k = vsources.indexOf(comp);
                    stamp_vsource(ni, nj, k, 0); // 0V = ideal ammeter
                    break;
                }
            }
        });

        // Solve using Gaussian elimination with partial pivoting
        const x = gaussSolve(A, b, SZ);
        if (!x) return null;

        // Extract results
        const nodeVoltages = new Float64Array(N);
        for (let i = 0; i < N; i++) nodeVoltages[i] = x[i];

        const sourcCurrents = new Float64Array(M);
        for (let k = 0; k < M; k++) sourcCurrents[k] = x[N + k];

        // Compute per-component results
        const results = {};
        model.components.forEach(comp => {
            const ni = nodeOf(comp.id, 1);
            const nj = nodeOf(comp.id, 0);
            const Vi = ni >= 0 ? nodeVoltages[ni] : 0;
            const Vj = nj >= 0 ? nodeVoltages[nj] : 0;
            const Vdrop = Vi - Vj;

            let current = 0;
            switch (comp.type) {
                case 'resistor':
                    current = Vdrop / Math.max(comp.params.resistance, 1e-6);
                    break;
                case 'voltmeter':
                    current = Vdrop / (comp.params.internal_resistance || 1e9);
                    break;
                case 'capacitor': {
                    const cs = capacitorStates[comp.id];
                    if (cs) current = cs.Geq * Vdrop - cs.Ieq;
                    break;
                }
                case 'voltage_source':
                case 'ammeter': {
                    const k = vsources.indexOf(comp);
                    current = sourcCurrents[k]; // current delivered
                    break;
                }
            }

            results[comp.id] = { voltage: Vdrop, current, Vplus: Vi, Vminus: Vj };
        });

        return { nodeVoltages, sourcCurrents, results };
    }
}

// ============================================================
// 6. GAUSSIAN ELIMINATION (Partial Pivoting)
// ============================================================
function gaussSolve(A, b, n) {
    // Copy
    const M = A.map(row => Float64Array.from(row));
    const v = Float64Array.from(b);

    for (let col = 0; col < n; col++) {
        // Find pivot
        let maxVal = Math.abs(M[col][col]), pivotRow = col;
        for (let row = col + 1; row < n; row++) {
            if (Math.abs(M[row][col]) > maxVal) {
                maxVal = Math.abs(M[row][col]); pivotRow = row;
            }
        }
        if (maxVal < 1e-12) return null; // singular

        // Swap rows
        [M[col], M[pivotRow]] = [M[pivotRow], M[col]];
        [v[col], v[pivotRow]] = [v[pivotRow], v[col]];

        // Eliminate below
        for (let row = col + 1; row < n; row++) {
            const factor = M[row][col] / M[col][col];
            for (let k = col; k < n; k++) M[row][k] -= factor * M[col][k];
            v[row] -= factor * v[col];
        }
    }

    // Back substitution
    const x = new Float64Array(n);
    for (let i = n - 1; i >= 0; i--) {
        let sum = v[i];
        for (let j = i + 1; j < n; j++) sum -= M[i][j] * x[j];
        x[i] = sum / M[i][i];
    }
    return x;
}

// ============================================================
// 7. TRANSIENT ENGINE (Capacitor Integration)
// ============================================================
class TransientEngine {
    constructor(model) {
        this.model = model;
        this.states = {}; // { [compId]: { Vc, Geq, Ieq, history } }
        this.running = false;
        this.dt = 1e-4; // initial timestep (s)
        this.simTime = 0;
        this.onStep = null; // callback(results, simTime)
        this._rafId = null;
        this._lastTime = null;
    }

    reset() {
        this.states = {};
        this.simTime = 0;
        this.dt = 1e-4;
        this._lastTime = null;
        // Initialize from initial_voltage param
        this.model.components.filter(c => c.type === 'capacitor').forEach(c => {
            const Vc = c.params.initial_voltage || 0;
            const C  = c.params.capacitance || 1e-3;
            this.states[c.id] = {
                Vc,
                Geq: C / this.dt,
                Ieq: (C / this.dt) * Vc,
                history: [{ t: 0, Vc }],
            };
        });
    }

    start() {
        if (this.running) return;
        this.running = true;
        this._lastTime = null;
        this._loop();
    }

    stop() {
        this.running = false;
        if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
    }

    _loop() {
        if (!this.running) return;
        this._rafId = requestAnimationFrame((ts) => {
            if (this._lastTime === null) this._lastTime = ts;
            const wallDt = Math.min((ts - this._lastTime) / 1000, 0.05);
            this._lastTime = ts;

            // Run multiple sim substeps per frame for accuracy
            const substeps = Math.max(1, Math.floor(wallDt / this.dt));
            const capComps = this.model.components.filter(c => c.type === 'capacitor');

            let results = null;
            for (let s = 0; s < substeps && s < 20; s++) {
                const netlist = buildNetlist(this.model);
                results = new MNASolver().solve(this.model, netlist, this.states);
                if (!results) break;

                // Update capacitor states
                capComps.forEach(c => {
                    const cs = this.states[c.id];
                    if (!cs) return;
                    const Vdrop = results.results[c.id]?.voltage ?? cs.Vc;
                    const dvdt = Math.abs(Vdrop - cs.Vc) / this.dt;

                    // Adaptive timestep
                    if (dvdt > 1) this.dt = Math.max(this.dt * 0.8, 1e-6);
                    else          this.dt = Math.min(this.dt * 1.05, 1e-2);

                    const C = c.params.capacitance || 1e-3;
                    cs.Vc = Vdrop;
                    cs.Geq = C / this.dt;
                    cs.Ieq = cs.Geq * cs.Vc;
                    cs.history.push({ t: this.simTime, Vc: cs.Vc });
                    if (cs.history.length > 300) cs.history.shift();
                });

                this.simTime += this.dt;
            }

            if (results && this.onStep) this.onStep(results, this.simTime);
            this._loop();
        });
    }
}

// ============================================================
// 8. CIRCUIT CANVAS (HTML5 Canvas renderer + interactions)
// ============================================================
class CircuitCanvas {
    constructor(canvasEl, model) {
        this.canvas = canvasEl;
        this.ctx    = canvasEl.getContext('2d');
        this.model  = model;

        // Viewport
        this.offsetX = 0; this.offsetY = 0;
        this.scale   = 1;

        // Interaction state
        this.dragging       = null;   // { comp, startX, startY }
        this.drawingWire    = null;   // { compId, termIdx, x1, y1, mx, my }
        this.hoveredTerminal= null;
        this.selected       = null;   // comp or null
        this.particles      = [];
        this.currentResults = null;

        // Unknown resistance mode
        this.unknownComp    = null;

        this._initEvents();
        this._startRenderLoop();
    }

    // ======================== COORDINATE TRANSFORM ========================
    toWorld(cx, cy) {
        return { x: (cx - this.offsetX) / this.scale, y: (cy - this.offsetY) / this.scale };
    }
    toCanvas(wx, wy) {
        return { x: wx * this.scale + this.offsetX, y: wy * this.scale + this.offsetY };
    }
    canvasXY(e) {
        const r = this.canvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    // ======================== EVENT SETUP ========================
    _initEvents() {
        const c = this.canvas;

        // Mouse down
        c.addEventListener('mousedown', e => {
            if (e.button !== 0) return;
            const { x, y } = this.canvasXY(e);
            const w = this.toWorld(x, y);

            // Check terminal click first
            const term = this._hitTerminal(w.x, w.y);
            if (term) {
                const terms = this.model.getTerminals(term.comp);
                const t = terms[term.idx];
                this.drawingWire = { compId: term.comp.id, termIdx: term.idx, x1: t.x, y1: t.y, mx: t.x, my: t.y };
                return;
            }

            // Check component body click
            const comp = this._hitComponent(w.x, w.y);
            if (comp) {
                this._selectComponent(comp);
                this.dragging = { comp, startX: w.x - comp.x, startY: w.y - comp.y };
                return;
            }

            // Deselect
            this._selectComponent(null);
        });

        // Mouse move
        c.addEventListener('mousemove', e => {
            const { x, y } = this.canvasXY(e);
            const w = this.toWorld(x, y);

            if (this.dragging) {
                this.dragging.comp.x = snap(w.x - this.dragging.startX);
                this.dragging.comp.y = snap(w.y - this.dragging.startY);
                return;
            }
            if (this.drawingWire) {
                this.drawingWire.mx = w.x;
                this.drawingWire.my = w.y;
            }
            this.hoveredTerminal = this._hitTerminal(w.x, w.y);
        });

        // Mouse up
        c.addEventListener('mouseup', e => {
            if (this.drawingWire) {
                const { x, y } = this.canvasXY(e);
                const w = this.toWorld(x, y);
                const term = this._hitTerminal(w.x, w.y);
                if (term && term.comp.id !== this.drawingWire.compId) {
                    this.model.addWire(
                        this.drawingWire.compId, this.drawingWire.termIdx,
                        term.comp.id, term.idx
                    );
                    this._onCircuitChanged();
                }
                this.drawingWire = null;
            }
            this.dragging = null;
            if (this.model.wires.length > 0) this._onCircuitChanged();
        });

        // Right-click → delete component
        c.addEventListener('contextmenu', e => {
            e.preventDefault();
            const { x, y } = this.canvasXY(e);
            const w = this.toWorld(x, y);
            const comp = this._hitComponent(w.x, w.y);
            if (comp) {
                this.model.removeComponent(comp.id);
                if (this.selected === comp) this._selectComponent(null);
                this._onCircuitChanged();
            }
        });

        // Scroll → zoom
        c.addEventListener('wheel', e => {
            e.preventDefault();
            const { x, y } = this.canvasXY(e);
            const factor = e.deltaY < 0 ? 1.1 : 0.9;
            this.scale = Math.max(0.3, Math.min(3, this.scale * factor));
            this.offsetX = x - (x - this.offsetX) * factor;
            this.offsetY = y - (y - this.offsetY) * factor;
        }, { passive: false });

        // Middle mouse pan
        let panning = false, panStart = null;
        c.addEventListener('mousedown', e => { if (e.button === 1) { panning = true; panStart = { x: e.clientX, y: e.clientY }; e.preventDefault(); } });
        c.addEventListener('mousemove', e => {
            if (panning && panStart) {
                this.offsetX += e.clientX - panStart.x;
                this.offsetY += e.clientY - panStart.y;
                panStart = { x: e.clientX, y: e.clientY };
            }
        });
        c.addEventListener('mouseup', () => { panning = false; panStart = null; });

        // Resize canvas
        const obs = new ResizeObserver(() => this._resize());
        obs.observe(c.parentElement);
        this._resize();
    }

    _resize() {
        const p = this.canvas.parentElement;
        this.canvas.width  = p.clientWidth;
        this.canvas.height = p.clientHeight;
        if (this.offsetX === 0 && this.offsetY === 0) {
            this.offsetX = this.canvas.width  / 2;
            this.offsetY = this.canvas.height / 2;
        }
    }

    // ======================== HIT TESTING ========================
    _hitComponent(wx, wy) {
        return this.model.components.find(c => {
            const hw = COMPONENT_W / 2 + 14, hh = COMPONENT_H / 2 + 8;
            return wx >= c.x - hw && wx <= c.x + hw && wy >= c.y - hh && wy <= c.y + hh;
        }) || null;
    }

    _hitTerminal(wx, wy) {
        for (const comp of this.model.components) {
            const terms = this.model.getTerminals(comp);
            for (let i = 0; i < terms.length; i++) {
                const t = terms[i];
                const d = Math.hypot(wx - t.x, wy - t.y);
                if (d <= TERMINAL_R * 2.5) return { comp, idx: i };
            }
        }
        return null;
    }

    // ======================== SELECTION ========================
    _selectComponent(comp) {
        if (this.selected) this.selected.selected = false;
        this.selected = comp;
        if (comp) comp.selected = true;
        if (this.onSelect) this.onSelect(comp);
    }

    // ======================== CIRCUIT CHANGED ========================
    _onCircuitChanged() {
        if (this.onChange) this.onChange();
    }

    // ======================== UPDATE RESULTS ========================
    updateResults(results) {
        this.currentResults = results;
        this._spawnParticles(results);
    }

    // ======================== PARTICLES ========================
    _spawnParticles(results) {
        if (!results) { this.particles = []; return; }
        // Spawn new particles for each wire periodically
        this.model.wires.forEach(wire => {
            // Get current flowing through the wire (via shared component)
            const fromComp = this.model.components.find(c => c.id === wire.fromCompId);
            const toComp   = this.model.components.find(c => c.id === wire.toCompId);
            if (!fromComp || !toComp) return;

            const rFrom = results.results[fromComp.id];
            const rTo   = results.results[toComp.id];
            const I = rFrom ? Math.abs(rFrom.current) : (rTo ? Math.abs(rTo.current) : 0);
            if (I < 1e-9) return;

            const speed = Math.min(I * 800, 120);
            const t1 = this.model.getTerminals(fromComp)[wire.fromTermIdx];
            const t2 = this.model.getTerminals(toComp)[wire.toTermIdx];

            if (Math.random() < Math.min(I * 15, 0.9)) {
                this.particles.push({ x: t1.x, y: t1.y, tx: t2.x, ty: t2.y, progress: 0, speed, alpha: 1 });
            }
        });

        // Update existing particles
        this.particles = this.particles.filter(p => {
            p.progress += p.speed * 0.003;
            if (p.progress >= 1) return false;
            p.alpha = Math.min(1, (1 - p.progress) * 3);
            p.x = lerp(p.x, p.tx, 0); // use initial stored state
            return true;
        });
        // Cap at 200
        if (this.particles.length > 200) this.particles.splice(0, this.particles.length - 200);
    }

    // ======================== RENDER LOOP ========================
    _startRenderLoop() {
        const render = () => {
            this._render();
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
    }

    _render() {
        const ctx = this.ctx;
        const W = this.canvas.width, H = this.canvas.height;

        // Background
        ctx.fillStyle = CANVAS_BG;
        ctx.fillRect(0, 0, W, H);

        // Grid
        this._drawGrid(ctx, W, H);

        ctx.save();
        ctx.translate(this.offsetX, this.offsetY);
        ctx.scale(this.scale, this.scale);

        // Draw existing wires
        this.model.wires.forEach(w => this._drawWire(ctx, w));

        // Draw wire being created
        if (this.drawingWire) {
            const fromComp = this.model.components.find(c => c.id === this.drawingWire.compId);
            if (fromComp) {
                const t = this.model.getTerminals(fromComp)[this.drawingWire.termIdx];
                ctx.save();
                ctx.strokeStyle = WIRE_HOVER;
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 4]);
                ctx.shadowColor = WIRE_HOVER; ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(t.x, t.y);
                // Orthogonal routing: go horizontal first, then vertical
                ctx.lineTo(this.drawingWire.mx, t.y);
                ctx.lineTo(this.drawingWire.mx, this.drawingWire.my);
                ctx.stroke();
                ctx.restore();
            }
        }

        // Draw particles
        this._drawParticles(ctx);

        // Draw components
        this.model.components.forEach(c => this._drawComponent(ctx, c));

        ctx.restore();
    }

    _drawGrid(ctx, W, H) {
        const gs = GRID_SIZE * this.scale;
        const ox = this.offsetX % gs; const oy = this.offsetY % gs;
        ctx.fillStyle = GRID_COLOR.replace('0.04', '0.06');
        for (let x = ox; x < W; x += gs) {
            for (let y = oy; y < H; y += gs) {
                ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill();
            }
        }
    }

    _drawWire(ctx, wire) {
        const fromComp = this.model.components.find(c => c.id === wire.fromCompId);
        const toComp   = this.model.components.find(c => c.id === wire.toCompId);
        if (!fromComp || !toComp) return;

        const t1 = this.model.getTerminals(fromComp)[wire.fromTermIdx];
        const t2 = this.model.getTerminals(toComp)[wire.toTermIdx];

        // Check if this wire carries current
        const I = this.currentResults?.results[fromComp.id]?.current ?? 0;
        const glowing = Math.abs(I) > 1e-9;

        ctx.save();
        ctx.strokeStyle = glowing ? WIRE_HOVER : WIRE_COLOR;
        ctx.lineWidth = glowing ? 2.5 : 1.5;
        if (glowing) { ctx.shadowColor = WIRE_HOVER; ctx.shadowBlur = 8; }

        ctx.beginPath();
        ctx.moveTo(t1.x, t1.y);
        // Orthogonal routing
        const mx = (t1.x + t2.x) / 2;
        ctx.lineTo(mx, t1.y);
        ctx.lineTo(mx, t2.y);
        ctx.lineTo(t2.x, t2.y);
        ctx.stroke();
        ctx.restore();
    }

    _drawParticles(ctx) {
        this.particles.forEach(p => {
            const t = p.progress;
            // Interpolate along the orthogonal path
            const mx = (p.x + p.tx) / 2; // stored only once — simplified
            let px, py;
            if (t < 0.5) { px = lerp(p.x, mx, t * 2); py = p.y; }
            else          { px = mx; py = lerp(p.y, p.ty, (t - 0.5) * 2); }

            ctx.save();
            ctx.globalAlpha = p.alpha * 0.9;
            ctx.fillStyle = PARTICLE_COLOR;
            ctx.shadowColor = PARTICLE_COLOR; ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    _drawComponent(ctx, comp) {
        const col = COLORS[comp.type] || COLORS.resistor;
        const hw = COMPONENT_W / 2, hh = COMPONENT_H / 2;
        ctx.save();
        ctx.translate(comp.x, comp.y);

        // Draw lead wires
        ctx.strokeStyle = comp.selected ? '#fff' : 'rgba(150,200,255,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-hw - 12, 0); ctx.lineTo(-hw, 0);
        ctx.moveTo(hw, 0);       ctx.lineTo(hw + 12, 0);
        ctx.stroke();

        // Body
        ctx.fillStyle   = col.fill;
        ctx.strokeStyle = comp.selected ? '#00E5FF' : col.stroke;
        ctx.lineWidth   = comp.selected ? 2.5 : 1.5;
        if (comp.selected) { ctx.shadowColor = '#00E5FF'; ctx.shadowBlur = 12; }

        this._drawSymbol(ctx, comp, col, hw, hh);

        // Label + value
        ctx.shadowBlur = 0;
        ctx.fillStyle  = col.label;
        ctx.font       = 'bold 10px JetBrains Mono, monospace';
        ctx.textAlign  = 'center';
        const label = this._getLabel(comp);
        ctx.fillText(label, 0, -hh - 6);

        // If unknown resistance mode
        if (comp.id === this.unknownComp?.id) {
            ctx.fillStyle = '#FF4444';
            ctx.font = 'bold 9px JetBrains Mono, monospace';
            ctx.fillText('R_x = ???', 0, hh + 14);
        }

        // Draw terminals
        this._drawTerminals(ctx, comp, hw);

        ctx.restore();
    }

    _drawSymbol(ctx, comp, col, hw, hh) {
        switch (comp.type) {
            case 'resistor':     this._drawResistor(ctx, hw, hh); break;
            case 'voltage_source': this._drawVoltageSource(ctx, hw, hh); break;
            case 'capacitor':    this._drawCapacitor(ctx, hw, hh); break;
            case 'ammeter':      this._drawMeter(ctx, hw, hh, 'A', '#FF4444'); break;
            case 'voltmeter':    this._drawMeter(ctx, hw, hh, 'V', '#00E5FF'); break;
        }
    }

    _drawResistor(ctx, hw, hh) {
        const zigW = 7, zigH = hh * 0.8, n = 5;
        ctx.beginPath();
        ctx.rect(-hw, -hh, COMPONENT_W, COMPONENT_H);
        ctx.fill(); ctx.stroke();
        // Zigzag
        ctx.beginPath();
        ctx.strokeStyle = '#FF9900'; ctx.lineWidth = 1.5;
        const step = COMPONENT_W / (n * 2);
        ctx.moveTo(-hw, 0);
        for (let i = 0; i < n * 2; i++) {
            ctx.lineTo(-hw + step * (i + 1), i % 2 === 0 ? -zigH : zigH);
        }
        ctx.lineTo(hw, 0);
        ctx.stroke();
    }

    _drawVoltageSource(ctx, hw, hh) {
        ctx.beginPath(); ctx.arc(0, 0, hw * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.voltage_source.fill; ctx.fill(); ctx.stroke();
        // + and - signs
        ctx.fillStyle = '#00FF66'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('+', hw * 0.4, 5);
        ctx.fillStyle = '#aaa';
        ctx.fillText('−', -hw * 0.4, 5);
    }

    _drawCapacitor(ctx, hw, hh) {
        ctx.beginPath(); ctx.rect(-hw, -hh, COMPONENT_W, COMPONENT_H);
        ctx.fill(); ctx.stroke();
        // Capacitor plates
        ctx.strokeStyle = '#7B68EE'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-8, -hh * 0.8); ctx.lineTo(-8, hh * 0.8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(8,  -hh * 0.8); ctx.lineTo(8,  hh * 0.8); ctx.stroke();
        // Lead lines inside
        ctx.strokeStyle = 'rgba(123,104,238,0.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-hw, 0); ctx.lineTo(-8, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(8,  0); ctx.lineTo(hw, 0); ctx.stroke();
    }

    _drawMeter(ctx, hw, hh, letter, color) {
        ctx.beginPath(); ctx.arc(0, 0, hw * 0.95, 0, Math.PI * 2);
        ctx.fillStyle = '#0d1117'; ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = color; ctx.font = 'bold 16px Orbitron, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(letter, 0, 0);
        ctx.textBaseline = 'alphabetic';
    }

    _drawTerminals(ctx, comp, hw) {
        const terms = this.model.getTerminals(comp);
        terms.forEach((t, i) => {
            const isHovered = this.hoveredTerminal?.comp?.id === comp.id && this.hoveredTerminal?.idx === i;
            ctx.beginPath();
            ctx.arc(t.x - comp.x, t.y - comp.y, TERMINAL_R, 0, Math.PI * 2);
            ctx.fillStyle   = isHovered ? '#fff' : (i === 1 ? '#00FF66' : '#FF4444');
            ctx.strokeStyle = isHovered ? '#00E5FF' : 'rgba(255,255,255,0.3)';
            ctx.lineWidth   = 1;
            if (isHovered) { ctx.shadowColor = '#00E5FF'; ctx.shadowBlur = 10; }
            ctx.fill(); ctx.stroke();
            ctx.shadowBlur = 0;
        });
    }

    _getLabel(comp) {
        const p = comp.params;
        switch (comp.type) {
            case 'resistor':        return `${formatVal(p.resistance)}Ω`;
            case 'voltage_source':  return `${formatVal(p.voltage)}V`;
            case 'capacitor':       return `${formatVal(p.capacitance * 1000)}mF`;
            case 'ammeter':         return 'A';
            case 'voltmeter':       return 'V';
            default: return comp.type;
        }
    }
}

// ============================================================
// 9. RESULTS PANEL
// ============================================================
class ResultsPanel {
    constructor(containerEl, graphCanvasEl) {
        this.container   = containerEl;
        this.graphCanvas = graphCanvasEl;
        this.graphCtx    = graphCanvasEl?.getContext('2d');
        this.history     = {}; // { compId: [{t, Vc}] }
    }

    update(results, model, simTime) {
        if (!results || !this.container) return;

        let html = '<div class="results-table">';
        model.components.forEach(comp => {
            const r = results.results[comp.id];
            if (!r) return;
            const label = comp.params.label || comp.type;
            html += `
            <div class="result-row">
                <span class="result-name" style="color:${COLORS[comp.type]?.label || '#fff'}">${label}</span>
                <span class="result-val">U = <b>${formatFixed(r.voltage, 3)} V</b></span>
                <span class="result-val">I = <b>${formatFixed(r.current, 4)} A</b></span>
            </div>`;
        });
        html += '</div>';
        this.container.innerHTML = html;

        // Draw capacitor voltage graph
        this._drawGraph(model, results, simTime);
    }

    _drawGraph(model, results, simTime) {
        const gc = this.graphCanvas;
        if (!gc) return;
        const ctx = this.graphCtx;
        const W = gc.width, H = gc.height;

        ctx.fillStyle = 'rgba(13,17,23,0.9)';
        ctx.fillRect(0, 0, W, H);

        const caps = model.components.filter(c => c.type === 'capacitor');
        if (caps.length === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.font = '11px JetBrains Mono, monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Thêm tụ điện để xem đồ thị V(t)', W / 2, H / 2);
            return;
        }

        const cap = caps[0];
        const r   = results.results[cap.id];
        if (!r) return;

        // Store history
        if (!this.history[cap.id]) this.history[cap.id] = [];
        this.history[cap.id].push({ t: simTime, Vc: r.voltage });
        if (this.history[cap.id].length > 300) this.history[cap.id].shift();

        const hist = this.history[cap.id];
        if (hist.length < 2) return;

        const tMin = hist[0].t, tMax = hist[hist.length - 1].t;
        const vMin = -0.5, vMax = Math.max(...hist.map(h => Math.abs(h.Vc))) * 1.2 + 0.5;

        const px = t => 30 + (t - tMin) / (tMax - tMin + 1e-9) * (W - 40);
        const py = v => H - 20 - ((v - vMin) / (vMax - vMin + 1e-9)) * (H - 30);

        // Axes
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(28, 10); ctx.lineTo(28, H - 18); ctx.lineTo(W - 8, H - 18); ctx.stroke();

        // Axis labels
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '9px JetBrains Mono, monospace';
        ctx.textAlign = 'left'; ctx.fillText(`${formatFixed(vMax, 1)}V`, 2, 14);
        ctx.fillText('0V', 2, H - 14);

        // Graph line
        ctx.beginPath();
        ctx.strokeStyle = COLORS.capacitor.stroke; ctx.lineWidth = 2;
        ctx.shadowColor = COLORS.capacitor.stroke; ctx.shadowBlur = 6;
        hist.forEach((pt, i) => {
            const x = px(pt.t), y = py(pt.Vc);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Current value label
        const last = hist[hist.length - 1];
        ctx.fillStyle = COLORS.capacitor.label;
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`Vc = ${formatFixed(last.Vc, 3)}V`, W - 4, 16);
    }

    resetGraph() { this.history = {}; }
}

// ============================================================
// 10. UNKNOWN RESISTANCE MODE
// ============================================================
class UnknownResistanceMode {
    constructor(model, canvas, onUpdate) {
        this.model    = model;
        this.canvas   = canvas;
        this.onUpdate = onUpdate;
        this.active   = false;
        this.target   = null; // comp with hidden resistance
        this.hiddenR  = 0;
    }

    activate() {
        const resistors = this.model.components.filter(c => c.type === 'resistor');
        if (resistors.length === 0) {
            showToast('Hãy thêm ít nhất một điện trở vào mạch!', 'warn');
            return false;
        }
        this.target = resistors[Math.floor(Math.random() * resistors.length)];
        this.hiddenR = this.target.params.resistance;
        this.canvas.unknownComp = this.target;
        this.active = true;
        return true;
    }

    deactivate() {
        if (this.target) this.target.params.resistance = this.hiddenR;
        this.canvas.unknownComp = null;
        this.active = false;
        this.target = null;
        this.hiddenR = 0;
    }

    checkAnswer(userVal) {
        const val = parseFloat(userVal);
        if (isNaN(val)) { showToast('Giá trị không hợp lệ!', 'warn'); return; }
        const rel = Math.abs(val - this.hiddenR) / this.hiddenR;
        if (rel < 0.02) {
            showToast(`✅ Chính xác! R_x = ${this.hiddenR} Ω`, 'success');
            this.deactivate();
        } else if (rel < 0.1) {
            showToast(`🟡 Gần đúng! Sai số ${(rel * 100).toFixed(1)}%`, 'warn');
        } else {
            showToast(`❌ Chưa chính xác. Gợi ý: Áp dụng KVL và định luật Ohm.`, 'error');
        }
    }

    getHint(results) {
        if (!this.target || !results) return '';
        const r = results.results[this.target.id];
        if (!r) return 'Hệ thống chưa giải được mạch.';
        // Instead of revealing R, give measured U and I
        const Ux = Math.abs(r.voltage).toFixed(3);
        const Ix = Math.abs(r.current).toFixed(4);
        return `💡 Gợi ý: Vôn kế đo được U_x = ${Ux} V, Ampe kế đo được I_x = ${Ix} A → R_x = U_x / I_x = ?`;
    }
}

// ============================================================
// 11. UTILITY FUNCTIONS
// ============================================================
function snap(v) { return Math.round(v / SNAP) * SNAP; }
function lerp(a, b, t) { return a + (b - a) * t; }
function formatVal(v) {
    if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(2) + 'k';
    return parseFloat(v.toFixed(4)).toString();
}
function formatFixed(v, d) {
    if (typeof v !== 'number' || isNaN(v)) return '---';
    return v.toFixed(d);
}

function showToast(msg, type = 'info') {
    const existing = document.getElementById('dc-toast');
    if (existing) existing.remove();
    const colors = { info:'#00E5FF', success:'#00FF66', warn:'#FF9900', error:'#FF4444' };
    const toast = document.createElement('div');
    toast.id = 'dc-toast';
    toast.textContent = msg;
    toast.style.cssText = `
        position:fixed; bottom:32px; left:50%; transform:translateX(-50%);
        background:rgba(13,17,23,0.95); color:${colors[type]||'#fff'};
        font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:600;
        padding:10px 22px; border-radius:10px;
        border:1px solid ${colors[type]||'#fff'}44;
        box-shadow:0 0 20px ${colors[type]||'#fff'}33;
        z-index:99999; pointer-events:none; opacity:0; transition:opacity 0.2s;
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.style.opacity = '1');
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 250); }, 3500);
}

// ============================================================
// 12. MAIN CONTROLLER
// ============================================================
let circuitModel, circuitCanvas, mnaResults, transientEngine, resultsPanel, unknownMode;
let steadyStateMode = true;

function initSimulator() {
    circuitModel   = new CircuitModel();
    const canvas   = document.getElementById('dc-canvas');
    const resultsDiv   = document.getElementById('dc-results');
    const graphCanvas  = document.getElementById('dc-graph');

    circuitCanvas  = new CircuitCanvas(canvas, circuitModel);
    resultsPanel   = new ResultsPanel(resultsDiv, graphCanvas);
    transientEngine = new TransientEngine(circuitModel);
    unknownMode    = new UnknownResistanceMode(circuitModel, circuitCanvas, null);

    circuitCanvas.onSelect = (comp) => updatePropertiesPanel(comp);
    circuitCanvas.onChange = () => runSimulation();

    transientEngine.onStep = (results, simTime) => {
        mnaResults = results;
        circuitCanvas.updateResults(results);
        resultsPanel.update(results, circuitModel, simTime);
    };

    // Load demo circuit
    loadDemoCircuit();
    runSimulation();
}

function loadDemoCircuit() {
    const src = circuitModel.addComponent('voltage_source', -160, 0, { voltage: 9, label: 'E' });
    const r1  = circuitModel.addComponent('resistor',        0,   0, { resistance: 100, label: 'R₁' });
    const r2  = circuitModel.addComponent('resistor',        160, 0, { resistance: 200, label: 'R₂' });
    circuitModel.addWire(src.id, 1, r1.id, 0);
    circuitModel.addWire(r1.id, 1, r2.id, 0);
    circuitModel.addWire(r2.id, 1, src.id, 0);
}

function runSimulation() {
    if (circuitModel.components.length === 0) {
        mnaResults = null;
        circuitCanvas.updateResults(null);
        resultsPanel.update(null, circuitModel, 0);
        return;
    }

    const hasCapacitor = circuitModel.components.some(c => c.type === 'capacitor');

    if (hasCapacitor) {
        // Transient mode
        if (transientEngine.running) transientEngine.stop();
        transientEngine.reset();
        resultsPanel.resetGraph();
        transientEngine.start();
    } else {
        // Steady-state mode
        transientEngine.stop();
        const netlist = buildNetlist(circuitModel);
        mnaResults = new MNASolver().solve(circuitModel, netlist, {});
        circuitCanvas.updateResults(mnaResults);
        resultsPanel.update(mnaResults, circuitModel, 0);
    }
}

// ============================================================
// 13. UI CALLBACKS (called from HTML)
// ============================================================

function addComponent(type) {
    const cx = 0 + Math.random() * 80 - 40;
    const cy = Math.random() * 80 - 40;
    circuitModel.addComponent(type, cx, cy);
    runSimulation();
}

function clearCircuit() {
    transientEngine.stop();
    circuitModel.clear();
    circuitCanvas._selectComponent(null);
    unknownMode.deactivate();
    mnaResults = null;
    circuitCanvas.updateResults(null);
    resultsPanel.update(null, circuitModel, 0);
    resultsPanel.resetGraph();
}

function updatePropertiesPanel(comp) {
    const panel = document.getElementById('dc-properties');
    if (!panel) return;
    if (!comp) { panel.innerHTML = '<p class="prop-hint">Chọn linh kiện để chỉnh sửa thông số</p>'; return; }

    const col = COLORS[comp.type]?.label || '#fff';
    let html = `<div class="prop-title" style="color:${col}">${comp.type.replace('_',' ').toUpperCase()}</div>`;

    const fields = {
        voltage_source : [{ key:'voltage',     label:'Điện áp (V)',   min:0.1, max:30,   step:0.1 },
                          { key:'label',       label:'Nhãn',          type:'text' }],
        resistor       : [{ key:'resistance',  label:'Điện trở (Ω)', min:1,   max:10000, step:1   },
                          { key:'label',       label:'Nhãn',          type:'text' }],
        capacitor      : [{ key:'capacitance', label:'Điện dung (mF)',min:0.01,max:100, step:0.01, scale:0.001 },
                          { key:'initial_voltage', label:'U₀ (V)',    min:0,   max:30,  step:0.1  },
                          { key:'label',       label:'Nhãn',          type:'text' }],
        ammeter        : [{ key:'label',       label:'Nhãn',          type:'text' }],
        voltmeter      : [{ key:'label',       label:'Nhãn',          type:'text' }],
    };

    (fields[comp.type] || []).forEach(f => {
        if (f.type === 'text') {
            html += `<div class="prop-row">
                <label>${f.label}</label>
                <input type="text" class="prop-input" value="${comp.params[f.key] || ''}"
                  oninput="updateCompParam('${comp.id}','${f.key}',this.value,'text')">
            </div>`;
        } else {
            const displayVal = f.scale ? (comp.params[f.key] / f.scale) : comp.params[f.key];
            const rounded = parseFloat(displayVal?.toFixed(6));
            html += `<div class="prop-row">
                <div class="prop-num-row">
                    <label class="prop-num-label">${f.label}</label>
                    <input type="number" class="prop-num-input" min="${f.min}" max="${f.max}" step="${f.step}"
                      value="${rounded}"
                      onchange="updateCompParam('${comp.id}','${f.key}',this.value,'num',${f.scale||1})"
                      oninput="updateCompParam('${comp.id}','${f.key}',this.value,'num',${f.scale||1})">
                </div>
            </div>`;
        }
    });

    html += `<button class="prop-delete-btn" onclick="deleteSelectedComp('${comp.id}')">🗑 Xóa linh kiện</button>`;
    panel.innerHTML = html;
}

function updateCompParam(compId, key, value, type, scale = 1) {
    const comp = circuitModel.components.find(c => c.id === compId);
    if (!comp) return;
    if (type === 'num') {
        comp.params[key] = parseFloat(value) * scale;
        const el = document.getElementById(`pv-${compId}-${key}`);
        if (el) el.textContent = parseFloat(value);
    } else {
        comp.params[key] = value;
    }
    runSimulation();
}

function deleteSelectedComp(compId) {
    circuitModel.removeComponent(compId);
    updatePropertiesPanel(null);
    runSimulation();
}

function activateUnknownMode() {
    if (unknownMode.active) {
        unknownMode.deactivate();
        document.getElementById('unknown-mode-btn')?.classList.remove('active');
        document.getElementById('unknown-answer-area').style.display = 'none';
        showToast('Đã tắt chế độ R_x ẩn.', 'info');
        return;
    }
    if (unknownMode.activate()) {
        document.getElementById('unknown-mode-btn')?.classList.add('active');
        document.getElementById('unknown-answer-area').style.display = 'flex';
        showToast('🔍 Chế độ R_x ẩn: Dùng vôn kế & ampe kế để đo rồi tính!', 'info');
    }
}

function checkRxAnswer() {
    const val = document.getElementById('rx-input')?.value;
    unknownMode.checkAnswer(val);
}

function showRxHint() {
    const hint = unknownMode.getHint(mnaResults);
    showToast(hint, 'info');
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => { initSimulator(); initQuizMode(); });

// ============================================================
// 14. PROBLEM GENERATOR — Procedural Circuit Problems
// ============================================================
class ProblemGenerator {
    _randR() {
        const vals = [10,20,30,50,100,150,200,220,330,470,500,1000];
        return vals[Math.floor(Math.random() * vals.length)];
    }
    _randV() {
        const vals = [3, 5, 6, 9, 12, 15, 24];
        return vals[Math.floor(Math.random() * vals.length)];
    }
    _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    generate() {
        const types = ['series2','series3','parallel2','mixed_sp'];
        return this[`_${this._pick(types)}`]();
    }

    _series2() {
        const V=this._randV(), R1=this._randR(), R2=this._randR();
        const Req=R1+R2, I=V/Req, U1=I*R1, U2=I*R2;
        const qs=[
            {key:'I',   text:'Tính cường độ dòng điện I chạy trong mạch', answer:I,   unit:'A'},
            {key:'Req', text:'Tính điện trở tương đương R<sub>tđ</sub> của mạch', answer:Req, unit:'Ω'},
            {key:'U1',  text:`Tính hiệu điện thế U rơi trên R₁ = ${R1} Ω`, answer:U1, unit:'V'},
            {key:'U2',  text:`Tính hiệu điện thế U rơi trên R₂ = ${R2} Ω`, answer:U2, unit:'V'},
        ];
        return {
            type:'series2', typeName:'Mạch Nối Tiếp — 2 Điện trở',
            components:[
                {type:'voltage_source',params:{voltage:V,label:'E'},x:-200,y:0},
                {type:'resistor',params:{resistance:R1,label:'R₁'},x:-20,y:0},
                {type:'resistor',params:{resistance:R2,label:'R₂'},x:140,y:0},
            ],
            wires:[[0,1,1,0],[1,1,2,0],[2,1,0,0]],
            given:{E:`${V} V`, R1:`${R1} Ω`, R2:`${R2} Ω`},
            question:this._pick(qs),
            allAnswers:{I,Req,U1,U2},
            hints:[
                `🔍 Quan sát mạch: R₁ và R₂ nằm trên <strong>cùng một nhánh</strong> duy nhất — đây là mạch <strong>nối tiếp</strong>. Cùng một dòng điện I chạy qua cả hai.`,
                `💡 Với mạch nối tiếp: <strong>R<sub>tđ</sub> = R₁ + R₂</strong><br>Thay số: R<sub>tđ</sub> = ${R1} + ${R2} = ? (Ω)`,
                `🧮 R<sub>tđ</sub> = <strong>${Req} Ω</strong>. Định luật Ohm: I = E / R<sub>tđ</sub> = ${V} / ${Req} = ?<br>U₁ = I × R₁ = ? &nbsp;|&nbsp; U₂ = I × R₂ = ?`,
            ],
            steps:[
                {title:'① Xác định cấu trúc', body:`R₁ (${R1}Ω) và R₂ (${R2}Ω) mắc **nối tiếp** với nguồn E = ${V}V`},
                {title:'② Tính R tương đương', body:`R_tđ = R₁ + R₂ = ${R1} + ${R2} = **${Req} Ω**`},
                {title:'③ Tính dòng điện tổng', body:`I = E / R_tđ = ${V} / ${Req} = **${I.toFixed(4)} A** ≈ ${parseFloat(I.toFixed(3))} A`},
                {title:'④ Phân bổ điện áp (KVL)', body:`U₁ = I × R₁ = ${I.toFixed(4)} × ${R1} = **${U1.toFixed(4)} V**\nU₂ = I × R₂ = ${I.toFixed(4)} × ${R2} = **${U2.toFixed(4)} V**\nKiểm tra KVL: U₁ + U₂ = ${(U1+U2).toFixed(4)}V ≈ E = ${V}V ✓`},
            ],
        };
    }

    _series3() {
        const V=this._randV(), R1=this._randR(), R2=this._randR(), R3=this._randR();
        const Req=R1+R2+R3, I=V/Req, U1=I*R1, U2=I*R2, U3=I*R3;
        const qs=[
            {key:'I',   text:'Tính cường độ dòng điện I chạy trong mạch', answer:I,   unit:'A'},
            {key:'Req', text:'Tính điện trở tương đương R<sub>tđ</sub> của mạch', answer:Req, unit:'Ω'},
            {key:'U2',  text:`Tính hiệu điện thế U rơi trên R₂ = ${R2} Ω`, answer:U2, unit:'V'},
            {key:'U3',  text:`Tính hiệu điện thế U rơi trên R₃ = ${R3} Ω`, answer:U3, unit:'V'},
        ];
        return {
            type:'series3', typeName:'Mạch Nối Tiếp — 3 Điện trở',
            components:[
                {type:'voltage_source',params:{voltage:V,label:'E'},x:-240,y:0},
                {type:'resistor',params:{resistance:R1,label:'R₁'},x:-80,y:0},
                {type:'resistor',params:{resistance:R2,label:'R₂'},x:80,y:0},
                {type:'resistor',params:{resistance:R3,label:'R₃'},x:240,y:0},
            ],
            wires:[[0,1,1,0],[1,1,2,0],[2,1,3,0],[3,1,0,0]],
            given:{E:`${V} V`, R1:`${R1} Ω`, R2:`${R2} Ω`, R3:`${R3} Ω`},
            question:this._pick(qs),
            allAnswers:{I,Req,U1,U2,U3},
            hints:[
                `🔍 Ba điện trở R₁, R₂, R₃ trên cùng một nhánh → mạch <strong>nối tiếp</strong>. Dòng điện bằng nhau qua cả 3.`,
                `💡 R<sub>tđ</sub> = R₁ + R₂ + R₃ = ${R1} + ${R2} + ${R3} = ? (Ω)<br>Sau đó: I = E / R<sub>tđ</sub>`,
                `🧮 R<sub>tđ</sub> = <strong>${Req} Ω</strong> → I = ${V}/${Req} ≈ ${I.toFixed(3)} A<br>U₂ = I × R₂ = ${I.toFixed(3)} × ${R2} ≈ <strong>${U2.toFixed(3)} V</strong>`,
            ],
            steps:[
                {title:'① Xác định cấu trúc', body:`R₁, R₂, R₃ mắc **nối tiếp** với nguồn E = ${V}V`},
                {title:'② Tính R tương đương', body:`R_tđ = R₁ + R₂ + R₃ = ${R1} + ${R2} + ${R3} = **${Req} Ω**`},
                {title:'③ Tính dòng điện tổng', body:`I = E / R_tđ = ${V} / ${Req} = **${I.toFixed(4)} A**`},
                {title:'④ Phân bổ điện áp (KVL)', body:`U₁ = ${U1.toFixed(4)}V &nbsp;|&nbsp; U₂ = ${U2.toFixed(4)}V &nbsp;|&nbsp; U₃ = ${U3.toFixed(4)}V\nKiểm tra: ${(U1+U2+U3).toFixed(4)}V ≈ ${V}V ✓`},
            ],
        };
    }

    _parallel2() {
        const V=this._randV(), R1=this._randR(), R2=this._randR();
        const Req=1/(1/R1+1/R2), I=V/Req, I1=V/R1, I2=V/R2;
        const qs=[
            {key:'I',   text:'Tính tổng cường độ dòng điện I từ nguồn', answer:I,   unit:'A'},
            {key:'Req', text:'Tính điện trở tương đương R<sub>tđ</sub> của mạch', answer:Req, unit:'Ω'},
            {key:'I1',  text:`Tính dòng điện I qua nhánh R₁ = ${R1} Ω`, answer:I1,  unit:'A'},
            {key:'I2',  text:`Tính dòng điện I qua nhánh R₂ = ${R2} Ω`, answer:I2,  unit:'A'},
        ];
        return {
            type:'parallel2', typeName:'Mạch Song Song — 2 Điện trở',
            components:[
                {type:'voltage_source',params:{voltage:V,label:'E'},x:-140,y:0},
                {type:'resistor',params:{resistance:R1,label:'R₁'},x:60,y:-60},
                {type:'resistor',params:{resistance:R2,label:'R₂'},x:60,y:60},
            ],
            wires:[[0,1,1,0],[0,1,2,0],[1,1,0,0],[2,1,0,0]],
            given:{E:`${V} V`, R1:`${R1} Ω`, R2:`${R2} Ω`},
            question:this._pick(qs),
            allAnswers:{I,Req,I1,I2},
            hints:[
                `🔍 R₁ và R₂ có <strong>cùng hai điểm nối</strong> → mạch <strong>song song</strong>. Cả hai điện trở có cùng hiệu điện thế U = E = ${V}V.`,
                `💡 Với mạch song song: <strong>1/R<sub>tđ</sub> = 1/R₁ + 1/R₂</strong><br>&nbsp;&nbsp;&nbsp;= 1/${R1} + 1/${R2}<br>Tính R<sub>tđ</sub> = ?`,
                `🧮 R<sub>tđ</sub> = <strong>${Req.toFixed(4)} Ω</strong><br>I₁ = U/R₁ = ${V}/${R1} = <strong>${I1.toFixed(4)} A</strong><br>I₂ = U/R₂ = ${V}/${R2} = <strong>${I2.toFixed(4)} A</strong><br>I = I₁ + I₂ (KCL)`,
            ],
            steps:[
                {title:'① Xác định cấu trúc', body:`R₁ và R₂ mắc **song song** → cùng điện áp U = E = ${V}V`},
                {title:'② Tính R tương đương', body:`1/R_tđ = 1/R₁ + 1/R₂ = 1/${R1} + 1/${R2} = ${(1/R1+1/R2).toFixed(6)} Ω⁻¹\nR_tđ = **${Req.toFixed(4)} Ω**`},
                {title:'③ Dòng qua từng nhánh', body:`I₁ = U/R₁ = ${V}/${R1} = **${I1.toFixed(4)} A**\nI₂ = U/R₂ = ${V}/${R2} = **${I2.toFixed(4)} A**`},
                {title:'④ Dòng tổng (KCL)', body:`I = I₁ + I₂ = ${I1.toFixed(4)} + ${I2.toFixed(4)} = **${I.toFixed(4)} A** ✓`},
            ],
        };
    }

    _mixed_sp() {
        const V=this._randV(), R1=this._randR(), R2=this._randR(), R3=this._randR();
        const R23=1/(1/R2+1/R3), Req=R1+R23;
        const I=V/Req, U1=I*R1, U23=I*R23, I2=U23/R2, I3=U23/R3;
        const qs=[
            {key:'I',   text:'Tính dòng điện I tổng từ nguồn (cũng là I qua R₁)', answer:I,   unit:'A'},
            {key:'Req', text:'Tính điện trở tương đương toàn mạch', answer:Req, unit:'Ω'},
            {key:'U1',  text:`Tính hiệu điện thế U rơi trên R₁ = ${R1} Ω`, answer:U1, unit:'V'},
            {key:'I2',  text:`Tính dòng điện qua nhánh R₂ = ${R2} Ω`, answer:I2, unit:'A'},
        ];
        return {
            type:'mixed_sp', typeName:'Mạch Hỗn Hợp — R₁ nt (R₂ // R₃)',
            components:[
                {type:'voltage_source',params:{voltage:V,label:'E'},x:-200,y:0},
                {type:'resistor',params:{resistance:R1,label:'R₁'},x:-40,y:0},
                {type:'resistor',params:{resistance:R2,label:'R₂'},x:120,y:-60},
                {type:'resistor',params:{resistance:R3,label:'R₃'},x:120,y:60},
            ],
            wires:[[0,1,1,0],[1,1,2,0],[1,1,3,0],[2,1,0,0],[3,1,0,0]],
            given:{E:`${V} V`, R1:`${R1} Ω`, R2:`${R2} Ω`, R3:`${R3} Ω`},
            question:this._pick(qs),
            allAnswers:{I,Req,U1,U23,I2,I3},
            hints:[
                `🔍 Xem kỹ sơ đồ: R₂ và R₃ có <strong>chung hai đầu nối</strong> → song song với nhau. Cụm R₂//R₃ này nối tiếp với R₁ và nguồn E.`,
                `💡 <strong>Bước thu gọn:</strong><br>R₂₃ = R₂//R₃ = 1/(1/${R2}+1/${R3}) = ${R23.toFixed(2)} Ω<br>R<sub>tđ</sub> = R₁ + R₂₃ = ${R1} + ${R23.toFixed(2)} = ?`,
                `🧮 R<sub>tđ</sub> = ${Req.toFixed(2)} Ω → I = ${V}/${Req.toFixed(2)} ≈ <strong>${I.toFixed(4)} A</strong><br><strong>Hoàn trả:</strong> U₂₃ = I×R₂₃ = ${U23.toFixed(4)}V → I₂ = U₂₃/R₂ = <strong>${I2.toFixed(4)} A</strong>`,
            ],
            steps:[
                {title:'① Xác định cấu trúc', body:`R₂ (${R2}Ω) // R₃ (${R3}Ω) → song song\nCụm này nối tiếp với R₁ (${R1}Ω) và nguồn E = ${V}V`},
                {title:'② Thu gọn R₂ // R₃', body:`1/R₂₃ = 1/${R2} + 1/${R3}\nR₂₃ = **${R23.toFixed(4)} Ω**`},
                {title:'③ Tính R_tđ toàn mạch', body:`R_tđ = R₁ + R₂₃ = ${R1} + ${R23.toFixed(4)} = **${Req.toFixed(4)} Ω**`},
                {title:'④ Tính dòng qua R₁ (Reduce)', body:`I = E / R_tđ = ${V} / ${Req.toFixed(4)} = **${I.toFixed(4)} A**\nU₁ = I × R₁ = **${U1.toFixed(4)} V**`},
                {title:'⑤ Hoàn trả — Phân tích R₂//R₃ (Return)', body:`U₂₃ = I × R₂₃ = **${U23.toFixed(4)} V** (= U₂ = U₃)\nI₂ = U₂₃/R₂ = **${I2.toFixed(4)} A**\nI₃ = U₂₃/R₃ = **${I3.toFixed(4)} A**\nKT KCL: I₂+I₃ = ${(I2+I3).toFixed(4)} ≈ I = ${I.toFixed(4)} A ✓`},
            ],
        };
    }
}

// ============================================================
// 15. QUIZ MODE ORCHESTRATOR
// ============================================================
class QuizMode {
    constructor() {
        this.generator  = new ProblemGenerator();
        this.problem    = null;
        this.hintIndex  = 0;
        this.active     = false;
        this.score      = { correct:0, wrong:0, total:0 };
    }

    activate() {
        this.active = true;
        document.getElementById('right-panel').style.display   = 'none';
        document.getElementById('quiz-overlay').style.display  = 'flex';
        document.getElementById('quiz-mode-btn').classList.add('active');
        this.nextProblem();
    }

    deactivate() {
        this.active = false;
        document.getElementById('right-panel').style.display   = '';
        document.getElementById('quiz-overlay').style.display  = 'none';
        document.getElementById('quiz-mode-btn').classList.remove('active');
        runSimulation();
        showToast('Đã thoát chế độ Luyện Tập.', 'info');
    }

    nextProblem() {
        this.problem    = this.generator.generate();
        this.hintIndex  = 0;
        this._loadCircuit();
        this._renderUI();
        showToast(`Bài mới: ${this.problem.typeName}`, 'info');
    }

    _loadCircuit() {
        transientEngine.stop();
        circuitModel.clear();
        circuitCanvas._selectComponent(null);
        if (resultsPanel) resultsPanel.resetGraph();

        const added = [];
        this.problem.components.forEach(c => {
            added.push(circuitModel.addComponent(c.type, c.x, c.y, c.params));
        });
        this.problem.wires.forEach(w => {
            circuitModel.addWire(added[w[0]].id, w[1], added[w[2]].id, w[3]);
        });
        // Solve with MNA (steady state)
        const netlist = buildNetlist(circuitModel);
        mnaResults = new MNASolver().solve(circuitModel, netlist, {});
        circuitCanvas.updateResults(mnaResults);
    }

    getNextHint() {
        const hints = this.problem?.hints || [];
        if (this.hintIndex >= hints.length) {
            showToast('Hết gợi ý! Hãy xem lời giải đầy đủ phía dưới.', 'warn');
            return;
        }
        const hint = hints[this.hintIndex++];
        const el = document.getElementById('quiz-hints-list');
        if (!el) return;
        const div = document.createElement('div');
        div.className = 'quiz-hint-item';
        div.innerHTML = `<span class="hint-num">Gợi ý ${this.hintIndex}</span>${hint}`;
        el.appendChild(div);
        el.scrollTop = el.scrollHeight;
        // Disable hint button if exhausted
        if (this.hintIndex >= hints.length) {
            const btn = document.getElementById('quiz-hint-btn');
            if (btn) { btn.textContent = '💡 Hết gợi ý'; btn.disabled = true; }
        }
    }

    checkAnswer(raw) {
        const val = parseFloat(String(raw).replace(',', '.'));
        if (isNaN(val) || !this.problem) {
            showToast('Vui lòng nhập một số hợp lệ!', 'warn'); return;
        }
        const correct = this.problem.question.answer;
        const rel = Math.abs(val - correct) / (Math.abs(correct) + 1e-9);
        this.score.total++;

        const fbEl = document.getElementById('quiz-feedback');
        const unit = this.problem.question.unit;

        if (rel <= 0.05) {
            this.score.correct++;
            fbEl.className = 'quiz-feedback correct';
            fbEl.innerHTML = `✅ <strong>Chính xác!</strong> Đáp án: <code>${parseFloat(correct.toFixed(4))} ${unit}</code>`;
        } else if (rel <= 0.15) {
            this.score.wrong++;
            const pct = (rel * 100).toFixed(1);
            fbEl.className = 'quiz-feedback close';
            fbEl.innerHTML = `🟡 <strong>Gần đúng</strong> (sai số ${pct}%). Đáp án đúng: <code>${parseFloat(correct.toFixed(4))} ${unit}</code><br><small>Tolerance ±5% — kiểm tra bước làm tròn của bạn.</small>`;
        } else {
            this.score.wrong++;
            const pct = (rel * 100).toFixed(0);
            fbEl.className = 'quiz-feedback wrong';
            fbEl.innerHTML = `❌ <strong>Chưa chính xác</strong> (chênh ${pct}%). Hãy thử dùng gợi ý 💡 hoặc xem lời giải bên dưới.`;
        }
        fbEl.style.display = 'block';
        this._updateScore();
    }

    showSolution() {
        const area = document.getElementById('quiz-solution');
        if (!area || !this.problem) return;
        const steps = this.problem.steps;
        let html = '';
        steps.forEach(s => {
            const body = s.body
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');
            html += `<div class="solution-step">
                <div class="sol-title">${s.title}</div>
                <div class="sol-body">${body}</div>
            </div>`;
        });
        area.innerHTML = html;
        area.style.display = 'block';
        document.getElementById('quiz-show-sol-btn').style.display = 'none';
    }

    _renderUI() {
        const p = this.problem;

        // Type badge
        document.getElementById('quiz-type-badge').textContent = p.typeName;

        // Given values
        const givenHtml = Object.entries(p.given)
            .map(([k,v]) => `<div class="given-chip"><span class="given-key">${k}</span><span class="given-val">${v}</span></div>`)
            .join('');
        document.getElementById('quiz-given').innerHTML = givenHtml;

        // Question
        document.getElementById('quiz-question-text').innerHTML = p.question.text;

        // Unit hint
        document.getElementById('quiz-unit-hint').textContent = `(${p.question.unit})`;

        // Reset all state elements
        document.getElementById('quiz-feedback').style.display  = 'none';
        document.getElementById('quiz-feedback').innerHTML      = '';
        document.getElementById('quiz-hints-list').innerHTML    = '';
        document.getElementById('quiz-solution').style.display  = 'none';
        document.getElementById('quiz-solution').innerHTML      = '';
        document.getElementById('quiz-answer-input').value      = '';
        document.getElementById('quiz-show-sol-btn').style.display = 'inline-flex';

        const hintBtn = document.getElementById('quiz-hint-btn');
        if (hintBtn) { hintBtn.textContent = '💡 Gợi ý'; hintBtn.disabled = false; }

        this._updateScore();
    }

    _updateScore() {
        const el = document.getElementById('quiz-score-display');
        if (!el) return;
        const pct = this.score.total > 0
            ? Math.round(this.score.correct / this.score.total * 100)
            : 0;
        el.innerHTML = `<span class="score-correct">${this.score.correct}</span><span class="score-sep">/</span><span class="score-total">${this.score.total}</span><span class="score-pct">${pct}%</span>`;
    }
}

// ============================================================
// 16. QUIZ UI CALLBACK FUNCTIONS
// ============================================================
let quizManager;

function initQuizMode() {
    quizManager = new QuizMode();
}

function toggleQuizMode() {
    if (!quizManager) initQuizMode();
    if (quizManager.active) {
        quizManager.deactivate();
    } else {
        quizManager.activate();
    }
}

function nextQuizProblem() {
    quizManager?.nextProblem();
}

function getQuizHint() {
    quizManager?.getNextHint();
}

function checkQuizAnswer() {
    const val = document.getElementById('quiz-answer-input')?.value;
    quizManager?.checkAnswer(val ?? '');
}

function showQuizSolution() {
    quizManager?.showSolution();
}

function quizAnswerKeydown(e) {
    if (e.key === 'Enter') checkQuizAnswer();
}

// ============================================================
// 17. REQ SOLVER — Current Injection Method (MNA-based)
// ============================================================
class ReqSolver {
    /**
     * Compute Req using two strategies:
     * 1. Simple: V_source / I_source (when voltage source exists and results available)
     * 2. Proper Current Injection (1A test source, solves for V at the injected node)
     */
    fromResults(vsrc, results) {
        if (!vsrc || !results) return null;
        const r = results.results[vsrc.id];
        if (!r || Math.abs(r.current) < 1e-12) return null;
        return Math.abs(vsrc.params.voltage / r.current);
    }

    /**
     * Current injection method:
     * - Remove voltage sources
     * - Inject I_test = 1A between source positive and ground
     * - Solve G*V = I
     * - Req = V(positive node) / 1A
     */
    currentInjection(model) {
        const vsrc = model.components.find(c => c.type === 'voltage_source');
        const resistors = model.components.filter(c => c.type === 'resistor');
        if (!vsrc || resistors.length === 0) return null;

        // Build UnionFind for wires
        const uf = new UnionFind();
        const tkey = (cid, ti) => `${cid}_${ti}`;
        model.components.forEach(c => [0,1].forEach(i => uf.make(tkey(c.id, i))));
        model.wires.forEach(w => uf.union(tkey(w.fromCompId, w.fromTermIdx), tkey(w.toCompId, w.toTermIdx)));

        // Collect all unique root nodes
        const roots = new Set();
        model.components.forEach(c => [0,1].forEach(i => roots.add(uf.find(tkey(c.id, i)))));
        const rootArr = [...roots];
        const rootIdx = new Map(rootArr.map((r,i) => [r,i]));

        const groundRoot = uf.find(tkey(vsrc.id, 0)); // vsrc terminal 0 = negative = ground
        const posRoot    = uf.find(tkey(vsrc.id, 1)); // vsrc terminal 1 = positive

        // Non-ground nodes
        const ngNodes = rootArr.filter(r => r !== groundRoot);
        const ng = ngNodes.length;
        if (ng === 0) return null;
        const ngIdx = new Map(ngNodes.map((r,i) => [r,i]));

        // Build conductance matrix (resistors only, no voltage sources)
        const G = Array.from({length:ng}, () => new Float64Array(ng));
        const Ivec = new Float64Array(ng);

        resistors.forEach(r => {
            const ra = uf.find(tkey(r.id, 0));
            const rb = uf.find(tkey(r.id, 1));
            const g = 1 / Math.max(r.params.resistance, 1e-6);
            const ia = ngIdx.get(ra);
            const ib = ngIdx.get(rb);
            if (ia !== undefined) G[ia][ia] += g;
            if (ib !== undefined) G[ib][ib] += g;
            if (ia !== undefined && ib !== undefined) { G[ia][ib] -= g; G[ib][ia] -= g; }
        });

        // Voltmeters also contribute (very high R)
        model.components.filter(c => c.type === 'voltmeter').forEach(vm => {
            const ra = uf.find(tkey(vm.id, 0));
            const rb = uf.find(tkey(vm.id, 1));
            const g = 1 / (vm.params.internal_resistance || 1e9);
            const ia = ngIdx.get(ra);
            const ib = ngIdx.get(rb);
            if (ia !== undefined) G[ia][ia] += g;
            if (ib !== undefined) G[ib][ib] += g;
            if (ia !== undefined && ib !== undefined) { G[ia][ib] -= g; G[ib][ia] -= g; }
        });

        // Inject 1A into posRoot
        const pNgIdx = ngIdx.get(posRoot);
        if (pNgIdx === undefined) return null;
        Ivec[pNgIdx] = 1.0;

        // Solve using gaussSolve
        const sol = gaussSolve(G, Ivec, ng);
        if (!sol) return null;

        return sol[pNgIdx]; // Req = V_pos / 1A
    }
}

// ============================================================
// 18. TOPOLOGY REDUCER — Series/Parallel Graph Reduction
// ============================================================
class TopologyReducer {
    /**
     * Try to reduce a set of resistors to a single equivalent using
     * series and parallel detection. Returns { success, steps, Req }
     */
    reduce(model) {
        const vsrc = model.components.find(c => c.type === 'voltage_source');
        const resistors = model.components.filter(c => c.type === 'resistor');
        if (resistors.length === 0) return { success: false, steps: [], Req: null };

        // Build node map using UnionFind
        const uf = new UnionFind();
        const tk = (cid, ti) => `${cid}_${ti}`;
        model.components.forEach(c => [0,1].forEach(i => uf.make(tk(c.id, i))));
        model.wires.forEach(w => uf.union(tk(w.fromCompId, w.fromTermIdx), tk(w.toCompId, w.toTermIdx)));

        // Determine terminal and source nodes
        const groundRoot = vsrc ? uf.find(tk(vsrc.id, 0)) : null;
        const posRoot    = vsrc ? uf.find(tk(vsrc.id, 1)) : null;

        // Build groups: each group = one reducible element
        let groups = resistors.map(r => ({
            id: r.id,
            name: r.params.label || 'R',
            value: r.params.resistance,
            nodeA: uf.find(tk(r.id, 0)), // left terminal
            nodeB: uf.find(tk(r.id, 1)), // right terminal
            expr: `${r.params.resistance}`,
        }));

        const steps = [];
        let pass = 1;
        let changed = true;

        while (changed && groups.length > 1) {
            changed = false;

            // ── Parallel detection ──────────────────────────────────────
            outer:
            for (let i = 0; i < groups.length - 1; i++) {
                for (let j = i + 1; j < groups.length; j++) {
                    const a = groups[i], b = groups[j];
                    const parallel = (a.nodeA === b.nodeA && a.nodeB === b.nodeB) ||
                                     (a.nodeA === b.nodeB && a.nodeB === b.nodeA);
                    if (parallel) {
                        const Req = 1 / (1/a.value + 1/b.value);
                        const newName = `(${a.name}∥${b.name})`;
                        steps.push({
                            type: 'parallel',
                            title: `Bước ${pass++}: Thu gọn song song`,
                            body: `${a.name} (${a.expr}Ω) mắc song song với ${b.name} (${b.expr}Ω)<br>` +
                                  `<em>1/R_tđ = 1/${a.value} + 1/${b.value} = ${(1/a.value+1/b.value).toFixed(6)}</em><br>` +
                                  `<strong>&rarr; R_tđ = ${Req.toFixed(4)} Ω</strong>`,
                        });
                        const merged = {
                            id: `p_${i}_${j}`,
                            name: newName,
                            value: Req,
                            nodeA: a.nodeA,
                            nodeB: a.nodeB,
                            expr: Req.toFixed(4),
                        };
                        groups.splice(j, 1);
                        groups.splice(i, 1, merged);
                        changed = true;
                        break outer;
                    }
                }
            }
            if (changed) continue;

            // ── Series detection ────────────────────────────────────────
            // Build adjacency: nodeId → [groupsConnectedHere]
            const adj = new Map();
            groups.forEach(g => {
                if (!adj.has(g.nodeA)) adj.set(g.nodeA, []);
                if (!adj.has(g.nodeB)) adj.set(g.nodeB, []);
                adj.get(g.nodeA).push(g);
                adj.get(g.nodeB).push(g);
            });

            for (const [node, grps] of adj.entries()) {
                // Skip source terminals (they're boundary nodes)
                if (node === groundRoot || node === posRoot) continue;
                if (grps.length !== 2) continue;

                const [a, b] = grps;
                // Make sure they share exactly this node and are different elements
                if (a.id === b.id) continue;

                const Req = a.value + b.value;
                const newName = `(${a.name}+${b.name})`;
                // Determine outer nodes (not the shared intermediate node)
                const nodeA = (a.nodeA === node) ? a.nodeB : a.nodeA;
                const nodeB = (b.nodeA === node) ? b.nodeB : b.nodeA;

                steps.push({
                    type: 'series',
                    title: `Bước ${pass++}: Thu gọn nối tiếp`,
                    body: `${a.name} (${a.expr}Ω) mắc nối tiếp với ${b.name} (${b.expr}Ω)<br>` +
                          `<em>R_tđ = ${a.expr} + ${b.expr}</em><br>` +
                          `<strong>&rarr; R_tđ = ${Req.toFixed(4)} Ω</strong>`,
                });

                const ai = groups.indexOf(a), bi = groups.indexOf(b);
                const lo = Math.min(ai,bi), hi = Math.max(ai,bi);
                groups.splice(hi, 1);
                groups.splice(lo, 1);
                groups.push({
                    id: `s_${node}`,
                    name: newName,
                    value: Req,
                    nodeA, nodeB,
                    expr: Req.toFixed(4),
                });
                changed = true;
                break;
            }
        }

        if (groups.length === 1) {
            return { success: true, steps, Req: groups[0].value };
        } else {
            return { success: false, steps, Req: null }; // bridge/wheatstone
        }
    }
}

// ============================================================
// 19. SOLUTION GENERATOR — Full step-by-step walkthrough
// ============================================================
class SolutionGenerator {
    generate(model, results, Req) {
        const steps = [];
        const vsrc = model.components.find(c => c.type === 'voltage_source');
        const resistors = model.components.filter(c => c.type === 'resistor');

        if (model.components.length === 0) {
            steps.push({ title: 'Mạch trống', body: 'Hãy lắp ráp một mạch điện trước.' });
            return steps;
        }
        if (resistors.length === 0) {
            steps.push({ title: 'Không có điện trở', body: 'Thêm điện trở để phân tích.' });
            return steps;
        }

        // ── Step 0: Circuit overview ────────────────────────────────────
        const compList = model.components
            .filter(c => c.type !== 'ammeter' && c.type !== 'voltmeter')
            .map(c => {
                if (c.type === 'voltage_source') return `Nguồn E = ${c.params.voltage}V`;
                if (c.type === 'resistor') return `${c.params.label || 'R'} = ${c.params.resistance}Ω`;
                if (c.type === 'capacitor') return `${c.params.label || 'C'} = ${(c.params.capacitance*1000).toFixed(2)}mF`;
                return c.type;
            }).join(', ');
        steps.push({ title: '⓪ Xác định linh kiện', body: compList });

        // ── Step 1: Topology reduction ──────────────────────────────────
        const reduction = new TopologyReducer().reduce(model);
        if (reduction.success) {
            reduction.steps.forEach(s => steps.push(s));
            steps.push({
                title: `✅ Điện trở tương đương toàn mạch`,
                body: `<strong>R_tđ = ${reduction.Req.toFixed(4)} Ω</strong>`,
            });
        } else {
            // Include partial steps (if any) then fall back to MNA explanation
            reduction.steps.forEach(s => steps.push(s));
            steps.push({
                title: '🔬 Mạch phức tạp — Dùng Phương pháp Bơm Dòng (MNA)',
                body: `Mạch có cấu trúc không thể rút gọn series/parallel thông thường (ví dụ: mạch cầu Wheatstone).<br>` +
                      `Hệ thống dùng MNA: bơm I_test = 1A vào hai cực nguồn, giải G·V = I, <strong>R_tđ = ΔV / 1A = ${Req ? Req.toFixed(4) + ' Ω' : '?'}</strong>`,
            });
        }

        if (!vsrc || !results) return steps;

        // ── Step 2: Total current ───────────────────────────────────────
        const vsrcR = results.results[vsrc.id];
        if (vsrcR) {
            const Itotal = Math.abs(vsrcR.current);
            const ReqDisplay = Req ? Req.toFixed(4) : '?';
            steps.push({
                title: '① Tính dòng điện tổng (Định luật Ohm)',
                body: `I = E / R_tđ = ${vsrc.params.voltage} / ${ReqDisplay} = <strong>${Itotal.toFixed(4)} A</strong>`,
            });
        }

        // ── Step 3: Per-resistor breakdown ─────────────────────────────
        const rDetails = resistors.map(r => {
            const rr = results.results[r.id];
            if (!rr) return null;
            const U = Math.abs(rr.voltage).toFixed(4);
            const I = Math.abs(rr.current).toFixed(4);
            return `${r.params.label || 'R'} (${r.params.resistance}Ω): <strong>U = ${U}V</strong>, <strong>I = ${I}A</strong>, P = ${(rr.voltage*rr.current).toFixed(4)}W`;
        }).filter(Boolean);

        if (rDetails.length > 0) {
            steps.push({
                title: '② Điện áp & Dòng điện từng điện trở (KVL + KCL)',
                body: rDetails.join('<br>'),
            });
        }

        // ── Step 4: KVL check ──────────────────────────────────────────
        if (vsrcR && resistors.length > 0) {
            const sumU = resistors.reduce((acc, r) => {
                const rr = results.results[r.id];
                return acc + (rr ? Math.abs(rr.voltage) : 0);
            }, 0);
            const E = Math.abs(vsrc.params.voltage);
            const ok = Math.abs(sumU - E) < E * 0.01;
            steps.push({
                title: '③ Kiểm tra KVL (Kirchhoff Voltage Law)',
                body: `Σ|U_R| = ${sumU.toFixed(4)}V vs E = ${E}V → ${ok ? '✅ Thỏa mãn KVL' : '⚠️ Chênh lệch nhỏ do làm tròn số'}`,
            });
        }

        // ── Step 5: Power budget ───────────────────────────────────────
        if (vsrcR) {
            const Psrc = Math.abs(vsrc.params.voltage * vsrcR.current);
            const Presistors = resistors.reduce((acc, r) => {
                const rr = results.results[r.id];
                return acc + (rr ? rr.voltage * rr.current : 0);
            }, 0);
            steps.push({
                title: '④ Cân bằng công suất',
                body: `Nguồn phát: P_E = ${Psrc.toFixed(4)}W<br>` +
                      `Điện trở tiêu thụ: P_R = ${Math.abs(Presistors).toFixed(4)}W`,
            });
        }

        return steps;
    }
}

// ============================================================
// 20. FREE PRACTICE MODE ORCHESTRATOR
// ============================================================
class FreePracticeMode {
    constructor() {
        this.active  = false;
        this._solver = new ReqSolver();
    }

    activate() {
        this.active = true;
        document.getElementById('right-panel').style.display        = 'none';
        document.getElementById('quiz-overlay').style.display       = 'none';
        document.getElementById('fp-panel').style.display           = 'flex';
        document.getElementById('free-practice-btn').classList.add('active');
        // also deactivate quiz if active
        if (quizManager?.active) quizManager.deactivate();
        this.update(mnaResults, circuitModel);
        showToast('Chế độ Luyện Tập Tự Do đã kích hoạt!', 'success');
    }

    deactivate() {
        this.active = false;
        document.getElementById('right-panel').style.display        = '';
        document.getElementById('fp-panel').style.display           = 'none';
        document.getElementById('free-practice-btn').classList.remove('active');
        showToast('Đã thoát Luyện Tập Tự Do.', 'info');
    }

    update(results, model) {
        if (!this.active || !model) return;

        const vsrc = model.components.find(c => c.type === 'voltage_source');
        const resistors = model.components.filter(c => c.type === 'resistor');

        // Compute Req
        let Req = null;
        if (results) {
            Req = this._solver.fromResults(vsrc, results);
        }
        if (Req === null) {
            Req = this._solver.currentInjection(model);
        }

        this._renderDashboard(model, results, vsrc, Req);
    }

    _renderDashboard(model, results, vsrc, Req) {
        const panel = document.getElementById('fp-dashboard');
        if (!panel) return;

        const hasResults = results && Object.keys(results.results || {}).length > 0;

        // ── Summary metrics ────────────────────────────────
        const Itotal = (vsrc && results?.results?.[vsrc.id])
            ? Math.abs(results.results[vsrc.id].current)
            : null;

        let html = `<div class="fp-metrics">`;

        if (Req !== null) {
            html += `<div class="fp-metric" title="Điện trở tương đương toàn mạch (phương pháp bơm dòng 1A)">
                <div class="fp-metric-label">R<sub>tđ</sub></div>
                <div class="fp-metric-val accent2">${Req.toFixed(4)}<span class="fp-unit">Ω</span></div>
            </div>`;
        }
        if (vsrc && results?.results?.[vsrc.id]) {
            const E = vsrc.params.voltage;
            html += `<div class="fp-metric">
                <div class="fp-metric-label">E</div>
                <div class="fp-metric-val green">${E}<span class="fp-unit">V</span></div>
            </div>`;
        }
        if (Itotal !== null) {
            html += `<div class="fp-metric">
                <div class="fp-metric-label">I<sub>tổng</sub></div>
                <div class="fp-metric-val cyan">${Itotal.toFixed(4)}<span class="fp-unit">A</span></div>
            </div>`;
        }
        html += `</div>`;

        // ── Component table ────────────────────────────────
        const measurables = model.components.filter(c =>
            c.type !== 'wire' && c.type !== 'ammeter' && c.type !== 'voltmeter'
        );

        if (measurables.length > 0) {
            html += `<div class="fp-table">
                <div class="fp-table-hd">
                    <span>Linh kiện</span><span>U (V)</span><span>I (A)</span><span>P (W)</span>
                </div>`;
            measurables.forEach(c => {
                const r = results?.results?.[c.id];
                const label = c.params.label || c.type;
                const col = COLORS[c.type]?.label || '#aaa';
                const U = r ? Math.abs(r.voltage).toFixed(3) : '—';
                const I = r ? Math.abs(r.current).toFixed(4) : '—';
                const P = r ? (r.voltage * r.current).toFixed(4) : '—';
                const paramStr = c.type === 'voltage_source' ? `${c.params.voltage}V`
                    : c.type === 'resistor' ? `${c.params.resistance}Ω`
                    : c.type === 'capacitor' ? `${(c.params.capacitance*1000).toFixed(1)}mF` : '';
                html += `<div class="fp-table-row">
                    <span class="fp-comp-name" style="color:${col}" title="${paramStr}">${label}<span class="fp-comp-param">${paramStr}</span></span>
                    <span class="fp-val">${U}</span>
                    <span class="fp-val">${I}</span>
                    <span class="fp-val">${P}</span>
                </div>`;
            });
            html += `</div>`;
        } else {
            html += `<div class="fp-empty">Thêm linh kiện và nối dây<br>để bắt đầu phân tích</div>`;
        }

        panel.innerHTML = html;
    }

    showSolution() {
        const gen = new SolutionGenerator();
        const vsrc = circuitModel.components.find(c => c.type === 'voltage_source');
        let Req = null;
        if (mnaResults) Req = this._solver.fromResults(vsrc, mnaResults);
        if (Req === null) Req = this._solver.currentInjection(circuitModel);
        const steps = gen.generate(circuitModel, mnaResults, Req);
        this._renderSolution(steps);
    }

    _renderSolution(steps) {
        const area = document.getElementById('fp-solution-area');
        if (!area) return;
        const already = area.style.display === 'block';

        if (already) {
            area.style.display = 'none';
            document.getElementById('fp-show-sol-btn').textContent = '📋 Xem lời giải';
            return;
        }

        let html = '';
        steps.forEach(s => {
            const body = s.body
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');
            html += `<div class="fp-sol-step">
                <div class="fp-sol-title">${s.title}</div>
                <div class="fp-sol-body">${body}</div>
            </div>`;
        });
        area.innerHTML = html;
        area.style.display = 'block';
        document.getElementById('fp-show-sol-btn').textContent = '▲ Thu gọn';
    }
}

// ============================================================
// 21. FREE PRACTICE CALLBACKS + HOOKS
// ============================================================
let freePracticeManager;

function initFreePractice() {
    freePracticeManager = new FreePracticeMode();
}

function toggleFreePractice() {
    if (!freePracticeManager) initFreePractice();
    if (freePracticeManager.active) {
        freePracticeManager.deactivate();
    } else {
        freePracticeManager.activate();
    }
}

function showFreeSolution() {
    freePracticeManager?.showSolution();
}

// ── Hook into runSimulation to update dashboard ─────────────
(function patchRunSimulation() {
    const _orig = window.runSimulation;
    window.runSimulation = function() {
        if (_orig) _orig.apply(this, arguments);
        // After simulation runs, update free practice dashboard
        if (freePracticeManager?.active) {
            // mnaResults might have been updated by _orig
            setTimeout(() => freePracticeManager.update(mnaResults, circuitModel), 50);
        }
    };
})();
