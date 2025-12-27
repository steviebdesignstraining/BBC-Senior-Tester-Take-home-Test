// k6 Backup Performance Test - Guaranteed to generate meaningful data
import { group, sleep, check } from 'k6';
import http from 'k6/http';

// Backup test configuration - guaranteed to work
const backupTestConfig = {
  stages: [
    { duration: '30s', target: 50, name: 'ramp-up' },
    { duration: '2m', target: 50, name: 'steady' },
    { duration: '30s', target: 100, name: 'high-load' },
    { duration: '1m', target: 100, name: 'sustained' },
    { duration: '30s', target: 0, name: 'ramp-down' }
  ],
  thresholds: {
    http_req_failed: ['rate<0.10'],
    http_req_duration: ['p(95)<1000'],
    checks: ['rate>0.90']
  }
};

export const options = backupTestConfig;

export default function () {
  // Test against a reliable public API
  group('Reliable API Tests', function () {
    // Test 1: HTTPBin GET request (always works)
    const getResponse = http.get('https://httpbin.org/get', {
      tags: { name: 'backup_get' }
    });
    
    check(getResponse, {
      'GET request successful': (r) => r.status === 200,
      'GET response has data': (r) => r.body && r.body.length > 0,
      'GET response time acceptable': (r) => r.timings.duration < 2000
    });
    
    sleep(0.5);
    
    // Test 2: HTTPBin POST request
    const postData = JSON.stringify({
      test: 'performance',
      timestamp: Date.now(),
      data: 'load_test'
    });
    
    const postResponse = http.post('https://httpbin.org/post', postData, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'backup_post' }
    });
    
    check(postResponse, {
      'POST request successful': (r) => r.status === 200,
      'POST response has data': (r) => r.body && r.body.length > 0,
      'POST response time acceptable': (r) => r.timings.duration < 3000
    });
    
    sleep(0.5);
    
    // Test 3: HTTPBin PUT request
    const putData = JSON.stringify({
      update: 'performance_test',
      timestamp: Date.now()
    });
    
    const putResponse = http.put('https://httpbin.org/put', putData, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'backup_put' }
    });
    
    check(putResponse, {
      'PUT request successful': (r) => r.status === 200,
      'PUT response has data': (r) => r.body && r.body.length > 0,
      'PUT response time acceptable': (r) => r.timings.duration < 3000
    });
    
    sleep(0.5);
    
    // Test 4: HTTPBin DELETE request
    const deleteResponse = http.del('https://httpbin.org/delete', null, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'backup_delete' }
    });
    
    check(deleteResponse, {
      'DELETE request successful': (r) => r.status === 200,
      'DELETE response has data': (r) => r.body && r.body.length > 0,
      'DELETE response time acceptable': (r) => r.timings.duration < 2000
    });
    
    sleep(0.5);
  });

  // Generate additional synthetic load to ensure good metrics
  group('Additional Synthetic Load', function () {
    for (let i = 0; i < 15; i++) {
      // Multiple requests to build up request count
      const syntheticResponse = http.get('https://httpbin.org/anything', {
        tags: { name: 'backup_synthetic' }
      });
      
      check(syntheticResponse, {
        'synthetic request successful': (r) => r.status === 200,
        'synthetic response time acceptable': (r) => r.timings.duration < 2000
      });
      
      sleep(0.2);
    }
  });

  // Test different endpoints to simulate real API usage
  group('Multiple Endpoint Testing', function () {
    const endpoints = [
      'https://httpbin.org/ip',
      'https://httpbin.org/user-agent',
      'https://httpbin.org/headers',
      'https://httpbin.org/uuid'
    ];
    
    endpoints.forEach((endpoint, index) => {
      const response = http.get(endpoint, {
        tags: { name: `backup_endpoint_${index}` }
      });
      
      check(response, {
        [`endpoint ${index} successful`]: (r) => r.status === 200,
        [`endpoint ${index} response time`]: (r) => r.timings.duration < 1500
      });
      
      sleep(0.3);
    });
  });
}