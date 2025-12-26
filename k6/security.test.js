// k6 Security Test - Measures system security under various attack scenarios
import { group, sleep, check } from 'k6';
import config, { makeRequest, validateResponse, generateTestData } from './config.js';

// Security test configuration
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
  // Test Authentication and Authorization
  group('Security Tests - Auth', function () {
    // Test with valid credentials
    const userData = generateTestData('user');
    const createResponse = makeRequest('POST', config.endpoints.user, userData, {
      tags: { name: 'security_auth_valid' }
    });
    validateResponse(createResponse, { status: 200 });
    
    // Test with invalid credentials (should fail)
    const invalidResponse = makeRequest('GET', `${config.endpoints.user}/${userData.username}`, null, {
      headers: { 'api_key': 'invalid-key' },
      tags: { name: 'security_auth_invalid' }
    });
    check(invalidResponse, {
      'invalid auth fails': (r) => r.status === 401 || r.status === 403
    });
    
    sleep(1);
  });

  // Test Input Validation
  group('Security Tests - Input Validation', function () {
    // Test SQL Injection attempts
    const sqlInjectionPayload = {
      id: 1,
      name: "'; DROP TABLE users; --",
      status: 'available'
    };
    
    const sqlResponse = makeRequest('POST', config.endpoints.pet, sqlInjectionPayload, {
      tags: { name: 'security_sql_injection' }
    });
    check(sqlResponse, {
      'SQL injection blocked': (r) => r.status !== 200 || r.body.includes('error')
    });
    
    // Test XSS attempts
    const xssPayload = {
      id: 1,
      name: '<script>alert("xss")</script>',
      status: 'available'
    };
    
    const xssResponse = makeRequest('POST', config.endpoints.pet, xssPayload, {
      tags: { name: 'security_xss' }
    });
    check(xssResponse, {
      'XSS blocked': (r) => r.status !== 200 || !r.body.includes('<script>')
    });
    
    sleep(1);
  });

  // Test Rate Limiting
  group('Security Tests - Rate Limiting', function () {
    // Rapid requests to test rate limiting
    for (let i = 0; i < 5; i++) {
      const rapidResponse = makeRequest('GET', `${config.endpoints.pet}/1`, null, {
        tags: { name: 'security_rate_limit' }
      });
      validateResponse(rapidResponse, { status: 200 });
    }
    
    sleep(1);
  });

  // Test Data Exposure
  group('Security Tests - Data Exposure', function () {
    // Test that sensitive data is not exposed
    const userData = generateTestData('user');
    const createResponse = makeRequest('POST', config.endpoints.user, userData, {
      tags: { name: 'security_data_exposure' }
    });
    
    check(createResponse, {
      'no sensitive data exposed': (r) => !r.body.includes('password') && !r.body.includes('api_key')
    });
    
    sleep(1);
  });
}