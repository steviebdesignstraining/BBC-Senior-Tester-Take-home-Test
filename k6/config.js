// k6 Performance Test Configuration
import http from 'k6/http';
import { check } from 'k6';

// Load environment variables
const BASE_URL = __ENV.BASE_URL || 'https://petstore.swagger.io/v2';
const AUTH_KEY = __ENV.AUTH_KEY || 'special-key';

// Test configuration
const config = {
  baseUrl: BASE_URL,
  authKey: AUTH_KEY,
  endpoints: {
    pet: '/pet',
    store: '/store',
    user: '/user'
  },
  headers: {
    'Content-Type': 'application/json',
    'api_key': AUTH_KEY,
    'Accept': 'application/json'
  },
  // Test data templates
  testData: {
    pet: {
      id: Math.floor(Math.random() * 1000000),
      name: 'PerformanceTestPet',
      status: 'available'
    },
    user: {
      id: Math.floor(Math.random() * 1000000),
      username: `testuser_${Math.floor(Math.random() * 10000)}`,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'testpass123',
      phone: '1234567890',
      userStatus: 1
    },
    order: {
      id: Math.floor(Math.random() * 1000000),
      petId: Math.floor(Math.random() * 1000),
      quantity: 1,
      shipDate: new Date().toISOString(),
      status: 'placed',
      complete: true
    }
  }
};

// Common functions
export function generateTestData(type) {
  const baseData = JSON.parse(JSON.stringify(config.testData[type]));
  baseData.id = Math.floor(Math.random() * 1000000);
  if (type === 'user') {
    baseData.username = `perftest_${baseData.id}_${Math.floor(Math.random() * 10000)}`;
    baseData.email = `test_${baseData.id}@example.com`;
  }
  return baseData;
}

export function makeRequest(method, endpoint, body = null, params = {}) {
  const url = `${config.baseUrl}${endpoint}`;
  const requestParams = {
    headers: config.headers,
    ...params
  };
  
  if (body) {
    requestParams.body = JSON.stringify(body);
  }
  
  let response;
  
  switch (method.toLowerCase()) {
    case 'get':
      response = http.get(url, requestParams);
      break;
    case 'post':
      response = http.post(url, JSON.stringify(body), requestParams);
      break;
    case 'put':
      response = http.put(url, JSON.stringify(body), requestParams);
      break;
    case 'delete':
      response = http.del(url, null, requestParams);
      break;
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }
  
  return response;
}

export function validateResponse(response, expectations = {}) {
  const defaults = {
    status: 200,
    maxResponseTime: 2000
  };
  
  const combined = { ...defaults, ...expectations };
  
  const checks = {
    'status is correct': () => response.status === combined.status,
    'response time acceptable': () => response.timings.duration < combined.maxResponseTime,
    'response has body': () => response.body && response.body.length > 0
  };
  
  if (combined.contentType) {
    checks['content type correct'] = () => 
      response.headers['Content-Type'] && 
      response.headers['Content-Type'].includes(combined.contentType);
  }
  
  return check(response, checks);
}

export default config;