/**
 * Resilient Gemini API Pool for Lab Toán & STEM HUB
 * Re-exports from geminiCaller for unified, robust multi-key rotation.
 */
export {
  GEMINI_KEYS as COMBINED_MATH_API_KEYS,
  RESILIENT_MODELS,
  callResilientGemini
} from './geminiCaller.js';

import { GEMINI_KEYS, RESILIENT_MODELS, callResilientGemini } from './geminiCaller.js';

export function getAllKeys() {
  return [...GEMINI_KEYS];
}

export function getPoolStats() {
  return {
    totalKeys: GEMINI_KEYS.length,
    models: RESILIENT_MODELS
  };
}

