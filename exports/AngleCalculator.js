// src/AngleCalculator.js - CORRECTED: Opposition rule removed, same azimuth via probability

export class AngleCalculator {
  constructor(quantization = 8) {
    this.quantization = Math.max(2, quantization);
  }

  setQuantization(newQ) {
    this.quantization = Math.max(2, newQ);
    return this.quantization;
  }

  getSetOfAllowedAngles(entryAngle, otherExitAngle = null) {
    const Q = this.quantization;
    const step = 360 / Q;
    const allowedAngles = [];

    // Forward directions 270° < angle < 90° (strict inequalities)
    for (let q = 0; q < Q; q++) {
      const angle = (entryAngle + q * step) % 360;
      
      // Check if angle is in forward range: 270° < angle < 360° OR 0° ≤ angle < 90°
      const isForward = (angle > 270 && angle < 360) || (angle >= 0 && angle < 90);
      
      if (isForward) {
        // NO MORE OPPOSITION RULE - all forward angles are allowed
        allowedAngles.push(angle);
      }
    }

    return allowedAngles;
  }

  getQuantizationRange() {
    const Q = this.quantization;
    const step = 360 / Q;
    return { 
      startQ: 0, 
      endQ: Q - 1, 
      step: step,
      note: "Range now calculated per-angle for forward directions (270°-90°), no opposition rule"
    };
  }

  getAllQuantizedAngles() {
    const step = 360 / this.quantization;
    const angles = [];
    for (let q = 0; q < this.quantization; q++) {
      angles.push((q * step) % 360);
    }
    return angles;
  }

  // Helper: Calculate smallest angular difference between two angles
  getAngularDifference(angle1, angle2) {
    let diff = Math.abs(angle1 - angle2);
    if (diff > 180) diff = 360 - diff;
    return diff;
  }

  // Gaussian probability for smooth transitions (favors smaller deviations)
  gaussianProbability(deviationAngle, sigma = 45) {
    const normalized = deviationAngle / sigma;
    return Math.exp(-0.5 * normalized * normalized);
  }

  // Complete azimuth selection with probability-based choice (STRICT - NO FALLBACKS)
  getNextAzimuth(previousAzimuth, otherSealNextAzimuth = null) {
    console.log(`🎯 AngleCalculator selecting next azimuth from ${previousAzimuth}°${otherSealNextAzimuth !== null ? `, avoiding conflicts with ${otherSealNextAzimuth}°` : ''}`);

    // Get allowed angles based on physical constraints (no opposition rule)
    const allowedAngles = this.getSetOfAllowedAngles(previousAzimuth, otherSealNextAzimuth);
    
    console.log(`📐 Allowed angles: [${allowedAngles.join(', ')}]°`);

    // STRICT: No fallbacks - throw error if no valid angles
    if (allowedAngles.length === 0) {
      const errorMsg = `❌ NO VALID ANGLES: previousAzimuth=${previousAzimuth}°, otherSealNextAzimuth=${otherSealNextAzimuth}°, quantization=${this.quantization}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Calculate probabilities for each allowed angle
    const weightedAngles = [];

    for (const candidateAngle of allowedAngles) {
      let totalProbability;

      if (otherSealNextAzimuth === null) {
        // SINGLE ARGUMENT CASE: Only consider continuity (smooth transition)
        const continuityDeviation = this.getAngularDifference(candidateAngle, previousAzimuth);
        totalProbability = this.gaussianProbability(continuityDeviation, 45); // σ=45° for continuity
        
      } else {
        // DUAL ARGUMENT CASE: Complex distribution combining continuity + separation
        
        if (candidateAngle === otherSealNextAzimuth) {
          // SAME AZIMUTH: Nearly zero probability (but not impossible for edge cases)
          totalProbability = 0.001;
          console.log(`   ${candidateAngle}°: SAME AZIMUTH as other seal - very low probability (${totalProbability.toFixed(3)})`);
        } else {
          // NORMAL CASE: Calculate continuity + separation probabilities
          
          // 1. Continuity probability (favor smooth transitions from previous)
          const continuityDeviation = this.getAngularDifference(candidateAngle, previousAzimuth);
          const continuityProb = this.gaussianProbability(continuityDeviation, 45); // σ=45° for continuity
          
          // 2. Separation probability (favor good visual separation ~180°)
          const separationAngle = this.getAngularDifference(candidateAngle, otherSealNextAzimuth);
          // We want to favor separations around 180° (good visual balance)
          const separationDeviation = Math.abs(separationAngle - 180);
          const separationProb = this.gaussianProbability(separationDeviation, 60); // σ=60° for separation preference
          
          // 3. Combined probability (multiply both factors)
          totalProbability = continuityProb * separationProb;
          
          console.log(`   ${candidateAngle}°: continuity=${continuityDeviation.toFixed(1)}° (p=${continuityProb.toFixed(3)}), separation=${separationAngle.toFixed(1)}° (p=${separationProb.toFixed(3)}), total=${totalProbability.toFixed(3)}`);
        }
      }

      weightedAngles.push({
        azimuth: candidateAngle,
        probability: totalProbability,
        continuityDeviation: this.getAngularDifference(candidateAngle, previousAzimuth),
        separationAngle: otherSealNextAzimuth !== null ? this.getAngularDifference(candidateAngle, otherSealNextAzimuth) : null
      });
    }

    // Calculate total weight
    const totalWeight = weightedAngles.reduce((sum, a) => sum + a.probability, 0);
    
    // STRICT: No fallbacks - throw error if all probabilities are zero
    if (totalWeight === 0) {
      const errorMsg = `❌ ALL PROBABILITIES ARE ZERO: This should be mathematically impossible. Debug: allowedAngles=[${allowedAngles.join(', ')}]°, previousAzimuth=${previousAzimuth}°, otherSealNextAzimuth=${otherSealNextAzimuth}°`;
      console.error(errorMsg);
      console.error('Weighted angles debug:', weightedAngles);
      throw new Error(errorMsg);
    }

    // Weighted random selection
    let random = Math.random() * totalWeight;

    for (const option of weightedAngles) {
      random -= option.probability;
      if (random <= 0) {
        const logMsg = `🎲 Selected: ${option.azimuth}° (continuity: ${option.continuityDeviation.toFixed(1)}°${option.separationAngle !== null ? `, separation: ${option.separationAngle.toFixed(1)}°` : ''})`;
        console.log(logMsg);
        return option.azimuth;
      }
    }

    // STRICT: This should never happen with proper weighted selection - throw error
    const errorMsg = `❌ WEIGHTED SELECTION FAILED: This indicates a bug in the selection algorithm. totalWeight=${totalWeight}, random generation failed.`;
    console.error(errorMsg);
    console.error('Weighted angles debug:', weightedAngles);
    throw new Error(errorMsg);
  }
}