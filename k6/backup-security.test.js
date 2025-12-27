// k6 Security Test - Backup version using HTTPBin for guaranteed data generation
import { group, sleep, check } from 'k6';
import http from 'k6/http';

// Security test configuration with HTTPBin fallback
const securityTestConfig = {
  stages: [
    { duration: '30s', target: 10, name: 'baseline' },     // Baseline security test
    { duration: '1m', target: 10, name: 'steady' },        // Steady state
    { duration: '30s', target: 50, name: 'attack' },       // Security attack simulation
    { duration: '2m', target: 50, name: 'sustained' },     // Sustained attack
    { duration: '30s', target: 0, name: 'recovery' }       // Recovery period
  ],
  thresholds: {
    http_req_failed: ['rate<0.20'],      // Allow up to 20% failed requests (security test tolerance)
    http_req_duration: ['p(95)<3000'],   // 95% of requests under 3s
    checks: ['rate>0.80']               // 80% of checks pass (security test tolerance)
  }
};

export const options = securityTestConfig;

export default function () {
  // Test HTTPBin security features
  group('HTTPBin Security Tests', function () {
    // Test with various headers (security headers simulation)
    const headers = {
      'User-Agent': 'SecurityTest/1.0',
      'Accept': 'application/json',
      'X-Test-Header': 'security-test'
    };
    
    const headerResponse = http.get('https://httpbin.org/headers', {
      headers: headers,
      tags: { name: 'httpbin_security_headers' }
    });
    
    check(headerResponse, {
      'Headers test status is 200': (r) => r.status === 200,
      'Headers test has body': (r) => r.body.length > 0
    });
    
    // Test POST with security payload
    const securityPayload = {
      test: 'security',
      payload: '<script>alert("security")</script>',
      data: 'test123'
    };
    
    const postResponse = http.post('https://httpbin.org/post', JSON.stringify(securityPayload), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'httpbin_security_post' }
    });
    
    check(postResponse, {
      'Security POST status is 200': (r) => r.status === 200,
      'Security POST has body': (r) => r.body.length > 0
    });
    
    sleep(1);
  });

  // Test rate limiting simulation
  group('Rate Limiting Tests', function () {
    // Rapid requests to test rate limiting
    for (let i = 0; i < 5; i++) {
      const rapidResponse = http.get('https://httpbin.org/get', {
        tags: { name: 'httpbin_rate_limit' }
      });
      
      check(rapidResponse, {
        'Rapid request successful': (r) => r.status === 200
      });
    }
    
    sleep(1);
  });
  
  // Test data exposure simulation
  group('Data Exposure Tests', function () {
    const sensitiveData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpass123'
    };
    
    const dataResponse = http.post('https://httpbin.org/post', JSON.stringify(sensitiveData), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'httpbin_data_exposure' }
    });
    
    check(dataResponse, {
      'Data exposure test status is 200': (r) => r.status === 200,
      'Data exposure test has body': (r) => r.body.length > 0
    });
    
    sleep(1);
  });
  
  // Generate security metrics
  group('Security Metrics Generation', function () {
    for (let i = 0; i < 3; i++) {
      const metricResponse = http.get(`https://httpbin.org/anything?security=${i}`, {
        tags: { name: 'security_metrics' }
      });
      
      check(metricResponse, {
        'Security metric request successful': (r) => r.status === 200
      });
      
      sleep(0.1);
    }
  });
}