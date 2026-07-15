const { useState, useEffect, useRef, useMemo } = React;

/**
 * PHÒNG THÍ NGHIỆM VẬT LÝ ẢO: KHẢO SÁT NGUỒN ĐIỆN VÀ MẠCH KÍN
 * Author: Antigravity - PHYSICS.LAB
 */

const PhysicsSim = () => {
    // 1. STATE (ξ, r, R)
    const [emf, setEmf] = useState(12.0); // Suất điện động (V)
    const [internalR, setInternalR] = useState(1.0); // Điện trở trong (Ω)
    const [externalR, setExternalR] = useState(10.0); // Biến trở mạch ngoài (Ω)
    const [showXRay, setShowXRay] = useState(false); // Chế độ nhìn xuyên thấu
    
    // Derived Calculations
    const current = useMemo(() => emf / (externalR + internalR), [emf, externalR, internalR]);
    const terminalV = useMemo(() => current * externalR, [current, externalR]);
    const power = useMemo(() => current * current * externalR, [current, externalR]);
    const efficiency = useMemo(() => (externalR / (externalR + internalR)) * 100, [externalR, internalR]);
    
    // Critical state check: Short Circuit
    const isShortCircuit = externalR === 0;

    // References for DOM/Library integration
    const canvasRef = useRef(null);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const p5Instance = useRef(null);

    // 2. ECharts Initialization & Updates
    useEffect(() => {
        if (!chartRef.current) return;

        if (!chartInstance.current) {
            chartInstance.current = echarts.init(chartRef.current, 'dark');
        }

        // Prepare data for the P(R) and H(R) curves
        const rValues = [];
        const pValues = [];
        const hValues = [];
        const maxR = 50.0;
        const step = 0.5;

        for (let r = 0; r <= maxR; r += step) {
            const I = emf / (r + internalR);
            const P = I * I * r;
            const H = (r / (r + internalR)) * 100;
            
            rValues.push(r.toFixed(1));
            pValues.push(P.toFixed(2));
            hValues.push(H.toFixed(1));
        }

        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                borderColor: 'rgba(0, 242, 255, 0.3)',
                textStyle: { color: '#fff' }
            },
            grid: { left: '8%', right: '8%', bottom: '15%', top: '15%', containLabel: true },
            xAxis: {
                type: 'category',
                name: 'R (Ω)',
                nameLocation: 'middle',
                nameGap: 30,
                data: rValues,
                axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } }
            },
            yAxis: [
                {
                    type: 'value',
                    name: 'Công suất P (W)',
                    position: 'left',
                    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
                    axisLine: { lineStyle: { color: 'rgba(255,215,0,0.5)' } }
                },
                {
                    type: 'value',
                    name: 'Hiệu suất H (%)',
                    position: 'right',
                    max: 100,
                    axisLine: { lineStyle: { color: 'rgba(0,242,255,0.5)' } },
                    splitLine: { show: false }
                }
            ],
            series: [
                {
                    name: 'Công suất P',
                    type: 'line',
                    data: pValues,
                    smooth: true,
                    lineStyle: { color: '#ffd700', width: 3 },
                    symbol: 'none',
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(255, 215, 0, 0.2)' },
                            { offset: 1, color: 'rgba(255, 215, 0, 0)' }
                        ])
                    }
                },
                {
                    name: 'Hiệu suất H',
                    type: 'line',
                    yAxisIndex: 1,
                    data: hValues,
                    smooth: true,
                    lineStyle: { color: '#00f2ff', width: 3, type: 'dashed' },
                    symbol: 'none'
                },
                // Current operating point indicator
                {
                    name: 'Điểm hoạt động',
                    type: 'scatter',
                    data: [[externalR.toFixed(1), power.toFixed(2)]],
                    symbolSize: 15,
                    itemStyle: { 
                        color: isShortCircuit ? '#ef4444' : '#fff',
                        shadowBlur: 10,
                        shadowColor: '#fff'
                    },
                    z: 10
                }
            ]
        };

        chartInstance.current.setOption(option);

        const handleResize = () => chartInstance.current.resize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [emf, internalR, externalR, power, isShortCircuit]);

    // 3. p5.js Sketch Initialization
    useEffect(() => {
        if (!canvasRef.current) return;

        const sketch = (p) => {
            let conventionalParticles = [];
            let electronParticles = [];
            let internalPosParticles = [];
            let internalNegParticles = [];
            let smokeParticles = [];
            
            p.setup = () => {
                const canvas = p.createCanvas(canvasRef.current.offsetWidth, canvasRef.current.offsetHeight);
                canvas.parent(canvasRef.current);
                
                // Conventional current particles (Positive -> Negative)
                for (let i = 0; i < 30; i++) {
                    conventionalParticles.push({ pos: p.random(0, 1000) });
                }
                
                // Electron flow particles (Negative -> Positive)
                for (let i = 0; i < 30; i++) {
                    electronParticles.push({ pos: p.random(0, 1000) });
                }

                // Internal particles (Lực lạ zone)
                for (let i = 0; i < 15; i++) {
                    internalPosParticles.push({ x: 0, y: p.random(20, 60), speed: p.random(0.5, 1.5) });
                    internalNegParticles.push({ x: 0, y: p.random(-60, -20), speed: p.random(0.5, 1.5) });
                }
            };

            p.draw = () => {
                p.clear();
                p.noStroke();

                const iVal = current;
                const speed = iVal * 2; 
                const isShort = externalR === 0;

                const w = p.width;
                const h = p.height;
                const cx = w / 2;
                const cy = h / 2;
                const rw = w * 0.7; 
                const rh = h * 0.5; 
                const srcX = cx - rw / 2;
                const srcY = cy;
                const resX = cx + rw / 2;
                const resY = cy;
                const totalDist = 2 * (rw + rh);

                // --- 1. Draw Static Circuit Path ---
                p.strokeWeight(3);
                p.stroke(255, 255, 255, 40);
                p.noFill();
                p.rect(cx - rw / 2, cy - rh / 2, rw, rh, 10);
                
                // --- 2. Draw Battery Source ---
                p.push();
                p.translate(srcX, srcY);
                if (isShort) p.translate(p.random(-2, 2), p.random(-2, 2));
                
                if (showXRay) {
                    // X-Ray View: Semi-transparent shell
                    p.fill(30, 41, 59, 150);
                    p.stroke(255, 255, 255, 30);
                    p.rect(-45, -65, 90, 130, 10);
                    
                    // Internal Electric Field Lines (E-Field: + to -)
                    p.stroke(255, 255, 255, 20);
                    p.strokeWeight(1);
                    for(let i=-30; i<=30; i+=15) {
                        p.line(i, -40, i, 40);
                        p.push();
                        p.translate(i, 10);
                        p.rotate(p.HALF_PI);
                        p.fill(255, 255, 255, 20);
                        p.triangle(0, -3, 0, 3, 5, 0); // E-field arrowheads
                        p.pop();
                    }

                    // Polarity Regions
                    p.noStroke();
                    p.fill(0, 242, 255, 40); p.rect(-45, -65, 90, 30, 10, 10, 0, 0); // Pos zone
                    p.fill(239, 68, 68, 40); p.rect(-45, 35, 90, 30, 0, 0, 10, 10); // Neg zone

                    // Dense Static Charges at poles
                    for(let i=0; i<8; i++) {
                        p.fill(0, 242, 255, 100); p.ellipse(p.random(-35, 35), p.random(-60, -40), 3, 3);
                        p.fill(239, 68, 68, 100); p.ellipse(p.random(-35, 35), p.random(40, 60), 3, 3);
                    }

                    p.fill(0, 242, 255); p.textAlign(p.CENTER); p.textSize(20); p.text("+", 0, -45);
                    p.fill(239, 68, 68); p.text("-", 0, 55);

                    // Internal "Lực Lạ" (The Pump)
                    p.fill(255, 255, 255, 220);
                    internalPosParticles.forEach(part => {
                        part.y -= speed * 0.4;
                        if (part.y < -45) part.y = 45;
                        p.ellipse(part.x + p.sin(part.y * 0.1) * 8, part.y, 5, 5);
                    });

                    // Label for "Lực Lạ"
                    p.push();
                    p.translate(-55, 0);
                    p.rotate(-p.HALF_PI);
                    p.fill(255, 255, 255, 200);
                    p.textSize(10);
                    p.textAlign(p.CENTER);
                    p.text("Cơ chế BƠM do LỰC LẠ", 0, 0);
                    p.stroke(255, 255, 255, 100);
                    p.line(-40, -5, -60, -5); // Upper arrow
                    p.line(-60, -5, -55, -8);
                    p.line(-60, -5, -55, -2);
                    p.pop();

                } else {
                    // Standard View
                    p.fill(30, 41, 59);
                    p.stroke(iVal > 5 ? '#ef4444' : '#00f2ff');
                    p.rect(-20, -40, 40, 80, 5);
                    p.fill(isShort ? '#ef4444' : '#00f2ff');
                    p.rect(-10, -50, 20, 10, 2); 
                    p.fill(50, 50, 50);
                    p.rect(-10, 40, 20, 5, 2); 
                }
                p.pop();

                // --- 3. Draw External Resistor ---
                p.push();
                p.translate(resX, resY);
                p.fill(30, 41, 59);
                p.stroke(255, 215, 0);
                p.beginShape();
                const zigCount = 5;
                const zigSize = 15;
                p.vertex(0, -40);
                for(let j=0; j<zigCount; j++) {
                    p.vertex(-zigSize, -30 + j*15);
                    p.vertex(zigSize, -22.5 + j*15);
                }
                p.vertex(0, 40);
                p.endShape();
                p.noStroke();
                p.fill(255);
                p.text(`R = ${externalR}Ω`, 40, 0);
                p.pop();

                // --- 4. Electron vs Conventional Flow ---
                const getCoords = (d) => {
                    let px, py;
                    if (d < rw) { px = srcX + d; py = cy - rh/2; }
                    else if (d < rw + rh) { px = cx + rw/2; py = cy - rh/2 + (d - rw); }
                    else if (d < 2*rw + rh) { px = cx + rw/2 - (d - (rw+rh)); py = cy + rh/2; }
                    else { px = srcX; py = cy + rh/2 - (d - (2*rw + rh)); }
                    return {x: px, y: py};
                };

                // Case 1: Conventional Current (Always visible, Yellow)
                p.fill(255, 255, 0, 150);
                conventionalParticles.forEach((part, idx) => {
                    part.pos = (part.pos + speed) % totalDist;
                    const coords = getCoords(part.pos);
                    p.ellipse(coords.x, coords.y, 5, 5);
                    
                    // Draw arrowhead for every few particles
                    if (idx % 5 === 0) {
                        p.push();
                        p.translate(coords.x, coords.y);
                        // Simple rotation based on which side of the rectangle we are on
                        if (part.pos < rw) p.rotate(0);
                        else if (part.pos < rw + rh) p.rotate(p.HALF_PI);
                        else if (part.pos < 2*rw + rh) p.rotate(p.PI);
                        else p.rotate(-p.HALF_PI);
                        
                        p.fill(255, 255, 0);
                        p.triangle(0, -4, 0, 4, 8, 0);
                        p.pop();
                    }
                });

                // Case 2: X-Ray Mode - Highlight Electron Flow (Blue) and Labels
                if (showXRay) {
                    p.fill(0, 150, 255, 200); // Blue for Electrons
                    electronParticles.forEach(part => {
                        // Electrons move opposite to current
                        part.pos = (part.pos - speed + totalDist) % totalDist;
                        const coords = getCoords(part.pos);
                        p.ellipse(coords.x, coords.y, 4, 4);
                    });

                    // Legend Labels
                    p.textSize(10);
                    p.textAlign(p.LEFT);
                    p.fill(255, 255, 0); p.text("→ Chiều dòng điện I (Quy ước)", 20, 20);
                    p.fill(0, 150, 255); p.text("← Chuyển động do LỰC ĐIỆN (Electron)", 20, 35);
                    p.noStroke();
                    p.fill(255, 255, 255, 150);
                    p.text("↑ Chuyển động do LỰC LẠ (Bên trong)", 20, 50);
                }

                // --- 5. Short Circuit Visuals ---
                if (isShort) {
                    if (p.frameCount % 2 === 0) {
                        smokeParticles.push({
                            x: srcX + p.random(-15, 15),
                            y: srcY + p.random(-20, 20),
                            vx: p.random(-1, 1),
                            vy: p.random(-2, -4),
                            alpha: 255
                        });
                    }
                }
                p.noStroke();
                smokeParticles.forEach((sm, idx) => {
                    p.fill(200, sm.alpha);
                    p.ellipse(sm.x, sm.y, 8, 8);
                    sm.x += sm.vx; sm.y += sm.vy; sm.alpha -= 5;
                    if (sm.alpha <= 0) smokeParticles.splice(idx, 1);
                });
            };

            p.windowResized = () => {
                p.resizeCanvas(canvasRef.current.offsetWidth, canvasRef.current.offsetHeight);
            };
        };

        p5Instance.current = new p5(sketch);
        return () => p5Instance.current.remove();
    }, [current, externalR, showXRay]);

    return (
        <div className="flex flex-col h-screen overflow-hidden p-6 gap-6 lg:flex-row">
            
            {/* LEFT: SIMULATION BOX */}
            <div className={`glass-panel flex-[1.2] rounded-3xl p-6 relative flex flex-col overflow-hidden transition-all duration-500 ${isShortCircuit ? 'short-circuit-alert' : ''}`}>
                <div className="z-10 flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-tech font-bold uppercase tracking-widest text-[#00f2ff]">Mô Phỏng Thực Tế</h2>
                        <div className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-[#00f2ff] animate-pulse"></div>
                             LIVE SIMULATION FEED
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setShowXRay(!showXRay)}
                            className={`px-4 py-2 rounded-xl text-xs font-tech font-bold transition-all border ${showXRay ? 'bg-[#00f2ff] text-slate-900 border-[#00f2ff]' : 'bg-white/5 text-[#00f2ff] border-[#00f2ff]/30 hover:bg-[#00f2ff]/10'}`}
                        >
                            {showXRay ? 'DỪNG X-RAY' : 'X-RAY VIEW'}
                        </button>
                        {isShortCircuit && (
                            <div className="bg-red-500/20 text-red-500 border border-red-500/50 px-4 py-2 rounded-xl text-xs font-tech animate-bounce font-bold">
                                ⚠️ DANGER: SHORT CIRCUIT!
                            </div>
                        )}
                    </div>
                </div>

                <div id="circuit-container" ref={canvasRef} className="flex-1 rounded-2xl bg-black/30 border border-white/5 cursor-crosshair"></div>

                {/* Meter overlay */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    <div className="bg-black/50 border border-white/10 p-3 rounded-2xl flex flex-col items-center">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Ampe kế (I)</span>
                        <span className="text-xl font-tech text-yellow-400">{(current).toFixed(3)} A</span>
                    </div>
                    <div className="bg-black/50 border border-white/10 p-3 rounded-2xl flex flex-col items-center">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Vôn kế (U)</span>
                        <span className="text-xl font-tech text-[#00f2ff]">{(terminalV).toFixed(2)} V</span>
                    </div>
                    <div className="bg-black/50 border border-white/10 p-3 rounded-2xl flex flex-col items-center">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Công suất (P)</span>
                        <span className="text-xl font-tech text-purple-400">{(power).toFixed(2)} W</span>
                    </div>
                    <div className="bg-black/50 border border-white/10 p-3 rounded-2xl flex flex-col items-center">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Hiệu suất (H)</span>
                        <span className="text-xl font-tech text-emerald-400">{(efficiency).toFixed(1)}%</span>
                    </div>
                </div>
            </div>

            {/* RIGHT: CONTROL & ANALYTICS */}
            <div className="flex-1 flex flex-col gap-6">
                
                {/* SETTINGS PANEL */}
                <div className="glass-panel rounded-3xl p-6 flex flex-col gap-6">
                    <h3 className="text-lg font-tech font-bold flex items-center gap-2">
                         <i data-lucide="settings-2" className="w-5 h-5 text-[#00f2ff]"></i> THIẾT LẬP HÀM SỐ
                    </h3>

                    {/* EMF Slider */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-mono text-slate-400 uppercase">Suất điện động (ξ)</label>
                            <span className="text-sm font-tech text-[#00f2ff]">{emf.toFixed(1)} V</span>
                        </div>
                        <input type="range" min="0" max="24" step="0.5" value={emf} onChange={(e) => setEmf(parseFloat(e.target.value))} className="w-full" />
                    </div>

                    {/* Internal R Slider */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-mono text-slate-400 uppercase">Điện trở trong (r)</label>
                            <span className="text-sm font-tech text-[#00f2ff]">{internalR.toFixed(1)} Ω</span>
                        </div>
                        <input type="range" min="0.1" max="5" step="0.1" value={internalR} onChange={(e) => setInternalR(parseFloat(e.target.value))} className="w-full" />
                    </div>

                    {/* External R Slider */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-mono text-slate-400 uppercase">Biến trở ngoài (R)</label>
                            <span className={`text-sm font-tech ${isShortCircuit ? 'text-red-500' : 'text-yellow-400'}`}>
                                {externalR.toFixed(1)} Ω {isShortCircuit && "(SHORTED)"}
                            </span>
                        </div>
                        <input type="range" min="0" max="50" step="0.5" value={externalR} onChange={(e) => setExternalR(parseFloat(e.target.value))} 
                            className={`w-full ${isShortCircuit ? 'accent-red-500' : ''}`} />
                    </div>

                    {/* Formula Hint */}
                    <div className="mt-2 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="text-[10px] font-mono text-slate-500 mb-2 uppercase text-center">Theoretical Mathematical Model</div>
                        <div className="flex justify-around items-center text-sm font-tech text-slate-300">
                             <div className="flex flex-col items-center">
                                 <span>I = ξ / (R + r)</span>
                             </div>
                             <div className="w-px h-8 bg-white/10"></div>
                             <div className="flex flex-col items-center">
                                 <span>P = I²R = ξ²R / (R + r)²</span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* GRAPH PANEL */}
                <div className="glass-panel flex-1 rounded-3xl p-6 relative overflow-hidden flex flex-col min-h-[300px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-tech font-bold uppercase tracking-wider text-slate-300">Phân tích Đặc tuyến Cực trị</h3>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-1 text-[10px] font-mono text-yellow-400 opacity-80"><div className="w-2 h-0.5 bg-yellow-400"></div> P(R)</div>
                            <div className="flex items-center gap-1 text-[10px] font-mono text-[#00f2ff] opacity-80"><div className="w-2 h-0.5 bg-[#00f2ff] border-dashed border-t"></div> H(R)</div>
                        </div>
                    </div>
                    <div id="chart-container" ref={chartRef} className="flex-1"></div>
                    
                    <div className="absolute bottom-4 left-6 text-[10px] font-mono text-slate-500 uppercase flex gap-4">
                        <span className="flex items-center gap-1"><i data-lucide="info" className="w-3 h-3"></i> P đạt Max khi R = r = {internalR}Ω</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

// Mount the App
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(<PhysicsSim />);
