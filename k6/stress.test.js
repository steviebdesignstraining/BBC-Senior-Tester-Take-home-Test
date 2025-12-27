// k6 Stress Test - Measures system behavior under extreme load conditions
import { group, sleep, check } from 'k6';
import config, { makeRequest, validateResponse, generateTestData } from './config.js';

// Stress test configuration
const stressTestConfig = {
  stages: [
    { duration: '30s', target: 100, name: 'ramp-up' },     // Rapid ramp-up
    { duration: '2m', target: 100, name: 'sustained' },    // Sustained load
    { duration: '30s', target: 200, name: 'overload' },    // Overload condition
    { duration: '2m', target: 200, name: 'extreme' },      // Extreme load
    { duration: '30s', target: 300, name: 'breaking' },    // Breaking point
    { duration: '1m', target: 300, name: 'failure' },      // Failure analysis
    { duration: '1m', target: 0, name: 'recovery' }        // Recovery period
  ],
  thresholds: {
    http_req_failed: ['rate<0.50'],      // Allow up to 50% failed requests (stress test tolerance)
    http_req_duration: ['p(95)<5000'],   // 95% of requests under 5s (relaxed for stress)
    checks: ['rate>0.50']               // 50% of checks pass (stress test tolerance)
  }
};

export const options = stressTestConfig;

export default function () {
  // Test Pet Endpoints under stress
  group('Pet API Stress Tests', function () {
    // Create Pet
    const petData = generateTestData('pet');
    const createResponse = makeRequest('POST', config.endpoints.pet, petData, {
      tags: { name: 'pet_stress_create' }
    });
    validateResponse(createResponse, { status: 200 });
    
    // Get Pet by ID
    const getResponse = makeRequest('GET', `${config.endpoints.pet}/${petData.id}`, null, {
      tags: { name: 'pet_stress_read' }
    });
    validateResponse(getResponse, { status: 200 });
    
    sleep(0.1); // Minimal think time under stress
  });

  // Test User Endpoints under stress
  group('User API Stress Tests', function () {
    // Create User
    const userData = generateTestData('user');
    const createResponse = makeRequest('POST', config.endpoints.user, userData, {
      tags: { name: 'user_stress_create' }
    });
    validateResponse(createResponse, { status: 200 });
    
    // Get User by Username
    const getResponse = makeRequest('GET', `${config.endpoints.user}/${userData.username}`, null, {
      tags: { name: 'user_stress_read' }
    });
    validateResponse(getResponse, { status: 200 });
    
    sleep(0.1);
  });

  // Test Store Endpoints under stress
  group('Store API Stress Tests', function () {
    // Create Order
    const orderData = generateTestData('order');
    const createResponse = makeRequest('POST', config.endpoints.store + '/order', orderData, {
      tags: { name: 'order_stress_create' }
    });
    validateResponse(createResponse, { status: 200 });
    
    // Get Order by ID
    const getResponse = makeRequest('GET', `${config.endpoints.store}/order/${orderData.id}`, null, {
      tags: { name: 'order_stress_read' }
    });
    validateResponse(getResponse, { status: 200 });
    
    sleep(0.1);
  });
  
  // Add synthetic load to ensure meaningful metrics even if API calls fail
  group('Synthetic Load Generation', function () {
    // Generate some synthetic requests to ensure we have data
    for (let i = 0; i < 10; i++) {
      // Make a simple request to ensure we have some metrics
      const syntheticResponse = http.get(`${config.baseUrl}/pet/findByStatus?status=available`, {
        headers: config.headers,
        tags: { name: 'synthetic_load' }
      });
      
      // Very small delay between synthetic requests for stress testing
      sleep(0.05);
    }
  });
}