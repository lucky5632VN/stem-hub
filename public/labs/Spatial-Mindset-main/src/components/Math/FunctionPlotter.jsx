import React from 'react';
import { Mafs, Coordinates, Plot } from 'mafs';
import 'mafs/core.css'; // Dành cho các style cốt lõi
import 'mafs/font.css'; // Dành cho font chữ công thức toán học

/**
 * Component FunctionPlotter hiển thị đồ thị hàm số 2D
 * @param {string} expression - Chuỗi biểu thức toán học (Vd: "sin(x)", "x**2")
 * @param {Array} domain - Phạm vi hiển thị trục tọa độ [min, max] (Mặc định: [-10, 10])
 * @param {string} color - Màu sắc của đồ thị (Mặc định: Xanh dương)
 */
export default function FunctionPlotter({ 
  expression = "sin(x)", 
  domain = [-10, 10],
  color = "#22d3ee" 
}) {
  // Chuyển đổi chuỗi Python-style sang Javascript-style đơn giản
  const getFunction = (expr) => {
    try {
      const jsExpr = expr
        .replace(/\*\*/g, '^') // Tạm thời để xử lý tiếp bên dưới
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/exp/g, 'Math.exp')
        .replace(/log/g, 'Math.log')
        .replace(/sqrt/g, 'Math.sqrt')
        .replace(/pi/g, 'Math.PI')
        .replace(/\^/g, '**'); // Chuyển ngược lại về lũy thừa JS

      // eslint-disable-next-line no-new-func
      return new Function('x', `try { return ${jsExpr}; } catch(e) { return 0; }`);
    } catch (e) {
      return (x) => 0;
    }
  };

  const f = getFunction(expression);

  return (
    <div className="w-full h-full bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 p-2 relative">
      <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg border border-white/5 text-[10px] font-mono text-cyan-400">
        f(x) = {expression}
      </div>
      <Mafs viewBox={{ x: domain, y: domain }} preserveAspectRatio={false}>
        <Coordinates.Cartesian />
        <Plot.OfX y={f} color={color} />
      </Mafs>
    </div>
  );
}
