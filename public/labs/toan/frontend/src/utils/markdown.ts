import katex from 'katex';

/**
 * Safe KaTeX renderer wrapper.
 */
function renderKaTeXSafe(latex: string, displayMode = false): string {
  try {
    let cleanLatex = latex.trim();
    // 1. Chuẩn hóa backslash kép trong LaTeX: \\sqrt -> \sqrt, \\frac -> \frac
    cleanLatex = cleanLatex.replace(/\\{2,}([a-zA-Z]+)/g, '\\$1');
    // 2. Normalize newlines in environments
    cleanLatex = cleanLatex.replace(/\\\\\s*\\n/g, '\\\\ ');
    // 3. Chuẩn hóa \sqrt thiếu ngoặc nhọn: \sqrt 3 -> \sqrt{3}
    cleanLatex = cleanLatex.replace(/\\sqrt\s*(\d+)/g, '\\sqrt{$1}');
    cleanLatex = cleanLatex.replace(/\\sqrt\s*([a-zA-Z])(?![a-zA-Z{])/g, '\\sqrt{$1}');
    
    let rendered = katex.renderToString(cleanLatex, {
      displayMode,
      throwOnError: false,
      strict: 'ignore',
      output: 'html'
    });
    // CRITICAL: Strip any newlines in rendered KaTeX HTML. KaTeX generates radicals using SVG <path d="...">
    // containing embedded newlines, which would otherwise get corrupted by Markdown paragraph/newline replacers!
    rendered = rendered.replace(/\r?\n/g, ' ');

    if (displayMode) {
      return `<div class="katex-display-scroll" style="overflow-x:auto;overflow-y:hidden;max-width:100%;margin:0.35rem 0;padding:2px 0;text-align:left;">${rendered}</div>`;
    }
    return rendered;
  } catch {
    // Fallback: Return raw string wrapped in code or span
    return `<span class="katex-fallback" style="font-family:serif;font-style:italic;">${latex}</span>`;
  }
}

/**
 * Tự động phát hiện và chuyển đổi pseudo-LaTeX (thiếu backslash hoặc thiếu ngoặc nhọn)
 * thành LaTeX chuẩn mực hoặc ký hiệu toán học tự nhiên đẹp mắt.
 */
export function repairPseudoLatex(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let s = text;

  // 1. Dọn dẹp ký tự Form Feed / Backspace nếu có từ JSON parse
  s = s.replace(/\x0c/g, '\\f').replace(/\x08/g, '\\b');

  // 2. Gộp các dòng bị ngắt vụn công thức đứng một mình (dấu = hoặc \cdot)
  s = s.replace(/\n\s*(\\?cdot|·)\s*\n/g, ' \\cdot ');
  s = s.replace(/\n\s*(\\?cdot|·)\s*/g, ' \\cdot ');
  s = s.replace(/\s*(\\?cdot|·)\s*\n/g, ' \\cdot ');
  s = s.replace(/=\s*\n\s*/g, ' = ');
  s = s.replace(/\n\s*=\s*/g, ' = ');

  // 3. Chuẩn hóa backslash kép/ba thành 1 backslash trước các lệnh LaTeX: \\sqrt -> \sqrt, \\frac -> \frac
  s = s.replace(/\\{2,}([a-zA-Z]+)/g, '\\$1');

  // 4. Chuẩn hóa Delta
  s = s.replace(/(?<!\\)\bDelta([A-Z]+)/g, '\\Delta $1');
  s = s.replace(/(?<!\\)\bDelta\b/g, '\\Delta');

  // 5. Chuẩn hóa tiếng Việt cho căn: "căn bậc hai của X", "căn(X)", "căn X", "a căn X"
  s = s.replace(/(?:căn\s+bậc\s+(?:hai|2)\s+của)\s*\(([^)]+)\)/gi, '\\sqrt{$1}');
  s = s.replace(/(?:căn\s+bậc\s+(?:hai|2)\s+của)\s*([a-zA-Z0-9^]+)/gi, '\\sqrt{$1}');
  s = s.replace(/\bcăn\s*\(([^)]+)\)/gi, '\\sqrt{$1}');
  s = s.replace(/\bcăn\s*\{([^}]+)\}/gi, '\\sqrt{$1}');
  s = s.replace(/\bcăn\s*(\d+)/gi, '\\sqrt{$1}');
  s = s.replace(/\bcăn\s+(?!bậc\b)([a-zA-Z](?:\^[0-9]+)?)\b/gi, '\\sqrt{$1}');

  // 6. Chuẩn hóa ký tự Unicode '√': "√(X)" -> \sqrt{X}, "√X" -> \sqrt{X}
  s = s.replace(/√\s*\(([^)]+)\)/g, '\\sqrt{$1}');
  s = s.replace(/√\s*\{([^}]+)\}/g, '\\sqrt{$1}');
  s = s.replace(/√\s*(\d+)/g, '\\sqrt{$1}');
  s = s.replace(/√\s*([a-zA-Z](?:\^[0-9]+)?)\b/g, '\\sqrt{$1}');

  // 7. Chuẩn hóa pseudo-sqrt:
  // "sqrt(X)" -> \sqrt{X}
  s = s.replace(/(?<!\\)\bsqrt\s*\(([^)]+)\)/gi, '\\sqrt{$1}');
  // "sqrt AA'^2 - AG^2" -> "\sqrt{AA'^2 - AG^2}"
  s = s.replace(/(?<!\\)\bsqrt\s+([A-Za-z0-9'^]+(?:\s*[-+]\s*[A-Za-z0-9'^]+)+)\b/g, '\\sqrt{$1}');
  // "sqrt a^2 - \frac{a^2}{3}" -> "\sqrt{a^2 - \frac{a^2}{3}}"
  s = s.replace(/(?<!\\)\bsqrt\s+([a-zA-Z0-9^]+(?:\s*[-+]\s*\\frac\{[^}]+\}\{[^}]+\}))/g, '\\sqrt{$1}');
  s = s.replace(/(?<!\\)\bsqrt\s*(\d+)/g, '\\sqrt{$1}');
  s = s.replace(/(?<!\\)\bsqrt\{([^{}]+)\}/g, '\\sqrt{$1}');

  // 8. Nếu \sqrt thiếu ngoặc nhọn: "\sqrt 3" -> "\sqrt{3}", "\sqrt 2" -> "\sqrt{2}"
  s = s.replace(/\\sqrt\s*(\d+)/g, '\\sqrt{$1}');
  s = s.replace(/\\sqrt\s*([a-zA-Z])(?![a-zA-Z{])/g, '\\sqrt{$1}');

  // 9. Sửa thiếu gạch chéo \frac{ và \sqrt{ và \cdot
  s = s.replace(/(?<!\\)\bfrac\{/g, '\\frac{');
  s = s.replace(/(?<!\\)\bsqrt\{/g, '\\sqrt{');
  s = s.replace(/(?<!\\)\bcdot\b/g, '\\cdot');

  // 10. Chuẩn hóa pseudo-fraction: "frac a^2 sqrt 3 4" -> "\frac{a^2\sqrt{3}}{4}"
  s = s.replace(/\b(?:\\?frac)\s+([a-zA-Z0-9^]+(?:\s*(?:\\?sqrt|√|căn)\s*[0-9a-zA-Z^]+)?)\s+(\d+)\b/gi, (_match, num, den) => {
    const cleanNum = num
      .replace(/(?:\\?sqrt|√|căn)\s*(\d+)/gi, '\\sqrt{$1}')
      .replace(/(?<!\\)sqrt/g, '\\sqrt');
    return `\\frac{${cleanNum}}{${den}}`;
  });

  // 11. Chuẩn hóa pseudo-fraction cơ bản: "frac a^2 3" -> "\frac{a^2}{3}"
  s = s.replace(/\b(?:\\?frac)\s+([a-zA-Z0-9^]+)\s+([a-zA-Z0-9^]+)\b/g, (_match, num, den) => {
    return `\\frac{${num}}{${den}}`;
  });

  // 12. Bọc các dòng đẳng thức độc lập thành $$...$$ nếu chưa có bọc
  s = s.replace(/^((?:[A-Za-z0-9'_]+|V|S|A'G|h|R)\s*=\s*[\s\S]+?)$/gm, (line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('$') || trimmed.startsWith('$$') || trimmed.startsWith('<') || trimmed.startsWith('#') || trimmed.startsWith('*') || trimmed.startsWith('-')) {
      return line;
    }
    if (/(\\frac|\\sqrt|\\cdot|·|\^|=|\\Delta|Δ)/.test(trimmed)) {
      return `$$${trimmed}$$`;
    }
    return line;
  });

  // 13. Tự động bọc các biểu thức toán học rời rạc có \sqrt{...} hoặc \frac{...}{...} vào $...$ nếu chưa bọc
  const protectedMath: string[] = [];
  s = s.replace(/\$\$([\s\S]+?)\$\$/g, (m) => {
    protectedMath.push(m);
    return `__MATH_PROT_${protectedMath.length - 1}__`;
  });
  s = s.replace(/(?<!\$)\$([^$\n\r]+?)\$(?!\$)/g, (m) => {
    protectedMath.push(m);
    return `__MATH_PROT_${protectedMath.length - 1}__`;
  });

  // Bọc các biểu thức chứa \sqrt{...} hoặc \frac{...}{...} chưa có $
  s = s.replace(/(?:[a-zA-Z0-9'_^]+\s*=\s*)?(?:[a-zA-Z0-9'_^.]*\\(?:sqrt|frac)\{(?:[^{}]+|\{[^{}]*\})*\}(?:\{[^{}]*\})*[a-zA-Z0-9_{}^\\/.+\-*=()]*)+/g, (match) => {
    return `$${match.trim()}$`;
  });

  // Phục hồi lại các khối math đã bảo vệ (dùng callback function để tránh bug $$ của JS)
  protectedMath.forEach((m, idx) => {
    s = s.replace(`__MATH_PROT_${idx}__`, () => m);
  });

  return s;
}

/**
 * Tách và render trước các biểu thức toán học qua KaTeX an toàn, trả về văn bản chứa token và map HTML.
 */
export function extractAndRenderMath(text: string): { textWithTokens: string; renderedMap: Map<string, string> } {
  if (!text) return { textWithTokens: '', renderedMap: new Map() };

  let formatted = repairPseudoLatex(text);

  // Tự động đóng các khối math chưa khép kín (hỗ trợ hiển thị mượt mà trong lúc AI gõ chữ từ từ)
  const doubleDollarCount = (formatted.match(/\$\$/g) || []).length;
  if (doubleDollarCount % 2 !== 0) {
    formatted += '$$';
  }
  const singleDollarCount = (formatted.replace(/\$\$[\s\S]*?\$\$/g, '').match(/(?<!\$)\$(?!\$)/g) || []).length;
  if (singleDollarCount % 2 !== 0) {
    formatted += '$';
  }

  // Map to store rendered KaTeX HTML strings
  const renderedMap = new Map<string, string>();
  let tokenCounter = 0;

  const createToken = (latex: string, displayMode: boolean): string => {
    if (!latex || !latex.trim()) return '';
    const token = `__KATEX_MATH_${Date.now()}_${tokenCounter++}__`;
    const renderedHtml = renderKaTeXSafe(latex, displayMode);
    renderedMap.set(token, renderedHtml);
    return token;
  };

  // 1. Process Display Math: $$ ... $$ and \[ ... \] FIRST
  formatted = formatted.replace(/\$\$([\s\S]+?)\$\$/g, (_match, p1) => createToken(p1, true));
  formatted = formatted.replace(/\\\[([\s\S]+?)\\\]/g, (_match, p1) => createToken(p1, true));

  // 2. Process Standalone LaTeX Environments NOT already inside $$...$$
  const envNames = ['cases', 'aligned', 'matrix', 'pmatrix', 'bmatrix', 'vmatrix', 'gather', 'equation'];
  envNames.forEach(env => {
    const regex = new RegExp(`\\\\begin\\{${env}\\}[\\s\\S]*?\\\\end\\{${env}\\}`, 'g');
    formatted = formatted.replace(regex, (match) => createToken(match, true));
  });

  // 3. Process Inline Math: $ ... $ and \( ... \)
  formatted = formatted.replace(/\\\(([\s\S]+?)\\\)/g, (_match, p1) => createToken(p1, false));
  formatted = formatted.replace(/(?<!\$)\$([^$\n\r]+?)\$(?!\$)/g, (_match, p1) => createToken(p1, false));

  // 4. Translate any raw LaTeX symbols left outside math blocks to clean Unicode
  const rawSymbolMap: [RegExp, string][] = [
    [/\\perp\b/g, '⊥'],
    [/\\parallel\b/g, '∥'],
    [/\\Rightarrow\b/g, '⇒'],
    [/\\Leftrightarrow\b/g, '⇔'],
    [/\\rightarrow\b|\\to\b/g, '→'],
    [/\\leftarrow\b/g, '←'],
    [/\\times\b/g, '×'],
    [/\\cdot\b/g, '·'],
    [/\\approx\b/g, '≈'],
    [/\\Delta\b/g, 'Δ'],
    [/\\pi\b/g, 'π'],
    [/\\alpha\b/g, 'α'],
    [/\\beta\b/g, 'β'],
    [/\\gamma\b/g, 'γ'],
    [/\\theta\b/g, 'θ'],
    [/\\le\b|\\leq\b/g, '≤'],
    [/\\ge\b|\\geq\b/g, '≥'],
    [/\\neq\b/g, '≠'],
    [/\\subset\b/g, '⊂'],
    [/\\supset\b/g, '⊃'],
    [/\\cap\b/g, '∩'],
    [/\\cup\b/g, '∪'],
    [/\\in\b/g, '∈'],
    [/\\notin\b/g, '∉'],
    [/\\widehat\{([^{}]+)\}/g, '∠$1'],
    [/\\angle\b/g, '∠'],
    [/\\triangle\b/g, '△'],
    [/\\sqrt\{([^{}]+)\}/g, '√($1)'],
    [/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1 / $2)'],
    [/\\text\{\s*([^}]+?)\s*\}/g, '$1']
  ];

  rawSymbolMap.forEach(([pattern, replacement]) => {
    formatted = formatted.replace(pattern, replacement);
  });

  return { textWithTokens: formatted, renderedMap };
}

/**
 * Format LaTeX and math expressions to clean HTML using KaTeX.
 */
export function cleanLatexMath(text: string): string {
  const { textWithTokens, renderedMap } = extractAndRenderMath(text);
  let result = textWithTokens;
  renderedMap.forEach((html, token) => {
    result = result.split(token).join(html);
  });
  return result;
}

/**
 * Markdown → HTML converter with full KaTeX math support.
 */
export function parseMarkdown(text: string): string {
  if (!text) return '';

  // Step 1: Extract math & pre-render KaTeX safely (holding tokens)
  const { textWithTokens, renderedMap } = extractAndRenderMath(text);
  let html = textWithTokens;

  // Step 2: Code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_match, _lang, code) => {
    return `<pre style="background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:0.8rem;overflow-x:auto;margin:0.5rem 0;font-size:0.8rem"><code>${code.trim()}</code></pre>`;
  });

  // Step 3: Headings
  html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:0.88rem;font-weight:700;color:#58a6ff;margin:0.6rem 0 0.3rem">$1</h3>');
  html = html.replace(/^## (.+)$/gm,  '<h2 style="font-size:0.95rem;font-weight:700;color:#bc8cff;margin:0.7rem 0 0.35rem">$1</h2>');
  html = html.replace(/^# (.+)$/gm,   '<h1 style="font-size:1.05rem;font-weight:700;color:#f0f6fc;margin:0.8rem 0 0.4rem">$1</h1>');

  // Step 4: Bold + Italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g,     '<strong style="color:#f0f6fc;font-weight:600">$1</strong>');

  // Step 5: Inline code
  html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(110,118,129,0.2);border-radius:4px;padding:0.1em 0.35em;font-size:0.85em;color:#e6edf3">$1</code>');

  // Step 6: List items (bullet points: *, -, •)
  html = html.replace(/^[\-\*•]\s+(.+)$/gm, '<li style="margin:0.25rem 0;list-style-type:disc;padding-left:0.2rem">$1</li>');
  html = html.replace(/(<li[\s\S]+?<\/li>)/g, '<ul style="padding-left:1.2rem;margin:0.4rem 0">$1</ul>');

  // Step 7: Single italic asterisks (only if not list item)
  html = html.replace(/(?<!^\s*)\*(.+?)\*/gm, '<em>$1</em>');

  // Step 8: Paragraphs
  html = html
    .split(/\n{2,}/)
    .map(block => {
      block = block.trim();
      if (!block) return '';
      if (/^<(h[1-6]|ul|ol|li|pre|hr|div|span)/.test(block)) return block;
      if (/^__KATEX_MATH_\d+_\d+__$/.test(block)) return block;
      return `<p style="margin:0.35rem 0;line-height:1.6">${block.replace(/\n/g, '<br />')}</p>`;
    })
    .join('\n');

  // Step 9: Restore KaTeX rendered HTML AFTER all markdown/paragraph transformations
  // This guarantees that <br /> or other regex replacements never corrupt the inner HTML/SVG of KaTeX!
  renderedMap.forEach((mathHtml, token) => {
    html = html.split(token).join(mathHtml);
  });

  return html;
}

/**
 * Tách văn bản thành các token cho hiệu ứng gõ chữ mượt mà (Word-by-word streaming)
 * Giữ nguyên vẹn toàn bộ khối công thức math ($...$, $$...$$) để không bị đứt đoạn hay lỗi KaTeX khi gõ.
 */
export function splitForStreaming(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  const tokens: string[] = [];
  const regex = /(\$\$[\s\S]+?\$\$|(?<!\$)\$[^$\n\r]+?\$(?!\$)|```[\s\S]*?```|\S+|\n)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    tokens.push(m[0]);
  }
  return tokens;
}

export interface ParsedChatOutput {
  answer: string;
  actions: any[];
}

/**
 * Trích xuất các action 3D từ phản hồi của AI (kể cả khi AI trả JSON đầy đủ hoặc chèn action rời rạc),
 * đồng thời dọn sạch mã JSON khỏi văn bản hiển thị cho học sinh.
 */
export function parseChatModelOutput(aiResponseText: string): ParsedChatOutput {
  if (!aiResponseText || typeof aiResponseText !== 'string') {
    return { answer: '', actions: [] };
  }

  let text = aiResponseText.trim();
  const extractedActions: any[] = [];

  // 1. Trích xuất các action từ khối ```actions ... ``` hoặc ```json ... ``` nếu khối đó chứa mảng action
  const codeBlockRegex = /```(?:actions|json)?\s*([\s\S]*?)```/gi;
  let codeBlockMatch;
  while ((codeBlockMatch = codeBlockRegex.exec(text)) !== null) {
    const blockContent = codeBlockMatch[1].trim();
    if (blockContent.startsWith('[') || (blockContent.startsWith('{') && (blockContent.includes('"type"') || blockContent.includes('"action"')))) {
      try {
        const parsed = JSON.parse(blockContent);
        if (Array.isArray(parsed)) {
          extractedActions.push(...parsed);
        } else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.actions)) extractedActions.push(...parsed.actions);
          else if (parsed.action) extractedActions.push(parsed.action);
          else if (parsed.type) extractedActions.push(parsed);
        }
      } catch {}
    }
  }

  // 2. Trích xuất "actions": [...] bằng thuật toán đếm ngoặc vuông sâu (tránh bị dừng sớm do mảng lồng nhau như "points": ["A","B"])
  const actionsIdx = text.search(/"actions"\s*:\s*\[/i);
  if (actionsIdx !== -1) {
    const startBracket = text.indexOf('[', actionsIdx);
    if (startBracket !== -1) {
      let depth = 0;
      let endBracket = -1;
      for (let i = startBracket; i < text.length; i++) {
        if (text[i] === '[') depth++;
        else if (text[i] === ']') {
          depth--;
          if (depth === 0) {
            endBracket = i;
            break;
          }
        }
      }
      if (endBracket !== -1) {
        const actionsStr = text.substring(startBracket, endBracket + 1);
        try {
          const arr = JSON.parse(actionsStr);
          if (Array.isArray(arr)) {
            for (const item of arr) {
              if (item && item.type) {
                const isDup = extractedActions.some(a => a.type === item.type && JSON.stringify(a.points || a.pointName) === JSON.stringify(item.points || item.pointName));
                if (!isDup) extractedActions.push(item);
              }
            }
          }
        } catch {}
      }
    }
  }

  // Trích xuất các đối tượng action đơn lẻ: {"action": {...}} hoặc {"type": "..."}
  const actionRegex = /\{[\s\r\n]*"(?:action)"[\s\r\n]*:[\s\r\n]*(\{[^{}]+\})[\s\r\n]*\}|\{[^{}]+?"type"[\s\r\n]*:[\s\r\n]*"[^"]+"[^{}]*\}/g;
  let match: RegExpExecArray | null;
  while ((match = actionRegex.exec(text)) !== null) {
    try {
      const jsonCandidate = match[1] || match[0];
      const parsed = JSON.parse(jsonCandidate);
      if (parsed && typeof parsed === 'object') {
        const act = parsed.action || parsed;
        if (act && act.type && !act.answer) {
          const isDup = extractedActions.some(a => a.type === act.type && JSON.stringify(a.points || a.pointName) === JSON.stringify(act.points || act.pointName));
          if (!isDup) extractedActions.push(act);
        }
      }
    } catch {}
  }

  // 3. Trích xuất văn bản trả lời trong sạch (Loại bỏ 100% vỏ bọc JSON "{ answer: ... }" và khối mã action)
  let cleanAnswer = text;
  let unquoted = cleanAnswer;
  if (unquoted.startsWith('```')) {
    unquoted = unquoted.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  if (unquoted.startsWith('{') && /"answer"\s*:/i.test(unquoted)) {
    let parsedJsonAnswer = null;
    try {
      const obj = JSON.parse(unquoted);
      if (obj && typeof obj === 'object' && obj.answer) {
        parsedJsonAnswer = String(obj.answer).trim();
      }
    } catch {}

    if (parsedJsonAnswer) {
      cleanAnswer = parsedJsonAnswer;
    } else {
      const answerStartIdx = unquoted.search(/"answer"\s*:\s*"/i);
      if (answerStartIdx !== -1) {
        const quoteStart = unquoted.indexOf('"', answerStartIdx + 8);
        if (quoteStart !== -1) {
          let ansBody = unquoted.substring(quoteStart + 1);
          const endActionsIdx = ansBody.search(/"\s*,\s*"action/i);
          if (endActionsIdx !== -1) {
            ansBody = ansBody.substring(0, endActionsIdx);
          } else {
            const lastQuote = ansBody.lastIndexOf('"');
            if (lastQuote !== -1) {
              ansBody = ansBody.substring(0, lastQuote);
            }
          }

          cleanAnswer = ansBody
            .replace(/\\r\\n/g, '\n')
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, ' ')
            .replace(/\\"/g, '"');
        }
      } else {
        cleanAnswer = unquoted
          .replace(/^[\s\r\n]*\{[\s\r\n]*"answer"\s*:\s*"/i, '')
          .replace(/"\s*,\s*"actions"[\s\S]*$/i, '')
          .replace(/"\s*,\s*"action"[\s\S]*$/i, '')
          .replace(/"[\s\r\n]*\}[\s\r\n]*$/i, '')
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"');
      }
    }
  } else {
    // Nếu là văn bản tự nhiên có kèm khối action
    cleanAnswer = cleanAnswer
      .replace(/```(?:actions|json)?\s*\[[\s\S]*?\]\s*```/gi, '')
      .replace(/```(?:actions|json)?\s*\{[\s\S]*?"type"[\s\S]*?\}\s*```/gi, '')
      .replace(/\{[\s\r\n]*"(?:action)"[\s\r\n]*:[\s\r\n]*\{[^{}]+\}[\s\r\n]*\}/g, '')
      .replace(/\{[^{}]*?"type"[\s\r\n]*:[\s\r\n]*"[^"]+"[^{}]*?\}/g, '');
  }

  cleanAnswer = cleanAnswer
    .replace(/\x0c/g, '\\f')
    .replace(/\x08/g, '\\b')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { answer: cleanAnswer, actions: extractedActions };
}

/**
 * Chuyển đổi mã lệnh LaTeX và ký hiệu toán học thô thành văn bản Tiếng Việt tự nhiên dễ đọc.
 * Ví dụ: \widehat{ABC} = 120^0 -> góc ABC = 120°
 *       SA \perp (ABCD) -> SA ⊥ (ABCD)
 *       BC = a\sqrt{2} -> BC = a√2
 */
export function toNaturalVietnameseMathText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let s = text;

  // 1. Gỡ bỏ ký hiệu bọc LaTeX inline $...$ hoặc $$...$$
  s = s.replace(/\$\$([^$]+)\$\$/g, '$1');
  s = s.replace(/\$([^$]+)\$/g, '$1');

  // 2. Ký hiệu góc: \widehat{ABC}, \widehat ABC, \angle ABC, \angle{ABC}
  s = s.replace(/(?:góc\s*)?\\widehat\{([A-Za-z0-9_']+)\}/gi, 'góc $1');
  s = s.replace(/(?:góc\s*)?\\widehat\s*([A-Za-z]{1,4})/gi, 'góc $1');
  s = s.replace(/(?:góc\s*)?\\angle\{([A-Za-z0-9_']+)\}/gi, 'góc $1');
  s = s.replace(/(?:góc\s*)?\\angle\s*([A-Za-z0-9_']+)/gi, 'góc $1');
  s = s.replace(/(?:góc\s*)?\\angle\s*(\([^)]+\))/gi, 'góc $1');

  // 3. Ký hiệu độ: 120^0, 120^\circ, 120^{\circ}, 120^o, 120^\circle
  s = s.replace(/(\d+)\s*\^\s*\{?\s*(?:0|o|\\circ)\s*\}?/gi, '$1°');
  s = s.replace(/(\d+)\s*\\circ\b/g, '$1°');

  // 4. Ký hiệu tam giác: \Delta ABC, \triangle ABC
  s = s.replace(/(?:tam giác\s*)?\\(?:Delta|triangle)\s*([A-Za-z]{3})/gi, 'tam giác $1');
  s = s.replace(/(?:tam giác\s*)?\\(?:Delta|triangle)\{([A-Za-z]{3})\}/gi, 'tam giác $1');

  // 5. Căn bậc hai: \sqrt{3} -> √3, \sqrt{a^2 + b^2} -> √(a² + b²)
  s = s.replace(/\\sqrt\{([0-9a-zA-Z]+)\}/g, '√$1');
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');
  s = s.replace(/\\sqrt\s*(\d+)/g, '√$1');

  // 6. Phân số: \frac{a}{b} -> a/b
  s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2');

  // 7. Ký hiệu vuông góc, song song
  s = s.replace(/\\perp\b/g, ' ⊥ ');
  s = s.replace(/\\parallel\b/g, ' // ');

  // 8. Dấu nhân, chấm
  s = s.replace(/\\times\b/g, '×');
  s = s.replace(/\\cdot\b/g, '·');

  // 9. Dấu phẩy A^\prime -> A'
  s = s.replace(/([A-Za-z])\s*\^\s*\{?\\prime\}?/g, "$1'");

  // 10. Tránh lặp từ
  s = s.replace(/\bgóc\s+góc\b/gi, 'góc');
  s = s.replace(/\btam giác\s+tam giác\b/gi, 'tam giác');

  // 11. Dọn dẹp khoảng trắng thừa
  s = s.replace(/\s{2,}/g, ' ').trim();

  return s;
}

