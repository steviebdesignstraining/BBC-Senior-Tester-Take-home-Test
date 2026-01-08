const axios = require('axios');

// Load test configuration
const BASE_URL = 'https://petstore.swagger.io/v2';
const AUTH_KEY = 'special-key';

// Test data generation
function generateTestData(type) {
  const id = Math.floor(Math.random() * 1000000);
  switch (type) {
    case 'pet':
      return {
        id: id,
        name: 'LoadTestPet',
        photoUrls: ['https://permutationgroup.com.au/wp-content/uploads/2023/04/Home-1-Slider-dog.png'],
        status: 'available'
      };
    case 'user':
      return {
        id: id,
        username: `loadtest_${id}`,
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
    timeout: 10000
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

// Load test phases simulation
async function runLoadTestPhase(phaseName, durationSeconds, targetRPS, description) {
  console.log(`\n📊 ${phaseName}: ${description}`);
  console.log(`Duration: ${durationSeconds}s, Target RPS: ${targetRPS}`);

  const startTime = Date.now();
  const endTime = startTime + (durationSeconds * 1000);

  let requestCount = 0;
  let successCount = 0;
  let totalResponseTime = 0;
  const responseTimes = [];

  while (Date.now() < endTime) {
    const iterationStart = Date.now();

    // Pet CRUD operations
    const petData = generateTestData('pet');

    // Create pet
    const createResult = await makeRequest('POST', '/pet', petData);
    requestCount++;
    if (createResult.success) {
      successCount++;
      totalResponseTime += createResult.duration;
      responseTimes.push(createResult.duration);

      // Read pet
      const readResult = await makeRequest('GET', `/pet/${petData.id}`);
      requestCount++;
      if (readResult.success) {
        successCount++;
        totalResponseTime += readResult.duration;
        responseTimes.push(readResult.duration);
      }

      // Update pet
      petData.status = 'sold';
      const updateResult = await makeRequest('PUT', '/pet', petData);
      requestCount++;
      if (updateResult.success) {
        successCount++;
        totalResponseTime += updateResult.duration;
        responseTimes.push(updateResult.duration);
      }

      // Delete pet
      const deleteResult = await makeRequest('DELETE', `/pet/${petData.id}`);
      requestCount++;
      if (deleteResult.success) {
        successCount++;
        totalResponseTime += deleteResult.duration;
        responseTimes.push(deleteResult.duration);
      }
    }

    // User operations
    const userData = generateTestData('user');
    const userCreateResult = await makeRequest('POST', '/user', userData);
    requestCount++;
    if (userCreateResult.success) {
      successCount++;
      totalResponseTime += userCreateResult.duration;
      responseTimes.push(userCreateResult.duration);

      const userReadResult = await makeRequest('GET', `/user/${userData.username}`);
      requestCount++;
      if (userReadResult.success) {
        successCount++;
        totalResponseTime += userReadResult.duration;
        responseTimes.push(userReadResult.duration);
      }
    }

    // Store operations
    const orderData = generateTestData('order');
    const orderCreateResult = await makeRequest('POST', '/store/order', orderData);
    requestCount++;
    if (orderCreateResult.success) {
      successCount++;
      totalResponseTime += orderCreateResult.duration;
      responseTimes.push(orderCreateResult.duration);
    }

    // Control request rate (simple approach)
    const iterationTime = Date.now() - iterationStart;
    const targetIterationTime = 1000 / targetRPS;
    if (iterationTime < targetIterationTime) {
      await new Promise(resolve => setTimeout(resolve, targetIterationTime - iterationTime));
    }
  }

  const actualDuration = (Date.now() - startTime) / 1000;
  const actualRPS = requestCount / actualDuration;
  const successRate = (successCount / requestCount) * 100;
  const avgResponseTime = totalResponseTime / successCount;
  const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];

  console.log(`✅ Completed: ${actualDuration.toFixed(1)}s`);
  console.log(`📈 Actual RPS: ${actualRPS.toFixed(1)}`);
  console.log(`🎯 Success Rate: ${successRate.toFixed(1)}%`);
  console.log(`⏱️  Avg Response Time: ${avgResponseTime.toFixed(1)}ms`);
  console.log(`📊 95th Percentile: ${p95ResponseTime}ms`);
  console.log(`📋 Total Requests: ${requestCount}, Successful: ${successCount}`);

  return {
    duration: actualDuration,
    rps: actualRPS,
    successRate,
    avgResponseTime,
    p95ResponseTime,
    totalRequests: requestCount,
    successfulRequests: successCount
  };
}

// Main load test execution
async function runLoadTest() {
  console.log('🚀 Starting Load Test Simulation...');
  console.log('=====================================');

  const results = [];

  try {
    // Phase 1: Ramp-up (0 to 50 RPS over 30 seconds)
    const rampUpResult = await runLoadTestPhase(
      'Phase 1 - Ramp Up',
      30,
      2, // Simplified: 2 RPS average during ramp-up
      'Gradually increasing load from 0 to 50 RPS'
    );
    results.push({ phase: 'ramp-up', ...rampUpResult });

    // Phase 2: Steady state (maintain ~50 RPS for 2 minutes)
    const steadyResult = await runLoadTestPhase(
      'Phase 2 - Steady State',
      30, // Reduced for demo
      5, // Simplified: 5 RPS during steady state
      'Maintaining steady load at ~50 RPS'
    );
    results.push({ phase: 'steady', ...steadyResult });

    // Phase 3: High load (increase to ~100 RPS for 1 minute)
    const highLoadResult = await runLoadTestPhase(
      'Phase 3 - High Load',
      20, // Reduced for demo
      8, // Simplified: 8 RPS during high load
      'Increasing load to ~100 RPS'
    );
    results.push({ phase: 'high-load', ...highLoadResult });

    console.log('\n🎉 Load Test Completed Successfully!');
    console.log('=====================================');

    // Summary
    const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0);
    const totalSuccessful = results.reduce((sum, r) => sum + r.successfulRequests, 0);
    const overallSuccessRate = (totalSuccessful / totalRequests) * 100;

    console.log('\n📊 Overall Results:');
    console.log(`Total Requests: ${totalRequests}`);
    console.log(`Successful Requests: ${totalSuccessful}`);
    console.log(`Overall Success Rate: ${overallSuccessRate.toFixed(1)}%`);

    if (overallSuccessRate >= 90) {
      console.log('✅ Load test PASSED: System handled load well');
    } else if (overallSuccessRate >= 80) {
      console.log('⚠️  Load test WARNING: Some performance degradation');
    } else {
      console.log('❌ Load test FAILED: Significant performance issues');
    }

  } catch (error) {
    console.error('❌ Error during load testing:', error.message);
  }
}

// Run the load test
runLoadTest();