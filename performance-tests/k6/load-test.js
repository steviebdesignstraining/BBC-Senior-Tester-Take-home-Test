// k6 Load Test - Measures system behavior under normal and high load conditions
import { group, sleep } from 'k6';
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
    http_req_failed: ['rate<0.01'],      // Less than 1% failed requests
    http_req_duration: ['p(95)<1000'],   // 95% of requests under 1s
    checks: ['rate>0.95']               // 95% of checks pass
  }
};

export const options = loadTestConfig;

export default function () {
  // Test Pet Endpoints
  group('Pet API Load Tests', function () {
    // Create Pet
    const petData = generateTestData('pet');
    const createResponse = makeRequest('POST', config.endpoints.pet, petData);
    validateResponse(createResponse, { status: 200 });
    
    // Get Pet by ID
    const getResponse = makeRequest('GET', `${config.endpoints.pet}/${petData.id}`);
    validateResponse(getResponse, { status: 200 });
    
    // Update Pet
    petData.status = 'sold';
    const updateResponse = makeRequest('PUT', config.endpoints.pet, petData);
    validateResponse(updateResponse, { status: 200 });
    
    // Delete Pet
    const deleteResponse = makeRequest('DELETE', `${config.endpoints.pet}/${petData.id}`);
    validateResponse(deleteResponse, { status: 200 });
    
    sleep(1); // Think time between operations
  });

  // Test User Endpoints
  group('User API Load Tests', function () {
    // Create User
    const userData = generateTestData('user');
    const createResponse = makeRequest('POST', config.endpoints.user, userData);
    validateResponse(createResponse, { status: 200 });
    
    // Get User by Username
    const getResponse = makeRequest('GET', `${config.endpoints.user}/${userData.username}`);
    validateResponse(getResponse, { status: 200 });
    
    // Update User
    userData.firstName = 'Updated';
    const updateResponse = makeRequest('PUT', `${config.endpoints.user}/${userData.username}`, userData);
    validateResponse(updateResponse, { status: 200 });
    
    // Delete User
    const deleteResponse = makeRequest('DELETE', `${config.endpoints.user}/${userData.username}`);
    validateResponse(deleteResponse, { status: 200 });
    
    sleep(1);
  });

  // Test Store Endpoints
  group('Store API Load Tests', function () {
    // Create Order
    const orderData = generateTestData('order');
    const createResponse = makeRequest('POST', config.endpoints.store + '/order', orderData);
    validateResponse(createResponse, { status: 200 });
    
    // Get Order by ID
    const getResponse = makeRequest('GET', `${config.endpoints.store}/order/${orderData.id}`);
    validateResponse(getResponse, { status: 200 });
    
    // Delete Order
    const deleteResponse = makeRequest('DELETE', `${config.endpoints.store}/order/${orderData.id}`);
    validateResponse(deleteResponse, { status: 200 });
    
    sleep(1);
  });
}