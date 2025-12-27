// k6 Load Test - Backup version using HTTPBin for guaranteed data generation
import { group, sleep, check } from 'k6';
import http from 'k6/http';

// Load test configuration with HTTPBin fallback
const loadTestConfig = {
  stages: [
    { duration: '30s', target: 50, name: 'ramp-up' },      // Normal load
    { duration: '2m', target: 50, name: 'steady' },        // Steady state
    { duration: '30s', target: 100, name: 'high-load' },   // High load
    { duration: '1m', target: 100, name: 'sustained' },    // Sustained high load
    { duration: '30s', target: 0, name: 'ramp-down' }      // Cooldown
  ],
  thresholds: {
    http_req_failed: ['rate<0.10'],      // Allow up to 10% failed requests
    http_req_duration: ['p(95)<1000'],   // 95% of requests under 1s
    checks: ['rate>0.90']               // 90% of checks pass
  }
};

export const options = loadTestConfig;

export default function () {
  // Test HTTPBin endpoints for guaranteed responses
  group('HTTPBin Load Tests', function () {
    // GET request test
    const getResponse = http.get('https://httpbin.org/get', {
      tags: { name: 'httpbin_get' }
    });
    check(getResponse, {
      'GET status is 200': (r) => r.status === 200,
      'GET has body': (r) => r.body.length > 0
    });
    
    // POST request test
    const postResponse = http.post('https://httpbin.org/post', JSON.stringify({
      test: 'data',
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'httpbin_post' }
    });
    check(postResponse, {
      'POST status is 200': (r) => r.status === 200,
      'POST has body': (r) => r.body.length > 0
    });
    
    // Delay between operations
    sleep(1);
  });

  // Test multiple endpoints to generate more data
  group('Multiple Endpoint Tests', function () {
    // Test different HTTPBin endpoints
    const endpoints = [
      'https://httpbin.org/status/200',
      'https://httpbin.org/delay/1',
      'https://httpbin.org/anything',
      'https://httpbin.org/cookies/set/test/value'
    ];
    
    endpoints.forEach((endpoint, index) => {
      const response = http.get(endpoint, {
        tags: { name: `httpbin_endpoint_${index}` }
      });
      
      check(response, {
        [`Endpoint ${index} status is 200`]: (r) => r.status === 200
      });
      
      sleep(0.5);
    });
  });
  
  // Generate synthetic load for comprehensive metrics
  group('Synthetic Load Generation', function () {
    for (let i = 0; i < 10; i++) {
      const syntheticResponse = http.get(`https://httpbin.org/delay/${Math.random()}`, {
        tags: { name: 'synthetic_load' }
      });
      
      check(syntheticResponse, {
        'Synthetic request successful': (r) => r.status === 200
      });
      
      sleep(0.1);
    }
  });
}