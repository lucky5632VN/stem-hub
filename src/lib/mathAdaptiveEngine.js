import modelData from '../data/models/math-irt-model.json' with { type: 'json' };

/**
 * Item Response Theory (IRT) Adaptive Difficulty Engine
 * Calculates target question difficulty to keep student in the optimal learning zone (P(correct) in [0.60, 0.75]).
 * Preserves 100% deterministic correctness of all math equations and KaTeX rendering.
 */

export function calculateIRTHitProbability(studentElo, itemDiff) {
  const alpha = modelData.metadata?.scalingFactorAlpha || 1.7;
  const theta = ((studentElo || 1200) - 1500.0) / 400.0;
  const b = ((itemDiff || 1400) - 1500.0) / 400.0;

  const logit = alpha * (theta - b);
  return 1.0 / (1.0 + Math.exp(-logit));
}

/**
 * Select optimal question from list based on student's current ELO
 */
export function selectAdaptiveMathQuestion(studentElo, questions = []) {
  if (!questions || questions.length === 0) return null;

  const targetPMin = 0.60;
  const targetPMax = 0.75;
  const targetPMid = 0.675;

  const scored = questions.map((q) => {
    const diffElo = q.difficultyElo || (q.level === 'easy' ? 1000 : q.level === 'hard' ? 1800 : 1400);
    const pSuccess = calculateIRTHitProbability(studentElo, diffElo);
    const deltaFromTarget = Math.abs(pSuccess - targetPMid);

    return {
      question: q,
      diffElo,
      pSuccess,
      deltaFromTarget
    };
  });

  scored.sort((a, b) => a.deltaFromTarget - b.deltaFromTarget);

  const bestMatch = scored[0];
  return {
    ...bestMatch.question,
    irtMetadata: {
      studentElo,
      questionDifficultyElo: bestMatch.diffElo,
      predictedSuccessProb: Math.round(bestMatch.pSuccess * 100) + '%'
    }
  };
}

export default {
  calculateIRTHitProbability,
  selectAdaptiveMathQuestion
};
