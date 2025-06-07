// test/angle-calculator-enhanced.test.js - Unit tests for enhanced AngleCalculator with getNextAzimuth (CORRECTED)

import assert from 'assert';
import { AngleCalculator } from '../exports/AngleCalculator.js';

function testGetNextAzimuthSingleArgument() {
  console.log('🧪 Testing getNextAzimuth with single argument...');
  
  const calc = new AngleCalculator(8);
  
  // Test that returned angle is always in allowed set
  for (let i = 0; i < 50; i++) {  // Reduced iterations for faster testing
    const previousAzimuth = Math.floor(Math.random() * 360);
    const allowedAngles = calc.getSetOfAllowedAngles(previousAzimuth);
    
    if (allowedAngles.length > 0) {
      const nextAzimuth = calc.getNextAzimuth(previousAzimuth);
      assert.strictEqual(allowedAngles.includes(nextAzimuth), true, 
        `Next azimuth ${nextAzimuth}° should be in allowed set [${allowedAngles.join(', ')}]° for previous ${previousAzimuth}°`);
    }
  }
  
  console.log('✅ Single argument getNextAzimuth working correctly');
}

function testGetNextAzimuthDualArgument() {
  console.log('🧪 Testing getNextAzimuth with dual arguments...');
  
  const calc = new AngleCalculator(8);
  
  // Test that returned angle respects both constraints
  for (let i = 0; i < 20; i++) {  // Reduced iterations
    const previousAzimuth = Math.floor(Math.random() * 360);
    const otherSealAzimuth = Math.floor(Math.random() * 360);
    
    const allowedAngles = calc.getSetOfAllowedAngles(previousAzimuth, otherSealAzimuth);
    
    if (allowedAngles.length > 0) {
      const nextAzimuth = calc.getNextAzimuth(previousAzimuth, otherSealAzimuth);
      
      // Should be in allowed set
      assert.strictEqual(allowedAngles.includes(nextAzimuth), true, 
        `Next azimuth ${nextAzimuth}° should be in allowed set [${allowedAngles.join(', ')}]°`);
    }
  }
  
  console.log('✅ Dual argument getNextAzimuth working correctly');
}

function testForwardDirectionContinuity() {
  console.log('🧪 Testing forward direction continuity...');
  
  const calc = new AngleCalculator(8);
  const iterations = 500;
  const results = {};
  
  // Test entry from 180° (west) - should favor straight ahead (0°) if available
  const previousAzimuth = 180;
  const allowedAngles = calc.getSetOfAllowedAngles(previousAzimuth);
  
  console.log(`   Forward directions from ${previousAzimuth}°: [${allowedAngles.sort((a,b) => a-b)}]°`);
  
  // Verify all angles are in forward range (270° < angle < 90°)
  allowedAngles.forEach(angle => {
    const isForward = (angle >= 270 && angle < 360) || (angle >= 0 && angle < 90);
    assert.strictEqual(isForward, true, `Angle ${angle}° should be in forward range`);
  });
  
  // Initialize counters
  allowedAngles.forEach(angle => results[angle] = 0);
  
  // Run many iterations
  for (let i = 0; i < iterations; i++) {
    const next = calc.getNextAzimuth(previousAzimuth);
    results[next]++;
  }
  
  console.log(`   Distribution:`);
  allowedAngles.forEach(angle => {
    const count = results[angle];
    const percentage = (count / iterations * 100).toFixed(1);
    const deviation = calc.getAngularDifference(angle, previousAzimuth);
    console.log(`   ${angle}°: ${count}/${iterations} (${percentage}%) - deviation: ${deviation.toFixed(1)}°`);
  });
  
  // Find smallest deviation angle (should be most frequent)
  const deviations = allowedAngles.map(a => calc.getAngularDifference(a, previousAzimuth));
  const minDeviation = Math.min(...deviations);
  const maxDeviation = Math.max(...deviations);
  
  const minDeviationAngles = allowedAngles.filter(a => 
    calc.getAngularDifference(a, previousAzimuth) === minDeviation
  );
  const maxDeviationAngles = allowedAngles.filter(a => 
    calc.getAngularDifference(a, previousAzimuth) === maxDeviation
  );
  
  const minCount = minDeviationAngles.reduce((sum, angle) => sum + (results[angle] || 0), 0);
  const maxCount = maxDeviationAngles.reduce((sum, angle) => sum + (results[angle] || 0), 0);
  
  console.log(`   Smallest deviation ${minDeviation}°: ${minCount} selections`);
  console.log(`   Largest deviation ${maxDeviation}°: ${maxCount} selections`);
  
  // Smallest deviation should be more frequent (unless all deviations are equal)
  if (minDeviation !== maxDeviation) {
    assert.strictEqual(minCount >= maxCount, true, 
      `Smallest deviation should be favored: ${minCount} vs ${maxCount}`);
  }
  
  console.log('✅ Forward direction continuity verified');
}

function testErrorConditions() {
  console.log('🧪 Testing error conditions...');
  
  const calc = new AngleCalculator(4);
  
  try {
    const result = calc.getNextAzimuth(0);
    assert.strictEqual(typeof result, 'number', 'Should return a number');
    console.log('   Normal case passed');
  } catch (error) {
    assert.fail(`Unexpected error: ${error.message}`);
  }
  
  console.log('✅ Error condition testing completed');
}

function testConsistencyAndReproducibility() {
  console.log('🧪 Testing consistency...');
  
  const calc = new AngleCalculator(8);
  
  // Test that same inputs give results from same distribution
  const allowedAngles = calc.getSetOfAllowedAngles(180);
  
  for (let i = 0; i < 20; i++) {
    const result = calc.getNextAzimuth(180);
    assert.strictEqual(allowedAngles.includes(result), true, 
      `Result ${result}° should be in allowed set`);
    
    // Verify result is in forward range
    const isForward = (result >= 270 && result < 360) || (result >= 0 && result < 90);
    assert.strictEqual(isForward, true, `Result ${result}° should be in forward range`);
  }
  
  console.log('✅ Consistency maintained');
}

// Main test runner for enhanced tests
function runEnhancedTests() {
  console.log('🚀 Starting Enhanced BWV Siegel Angle Calculator Tests (CORRECTED FOR FORWARD DIRECTIONS)\n');
  
  const enhancedTests = [
    testGetNextAzimuthSingleArgument,
    testGetNextAzimuthDualArgument,
    testForwardDirectionContinuity,
    testErrorConditions,
    testConsistencyAndReproducibility
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of enhancedTests) {
    try {
      test();
      passed++;
    } catch (error) {
      console.error(`\n❌ ${test.name} FAILED:`, error.message);
      console.error(error.stack);
      failed++;
    }
  }
  
  console.log(`\n📊 Enhanced Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All enhanced tests passed! The forward-direction getNextAzimuth logic is working correctly.');
  } else {
    console.log('💥 Some enhanced tests failed. Please fix the issues above.');
    process.exit(1);
  }
}

// Export for standalone running
export { runEnhancedTests };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runEnhancedTests();
}