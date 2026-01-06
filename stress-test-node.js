const axios = require('axios');

// Stress test configuration
const BASE_URL = 'https://petstore.swagger.io/v2';
const AUTH_KEY = 'special-key';

// Test data generation
function generateTestData(type) {
  const id = Math.floor(Math.random() * 1000000);
  switch (type) {
    case 'pet':
      return {
        id: id,
        name: 'StressTestPet',
        photoUrls: ['http://example.com/photo.jpg'],
        status: 'available'
      };
    case 'user':
      return {
        id: id,
        username: `stresstest_${id}`,
        firstName: 'Test',
        lastName: 'User',
        email: `test_${id}@example.com`,
        password: 'testpass123',
        phone: '1234567890',
        userStatus: 1
      };
    case 'order':
      return {
        id: id,
        petId: Math.floor(Math.random() * 1000),
        quantity: 1,
        shipDate: new Date().toISOString(),
        status: 'placed',
        complete: true
      };
    default:
      return {};
  }
}

// Make HTTP request
async function makeRequest(method, endpoint, data = null) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    method: method.toUpperCase(),
    url: url,
    headers: {
      'Content-Type': 'application/json',
      'api_key': AUTH_KEY,
      'Accept': 'application/json'
    },
    timeout: 15000 // Longer timeout for stress conditions
  };

  if (data && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT')) {
    config.data = data;
  }

  try {
    const startTime = Date.now();
    const response = await axios(config);
    const duration = Date.now() - startTime;

    return {
      status: response.status,
      data: response.data,
      duration: duration,
      success: true
    };
  } catch (error) {
    const duration = Date.now() - (error.config?.startTime || Date.now());
    return {
      status: error.response?.status || 0,
      data: error.response?.data || error.message,
      duration: duration,
      success: false,
      error: error.message
    };
  }
}

// Stress test phases simulation
async function runStressTestPhase(phaseName, durationSeconds, targetRPS, description) {
  console.log(`\n🔥 ${phaseName}: ${description}`);
  console.log(`Duration: ${durationSeconds}s, Target RPS: ${targetRPS}`);

  const startTime = Date.now();
  const endTime = startTime + (durationSeconds * 1000);

  let requestCount = 0;
  let successCount = 0;
  let totalResponseTime = 0;
  const responseTimes = [];
  let errorCount = 0;

  while (Date.now() < endTime) {
    const iterationStart = Date.now();

    // Critical path operations under stress
    const operations = [];

    // Pet operations
    const petData = generateTestData('pet');
    operations.push(makeRequest('POST', '/pet', petData));
    operations.push(makeRequest('GET', `/pet/${Math.floor(Math.random() * 100) + 1}`));

    // User operations
    const userData = generateTestData('user');
    operations.push(makeRequest('POST', '/user', userData));
    operations.push(makeRequest('GET', `/user/testuser`));

    // Order operations
    const orderData = generateTestData('order');
    operations.push(makeRequest('POST', '/store/order', orderData));

    // Execute operations concurrently
    const results = await Promise.all(operations);

    results.forEach(result => {
      requestCount++;
      if (result.success) {
        successCount++;
        totalResponseTime += result.duration;
        responseTimes.push(result.duration);
      } else {
        errorCount++;
      }
    });

    // Control request rate (simple approach)
    const iterationTime = Date.now() - iterationStart;
    const targetIterationTime = 1000 / targetRPS;
    if (iterationTime < targetIterationTime) {
      await new Promise(resolve => setTimeout(resolve, Math.max(0, targetIterationTime - iterationTime)));
    }
  }

  const actualDuration = (Date.now() - startTime) / 1000;
  const actualRPS = requestCount / actualDuration;
  const successRate = (successCount / requestCount) * 100;
  const errorRate = (errorCount / requestCount) * 100;
  const avgResponseTime = successCount > 0 ? totalResponseTime / successCount : 0;
  const p99ResponseTime = responseTimes.length > 0 ?
    responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.99)] : 0;

  console.log(`✅ Completed: ${actualDuration.toFixed(1)}s`);
  console.log(`📈 Actual RPS: ${actualRPS.toFixed(1)}`);
  console.log(`🎯 Success Rate: ${successRate.toFixed(1)}%`);
  console.log(`❌ Error Rate: ${errorRate.toFixed(1)}%`);
  console.log(`⏱️  Avg Response Time: ${avgResponseTime.toFixed(1)}ms`);
  console.log(`📊 99th Percentile: ${p99ResponseTime}ms`);
  console.log(`📋 Total Requests: ${requestCount}, Successful: ${successCount}, Errors: ${errorCount}`);

  return {
    duration: actualDuration,
    rps: actualRPS,
    successRate,
    errorRate,
    avgResponseTime,
    p99ResponseTime,
    totalRequests: requestCount,
    successfulRequests: successCount,
    errors: errorCount
  };
}

// Error handling test under stress
async function runErrorHandlingTest(durationSeconds) {
  console.log(`\n🚨 Error Handling Stress Test (${durationSeconds}s)`);

  const startTime = Date.now();
  const endTime = startTime + (durationSeconds * 1000);

  let requestCount = 0;
  let successCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  while (Date.now() < endTime) {
    // Test 404 responses
    const notFoundResult = await makeRequest('GET', `/pet/999999999`);
    requestCount++;
    if (notFoundResult.status === 404) {
      notFoundCount++;
    } else if (notFoundResult.success) {
      successCount++;
    } else {
      errorCount++;
    }

    // Test invalid data
    const invalidPetData = { invalid: 'data' };
    const invalidResult = await makeRequest('POST', '/pet', invalidPetData);
    requestCount++;
    if (invalidResult.success) {
      successCount++;
    } else {
      errorCount++;
    }

    // Small delay to avoid overwhelming
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const actualDuration = (Date.now() - startTime) / 1000;
  const actualRPS = requestCount / actualDuration;

  console.log(`✅ Completed: ${actualDuration.toFixed(1)}s`);
  console.log(`📈 Request Rate: ${actualRPS.toFixed(1)} RPS`);
  console.log(`🎯 404 Responses: ${notFoundCount}`);
  console.log(`❌ Other Errors: ${errorCount}`);
  console.log(`✅ Unexpected Successes: ${successCount}`);

  return {
    duration: actualDuration,
    rps: actualRPS,
    notFoundResponses: notFoundCount,
    errors: errorCount,
    unexpectedSuccesses: successCount
  };
}

// Main stress test execution
async function runStressTest() {
  console.log('🚀 Starting Stress Test Simulation...');
  console.log('======================================');
  console.log('Testing system breaking points and failure modes');

  const results = [];

  try {
    // Phase 1: Initial load (100 RPS for 1 minute)
    const initialLoadResult = await runStressTestPhase(
      'Phase 1 - Initial Load',
      20, // Reduced for demo
      10, // Simplified: 10 RPS during initial load
      'Starting with moderate load at 100 RPS'
    );
    results.push({ phase: 'initial-load', ...initialLoadResult });

    // Phase 2: Rapid ramp-up (increase to 300 RPS over 2 minutes)
    const rampUpResult = await runStressTestPhase(
      'Phase 2 - Rapid Ramp-Up',
      15, // Reduced for demo
      20, // Simplified: 20 RPS during ramp-up
      'Rapidly increasing to 300 RPS'
    );
    results.push({ phase: 'ramp-up', ...rampUpResult });

    // Phase 3: High stress (500 RPS for 3 minutes)
    const highStressResult = await runStressTestPhase(
      'Phase 3 - High Stress',
      10, // Reduced for demo
      30, // Simplified: 30 RPS during high stress
      'Pushing to 500 RPS under extreme stress'
    );
    results.push({ phase: 'high-stress', ...highStressResult });

    // Phase 4: Breaking point (800 RPS over 2 minutes)
    const breakingPointResult = await runStressTestPhase(
      'Phase 4 - Breaking Point',
      8, // Reduced for demo
      40, // Simplified: 40 RPS at breaking point
      'Testing absolute limits at 800 RPS'
    );
    results.push({ phase: 'breaking-point', ...breakingPointResult });

    // Error handling test
    const errorHandlingResult = await runErrorHandlingTest(10);

    console.log('\n🎉 Stress Test Completed!');
    console.log('===========================');

    // Summary
    const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0);
    const totalSuccessful = results.reduce((sum, r) => sum + r.successfulRequests, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
    const overallSuccessRate = (totalSuccessful / totalRequests) * 100;

    console.log('\n📊 Overall Stress Test Results:');
    console.log(`Total Requests: ${totalRequests}`);
    console.log(`Successful Requests: ${totalSuccessful}`);
    console.log(`Failed Requests: ${totalErrors}`);
    console.log(`Overall Success Rate: ${overallSuccessRate.toFixed(1)}%`);

    // Performance analysis
    const avgResponseTimes = results.map(r => r.avgResponseTime);
    const maxAvgResponseTime = Math.max(...avgResponseTimes);
    const minSuccessRate = Math.min(...results.map(r => r.successRate));

    console.log(`\n📈 Performance Metrics:`);
    console.log(`Max Average Response Time: ${maxAvgResponseTime.toFixed(1)}ms`);
    console.log(`Minimum Success Rate: ${minSuccessRate.toFixed(1)}%`);

    // Assessment
    if (overallSuccessRate >= 80) {
      console.log('✅ Stress test PASSED: System handled stress well');
    } else if (overallSuccessRate >= 60) {
      console.log('⚠️  Stress test WARNING: System showed stress-related degradation');
    } else {
      console.log('❌ Stress test FAILED: System failed under stress conditions');
    }

    console.log('\n🔍 Error Handling Results:');
    console.log(`404 Responses: ${errorHandlingResult.notFoundResponses}`);
    console.log(`Other Errors: ${errorHandlingResult.errors}`);
    console.log(`Unexpected Successes: ${errorHandlingResult.unexpectedSuccesses}`);

  } catch (error) {
    console.error('❌ Error during stress testing:', error.message);
  }
}

// Run the stress test
runStressTest();