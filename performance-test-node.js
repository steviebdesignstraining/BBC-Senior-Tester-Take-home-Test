const axios = require('axios');

// Performance test configuration
const BASE_URL = 'https://petstore.swagger.io/v2';
const AUTH_KEY = 'special-key';
const TEST_DURATION = 30000; // 30 seconds
const CONCURRENT_REQUESTS = 5;

// Test data generation
function generateTestData(type) {
  const id = Math.floor(Math.random() * 1000000);
  switch (type) {
    case 'pet':
      return {
        id: id,
        name: 'PerformanceTestPet',
        photoUrls: ['https://permutationgroup.com.au/wp-content/uploads/2023/04/Home-1-Slider-dog.png'],
        status: 'available'
      };
    case 'user':
      return {
        id: id,
        username: `perftest_${id}`,
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
    const response = await axios(config);
    return {
      status: response.status,
      data: response.data,
      duration: response.duration || 0,
      success: true
    };
  } catch (error) {
    return {
      status: error.response?.status || 0,
      data: error.response?.data || error.message,
      duration: error.duration || 0,
      success: false,
      error: error.message
    };
  }
}

// Performance test scenarios
async function runBaselinePerformance() {
  console.log('🧪 Running Baseline API Performance Test...');

  const results = {
    create: [],
    read: [],
    update: [],
    delete: []
  };

  for (let i = 0; i < 10; i++) {
    const petData = generateTestData('pet');

    // Create
    const createStart = Date.now();
    const createResult = await makeRequest('POST', '/pet', petData);
    const createTime = Date.now() - createStart;
    results.create.push({ time: createTime, success: createResult.success });

    if (createResult.success) {
      // Read
      const readStart = Date.now();
      const readResult = await makeRequest('GET', `/pet/${petData.id}`);
      const readTime = Date.now() - readStart;
      results.read.push({ time: readTime, success: readResult.success });

      // Update
      petData.status = 'sold';
      const updateStart = Date.now();
      const updateResult = await makeRequest('PUT', '/pet', petData);
      const updateTime = Date.now() - updateStart;
      results.update.push({ time: updateTime, success: updateResult.success });

      // Delete
      const deleteStart = Date.now();
      const deleteResult = await makeRequest('DELETE', `/pet/${petData.id}`);
      const deleteTime = Date.now() - deleteStart;
      results.delete.push({ time: deleteTime, success: deleteResult.success });
    }

    console.log(`  Iteration ${i + 1}/10 completed`);
  }

  return results;
}

async function runConcurrentOperations() {
  console.log('🔄 Running Concurrent Operations Test...');

  const operations = [];
  for (let i = 0; i < 20; i++) {
    operations.push(
      makeRequest('GET', `/pet/${Math.floor(Math.random() * 100) + 1}`),
      makeRequest('GET', `/user/testuser`),
      makeRequest('GET', '/store/inventory')
    );
  }

  const startTime = Date.now();
  const results = await Promise.all(operations);
  const totalTime = Date.now() - startTime;

  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;

  return {
    totalRequests: results.length,
    successful,
    failed,
    totalTime,
    avgResponseTime: totalTime / results.length
  };
}

// Main test execution
async function runPerformanceTests() {
  console.log('🚀 Starting Performance Tests...\n');

  try {
    // Test 1: Baseline Performance
    const baselineResults = await runBaselinePerformance();

    console.log('\n📊 Baseline Performance Results:');
    console.log('================================');

    ['create', 'read', 'update', 'delete'].forEach(operation => {
      const times = baselineResults[operation].map(r => r.time);
      const successful = baselineResults[operation].filter(r => r.success).length;
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

      console.log(`${operation.toUpperCase()}:`);
      console.log(`  Average response time: ${avgTime.toFixed(2)}ms`);
      console.log(`  Success rate: ${successful}/${baselineResults[operation].length}`);
      console.log(`  Min/Max time: ${Math.min(...times)}ms / ${Math.max(...times)}ms`);
      console.log('');
    });

    // Test 2: Concurrent Operations
    const concurrentResults = await runConcurrentOperations();

    console.log('📊 Concurrent Operations Results:');
    console.log('=================================');
    console.log(`Total requests: ${concurrentResults.totalRequests}`);
    console.log(`Successful: ${concurrentResults.successful}`);
    console.log(`Failed: ${concurrentResults.failed}`);
    console.log(`Total time: ${concurrentResults.totalTime}ms`);
    console.log(`Average response time: ${concurrentResults.avgResponseTime.toFixed(2)}ms`);
    console.log(`Requests per second: ${(concurrentResults.totalRequests / (concurrentResults.totalTime / 1000)).toFixed(2)}`);

    console.log('\n✅ Performance tests completed successfully!');

  } catch (error) {
    console.error('❌ Error during performance testing:', error.message);
  }
}

// Run the tests
runPerformanceTests();