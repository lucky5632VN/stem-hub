import modelData from '../data/models/intent-classifier.json';

function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\w\sàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

/**
 * Classify user prompt intent & subject using precomputed Naive Bayes parameters
 */
export function predictUserIntent(text) {
  if (!text || typeof text !== 'string') {
    return { intent: 'stem_query', subject: null, command: null };
  }

  const tokens = tokenize(text);
  const { classCounts, wordCounts, totalWordsInClass, totalDocs, vocab } = modelData;
  const vocabSize = vocab.length || 50;

  let bestIntent = 'stem_query';
  let maxLogProb = -Infinity;

  for (const intent in classCounts) {
    const priorLogProb = Math.log(classCounts[intent] / totalDocs);
    let logProb = priorLogProb;

    tokens.forEach(word => {
      const count = (wordCounts[intent] && wordCounts[intent][word]) || 0;
      const likelihood = Math.log((count + 1) / (totalWordsInClass[intent] + vocabSize));
      logProb += likelihood;
    });

    if (logProb > maxLogProb) {
      maxLogProb = logProb;
      bestIntent = intent;
    }
  }

  // Generate systemic command if applicable
  let command = null;
  if (bestIntent === 'nav_phongthi') command = '[[NAV:/phong-thi]]';
  else if (bestIntent === 'nav_dautruong') command = '[[NAV:/dau-truong]]';
  else if (bestIntent === 'nav_hoso') command = '[[NAV:/ho-so]]';
  else if (bestIntent === 'nav_story') command = '[[NAV:/story]]';
  else if (bestIntent === 'toggle_theme') command = '[[TOGGLE_THEME]]';

  // Detect subject
  let detectedSubject = null;
  const qLower = text.toLowerCase();
  if (qLower.includes('hóa') || qLower.includes('este') || qLower.includes('axit') || qLower.includes('gluco') || qLower.includes('chất')) detectedSubject = 'hoa';
  else if (qLower.includes('lý') || qLower.includes('sóng') || qLower.includes('dao động') || qLower.includes('mạch') || qLower.includes('quang')) detectedSubject = 'ly';
  else if (qLower.includes('toán') || qLower.includes('đạo hàm') || qLower.includes('tích phân') || qLower.includes('bậc hai') || qLower.includes('hàm số')) detectedSubject = 'toan';
  else if (qLower.includes('sinh') || qLower.includes('adn') || qLower.includes('gen') || qLower.includes('màng') || qLower.includes('tế bào')) detectedSubject = 'sinh';

  return {
    intent: bestIntent,
    subject: detectedSubject,
    command,
    confidenceLogProb: maxLogProb
  };
}

export default {
  predictUserIntent
};
