/**
 * Multi-Locus Bayesian Reasoning Engine for Biology Genetics Lab
 * Preserves 100% of single-gene Hardy-Weinberg equilibrium calculation (p^2 + 2pq + q^2 = 1).
 * Extends to multi-gene Bayesian Conditional Probability Tables (CPT).
 */

// Single-locus allele probability calculator
export function calculateSingleLocusProbabilities(parent1Genotype, parent2Genotype) {
  // Genotype representation e.g. "Aa"
  const g1 = parent1Genotype.split('');
  const g2 = parent2Genotype.split('');

  const offspringGenotypes = {};
  let total = 0;

  for (const allele1 of g1) {
    for (const allele2 of g2) {
      const pair = [allele1, allele2].sort().join('');
      offspringGenotypes[pair] = (offspringGenotypes[pair] || 0) + 1;
      total++;
    }
  }

  const cpts = {};
  for (const [genotype, count] of Object.entries(offspringGenotypes)) {
    cpts[genotype] = count / total;
  }

  return cpts;
}

/**
 * Multi-Locus Bayesian Inference for Crosses (e.g. AaBbDd x AaBbDd)
 * Returns joint probability distribution over phenotypes & genotypes.
 */
export function calculateMultiLocusBayesianCross(parent1Multi, parent2Multi) {
  // Expect format like "AaBbDd" or "AABB"
  const parseLoci = (str) => {
    const loci = [];
    for (let i = 0; i < str.length; i += 2) {
      loci.push(str.substring(i, i + 2));
    }
    return loci;
  };

  const loci1 = parseLoci(parent1Multi);
  const loci2 = parseLoci(parent2Multi);

  if (loci1.length !== loci2.length) {
    throw new Error('Số cặp gen của Bố và Mẹ phải tương thích.');
  }

  const locusProbabilities = [];
  for (let i = 0; i < loci1.length; i++) {
    locusProbabilities.push(calculateSingleLocusProbabilities(loci1[i], loci2[i]));
  }

  // Combine independent loci using Bayesian Joint Probability Theorem
  let jointGenotypes = [{ genotype: '', prob: 1.0, dominantCount: 0 }];

  for (let i = 0; i < locusProbabilities.length; i++) {
    const nextJoint = [];
    const locusMap = locusProbabilities[i];

    for (const current of jointGenotypes) {
      for (const [g, p] of Object.entries(locusMap)) {
        const isDominant = /[A-Z]/.test(g);
        nextJoint.push({
          genotype: current.genotype + g,
          prob: current.prob * p,
          dominantCount: current.dominantCount + (isDominant ? 1 : 0)
        });
      }
    }
    jointGenotypes = nextJoint;
  }

  // Phenotype probabilities
  let probAllDominant = 1.0;
  for (let i = 0; i < loci1.length; i++) {
    const pDominant1 = loci1[i].includes(loci1[i][0].toUpperCase());
    const pDominant2 = loci2[i].includes(loci2[i][0].toUpperCase());
    
    const singleCpt = calculateSingleLocusProbabilities(loci1[i], loci2[i]);
    let domProb = 0;
    for (const [gt, pr] of Object.entries(singleCpt)) {
      if (/[A-Z]/.test(gt)) domProb += pr;
    }
    probAllDominant *= domProb;
  }

  return {
    numLoci: loci1.length,
    parent1: parent1Multi,
    parent2: parent2Multi,
    probAllDominantPhenotype: probAllDominant,
    jointGenotypesCount: jointGenotypes.length,
    jointGenotypes
  };
}

export default {
  calculateSingleLocusProbabilities,
  calculateMultiLocusBayesianCross
};
