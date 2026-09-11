import modelData from '../data/models/intent-classifier.json';
import { normalizeText } from './textNormalizer.js';

function tokenize(text) {
  if (!text) return [];
  const normalized = normalizeText(text);
  return normalized
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\w\sàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

/**
 * Classify user prompt intent & subject using precomputed Naive Bayes parameters + Text Normalizer
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
  const scores = {};
  let sumScore = 0;

  for (const intent in classCounts) {
    const priorLogProb = Math.log(classCounts[intent] / totalDocs);
    let logProb = priorLogProb;

    tokens.forEach(word => {
      const count = (wordCounts[intent] && wordCounts[intent][word]) || 0;
      const likelihood = Math.log((count + 1) / (totalWordsInClass[intent] + vocabSize));
      logProb += likelihood;
    });

    scores[intent] = Math.exp(logProb);
    sumScore += scores[intent];

    if (logProb > maxLogProb) {
      maxLogProb = logProb;
      bestIntent = intent;
    }
  }

  const confidenceProb = sumScore > 0 ? (scores[bestIntent] / sumScore) : 0;
  const isLowConfidence = confidenceProb < 0.65;

  // Generate systemic command if applicable
  let command = null;
  const qClean = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

  if (
    qClean.includes('lab hoa') || qClean.includes('lab che') || 
    qClean.includes('thi nghiem hoa') || (qClean.includes('lab') && qClean.includes('hoa')) ||
    qClean.includes('qua lab hoa') || qClean.includes('mo lab hoa') || qClean.includes('vao lab hoa') ||
    qClean.includes('dua toi qua lab hoa') || qClean.includes('dua qua lab hoa')
  ) {
    command = '[[NAV:/labs/lab-ktra15p/dist/index.html]]';
    bestIntent = 'nav_lab_hoa';
  } else if (
    qClean.includes('lab ly') || qClean.includes('lab li') || qClean.includes('lab vat ly') || 
    qClean.includes('thi nghiem ly') || (qClean.includes('lab') && (qClean.includes('ly') || qClean.includes('li'))) ||
    qClean.includes('qua lab ly') || qClean.includes('mo lab ly') || qClean.includes('vao lab ly') ||
    qClean.includes('dua toi qua lab ly') || qClean.includes('dua qua lab ly')
  ) {
    command = '[[NAV:/labs/PhysicsLab/index.html]]';
    bestIntent = 'nav_lab_ly';
  } else if (
    qClean.includes('lab toan') || qClean.includes('thi nghiem toan') || (qClean.includes('lab') && qClean.includes('toan')) ||
    qClean.includes('qua lab toan') || qClean.includes('mo lab toan') || qClean.includes('vao lab toan') ||
    qClean.includes('dua toi qua lab toan') || qClean.includes('dua qua lab toan')
  ) {
    command = '[[NAV:/labs/toan/frontend/dist/index.html]]';
    bestIntent = 'nav_lab_toan';
  } else if (
    qClean.includes('lab sinh') || qClean.includes('thi nghiem sinh') || (qClean.includes('lab') && qClean.includes('sinh')) ||
    qClean.includes('qua lab sinh') || qClean.includes('mo lab sinh') || qClean.includes('vao lab sinh') ||
    qClean.includes('dua toi qua lab sinh') || qClean.includes('dua qua lab sinh')
  ) {
    command = '[[NAV:/labs/lab_sinh/dist/index.html]]';
    bestIntent = 'nav_lab_sinh';
  } else if (qClean.includes('dau truong') || qClean.includes('pvp') || qClean.includes('thach dau') || qClean.includes('san dau')) {
    command = '[[NAV:/dau-truong]]';
    bestIntent = 'nav_dautruong';
  } else if (qClean.includes('phong thi') || qClean.includes('luyen de') || qClean.includes('de thi')) {
    command = '[[NAV:/phong-thi]]';
    bestIntent = 'nav_phongthi';
  } else if (qClean.includes('ho so') || qClean.includes('chibi') || qClean.includes('danh hieu') || qClean.includes('ca nhan')) {
    command = '[[NAV:/ho-so]]';
    bestIntent = 'nav_hoso';
  } else if (qClean.includes('story') || qClean.includes('bai viet') || qClean.includes('chia se')) {
    command = '[[NAV:/story]]';
    bestIntent = 'nav_story';
  } else if (qClean.includes('theme') || qClean.includes('giao dien') || qClean.includes('dark mode') || qClean.includes('light mode') || qClean.includes('che do toi') || qClean.includes('che do sang')) {
    command = '[[TOGGLE_THEME]]';
    bestIntent = 'toggle_theme';
  } else if (!isLowConfidence) {
    if (bestIntent === 'nav_phongthi') command = '[[NAV:/phong-thi]]';
    else if (bestIntent === 'nav_dautruong') command = '[[NAV:/dau-truong]]';
    else if (bestIntent === 'nav_hoso') command = '[[NAV:/ho-so]]';
    else if (bestIntent === 'nav_story') command = '[[NAV:/story]]';
    else if (bestIntent === 'toggle_theme') command = '[[TOGGLE_THEME]]';
  }

  // Detect subject
  let detectedSubject = null;
  const qLower = text.toLowerCase().replace(/hoá/g, 'hóa').replace(/vật lí/g, 'vật lý');
  if (qLower.includes('hóa') || qLower.includes('hoá') || qLower.includes('este') || qLower.includes('axit') || qLower.includes('gluco') || qLower.includes('chất')) detectedSubject = 'hoa';
  else if (qLower.includes('lý') || qLower.includes('lí') || qLower.includes('sóng') || qLower.includes('dao động') || qLower.includes('mạch') || qLower.includes('quang')) detectedSubject = 'ly';
  else if (qLower.includes('toán') || qLower.includes('đạo hàm') || qLower.includes('tích phân') || qLower.includes('bậc hai') || qLower.includes('hàm số')) detectedSubject = 'toan';
  else if (qLower.includes('sinh') || qLower.includes('adn') || qLower.includes('gen') || qLower.includes('màng') || qLower.includes('tế bào')) detectedSubject = 'sinh';

  return {
    intent: bestIntent,
    subject: detectedSubject,
    command,
    confidenceProb,
    isLowConfidence
  };
}

export default {
  predictUserIntent
};
