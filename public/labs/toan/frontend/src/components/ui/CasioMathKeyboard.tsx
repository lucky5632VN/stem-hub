import React, { useState } from 'react';
import { Calculator, X, Delete } from 'lucide-react';

interface CasioMathKeyboardProps {
  onInsert: (value: string) => void;
  onDelete?: () => void;
  onClear?: () => void;
  onClose?: () => void;
}

const CasioMathKeyboard: React.FC<CasioMathKeyboardProps> = ({
  onInsert,
  onDelete,
  onClear,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'calc' | 'algebra' | 'symbols'>('calc');

  // Nhóm phím chức năng toán học
  const functionKeys = [
    { label: 'f(x)', insert: 'f(x) = ' },
    { label: 'x²', insert: '^2' },
    { label: 'xⁿ', insert: '^' },
    { label: '√x', insert: 'sqrt(' },
    { label: '∛x', insert: 'cbrt(' },
    { label: 'a/b', insert: ' / ' },
    { label: 'sin', insert: 'sin(' },
    { label: 'cos', insert: 'cos(' },
    { label: 'tan', insert: 'tan(' },
    { label: 'ln', insert: 'ln(' },
    { label: 'log', insert: 'log(' },
    { label: '|x|', insert: 'abs(' },
    { label: 'eˣ', insert: 'exp(' },
    { label: 'π', insert: 'pi' },
    { label: 'e', insert: 'e' },
  ];

  const symbolKeys = [
    { label: '∫ dx', insert: 'int(' },
    { label: 'd/dx', insert: 'diff(' },
    { label: 'lim', insert: 'lim(' },
    { label: '∞', insert: 'infinity' },
    { label: 'θ', insert: 'theta' },
    { label: 'α', insert: 'alpha' },
    { label: '≤', insert: ' <= ' },
    { label: '≥', insert: ' >= ' },
    { label: '≠', insert: ' != ' },
    { label: '±', insert: '+-' },
    { label: '(', insert: '(' },
    { label: ')', insert: ')' },
  ];

  const numpad = [
    ['7', '8', '9', '+', 'x'],
    ['4', '5', '6', '-', 'y'],
    ['1', '2', '3', '*', 'z'],
    ['0', '.', '=', '/', '^'],
  ];

  return (
    <div
      style={{
        background: '#161b22',
        border: '1px solid #30363d',
        borderRadius: '12px',
        padding: '0.75rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        width: '100%',
        maxWidth: '380px',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        zIndex: 50,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: '0.4rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#58a6ff', fontSize: '0.78rem', fontWeight: 700 }}>
          <Calculator size={15} />
          <span>Bàn Phím Toán Học CASIO FX</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{ fontSize: '0.65rem', background: 'rgba(88,166,255,0.15)', color: '#58a6ff', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
            MathLive Engine
          </span>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#8b949e',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.3rem', background: 'rgba(0,0,0,0.3)', padding: '0.2rem', borderRadius: '6px' }}>
        <button
          onClick={() => setActiveTab('calc')}
          style={{
            flex: 1, padding: '0.3rem', fontSize: '0.7rem', borderRadius: '4px', border: 'none', cursor: 'pointer',
            background: activeTab === 'calc' ? '#238636' : 'transparent',
            color: activeTab === 'calc' ? '#fff' : '#8b949e', fontWeight: 600
          }}
        >
          Số & Cơ Bản
        </button>
        <button
          onClick={() => setActiveTab('algebra')}
          style={{
            flex: 1, padding: '0.3rem', fontSize: '0.7rem', borderRadius: '4px', border: 'none', cursor: 'pointer',
            background: activeTab === 'algebra' ? '#238636' : 'transparent',
            color: activeTab === 'algebra' ? '#fff' : '#8b949e', fontWeight: 600
          }}
        >
          Lượng Giác & Mũ
        </button>
        <button
          onClick={() => setActiveTab('symbols')}
          style={{
            flex: 1, padding: '0.3rem', fontSize: '0.7rem', borderRadius: '4px', border: 'none', cursor: 'pointer',
            background: activeTab === 'symbols' ? '#238636' : 'transparent',
            color: activeTab === 'symbols' ? '#fff' : '#8b949e', fontWeight: 600
          }}
        >
          Ký Hiệu & Tích Phân
        </button>
      </div>

      {/* Function Rows */}
      {activeTab === 'algebra' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.3rem' }}>
          {functionKeys.map((k) => (
            <button
              key={k.label}
              onClick={() => onInsert(k.insert)}
              style={{
                padding: '0.45rem 0.2rem',
                borderRadius: '6px',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                color: '#38bdf8',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.1s',
              }}
            >
              {k.label}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'symbols' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.3rem' }}>
          {symbolKeys.map((k) => (
            <button
              key={k.label}
              onClick={() => onInsert(k.insert)}
              style={{
                padding: '0.45rem 0.2rem',
                borderRadius: '6px',
                background: 'rgba(163, 113, 247, 0.1)',
                border: '1px solid rgba(163, 113, 247, 0.2)',
                color: '#c084fc',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.1s',
              }}
            >
              {k.label}
            </button>
          ))}
        </div>
      )}

      {/* Numpad & Main grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {numpad.map((row, rIdx) => (
          <div key={rIdx} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.3rem' }}>
            {row.map((btn) => (
              <button
                key={btn}
                onClick={() => onInsert(btn)}
                style={{
                  padding: '0.5rem 0.2rem',
                  borderRadius: '6px',
                  background: isNaN(Number(btn)) ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: isNaN(Number(btn)) ? '#58a6ff' : '#f0f6fc',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {btn}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom control row */}
      <div style={{ display: 'flex', gap: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.4rem' }}>
        <button
          onClick={onDelete}
          style={{
            flex: 1, padding: '0.45rem', borderRadius: '6px',
            background: 'rgba(248, 81, 73, 0.15)', border: '1px solid rgba(248, 81, 73, 0.3)',
            color: '#f85149', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
          }}
        >
          <Delete size={14} /> Xóa lùi
        </button>
        <button
          onClick={onClear}
          style={{
            flex: 1, padding: '0.45rem', borderRadius: '6px',
            background: 'rgba(248, 81, 73, 0.25)', border: '1px solid rgba(248, 81, 73, 0.4)',
            color: '#ff7b72', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
          }}
        >
          AC (Xóa hết)
        </button>
      </div>
    </div>
  );
};

export default CasioMathKeyboard;
