/**
 * useMathKeyboard — Hook quản lý math keyboard insertion
 * Dùng chung cho App.jsx, ContestWorkspace, ProblemWorkspace
 */
import { useState, useCallback } from 'react';

export function useMathKeyboard(textareaRef, setText) {
  const [showMathKeyboard, setShowMathKeyboard] = useState(false);

  const insertMath = useCallback((latex, cursorOffset) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;

    const before = currentText.substring(0, start);
    const after = currentText.substring(end);
    const newText = before + latex + after;

    setText(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + (cursorOffset !== undefined ? cursorOffset : latex.length);
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [textareaRef, setText]);

  const toggleKeyboard = useCallback(() => {
    setShowMathKeyboard(prev => !prev);
  }, []);

  // Danh sách buttons toán học chuẩn
  const MATH_BUTTONS = [
    { label: 'Công thức', latex: '$  $', offset: 2, display: '$$' },
    { label: 'Phân số', latex: '\\frac{}{} ', offset: 6, display: 'a/b' },
    { label: 'Căn bậc 2', latex: '\\sqrt{} ', offset: 6, display: '√' },
    { label: 'Số mũ', latex: '^{} ', offset: 2, display: 'x²' },
    { label: 'Chỉ số dưới', latex: '_{} ', offset: 2, display: 'x₂' },
    { label: 'Góc', latex: '\\widehat{} ', offset: 9, display: '∠' },
    { label: 'Độ', latex: '^\\circ ', display: '°' },
    { label: 'Vector', latex: '\\vec{} ', offset: 5, display: 'v⃗' },
    { label: 'Vuông góc', latex: '\\perp ', display: '⊥' },
    { label: 'Song song', latex: '\\parallel ', display: '∥' },
    { label: 'Tam giác', latex: '\\triangle ', display: '△' },
    { label: 'Pi', latex: '\\pi ', display: 'π' },
    { label: 'Alpha', latex: '\\alpha ', display: 'α' },
    { label: 'Beta', latex: '\\beta ', display: 'β' },
    { label: 'Sigma', latex: '\\sum_{i=1}^{n} ', offset: 7, display: 'Σ' },
    { label: 'Tích phân', latex: '\\int_{a}^{b} ', offset: 7, display: '∫' },
  ];

  return {
    showMathKeyboard,
    setShowMathKeyboard,
    toggleKeyboard,
    insertMath,
    MATH_BUTTONS,
  };
}
