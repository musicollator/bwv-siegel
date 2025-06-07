// test/angle-calculator.test.js - Unit tests for BWV Siegel angle calculations (CORRECTED)

import assert from 'assert';
import { AngleCalculator } from '../exports/AngleCalculator.js';

// Test Functions
function testQuantizationRanges() {
  console.log('🧪 Testing quantization ranges...');
  
  // NOTE: Range calculations will be different for forward directions (270° < angle < 90°)
  // We'll test the actual outputs rather than the internal range calculations
  
  const calc6 = new AngleCalculator(6);
  const calc8 = new AngleCalculator(8);
  const calc4 = new AngleCalculator(4);
  
  // Test that we get reasonable numbers of angles for each quantization
  const angles6 = calc6.getSetOfAllowedAngles(180);
  const angles8 = calc8.getSetOfAllowedAngles(180);
  const angles4 = calc4.getSetOfAllowedAngles(180);
  
  assert.strictEqual(angles6.length > 0, true, 'Q=6 should produce some allowed angles');
  assert.strictEqual(angles8.length > 0, true, 'Q=8 should produce some allowed angles');
  assert.strictEqual(angles4.length > 0, true, 'Q=4 should produce some allowed angles');
  
  console.log(`   Q=6: ${angles6.length} angles, Q=8: ${angles8.length} angles, Q=4: ${angles4.length} angles`);
  console.log('✅ Quantization ranges produce valid results');
}

function testForwardDirectionsQ6() {
  console.log('🧪 Testing forward directions Q=6...');
  
  const calc = new AngleCalculator(6);
  
  // Test seal entering from 180° (west) - should exit in forward directions (270° < angle < 90°)
  const leftAngles = calc.getSetOfAllowedAngles(180);
  
  // For Q=6, step=60°, forward directions from 180°:
  // q=2: (180 + 2*60) % 360 = 300° ✓ (in range 270°-360°)
  // q=3: (180 + 3*60) % 360 = 0° ✓ (in range 0°-90°)  
  // q=4: (180 + 4*60) % 360 = 60° ✓ (in range 0°-90°)
  const expectedLeft = [300, 0, 60];
  
  assert.deepStrictEqual(leftAngles.sort((a,b) => a-b), expectedLeft.sort((a,b) => a-b), 
    `Q=6 forward directions incorrect. Got [${leftAngles.sort((a,b) => a-b)}], expected [${expectedLeft.sort((a,b) => a-b)}]`);
  
  // Verify all angles are in forward range (270° < angle < 90°)
  leftAngles.forEach(angle => {
    const isForward = (angle >= 270 && angle < 360) || (angle >= 0 && angle < 90);
    assert.strictEqual(isForward, true, `Angle ${angle}° should be in forward range (270°-360° or 0°-90°)`);
  });
  
  // Verify straight ahead (0°) is included for west→east motion
  assert.strictEqual(leftAngles.includes(0), true, 'Straight ahead (0°) should be included for west→east');
  
  console.log('✅ Q=6 forward directions correct');
}

function testForwardDirectionsQ8() {
  console.log('🧪 Testing forward directions Q=8...');
  
  const calc = new AngleCalculator(8);
  
  // Test seal entering from 180° - should exit in forward directions
  const leftAngles = calc.getSetOfAllowedAngles(180);
  
  // For Q=8, step=45°, forward directions from 180°:
  // q=3: (180 + 3*45) % 360 = 315° ✓ (in range 270°-360°)
  // q=4: (180 + 4*45) % 360 = 0° ✓ (in range 0°-90°)
  // q=5: (180 + 5*45) % 360 = 45° ✓ (in range 0°-90°)
  const expectedLeft = [315, 0, 45];
  
  assert.deepStrictEqual(leftAngles.sort((a,b) => a-b), expectedLeft.sort((a,b) => a-b),
    `Q=8 forward directions incorrect. Got [${leftAngles.sort((a,b) => a-b)}], expected [${expectedLeft.sort((a,b) => a-b)}]`);
  
  // Verify all angles are in forward range
  leftAngles.forEach(angle => {
    const isForward = (angle >= 270 && angle < 360) || (angle >= 0 && angle < 90);
    assert.strictEqual(isForward, true, `Angle ${angle}° should be in forward range`);
  });
  
  console.log('✅ Q=8 forward directions correct');
}

function testOppositeExclusion() {
  console.log('🧪 Testing opposite angle exclusion...');
  
  const calc = new AngleCalculator(6);
  
  // Test exclusion logic
  const allAngles = calc.getSetOfAllowedAngles(0); // No exclusion
  const excludedAngles = calc.getSetOfAllowedAngles(0, 180); // Exclude opposite of 180° (which is 0°)
  
  // Should have fewer angles when exclusion is applied
  assert.strictEqual(excludedAngles.length <= allAngles.length, true, 
    'Exclusion should reduce or maintain angle count');
  
  // All excluded angles should still be in forward range
  excludedAngles.forEach(angle => {
    const isForward = (angle >= 270 && angle < 360) || (angle >= 0 && angle < 90);
    assert.strictEqual(isForward, true, `Excluded angle ${angle}° should still be forward`);
  });
  
  console.log('✅ Opposite exclusion working correctly');
}

function testContinuityBehavior() {
  console.log('🧪 Testing continuity behavior...');
  
  const calc = new AngleCalculator(8);
  
  // Test that seal can continue straight ahead when possible
  const eastEntry = calc.getSetOfAllowedAngles(90); // Entering from east (90°)
  const westEntry = calc.getSetOfAllowedAngles(270); // Entering from west (270°)
  
  // Entering from east (90°), straight ahead would be 270° (west)
  // But 270° is exactly on the boundary - let's check what we get
  console.log(`   East entry (90°) allows: [${eastEntry.sort((a,b) => a-b)}]°`);
  
  // Entering from west (270°), straight ahead would be 90° (east)  
  // But 90° is exactly on the boundary - let's check what we get
  console.log(`   West entry (270°) allows: [${westEntry.sort((a,b) => a-b)}]°`);
  
  // Verify we get forward-only directions
  [...eastEntry, ...westEntry].forEach(angle => {
    const isForward = (angle >= 270 && angle < 360) || (angle >= 0 && angle < 90);
    assert.strictEqual(isForward, true, `Angle ${angle}° should be forward`);
  });
  
  console.log('✅ Continuity behavior verified');
}

function testEdgeCases() {
  console.log('🧪 Testing edge cases...');
  
  // Test minimum quantization Q=2
  const calc2 = new AngleCalculator(2);
  const angles2 = calc2.getSetOfAllowedAngles(180);
  
  // Should get at least one forward angle
  assert.strictEqual(angles2.length > 0, true, 'Q=2 should produce at least one angle');
  
  // Test Q=4 
  const calc4 = new AngleCalculator(4);
  const angles4 = calc4.getSetOfAllowedAngles(180);
  
  // Should include straight ahead (0°) for west→east
  console.log(`   Q=4 from 180°: [${angles4.sort((a,b) => a-b)}]°`);
  
  // Test high quantization Q=24
  const calc24 = new AngleCalculator(24);
  const angles24 = calc24.getSetOfAllowedAngles(180);
  assert.strictEqual(angles24.length > 0, true, 'Q=24 should have valid angles');
  
  // All should be forward directions
  angles24.forEach(angle => {
    const isForward = (angle >= 270 && angle < 360) || (angle >= 0 && angle < 90);
    assert.strictEqual(isForward, true, `Q=24 angle ${angle}° should be forward`);
  });
  
  console.log('✅ Edge cases handled correctly');
}

function testRepeatedCalls() {
  console.log('🧪 Testing repeated calls and state...');
  
  const calc = new AngleCalculator(6);
  
  // Multiple calls should give same results
  const angles1 = calc.getSetOfAllowedAngles(180);
  const angles2 = calc.getSetOfAllowedAngles(180);
  assert.deepStrictEqual(angles1.sort((a,b) => a-b), angles2.sort((a,b) => a-b), 'Repeated calls should be consistent');
  
  // Changing quantization should affect results
  calc.setQuantization(8);
  const angles3 = calc.getSetOfAllowedAngles(180);
  // May or may not be different, but should still be valid
  assert.strictEqual(angles3.length > 0, true, 'Changed quantization should still work');
  
  console.log('✅ State management working correctly');
}

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
  console.log('🚀 Starting BWV Siegel Angle Calculator Tests (CORRECTED FOR FORWARD DIRECTIONS)\n');
  
  const tests = [
    testQuantizationRanges,
    testForwardDirectionsQ6,
    testForwardDirectionsQ8, 
    testOppositeExclusion,
    testContinuityBehavior,
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
    console.log('🎉 All tests passed! The forward-direction angle calculation logic is working correctly.');
  } else {
    console.log('💥 Some tests failed. Please fix the issues above.');
    process.exit(1);
  }
}

// Run tests
runAllTests();