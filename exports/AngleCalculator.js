// src/AngleCalculator.js - CORRECTED: Opposition rule removed, same azimuth via probability


//                   270° (North/up)
//                    ↑
// (West/left) 180° ←   → 0° (East/right)
//                    ↓
//      (South/down) 90° 


export class AngleCalculator {
  constructor(quantization = 8) {
    this.quantization = this._sanitizeQuantization(quantization);
  }

  setQuantization(newQ) {
    this.quantization = this._sanitizeQuantization(newQ);
    return this.quantization;
  }

  _sanitizeQuantization(q) {
    let original = q;
    let n = Math.max(2, Math.floor(q));
    if (n % 2 !== 0) n += 1; // Make it even
    console.log(`🛠️ Quantization input: ${original} → sanitized: ${n}`);
    return n;
  }

  getSetOfAllowedAzimuths(entryAngle, otherExitAngle = null) {
    const Q = this.quantization;
    const step = 360 / Q;
    const allowedAngles = [];

    for (let q = 0; q < Q; q++) {
      const angle = (entryAngle + q * step) % 360;

      // Check if angle is in forward range: 270° < angle < 360° OR 0° ≤ angle < 90°
      const isForward = (270 < angle && angle < 360) || (0 <= angle && angle < 90);

      if (isForward) {
        // all forward angles are allowed
        allowedAngles.push(angle);
      }
    }

    return allowedAngles;
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

    // Get allowed azimuths based on physical constraints (no opposition rule)
    const allowedAzimuths = this.getSetOfAllowedAzimuths(previousAzimuth, otherSealNextAzimuth);

    console.log(`📐 Allowed azimuths: [${allowedAzimuths.join(', ')}]°`);

    // STRICT: No valid azimuths — return input unchanged
    if (allowedAzimuths.length === 0) {
      console.warn(`⚠️ NO VALID AZIMUTHS: returning ${previousAzimuth}° unchanged.`);
      return previousAzimuth;
    }

    // Calculate probabilities for each allowed azimuth
    const weightedAzimuths = [];

    for (const candidateAzimuth of allowedAzimuths) {
      let totalProbability;
      const continuityDeviation = this.getAngularDifference(candidateAzimuth, previousAzimuth);
      const separationAzimuth = otherSealNextAzimuth !== null ? this.getAngularDifference(candidateAzimuth, otherSealNextAzimuth) : null;

      if (separationAzimuth === null) {
        totalProbability = this.gaussianProbability(continuityDeviation, 45);
      } else {
        if (separationAzimuth === 0) {
          totalProbability = 0.001;
          // console.log(`   ${candidateAzimuth}°: SAME AZIMUTH as other seal - very low probability (${totalProbability.toFixed(3)})`);
        } else {
          const continuityProb = this.gaussianProbability(continuityDeviation, 45);

          const separationDeviation = Math.abs(separationAzimuth - 180);
          const separationProb = this.gaussianProbability(separationDeviation, 60);

          totalProbability = continuityProb * separationProb;

          // console.log(`   ${candidateAzimuth}°: continuity=${continuityDeviation.toFixed(1)}° (p=${continuityProb.toFixed(3)}), separation=${separationAzimuth.toFixed(1)}° (p=${separationProb.toFixed(3)}), total=${totalProbability.toFixed(3)}`);
        }
      }

      weightedAzimuths.push({
        azimuth: candidateAzimuth,
        probability: totalProbability,
        continuityDeviation,
        separationAzimuth
      });
    }

    const totalWeight = weightedAzimuths.reduce((sum, a) => sum + a.probability, 0);

    // STRICT: All zero probabilities — return input unchanged
    if (totalWeight === 0) {
      console.warn(`⚠️ ALL PROBABILITIES ZERO: returning ${previousAzimuth}° unchanged.`);
      console.warn('Weighted azimuths debug:', weightedAzimuths);
      return previousAzimuth;
    }

    // Weighted random selection
    let random = Math.random() * totalWeight;

    for (const option of weightedAzimuths) {
      random -= option.probability;
      if (random <= 0) {
        const logMsg = `🎲 Selected: ${option.azimuth}° (continuity: ${option.continuityDeviation.toFixed(1)}°${option.separationAzimuth !== null ? `, separation: ${option.separationAzimuth.toFixed(1)}°` : ''})`;
        console.log(logMsg);
        return option.azimuth;
      }
    }

    // Should never happen — fallback to input
    console.error(`❌ WEIGHTED SELECTION FAILED: returning ${previousAzimuth}° unchanged.`);
    console.error('Weighted azimuths debug:', weightedAzimuths);
    return previousAzimuth;
  }

}