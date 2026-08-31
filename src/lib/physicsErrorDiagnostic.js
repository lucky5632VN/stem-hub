import modelData from '../data/models/physics-error-model.json';

/**
 * Diagnostic Engine for Physics Laser Optics Lab
 * Preserves 100% of deterministic Ray casting calculation.
 * Runs kNN classification when attempt fails to provide precise guidance.
 */
export function diagnosePhysicsAttempt(userParams, targetParams) {
  const angleDiff = Math.abs((userParams.angle || 0) - (targetParams.angle || 0));
  const posOffset = Math.abs((userParams.position || 0) - (targetParams.position || 0));
  const indexDiff = Math.abs((userParams.refractiveIndex || 1.0) - (targetParams.refractiveIndex || 1.0));

  // If error is negligible, it's correct
  if (angleDiff <= 1.0 && posOffset <= 2.0 && indexDiff <= 0.05) {
    return {
      isCorrect: true,
      diagnostic: "Thao tác hoàn hảo! Tia laser truyền đúng đường đi thiết kế.",
      errorType: null
    };
  }

  // Normalize inputs
  const normAngle = angleDiff / 30.0;
  const normPos = posOffset / 50.0;
  const normIndex = indexDiff / 0.5;

  const dataset = modelData.dataset || [];
  const distances = dataset.map(sample => {
    const sAngle = sample.angleDiff / 30.0;
    const sPos = sample.posOffset / 50.0;
    const sIndex = sample.indexDiff / 0.5;

    const dist = Math.sqrt(
      Math.pow(normAngle - sAngle, 2) +
      Math.pow(normPos - sPos, 2) +
      Math.pow(normIndex - sIndex, 2)
    );

    return { errorType: sample.errorType, dist };
  });

  distances.sort((a, b) => a.dist - b.dist);
  const kNearest = distances.slice(0, 3);

  const votes = {};
  kNearest.forEach(n => {
    votes[n.errorType] = (votes[n.errorType] || 0) + 1;
  });

  let topErrorType = "Sai lệch thao tác quang học";
  let maxVotes = 0;
  for (const [errType, count] of Object.entries(votes)) {
    if (count > maxVotes) {
      maxVotes = count;
      topErrorType = errType;
    }
  }

  let advice = "";
  if (topErrorType.includes("Incidence Angle")) {
    advice = `💡 **Gợi ý khắc phục (Góc tới)**: Bạn cần điều chỉnh góc xoay của gương/thấu kính (Đang lệch ${angleDiff.toFixed(1)}°).`;
  } else if (topErrorType.includes("Element Alignment")) {
    advice = `💡 **Gợi ý khắc phục (Căn vị trí)**: Hãy di chuyển thấu kính về đúng tọa độ tâm (Đang lệch ${posOffset.toFixed(1)} px).`;
  } else {
    advice = `💡 **Gợi ý khắc phục (Chiết suất)**: Hãy điều chỉnh lại chiết suất môi trường chiết quang (Đang lệch ${indexDiff.toFixed(2)}).`;
  }

  return {
    isCorrect: false,
    diagnostic: `❌ ${topErrorType}.\n${advice}`,
    errorType: topErrorType,
    angleDiff,
    posOffset,
    indexDiff
  };
}

export default {
  diagnosePhysicsAttempt
};
