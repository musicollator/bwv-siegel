// src/AngleCalculator.js - Extracted angle calculation logic

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

    // Edge calculations for 90° < angle < 270°
    const startQ = Math.floor(Q / 4) + 1;
    const endQ = Math.ceil(3 * Q / 4) - 1;

    for (let q = startQ; q <= endQ; q++) {
      const angle = (entryAngle + q * step) % 360;

      // If otherExitAngle is provided, check opposition rule
      if (otherExitAngle !== null) {
        const oppositeAngle = (otherExitAngle + 180) % 360;
        if (angle === oppositeAngle) {
          // For low quantization (Q≤4), opposition is mathematically unavoidable
          // Allow oscillating patterns: Left 180°↔0°, Right 0°↔180°
          if (Q > 4) {
            continue; // Skip opposite angles for higher quantization
          }
          // For Q≤4, allow opposites (creates oscillating dance pattern)
        }
      }
      
      allowedAngles.push(angle);
    }

    return allowedAngles;
  }

  getQuantizationRange() {
    const Q = this.quantization;
    const startQ = Math.floor(Q / 4) + 1;
    const endQ = Math.ceil(3 * Q / 4) - 1;
    return { startQ, endQ, step: 360 / Q };
  }

  getAllQuantizedAngles() {
    const step = 360 / this.quantization;
    const angles = [];
    for (let q = 0; q < this.quantization; q++) {
      angles.push((q * step) % 360);
    }
    return angles;
  }
}