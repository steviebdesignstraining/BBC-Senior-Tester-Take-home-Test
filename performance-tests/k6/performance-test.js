// k6 Performance Test - Measures response times, throughput, and resource usage
import { group, sleep, check } from 'k6';
import config, { makeRequest, validateResponse, generateTestData } from './config.js';

// Performance test configuration
const performanceTestConfig = {
  scenarios: {
    baseline: {
      executor: 'constant-vus',
      vus: 20,
      duration: '5m'
    },
    peak: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '3m', target: 50 },
        { duration: '1m', target: 10 }
      ],
      gracefulRampDown: '30s'
    }
  },
  thresholds: {
    http_req_duration: ['avg<500', 'p(90)<800', 'p(95)<1000'],
    http_req_failed: ['rate<0.01'],  // Less than 1% failures
    checks: ['rate>0.99'],          // 99% of checks pass
    data_received: ['<1000000'],     // Less than 1MB received per VU
    data_sent: ['<500000']          // Less than 500KB sent per VU
  }
};

export const options = performanceTestConfig;

export default function () {
  // Performance metrics collection
  group('Performance Metrics Collection', function () {
    
    // Test 1: Baseline API performance
    group('Baseline API Performance', function () {
      const petData = generateTestData('pet');
      const startTime = new Date();
      
      // Create operation
      const createResponse = makeRequest('POST', config.endpoints.pet, petData);
      validateResponse(createResponse, { status: 200, maxResponseTime: 500 });
      
      // Read operation
      const readResponse = makeRequest('GET', `${config.endpoints.pet}/${petData.id}`);
      validateResponse(readResponse, { status: 200, maxResponseTime: 300 });
      
      // Update operation
      petData.status = 'sold';
      const updateResponse = makeRequest('PUT', config.endpoints.pet, petData);
      validateResponse(updateResponse, { status: 200, maxResponseTime: 500 });
      
      // Delete operation
      const deleteResponse = makeRequest('DELETE', `${config.endpoints.pet}/${petData.id}`);
      validateResponse(deleteResponse, { status: 200, maxResponseTime: 300 });
      
      const endTime = new Date();
      const totalTime = endTime - startTime;
      
      // Custom metric for total transaction time
      const metrics = {
        pet_crud_transaction_time: totalTime
      };
      
      sleep(1);
    });

    // Test 2: Concurrent operations
    group('Concurrent Operations Performance', function () {
      const userData = generateTestData('user');
      const orderData = generateTestData('order');
      
      // Parallel operations
      const responses = http.batch([
        ['POST', `${config.baseUrl}${config.endpoints.user}`, JSON.stringify(userData), { headers: config.headers }],
        ['POST', `${config.baseUrl}${config.endpoints.store}/order`, JSON.stringify(orderData), { headers: config.headers }],
        ['GET', `${config.baseUrl}${config.endpoints.pet}/1`, null, { headers: config.headers }]
      ]);
      
      responses.forEach((response, index) => {
        validateResponse({
          status: response.status,
          timings: { duration: response.timings.duration }
        }, { status: 200, maxResponseTime: 1000 });
      });
      
      sleep(1);
    });

    // Test 3: Response size analysis
    group('Response Size Analysis', function () {
      // Test different endpoint response sizes
      const endpointsToTest = [
        { name: 'pet', path: `${config.endpoints.pet}/1` },
        { name: 'user', path: `${config.endpoints.user}/testuser` },
        { name: 'store', path: `${config.endpoints.store}/inventory` }
      ];
      
      endpointsToTest.forEach((endpoint) => {
        const response = makeRequest('GET', endpoint.path);
        
        check(response, {
          [`${endpoint.name} response size reasonable`]: (r) => 
            r.body.length > 10 && r.body.length < 10000 && r.timings.duration < 1000
        });
        
        sleep(0.5);
      });
    });

    // Test 4: Caching behavior
    group('Caching Behavior Analysis', function () {
      // Make multiple identical requests to test caching
      for (let i = 0; i < 5; i++) {
        const response = makeRequest('GET', `${config.endpoints.pet}/1`);
        validateResponse(response, { status: 200, maxResponseTime: 500 });
        sleep(0.2);
      }
    });

    // Test 5: Long-running transaction simulation
    group('Long Transaction Simulation', function () {
      const complexUserData = generateTestData('user');
      const complexPetData = generateTestData('pet');
      const complexOrderData = generateTestData('order');
      
      // Simulate complex user journey
      const createUser = makeRequest('POST', config.endpoints.user, complexUserData);
      validateResponse(createUser, { status: 200, maxResponseTime: 800 });
      
      const createPet = makeRequest('POST', config.endpoints.pet, complexPetData);
      validateResponse(createPet, { status: 200, maxResponseTime: 800 });
      
      complexOrderData.petId = complexPetData.id;
      const createOrder = makeRequest('POST', config.endpoints.store + '/order', complexOrderData);
      validateResponse(createOrder, { status: 200, maxResponseTime: 800 });
      
      // Verify order
      const getOrder = makeRequest('GET', `${config.endpoints.store}/order/${complexOrderData.id}`);
      validateResponse(getOrder, { status: 200, maxResponseTime: 500 });
      
      sleep(1);
    });
  });
}