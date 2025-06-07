// test/angle-calculator.test.js - Unit tests for BWV Siegel angle calculations

import assert from 'assert';

// Extract AngleCalculator class for testing
class AngleCalculator {
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

      // If otherExitAngle is provided, exclude opposite direction
      if (otherExitAngle !== null) {
        const oppositeAngle = (otherExitAngle + 180) % 360;
        if (angle === oppositeAngle) {
          continue;
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

// Test Functions
function testQuantizationRanges() {
  console.log('🧪 Testing quantization ranges...');
  
  // Test Q=6
  const calc6 = new AngleCalculator(6);
  const range6 = calc6.getQuantizationRange();
  assert.strictEqual(range6.startQ, 2, 'Q=6: startQ should be 2');
  assert.strictEqual(range6.endQ, 4, 'Q=6: endQ should be 4');
  assert.strictEqual(range6.step, 60, 'Q=6: step should be 60°');
  
  // Test Q=8
  const calc8 = new AngleCalculator(8);
  const range8 = calc8.getQuantizationRange();
  assert.strictEqual(range8.startQ, 3, 'Q=8: startQ should be 3');
  assert.strictEqual(range8.endQ, 5, 'Q=8: endQ should be 5');
  assert.strictEqual(range8.step, 45, 'Q=8: step should be 45°');
  
  // Test Q=4
  const calc4 = new AngleCalculator(4);
  const range4 = calc4.getQuantizationRange();
  assert.strictEqual(range4.startQ, 2, 'Q=4: startQ should be 2');
  assert.strictEqual(range4.endQ, 2, 'Q=4: endQ should be 2');
  assert.strictEqual(range4.step, 90, 'Q=4: step should be 90°');
  
  console.log('✅ Quantization ranges correct');
}

function testRelativeAnglesQ6() {
  console.log('🧪 Testing relative angles Q=6...');
  
  const calc = new AngleCalculator(6);
  
  // Test left seal entering from 180° (west → east direction)
  const leftAngles = calc.getSetOfAllowedAngles(180);
  
  // Expected: q ∈ [2,3,4] for Q=6
  // q=2: (180 + 2*60) % 360 = 300°
  // q=3: (180 + 3*60) % 360 = 0°   (straight ahead!)
  // q=4: (180 + 4*60) % 360 = 60°
  const expectedLeft = [300, 0, 60];
  
  assert.deepStrictEqual(leftAngles, expectedLeft, 
    `Left seal Q=6 angles incorrect. Got ${leftAngles}, expected ${expectedLeft}`);
  
  // Verify straight ahead interpretation
  assert.strictEqual(leftAngles.includes(0), true, 'Straight ahead (0°) should be included for west→east');
  
  console.log('✅ Q=6 relative angles correct');
}

function testRelativeAnglesQ8() {
  console.log('🧪 Testing relative angles Q=8...');
  
  const calc = new AngleCalculator(8);
  
  // Test left seal entering from 180°
  const leftAngles = calc.getSetOfAllowedAngles(180);
  
  // Expected: q ∈ [3,4,5] for Q=8  
  // q=3: (180 + 3*45) % 360 = 315°
  // q=4: (180 + 4*45) % 360 = 0°   (straight ahead!)
  // q=5: (180 + 5*45) % 360 = 45°
  const expectedLeft = [315, 0, 45];
  
  assert.deepStrictEqual(leftAngles, expectedLeft,
    `Left seal Q=8 angles incorrect. Got ${leftAngles}, expected ${expectedLeft}`);
  
  console.log('✅ Q=8 relative angles correct');
}

function testOppositeExclusion() {
  console.log('🧪 Testing opposite angle exclusion...');
  
  const calc = new AngleCalculator(6);
  
  // Right seal entering from 0° (east), left seal exits at 0° (east)
  // Should exclude 180° (opposite of 0°)
  const rightAngles = calc.getSetOfAllowedAngles(0, 0);
  
  // For right seal from 0°: q ∈ [2,3,4] gives [120°, 180°, 240°]
  // But 180° should be excluded (opposite of left exit 0°)
  const expectedRight = [120, 240]; // 180° excluded
  
  assert.deepStrictEqual(rightAngles, expectedRight,
    `Right seal should exclude opposite. Got ${rightAngles}, expected ${expectedRight}`);
  
  // Test another case
  const rightAngles2 = calc.getSetOfAllowedAngles(0, 120);
  // Should exclude 300° (opposite of 120°)
  // From [120°, 180°, 240°], exclude none (300° not in set anyway)
  const expectedRight2 = [120, 180, 240];
  
  assert.deepStrictEqual(rightAngles2, expectedRight2,
    `Right seal exclusion case 2 failed. Got ${rightAngles2}, expected ${expectedRight2}`);
  
  console.log('✅ Opposite exclusion working correctly');
}

function testCoordinateSystemInterpretation() {
  console.log('🧪 Testing coordinate system interpretation...');
  
  const calc = new AngleCalculator(6);
  
  // Seal entering from 180° (west), straight ahead should be 0° (east)
  const leftAngles = calc.getSetOfAllowedAngles(180);
  assert.strictEqual(leftAngles.includes(0), true, 
    'For west→east entry, straight ahead (0°) should be valid');
  
  // Seal entering from 0° (east), straight ahead should be 180° (west)  
  const rightAngles = calc.getSetOfAllowedAngles(0);
  assert.strictEqual(rightAngles.includes(180), true,
    'For east→west entry, straight ahead (180°) should be valid');
  
  // Test U-turn calculation
  // From 180°, U-turn should be back to 180°
  // q=0: (180 + 0*60) % 360 = 180° (but this is outside our range q ∈ [2,3,4])
  // So U-turn is not in allowed set, which is correct for refraction rule
  
  console.log('✅ Coordinate system interpretation correct');
}

function testEdgeCases() {
  console.log('🧪 Testing edge cases...');
  
  // Test minimum quantization Q=2
  const calc2 = new AngleCalculator(2);
  const range2 = calc2.getQuantizationRange();
  // startQ = Math.floor(2/4) + 1 = 0 + 1 = 1
  // endQ = Math.ceil(3*2/4) - 1 = Math.ceil(1.5) - 1 = 2 - 1 = 1
  assert.strictEqual(range2.startQ, 1, 'Q=2: startQ should be 1');
  assert.strictEqual(range2.endQ, 1, 'Q=2: endQ should be 1');
  
  const angles2 = calc2.getSetOfAllowedAngles(180);
  // q=1: (180 + 1*180) % 360 = 0°
  assert.deepStrictEqual(angles2, [0], 'Q=2 should give one angle');
  
  // Test large quantization Q=24
  const calc24 = new AngleCalculator(24);
  const angles24 = calc24.getSetOfAllowedAngles(180);
  assert.strictEqual(angles24.length > 0, true, 'Q=24 should have valid angles');
  
  console.log('✅ Edge cases handled correctly');
}

function testRepeatedCalls() {
  console.log('🧪 Testing repeated calls and state...');
  
  const calc = new AngleCalculator(6);
  
  // Multiple calls should give same results
  const angles1 = calc.getSetOfAllowedAngles(180);
  const angles2 = calc.getSetOfAllowedAngles(180);
  assert.deepStrictEqual(angles1, angles2, 'Repeated calls should be consistent');
  
  // Changing quantization should affect results
  calc.setQuantization(8);
  const angles3 = calc.getSetOfAllowedAngles(180);
  assert.notDeepStrictEqual(angles1, angles3, 'Quantization change should affect results');
  
  console.log('✅ State management working correctly');
}

// Performance test
function testPerformance() {
  console.log('🧪 Testing performance...');
  
  const calc = new AngleCalculator(24);
  const iterations = 10000;
  
  const start = Date.now();
  for (let i = 0; i < iterations; i++) {
    calc.getSetOfAllowedAngles(Math.random() * 360, Math.random() * 360);
  }
  const elapsed = Date.now() - start;
  
  console.log(`⏱️ ${iterations} angle calculations took ${elapsed}ms (${(elapsed/iterations).toFixed(3)}ms per call)`);
  assert.strictEqual(elapsed < 1000, true, 'Performance should be reasonable');
  
  console.log('✅ Performance acceptable');
}

// Main test runner
function runAllTests() {
  console.log('🚀 Starting BWV Siegel Angle Calculator Tests\n');
  
  const tests = [
    testQuantizationRanges,
    testRelativeAnglesQ6,
    testRelativeAnglesQ8,
    testOppositeExclusion,
    testCoordinateSystemInterpretation,
    testEdgeCases,
    testRepeatedCalls,
    testPerformance
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      test();
      passed++;
    } catch (error) {
      console.error(`\n❌ ${test.name} FAILED:`, error.message);
      console.error(error.stack);
      failed++;
    }
  }
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! The angle calculation logic is working correctly.');
  } else {
    console.log('💥 Some tests failed. Please fix the issues above.');
    process.exit(1);
  }
}

// Run tests
runAllTests();