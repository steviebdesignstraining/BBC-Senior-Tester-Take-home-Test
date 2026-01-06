import http from 'k6/http';
import { check, sleep } from 'k6';
import { generateTestData, makeRequest, validateResponse } from './config.js';

// Test configuration
export let options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users over 30 seconds
    { duration: '1m', target: 10 },  // Stay at 10 users for 1 minute
    { duration: '30s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate should be below 10%
  },
};

export default function () {
  // Generate test data
  const petData = generateTestData('pet');

  // Test GET /pet/findByStatus
  let response = makeRequest('GET', '/pet/findByStatus?status=available');
  validateResponse(response, { status: 200 });

  // Test POST /pet (create pet)
  response = makeRequest('POST', '/pet', petData);
  validateResponse(response, { status: 200 });

  // If pet was created, get its ID
  let petId;
  if (response.status === 200 && response.body) {
    try {
      const body = JSON.parse(response.body);
      petId = body.id;
    } catch (e) {
      // Ignore parse error
    }
  }

  // Test GET /pet/{petId} if we have an ID
  if (petId) {
    response = makeRequest('GET', `/pet/${petId}`);
    validateResponse(response, { status: 200 });
  }

  // Wait between iterations
  sleep(1);
}