// k6 Performance Test - Measures system performance under various load conditions
import { group, sleep, check } from 'k6';
import config, { makeRequest, validateResponse, generateTestData } from './config.js';

// Performance test configuration
const performanceTestConfig = {
  stages: [
    { duration: '30s', target: 10, name: 'ramp-up' },      // Light load
    { duration: '1m', target: 10, name: 'steady' },        // Steady state
    { duration: '30s', target: 50, name: 'medium-load' },  // Medium load
    { duration: '1m', target: 50, name: 'sustained' },     // Sustained medium load
    { duration: '30s', target: 100, name: 'high-load' },   // High load
    { duration: '1m', target: 100, name: 'peak' },         // Peak load
    { duration: '30s', target: 0, name: 'ramp-down' }      // Cooldown
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],      // Allow up to 5% failed requests
    http_req_duration: ['p(95)<2000'],   // 95% of requests under 2s
    checks: ['rate>0.95']               // 95% of checks pass
  }
};

export const options = performanceTestConfig;

export default function () {
  // Test Pet Endpoints
  group('Pet API Performance Tests', function () {
    // Create Pet
    const petData = generateTestData('pet');
    const createResponse = makeRequest('POST', config.endpoints.pet, petData, {
      tags: { name: 'pet_performance_create' }
    });
    validateResponse(createResponse, { status: 200 });
    
    // Get Pet by ID
    const getResponse = makeRequest('GET', `${config.endpoints.pet}/${petData.id}`, null, {
      tags: { name: 'pet_performance_read' }
    });
    validateResponse(getResponse, { status: 200 });
    
    // Update Pet
    petData.status = 'sold';
    const updateResponse = makeRequest('PUT', config.endpoints.pet, petData, {
      tags: { name: 'pet_performance_update' }
    });
    validateResponse(updateResponse, { status: 200 });
    
    sleep(0.5); // Shorter think time for performance testing
  });

  // Test User Endpoints
  group('User API Performance Tests', function () {
    // Create User
    const userData = generateTestData('user');
    const createResponse = makeRequest('POST', config.endpoints.user, userData, {
      tags: { name: 'user_performance_create' }
    });
    validateResponse(createResponse, { status: 200 });
    
    // Get User by Username
    const getResponse = makeRequest('GET', `${config.endpoints.user}/${userData.username}`, null, {
      tags: { name: 'user_performance_read' }
    });
    validateResponse(getResponse, { status: 200 });
    
    sleep(0.5);
  });

  // Test Store Endpoints
  group('Store API Performance Tests', function () {
    // Create Order
    const orderData = generateTestData('order');
    const createResponse = makeRequest('POST', config.endpoints.store + '/order', orderData, {
      tags: { name: 'order_performance_create' }
    });
    validateResponse(createResponse, { status: 200 });
    
    // Get Order by ID
    const getResponse = makeRequest('GET', `${config.endpoints.store}/order/${orderData.id}`, null, {
      tags: { name: 'order_performance_read' }
    });
    validateResponse(getResponse, { status: 200 });
    
    sleep(0.5);
  });
}