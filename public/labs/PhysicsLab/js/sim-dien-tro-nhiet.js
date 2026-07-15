// sim-dien-tro-nhiet.js - Phân tích đặc tuyến NTC và PTC

const ntcSlider = document.getElementById('ntc-t-slider');
const ntcTOut = document.getElementById('ntc-t-out');
const ntcROut = document.getElementById('ntc-r-out');

const ptcSlider = document.getElementById('ptc-t-slider');
const ptcTOut = document.getElementById('ptc-t-out');
const ptcROut = document.getElementById('ptc-r-out');
const ptcOutputBox = document.getElementById('ptc-output-box');

// NTC Model Parameters (10k NTC)
const R0_NTC = 10000.0;
const T0_K = 298.15; // 25°C in Kelvin
const BETA = 3950.0;

function calcNTC(celsius) {
    const T_K = celsius + 273.15;
    const R = R0_NTC * Math.exp(BETA * (1.0 / T_K - 1.0 / T0_K));
    return R;
}

// PTC Model Parameters (Switching PTC: BaTiO3)
const R0_PTC = 100.0;
const Tc = 100.0; // Curie temperature 100 °C
const ALPHA_0 = -0.002; // Slight NTC behavior before Tc
const ALPHA_1 = 0.25;   // Logarithmic catastrophic explosion after Tc

function calcPTC(celsius) {
    if (celsius <= Tc) {
        return R0_PTC * Math.exp(ALPHA_0 * (celsius - 25));
    } else {
        const R_Tc = R0_PTC * Math.exp(ALPHA_0 * (Tc - 25));
        return R_Tc * Math.exp(ALPHA_1 * (celsius - Tc));
    }
}

// Generate Static Curve Data
const labels = [];
const dataNTC = [];
const dataPTC = [];

for (let t = 0; t <= 150; t += 1) {
    labels.push(t);
    dataNTC.push(calcNTC(t));
    dataPTC.push(calcPTC(t));
}

// Chart.js Configuration
Chart.defaults.color = 'rgba(255, 255, 255, 0.5)';
Chart.defaults.font.family = "'JetBrains Mono', monospace";

const ctx = document.getElementById('thermistorChart').getContext('2d');
const thermistorChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: labels,
        datasets: [
            {
                label: 'NTC Resistance (Ω)',
                data: dataNTC,
                borderColor: '#e74c3c', // Red NTC
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 0,
                pointHitRadius: 10,
                tension: 0.1,
                yAxisID: 'y'
            },
            {
                label: 'PTC Resistance (Ω)',
                data: dataPTC,
                borderColor: '#3498db', // Blue PTC
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 0,
                pointHitRadius: 10,
                tension: 0.1,
                yAxisID: 'y1'
            },
            // Dynamic Markers
            {
                type: 'scatter',
                label: 'NTC Current',
                data: [{ x: 25, y: calcNTC(25) }],
                backgroundColor: '#e74c3c',
                pointRadius: 6,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                yAxisID: 'y',
                showLine: false
            },
            {
                type: 'scatter',
                label: 'PTC Current',
                data: [{ x: 25, y: calcPTC(25) }],
                backgroundColor: '#3498db',
                pointRadius: 6,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                yAxisID: 'y1',
                showLine: false
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(10, 15, 25, 0.9)',
                titleColor: '#00E5FF',
                bodyFont: { size: 14, family: "'Orbitron'" },
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                callbacks: {
                    title: (ctx) => `Temp: ${ctx[0].label}°C`,
                    label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.y ? ctx.raw.y.toFixed(1) : ctx.raw.toFixed(1)} Ω`
                }
            }
        },
        scales: {
            x: {
                title: { display: true, text: 'Temperature (°C)', color: '#fff' },
                grid: { color: 'rgba(255, 255, 255, 0.05)' }
            },
            y: {
                type: 'logarithmic',
                position: 'left',
                title: { display: true, text: 'R NTC (Ω) - Log Scale', color: '#e74c3c' },
                grid: { color: 'rgba(231, 76, 60, 0.15)' },
                ticks: { color: '#e74c3c' },
                min: 10, max: 50000
            },
            y1: {
                type: 'logarithmic',
                position: 'right',
                title: { display: true, text: 'R PTC (Ω) - Log Scale', color: '#3498db' },
                grid: { drawOnChartArea: false }, // Prevent grid overlap
                ticks: { color: '#3498db' },
                min: 10, max: 10000000
            }
        }
    }
});

// Sync UI and Chart
function formatResistance(r) {
    if (r >= 1000000) return (r / 1000000).toFixed(2) + ' M';
    if (r >= 10000) return (r / 1000).toFixed(1) + ' k';
    if (r >= 1000) return (r / 1000).toFixed(2) + ' k';
    return r.toFixed(1) + ' ';
}

// Event Listeners for NTC
ntcSlider.addEventListener('input', (e) => {
    const t = parseFloat(e.target.value);
    const r = calcNTC(t);
    ntcTOut.innerText = t;
    ntcROut.innerText = formatResistance(r);
    
    // Update Chart Marker
    thermistorChart.data.datasets[2].data = [{ x: t, y: r }];
    thermistorChart.update('none'); // Update without full animation
});

// Event Listeners for PTC
ptcSlider.addEventListener('input', (e) => {
    const t = parseFloat(e.target.value);
    const r = calcPTC(t);
    ptcTOut.innerText = t;
    ptcROut.innerText = formatResistance(r);
    
    // Danger HUD effect if passed Curie Temp
    if (t >= Tc) {
        ptcOutputBox.classList.add('bg-[#3498db]/20', 'shadow-[0_0_15px_rgba(52,152,219,0.5)]');
        ptcOutputBox.classList.remove('bg-black/40');
    } else {
        ptcOutputBox.classList.remove('bg-[#3498db]/20', 'shadow-[0_0_15px_rgba(52,152,219,0.5)]');
        ptcOutputBox.classList.add('bg-black/40');
    }
    
    // Update Chart Marker
    thermistorChart.data.datasets[3].data = [{ x: t, y: r }];
    thermistorChart.update('none');
});

// Initialize HUD display
ntcROut.innerText = formatResistance(calcNTC(25));
ptcROut.innerText = formatResistance(calcPTC(25));
