// k6 Security Test - Basic security vulnerability testing
import { group, sleep } from 'k6';
import config, { makeRequest, validateResponse } from './config.js';

// Security test configuration
const securityTestConfig = {
  scenarios: {
    security_tests: {
      executor: 'per-vu-iterations',
      vus: 10,
      iterations: 5,
      maxDuration: '5m'
    }
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],      // Low failure rate for security tests
    http_req_duration: ['p(95)<2000'],
    checks: ['rate>0.98']               // High check pass rate
  }
};

export const options = securityTestConfig;

export default function () {
  group('Security Vulnerability Tests', function () {
    
    // Test 1: SQL Injection attempts
    group('SQL Injection Tests', function () {
      const sqlInjectionPayloads = [
        "' OR '1'='1",
        "' OR 1=1 --",
        "' UNION SELECT null, null, null --"
      ];
      
      sqlInjectionPayloads.forEach((payload, index) => {
        // Test in pet ID parameter
        const url = `${config.endpoints.pet}/${payload}`;
        const response = makeRequest('GET', url);
        
        // Should return 400 or 404, not 200 with data leak
        check(response, {
          [`SQLi attempt ${index + 1} handled correctly`]: (r) => 
            [400, 404, 403].includes(r.status) && r.timings.duration < 3000
        });
        
        sleep(0.1);
      });
    });

    // Test 2: XSS attempts
    group('XSS Protection Tests', function () {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")'
      ];
      
      xssPayloads.forEach((payload, index) => {
        // Test in user creation
        const userData = {
          id: Math.floor(Math.random() * 1000000),
          username: `xss_test_${index}`,
          firstName: payload,
          lastName: 'Test',
          email: 'test@example.com',
          password: 'testpass',
          phone: '1234567890',
          userStatus: 1
        };
        
        const response = makeRequest('POST', config.endpoints.user, userData);
        
        // Should either reject (400) or sanitize the input (200)
        check(response, {
          [`XSS attempt ${index + 1} handled`]: (r) => 
            [200, 400, 403].includes(r.status) && r.timings.duration < 3000
        });
        
        sleep(0.1);
      });
    });

    // Test 3: Authentication bypass attempts
    group('Authentication Tests', function () {
      // Test access to protected endpoints without auth
      const noAuthHeaders = { ...config.headers };
      delete noAuthHeaders['api_key'];
      
      const protectedResponse = makeRequest('GET', `${config.endpoints.user}/testuser`, null, {
        headers: noAuthHeaders
      });
      
      // Should be rejected or return 401/403
      check(protectedResponse, {
        'Unauthorized access blocked': (r) => 
          [401, 403, 400].includes(r.status)
      });
      
      sleep(0.5);
    });

    // Test 4: Rate limiting
    group('Rate Limiting Tests', function () {
      // Make multiple rapid requests to test rate limiting
      for (let i = 0; i < 10; i++) {
        const response = makeRequest('GET', `${config.endpoints.pet}/1`);
        check(response, {
          [`Request ${i + 1} completed`]: (r) => 
            [200, 429].includes(r.status) && r.timings.duration < 3000
        });
        sleep(0.05); // Very short delay
      }
    });

    // Test 5: Large payload handling
    group('Large Payload Tests', function () {
      const largePayload = {
        id: Math.floor(Math.random() * 1000000),
        name: 'A'.repeat(10000), // Very large string
        status: 'available'
      };
      
      const response = makeRequest('POST', config.endpoints.pet, largePayload);
      
      check(response, {
        'Large payload handled': (r) => 
          [200, 400, 413].includes(r.status) && r.timings.duration < 5000
      });
      
      sleep(0.5);
    });
  });
}