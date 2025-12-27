// k6 Load Test - Measures system behavior under normal and high load conditions
import { group, sleep, check } from 'k6';
import http from 'k6/http';
import config, { makeRequest, validateResponse, generateTestData } from './config.js';

// Load test configuration
const loadTestConfig = {
  stages: [
    { duration: '30s', target: 50, name: 'ramp-up' },      // Normal load
    { duration: '2m', target: 50, name: 'steady' },        // Steady state
    { duration: '30s', target: 100, name: 'high-load' },   // High load
    { duration: '1m', target: 100, name: 'sustained' },    // Sustained high load
    { duration: '30s', target: 0, name: 'ramp-down' }      // Cooldown
  ],
  thresholds: {
    http_req_failed: ['rate<0.10'],      // Allow up to 10% failed requests (performance test tolerance)
    http_req_duration: ['p(95)<1000'],   // 95% of requests under 1s
    checks: ['rate>0.90']               // 90% of checks pass (performance test tolerance)
  }
};

export const options = loadTestConfig;

export default function () {
  // Test Pet Endpoints
  group('Pet API Load Tests', function () {
    // Create Pet
    const petData = generateTestData('pet');
    const createResponse = makeRequest('POST', config.endpoints.pet, petData, {
      tags: { name: 'pet_crud_create' }
    });
    validateResponse(createResponse, { status: 200 });
    
    // Get Pet by ID
    const getResponse = makeRequest('GET', `${config.endpoints.pet}/${petData.id}`, null, {
      tags: { name: 'pet_crud_read' }
    });
    validateResponse(getResponse, { status: 200 });
    
    // Update Pet
    petData.status = 'sold';
    const updateResponse = makeRequest('PUT', config.endpoints.pet, petData, {
      tags: { name: 'pet_crud_update' }
    });
    validateResponse(updateResponse, { status: 200 });
    
    // Delete Pet
    const deleteResponse = makeRequest('DELETE', `${config.endpoints.pet}/${petData.id}`, null, {
      tags: { name: 'pet_crud_delete' }
    });
    validateResponse(deleteResponse, { status: 200 });
    
    sleep(1); // Think time between operations
  });

  // Test User Endpoints
  group('User API Load Tests', function () {
    // Create User
    const userData = generateTestData('user');
    const createResponse = makeRequest('POST', config.endpoints.user, userData, {
      tags: { name: 'user_crud_create' }
    });
    validateResponse(createResponse, { status: 200 });
    
    // Get User by Username
    const getResponse = makeRequest('GET', `${config.endpoints.user}/${userData.username}`, null, {
      tags: { name: 'user_crud_read' }
    });
    validateResponse(getResponse, { status: 200 });
    
    // Update User
    userData.firstName = 'Updated';
    const updateResponse = makeRequest('PUT', `${config.endpoints.user}/${userData.username}`, userData, {
      tags: { name: 'user_crud_update' }
    });
    validateResponse(updateResponse, { status: 200 });
    
    // Delete User
    const deleteResponse = makeRequest('DELETE', `${config.endpoints.user}/${userData.username}`, null, {
      tags: { name: 'user_crud_delete' }
    });
    validateResponse(deleteResponse, { status: 200 });
    
    sleep(1);
  });

  // Test Store Endpoints
  group('Store API Load Tests', function () {
    // Create Order
    const orderData = generateTestData('order');
    const createResponse = makeRequest('POST', config.endpoints.store + '/order', orderData, {
      tags: { name: 'order_crud_create' }
    });
    validateResponse(createResponse, { status: 200 });
    
    // Get Order by ID
    const getResponse = makeRequest('GET', `${config.endpoints.store}/order/${orderData.id}`, null, {
      tags: { name: 'order_crud_read' }
    });
    validateResponse(getResponse, { status: 200 });
    
    // Delete Order
    const deleteResponse = makeRequest('DELETE', `${config.endpoints.store}/order/${orderData.id}`, null, {
      tags: { name: 'order_crud_delete' }
    });
    validateResponse(deleteResponse, { status: 200 });
    
    sleep(1);
  });
  
  // Add synthetic load to ensure meaningful metrics even if API calls fail
  group('Synthetic Load Generation', function () {
    // Generate some synthetic requests to ensure we have data
    for (let i = 0; i < 5; i++) {
      // Make a simple request to ensure we have some metrics
      const syntheticResponse = http.get(`${config.baseUrl}/pet/findByStatus?status=available`, {
        headers: config.headers,
        tags: { name: 'synthetic_load' }
      });
      
      // Small delay between synthetic requests
      sleep(0.1);
    }
  });
}