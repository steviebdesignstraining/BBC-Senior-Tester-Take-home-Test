// k6 Stress Test - Determines breaking point and failure modes
import { group, sleep, check } from 'k6';
import config, { makeRequest, validateResponse, generateTestData } from './config.js';

// Stress test configuration - aggressive ramp-up to find breaking point
const stressTestConfig = {
  stages: [
    { duration: '1m', target: 100, name: 'initial-load' },      // Start with moderate load
    { duration: '2m', target: 300, name: 'ramp-up' },           // Rapid increase
    { duration: '3m', target: 500, name: 'high-stress' },       // High stress level
    { duration: '2m', target: 800, name: 'breaking-point' },    // Push to breaking point
    { duration: '1m', target: 0, name: 'recovery' }             // Recovery phase
  ],
  thresholds: {
    http_req_failed: ['rate<0.1'],        // Allow up to 10% failures under stress
    http_req_duration: ['p(99)<3000'],    // 99% of requests under 3s
    checks: ['rate>0.8']                 // 80% of checks pass (more lenient for stress)
  }
};

export const options = stressTestConfig;

export default function () {
  // Focus on most critical endpoints during stress testing
  group('Critical Path Stress Tests', function () {
    
    // Pet creation and retrieval - most common operations
    const petData = generateTestData('pet');
    const createPetResponse = makeRequest('POST', config.endpoints.pet, petData);
    validateResponse(createPetResponse, { status: 200, maxResponseTime: 5000 });
    
    const getPetResponse = makeRequest('GET', `${config.endpoints.pet}/${petData.id}`);
    validateResponse(getPetResponse, { status: 200, maxResponseTime: 5000 });
    
    // User authentication flow
    const userData = generateTestData('user');
    const createUserResponse = makeRequest('POST', config.endpoints.user, userData);
    validateResponse(createUserResponse, { status: 200, maxResponseTime: 5000 });
    
    const getUserResponse = makeRequest('GET', `${config.endpoints.user}/${userData.username}`);
    validateResponse(getUserResponse, { status: 200, maxResponseTime: 5000 });
    
    // Order processing
    const orderData = generateTestData('order');
    const createOrderResponse = makeRequest('POST', config.endpoints.store + '/order', orderData);
    validateResponse(createOrderResponse, { status: 200, maxResponseTime: 5000 });
    
    sleep(0.5); // Reduced think time for stress conditions
  });

  // Test error handling under stress
  group('Error Handling Stress Tests', function () {
    // Test 404 responses
    const notFoundResponse = makeRequest('GET', `${config.endpoints.pet}/999999999`);
    validateResponse(notFoundResponse, { status: 404, maxResponseTime: 3000 });
    
    // Test invalid data
    const invalidPetData = { invalid: 'data' };
    const invalidResponse = makeRequest('POST', config.endpoints.pet, invalidPetData);
    // Just check it responds, don't validate status as it may vary
    check(invalidResponse, { 'server responded to invalid data': (r) => r.timings.duration < 5000 });
    
    sleep(0.5);
  });
}